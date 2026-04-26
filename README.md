# AIDa — Aid Intelligence & Discovery Assistant

> A mobile-first PWA that helps low-income Malaysians discover, match, and apply for **government aids, zakat, and financial assistance programs** they're eligible for but have never heard of.

**Team:** Area 67 · **Built for:** Hackathon 2026 · **Status:** Working prototype

---

## Try it live

| Environment | URL | Notes |
|---|---|---|
| Primary (Alibaba Cloud SWAS, Malaysia) | **http://47.250.136.5** | Live cross-cloud read into AWS RDS |
| Backup (AWS Amplify, Singapore) | **https://main.d24c5avr6x718w.amplifyapp.com/welcome** |  |

> The PWA installs to your home screen — open in mobile Chrome/Safari and tap "Add to Home Screen" for the full-screen experience.

**Optimal viewing:** mobile (375px) or a phone-shaped browser window. Desktop works but the design is mobile-first.

---

## Why AIDa exists

Malaysia has **dozens** of government, zakat, and state-level aid programs targeting low-income households — STR, SARA, MySalam, BKM, Bantuan Bingkas, LZS asnaf aid, MAIWP, and more. The benefits are real (often **thousands of ringgit per year**), but three barriers keep them out of reach:

1. **Discovery** — most eligible families don't know these programs exist.
2. **Eligibility complexity** — each program has its own income bands, age gates, religion/state requirements, and registration prerequisites.
3. **Application friction** — many require eKasih or asnaf registration as a prerequisite, which is itself a separate process most people don't know about.

AIDa solves all three in under 60 seconds: scan MyKad → answer 3 questions → see exactly which programs you qualify for, which you're "1 step away" from, and what that step is.

---

## The demo in 60 seconds

> **Mak Cik Aminah, 58**, widowed informal childminder from Klang, Selangor. RM1,800/month income. Lives with an unemployed adult son and a school-age daughter.

She opens AIDa, scans her MyKad, answers 3 questions in Malay. AIDa returns:

- **9 programs she qualifies for right now**, worth thousands of ringgit a year — STR, SARA, MySalam takaful, Bantuan Bingkas Selangor, 4 LZS zakat aids, BKM.
- **5 near-miss programs** she's "1 step away" from — all unlocked by registering on **eKasih**, which AIDa surfaces as a single actionable next step.
- A **multilingual chatbot** that answers "macam mana nak mohon STR?" in Bahasa Malaysia, quoting the official application steps directly from the catalog.

That's the entire pitch. Everything below explains how it works.

---

## Screenshots

> Drop captured screenshots into `docs/screenshots/` using the filenames below. The README will pick them up automatically.

| | | |
|---|---|---|
| **Splash** | **Welcome** | **MyKad eKYC mock** |
| ![Splash](docs/screenshots/01-splash.png) | ![Welcome](docs/screenshots/02-welcome.png) | ![MyKad scan](docs/screenshots/03-mykad-scan.png) |
| **MyKad confirm (auto-filled)** | **Onboarding wizard** | **Dashboard / matched aids** |
| ![MyKad confirm](docs/screenshots/04-mykad-confirm.png) | ![Onboarding](docs/screenshots/05-onboarding.png) | ![Dashboard](docs/screenshots/06-dashboard.png) |
| **Aid detail** | **Catalog browse** | **Insights (TnG wallet)** |
| ![Aid detail](docs/screenshots/07-aid-detail.png) | ![Catalog](docs/screenshots/08-catalog.png) | ![Insights](docs/screenshots/09-insights.png) |
| **AIDa chatbot (BM)** | **Profile** | **Near-miss / 1-step-away** |
| ![Chat](docs/screenshots/10-chat.png) | ![Profile](docs/screenshots/11-profile.png) | ![Near-miss](docs/screenshots/12-near-miss.png) |

---

## Features

### 1. Onboarding with eKYC mock
- **Path A — MyKad scan (default):** tap an animated SVG MyKad card → 2-second scan animation → confirmation screen pre-fills name, age, gender, state, and religion (hard-coded to the Aminah persona for the demo).
- **Path B — manual fallback:** "Isi sendiri tanpa MyKad" link routes through 5 single-question screens.
- Both paths converge on household size → number of children under 18 → monthly income (5 buckets) → saved to `localStorage`.
- Why these fields: gender unlocks BIB maternal aid, religion unlocks 4 zakat aids, number of children drives STR + BKM tier amounts. Some fields (eKasih registration, STR recipient status, employment type) are deliberately **left as defaults** so aids surface as `partial` with a "1-step away" CTA — the demo's wow moment.

### 2. AI-powered aid matching
- Sends user profile + slimmed aid catalog to **Google Gemini** (`gemini-flash-lite-latest`) for contextual matching.
- Returns three buckets:
  - **`✓ Layak`** — eligible right now, can apply.
  - **`⚡ Auto`** — auto-credited, no application needed (SARA, MySalam, BPEN, SARA Untuk Semua).
  - **`⚠ Hampir`** — qualifies on demographics but missing a registration prerequisite. Surfaces a templated "Daftar dahulu" CTA with the exact registration URL and estimated days.
- **Deterministic offline fallback** — if Gemini errors (network, quota, malformed JSON), a rule-based matcher produces the same output shape so the demo never goes blank.
- Result cached in `localStorage["aida.match"]` — second load is instant.

### 3. Catalog browse (`/aids`)
- Full searchable catalog of 15 aids with category chip filters (Tunai / Baucar / Zakat / Insurans / Welfare).
- **Only screen that hits the database** — Server Component reads from AWS RDS PostgreSQL via Prisma. Falls back to local JSON if the database is unset or unreachable. Demonstrates a real cross-cloud query path without putting the AI hot path at risk.

### 4. Aid detail page
- Provider logo + program name, amount hero card, "Mengapa anda layak" / "Apa yang kurang" reasoning, tier breakdown, eligibility criteria, required documents, application steps, offline options.
- Sticky bottom CTA adapts to status: "Mohon Sekarang" (eligible) / "Daftar dahulu" (partial) / "Lihat butiran" (auto-credited).

### 5. Insights tab — Touch 'n Go wallet narrative
- Mocked TnG eWallet card with balance derived from matched aid amounts.
- AI advice cards (win / tip / warn tones) — hard-coded for the demo, no LLM call.
- Static stacked-bar spending breakdown (groceries / utilities / transport / health / other).
- **All mocked** — page footer says so. The intent is to show the Touch 'n Go ecosystem story, not transact.

### 6. AIDa chatbot
- WhatsApp-style bubbles with quick-reply chip suggestions.
- Multilingual (Bahasa Malaysia / English / 中文 / தமிழ்) — picks language from user profile.
- System prompt frames AIDa as a warm Malaysian case worker, defaults to BM, caps replies at 2–4 sentences, demands plain language ("imagine explaining to someone's grandmother").
- Has access to the user's full profile + matched aid objects, so it quotes application steps and amounts directly from the catalog.
- Friendly multilingual fallback if Gemini is unreachable — no `[API error]` developer tags ever reach the user.

### 7. Profile management
- Demographic summary, language switcher, settings list.
- Destructive "Padam profil & mula semula" with `confirm()` dialog clears localStorage and routes back to onboarding.

### 8. PWA install
- Installable to home screen via `public/manifest.json`.
- Standalone display mode (no browser chrome), blue theme color (`#2563eb`).
- Custom app icons (192px, 512px).

---

## Architecture (multi-cloud)

```
                    ┌────────────────────────────┐
                    │  User (mobile browser/PWA) │
                    └─────────────┬──────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
   ┌──────────▼──────────┐                ┌──────────▼─────────┐
   │  Alibaba Cloud SWAS │                │   AWS Amplify      │
   │  Ubuntu 22 + Nginx  │                │   (Singapore)      │
   │  → PM2 → Next.js    │                │   Backup deploy    │
   │  (Malaysia / KL)    │                │   from main branch │
   │  PRIMARY DEMO URL   │                │   No DATABASE_URL  │
   └──┬──────────────┬───┘                └──────────┬─────────┘
      │              │                               │
      │              │  cross-cloud query            │ falls back
      │              │  (sslmode=require, IP-locked) │ to aids.json
      │              ▼                               │
      │   ┌──────────────────────┐                  │
      │   │  AWS RDS Postgres    │                  │
      │   │  aida-db (Malaysia)  │◄─────────────────┘
      │   │  Stores aid catalog  │   (only on SWAS path)
      │   └──────────────────────┘
      │
      │ static assets (logos, splash)
      ▼
   ┌──────────────────────┐                  ┌──────────────────┐
   │  Alibaba Cloud OSS   │                  │   Google Gemini  │
   │  aida-assets-67      │                  │   API            │
   │  (Malaysia / KL)     │                  │   flash-lite     │
   │  Public-read bucket  │                  │   (matching+chat)│
   └──────────────────────┘                  └──────────────────┘
```

| Layer | Cloud | Service | Live target |
|---|---|---|---|
| Compute (primary) | Alibaba Cloud | SWAS (Malaysia/KL) — Nginx → PM2 → `pnpm start` | http://47.250.136.5 |
| Compute (backup) | AWS | Amplify (Singapore) — auto-builds from `main` | TODO |
| Static assets | Alibaba Cloud | OSS bucket `aida-assets-67` (Malaysia, public-read) | https://aida-assets-67.oss-ap-southeast-3.aliyuncs.com/logo/* |
| Database | AWS | RDS PostgreSQL `aida-db` (Malaysia, db.t3.micro) | aida-db.czgkk84ugb79.ap-southeast-5.rds.amazonaws.com:5432 |
| AI (matching + chat) | Google Cloud | Gemini API (`gemini-flash-lite-latest`, paid tier) | aistudio.google.com |

**Why this shape:** the `/aids` browse page is the only screen that round-trips to RDS — deliberately scoped so the AI hot path (matching, chat, dashboard, aid detail) reads from local JSON and never depends on the cross-cloud connection. RDS security group whitelists only the SWAS public IP. Amplify deliberately runs without `DATABASE_URL` (no stable build IPs to whitelist) and short-circuits to local JSON — same data, no cross-cloud hop, stage-safety fallback.

---

## AI matching engine

The matcher lives in [`src/lib/gemini.ts`](src/lib/gemini.ts). Here's the high-level shape — read the file for the live prompt and gap templates.

### Output shape
```ts
{
  matched: [{ id, status: 'eligible'|'auto'|'partial', reason, confidence,
              gap?, fix_url?, estimated_days? }],
  nearMiss: [{ id, gap, suggestion, fix_url?, estimated_days? }],
  nextSteps: string[]   // 2-3 actionable bullets in user's language
}
```

### Status meanings

| Status | Meaning | UI |
|---|---|---|
| `eligible` | User satisfies every criterion right now — can apply immediately | Green pill `✓ Layak` |
| `auto` | Same as eligible AND `aid.is_auto_credited === true` — no application needed | Green pill `⚡ Auto` |
| `partial` | Qualifies on demographics but missing a registration (eKasih / STR / asnaf) | Yellow pill `⚠ Hampir` + templated "Daftar dahulu" CTA |
| `nearMiss` | One hard criterion fails (income, state, religion, age, gender, employment, education) | Surfaced as separate near-miss section with explicit gap message |

### Strict gates

A missing field is permissive by default, **except** for `religion_required`, `is_state_specific`, `employment_history`, `education_status`, and `gender` — those default to **failing** the aid into nearMiss. Better to under-match than to falsely promise an asnaf or maternal aid.

### Gap templates (BA1 §B2)

Pre-written gap messages, fix URLs, and estimated turnaround days for the 5 common registration prerequisites: `ekasih`, `str_recipient`, `asnaf_registered_lzs`, `asnaf_registered_maiwp`, `asnaf_registered_tbs`. Both Gemini and the deterministic fallback pull from the same template source — the `partial` status is consistent regardless of which path runs.

---

## Aid catalog (15 programs)

| Category | Programs |
|---|---|
| Federal cash | STR (Sumbangan Tunai Rahmah), e-Tunai Belia |
| Federal in-kind | SARA, SARA Untuk Semua |
| Federal insurance | MySalam |
| Federal welfare | Bantuan Ihsan Bayi (BIB), Bantuan Kanak-kanak (BKM), Penjaga OKU |
| Retiree | BPEN |
| Registration gate | eKasih *(prerequisite-only — never surfaced as an aid, only as a gap inside others)* |
| State zakat | LZS BSH, LZS Pendidikan (Selangor), MAIWP (KL/Putrajaya/Labuan), TBS (Sarawak) |
| State cash | Bantuan Bingkas (Selangor) |

Catalog source: BA team's research drop in [`research/`](research/) (`AREA67_AIDa_BA1_Catalog.docx` is the authoritative reference). Live catalog: [`src/data/aids.json`](src/data/aids.json).

**Persona calibration target:** Aminah (58F, Selangor, Muslim, RM1,800/mo, 1 school child) returns **9 matched + 5 near-miss**.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | **Next.js 14** (App Router) + **TypeScript** + **React 18** |
| Styling | **Tailwind CSS** — mobile-first, blue brand palette (`#2563eb`) |
| PWA | `public/manifest.json` (installable, standalone, themed) |
| Backend | **Next.js API Routes** (`/api/match`, `/api/chat`) |
| Database | **PostgreSQL** via **Prisma ORM** (schema-light: `id + slug + data:Json`) |
| AI matching | **Google Gemini** `gemini-flash-lite-latest` @ temp 0.1 |
| AI chatbot | **Google Gemini** `gemini-flash-lite-latest` @ temp 0.6 |
| Validation | **Zod** |
| Hosting | **Alibaba Cloud SWAS** (primary) + **AWS Amplify** (backup) |
| Storage | **Alibaba Cloud OSS** (static assets, public-read) |
| DB hosting | **AWS RDS** (cross-cloud) |

**Why `flash-lite`:** the regular Flash 2.5 model spends hidden reasoning tokens on every turn. Lite skips that — roughly 2× faster on our lookup-and-rephrase workload, with no quality loss for this use case.

---

## Running locally

> Use **pnpm**, not npm. This repo was scaffolded on Node 25 + npm 11, where npm's Arborist crashes on this dep tree. pnpm installs cleanly.

```bash
# 1. Install
pnpm install

# 2. Configure environment
cp .env.local.example .env.local
# then edit .env.local and set GEMINI_API_KEY (get one at https://aistudio.google.com/app/apikey)
# DATABASE_URL is optional — without it, /aids falls back to local JSON

# 3. (Optional) seed the database
pnpm db:push   # apply Prisma schema
pnpm db:seed   # upsert aids.json into the database

# 4. Run dev server
pnpm dev
```

Open http://localhost:3000.

### Required environment variables

| Variable | Required? | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | **Yes** | Powers AI matching and chatbot. Free tier = 20 req/day. |
| `DATABASE_URL` | No | Connects `/aids` browse to PostgreSQL. Without it, falls back to JSON. |
| `NEXT_PUBLIC_ASSETS_URL` | No | CDN base URL for logos. Empty = uses local `/public/logo/`. |
| `NEXT_PUBLIC_APP_URL` | No | App canonical URL (used in metadata). |

Restart `pnpm dev` after editing `.env.local` — Next.js reads env vars once at server start.

---

## Project structure

```
Area-67/
├── CLAUDE.md                  ← Engineering source of truth
├── README.md                  ← You are here
├── prisma/
│   ├── schema.prisma          ← Aid model: id + slug + data:Json
│   └── seed.ts                ← Upserts aids.json into the database
├── research/                  ← BA team's source material (DOCX + JSON)
├── src/
│   ├── app/
│   │   ├── page.tsx           ← Splash (auto-advance ~1.5s)
│   │   ├── welcome/           ← Pre-onboarding landing
│   │   ├── onboarding/        ← Phase-based wizard (eKYC + manual)
│   │   ├── (app)/             ← Route group with bottom nav + chat FAB
│   │   │   ├── dashboard/     ← Home: total RM hero + matched aids grid
│   │   │   ├── aids/          ← Catalog browse (RDS-backed)
│   │   │   ├── insights/      ← Mock TnG wallet + AI advice
│   │   │   └── profile/       ← Profile + language toggle + reset
│   │   ├── aids/[id]/         ← Aid detail (sticky CTA)
│   │   ├── chat/              ← Full-screen chatbot
│   │   └── api/
│   │       ├── match/route.ts ← Gemini aid matcher
│   │       └── chat/route.ts  ← Gemini chatbot
│   ├── components/
│   │   ├── OnboardingForm.tsx ← Phase-based state machine
│   │   ├── MyKadMock.tsx      ← Inline-SVG MyKad card with scan animation
│   │   ├── AidCard.tsx        ← Compact 2-col card with status pill
│   │   ├── BottomNav.tsx      ← 4-tab fixed nav
│   │   ├── ChatFab.tsx        ← Floating chat button
│   │   └── ChatInterface.tsx  ← WhatsApp-style chat
│   ├── lib/
│   │   ├── gemini.ts          ← Client + system prompts + fallback matcher
│   │   ├── logo.ts            ← Aid id → provider logo path
│   │   ├── types.ts           ← Aid / UserProfile / MatchedAid
│   │   └── db.ts              ← Prisma singleton
│   └── data/
│       └── aids.json          ← 15-aid catalog (BM display fields)
└── public/
    ├── manifest.json          ← PWA manifest
    ├── icons/                 ← App icons (192/512)
    └── logo/                  ← Brand + provider logos
```

---

## What's intentionally not built (hackathon scope)

| Cut | Why |
|---|---|
| User authentication / login | localStorage is enough for the demo; auth would steal time from the matching story. |
| Real document upload / camera permission | MyKad scan is an inline-SVG mock with a scan-line animation. |
| Real wallet / transactions | The TnG wallet on `/insights` is a static UI mock. Footer says so. |
| Real spending data | "Corak perbelanjaan" is hard-coded — the AI advice has no LLM call behind it. |
| Admin dashboard | Not in the user story. |
| Push notifications | Not in the user story. |
| Full multilingual i18n | Catalog display fields are BM-only. The chatbot still respects `profile.language` for replies. |
| Service worker (offline mode) | `next-pwa` was dropped due to a transitive npm bug. Manifest still gives installable behavior. |

---

## Design principles

1. **Buttons minimum 48px tall** — full-width primary CTAs on mobile.
2. **One primary action per screen** — never two competing CTAs.
3. **Icons + text always together** — never icon-only (status pills carry both `✓` and `Layak`).
4. **High contrast** — dark text on light backgrounds, no grey-on-grey.
5. **Bahasa Malaysia as default** — display fields in BM. Strict matcher keys stay in English so the rules engine works.
6. **No jargon** — "Bantuan Wang" not "Financial Assistance Disbursement".
7. **Progress always visible** — the onboarding wizard shows a percentage bar.
8. **Plain-language errors** — "Cuba lagi" not "Error 422".
9. **Confirmation before destructive actions** — profile reset uses `confirm()`.

---

## License

Private project, hackathon submission. Not for redistribution.

## Credits

- **Engineering & UX:** Area 67 team
- **Aid catalog research:** BA1 team (see `research/AREA67_AIDa_BA1_Catalog.docx`)
- **Persona:** Mak Cik Aminah, 58, Klang, Selangor (composite based on real B40 demographics)
