# Project File Map

> What should exist in the repo by the end of each prompt. Use this to verify Claude Code didn't skip anything.

---

## At project start (before any prompts)

```
aida/
├── CLAUDE.md
├── README.md
├── docs/
│   ├── dev/
│   │   ├── DEVELOPER_GUIDE.md
│   │   └── DEMO_DAY.md
│   ├── cloud/
│   │   └── CLOUD_RUNBOOK.md
│   ├── research/
│   │   └── BA_RESEARCH_GUIDE.md
│   ├── business/
│   │   └── PM_PLAYBOOK.md
│   └── design/
│       └── DESIGN_PRINCIPLES.md
└── packages/
    └── aid-catalog/
        └── aids.json
```

---

## After Prompt 01 (Repo Bootstrap)

```
aida/
├── CLAUDE.md
├── README.md
├── docs/                                    [from before]
├── packages/aid-catalog/aids.json           [from before]
├── package.json                             [NEW - workspace root]
├── pnpm-workspace.yaml                      [NEW]
├── .gitignore                               [UPDATED]
└── apps/
    └── web/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx                     [placeholder]
        │   └── globals.css
        ├── components/
        │   ├── ui/                          [shadcn components]
        │   │   ├── button.tsx
        │   │   ├── card.tsx
        │   │   ├── input.tsx
        │   │   ├── label.tsx
        │   │   ├── select.tsx
        │   │   ├── dialog.tsx
        │   │   ├── sheet.tsx
        │   │   ├── drawer.tsx
        │   │   ├── toast.tsx
        │   │   ├── skeleton.tsx
        │   │   ├── progress.tsx
        │   │   ├── badge.tsx
        │   │   ├── avatar.tsx
        │   │   ├── tabs.tsx
        │   │   └── separator.tsx
        │   └── feature/                     [empty placeholder]
        ├── lib/
        │   ├── ai/
        │   │   ├── index.ts
        │   │   └── prompts/                 [empty]
        │   ├── db/
        │   │   └── index.ts                 [placeholder]
        │   ├── i18n/                        [empty]
        │   └── utils.ts                     [from shadcn]
        ├── messages/
        │   ├── en.json                      [stub]
        │   ├── ms.json                      [stub]
        │   ├── zh.json                      [stub]
        │   └── ta.json                      [stub]
        ├── public/
        ├── components.json                  [shadcn config]
        ├── next.config.mjs
        ├── package.json
        ├── tailwind.config.ts
        ├── tsconfig.json
        ├── postcss.config.mjs
        ├── README.md
        └── .env.local.example
```

---

## After Prompt 02 (Database Schema)

New / changed:
```
apps/web/
├── drizzle.config.ts                        [NEW]
└── lib/db/
    ├── schema.ts                            [NEW - all tables]
    ├── index.ts                             [UPDATED - real Drizzle client]
    ├── types.ts                             [NEW]
    └── migrations/
        ├── 0000_<name>.sql                  [NEW]
        ├── 0001_rls.sql                     [NEW - manual RLS]
        └── meta/
            └── _journal.json
```

Database tables created in Supabase: `user_profiles`, `aids`, `applications`, `chat_messages`, `documents`. RLS enabled on user-owned tables.

---

## After Prompt 03 (Auth Phone OTP)

New:
```
apps/web/
├── middleware.ts                            [NEW]
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── verify/
│   │       └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                       [requireUser]
│   │   └── page.tsx                         [protected smoke test]
│   └── api/
│       └── auth/
│           └── sign-out/
│               └── route.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts                        [browser client]
│   │   ├── server.ts                        [server client]
│   │   └── admin.ts                         [service role]
│   └── auth/
│       └── get-user.ts                      [getServerUser, requireUser, getUserProfile]
└── components/feature/auth/
    ├── LoginForm.tsx
    ├── VerifyForm.tsx
    └── UserNav.tsx
```

---

## After Prompt 04 (App Shell)

New / changed:
```
apps/web/
├── app/
│   ├── layout.tsx                           [UPDATED - manifest, theme-color, viewport]
│   ├── (app)/
│   │   ├── layout.tsx                       [UPDATED - AppHeader + BottomNav]
│   │   ├── page.tsx                         [home placeholder]
│   │   ├── aids/page.tsx                    [placeholder]
│   │   ├── aida/page.tsx                    [placeholder]
│   │   ├── tracker/page.tsx                 [placeholder]
│   │   └── profile/page.tsx                 [placeholder + sign out]
│   └── offline/
│       └── page.tsx                         [NEW]
├── public/
│   ├── manifest.json                        [NEW]
│   ├── sw.js                                [NEW]
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── apple-touch-icon.png
├── lib/
│   └── nav.ts                               [NEW - NAV_ITEMS]
├── components/layout/
│   ├── AppHeader.tsx                        [NEW]
│   └── BottomNav.tsx                        [NEW]
└── tailwind.config.ts                       [UPDATED - brand colors]
```

---

## After Prompt 05 (i18n)

New / changed:
```
apps/web/
├── i18n/
│   ├── config.ts                            [NEW - SUPPORTED_LOCALES, LOCALE_LABELS]
│   └── request.ts                           [NEW - getRequestConfig]
├── next.config.mjs                          [UPDATED - createNextIntlPlugin]
├── app/
│   ├── layout.tsx                           [UPDATED - NextIntlClientProvider]
│   └── api/locale/route.ts                  [NEW]
├── messages/
│   ├── en.json                              [FULL]
│   ├── ms.json                              [FULL]
│   ├── zh.json                              [placeholder, copy of en]
│   └── ta.json                              [placeholder, copy of en]
├── components/feature/
│   └── LanguageSwitcher.tsx                 [NEW]
└── lib/
    └── format.ts                            [NEW - formatRM, formatDate]
```

All strings in components from prompts 03-04 now use `useTranslations()`.

---

## After Prompt 06 (Onboarding Wizard)

New:
```
apps/web/
├── app/(app)/onboarding/
│   ├── layout.tsx                           [overrides bottom-nav]
│   └── page.tsx                             [redirects to step 1]
├── lib/
│   ├── onboarding/
│   │   ├── state.ts                         [Zustand store]
│   │   └── schema.ts                        [Zod schemas]
│   └── data/
│       └── malaysian-states.ts              [16 states, districts]
├── components/feature/onboarding/
│   ├── Step1Language.tsx
│   ├── Step2NameIC.tsx
│   ├── Step3Location.tsx
│   ├── Step4Household.tsx
│   ├── Step5Status.tsx
│   ├── Step6Review.tsx
│   └── MatchingScreen.tsx                   [the loading wow moment]
├── app/api/onboarding/route.ts              [NEW POST]
└── lib/db/migrations/0002_<name>.sql        [adds has_completed_onboarding]
```

`messages/en.json` and `ms.json` updated with `onboarding` namespace.

---

## After Prompt 07 (Seed Aid Catalog)

New:
```
apps/web/
├── scripts/
│   └── seed-aids.ts                         [NEW]
├── lib/data/
│   └── aids.ts                              [NEW - getAllAids, getAidById, etc.]
└── app/api/aids/route.ts                    [NEW GET]
```

`apps/web/package.json` has `seed:aids` script.

Database: `aids` table populated with rows from `packages/aid-catalog/aids.json`.

---

## After Prompt 08 (Aids Browse)

New / changed:
```
apps/web/
├── app/(app)/aids/
│   ├── page.tsx                             [REPLACED - real list]
│   └── [id]/page.tsx                        [NEW - detail]
├── components/feature/aids/
│   ├── AidsBrowser.tsx                      [NEW client]
│   ├── AidCard.tsx                          [NEW]
│   ├── CategoryChips.tsx                    [NEW]
│   └── EligibilityList.tsx                  [NEW]
└── lib/aids/
    ├── format-eligibility.ts                [NEW]
    └── format-amount.ts                     [NEW]
```

---

## After Prompt 09 (Bedrock Client)

New:
```
apps/web/
├── lib/ai/
│   ├── bedrock.ts                           [chat, chatStream, AiError]
│   ├── json.ts                              [chatJson]
│   ├── index.ts                             [re-exports]
│   └── prompts/
│       ├── matching.system.ts               [stub]
│       ├── aida.system.ts                   [stub]
│       ├── aida.suggested-replies.ts        [stub]
│       └── ocr-postprocess.system.ts        [stub]
└── app/api/_dev/bedrock-ping/route.ts       [NEW smoke test]
```

---

## After Prompt 10 (Matching Engine)

New / changed:
```
apps/web/
├── lib/ai/
│   ├── matching/
│   │   ├── rules.ts                         [deterministic pre-filter]
│   │   ├── engine.ts                        [orchestrator]
│   │   ├── serialize.ts                     [profile/aids → AI input]
│   │   └── types.ts                         [AidMatch, Verdict]
│   └── prompts/matching.system.ts           [REAL implementation]
├── app/api/match/route.ts                   [NEW POST]
├── lib/aids/total-potential.ts              [NEW]
└── scripts/test-match.ts                    [NEW dev script]
```

Database: `applications` table has rows for eligible/near_miss matches per user.

---

## After Prompt 11 (Home Screen)

New / changed:
```
apps/web/
├── app/(app)/page.tsx                       [REPLACED - real home]
└── components/feature/home/
    ├── HomeContent.tsx                      [NEW client]
    ├── HeroBanner.tsx                       [NEW with count-up]
    ├── MatchAidCard.tsx                     [NEW]
    ├── NearMissCard.tsx                     [NEW]
    ├── NearMissDrawer.tsx                   [NEW]
    └── EkasihTip.tsx                        [NEW]
```

`messages/en.json` and `ms.json` updated with full `home` namespace.

---

## After Prompt 12 (AIDa Chatbot)

New / changed:
```
apps/web/
├── app/(app)/aida/page.tsx                  [REPLACED - real chat]
├── lib/ai/
│   ├── prompts/aida.system.ts               [REAL implementation]
│   ├── prompts/aida.suggested-replies.ts    [REAL]
│   └── aida/
│       ├── profile-summary.ts
│       └── catalog.ts
├── app/api/aida/
│   ├── chat/route.ts                        [NEW POST streaming SSE]
│   └── suggested-replies/route.ts           [NEW POST]
└── components/feature/aida/
    ├── ChatScreen.tsx                       [NEW]
    ├── MessageBubble.tsx                    [NEW]
    ├── SuggestedReplies.tsx                 [NEW]
    ├── Composer.tsx                         [NEW with mic]
    └── AidaAvatar.tsx                       [NEW SVG]
```

---

## After Prompt 13 (Tracker)

New:
```
apps/web/
├── app/(app)/tracker/page.tsx               [REPLACED - real]
├── components/feature/tracker/
│   ├── TrackerScreen.tsx                    [NEW with 3 tabs]
│   ├── TrackerItem.tsx                      [NEW]
│   ├── DocumentChecklist.tsx                [NEW]
│   └── RenewalReminderCard.tsx              [NEW]
└── app/api/applications/
    ├── route.ts                             [NEW POST]
    └── [id]/route.ts                        [NEW PATCH]
```

---

## After Prompt 14 (OCR MyKad)

New / changed:
```
apps/web/
├── lib/aws/
│   ├── s3.ts                                [NEW]
│   └── textract.ts                          [NEW]
├── lib/ai/prompts/ocr-postprocess.system.ts [REAL implementation]
├── app/api/ocr/mykad/route.ts               [NEW POST]
└── components/feature/onboarding/
    └── MyKadCapture.tsx                     [NEW - replaces disabled placeholder]
```

`Step2NameIC.tsx` updated to use real `MyKadCapture`.

S3 bucket `aida-docs-<team>` has user uploads under `users/<userId>/mykad/`.

---

## After Prompt 15 (Insights Dashboard)

New:
```
apps/web/
├── app/(app)/insights/page.tsx              [NEW]
└── components/feature/insights/
    ├── QuickBiEmbed.tsx                     [NEW]
    ├── SyntheticInsights.tsx                [NEW with Recharts]
    ├── KpiStatCard.tsx                      [NEW]
    └── TopGapsList.tsx                      [NEW]
```

`apps/web/package.json` has `recharts` dep.

Profile page has a "View insights" link.

---

## After Prompt 16 (Polish)

Changed (no major new files):
- `messages/zh.json` and `messages/ta.json` fully translated.
- All screens have proper Skeleton, empty state, and error state components.
- Lighthouse PWA score ≥ 80.
- Subtle animations added (count-up, confetti).

---

## After Prompt 17 (Deploy)

New:
```
apps/web/
├── vercel.json                              [NEW - region sin1, maxDuration]
└── app/api/health/route.ts                  [NEW GET]
```

Vercel project linked to GitHub. Production URL live. All env vars set on Vercel.

---

## After Prompt 18 (Demo Seed)

New:
```
apps/web/
├── app/api/_demo/login/route.ts             [NEW]
├── components/feature/auth/
│   └── DemoLoginButton.tsx                  [NEW - shows on /login]
├── scripts/
│   ├── seed-demo.ts                         [NEW]
│   └── README.md                            [demo refresh instructions]
```

`apps/web/package.json` has `seed:demo` script.

Production has demo user `demo+aminah@aida.demo` with seeded profile, applications, and chat history.

---

## Final shape (end of prompt 18)

```
aida/
├── CLAUDE.md
├── README.md
├── docs/                                    [from project start]
├── packages/aid-catalog/aids.json
├── package.json                             [workspace root]
├── pnpm-workspace.yaml
├── .gitignore
└── apps/web/
    ├── app/
    │   ├── (app)/                           [all authenticated screens]
    │   ├── (auth)/                          [login + verify]
    │   ├── api/                             [route handlers]
    │   ├── offline/page.tsx
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── ui/                              [shadcn]
    │   ├── layout/                          [AppHeader, BottomNav]
    │   └── feature/                         [auth, onboarding, home, aids, aida, tracker, insights]
    ├── lib/
    │   ├── ai/                              [bedrock client + prompts + matching]
    │   ├── auth/                            [getServerUser, requireUser]
    │   ├── aws/                             [S3, Textract]
    │   ├── data/                            [aids, malaysian-states]
    │   ├── db/                              [schema, migrations]
    │   ├── i18n/
    │   ├── onboarding/                      [Zustand state, Zod schema]
    │   ├── supabase/                        [client/server/admin]
    │   ├── format.ts
    │   ├── nav.ts
    │   ├── toast.ts
    │   └── utils.ts
    ├── i18n/                                [next-intl config]
    ├── messages/                            [en, ms, zh, ta]
    ├── public/                              [manifest, sw, icons]
    ├── scripts/                             [seed-aids, seed-demo, test-match]
    ├── components.json
    ├── drizzle.config.ts
    ├── middleware.ts
    ├── next.config.mjs
    ├── package.json
    ├── postcss.config.mjs
    ├── README.md
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── vercel.json
```

---

## How to use this map

After every prompt:
```bash
# Quick visual check
ls apps/web/app/api/         # should grow as we add routes
ls apps/web/components/feature/  # should grow per feature

# Check the prompt's expected files exist
# (compare against the list above)
```

If a file from the expected list is missing, that prompt didn't fully execute — re-read its output and finish what it skipped.
