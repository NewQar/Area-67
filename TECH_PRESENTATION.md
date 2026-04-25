# AIDa — Tech Stack Presentation

**Talk track for the technical portion of the AIDa demo (~3 minutes).**
Frame: every architectural decision traces back to our user, Mak Cik Aminah.

---

## Built for Mak Cik Aminah

> Aminah is 58. She lives in Klang. She has a 4-year-old Android phone, a patchy 4G signal, and zero patience for an app that wastes her data.
>
> Every decision in our stack started there.

---

## Act 1 — The user defines the architecture

That's why AIDa is a **PWA built on Next.js 14**, not a native app. She doesn't go to the Play Store — she taps a link, gets prompted to install, and AIDa lives on her home screen like any other app. No 80MB download. No Google account. Works offline for the screens that matter.

And because she reads in Bahasa Malaysia, the entire catalog, every prompt, every error message is BM-first. The display fields in our aid catalog are stored in BM directly — translation isn't a layer, it's the source of truth.

**Stack choices in this act:**

| Choice | Why |
|---|---|
| Next.js 14 PWA | Installable like an app, no app-store friction, works on low-end Android |
| TypeScript + Tailwind | Velocity for a 48-hour build; mobile-first by default |
| Bahasa Malaysia first | Display fields stored in BM in `aids.json`; matcher keys stay in English so the rule engine doesn't break |

---

## Act 2 — Two clouds, one story

> We deliberately built AIDa to run across two clouds. Not for buzzword bingo — because each cloud is doing something the other can't.

**Alibaba Cloud, Malaysia region** is our primary.
The Next.js app runs on a SWAS instance in Kuala Lumpur, behind Nginx and PM2. Static assets — every provider logo, the splash mark — sit on Alibaba **OSS** in the same region. When Aminah opens AIDa, the round-trip never leaves Malaysia. That matters for latency and it matters for the data-residency conversation we'll inevitably have with a government partner.

**AWS, Malaysia region** is where the data lives.
Our aid catalog — 15 programs today, hundreds tomorrow — sits in **PostgreSQL on RDS**, accessed through **Prisma**. When you tap "Bantuan" to browse the full catalog, that page is a Next.js Server Component that reaches across clouds — Alibaba compute → AWS database — over a TLS-encrypted public link, with the database's security group whitelisting only our SWAS instance's IP.

> That's our multi-cloud story in one sentence:
> **compute close to the user, data close to the source of truth, and one cross-cloud query that proves the seam works.**

We also keep a backup deploy on **AWS Amplify in Singapore** — same code, auto-built from `main`. If KL goes dark mid-demo, we cut over in seconds.

**Stack choices in this act:**

| Layer | Cloud | Service | Why |
|---|---|---|---|
| Compute (primary) | Alibaba Cloud | SWAS, Kuala Lumpur | Latency + data residency for Malaysian users |
| Static assets | Alibaba Cloud | OSS, Kuala Lumpur | Same region as compute, public-read bucket |
| Database | AWS | RDS PostgreSQL, Malaysia | Managed Postgres, point-in-time recovery, structured catalog queries |
| Backup compute | AWS | Amplify, Singapore | Stage-safety failover; auto-built from `main` |
| ORM | — | Prisma | Type-safe queries; schema-light `Aid = id+slug+data:Json` so catalog updates skip migrations |

---

## Act 3 — The AI layer, and why it's cheap

> The magic moment — Aminah seeing nine programs she qualifies for — is powered by Google Gemini Flash Lite.

**Two reasons we chose Lite over the full Flash model:**

1. **It's roughly twice as fast** on our workload, because Lite skips the hidden reasoning step. We don't need a model that thinks — we need one that reads a profile, scans a catalog, and rephrases. Lite is purpose-fit.
2. **It's cheap.** A full demo session costs about one cent. That's structural — it means AIDa can scale to a million users without the AI bill becoming the story.

We use Gemini for two things:

- **The matcher** — which aids is Aminah eligible for, and why
- **The chatbot** — answering her in Malay with steps pulled directly from our catalog

Same model, same key, two prompts.

> And here's the part I'm most proud of: **when Gemini fails — quota, network, anything — the demo doesn't break.**

We have a deterministic rule-based matcher as a fallback that produces the same shape of result. Aminah always sees her aids. The only thing she loses is the LLM-rephrased reason text.

---

## Act 4 — The cost-aware shortcuts

A few small things that punch above their weight:

- **localStorage caching.** First match call hits Gemini. Every subsequent visit is instant and free. That's the difference between a one-cent session and a one-dollar session.
- **A slimmed prompt.** We strip UI-only fields out of the catalog before sending it to Gemini — drops the prompt from 30KB to 10KB and re-hydrates the full data on the client. Same answer, less spend.
- **JSON-as-DB fallback.** Our catalog ships as a static `aids.json` file inside the build. If RDS is unreachable, the browse page falls back to JSON automatically. The demo always works.

---

## Closing

> So that's our stack. Next.js PWA on Alibaba Cloud KL, PostgreSQL on AWS Malaysia, Gemini Flash Lite for AI, all glued with Prisma and a lot of cache.
>
> But the real architecture isn't the boxes and arrows. It's that **every box on this diagram has a reason that traces back to Aminah** — her phone, her language, her bandwidth, her trust.
>
> That's what we built.

---

## Appendix — Architecture at a glance

```
                    Mak Cik Aminah's phone
                            │
                            ▼
            ┌───────────────────────────────┐
            │   AIDa PWA (Next.js 14)       │
            │   installed to home screen    │
            └───────────────┬───────────────┘
                            │  HTTPS
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌───────────┐      ┌─────────────┐     ┌──────────────┐
  │ Alibaba   │      │ Alibaba OSS │     │ Google       │
  │ SWAS (KL) │      │ (KL)        │     │ Gemini API   │
  │ Next.js + │      │ logos, PWA  │     │ flash-lite   │
  │ PM2 +     │      │ icons       │     │ matcher+chat │
  │ Nginx     │      └─────────────┘     └──────────────┘
  └─────┬─────┘
        │ cross-cloud
        │ TLS, IP-whitelisted
        ▼
  ┌──────────────────────┐         ┌────────────────────┐
  │ AWS RDS PostgreSQL   │         │ AWS Amplify (SG)   │
  │ Malaysia region      │         │ backup deploy,     │
  │ aid catalog          │         │ auto from `main`   │
  └──────────────────────┘         └────────────────────┘
```

**Failure-mode behavior (the demo never breaks):**

| If this fails… | …AIDa falls back to | User sees |
|---|---|---|
| Gemini API | Deterministic rule-based matcher in `gemini.ts` | Same matched aids, less polished reason text |
| AWS RDS | Bundled `src/data/aids.json` | Same 15 aids, no cross-cloud hop |
| Alibaba SWAS | AWS Amplify backup deploy | Same app, no cross-cloud DB read |
| Alibaba OSS | `public/` folder served by Next.js | Same logos, served from origin |
