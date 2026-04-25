# 05 — i18n with next-intl (EN + BM, ZH/TA placeholders)

> **Goal**: Wire up `next-intl` properly with full message catalogs, a working language switcher, and locale-aware routing. EN and BM at parity; ZH and TA copied from EN as placeholders for now.
>
> **Time budget**: 45 minutes
> **Use `/plan` mode**: Yes

---

## Pre-flight check

- [ ] Prompt 04 committed
- [ ] App shell renders with placeholder tabs

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/design/DESIGN_PRINCIPLES.md, and the existing components/layout/AppHeader.tsx.

Use /plan mode. Show me which files will change before coding.

Goal: Wire up next-intl properly. We use a "no-routing-prefix" setup — locale is stored in a cookie and the user_profiles.language column, not in the URL path. This is simpler for our audience and avoids /en/, /ms/ URLs cluttering things.

Tasks:

1. Configure next-intl in App Router style:
   - apps/web/i18n/config.ts — exports SUPPORTED_LOCALES = ['en', 'ms', 'zh', 'ta'] as const, type Locale, and LOCALE_LABELS = { en: 'English', ms: 'Bahasa Malaysia', zh: '中文', ta: 'தமிழ்' }.
   - apps/web/i18n/request.ts — getRequestConfig from next-intl/server. Reads the locale from a cookie called 'aida_locale' (fallback 'en') and loads messages/{locale}.json.
   - Update apps/web/next.config.mjs to include createNextIntlPlugin('./i18n/request.ts').
   - Update apps/web/app/layout.tsx to wrap children in <NextIntlClientProvider locale={locale} messages={messages}>. Get locale from cookies() server-side.

2. Replace messages/{en,ms,zh,ta}.json with full content covering everything we have so far. Structure:

{
  "app": { "name": "AIDa", "tagline": "Your aid, found." },
  "nav": {
    "home": "Home",
    "aids": "Aids",
    "aida": "AIDa",
    "tracker": "Applications",
    "profile": "Profile"
  },
  "auth": { ... all the strings from prompt 03 ... },
  "common": {
    "continue": "Continue",
    "back": "Back",
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading...",
    "retry": "Try again",
    "yes": "Yes",
    "no": "No",
    "not_sure": "I'm not sure"
  },
  "home": {
    "greeting": "Hi, {name}!",
    "subtitle": "Here's what's available for you",
    "matched_aids": "Aids you may qualify for",
    "near_miss": "You're close to qualifying for"
  },
  "aids": {
    "title": "All aids",
    "search_placeholder": "Search aids...",
    "categories": {
      "cash": "Cash aid",
      "groceries": "Groceries",
      "medical": "Medical",
      "education": "Education",
      "housing": "Housing",
      "business": "Business",
      "registration": "Registration"
    }
  },
  "tracker": {
    "title": "My applications",
    "empty": "You haven't applied to anything yet.",
    "tabs": { "applied": "Applied", "eligible": "Eligible", "renewals": "Renewals due" }
  },
  "aida": {
    "title": "AIDa",
    "subtitle": "Your case worker",
    "placeholder": "Ask AIDa anything...",
    "thinking": "AIDa is thinking..."
  },
  "profile": {
    "title": "Profile",
    "edit": "Edit profile",
    "language": "Language",
    "sign_out": "Sign out"
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "offline": "You're offline. Check your connection.",
    "auth_required": "Please sign in to continue."
  }
}

For ms.json, give me the complete Bahasa Malaysia translations of every string. Use natural, conversational BM appropriate for low-literacy adult users. Don't use overly formal or academic BM.

For zh.json and ta.json: copy en.json as a placeholder. Add a comment at the top: "TODO: replace with translation in prompt 16."

3. Implement the language switcher component:
   apps/web/components/feature/LanguageSwitcher.tsx (client):
   - Reads current locale from useLocale() of next-intl.
   - Renders a dropdown (shadcn Select or DropdownMenu) with the 4 LOCALE_LABELS.
   - On change: POST to /api/locale with { locale }. The route handler sets the cookie and refreshes.
   - Disabled state while changing.
   - Show current locale's flag emoji + native name.

4. apps/web/app/api/locale/route.ts:
   - POST handler: accept { locale } in body, validate against SUPPORTED_LOCALES.
   - Set cookie 'aida_locale' (max-age 1 year, sameSite lax, path /, secure in prod).
   - If user is authenticated, also update public.user_profiles.language for that user (so the locale persists across devices).
   - Return { ok: true }.

5. Update every component touched in prompts 03 and 04 to use useTranslations() instead of hardcoded strings:
   - components/layout/AppHeader.tsx
   - components/layout/BottomNav.tsx (read t('nav.home'), etc.)
   - components/feature/auth/LoginForm.tsx
   - components/feature/auth/VerifyForm.tsx
   - components/feature/auth/UserNav.tsx
   - All the placeholder tab pages
   - app/offline/page.tsx

6. Add a date/number formatting helper at apps/web/lib/format.ts:
   - formatRM(amount, locale): formats as "RM 1,200" with locale-appropriate separators.
   - formatDate(date, locale): formats as "12 Mac 2026" for ms, "12 March 2026" for en, etc. Use Intl.DateTimeFormat.

7. Visual sanity:
   - The LanguageSwitcher in the header is small and unobtrusive (an icon button that opens a small popover, not a long inline label).
   - On switching from en to ms, the page content updates without a hard reload. (Use router.refresh() after the POST.)

Verify:
- Switch language in the dropdown. Bottom-tab labels and visible strings update.
- Inspect cookies: aida_locale is set to the chosen locale.
- Reload the page: locale persists.
- Sign in, switch language, log out, log in: language persisted in user_profiles.language.

Summarize and give the commit message.

Do NOT add automatic locale detection from browser Accept-Language for v1 (cookie default is fine). Do NOT translate aid catalog entries — those have their own name.{ms,en,zh,ta} structure already.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

---

## Verification

```bash
cd ~/code/aida/apps/web
pnpm typecheck
pnpm dev
```

Manual:
1. Switch language to Bahasa Malaysia → tab labels become "Utama", "Bantuan", "AIDa", "Permohonan", "Saya".
2. Reload → still BM.
3. Switch to 中文 → strings stay in English (placeholder, expected).

Commit:
```bash
git add .
git commit -m "feat: next-intl with EN/BM full strings, ZH/TA placeholders"
git push
```

## Move on to

`prompts/06_onboarding_wizard.md`
