# CLAUDE.md — AIDa Project Source of Truth

## What is AIDa?
AIDa (Aid Intelligence & Discovery Assistant) is a PWA (Progressive Web App) that helps low-income Malaysians discover, match, and apply for government aids, zakat, and financial assistance programs they are eligible for but unaware of.

**Hackathon context:** This is a working prototype demo. Prioritize visible, impressive features over completeness. Every decision should serve the demo narrative.

**Demo narrative:** Mak Cik Aminah, 58, widowed informal childminder from Klang, Selangor. RM1,800/month income, lives with her unemployed adult son and teenage daughter. She opens AIDa, answers a few questions in Malay, and discovers she qualifies for 9 programs worth thousands of ringgit a year — including STR, SARA, MySalam takaful, Bantuan Bingkas Selangor, and LZS zakat asnaf aid. AIDa shows her one missing step (eKasih registration) that unlocks several JKM aids on top of that. She chats with AIDa in Malay and gets clear, kind answers. That is the story we are telling.

(Persona swapped from the original Ahmad/Kelantan placeholder to Aminah/Selangor on 2026-04-25 — Aminah is the BA's primary demo persona and exercises far more of the catalog: female unlocks BIB, Muslim+Selangor unlocks 4 zakat aids, single-parent with school-age child unlocks BKM tier, Selangor unlocks Bantuan Bingkas. Kelantan has no state-specific aids in the BA catalog.)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14 (App Router) + TypeScript | Installable PWA via `public/manifest.json` (next-pwa was dropped — see Setup Notes) |
| Styling | Tailwind CSS | Mobile-first, large text, high contrast |
| Backend | Next.js API Routes | Keep it simple, no separate BE needed |
| Database | PostgreSQL via Prisma ORM | Hosted on AWS RDS. Schema + seed exist; demo flow does not actually hit the DB at runtime (localStorage-only). |
| AI Matching | Google Gemini API (`gemini-flash-latest`, paid tier) | For aid matching and gap analysis. Free tier capped us at 20 RPD which we burned through in testing — switched to paid (MYR 40 prepaid credit on the Default Gemini Project as of 2026-04-25). Realistic demo cost is ~$0.01 per full session. |
| AI Chatbot | Google Gemini API (`gemini-flash-latest`, paid tier) | Originally Claude in the spec; swapped to Gemini after Anthropic credits ran out. Same model + key as matching — shares the project quota. |
| Deployment | AWS Amplify (primary) | Auto-deploy from GitHub |
| AI Inference | Alibaba Cloud PAI/Model Studio | Secondary AI, Malay NLP justification |
| CDN | Alibaba Cloud CDN | Asset delivery for Malaysia region |

---

## Project Structure

```
Area-67/
├── CLAUDE.md                  ← You are here (source of truth)
├── .env.local                 ← API keys (never commit this)
├── research/                  ← BA1 source material (aids.json + .docx integration ref)
├── prisma/
│   ├── schema.prisma          ← DB schema (Aid is id+slug+data:Json — see Setup Notes)
│   └── seed.ts                ← Seed script (DB unused at runtime; compile-clean only)
├── src/
│   ├── app/
│   │   ├── layout.tsx         ← Root layout (PWA meta, fonts)
│   │   ├── page.tsx           ← Landing / entry point
│   │   ├── onboarding/
│   │   │   └── page.tsx       ← 3-step onboarding form
│   │   ├── dashboard/
│   │   │   └── page.tsx       ← Aid matching results
│   │   ├── chat/
│   │   │   └── page.tsx       ← AIDa chatbot screen
│   │   └── api/
│   │       ├── match/
│   │       │   └── route.ts   ← Gemini aid matching endpoint
│   │       └── chat/
│   │           └── route.ts   ← Gemini chatbot endpoint
│   ├── components/
│   │   ├── OnboardingForm.tsx ← 3-step form: name+lang / age+gender+state+household+children / religion+income
│   │   ├── AidCard.tsx        ← Localized name; eligible/auto/partial states; inline gap CTA on partial
│   │   └── ChatInterface.tsx
│   ├── lib/
│   │   ├── gemini.ts          ← Gemini client + system prompts + deterministic fallback matcher
│   │   ├── types.ts           ← Aid, UserProfile, MatchedAid (status: eligible|auto|partial)
│   │   └── db.ts              ← Prisma client singleton (seed-only for demo)
│   └── data/
│       └── aids.json          ← 15 aids in BA1 schema — copied from research/, read by /api/match
└── public/
    ├── manifest.json          ← PWA manifest
    └── icons/                 ← App icons (192/512 PNGs to be added)
```

---

## Core Features to Build (Priority Order)

### 1. Onboarding Form (HIGHEST PRIORITY)
- 3 steps, focused topics per screen
- **Step 1**: Name (text) + Language (BM / EN / 中文 / தமிழ்)
- **Step 2**: Age (stepper) + Gender (Lelaki / Perempuan radio) + State (dropdown, defaults to Selangor for the Aminah persona) + Household size (stepper) + Number of children under 18 (stepper)
- **Step 3**: Religion (Islam / Bukan Islam radio with helper text "Untuk semak kelayakan bantuan zakat") + Monthly income (5 large button buckets)
- Progress bar at top
- Large 18px+ text, big tap targets (min 48px height buttons)
- "Seterusnya" (Next) button — not "Submit" or "Continue"
- Store in localStorage only as `aida.profile` (no auth, no DB write — see "What NOT to build")
- Why these specific fields: gender unlocks BIB maternal aid, religion unlocks the 4 zakat aids, numChildren drives STR + BKM tier amounts. Skipped from onboarding (kept as defaults): `ekasihRegistered`, `isStrRecipient`, `employmentType` — those let aids stay as `partial` with a "1-step away" fix CTA, which IS the demo's wow moment.

### 2. Aid Matching Screen (HIGHEST PRIORITY)
- Show all matched aid cards (Aminah-like persona returns ~9). Sort: `auto` first, then `eligible`, then `partial`.
- Each card carries one of three **statuses**:
  - **`eligible`** — green, "Mohon Sekarang →" button to `application.online_url`
  - **`auto`** — green with ⚡ "Auto — tiada permohonan" badge, button reads "Lihat butiran →". Signals instant value (SARA, MySalam, BPEN, SARA Untuk Semua)
  - **`partial`** — yellow border, inline "Apa yang kurang?" gap panel + estimated days + "Daftar dahulu →" CTA pointing at the prerequisite registration's URL (eKasih / STR / asnaf registration)
- Localized name: card pulls `aid.name[profile.language]`, falls back to `ms`. Amount headline: `RM{min_myr}–RM{max_myr}`, with `aid.amount.description` (BA's prose) below.
- Hard near-miss section ("Hampir layak"): aids that fail income/state/religion/age/gender — surfaced separately with the gap message but no fix CTA (those gaps aren't actionable).
- Total potential value chip at top: sum of `max_myr` across matched. With cache-warming this is the demo's headline number.
- Result is cached in localStorage as `aida.match` so navigation back to dashboard is instant.
- This is the WOW moment — make it feel magical.

### 3. AIDa Chatbot (HIGH PRIORITY)
- WhatsApp-style bubble UI (green bubbles for AIDa, white for user)
- Suggested quick-reply chips below input: "Apa itu BSH?", "Macam mana nak mohon?", "Bila duit masuk?"
- Multilingual — detect language from onboarding preference
- AIDa avatar: simple icon, friendly name
- Powered by Gemini API (`gemini-flash-latest`) with a system prompt that knows the user's profile and matched aids

### 4. Aid Tracker (MEDIUM — demo slide only if no time)
- Simple list: Applied / Eligible-not-applied / Upcoming renewal
- Can be mocked with static data for demo

---

## Design Principles (NON-NEGOTIABLE)

These are for a user group with LOW digital literacy. Every design decision must serve them.

1. **Text size minimum 16px body, 20px+ for key info, 24px+ for amounts**
2. **Buttons minimum 48px tall, full-width on mobile**
3. **One primary action per screen** — never two competing CTAs
4. **Icons + text always together** — never icon-only
5. **High contrast** — dark text on light background, no grey-on-grey
6. **Bahasa Malaysia as default** — English as secondary
7. **No jargon** — "Bantuan Wang" not "Financial Assistance Disbursement"
8. **Progress is always visible** — show where they are in any multi-step flow
9. **Error messages in plain language** — "Cuba lagi" not "Error 422"
10. **Confirmation before any action** — never silent submissions

---

## API Keys Needed (.env.local)

```bash
# AI — only Gemini is required for the demo flow.
# This key MUST belong to the same Google Cloud project that has billing
# enabled (currently "Default Gemini Project" with MYR 40 prepaid). A key
# from a different project still works but reverts to the 20-RPD free tier.
GEMINI_API_KEY=your_key_here

# Database — optional. Schema + seed exist but the demo flow uses localStorage,
# so the app runs end-to-end without this set.
DATABASE_URL=postgresql://user:password@host:5432/aida

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Dev-only escape hatch for corporate proxies / antivirus that intercept HTTPS.
# Without this Node's fetch rejects the MITM cert and the Gemini SDK throws
# "fetch failed" with no cause. Do NOT ship to prod.
# NODE_TLS_REJECT_UNAUTHORIZED=0
```

Get / verify the Gemini key: https://aistudio.google.com/app/apikey
Billing console: https://aistudio.google.com/usage (or Cloud Console → Billing)

---

## Setup Notes (gotchas we hit during build)

These are non-obvious things future-you (or another dev) will trip on. Read before starting fresh.

- **Use pnpm, not npm.** This repo was scaffolded on Node 25 + npm 11, where npm's Arborist crashes on this dep tree (`Cannot read properties of null (reading 'matches')`). pnpm installs cleanly. Use `pnpm install` / `pnpm dev` / `pnpm build`.
- **`next-pwa` was removed from the spec.** Same npm bug above was triggered by next-pwa's old transitive tree. The manifest + theme color tags still give installable-PWA behavior; the offline service worker is the only thing missing. Re-add later if needed.
- **Restart `pnpm dev` after editing `.env.local`.** Next reads env vars once at server start. Symptoms of forgetting: chat returns the offline fallback even though your key is set.
- **Gemini model name: `gemini-flash-latest`.** `gemini-1.5-flash` was retired from the v1beta endpoint in April 2026. Both `/api/match` and `/api/chat` use `gemini-flash-latest`, which auto-tracks the current free-tier Flash.
- **`maxOutputTokens` must be ≥ 2048** for chat. Gemini 2.5+ Flash counts hidden reasoning tokens against the budget; with 400 you get truncated mid-sentence replies. Set in `src/lib/gemini.ts`.
- **"fetch failed" from inside Next dev** = corporate MITM proxy intercepting HTTPS. The SDK wraps the underlying TLS error as a generic fetch failure with no `cause`. Fix by adding `NODE_TLS_REJECT_UNAUTHORIZED=0` to `.env.local` (dev only) or installing the corp CA via `NODE_EXTRA_CA_CERTS`.
- **Both AI routes have offline fallbacks.** `/api/match` uses a deterministic rule-based matcher (parses `income_band` strings, gates on state/religion/age/gender/employment/education, treats missing registrations as `partial` with templated gap fixes from the BA's docx §B2). `/api/chat` returns a friendly multilingual "Maaf, saya tersengkang sekejap…" reply. The demo flow always renders something, never a blank screen.
- **Gemini free tier = 20 requests/day per project.** Easy to burn during a testing session. Symptoms: `429 Too Many Requests` in the dev server console + `/api/match` returns in <1s (fallback). Resets at midnight Pacific. We've moved to paid tier — see Tech Stack — but if you swap keys to a non-billed project you'll hit the wall again.
- **Prisma schema is intentionally schema-light.** `Aid` model is just `id + slug + data: Json` — the BA's rich aid catalog (multilingual names, tiered amounts, structured eligibility) lives inside the JSON column. Catalog updates don't require a migration. The DB is unused at runtime; this exists so `Application.aidId` has something to reference and so `pnpm build` typechecks `prisma/seed.ts`.
- **localStorage caching matters for cost AND UX.** First dashboard visit hits Gemini (~5–15s); the result is cached as `aida.match` and any subsequent load is instant. For a clean live demo, clear `aida.profile` + `aida.match` before going on stage so onboarding fires fresh. For cost control, this means each unique demo persona costs ~$0.01–0.02 of Gemini spend, not $0.01 × every page view.
- **Slim prompt to Gemini.** `matchAids` runs each aid through `slimAidForMatching` before sending to the LLM — drops UI-only fields (multilingual names, amounts, application steps, source URLs). Cuts the prompt from ~30KB to ~10KB. The dashboard re-hydrates the full Aid objects from `aids.json` by id when rendering; keep that in mind if you ever change the slim shape.
- **Next.js was bumped to 14.2.35** for a security patch flagged by pnpm during install. App Router APIs unchanged from 14.2.

---

## Aid Matching Logic

The matching engine lives in [src/lib/gemini.ts](src/lib/gemini.ts). Behavior summary — read the actual file for the live prompt and gap templates, this is the orientation:

### Output shape (returned from `/api/match`)
```ts
{
  matched: [{ id, status: 'eligible'|'auto'|'partial', reason, confidence,
              gap?, fix_url?, estimated_days? }],
  nearMiss: [{ id, gap, suggestion, fix_url?, estimated_days? }],
  nextSteps: string[]   // 2–3 actionable bullets in profile.language
}
```

### Status meanings
- **`eligible`** — user satisfies every criterion right now; can apply
- **`auto`** — also qualifies AND `aid.is_auto_credited` is true; no application needed (SARA, MySalam, BPEN, SARA Untuk Semua)
- **`partial`** — qualifies on demographics but missing a value in `eligibility_criteria.required_registrations` (eKasih / STR / asnaf). The `gap` and `fix_url` are filled from the BA's templates so the UI can render a one-click "Daftar dahulu" CTA.
- Goes to **`nearMiss`** when one hard criterion fails (income too high, wrong state, wrong religion, age out of range, wrong gender, wrong employment/education status).

### Strict gates (Gemini and the fallback both honor these)
A missing field is normally treated as permissive, EXCEPT for `religion_required`, `is_state_specific`, `employment_history`, `education_status`, and `gender` — those default to **failing** the aid into nearMiss. Better to under-match than to falsely promise an asnaf or maternal aid.

### Gap templates (BA1 docx §B2)
Embedded in `GAP_TEMPLATES` in `gemini.ts`. Keys: `ekasih`, `str_recipient`, `asnaf_registered_lzs`, `asnaf_registered_maiwp`, `asnaf_registered_tbs`. Each carries `gap_ms` / `gap_en` / `fix_url` / `estimated_days` — the system prompt instructs Gemini to pull from these; the deterministic fallback reads them directly.

### Prerequisite-only aids
`eKasih` has `is_prerequisite_only: true`. The matcher skips it from being surfaced as an aid — it appears only as the gap message inside *other* aids' partial status.

### Fallback
If Gemini errors (network, quota, malformed JSON), `fallbackMatch` produces the same shape using rules: parses `income_band` regex (`RM(\d+)` + had-kifayah default of RM2,000), checks state/religion/age/gender/employment/education gates, marks aids with required_registrations as `partial` and pulls templates by the registration key.

---

## AIDa Chatbot System Prompt

Lives in [src/lib/gemini.ts](src/lib/gemini.ts) as `buildAidaSystemPrompt(profile, matchedAids)`, called from [src/app/api/chat/route.ts](src/app/api/chat/route.ts). The prompt frames AIDa as a warm Malaysian case worker, defaults to Bahasa Malaysia, caps replies at 2–4 sentences, demands plain language ("imagine explaining to someone's grandmother"), and tells the model to fall back to `"Saya akan semak untuk awak"` when it doesn't know an answer. The user's full `UserProfile` and the array of matched `Aid` objects are injected into context, so the chatbot can quote `application.steps`, application URLs, and amounts directly from the catalog.

**Fallback message** (when Gemini is unreachable): friendly multilingual reply in `ms` / `en` / `zh` / `ta` — see `FALLBACK_REPLY` in [src/app/api/chat/route.ts](src/app/api/chat/route.ts). No `[API error]` developer tags reach the user; the actual error goes to `console.error` and to a `_debug` field in dev mode only.

---

## Seed Data (Aids Programs)

**Live catalog: [src/data/aids.json](src/data/aids.json) — 15 aids in BA1 schema.**

Sourced from the BA team's research drop in `research/` (mirrored in `research/aids.json` + `research/AREA67_AIDa_BA1_Catalog.docx`). The `.docx` is the authoritative reference for catalog structure — read it before adding fields. Don't edit the `.docx`; it's a paste-back from the BA's process. Update `src/data/aids.json` directly when changes are needed and check that the `Aid` interface in [src/lib/types.ts](src/lib/types.ts) still matches.

### Aid object shape (one entry, abbreviated)
```jsonc
{
  "id": "str-2026",
  "slug": "sumbangan-tunai-rahmah",
  "name": { "ms": "...", "en": "...", "zh": "...", "ta": "..." },
  "provider": "LHDN / Ministry of Finance",
  "category": "cash",                          // see AidCategory union in types.ts
  "is_recurring": true,
  "is_auto_credited": false,                   // ⚡ "auto" badge in UI when true
  "is_religion_specific": false,
  "religion_required": null,                   // "Islam" for zakat aids
  "is_state_specific": null,                   // "Selangor" / "Sarawak" / etc.
  "state_covers": ["Kuala Lumpur", "..."],     // optional multi-state aids
  "is_prerequisite_only": false,               // true ONLY for eKasih (registration gate)
  "application_window": { "type": "annual", "open_month": 10, "close_month": 11 },
  "amount": { "min_myr": 100, "max_myr": 2200, "description": "...", "tiers": [...] },
  "eligibility_criteria": {
    "citizenship": "malaysian",
    "min_age": 18, "max_age": null,
    "gender": "female",                        // present only on gendered aids
    "religion": "Islam",                       // present only on religion-gated aids
    "state": "Selangor",                       // matches is_state_specific
    "income_band": "≤RM2500/month household",  // free-text, parsed by regex
    "education_status": "enrolled",            // strict gate
    "employment_history": "former_civil_servant", // strict gate
    "required_registrations": ["ekasih"],      // → partial status with templated gap
    "additional_rules": ["..."]                // free-text context for the LLM
  },
  "required_documents": ["MyKad", "..."],
  "application": { "online_url": "https://...", "steps": ["..."], "renewal_required": true },
  "linked_aids": ["sara-2026"],
  "tags": ["b40", "cash"],
  "source_urls": ["..."],
  "last_verified_at": "2026-04-25"
}
```

### What's currently in the catalog (15 aids)
Federal cash: STR, e-Tunai Belia · Federal in-kind: SARA, SARA Untuk Semua · Federal insurance: MySalam · Federal welfare: BIB, BKM, Penjaga OKU · Retiree: BPEN · Registration gate: eKasih · State zakat: LZS BSH, LZS Pendidikan (Selangor), MAIWP (KL/Putrajaya/Labuan), TBS (Sarawak) · State cash: Bantuan Bingkas (Selangor).

### Persona test profiles
The BA's expected-output table lives in `research/AREA67_AIDa_BA1_Catalog.docx` §B4. The Aminah persona (58F, Selangor, Muslim, RM1,800/mo, 1 school child) returns 9 matched + 5 near-miss — that's the calibration target. If a code change drops her count below 8 or surfaces eKasih as a standalone aid, something regressed.

---

## Git Workflow

```bash
# Before starting any feature
git pull origin main

# After each screen is done
git add .
git commit -m "feat: [screen name] - [what was done]"
git push origin main

# Branch names
feat/onboarding
feat/aid-matching
feat/chatbot
```

---

## Demo Script (for presentation)

1. Open app on phone (or phone-sized browser window)
2. Show landing screen — clean, Malay, one big button "Mula Sekarang"
3. Go through onboarding as Mak Cik Aminah:
   - Step 1: nama "Aminah", bahasa **Bahasa Malaysia**
   - Step 2: umur **58**, jantina **Perempuan**, negeri **Selangor**, isi rumah **3**, anak di bawah 18 **1**
   - Step 3: agama **Islam**, pendapatan **RM1,000 – RM2,000**
4. Hit matching screen — pause here, let the AI result load visibly (typically 5–15s on Gemini paid tier; the app caches to localStorage so any re-open is instant)
5. Say: "In seconds, AIDa found 9 programs Aminah qualifies for, worth thousands of ringgit a year — and crucially, she's never heard of most of them. Three are auto-credited or eligible right now. Six more she's '1 step away' from — see this yellow card? AIDa knows exactly what she needs to do to unlock them: register on eKasih. One link, one form."
6. Open chatbot, type **"macam mana nak mohon STR?"** in Malay
7. Show AIDa responding in Malay with the application steps from the catalog
8. Show architecture slide — AWS Amplify + Gemini + Alibaba Cloud PAI/CDN

**Time target: 3 minutes demo, 2 minutes Q&A**

**Pre-demo checklist:**
- Restart `pnpm dev` so env vars load fresh
- Do one full onboarding run-through earlier in the day to warm Gemini and verify quota
- Clear `localStorage` (`aida.profile` + `aida.match` keys) before the live demo so it onboards fresh on stage
- Have https://aistudio.google.com/app/apikey open in another tab in case the API key needs swapping

---

## What NOT to build (scope cuts for hackathon)

- ❌ User authentication / login (use localStorage)
- ❌ Real document upload
- ❌ Payment / wallet integration (mention in slides only)
- ❌ Full aid tracker (show as coming soon)
- ❌ Admin dashboard
- ❌ Real-time notifications
- ❌ Full multilingual i18n (Malay + English sufficient for demo)
