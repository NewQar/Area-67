# 06 — Onboarding Wizard (6 Steps)

> **Goal**: The onboarding flow from `BA_RESEARCH_GUIDE.md §4` and `DESIGN_PRINCIPLES.md §5`. After signup, user lands here. After completion, profile is saved and we redirect to home.
>
> **Time budget**: 90 minutes
> **Use `/plan` mode**: Yes (this is the most UX-critical flow)

---

## Pre-flight check

- [ ] Prompt 05 committed
- [ ] You can sign in and land on `/`
- [ ] `user_profiles` table exists in DB

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md (especially §7), docs/research/BA_RESEARCH_GUIDE.md (§4), docs/design/DESIGN_PRINCIPLES.md (§5), and lib/db/schema.ts.

Use /plan mode. Show me:
- The state shape (a Zustand store).
- The 6 step components and what each captures.
- The API route signature.
- How "I'm not sure" inputs map to DB nullables.
Get my approval before writing code.

Goal: Build the 6-step onboarding wizard exactly as specced in DESIGN_PRINCIPLES.md §5 and BA_RESEARCH_GUIDE.md §4.

The 6 steps:
1. Language pick (4 big cards: BM / EN / 中文 / தமிழ்)
2. Name + IC (with optional MyKad photo upload — for THIS prompt, just the manual fields. OCR is prompt 14.)
3. State + District (cascading dropdowns)
4. Household (income band, household size, num children, num elderly)
5. Status (eKasih registration, religion, single parent, OKU/disability, currently studying)
6. Review + Save

After step 6, POST to /api/onboarding which writes user_profiles and redirects to /.

Tasks:

1. Create the wizard architecture:
   - apps/web/lib/onboarding/state.ts — a Zustand store (with persist middleware to sessionStorage so a refresh mid-wizard doesn't lose progress) holding the partial profile + currentStep.
   - apps/web/lib/onboarding/schema.ts — Zod schemas for each step's input + a final merged schema. Use z.coerce where appropriate. All "unknown"/"prefer not to say" answers map to nullable fields.
   - apps/web/lib/data/malaysian-states.ts — array of 16 Malaysian states with ISO codes (JHR, KDH, KTN, MLK, NSN, PHG, PNG, PRK, PLS, SBH, SWK, SGR, TRG, KUL, LBN, PJY) and their districts. Use a static dataset (give me the data — common-knowledge Malaysian admin geography). Each state has [{ name_en, name_ms, code, districts: [{ name_en, name_ms, code }] }].

2. Build apps/web/app/(app)/onboarding/layout.tsx:
   - Server component. Calls requireUser() and getUserProfile().
   - If profile is COMPLETE (has full_name + state + household_income_band + has_completed_onboarding flag), redirect to /.
   - Otherwise render the wizard layout: a Progress bar at top (showing currentStep / 6), the step content, and footer Back/Continue buttons.
   - Layout should NOT render the bottom-tab nav (we want full focus during onboarding). So this layout overrides the (app) layout — easiest way: place onboarding under (app)/onboarding/ but the layout returns children directly without bottom nav.

3. Build the 6 step components in apps/web/components/feature/onboarding/:
   - Step1Language.tsx — 4 big cards, full-width on mobile, 2-col grid. Each card is 80px tall, big text. On select: store in Zustand AND immediately POST to /api/locale to swap the UI language. Then advance to step 2.
   - Step2NameIC.tsx — two big inputs. Name (text). IC (text, mask as 6-2-4 e.g. 660102-08-1234). Optional "Snap MyKad photo" button that for now is disabled with a "Coming soon" tooltip — we'll wire it in prompt 14.
   - Step3Location.tsx — State dropdown (16 options, name in current locale), then District dropdown (filtered by state). Use shadcn Select.
   - Step4Household.tsx — Income band: 4 big cards + "I'm not sure" (5 cards, single column). Then 3 number steppers: household size (1–10+), num children (0–10+), num elderly (0–10+). Big +/- buttons on the steppers.
   - Step5Status.tsx — 5 questions, each is its own card with radio-style big buttons:
     a. eKasih registered? Yes / No / Don't know — with a "What is eKasih?" link that opens an info Dialog.
     b. Religion (optional): Islam / Buddhist / Christian / Hindu / Other / Prefer not to say. Above the question: a small reassuring sentence "We ask this only to match you to zakat aid."
     c. Single parent? Yes / No
     d. Anyone in your household has OKU (disability)? Yes / No
     e. Are you currently studying? Yes / No
   - Step6Review.tsx — bullet list summary of every previous answer with "Edit" link next to each (deep links back to that step). At the bottom, a big primary "Find my aids" button.

4. The API:
   - apps/web/app/api/onboarding/route.ts (POST):
     - Auth-check via getServerUser().
     - Parse body with the merged Zod schema.
     - UPSERT into user_profiles (insert if first time, update if re-running).
     - Set has_completed_onboarding = true (add this column to the schema! migration needed).
     - Return { ok: true, profileId }.
   - Add `has_completed_onboarding boolean default false` to user_profiles. Generate a new Drizzle migration. Apply it.

5. Wizard navigation logic:
   - Each step component validates its step's Zod schema on Continue.
   - If invalid, shows inline errors (use react-hook-form + Zod resolver, or manual — pick simpler).
   - On valid, advance step in Zustand and update URL to /onboarding/{stepNumber} (use shallow routing).
   - Back button: previous step. Disabled on step 1.
   - On step 6 "Find my aids": POST to /api/onboarding, on success show a 3-second loading screen ("Checking 25 aid programs for you...") with a friendly animation, then redirect to /.

6. The "Checking 25 aid programs for you..." screen:
   - apps/web/components/feature/onboarding/MatchingScreen.tsx — full-screen overlay with a centered animated illustration (use a simple Framer Motion or CSS animation — a pulsing AIDa avatar circle), a counter that ticks 0 → 25, and a friendly status line ("Checking STR... ✓ Checking SARA... ✓ ..."). Pure aesthetic for the demo wow moment. Then router.push('/').

7. Mobile-first checks:
   - 380px viewport: every screen has no horizontal scroll, big touch targets, content is the focus.
   - Continue button always full-width at the bottom, sticky (so it's visible without scrolling on small phones).
   - Progress bar shows "Step 3 of 6".

8. Update the post-login redirect logic:
   - In app/(app)/page.tsx (the home tab), check if profile is incomplete. If so, redirect to /onboarding/1.
   - In app/(app)/onboarding/page.tsx, redirect to /onboarding/1 (where 1 is the first step).

9. Update messages/en.json and ms.json with all onboarding strings. Add a top-level "onboarding" namespace with one entry per step. Be thorough — every label, every error, every help text.

Verify:
- Sign up as a new user.
- Onboarding starts automatically.
- Complete all 6 steps in BM.
- Land on /, profile saved in DB (check via Drizzle Studio).
- Refresh mid-flow at step 3 — your progress is preserved.
- Sign in as a returning user with completed profile — go straight to /, no onboarding.

Summarize and give commit message.

Do NOT implement OCR. Do NOT implement aid matching yet. Do NOT add any "premium" or "skip" buttons.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

---

## Verification

```bash
pnpm typecheck
pnpm db:studio  # check user_profiles is populated after running through
pnpm dev
```

Mobile test on real phone (your local IP):
- Onboarding renders correctly at 380px width
- Continue button is reachable with one thumb
- Switching language at step 1 actually changes UI

Commit:
```bash
git add .
git commit -m "feat: 6-step onboarding wizard with Zustand state and profile persistence"
git push
```

## Move on to

`prompts/07_seed_aid_catalog.md`
