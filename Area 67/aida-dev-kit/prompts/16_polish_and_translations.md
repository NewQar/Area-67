# 16 — Polish: ZH/TA Translations, Loading States, Empty States, Error States

> **Goal**: Production-shipped feel. Complete the 4 languages, fill in every loading skeleton, every empty state, every error state. Get the Lighthouse score above 80.
>
> **Time budget**: 60 minutes
> **Use `/plan` mode**: No (audit + fixes)

---

## Pre-flight check

- [ ] Prompt 15 committed
- [ ] You've manually clicked through every screen at least once

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/design/DESIGN_PRINCIPLES.md (§6 Empty states + §7 accessibility + §8 polish wins), docs/dev/DEMO_DAY.md, and the existing messages/{en,ms,zh,ta}.json.

Goal: Production-shipped polish across the app. Five tasks below.

Task 1: Translate ZH and TA.
- Use the existing en.json as the source of truth.
- Translate every string into Simplified Mandarin (zh) and Tamil (ta).
- Use the same tone we use in BM — warm, plain, conversational, low literacy friendly.
- Preserve the ICU plural and variable syntax exactly: {name}, {count, plural, =1 {...} other {#}}, etc.
- Do NOT translate proper nouns (AIDa, STR, SARA, eKasih, JKM, MyKad, MyKasih) — leave them as is.
- Output the full updated zh.json and ta.json. After translation, scan en/ms/zh/ta for: same number of keys, same nesting structure, all variable placeholders preserved.

Task 2: Audit every screen for loading states.
- Wherever data is fetched server-side: confirm a Suspense boundary with a Skeleton fallback.
- Wherever data is fetched client-side: useState pending → render Skeleton.
- Skeleton variants needed: SkeletonAidCard, SkeletonHomeHero, SkeletonChatBubble, SkeletonTrackerItem.
- Make all skeletons match the actual content's dimensions to avoid layout shift.

Task 3: Audit every screen for empty states.
- Each empty state should have:
  - A friendly illustration or AIDa avatar (use the SVG avatar from prompt 12).
  - A short headline.
  - A specific next action ("Tap here to..." with a button).
- Empty states needed:
  - Home: zero matches → "Let's update your profile" → /onboarding.
  - Aids list: zero search results → "No aids match" + clear search button.
  - Tracker (each tab): per BA_RESEARCH_GUIDE.md and prompt 13.
  - Chat: zero history → already handled by initial greeting.
  - Profile: missing fields → "Complete your profile" CTA.
  - Insights: only synthetic — N/A.

Task 4: Audit every screen for error states.
- API failure: friendly toast + a "Try again" button.
- Network offline: detect via navigator.onLine + window.addEventListener('online'/'offline'). Show a small banner at the top: "You're offline. Some features may be limited."
- AI errors: never show the raw error. Show: "AIDa is having a slow moment. Try again."
- Centralize error toast triggers in apps/web/lib/toast.ts.

Task 5: Performance + accessibility audit.
- Lighthouse mobile audit. Fix anything that drops the score:
  - Image sizes (use next/image with proper width/height).
  - Cumulative Layout Shift (add explicit dimensions to skeletons).
  - Missing aria-labels on icon-only buttons.
  - Color contrast (use the contrast checker; verify all body text ≥ 4.5:1).
  - Missing alt text on images.
- Add focus-visible styles to all interactive elements (Tailwind's ring utilities).
- Verify keyboard navigation works through onboarding step by step (Tab + Enter).
- Add a Skip-to-content link for screen readers.
- Confirm PWA installability still works (Lighthouse → Installable: ✓).

Task 6: Small polish wins (from DESIGN_PRINCIPLES.md §8):
- Animated count-up on the home headline (already done).
- Confetti on completing onboarding: install canvas-confetti, fire on Step6Review submit success. Single line: confetti({ particleCount: 80, spread: 70 }).
- "Selamat datang, {name}!" personalized greeting in chat (already done).
- "As of April 2026" label on aid amounts in the Aid detail page header.
- Subtle haptic via active:scale-[.98] on all primary buttons.

Verify:
- Lighthouse mobile PWA score ≥ 80.
- All 4 languages render every screen without "missing translation" warnings.
- Every empty/loading/error state visible and friendly.
- Tab through onboarding with keyboard only — works.

Summarize and give commit message.

Do NOT add new features. Do NOT change the architecture. This is a polish pass.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

```bash
pnpm dev
# Lighthouse audit (Chrome DevTools → Lighthouse → Mobile → All categories)
# Walk through ALL screens in zh and ta
# Walk through ALL screens with the network throttled to "Slow 3G"
```

Commit:
```bash
git add .
git commit -m "chore: complete ZH/TA translations and polish loading/empty/error states"
git push
```

## Move on to

`prompts/17_deploy_to_vercel.md`
