import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Aid, MatchResult, UserProfile } from './types';

const apiKey = process.env.GEMINI_API_KEY;

export const hasGeminiKey = Boolean(apiKey);

const SYSTEM_PROMPT = `You are an aid eligibility assistant for Malaysia. Given a user profile and a list of aid programs, return a JSON object with:
- matched: array of aids the user qualifies for, each with { id, reason, confidence }
- nearMiss: array of aids they almost qualify for, each with { id, gap, suggestion }
- nextSteps: array of 2-3 actionable suggestions in the user's language

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`;

export async function matchAids(profile: UserProfile, aids: Aid[]): Promise<MatchResult> {
  if (!apiKey) {
    return fallbackMatch(profile, aids);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  });

  const prompt = `${SYSTEM_PROMPT}

User profile: ${JSON.stringify(profile)}
Available aids: ${JSON.stringify(aids)}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as MatchResult;
    return normalizeResult(parsed);
  } catch (err) {
    console.error('[gemini] match failed, using fallback', err);
    return fallbackMatch(profile, aids);
  }
}

export function buildAidaSystemPrompt(profile: UserProfile, matchedAids: Aid[]): string {
  return `You are AIDa, a warm and helpful Malaysian government aid assistant. You speak like a friendly case worker, not a robot.

User profile: ${JSON.stringify(profile)}
Their matched aids: ${JSON.stringify(matchedAids)}

Rules:
- Default to Bahasa Malaysia unless the user writes in another language
- Keep responses SHORT — 2-4 sentences max
- Use simple words — imagine explaining to someone's grandmother
- If asked about an aid they qualify for, give the application link and next step
- If asked something you don't know, say "Saya akan semak untuk awak" (I'll check for you)
- Never use jargon or bureaucratic language
- Be warm and encouraging — many users feel shame asking for help`;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatWithAida(
  systemPrompt: string,
  messages: ChatTurn[]
): Promise<string> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: systemPrompt,
    // 2.5+ Flash counts hidden reasoning tokens against this budget, so a
    // small ceiling can truncate the visible reply mid-sentence.
    generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
  });

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const result = await model.generateContent({ contents });
  const candidate = result.response.candidates?.[0];
  const finish = candidate?.finishReason;
  const text = result.response.text().trim();
  if (finish && finish !== 'STOP') {
    console.warn(`[gemini] chat finishReason=${finish} length=${text.length}`);
  }
  return text;
}

function normalizeResult(r: Partial<MatchResult>): MatchResult {
  return {
    matched: Array.isArray(r.matched) ? r.matched : [],
    nearMiss: Array.isArray(r.nearMiss) ? r.nearMiss : [],
    nextSteps: Array.isArray(r.nextSteps) ? r.nextSteps : [],
  };
}

// Deterministic fallback so the demo never lands on an empty screen if Gemini
// is unreachable or unkeyed. Mirrors the criteria fields used in aids.json.
function fallbackMatch(profile: UserProfile, aids: Aid[]): MatchResult {
  const matched: MatchResult['matched'] = [];
  const nearMiss: MatchResult['nearMiss'] = [];

  for (const aid of aids) {
    const c = aid.criteria as Record<string, unknown>;
    const reasons: string[] = [];
    const gaps: string[] = [];

    if (typeof c.maxIncome === 'number') {
      if (profile.monthlyIncome <= c.maxIncome) {
        reasons.push(`Pendapatan RM${profile.monthlyIncome} bawah had RM${c.maxIncome}`);
      } else {
        gaps.push(`Pendapatan melebihi had RM${c.maxIncome}`);
      }
    }
    if (typeof c.minHouseholdSize === 'number' && profile.householdSize < c.minHouseholdSize) {
      gaps.push(`Saiz isi rumah kurang dari ${c.minHouseholdSize}`);
    }
    if (typeof c.state === 'string' && profile.state.toLowerCase() !== c.state.toLowerCase()) {
      gaps.push(`Bantuan ini hanya untuk negeri ${c.state}`);
    }
    if (c.hasOKUCard === true && !profile.hasOKUCard) {
      gaps.push('Memerlukan kad OKU');
    }
    if (typeof c.religion === 'string' && profile.religion !== c.religion) {
      gaps.push(`Hanya untuk penganut ${c.religion}`);
    }
    if (c.citizenship === 'malaysian' && profile.citizenship && profile.citizenship !== 'malaysian') {
      gaps.push('Hanya untuk warganegara Malaysia');
    }

    if (gaps.length === 0 && reasons.length > 0) {
      matched.push({
        id: aid.id,
        reason: reasons.join('; '),
        confidence: 0.9,
      });
    } else if (gaps.length === 1) {
      nearMiss.push({
        id: aid.id,
        gap: gaps[0],
        suggestion: 'Sahkan kelayakan di laman rasmi',
      });
    }
  }

  return {
    matched,
    nearMiss,
    nextSteps: [
      'Sediakan salinan MyKad anda',
      'Mohon bantuan tertinggi terlebih dahulu',
      'Tanya AIDa jika anda perlu bantuan langkah demi langkah',
    ],
  };
}
