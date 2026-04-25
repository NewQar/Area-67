# Troubleshooting

> Every error you might hit, and how to fix it.
>
> Use Cmd+F / Ctrl+F to search by error message.

---

## Setup & Claude Code

### `claude: command not found`
- Close and reopen your terminal — PATH may not have refreshed.
- Check if it installed: `ls ~/.local/bin/claude` (Linux/macOS) or `Get-Command claude` (PowerShell).
- If installed but not in PATH:
  ```bash
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
  source ~/.zshrc
  ```
- Last resort: reinstall via npm: `npm install -g @anthropic-ai/claude-code`.

### Claude Code says "authentication required" every time
- Run `claude logout && claude` and re-auth via browser.
- If using API key: confirm `ANTHROPIC_API_KEY` is exported in your current shell: `echo $ANTHROPIC_API_KEY` should print the key.

### Claude Code keeps asking "do you want to allow X?"
- That's by design. Approve genuinely useful ones; reject anything weird.
- If on a known-safe task and you want to fly through: `claude --dangerously-skip-permissions`. **Never use this for prompts that touch auth, payments, or DB migrations.**

### Plan mode won't exit
- Hit `Esc`. If that doesn't work, type `/exit` and start a new session.

### Claude Code is "forgetting" things from earlier in the session
- Run `/compact` to summarize the conversation.
- Or `/clear` to start fresh in the same session.
- For very long features, `/exit` between unrelated tasks.

### Claude Code suggested Prisma / Express / Redis / something we've banned
- It hasn't read CLAUDE.md. Confirm:
  ```
  > What ORM are we using on this project? Quote the source file.
  ```
  It should say "Drizzle, per CLAUDE.md §6". If it says Prisma, the file isn't being loaded — verify `CLAUDE.md` exists at the repo root with `ls /path/to/aida/CLAUDE.md`.

### The 800-line code splat that doesn't compile
- `git reset --hard HEAD` to throw it away.
- Start a fresh Claude Code session.
- Paste a smaller, more targeted prompt. The original was probably trying to do too much.

---

## pnpm / Node

### `EACCES` permission errors during `pnpm install`
- Don't `sudo`. Switch to nvm-managed Node.
- ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
  nvm install 20
  nvm use 20
  ```

### `pnpm install` hangs forever
- Usually a network issue with the registry.
- Try `pnpm install --network-concurrency=1`.
- Or switch registries: `pnpm config set registry https://registry.npmjs.org/`.

### `Cannot find module '@some/package'` after install
- Delete and reinstall:
  ```bash
  rm -rf node_modules pnpm-lock.yaml
  pnpm install
  ```

### `next: command not found` when running `pnpm dev`
- You're outside `apps/web`. `cd apps/web && pnpm dev`.

### Type errors after a Claude Code edit
- `pnpm typecheck` to see them all.
- Common: Claude removed an import. Hit `Cmd+.` in VS Code or paste the error back to Claude Code in a fresh session.

---

## Next.js / dev server

### `Module not found: Can't resolve '@/...'`
- The `@/*` import alias isn't configured. Check `tsconfig.json` has:
  ```json
  "paths": { "@/*": ["./*"] }
  ```

### Hydration mismatch errors in console
- A server-rendered value differs from client. Common causes:
  - Using `Date.now()` or `Math.random()` in a server component.
  - Reading `document` or `window` outside `useEffect`.
  - i18n locale mismatch — server cookie said `en` but client thinks `ms`.
- Fix: move dynamic logic into a `'use client'` component with `useEffect`, or use `suppressHydrationWarning` ONLY for things like timestamps where the mismatch is harmless.

### Infinite redirect loop on `/login`
- `middleware.ts` matcher is wrong. It's redirecting protected pages to `/login` and `/login` itself is protected.
- Confirm the matcher excludes `/login`, `/verify`, `/api/auth/*`, `/_next/*`, and static files.

### Dev server says "Port 3000 is in use"
- ```bash
  lsof -ti:3000 | xargs kill -9    # macOS/Linux
  ```
- Or run on another port: `pnpm dev -- -p 3001`.

---

## Supabase / Auth

### OTP code never arrives (email)
- Check Supabase Dashboard → Authentication → Logs. The code is logged there in dev.
- Use that code to verify.
- For prod, configure SMTP in Supabase Auth Settings.

### OTP code never arrives (SMS)
- Twilio is not configured. Either set up Twilio in Supabase Auth Providers (Twilio Account SID + Auth Token + Messaging Service SID + a Malaysian sender number), OR use email OTP for the demo.
- For the hackathon, the demo bypass (`/api/_demo/login`) avoids OTP entirely.

### "Invalid login credentials" on OTP verify
- The OTP expired (default 60 seconds). Tap "Resend code".
- Or you typed it wrong — phone keyboards autocorrect numbers sometimes.

### `getServerUser()` returns `null` even after login
- Cookie not being set properly.
- Check `lib/supabase/server.ts` uses `cookies()` from `next/headers` and sets cookies in the response.
- Confirm `middleware.ts` is calling `supabase.auth.getUser()` to refresh the session.

### Drizzle migrations fail with "permission denied for schema auth"
- Drizzle is trying to manage Supabase's auth schema. It can't.
- Comment out FK references to `auth.users(id)` in the schema.
- Re-generate the migration.
- Apply it.
- Manually add the FKs in Supabase SQL Editor:
  ```sql
  ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  ```

### RLS is blocking my queries from a Route Handler
- Route Handlers default to using the user's session (anon key). RLS applies.
- For privileged ops (admin scripts, seed scripts), use the **service role** client from `lib/supabase/admin.ts`. It bypasses RLS.
- Never expose the service role key to the client.

### Supabase pooler error: "prepared statement already exists"
- The transaction-mode pooler doesn't support prepared statements.
- In `lib/db/index.ts`, ensure `prepare: false` is set on the postgres client:
  ```ts
  const client = postgres(connectionString, { prepare: false });
  ```

---

## AWS / Bedrock

### `AccessDeniedException` from Bedrock
- Model access not enabled. DevOps must request it via Bedrock → Model Access → Manage model access → enable Anthropic models.
- Wait can take a few minutes.

### `ValidationException: This model is not supported in this region`
- Wrong model ID. Use the **APAC cross-region inference** profile, e.g. `apac.anthropic.claude-haiku-4-5-v1:0` — note the `apac.` prefix.
- Region must be `ap-southeast-1` (Singapore) or another APAC region that supports cross-region inference.

### `ResourceNotFoundException` — model not found
- Same as above. Check the exact model ID matches what's enabled in Bedrock console.

### Bedrock streaming throws partway through
- Common: client disconnected. Make sure your SSE handler in the Route Handler properly handles disconnects (try/catch around the `for await` loop).
- Vercel's serverless function timeout is 10s by default — bump to 30s in `vercel.json` for streaming routes.

### Textract returns empty `Blocks`
- Image quality too low or wrong format. Confirm:
  - File is JPEG/PNG/PDF (HEIC needs conversion first).
  - Resolution is at least 200 DPI for printed text.
  - The S3 object is in the same region as the Textract call (or use `S3Object` with cross-region — but easier to keep them aligned).

### Textract returns "InvalidS3ObjectException"
- The S3 key/bucket doesn't exist or Textract doesn't have permission.
- Verify with `aws s3 ls s3://<bucket>/<key>`.
- Verify the IAM role has `textract:DetectDocumentText` AND `s3:GetObject` on the bucket.

---

## Vercel

### Build fails on Vercel but works locally
- Vercel uses a clean install. Things that bite:
  - Environment variables not set on Vercel — check Project Settings → Environment Variables.
  - `pnpm-lock.yaml` not committed.
  - Node version mismatch — set Node 20 in Project Settings.
- View the full build log: Vercel → Deployments → click the failed deploy → Build Logs.

### `Database error` in production but works locally
- `DATABASE_URL` env var on Vercel is wrong, or it's not the pooler URL (port 6543), or the pooler isn't compatible with `prepare: true`.
- Use the **transaction pooler** URL from Supabase, not the direct connection.

### API route times out (504 Gateway Timeout)
- Default serverless function timeout is 10s.
- For AI streaming routes, set `maxDuration` in `vercel.json`:
  ```json
  {
    "functions": {
      "app/api/aida/chat/route.ts": { "maxDuration": 30 }
    }
  }
  ```

### Function works in preview but not production
- Env vars scoped to "Preview" only. Re-add them with scope "Production" or "All Environments".

---

## Drizzle

### `db:generate` produces an empty migration
- Drizzle doesn't see schema changes. Verify:
  - Your changes are in `apps/web/lib/db/schema.ts` (the path in `drizzle.config.ts`).
  - You saved the file.
- If still empty, delete `lib/db/migrations/meta/_journal.json` and try again — sometimes Drizzle's diff state corrupts.

### Drizzle Studio won't connect
- Make sure `DATABASE_URL` in `.env.local` is correct.
- Run from `apps/web/`: `pnpm db:studio`.
- Open https://local.drizzle.studio (it's a browser-hosted UI that talks to your local proxy).

---

## i18n / next-intl

### "Cannot find namespace 'NextIntl'" or similar TS error
- The next-intl plugin isn't picking up. Confirm `next.config.mjs` has:
  ```js
  import createNextIntlPlugin from 'next-intl/plugin';
  const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
  export default withNextIntl(nextConfig);
  ```

### Strings show as `app.name` instead of "AIDa"
- The translation key isn't found in the messages JSON OR `useTranslations()` is being called with the wrong namespace.
- Check the messages file actually has the key.
- Check the namespace prefix in `useTranslations('app')`.

### Switching language doesn't change anything
- Cookie not being set. Check `/api/locale` returns 200.
- Or: `router.refresh()` not being called after the POST. Add it.

---

## OCR

### "Image too large" error
- Compress client-side before upload. The `MyKadCapture` component should resize to max 1200px wide.
- AWS Textract limit: 10MB synchronous, 500MB async. 1200px JPEG at 80% is well under 1MB.

### OCR extracts text but Claude post-process returns garbage
- The OCR text may be mangled. Log the raw Textract output to debug.
- Try `claude-sonnet-4-6` instead of haiku for the post-process — it's better at reasoning under noise.

---

## Demo day

### "Demo as Mak Cik Aminah" button doesn't work
- `DEMO_LOGIN_TOKEN` env var not set on Vercel.
- Or `NEXT_PUBLIC_DEMO_MODE !== 'true'`.
- Manual fallback: log in with `demo+aminah@aida.demo` and password from password manager.

### Production app is blank/white
- Check browser console for the actual error.
- Check Vercel → Functions → Logs for server errors.
- If totally bricked: Vercel → Deployments → previous good deploy → Promote to Production. **30-second rollback.**

### AIDa chatbot is slow / not streaming
- Check `/api/aida/chat` Vercel function logs.
- Likely Bedrock cold start or rate limit. Hit "Try again" — second call usually fast.
- During pitch: have a screen recording of a working chat as backup.

### Match results are empty
- Profile incomplete in DB. Check `user_profiles` for the demo user.
- Re-run `pnpm seed:demo` against prod DB to reset.

---

## "Nothing makes sense, I just need it to work for the demo"

Last-resort sequence:
```bash
# 1. Make sure local works
cd apps/web
git stash
pnpm install
pnpm dev
# If localhost:3000 works → the prod issue is env vars or deployment

# 2. Make sure prod works
curl https://<your-app>.vercel.app/api/health
# If 200 → app is up; the issue is data or auth
# If 5xx → roll back to last good deploy

# 3. Make sure demo data is there
pnpm seed:demo  # against prod DATABASE_URL

# 4. Test the demo flow yourself end-to-end before showing the judges
```

If everything is broken: switch to the recorded demo video. Have one. Always.
