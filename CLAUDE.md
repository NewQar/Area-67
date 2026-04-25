# CLAUDE.md — AIDa Project Source of Truth

> **Read this file first, every session, before generating code.** This is the single source of truth for the AIDa project. If anything in this file conflicts with a request, ask before deviating.

---

## 1. Project Identity

- **Event**: TNG Digital Finhack 2026 (36-hour hackathon)
- **Track**: Financial Inclusion
- **Product Name**: **AIDa** — your personal aid case worker
- **Tagline**: *"Aid that finds you, not the other way around."*
- **Prize at stake**: RM 25,000

### Problem in one line
Eligible Malaysians leave aid on the table because they can't find it, understand it, or access it without help.

### Our solution in one line
A mobile-first, AI-powered companion that **discovers, matches, tracks, and walks low-income Malaysians through every aid, zakat, and subsidy they qualify for** — with a WhatsApp-style chatbot in BM, EN, 中文, and தமிழ்.

### Non-negotiable user principles
1. **Low digital literacy first.** If a screen needs explaining, redesign it.
2. **No dead ends.** Every screen tells the user what to do next.
3. **The chatbot is the safety net.** Stuck anywhere? Tap AIDa.
4. **Trust > features.** No dark patterns, no upsells, plain language.
5. **Multilingual from day one.** BM and EN are baseline; 中文 + தமிழ் are first-class.

---

## 2. Six Core Features (memorize these)

| # | Feature | One-liner | Acquisition / Retention |
|---|---|---|---|
| 1 | **Educate / Access** | Browsable directory of every aid, with criteria + step-by-step | Acquisition |
| 2 | **Matching Assistant** | AI matches user profile to aids, identifies criteria gaps, suggests next steps | Acquisition |
| 3 | **Aid Tracker** | Track applied / eligible-but-not-applied / renewals due, with document checklist | Retention |
| 4 | **Aid Connectivity** | Deep links + step-by-step walkthroughs to the official application portal | Retention |
| 5 | **AIDa Chatbot** | WhatsApp-style case worker; multilingual; can guide inside or outside the app | Retention |
| 6 | **Insight & Analysis** | Aggregate (anonymized) data → curated programs + government policy input | Retention + B2G value |

### Monetization (back-pocket pitch)
Approved aid → TNG eWallet → spent at SME merchants in TNG-curated SARA-style program → MDR/transaction fee revenue + SME economic uplift + dignity-preserving spend control. **Three-sided win**: user, SME, TNGD.

---

## 3. Judging Criteria → How We Score

The judging criteria are: **AI & Intelligent Systems, Technical Implementation, Multi-Cloud Service Usage, Impact & Feasibility, Presentation & Teamwork.**

| Criterion | How AIDa wins it |
|---|---|
| AI & Intelligent Systems | Two distinct AI surfaces: (a) **matching engine** that reasons over user profile + aid criteria + identifies gaps, (b) **AIDa chatbot** — multilingual, RAG-grounded on aid database, role-play as case worker. |
| Technical Implementation | Production-shipped PWA, real deployed URL, real DB, real auth, observability dashboard, CI/CD. **Not a Figma demo.** |
| Multi-Cloud Service Usage | **AWS** = AI + compute + storage. **Alibaba Cloud** = data layer + analytics + edge delivery. Documented justification (see §6). |
| Impact & Feasibility | Real Malaysian aids (STR 2026, SARA, eKasih, Zakat, JKM, MySalam, OKU, BIB) loaded with real criteria. Calculated TAM. Day-1 partnership story with TNGD. |
| Presentation & Teamwork | Live demo on real device. Each member owns a slot in the pitch. Documentation quality reflected in this folder. |

---

## 4. Tech Stack (locked)

### Frontend
- **Framework**: Next.js 15 (App Router) as a **PWA**
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand (lightweight) + TanStack Query (server state)
- **i18n**: `next-intl` — strings in BM, EN, ZH, TA from day 1 (BM + EN done, ZH + TA via auto-translate fallback acceptable for demo)
- **Forms**: react-hook-form + zod
- **Icons**: lucide-react
- **PWA**: `next-pwa` with offline shell + installable manifest

### Backend
- **API**: Next.js Route Handlers (`/api/*`) for the MVP — **no separate BE service**. Speed > microservices in a hackathon.
- **Auth**: Supabase Auth (magic link + phone OTP) **OR** Clerk if Supabase phone OTP gives trouble. Default: Supabase.
- **Database**: Supabase Postgres (hosted, free tier, includes Auth + Row-Level Security)
- **ORM**: Drizzle ORM (lightweight, type-safe, hackathon-friendly)
- **File storage**: Supabase Storage for uploaded documents
- **Background jobs**: Postgres triggers for the MVP; if time permits, Trigger.dev free tier

### AI Layer (this is critical — read carefully)
**Primary AI provider: AWS Bedrock with Anthropic Claude.**

- **Why not Gemini free tier?** Bedrock counts as cloud usage and ties directly to a judging criterion (Multi-Cloud). Free tier API calls do not. We have USD 250 in AWS credits — Bedrock pay-per-token is cheap enough that this lasts the whole hackathon comfortably.
- **Model selection on Bedrock**:
  - `claude-haiku-4-5` for the chatbot (fast, cheap, good at multilingual)
  - `claude-sonnet-4-5` for the matching engine (better reasoning over criteria)
- **Fallback**: If Bedrock model access takes too long to enable in `ap-southeast-1` (Singapore), pivot to Gemini API — but Bedrock is plan A.
- **Pattern**: All AI calls go through one server-side helper `lib/ai/bedrock.ts` so swapping providers is one file.
- **RAG**: Aid catalog is small (~50–100 entries). Embed and store in Postgres with `pgvector`. No external vector DB needed.

### Cloud (multi-cloud — see §6 for the full breakdown)
- **AWS** (USD 250 credit, ap-southeast-5 Malaysia + ap-southeast-1 Singapore for Bedrock)
- **Alibaba Cloud** (USD 300 credit, ap-southeast-3 Malaysia only)

---

## 5. Repository Layout

```
aida/
├── CLAUDE.md                    ← you are here, read first
├── README.md                    ← public-facing readme for judges + GitHub
├── docs/
│   ├── research/                ← BA outputs (aid catalog, personas)
│   ├── cloud/                   ← DevOps runbooks
│   ├── dev/                     ← Dev guides + ADRs
│   ├── design/                  ← UX flows, screen inventory
│   └── business/                ← Pitch deck source, monetization model
├── apps/
│   └── web/                     ← Next.js PWA (frontend + API)
│       ├── app/                 ← App Router
│       ├── components/
│       ├── lib/
│       │   ├── ai/              ← Bedrock client, prompts, matching engine
│       │   ├── db/              ← Drizzle schema, migrations
│       │   └── i18n/
│       ├── public/
│       └── messages/            ← i18n JSON (en.json, ms.json, zh.json, ta.json)
├── packages/
│   └── aid-catalog/             ← The seed data (JSON) of all Malaysian aids
└── infra/
    ├── aws/                     ← Terraform / CDK for AWS resources
    └── alicloud/                ← Terraform for Alibaba resources
```

---

## 6. Multi-Cloud Architecture (read this carefully — judges WILL ask)

### Principle: each cloud earns its place
Don't split things artificially. Each cloud has services it's genuinely better at — that's our justification.

### AWS owns: AI + the user-facing application
- **Amazon Bedrock** (`ap-southeast-1` Singapore — Bedrock isn't in Malaysia region yet) — Claude Haiku + Sonnet for chatbot and matching
- **Amazon S3** (`ap-southeast-5` Malaysia) — User document uploads (MyKad photo, payslip)
- **Amazon Textract** (`ap-southeast-1`) — OCR on uploaded MyKad / utility bills to auto-fill the onboarding form (huge UX win for low-literacy users)
- **Amazon Comprehend** (`ap-southeast-1`) — PII detection + redaction before logging
- **Amplify Hosting** OR **Vercel** for the PWA — **(we lean Vercel for speed; if a judge asks, Vercel for FE, AWS for AI/data plane is a legit modern split)**
- **CloudWatch** — logs, alarms

### Alibaba Cloud owns: data, analytics, and Malaysian-region edge
- **ApsaraDB RDS for PostgreSQL** (`ap-southeast-3` Malaysia) — **primary application DB**, in-country for data residency story (this matters for a financial inclusion pitch)
- **Object Storage Service (OSS)** — backup of S3 documents + static assets
- **AnalyticDB** OR **MaxCompute** — the **Insight & Analysis** feature. Aggregate anonymized application data → policy dashboard for Gov / TNGD partner view
- **CDN** — serve the PWA static assets to Malaysian users from edge nodes in-country
- **Quick BI** — pre-built dashboard for the demo (saves us building one)

> ⚠️ Per the briefing: MaxCompute + DataWorks are restricted on the hackathon Alibaba accounts. **Use AnalyticDB for PostgreSQL instead** — it's a managed columnar DB that works for the analytics story without those restrictions. If even AnalyticDB isn't accessible, fall back to a simple read-replica of RDS Postgres with a materialized view + Quick BI.

### The justification line for the pitch
> "AWS gives us the best AI primitives — Bedrock with Claude for reasoning, Textract for OCR. Alibaba Cloud gives us in-country data residency on Malaysian soil through ap-southeast-3, plus a turnkey analytics stack for the policy-insights feature. Each cloud earns its place; neither is decoration."

---

## 7. Data Model (v1)

```
User
  id, phone, email, language, created_at
  
UserProfile  (the "matching key")
  user_id, full_name, ic_number (encrypted), dob, state, district,
  household_income_band, household_size, num_children, num_elderly,
  employment_status, religion, disability_status, ekasih_registered,
  is_single_parent, education_level, current_aids (jsonb)

Aid  (the catalog — seeded by BAs)
  id, slug, name_ms, name_en, name_zh, name_ta,
  provider (e.g. "LHDN", "JKM Selangor", "LZS"),
  category (cash | groceries | medical | education | housing | business),
  is_recurring (bool), application_window (jsonb),
  amount_min, amount_max, amount_description,
  eligibility_criteria (jsonb structured),
  required_documents (text[]),
  application_url, application_steps (jsonb),
  source_urls (text[]), last_verified_at

Application  (one row per user × aid attempt)
  id, user_id, aid_id, status (eligible | applied | approved | rejected | renewal_due),
  applied_at, decision_at, next_action, notes

ChatMessage
  id, user_id, role (user | aida), content, lang, created_at,
  metadata (jsonb — citations, suggested actions)

Document
  id, user_id, type (mykad | payslip | utility_bill | other),
  s3_key, ocr_extracted (jsonb), uploaded_at
```

Row-Level Security: every table that has `user_id` enforces `user_id = auth.uid()`.

---

## 8. The 36-Hour Plan (timeboxed)

| Hour block | Focus | Owner |
|---|---|---|
| 0–3 | Kickoff, account setup, repo init, BA research starts | Everyone |
| 3–8 | Aid catalog v1 (top 15 aids) seeded; auth + onboarding flow shell; cloud accounts ready | BA + Dev + DevOps |
| 8–16 | Matching engine working on 15 aids; chatbot v1 (EN+BM); UI for top 5 screens | Dev (with PM) |
| 16–22 | Tracker + Connectivity + Documents/OCR; deploy to staging URL | Dev + DevOps |
| 22–28 | Polish, multilingual, analytics dashboard, **end-to-end demo dry run** | Everyone |
| 28–32 | Pitch deck, demo video recording, deployment hardening | BA + PM |
| 32–36 | Buffer, GitHub README, submission form fill, second dry run | Everyone |

**Hard rule**: by Hour 22 we must have a publicly reachable URL. Anything still broken after Hour 22 gets cut, not fixed.

---

## 9. Working with Claude Code

When you (the developer) prompt Claude Code, follow these rules to keep the codebase consistent:

1. **Always start a session with**: `Read CLAUDE.md and the relevant files in /docs/dev before making changes.`
2. **Constraint reminders to put in every big prompt**:
   - "Use Next.js App Router, server components by default."
   - "Use Drizzle, not Prisma. Use shadcn/ui components, not custom CSS."
   - "All AI calls go through `lib/ai/bedrock.ts`. Don't import the AWS SDK directly elsewhere."
   - "All user-facing strings must be in `messages/*.json`, not hardcoded."
3. **Test as you go**: ask Claude to write a quick smoke test or curl example after each major piece. We can't afford "works on my laptop" the morning of the demo.
4. **Don't let Claude balloon the stack**. If it suggests Redis, Kafka, microservices — say no. Hackathon scope.
5. **Commit often, commit small.** Every working feature = a commit. We will not have time to debug a 4-hour mega-commit.

See `docs/dev/DEVELOPER_GUIDE.md` for the full developer playbook.

---

## 10. Submission Checklist (do not skip)

Per the briefing image, we submit via Google Form with these deliverables:

- [ ] Team Name
- [ ] Project Name (AIDa), Description, Track (Financial Inclusion)
- [ ] Implementation & Inspiration writeup
- [ ] **Pitch Deck Link** (Google Slides, public view)
- [ ] **Demo Video Link** (YouTube unlisted, ≤ 3 min)
- [ ] **Deployment Link** (live URL, working on mobile)
- [ ] **GitHub Repository Link** (public, with README)

The pitch deck must hit all 5 judging criteria explicitly. The demo video must show a real user journey on a phone, not a screen recording of localhost.

---

## 11. Key Decisions Already Made (don't relitigate during the hack)

These were debated and locked. Don't waste 30 minutes redebating at hour 14.

- ✅ PWA, not native app
- ✅ Next.js full-stack, not separate FE + BE
- ✅ AWS Bedrock + Claude for AI, not Gemini
- ✅ Supabase for auth + DB primary
- ✅ Alibaba RDS Postgres for the data-residency story (replicated from Supabase OR primary — see DevOps runbook for final call)
- ✅ Tailwind + shadcn, no custom design system
- ✅ Drizzle, not Prisma
- ✅ English + Bahasa Malaysia at parity. ZH + TA acceptable as auto-translated for v1
- ✅ Demo persona: **"Mak Cik Aminah, 58, single, lives in Klang, household income RM1,800/month, has 2 dependent children"** — every screenshot in the pitch uses her

---

## 12. Glossary (so judges and team agree)

- **STR** — Sumbangan Tunai Rahmah (federal cash aid)
- **SARA** — Sumbangan Asas Rahmah (basic needs MyKad credit)
- **eKasih** — National Poverty Database (the registry)
- **B40** — Bottom 40% of Malaysian household income
- **Asnaf** — One of 8 categories eligible for Zakat
- **Had Kifayah** — Minimum living threshold used by Lembaga Zakat
- **JKM** — Jabatan Kebajikan Masyarakat (welfare dept)
- **LZS / PPZ / MAIWP** — State zakat boards (Selangor / WPKL / Federal Territory)
- **OKU** — Orang Kurang Upaya (persons with disabilities)
- **MDR** — Merchant Discount Rate (transaction fee, our monetization vehicle)
