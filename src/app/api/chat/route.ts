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
  const lastUser = messages[messages.length - 1].content;

  if (!hasGeminiKey) {
    console.warn('[chat] GEMINI_API_KEY not set — returning offline reply');
    return NextResponse.json({
      reply: offlineReply(profile, lastUser, 'no-key'),
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
      reply: offlineReply(profile, lastUser, 'api-error'),
      _debug: process.env.NODE_ENV === 'development' ? detail : undefined,
    });
  }
}

function offlineReply(
  profile: UserProfile | null,
  lastUser: string,
  cause: 'no-key' | 'api-error'
): string {
  const lang = profile?.language ?? 'ms';
  const tag = cause === 'no-key' ? '[no API key]' : '[API error]';
  if (lang === 'en') {
    return `${tag} I'm AIDa. I heard you ask: "${lastUser}". I can't reach my AI brain right now — check the dev server console.`;
  }
  return `${tag} Saya AIDa. Soalan anda: "${lastUser}". Otak AI saya sedang tiada talian — semak konsol pelayan dev.`;
}
