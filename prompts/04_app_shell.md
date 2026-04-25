# 04 — App Shell + Bottom-Tab Nav + PWA

> **Goal**: The 5-tab app shell from `DESIGN_PRINCIPLES.md §2`, with PWA manifest + service worker + installable on mobile.
>
> **Time budget**: 45 minutes
> **Use `/plan` mode**: Yes

---

## Pre-flight check

- [ ] Prompt 03 committed
- [ ] Auth flow works end-to-end
- [ ] You have a 192x192 and 512x512 PNG icon ready (use any placeholder for now — generate with `https://www.pwabuilder.com/imageGenerator` from a quick AIDa logo, or use a colored circle)

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/design/DESIGN_PRINCIPLES.md (especially §1 and §2), and the existing app/ structure.

Use /plan mode. Show me the layout structure before coding.

Goal: Build the 5-tab app shell that wraps every authenticated screen, plus PWA manifest and service worker so the app is installable.

5 tabs (per DESIGN_PRINCIPLES.md §2):
1. Home (/, icon: Home)
2. Aids (/aids, icon: HandHeart)
3. AIDa chatbot (/aida, icon: MessageCircle) — center, slightly elevated visually
4. Tracker (/tracker, icon: ClipboardCheck)
5. Profile (/profile, icon: User)

Tasks:

1. Update the (app) route group layout — apps/web/app/(app)/layout.tsx:
   - Server component.
   - Calls requireUser() at top (already exists from prompt 03, leave it).
   - Renders a top header (small, just AIDa wordmark on the left, language switcher + UserNav on the right).
   - Renders {children} in a <main> with bottom padding to make room for the bottom tab bar.
   - Renders <BottomNav /> at the bottom (sticky/fixed).

2. Build apps/web/components/layout/AppHeader.tsx (client component) — sticky top, h-14, white/cream background, slight bottom border. Contains: AIDa wordmark (text only for now, we'll add a logo later), spacer, LanguageSwitcher (placeholder dropdown for now — full impl in prompt 05), UserNav.

3. Build apps/web/components/layout/BottomNav.tsx (client component):
   - Fixed to bottom of viewport, full width, h-16 (h-20 on devices with safe-area-inset-bottom).
   - 5 buttons evenly spaced. Each is a <Link> from next/link.
   - The middle one (AIDa) is visually elevated: larger, rounded-full, primary background, slight upward translate (think the FAB-like center tab pattern).
   - Active tab: primary color icon + label. Inactive: muted color.
   - Use usePathname() to determine active state.
   - Each tab has icon (lucide-react) on top, label below. Label is t('nav.<key>') from next-intl. For now, hardcode English labels (Home / Aids / AIDa / Tracker / Profile) with TODO comments to swap in t().

4. Create stub pages so all 5 tabs render *something* (we'll fill them in later prompts):
   - apps/web/app/(app)/page.tsx — Home: "Welcome, {firstName}!" in a Card. (Already exists from prompt 03; replace with this richer placeholder.)
   - apps/web/app/(app)/aids/page.tsx — "Aids browser — coming soon"
   - apps/web/app/(app)/aida/page.tsx — "AIDa chatbot — coming soon"
   - apps/web/app/(app)/tracker/page.tsx — "Tracker — coming soon"
   - apps/web/app/(app)/profile/page.tsx — "Profile" with a "Sign out" button that POSTs to /api/auth/sign-out

5. PWA setup:
   a. Create apps/web/public/manifest.json with:
      - name: "AIDa — Your Aid Case Worker"
      - short_name: "AIDa"
      - description: "Find Malaysian aid you qualify for, in your language."
      - start_url: "/"
      - display: "standalone"
      - background_color: "#FFFFFF"
      - theme_color: "#1a5dff" (our primary blue)
      - orientation: "portrait"
      - icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" }, { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }]
      - lang: "en"
      - dir: "ltr"
   b. Add the icons. Tell me what files I need to drop into apps/web/public/icons/ (icon-192.png, icon-512.png, apple-touch-icon.png at 180x180). I'll provide them.
   c. Update apps/web/app/layout.tsx (root layout) to include:
      - <link rel="manifest" href="/manifest.json" />
      - <meta name="theme-color" content="#1a5dff" />
      - <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      - viewport: { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false }
   d. Service worker: use next-pwa OR write a minimal sw.js manually. Pick the simpler path. For Next.js 15 App Router, next-pwa has compatibility quirks — if so, use the manual approach: a sw.js in public that caches the app shell + offline page. Decide and implement.
   e. Create apps/web/app/offline/page.tsx — friendly "You're offline" message with the AIDa illustration and a "Retry" button that calls window.location.reload().

6. Theme tokens — extend Tailwind:
   Update apps/web/tailwind.config.ts theme.extend.colors to include:
   - brand-primary: '#1a5dff'  (and a 50/100/.../900 ramp — generate the ramp)
   - brand-accent: '#ff7a1a' (with ramp)
   - cream: '#fffaf3' (page background)
   Make sure shadcn's CSS variables in app/globals.css don't clash. Update globals.css :root to set --background to cream-tinted, --primary to brand-primary, etc.

7. Type-safe nav config:
   Create apps/web/lib/nav.ts that exports a NAV_ITEMS array of { href, labelKey, icon } so BottomNav and any future place reads from one source.

8. Test on a real phone:
   Tell me the steps to test the PWA install on:
   - iOS Safari (Add to Home Screen)
   - Android Chrome (Install banner / Add to Home Screen)

Verify:
- pnpm dev
- All 5 tabs render their placeholder content.
- Active tab styling works (the active icon is primary color).
- View source: <link rel="manifest"> is present.
- Open Chrome DevTools → Application → Manifest: should parse with no errors. Service worker registered.

After completing, summarize and give me the commit message.

Do NOT add real-content to the tab pages yet. Do NOT add i18n strings beyond hardcoded English (next prompt). Do NOT install next-pwa unless you've confirmed it works with Next 15 App Router.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

---

## Verification

```bash
cd ~/code/aida/apps/web
pnpm typecheck
pnpm dev
```

Open `http://localhost:3000` on desktop:
- All 5 tabs visible at bottom
- Tapping each navigates correctly
- Active tab is highlighted

Open Chrome DevTools → Lighthouse → Run audit on Mobile → PWA category. Should be ≥80.

Test on real phone:
1. Get your laptop's local IP: `ifconfig | grep "inet " | grep -v 127.0.0.1` (macOS) or `ipconfig` (Win)
2. On phone (same WiFi), open `http://<your-ip>:3000`
3. Chrome on Android: 3-dot menu → "Add to Home screen"
4. Safari on iOS: Share → "Add to Home Screen"

Commit:
```bash
git add .
git commit -m "feat: app shell with bottom-tab nav and PWA manifest"
git push
```

## Move on to

`prompts/05_i18n_setup.md`
