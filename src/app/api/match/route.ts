import { NextResponse } from 'next/server';
import { z } from 'zod';
import aidsData from '@/data/aids.json';
import { matchAids } from '@/lib/gemini';
import type { Aid } from '@/lib/types';

export const runtime = 'nodejs';

const ProfileSchema = z.object({
  name: z.string().min(1),
  language: z.enum(['ms', 'en', 'zh', 'ta']),
  age: z.number().int().min(1).max(120),
  state: z.string().min(1),
  householdSize: z.number().int().min(1).max(30),
  monthlyIncome: z.number().int().min(0),
  citizenship: z.string().optional(),
  hasOKUCard: z.boolean().optional(),
  religion: z.string().optional(),
});

const Body = z.object({ profile: ProfileSchema });

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
      { error: 'Invalid profile', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const result = await matchAids(parsed.data.profile, aidsData as Aid[]);
  return NextResponse.json(result);
}
