import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  Aid,
  Language,
  MatchResult,
  MatchedAid,
  MatchStatus,
  NearMissAid,
  UserProfile,
} from './types';

const apiKey = process.env.GEMINI_API_KEY;

export const hasGeminiKey = Boolean(apiKey);

interface GapTemplate {
  gap_ms: string;
  gap_en: string;
  fix_url: string;
  fix_label_ms: string;
  fix_label_en: string;
  estimated_days: number;
}

// From BA1 docx §B2 — gap-message templates keyed on required_registrations name.
const GAP_TEMPLATES: Record<string, GapTemplate> = {
  ekasih: {
    gap_ms: 'Anda perlu daftar dalam eKasih dahulu. Proses ini mengambil masa 2–4 minggu.',
    gap_en: 'You need to register in the eKasih poverty database first. This takes 2–4 weeks.',
    fix_url: 'https://ekasih.gov.my',
    fix_label_ms: 'Daftar eKasih',
    fix_label_en: 'Register on eKasih',
    estimated_days: 14,
  },
  str_recipient: {
    gap_ms: 'Bantuan ini memerlukan anda menjadi penerima STR. Daftar STR pada Oktober–November.',
    gap_en: 'This aid requires you to be an active STR recipient. Register STR in October–November.',
    fix_url: 'https://bantuantunai.hasil.gov.my',
    fix_label_ms: 'Daftar STR',
    fix_label_en: 'Register for STR',
    estimated_days: 90,
  },
  asnaf_registered_lzs: {
    gap_ms: 'Anda perlu mendaftar sebagai asnaf LZS dahulu. Layari zakatselangor.com.my.',
    gap_en: 'You need to register as an LZS asnaf first. Visit zakatselangor.com.my.',
    fix_url: 'https://www.zakatselangor.com.my',
    fix_label_ms: 'Daftar Asnaf LZS',
    fix_label_en: 'Register as LZS asnaf',
    estimated_days: 30,
  },
  asnaf_registered_maiwp: {
    gap_ms: 'Daftar sebagai asnaf MAIWP di emaiwp.maiwp.gov.my atau pejabat Baitulmal.',
    gap_en: 'Register as MAIWP asnaf at emaiwp.maiwp.gov.my or the Baitulmal office.',
    fix_url: 'https://emaiwp.maiwp.gov.my',
    fix_label_ms: 'Daftar Asnaf MAIWP',
    fix_label_en: 'Register as MAIWP asnaf',
    estimated_days: 21,
  },
  asnaf_registered_tbs: {
    gap_ms: 'Daftar sebagai asnaf TBS di tbs.org.my atau pejabat TBS Sarawak.',
    gap_en: 'Register as TBS asnaf at tbs.org.my or a TBS Sarawak office.',
    fix_url: 'https://www.tbs.org.my',
    fix_label_ms: 'Daftar Asnaf TBS',
    fix_label_en: 'Register as TBS asnaf',
    estimated_days: 30,
  },
};

const SYSTEM_PROMPT = `You are an aid eligibility matching engine for Malaysia's social safety net.

For each aid, decide one of:
- "eligible" — user satisfies every criterion; can apply now
- "auto" — user qualifies AND aid.is_auto_credited is true; no application needed, surface as "instant value"
- "partial" — user qualifies on demographics but is missing an item from eligibility_criteria.required_registrations
- "near_miss" — fails ONE hard criterion (income too high, wrong state, wrong religion, age out of range)
- "skip" — aid.is_prerequisite_only is true (eKasih, etc.) — never surface directly to the user

Output JSON ONLY, with this shape:
{
  "matched": [
    {
      "id": string,
      "status": "eligible" | "auto" | "partial",
      "reason": string,
      "confidence": number,
      "gap": string | undefined,        // only for status="partial"
      "fix_url": string | undefined,
      "estimated_days": number | undefined
    }
  ],
  "nearMiss": [
    { "id": string, "gap": string, "suggestion": string, "fix_url"?: string, "estimated_days"?: number }
  ],
  "nextSteps": string[]   // 2–3 short bullets in the user's language
}

Rules:
- "reason" / "gap" / "suggestion" / "nextSteps" must be in the user's language (profile.language: ms=Malay, en=English, zh=Mandarin, ta=Tamil).
- For "partial" matches, copy gap + fix_url + estimated_days from these templates keyed on required_registrations entry. Use the gap_ms variant when language=ms, otherwise gap_en:
${JSON.stringify(GAP_TEMPLATES)}
- Sort matched: status="auto" first (instant value), then "eligible" (recurring beats one-off), then "partial".
- Skip aids where is_prerequisite_only is true. Their gap surfaces only inside OTHER aids' partial status.
- If profile is missing a field, assume the most permissive value EXCEPT these strict gates: religion_required, is_state_specific, employment_history, education_status, and gender. Treat a missing strict-gate field as failing → near_miss, never as eligible.
- Confidence: 0.95 clear match, 0.7 inferred, 0.5 guess.

Respond ONLY with valid JSON. No markdown, no commentary.`;

// Trimmed aid shape sent to Gemini — drops UI-only fields (multilingual
// names, amounts, required_documents, application steps, source URLs) so the
// prompt shrinks ~4×. Matching only needs the eligibility signals; the
// dashboard re-hydrates from the full aids.json by id.
function slimAidForMatching(aid: Aid) {
  return {
    id: aid.id,
    category: aid.category,
    is_recurring: aid.is_recurring,
    is_auto_credited: aid.is_auto_credited ?? false,
    is_religion_specific: aid.is_religion_specific,
    religion_required: aid.religion_required,
    is_state_specific: aid.is_state_specific,
    state_covers: aid.state_covers,
    is_prerequisite_only: aid.is_prerequisite_only ?? false,
    eligibility_criteria: aid.eligibility_criteria,
    window_type: aid.application_window.type,
  };
}

export async function matchAids(profile: UserProfile, aids: Aid[]): Promise<MatchResult> {
  if (!apiKey) {
    return fallbackMatch(profile, aids);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  });

  const slim = aids.map(slimAidForMatching);
  const prompt = `${SYSTEM_PROMPT}

User profile: ${JSON.stringify(profile)}
Available aids: ${JSON.stringify(slim)}`;

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

// Income bands in the new schema are free-text strings ("≤RM2500/month
// household", "Below had kifayah (… RM2,000/month for household of 4)").
// Pull the first RM number; fall back to 2000 for had-kifayah strings without
// an explicit threshold so zakat aids still gate sensibly.
function parseIncomeCap(band: string | null | undefined): number | null {
  if (!band) return null;
  const m = band.match(/RM\s*([\d,]+)/i);
  if (m) return Number(m[1].replace(/,/g, ''));
  if (/kifayah/i.test(band)) return 2000;
  return null;
}

function tStateOnly(label: string, lang: Language): string {
  return lang === 'ms' ? `Bantuan ini hanya untuk ${label}` : `Only for ${label} residents`;
}

const STATUS_ORDER: Record<MatchStatus, number> = { auto: 0, eligible: 1, partial: 2 };

// Deterministic fallback so the demo never lands on an empty screen if Gemini
// is unreachable or unkeyed. Mirrors the new aid catalog schema.
function fallbackMatch(profile: UserProfile, aids: Aid[]): MatchResult {
  const matched: MatchedAid[] = [];
  const nearMiss: NearMissAid[] = [];
  const lang: Language = profile.language ?? 'ms';
  const isMs = lang === 'ms';
  const profState = profile.state?.toLowerCase() ?? '';
  const profReligion = profile.religion?.toLowerCase();

  for (const aid of aids) {
    if (aid.is_prerequisite_only) continue;

    const c = aid.eligibility_criteria;
    const reasons: string[] = [];
    const hardGaps: string[] = [];

    // Citizenship — only fail if user explicitly non-Malaysian.
    if (
      c.citizenship === 'malaysian' &&
      profile.citizenship &&
      profile.citizenship !== 'malaysian'
    ) {
      hardGaps.push(isMs ? 'Hanya untuk warganegara Malaysia' : 'Malaysian citizens only');
    }

    // Age range
    if (typeof c.min_age === 'number' && profile.age < c.min_age) {
      hardGaps.push(isMs ? `Umur minimum ${c.min_age} tahun` : `Minimum age ${c.min_age}`);
    }
    if (typeof c.max_age === 'number' && profile.age > c.max_age) {
      hardGaps.push(isMs ? `Umur maksimum ${c.max_age} tahun` : `Maximum age ${c.max_age}`);
    }

    // Religion gate (strict — religion-specific aids require an explicit match)
    if (aid.is_religion_specific && aid.religion_required) {
      const wanted = aid.religion_required.toLowerCase();
      if (!profReligion || profReligion !== wanted) {
        hardGaps.push(
          isMs
            ? `Hanya untuk penganut ${aid.religion_required}`
            : `For ${aid.religion_required} only`
        );
      } else {
        reasons.push(isMs ? `Anda penganut ${aid.religion_required}` : `You are ${aid.religion_required}`);
      }
    }

    // State gate
    if (aid.is_state_specific) {
      const stateMatch =
        aid.is_state_specific.toLowerCase() === profState ||
        aid.state_covers?.some((s) => s.toLowerCase() === profState);
      if (!stateMatch) {
        hardGaps.push(tStateOnly(aid.is_state_specific, lang));
      } else {
        reasons.push(
          isMs ? `Anda dari ${aid.is_state_specific}` : `You are in ${aid.is_state_specific}`
        );
      }
    }

    // Employment history (BPEN — civil servant retiree). UserProfile doesn't
    // carry this yet (step 4), so for now treat ANY required employment_history
    // as a hard gate the user can't claim by default. Better to under-match
    // than to falsely promise a pesara aid to a self-employed user.
    if (c.employment_history) {
      hardGaps.push(
        isMs
          ? `Hanya untuk ${c.employment_history.replace(/_/g, ' ')}`
          : `Only for ${c.employment_history.replace(/_/g, ' ')}`
      );
    }

    // Education status (LZS Pendidikan etc.). Same logic — strict by default
    // until onboarding asks for enrolment status.
    if (c.education_status === 'enrolled') {
      hardGaps.push(
        isMs ? 'Hanya untuk pelajar yang sedang belajar' : 'For currently enrolled students only'
      );
    }

    // Gender gate (BIB — female). If profile doesn't carry gender, default
    // to fail the gate (better to under-match than wrongly recommend a
    // maternal aid to a man).
    if (c.gender) {
      if (!profile.gender || profile.gender !== c.gender) {
        hardGaps.push(
          isMs
            ? `Hanya untuk ${c.gender === 'female' ? 'wanita' : 'lelaki'}`
            : `Only for ${c.gender === 'female' ? 'women' : 'men'}`
        );
      } else {
        reasons.push(
          isMs
            ? `Anda ${c.gender === 'female' ? 'wanita' : 'lelaki'}`
            : `You are ${c.gender === 'female' ? 'a woman' : 'a man'}`
        );
      }
    }

    // Income band
    const incomeCap = parseIncomeCap(c.income_band);
    if (incomeCap !== null) {
      if (profile.monthlyIncome <= incomeCap) {
        reasons.push(
          isMs
            ? `Pendapatan RM${profile.monthlyIncome} di bawah had RM${incomeCap}`
            : `Income RM${profile.monthlyIncome} is below the RM${incomeCap} cap`
        );
      } else {
        hardGaps.push(
          isMs
            ? `Pendapatan melebihi had RM${incomeCap}`
            : `Income exceeds the RM${incomeCap} cap`
        );
      }
    }

    if (hardGaps.length > 0) {
      nearMiss.push({
        id: aid.id,
        gap: hardGaps[0],
        suggestion: isMs
          ? 'Sahkan kelayakan di laman rasmi'
          : 'Verify eligibility on the official site',
      });
      continue;
    }

    // Required registrations → status="partial" with gap fix from templates.
    // UserProfile doesn't yet carry registration flags (step 4), so any
    // listed required_registrations means "treat as partial" for now.
    const missingRegs = c.required_registrations ?? [];
    if (missingRegs.length > 0) {
      const firstReg = missingRegs[0];
      const tpl = GAP_TEMPLATES[firstReg];
      const gap = tpl
        ? isMs
          ? tpl.gap_ms
          : tpl.gap_en
        : isMs
        ? `Memerlukan pendaftaran: ${firstReg}`
        : `Requires registration: ${firstReg}`;
      matched.push({
        id: aid.id,
        status: 'partial',
        reason: reasons.join('; ') || (isMs ? 'Profil anda padan, tetapi…' : 'Profile matches, but…'),
        confidence: 0.7,
        gap,
        fix_url: tpl?.fix_url,
        estimated_days: tpl?.estimated_days,
      });
      continue;
    }

    matched.push({
      id: aid.id,
      status: aid.is_auto_credited ? 'auto' : 'eligible',
      reason: reasons.join('; ') || (isMs ? 'Profil anda padan' : 'Your profile matches'),
      confidence: 0.9,
    });
  }

  matched.sort(
    (a, b) =>
      (STATUS_ORDER[a.status ?? 'eligible'] ?? 99) -
      (STATUS_ORDER[b.status ?? 'eligible'] ?? 99)
  );

  return {
    matched,
    nearMiss,
    nextSteps: isMs
      ? [
          'Sediakan salinan MyKad anda',
          'Mulakan dengan bantuan auto — paling pantas',
          'Tanya AIDa jika anda perlu bantuan langkah demi langkah',
        ]
      : [
          'Have your MyKad ready',
          'Start with the auto-disbursed aids — fastest payoff',
          'Ask AIDa if you need step-by-step help',
        ],
  };
}
