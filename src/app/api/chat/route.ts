import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildAidaSystemPrompt, chatWithAida, hasGeminiKey } from '@/lib/gemini';
import type { Aid, UserProfile } from '@/lib/types';

export const runtime = 'nodejs';

const Body = z.object({
  profile: z
    .object({
      name: z.string(),
      language: z.enum(['ms', 'en', 'zh', 'ta']),
      age: z.number(),
      state: z.string(),
      householdSize: z.number(),
      monthlyIncome: z.number(),
      citizenship: z.string().optional(),
      hasOKUCard: z.boolean().optional(),
      religion: z.string().optional(),
    })
    .nullable(),
  matchedAids: z.array(z.any()).default([]),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { profile, matchedAids, messages } = parsed.data;

  if (!hasGeminiKey) {
    console.warn('[chat] GEMINI_API_KEY not set — returning offline reply');
    return NextResponse.json({
      reply: offlineReply(profile),
    });
  }

  const system = buildAidaSystemPrompt(
    (profile ?? {
      name: 'Pengguna',
      language: 'ms',
      age: 0,
      state: '',
      householdSize: 1,
      monthlyIncome: 0,
    }) as UserProfile,
    matchedAids as Aid[]
  );

  try {
    const reply = await chatWithAida(system, messages);
    return NextResponse.json({ reply: reply || 'Saya akan semak untuk awak.' });
  } catch (err) {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('[chat] gemini call failed —', detail);
    return NextResponse.json({
      reply: offlineReply(profile),
      _debug: process.env.NODE_ENV === 'development' ? detail : undefined,
    });
  }
}

const FALLBACK_REPLY: Record<UserProfile['language'], string> = {
  ms: 'Maaf, saya tersengkang sekejap. Sila cuba lagi dalam beberapa saat.',
  en: "Sorry, I'm a little slow right now. Please try again in a few seconds.",
  zh: '抱歉，我现在有点慢。请稍等几秒后再试。',
  ta: 'மன்னிக்கவும், சில விநாடிகளில் மீண்டும் முயற்சிக்கவும்.',
};

function offlineReply(profile: UserProfile | null): string {
  const lang = profile?.language ?? 'ms';
  return FALLBACK_REPLY[lang] ?? FALLBACK_REPLY.ms;
}
