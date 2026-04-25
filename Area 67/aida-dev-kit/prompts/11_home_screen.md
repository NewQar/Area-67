# 11 — Home Screen with Match Results

> **Goal**: The Home tab shows matched aids ranked, the "near miss" UI, and the headline number ("up to RM X,XXX/year"). This is the first thing the demo lands on.
>
> **Time budget**: 60 minutes
> **Use `/plan` mode**: Yes

---

## Pre-flight check

- [ ] Prompt 10 committed
- [ ] `/api/match` returns matches for a logged-in test user

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/design/DESIGN_PRINCIPLES.md, docs/business/PM_PLAYBOOK.md (§5 the locked demo path), and the existing components/feature/aids/.

Use /plan. Show me the home page sections and component tree. Approve before code.

Goal: Build the Home tab. This is the WOW moment of the demo.

Layout (top to bottom on mobile):

A. Greeting + headline:
   - "Hi, {firstName}!"
   - Big animated count-up: "Up to RM {totalPotential} / year"
   - Subtitle: "{eligibleCount} aids you qualify for. {nearMissCount} more if you take one small step."
   - Background: subtle gradient using brand-primary.

B. "Eligible aids" section:
   - Section header: "✓ Aids you qualify for"
   - Carousel/horizontal scroll of MatchAidCard components (top 5 by amount).
   - "See all {n}" link → /aids?filter=eligible.

C. "You're close to qualifying" section (the killer "near miss" UI):
   - Section header: "🎯 You're close to qualifying"
   - Vertical stack of NearMissCard components.
   - Each shows: aid name, amount, "Missing: {gap[0]}", and an action button ("Show me how" or "Get started").

D. "Browse more" section:
   - "Other aids" link to /aids.
   - Tip card: "Have you registered with eKasih?" (if profile.ekasih_registered === 'no' or 'unknown').

E. AIDa floating helper:
   - A small floating action button bottom-right that links to /aida (the chatbot). Optional — the bottom tab already has it. Skip if it interferes with the bottom nav.

Tasks:

1. Replace apps/web/app/(app)/page.tsx (server component):
   - getServerUser() → if profile incomplete, redirect to /onboarding.
   - Fetch latest match results: directly call matchProfile(profileId) — should be cached.
   - Compute summary: totalPotential, eligibleCount, nearMissCount.
   - Render <HomeContent /> client component with all this as initial data.

2. apps/web/components/feature/home/HomeContent.tsx (client):
   - Accepts initialMatches, summary, profile.firstName, locale.
   - Renders sections A through D.
   - Hooks: TanStack Query to revalidate match data via /api/match (so we can have a "Refresh matches" pull-to-refresh later).

3. apps/web/components/feature/home/HeroBanner.tsx:
   - Greeting + animated count-up (use a small useEffect counter from 0 → totalPotential over 1.5s).
   - Subtitle.
   - Soft gradient background.

4. apps/web/components/feature/home/MatchAidCard.tsx:
   - Variant of AidCard with the match badge.
   - Shows match.nextStep as the CTA on the card.

5. apps/web/components/feature/home/NearMissCard.tsx:
   - Distinct visual: amber border / accent.
   - Headline: aid name + amount.
   - Body: "What's missing: {gap[0]}".
   - CTA: "Show me how" → opens a Sheet/Drawer with AIDa explanation.

6. apps/web/components/feature/home/NearMissDrawer.tsx:
   - Bottom drawer (shadcn Sheet from bottom).
   - Renders: aid summary at top, then the FULL gaps array as a numbered list, then nextStep, then a "Open chat with AIDa" button (deep link to /aida with prefilled question).

7. Register a "tip" component:
   - apps/web/components/feature/home/EkasihTip.tsx — small inline card. Shows when profile.ekasih_registered ∈ {'no', 'unknown'}. Body: "Registering with eKasih unlocks RM {potentialEkasihUplift}/year more in aid." CTA: "What is eKasih?" → opens a Dialog explaining + linking to ekasih.gov.my.

8. i18n strings — add to messages/en.json and ms.json:
   "home": {
     ...existing keys,
     "potential_amount_label": "Up to RM {amount} / year",
     "eligible_summary": "{count, plural, =1 {1 aid you qualify for} other {# aids you qualify for}}",
     "near_miss_summary": "{count, plural, =1 {1 more if you take one small step} other {# more if you take one small step}}",
     "eligible_section_title": "Aids you qualify for",
     "near_miss_section_title": "You're close to qualifying",
     "see_all": "See all {count}",
     "show_me_how": "Show me how",
     "missing_label": "What's missing",
     "ekasih_tip_title": "Are you registered with eKasih?",
     "ekasih_tip_body": "Registering with eKasih is free and unlocks more aid.",
     "what_is_ekasih": "What is eKasih?",
     "ekasih_explainer": "eKasih is Malaysia's national poverty database. Many higher-tier aids (like SARA RM200/month) require eKasih registration. You can register at any JKM office or online at ekasih.gov.my."
   }

9. Skeletons + loading states:
   - Hero shows a Skeleton while initial data loads.
   - If there are zero matches at all (rare): show empty state "We need a bit more info — let's update your profile" → /onboarding.

10. Error states:
    - If /api/match fails: show a friendly error card with a "Try again" button.

11. The animated count-up:
    - Use requestAnimationFrame in a small custom hook useCountUp(target, durationMs).
    - Don't pull in a library for this — under 30 lines.

12. Demo polish:
    - When totalPotential > 1000, the count-up tick has a subtle bounce at the end (CSS transition on a scale).
    - Add a tiny "(estimate)" label under the headline number with a small (i) info button explaining "Actual amounts depend on your final eligibility verification by each agency."

Verify:
- Sign in as the test user.
- Home shows headline "Up to RM X,XXX / year" with animation.
- Eligible section has the matched aids.
- Near-miss section has at least one aid.
- Tap "Show me how" on a near-miss card → drawer opens.
- Tap "Open chat with AIDa" → navigates to /aida (placeholder for now).

Summarize and give commit message.

Do NOT touch the AIDa chatbot page — that's the next prompt. Do NOT add real-time match recomputation on profile edit yet (later).
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

Demo test on real phone with the seeded Aminah profile. Confirm the wow moment lands.

Commit:
```bash
git add .
git commit -m "feat: home screen with match results, near-miss drawer, and animated headline"
git push
```

## Move on to

`prompts/12_aida_chatbot.md`
