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
| Styling | Tailwind CSS | Mobile-first, standard text sizing (see Design Principles), high contrast |
| Backend | Next.js API Routes | Keep it simple, no separate BE needed |
| Database | PostgreSQL via Prisma ORM | Hosted on AWS RDS (multi-cloud story — Alicloud-hosted Next.js reads cross-cloud). Only `/aids` browse page queries the DB; matcher / chat / dashboard / `/aids/[id]` still read `aids.json` directly. Falls back to `aids.json` when DB is unset or unreachable. |
| AI Matching | Google Gemini API (`gemini-flash-lite-latest`, paid tier) | For aid matching and gap analysis. Free tier capped us at 20 RPD which we burned through in testing — switched to paid (MYR 40 prepaid credit on the Default Gemini Project as of 2026-04-25). Realistic demo cost is ~$0.01 per full session. Both routes moved off `gemini-flash-latest` to **lite** because lite skips the hidden reasoning step that 2.5 Flash spends on every turn, ~halving latency on our lookup-and-rephrase workload. |
| AI Chatbot | Google Gemini API (`gemini-flash-lite-latest`, paid tier) | Originally Claude in the spec; swapped to Gemini after Anthropic credits ran out. Same model + key as matching — shares the project quota. |
| App hosting (primary) | Alibaba Cloud SWAS (Malaysia/KL) | Ubuntu 22 + Nginx → 127.0.0.1:3000 + PM2; live demo URL terminates here. See Deployment section. |
| App hosting (backup) | AWS Amplify (Singapore) | Auto-build from `main` via [amplify.yml](amplify.yml). Stage-safety fallback — same code, no DATABASE_URL set so `/aids` falls back to `aids.json`. |
| Static assets | Alibaba Cloud OSS (Malaysia/KL) | Bucket `aida-assets-67`, public-read. Logos served from `/logo/*`. CDN was dropped (requires custom domain we don't own). |

---

## Project Structure

```
Area-67/
├── CLAUDE.md                  ← You are here (source of truth)
├── .env.local                 ← API keys (never commit this)
├── amplify.yml                ← AWS Amplify build config — installs pnpm globally, then `pnpm install && pnpm build`
├── research/                  ← BA1 source material (aids.json + .docx integration ref)
├── prisma/
│   ├── schema.prisma          ← DB schema (Aid is id+slug+data:Json — see Setup Notes)
│   └── seed.ts                ← Seed script — upserts aids.json into AWS RDS. Run once after `pnpm db:push`.
├── src/
│   ├── app/
│   │   ├── layout.tsx         ← Root layout (PWA meta, fonts)
│   │   ├── page.tsx           ← Splash (auto-advance ~1.5s → /welcome or /dashboard)
│   │   ├── welcome/
│   │   │   └── page.tsx       ← Pre-onboarding landing with "Mula Sekarang" CTA
│   │   ├── onboarding/
│   │   │   └── page.tsx       ← Per-question wizard (eKYC scan path or manual fallback)
│   │   ├── (app)/             ← Route group: shared bottom nav + chat FAB
│   │   │   ├── layout.tsx     ← Renders BottomNav + ChatFab around the 4 tab pages
│   │   │   ├── dashboard/     ← Home tab — total RM hero + 2-col AidCard grid
│   │   │   ├── aids/          ← Bantuan tab — full catalog browse w/ search + categories
│   │   │   ├── insights/      ← Insights tab — mock TnG wallet + AI advice + spending
│   │   │   └── profile/       ← Profil tab — profile fields, language toggle, reset
│   │   ├── aids/[id]/
│   │   │   └── page.tsx       ← Aid detail view (outside (app) — back bar, no bottom nav)
│   │   ├── chat/
│   │   │   └── page.tsx       ← AIDa chatbot screen (outside (app))
│   │   └── api/
│   │       ├── match/route.ts ← Gemini aid matching endpoint
│   │       └── chat/route.ts  ← Gemini chatbot endpoint
│   ├── components/
│   │   ├── OnboardingForm.tsx ← Phase-based wizard (language → MyKad scan/manual → household → children → income)
│   │   ├── MyKadMock.tsx      ← Inline-SVG MyKad card with scan-line animation (no binary asset)
│   │   ├── AidCard.tsx        ← Compact 2-col card + ProviderLogo helper (logo / name / amount / status pill)
│   │   ├── BottomNav.tsx      ← 4-tab fixed nav (Home / Bantuan / Insights / Profil)
│   │   ├── ChatFab.tsx        ← Floating chat button (bottom-right, above nav)
│   │   └── ChatInterface.tsx
│   ├── lib/
│   │   ├── gemini.ts          ← Gemini client + system prompts + deterministic fallback matcher
│   │   ├── logo.ts            ← Aid id → provider PNG path map
│   │   ├── types.ts           ← Aid, UserProfile, MatchedAid (status: eligible|auto|partial)
│   │   └── db.ts              ← Prisma client singleton (seed-only for demo)
│   └── data/
│       └── aids.json          ← 15 aids in BA1 schema — display fields translated to BM (see Seed Data)
└── public/
    ├── manifest.json          ← PWA manifest
    ├── icons/                 ← App icons (icon-192.png + icon-512.png, blue background)
    └── logo/                  ← aida.png (splash logo) + provider logos referenced by src/lib/logo.ts
```

**Route map at a glance:**
- `/` splash → `/welcome` (no profile) or `/dashboard` (has profile)
- `/onboarding` standalone wizard — no nav chrome
- `/dashboard`, `/aids`, `/insights`, `/profile` — share `(app)` layout with bottom nav + chat FAB
- `/aids/[id]` detail — no nav chrome, sticky "Mohon Sekarang" bar at bottom
- `/chat` — full-screen chat, no nav chrome

---

## Core Features (built — current shape)

### 1. Onboarding (per-question wizard with eKYC mock)
- Phase-based state machine in [src/components/OnboardingForm.tsx](src/components/OnboardingForm.tsx). One question per screen with a `history` stack for back navigation.
- **Path A — eKYC scan (default):** language → "Imbas MyKad" entry (tappable [MyKadMock.tsx](src/components/MyKadMock.tsx) — inline-SVG card with scan-line animation, no binary asset) → 2s `mykad-scanning` overlay → `mykad-confirm` step pre-fills name/age/gender/state/religion from a hard-coded mock (Aminah persona — see Demo Script). User can edit any field on the confirm screen. The `mykad-scanning` phase is intentionally **excluded from history** so back from confirm returns to the entry screen, not the loop.
- **Path B — manual fallback:** "Isi sendiri tanpa MyKad" link on the entry screen routes through 5 single-question screens (name → age → gender → state → religion).
- **Both paths converge** on: household size → # children under 18 → monthly income (5 button buckets) → `localStorage["aida.profile"]` → `/dashboard`.
- Why these specific fields: gender unlocks BIB maternal aid, religion unlocks the 4 zakat aids, numChildren drives STR + BKM tier amounts. Skipped from onboarding (kept as defaults): `ekasihRegistered`, `isStrRecipient`, `employmentType` — those let aids stay as `partial` with a "1-step away" fix CTA, which IS the demo's wow moment.

### 2. Home / Aid Matching (`/dashboard`)
- Top: greeting + green gradient hero with summed `max_myr` total ("Anggaran nilai bantuan").
- Body: two `grid grid-cols-2 gap-3` sections — **"Untuk anda"** (matched) and **"Hampir layak"** (near-miss). Both render the same compact `AidCard` (provider logo, aid name 2-line clamp, status pill, RM amount). Reason / gap text is **not shown on the card** — tap to drill into `/aids/[id]` for the full detail.
- Match status pill (top-right of card): `✓ Layak` (eligible/green), `⚡ Auto` (auto-credit/green), `⚠ Hampir` (partial/yellow). Sort still `auto` → `eligible` → `partial`.
- Result cached in `localStorage["aida.match"]` — re-renders instantly on tab switch and powers `/insights` + `/aids/[id]` reasons.
- Aminah persona returns ~9 matched + 5 near-miss; that's the calibration target.

### 3. Aid detail (`/aids/[id]`)
- Outside the `(app)` layout — has its own back bar, no bottom nav, sticky bottom CTA ("Mohon Sekarang →" / "Daftar dahulu →" for partials / "Lihat butiran →" for auto).
- Header carries the provider logo (lg) + aid name. Sections: amount hero card, "Mengapa anda layak" (matched) or "Apa yang kurang" (near-miss), tier breakdown, eligibility criteria (`citizenship: "malaysian"` is mapped to "Warganegara Malaysia" at render time), required documents, application steps, offline options.

### 4. Aids browse (`/aids`)
- All catalog aids in a 2-col `AidCard` grid with text search (matches localized name + provider) and a horizontal category chip filter ("Semua / Tunai / Baucar / Zakat / …"). Status pills inherit the matched/near-miss state from cached `aida.match`.
- **Data source: AWS RDS PostgreSQL via Prisma**, queried by the Server Component at `src/app/(app)/aids/page.tsx` and passed as a prop into the client `AidsBrowse` component. This is the only screen in the runtime path that hits the DB; it's deliberately scoped to give the multi-cloud architecture a real cross-cloud query without putting the AI flow at risk. Falls back to `aids.json` if `DATABASE_URL` is unset or RDS is unreachable.

### 5. AIDa Chatbot
- WhatsApp-style bubbles (green for AIDa, white for user), quick-reply chip suggestions, multilingual (uses `profile.language`).
- **Entry: floating chat FAB** (`<ChatFab>` in the `(app)` layout — bottom-right, above the bottom nav). Visible on all four tab routes; the `/chat` page itself sits outside `(app)` so the FAB doesn't appear there. Replaces the old full-width "Sembang dengan AIDa" bar.
- Powered by Gemini (`gemini-flash-latest`) via `buildAidaSystemPrompt` — see Aid Matching Logic / Chatbot sections below.

### 6. Insights tab (`/insights`) — TnG wallet narrative
- Replaces the "Aid Tracker" idea from earlier scope. Demo angle: aids credited into a Touch 'n Go eWallet, AI reads the (mocked) spending data and gives financial advice.
- Hero: blue TnG wallet card with mocked balance derived from matched aid amounts.
- "Cadangan AIDa" — 3 hard-coded advice cards (win / tip / warn tones). All mocked, no LLM call.
- "Corak perbelanjaan" — static stacked-bar breakdown (groceries / utilities / transport / health / other). Marked as simulated at the bottom of the page.

### 7. Profile tab (`/profile`)
- Reads `aida.profile` from localStorage. Shows demographic summary, language switcher (writes back to `aida.profile`), settings list (Notifikasi / Privasi / Tentang AIDa — display only), and a destructive "Padam profil & mula semula" that clears `aida.profile` + `aida.match` and routes to `/welcome`.

### 8. Splash (`/`)
- White background with the `public/logo/aida.png` mark fading-in + scaling on mount, tagline ("Aid Intelligent & Discovery Assistant") sliding up after a 200ms delay, and a small blue spinner below. Auto-advances after 1500ms. Routes to `/dashboard` if a profile exists, else `/welcome`. Shown every launch (no first-launch flag).

---

## Design Principles

The original target is a user group with LOW digital literacy. The UI/UX overhaul on 2026-04-25 made a deliberate trade against principle #1 below — large-text mode was relaxed in favour of a denser, more polished mobile-app aesthetic for the demo. The other nine principles still hold and are non-negotiable.

1. ~~Text size minimum 16px body, 20px+ for key info, 24px+ for amounts~~ → **Standard sizing throughout** (`text-sm` 14px / `text-base` 16px). The Tailwind extensions `text-body` (18/28), `text-lead` (20/30), `text-amount` (28/36) in `tailwind.config.ts` are **dead code** kept for reference only — do not introduce new uses. The exception is amounts on hero cards (gradient summary on `/dashboard` and `/insights`, amount card on `/aids/[id]`) which still use larger weight for emphasis.
2. **Buttons minimum 48px tall** (Tailwind `min-h-tap`), full-width on mobile for primary CTAs
3. **One primary action per screen** — never two competing CTAs
4. **Icons + text always together** — never icon-only (status pills always carry both glyph and label, e.g. `✓ Layak`)
5. **High contrast** — dark text on light background, no grey-on-grey
6. **Bahasa Malaysia as default** — `aids.json` display fields (rules / steps / docs / amount descriptions / tier labels / income_band) are stored in BM. **Strict matcher keys are kept in English** — `citizenship: "malaysian"`, `religion: "Islam"`, `state: "Selangor"`, `gender: "female"`, `education_status: "enrolled"`, `employment_history: "former_civil_servant"`. Changing those breaks `fallbackMatch` in `gemini.ts`. The detail page renders `"malaysian"` as "Warganegara Malaysia" via a small render-side mapper.
7. **No jargon** — "Bantuan Wang" not "Financial Assistance Disbursement"
8. **Progress is always visible** — show where they are in any multi-step flow (onboarding wizard has a percentage-based bar driven by phase → progress map)
9. **Error messages in plain language** — "Cuba lagi" not "Error 422"
10. **Confirmation before any action** — never silent submissions (see profile reset which uses `confirm()`)

**Brand palette (post 2026-04-25 refresh):** primary brand shifted from green to blue. Tailwind tokens are `aida.blue` `#2563eb` / `aida.blueDark` `#1e40af` / `aida.blueLight` `#dbeafe` (defined in `tailwind.config.ts`); the PWA `theme_color` and viewport `themeColor` are both `#2563eb`. The old `aida.green*` tokens have been removed — anything referencing them won't compile. Two non-brand accents intentionally kept: `/insights` "win"-tone advice card uses `emerald-50/100/900` and the "Barangan dapur" spending bar uses `bg-emerald-500`, so the green isn't load-bearing on brand.

---

## API Keys Needed (.env.local)

```bash
# AI — only Gemini is required for the demo flow.
# This key MUST belong to the same Google Cloud project that has billing
# enabled (currently "Default Gemini Project" with MYR 40 prepaid). A key
# from a different project still works but reverts to the 20-RPD free tier.
GEMINI_API_KEY=your_key_here

# Database — points at AWS RDS PostgreSQL in production. The /aids browse
# page (Server Component) queries this; the matcher, chat, dashboard, and
# /aids/[id] detail still read from src/data/aids.json at module level.
# When unset OR unreachable, the browse page falls back to aids.json so the
# app still runs end-to-end without it (used for local dev + stage safety).
# Multi-cloud demo posture: Next.js on Alicloud SWAS → cross-cloud read → AWS RDS.
DATABASE_URL=postgresql://user:password@host:5432/aida?sslmode=require

# Static assets — base URL for /logo/* image references. Empty/unset uses the
# local /public folder (dev). In prod, point at Alicloud OSS+CDN domain so
# logos and aida.png are served from the CDN edge.
# e.g. https://cdn.aida.example.com  (no trailing slash)
NEXT_PUBLIC_ASSETS_URL=

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

## Deployment

AIDa runs across two clouds for the multi-cloud demo posture. SWAS is the live demo URL; everything else supports it.

| Layer | Cloud | Service / instance | Live target |
|-------|-------|--------------------|-------------|
| Compute (primary) | Alibaba Cloud | SWAS `Ubuntu-kjyq` (Malaysia/KL) — Nginx → PM2 → `pnpm start` | http://47.250.136.5 |
| Compute (backup) | AWS | Amplify app `aida-backup` (Singapore, ap-southeast-1) | https://main.\<id>.amplifyapp.com |
| Static assets | Alibaba Cloud | OSS bucket `aida-assets-67` (Malaysia, ap-southeast-3, public-read) | https://aida-assets-67.oss-ap-southeast-3.aliyuncs.com/logo/* |
| Database | AWS | RDS PostgreSQL `aida-db` (Malaysia, ap-southeast-5, db.t3.micro) | aida-db.czgkk84ugb79.ap-southeast-5.rds.amazonaws.com:5432 |

**Cross-cloud query path:** SWAS-hosted Next.js → AWS RDS over public internet (`sslmode=require`). RDS security group whitelists only the SWAS public IP (`47.250.136.5/32`). Only `/aids` browse uses it; matcher / chat / dashboard / `/aids/[id]` still import `aids.json` directly so the AI hot path never round-trips to the DB.

**Env vars per instance:**
- **SWAS** (`/opt/aida/.env.local`): full set — `GEMINI_API_KEY`, `DATABASE_URL` (with `?sslmode=require`), `NEXT_PUBLIC_ASSETS_URL` pointing at the OSS bucket.
- **Amplify** (Amplify console → Environment variables): only `GEMINI_API_KEY` and `NEXT_PUBLIC_ASSETS_URL`. `DATABASE_URL` is **deliberately omitted** — Amplify build hosts have no stable IPs to whitelist in the RDS SG, and opening RDS to `0.0.0.0/0` is a security trade we declined to make. The Server Component at `/aids` short-circuits to `aids.json` when `DATABASE_URL` is unset, so the Amplify deploy renders the same catalog without the cross-cloud hop.

**SWAS redeploy procedure** (after a `git push origin main`):
```bash
ssh root@47.250.136.5
cd /opt/aida && git pull && pnpm install && pnpm build && pm2 restart aida
```
Note: any change to `NEXT_PUBLIC_*` env vars requires a rebuild (Next.js inlines them at build time). Server-only env vars like `DATABASE_URL` and `GEMINI_API_KEY` only need `pm2 restart aida`.

**Amplify redeploy:** push to `main` — GitHub webhook fires → Amplify auto-builds via `amplify.yml`. ~5–8 min per build.

**Nginx config** lives at `/etc/nginx/sites-available/aida` on the SWAS box — single `server` block on port 80, reverse-proxies everything to `127.0.0.1:3000`, 120s timeouts (matcher takes 5–15s on Gemini).

**No HTTPS yet.** SSL would require a domain (Let's Encrypt won't issue for bare IPs). DuckDNS or a $1 .xyz are the cheap paths if needed; we declined for hackathon expediency.

---

## Setup Notes (gotchas we hit during build)

These are non-obvious things future-you (or another dev) will trip on. Read before starting fresh.

- **Use pnpm, not npm.** This repo was scaffolded on Node 25 + npm 11, where npm's Arborist crashes on this dep tree (`Cannot read properties of null (reading 'matches')`). pnpm installs cleanly. Use `pnpm install` / `pnpm dev` / `pnpm build`.
- **`next-pwa` was removed from the spec.** Same npm bug above was triggered by next-pwa's old transitive tree. The manifest + theme color tags still give installable-PWA behavior; the offline service worker is the only thing missing. Re-add later if needed.
- **Restart `pnpm dev` after editing `.env.local`.** Next reads env vars once at server start. Symptoms of forgetting: chat returns the offline fallback even though your key is set.
- **Gemini model name: `gemini-flash-lite-latest`.** Both `/api/match` and `/api/chat` use the **lite** variant (swapped 2026-04-25). `gemini-1.5-flash` was retired from the v1beta endpoint in April 2026, and we moved off `gemini-flash-latest` because Flash 2.5 spends hidden reasoning tokens on every turn — lite skips that and is roughly 2× faster on our lookup-and-rephrase workload. If you ever want to A/B against full Flash, change the literal in `src/lib/gemini.ts` (it appears once in `matchAids` and once in `chatWithAida`). Match runs at `temperature: 0.1`, chat at `0.6`.
- **`maxOutputTokens` for chat is back to 512.** With Flash 2.5 we had to inflate to 2048 because hidden reasoning ate the budget and replies truncated mid-sentence. Lite has no thinking step so 512 is plenty. If you ever swap chat back to full Flash, bump this back up. Set in `src/lib/gemini.ts`.
- **"fetch failed" from inside Next dev** = corporate MITM proxy intercepting HTTPS. The SDK wraps the underlying TLS error as a generic fetch failure with no `cause`. Fix by adding `NODE_TLS_REJECT_UNAUTHORIZED=0` to `.env.local` (dev only) or installing the corp CA via `NODE_EXTRA_CA_CERTS`.
- **Both AI routes have offline fallbacks.** `/api/match` uses a deterministic rule-based matcher (parses `income_band` strings, gates on state/religion/age/gender/employment/education, treats missing registrations as `partial` with templated gap fixes from the BA's docx §B2). `/api/chat` returns a friendly multilingual "Maaf, saya tersengkang sekejap…" reply. The demo flow always renders something, never a blank screen.
- **Gemini free tier = 20 requests/day per project.** Easy to burn during a testing session. Symptoms: `429 Too Many Requests` in the dev server console + `/api/match` returns in <1s (fallback). Resets at midnight Pacific. We've moved to paid tier — see Tech Stack — but if you swap keys to a non-billed project you'll hit the wall again.
- **Prisma schema is intentionally schema-light.** `Aid` model is just `id + slug + data: Json` — the BA's rich aid catalog (multilingual names, tiered amounts, structured eligibility) lives inside the JSON column. Catalog updates don't require a migration. The `/aids` browse page is the **only** runtime consumer (Server Component, `dynamic = 'force-dynamic'`); other screens still import `aids.json` directly so the AI hot path never round-trips to the DB. The browse page wraps the `findMany()` in try/catch and falls back to `aids.json` if RDS is unreachable — keeps the demo from going blank if the cross-cloud connection flakes on stage.
- **localStorage caching matters for cost AND UX.** First dashboard visit hits Gemini (~5–15s); the result is cached as `aida.match` and any subsequent load is instant. For a clean live demo, clear `aida.profile` + `aida.match` before going on stage so onboarding fires fresh. For cost control, this means each unique demo persona costs ~$0.01–0.02 of Gemini spend, not $0.01 × every page view.
- **Slim prompt to Gemini.** `matchAids` runs each aid through `slimAidForMatching` before sending to the LLM — drops UI-only fields (multilingual names, amounts, application steps, source URLs). Cuts the prompt from ~30KB to ~10KB. The dashboard re-hydrates the full Aid objects from `aids.json` by id when rendering; keep that in mind if you ever change the slim shape.
- **Next.js was bumped to 14.2.35** for a security patch flagged by pnpm during install. App Router APIs unchanged from 14.2.
- **Amplify's default build container has no `pnpm`.** First Amplify build failed with `pnpm: command not found` at the preBuild phase. Fix: [amplify.yml](amplify.yml) at the repo root installs pnpm globally (`npm install -g pnpm`) before running `pnpm install` + `pnpm build`. If you ever rebuild this on a different CI provider, replicate that step.
- **Amplify deliberately runs without `DATABASE_URL`.** Amplify build/run hosts don't have stable IPs we can whitelist in the RDS security group, and opening RDS to `0.0.0.0/0` was a security trade we chose not to make. The `/aids` Server Component short-circuits to `aids.json` when `DATABASE_URL` is unset — same data, no cross-cloud hop. Demo framing: "primary deploy on SWAS hits RDS cross-cloud; backup deploy on Amplify uses local catalog as stage-safety fallback."
- **OSS bucket is public-read with files at `/logo/<file>.png`.** Watch for the double-`logo/` trap on first upload: dragging the local `public/logo/` folder into a freshly-created `logo/` folder in the OSS console nests it as `logo/logo/aida.png`. Files must live one level deep (`logo/aida.png`) for the `NEXT_PUBLIC_ASSETS_URL` + `${ASSET_BASE}/logo/${file}` pattern in [src/lib/logo.ts](src/lib/logo.ts) to resolve.

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

1. Open app on phone (or phone-sized browser window). **Splash** plays for ~1.5s — green screen with "AIDa" logo and tagline.
2. Splash auto-advances to **Welcome** — clean, Malay, one big button "Mula Sekarang".
3. Onboarding as Mak Cik Aminah — **two paths to demo**:
   - **eKYC path (default, more impressive):** pick **Bahasa Malaysia** → tap the MyKad mock card → 2s scan animation → confirmation screen pre-fills name/age/gender/state/religion (note: the MyKad mock is hard-coded to the Aminah persona). Tap "Sah & Teruskan".
   - **Manual path (if asked):** "Isi sendiri tanpa MyKad" link → 5 quick screens (name "Aminah", umur 58, jantina Perempuan, negeri Selangor, agama Islam).
   - Either path then: isi rumah **3**, anak di bawah 18 **1**, pendapatan **RM1,000 – RM2,000**.
4. Hit **Home** (`/dashboard`) — pause here, let the AI result load visibly (typically 5–15s on Gemini paid tier; the app caches to localStorage so any re-open is instant). Hero shows a big **RM ___** total, then a 2-col grid of cards.
5. Say: "In seconds, AIDa found 9 programs Aminah qualifies for, worth thousands of ringgit a year — and crucially, she's never heard of most of them. Three are auto-credited or eligible right now. Six more she's '1 step away' from — see these yellow ⚠ Hampir cards? Tap one and AIDa shows exactly what she needs: register on eKasih. One link, one form."
6. Tap a card to show `/aids/[id]` detail (provider logo, eligibility, application steps in BM, sticky "Mohon Sekarang"). Back.
7. Tap the **Insights tab** in the bottom nav — show the mock TnG wallet card and the AI advice ("Anda menjimatkan RM320 bulan ini") to set up the Touch 'n Go ecosystem story.
8. Tap the **chat FAB** (bottom-right green button), type **"macam mana nak mohon STR?"** in Malay → show AIDa replying in BM with the application steps from the catalog.
9. Show architecture slide — AWS Amplify + Gemini + Alibaba Cloud PAI/CDN.

**Time target: 3 minutes demo, 2 minutes Q&A**

**Pre-demo checklist:**
- Restart `pnpm dev` so env vars load fresh
- Do one full onboarding run-through earlier in the day to warm Gemini and verify quota
- Clear `localStorage` (`aida.profile` + `aida.match` keys) before the live demo so it onboards fresh on stage
- Have https://aistudio.google.com/app/apikey open in another tab in case the API key needs swapping

---

## What NOT to build (scope cuts for hackathon)

- ❌ User authentication / login (use localStorage)
- ❌ Real document upload (eKYC is a mock — `MyKadMock.tsx` is inline SVG, no camera permission is requested)
- ❌ Real wallet integration — the TnG wallet on `/insights` is a static UI mock. Don't wire it to a real API; the demo intent is to communicate the Touch 'n Go ecosystem story, not to transact.
- ❌ Real spending / transaction data — `/insights` "Corak perbelanjaan" and "Cadangan AIDa" are hard-coded; footnote on the page says so.
- ❌ Admin dashboard
- ❌ Real-time notifications
- ❌ Full multilingual i18n — display fields in `aids.json` are BM-only. The other localized fields (`name.{en,zh,ta}`) still exist for the chatbot's `profile.language` switch but the catalog body fields aren't translated to en/zh/ta.
