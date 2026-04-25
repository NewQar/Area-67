# 03 — Auth with Phone OTP (and email fallback)

> **Goal**: Working authentication. User can sign up / log in via phone OTP (with email fallback for dev), and we have a `getServerUser()` helper used everywhere.
>
> **Time budget**: 45 minutes
> **Use `/plan` mode**: Yes

---

## Pre-flight check

- [ ] Prompt 02 committed
- [ ] Supabase Auth → Phone provider enabled in Supabase dashboard (or just email provider for dev — see note below)
- [ ] `pnpm typecheck` passes

> **Phone OTP requires Twilio configured in Supabase Auth Providers.** If you don't have Twilio set up, **enable Email OTP instead** (Supabase → Authentication → Providers → Email → enable, no SMTP needed for magic links in dev). The code below supports both — phone for production demo, email for dev.

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, README.md, docs/dev/DEVELOPER_GUIDE.md, and lib/db/schema.ts before starting.

Use /plan mode. Show me the file structure and helper signatures before writing code.

Goal: Add Supabase Auth to the AIDa app. Support BOTH:
- Phone OTP (primary, for the demo persona)
- Email OTP (fallback, for dev when Twilio isn't set up)

We'll use Supabase's @supabase/ssr package for proper Next.js App Router server/client integration.

Tasks:

1. Create apps/web/lib/supabase/client.ts — a browser Supabase client (createBrowserClient) that reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.

2. Create apps/web/lib/supabase/server.ts — a server Supabase client (createServerClient) using cookies() from next/headers. Export `createClient()`.

3. Create apps/web/lib/supabase/admin.ts — a server-only client using the SERVICE_ROLE key for privileged operations (bypasses RLS). Export `adminClient`. Throw if env var missing.

4. Create apps/web/middleware.ts that refreshes the auth session on every request (per Supabase Next.js docs). Configure matcher to skip _next, static files, and api routes that should be public.

5. Create apps/web/lib/auth/get-user.ts:
   - export async function getServerUser(): returns the current Supabase user or null. Reads from server client.
   - export async function requireUser(): same but throws/redirects to /login if no user.
   - export async function getUserProfile(userId: string): joins auth.users with our public.user_profiles table, returns merged shape or null if profile not yet created.

6. Build the auth UI:
   - apps/web/app/(auth)/layout.tsx — a centered card layout for auth pages with the AIDa logo/title at top.
   - apps/web/app/(auth)/login/page.tsx — server component shell.
   - apps/web/components/feature/auth/LoginForm.tsx — client component with two tabs: "Phone" / "Email". Phone tab takes a Malaysian phone number (validate format +60 with libphonenumber-js if simple, else just regex /^(\+60|0)[1-9][0-9]{7,9}$/), sends OTP via supabase.auth.signInWithOtp({ phone }). Email tab takes an email, signInWithOtp({ email }).
   - On submit, navigate to /(auth)/verify?contact=<phone-or-email>&type=<phone|email>.
   - apps/web/app/(auth)/verify/page.tsx — page that reads ?contact and ?type from searchParams.
   - apps/web/components/feature/auth/VerifyForm.tsx — client component with a 6-digit OTP input (6 single-digit inputs that auto-advance focus). On submit, calls supabase.auth.verifyOtp({ phone OR email, token, type: 'sms' OR 'email' }). On success, redirect to /onboarding (we'll build that next prompt).
   - Add a "Resend code" link with a 30-second cooldown timer.
   - Style with shadcn Card, Input, Button, Tabs.

7. Create apps/web/app/api/auth/sign-out/route.ts — a POST handler that signs out the current session and redirects to /login. Used by the profile page later.

8. Build apps/web/components/feature/auth/UserNav.tsx — a small client component showing the user's initial in an Avatar with a dropdown to sign out. Place it in the top-right of the app shell (we'll wire it up in prompt 04).

9. Add a tiny placeholder protected route at apps/web/app/(app)/page.tsx that calls requireUser() and renders "Hello, <user.email or user.phone>". This is just a smoke test — it'll be replaced in prompt 04.

10. Add a route group structure that redirects:
    - /(public): no auth needed (login, verify, marketing)
    - /(app): auth required (everything else)
    Implement the redirect at the layout level — apps/web/app/(app)/layout.tsx calls requireUser(). If null, redirect to /login.

11. Update messages/en.json and messages/ms.json with auth strings:
    {
      "auth": {
        "login_title": "Welcome to AIDa", // BM: "Selamat datang ke AIDa"
        "login_subtitle": "Sign in to find aid you qualify for",
        "phone_label": "Phone number",
        "phone_placeholder": "+60 12 345 6789",
        "email_label": "Email",
        "email_placeholder": "you@example.com",
        "send_code": "Send code",
        "verify_title": "Enter your code",
        "verify_subtitle": "We sent a 6-digit code to",
        "code_label": "6-digit code",
        "verify": "Verify",
        "resend_in": "Resend in {seconds}s",
        "resend": "Resend code",
        "sign_out": "Sign out",
        "errors": {
          "invalid_phone": "Please enter a valid Malaysian phone number",
          "invalid_email": "Please enter a valid email",
          "otp_failed": "Invalid or expired code"
        }
      }
    }
    (Don't worry about ZH/TA yet — copy en.json into them as placeholders, prompt 16 will translate.)
    Use these strings in the components via useTranslations() from next-intl. (next-intl isn't fully wired yet — for THIS prompt, just hardcode in English and add a TODO. The next prompt sets up i18n properly.)

12. Verify:
    - pnpm dev
    - Go to http://localhost:3000 → should redirect to /login
    - Try email OTP, get magic code in Supabase Auth logs (Auth → Logs)
    - After verify, lands on / and shows "Hello, ..."

After completing, summarize file paths created and the commit message.

Do NOT add password auth. Do NOT add OAuth. Do NOT build the onboarding wizard yet.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

---

## Verification

```bash
cd ~/code/aida/apps/web
pnpm typecheck
pnpm dev
```

Manual test:
1. Go to `http://localhost:3000` — should redirect to `/login`.
2. Enter your email, click "Send code".
3. Open Supabase dashboard → Authentication → Logs. You'll see the OTP code.
4. Paste it in the verify form. You should land on `/` with "Hello, ...".
5. Click sign out → back to `/login`.

If phone OTP is configured (Twilio set up):
1. Same as above but with the Phone tab. SMS arrives.

Commit:
```bash
git add .
git commit -m "feat: phone and email OTP auth with Supabase SSR"
git push
```

## If something went wrong

- **"Invalid login credentials"**: The OTP expired (default is 60s). Resend.
- **Middleware infinite redirect**: Check the matcher in `middleware.ts` excludes `/login`, `/verify`, and `_next`.
- **`getServerUser()` returns null even after login**: Cookie not being set. Check `lib/supabase/server.ts` is using `cookies()` from `next/headers` correctly and middleware refreshes session.

## Move on to

`prompts/04_app_shell.md`
