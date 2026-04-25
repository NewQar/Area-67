# CLAUDE.md — AIDa Project Source of Truth

## What is AIDa?
AIDa (Aid Intelligence & Discovery Assistant) is a PWA (Progressive Web App) that helps low-income Malaysians discover, match, and apply for government aids, zakat, and financial assistance programs they are eligible for but unaware of.

**Hackathon context:** This is a working prototype demo. Prioritize visible, impressive features over completeness. Every decision should serve the demo narrative.

**Demo narrative:** Ahmad, 42, rubber tapper from Kelantan. He opens AIDa, answers 5 questions in Malay, and in 30 seconds discovers he qualifies for 3 aids he never knew existed. He chats with AIDa in Malay and gets a clear answer. That is the story we are telling.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14 (App Router) + TypeScript | Installable PWA via `public/manifest.json` (next-pwa was dropped — see Setup Notes) |
| Styling | Tailwind CSS | Mobile-first, large text, high contrast |
| Backend | Next.js API Routes | Keep it simple, no separate BE needed |
| Database | PostgreSQL via Prisma ORM | Hosted on AWS RDS. Schema + seed exist; demo flow does not actually hit the DB at runtime (localStorage-only). |
| AI Matching | Google Gemini API (`gemini-flash-latest`, free tier) | For aid matching and gap analysis |
| AI Chatbot | Google Gemini API (`gemini-flash-latest`, free tier) | Originally Claude in the spec; swapped to Gemini after Anthropic credits ran out. Same UX. |
| Deployment | AWS Amplify (primary) | Auto-deploy from GitHub |
| AI Inference | Alibaba Cloud PAI/Model Studio | Secondary AI, Malay NLP justification |
| CDN | Alibaba Cloud CDN | Asset delivery for Malaysia region |

---

## Project Structure

```
Area-67/
├── CLAUDE.md                  ← You are here (source of truth)
├── .env.local                 ← API keys (never commit this)
├── prisma/
│   ├── schema.prisma          ← DB schema
│   └── seed.ts                ← Seed data (aids list)
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
│   │   ├── OnboardingForm.tsx
│   │   ├── AidCard.tsx
│   │   └── ChatInterface.tsx
│   ├── lib/
│   │   ├── gemini.ts          ← Gemini API client (matching + chat + system prompt)
│   │   ├── types.ts           ← Shared TS types (UserProfile, Aid, MatchResult)
│   │   └── db.ts              ← Prisma client singleton (seed-only for demo)
│   └── data/
│       └── aids.json          ← Static aids data (read by /api/match)
└── public/
    ├── manifest.json          ← PWA manifest
    └── icons/                 ← App icons (192/512 PNGs to be added)
```

---

## Core Features to Build (Priority Order)

### 1. Onboarding Form (HIGHEST PRIORITY)
- 3 steps max, one question per screen
- Step 1: Name + Language preference (BM / EN / 中文 / தமிழ்)
- Step 2: Age + State + Household size (big number pickers, not text inputs)
- Step 3: Monthly income (big slider or large button options)
- Progress bar at top
- Large 18px+ text, big tap targets (min 48px height buttons)
- "Seterusnya" (Next) button — not "Submit" or "Continue"
- Store in localStorage only (no auth, no DB write — see "What NOT to build")

### 2. Aid Matching Screen (HIGHEST PRIORITY)
- Show 3–5 matched aid cards
- Each card: Aid name (large), amount (bold, green), match reason (1 line), "Mohon Sekarang" button
- AI reasoning section: collapsible "Mengapa anda layak?" with Gemini's explanation
- Unmatched aids section: "Hampir layak" (Almost eligible) — show what's missing
- This is the WOW moment — make it feel magical

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
# AI — only Gemini is required for the demo flow
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

Get Gemini key: https://aistudio.google.com/app/apikey (free)

---

## Setup Notes (gotchas we hit during build)

These are non-obvious things future-you (or another dev) will trip on. Read before starting fresh.

- **Use pnpm, not npm.** This repo was scaffolded on Node 25 + npm 11, where npm's Arborist crashes on this dep tree (`Cannot read properties of null (reading 'matches')`). pnpm installs cleanly. Use `pnpm install` / `pnpm dev` / `pnpm build`.
- **`next-pwa` was removed from the spec.** Same npm bug above was triggered by next-pwa's old transitive tree. The manifest + theme color tags still give installable-PWA behavior; the offline service worker is the only thing missing. Re-add later if needed.
- **Restart `pnpm dev` after editing `.env.local`.** Next reads env vars once at server start. Symptoms of forgetting: chat returns the offline fallback even though your key is set.
- **Gemini model name: `gemini-flash-latest`.** `gemini-1.5-flash` was retired from the v1beta endpoint in April 2026. Both `/api/match` and `/api/chat` use `gemini-flash-latest`, which auto-tracks the current free-tier Flash.
- **`maxOutputTokens` must be ≥ 2048** for chat. Gemini 2.5+ Flash counts hidden reasoning tokens against the budget; with 400 you get truncated mid-sentence replies. Set in `src/lib/gemini.ts`.
- **"fetch failed" from inside Next dev** = corporate MITM proxy intercepting HTTPS. The SDK wraps the underlying TLS error as a generic fetch failure with no `cause`. Fix by adding `NODE_TLS_REJECT_UNAUTHORIZED=0` to `.env.local` (dev only) or installing the corp CA via `NODE_EXTRA_CA_CERTS`.
- **Both AI routes have offline fallbacks.** `/api/match` uses a deterministic rule-based matcher if Gemini is unreachable; `/api/chat` returns a tagged error message (`[no API key]` or `[API error]`). The demo flow always renders something, never a blank screen.
- **Next.js was bumped to 14.2.35** for a security patch flagged by pnpm during install. App Router APIs unchanged from 14.2.

---

## Aid Matching Logic

The matching uses Gemini with a structured prompt. User profile is sent with the aids list. Gemini returns:
1. Matched aids with % confidence and reason
2. Near-miss aids with what's missing
3. Suggested next steps

**Gemini system prompt (in `/src/lib/gemini.ts`):**
```
You are an aid eligibility assistant for Malaysia. Given a user profile and a list of aid programs, return a JSON object with:
- matched: array of aids the user qualifies for, each with { id, reason, confidence }
- nearMiss: array of aids they almost qualify for, each with { id, gap, suggestion }
- nextSteps: array of 2-3 actionable suggestions in the user's language

User profile: {profile}
Available aids: {aids}

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.
```

---

## AIDa Chatbot System Prompt

The chatbot knows the user's profile and their matched aids. Lives in `src/lib/gemini.ts` as `buildAidaSystemPrompt(profile, matchedAids)`, called from `/src/app/api/chat/route.ts`:

```
You are AIDa, a warm and helpful Malaysian government aid assistant. You speak like a friendly case worker, not a robot.

User profile: {profile}
Their matched aids: {matchedAids}

Rules:
- Default to Bahasa Malaysia unless the user writes in another language
- Keep responses SHORT — 2-4 sentences max
- Use simple words — imagine explaining to someone's grandmother
- If asked about an aid they qualify for, give the application link and next step
- If asked something you don't know, say "Saya akan semak untuk awak" (I'll check for you)
- Never use jargon or bureaucratic language
- Be warm and encouraging — many users feel shame asking for help
```

---

## Seed Data (Aids Programs)

The BA team is researching full details. For dev, use this starter data in `prisma/seed.ts` or `src/data/aids.json`:

```json
[
  {
    "id": "bsh-2024",
    "name": "Sumbangan Tunai Rahmah (STR)",
    "nameEn": "Rahmah Cash Contribution",
    "amount": 1000,
    "frequency": "yearly",
    "criteria": {
      "maxIncome": 2500,
      "minHouseholdSize": 1,
      "citizenship": "malaysian"
    },
    "description": "Bantuan tunai tahunan untuk isi rumah berpendapatan rendah",
    "applyUrl": "https://str.hasil.gov.my",
    "provider": "Kerajaan Persekutuan"
  },
  {
    "id": "zakat-asnaf",
    "name": "Zakat Asnaf (Fakir & Miskin)",
    "nameEn": "Zakat for the Poor",
    "amount": 300,
    "frequency": "monthly",
    "criteria": {
      "maxIncome": 1500,
      "religion": "islam",
      "minHouseholdSize": 1
    },
    "description": "Bantuan bulanan dari tabung zakat negeri",
    "applyUrl": "https://www.zakat.com.my",
    "provider": "Majlis Agama Islam Negeri"
  },
  {
    "id": "bantuan-oku",
    "name": "Bantuan OKU",
    "nameEn": "Disabled Person Assistance",
    "amount": 450,
    "frequency": "monthly",
    "criteria": {
      "hasOKUCard": true,
      "maxIncome": 3000
    },
    "description": "Bantuan bulanan untuk orang kurang upaya berdaftar",
    "applyUrl": "https://www.jkm.gov.my",
    "provider": "Jabatan Kebajikan Masyarakat (JKM)"
  },
  {
    "id": "ekasih",
    "name": "Program eKasih",
    "nameEn": "eKasih Programme",
    "amount": 500,
    "frequency": "quarterly",
    "criteria": {
      "maxIncome": 2000,
      "registeredPoverty": true
    },
    "description": "Bantuan untuk isi rumah dalam pangkalan data kemiskinan",
    "applyUrl": "https://ekasih.gov.my",
    "provider": "Unit Penyelarasan Pelaksanaan (ICU)"
  },
  {
    "id": "bpn-kelantan",
    "name": "Bantuan Prihatin Negeri Kelantan",
    "nameEn": "Kelantan State Care Aid",
    "amount": 200,
    "frequency": "yearly",
    "criteria": {
      "state": "kelantan",
      "maxIncome": 3000
    },
    "description": "Bantuan khas untuk rakyat Kelantan",
    "applyUrl": "https://www.kelantan.gov.my",
    "provider": "Kerajaan Negeri Kelantan"
  }
]
```

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
3. Go through 3-step onboarding as Ahmad (42, Kelantan, RM1,200/month, 4 household)
4. Hit matching screen — pause here, let the AI result load visibly
5. Say: "In seconds, AIDa found 3 programs Ahmad qualifies for, worth up to RM1,700/month"
6. Open chatbot, type "macam mana nak mohon STR?" in Malay
7. Show AIDa responding in Malay with steps
8. Show architecture slide — AWS + Alibaba Cloud

**Time target: 3 minutes demo, 2 minutes Q&A**

---

## What NOT to build (scope cuts for hackathon)

- ❌ User authentication / login (use localStorage)
- ❌ Real document upload
- ❌ Payment / wallet integration (mention in slides only)
- ❌ Full aid tracker (show as coming soon)
- ❌ Admin dashboard
- ❌ Real-time notifications
- ❌ Full multilingual i18n (Malay + English sufficient for demo)
