# Cheat Sheet

> Quick reference. One screen, no scrolling needed at 3am.

---

## Claude Code

| Command | What it does |
|---|---|
| `claude` | Start a session in the current directory |
| `claude --plan` | Start in plan mode (proposes before editing) |
| `claude --model claude-sonnet-4-6` | Override the model (use `claude-opus-4-7` for hard problems, `claude-haiku-4-5` for quick edits) |
| `claude --version` | Print version |
| `claude doctor` | Health check |
| `claude logout` then `claude` | Re-authenticate |
| `claude --dangerously-skip-permissions` | Skip approval prompts (use sparingly, only on safe tasks) |

### Inside a session

| Slash command | What it does |
|---|---|
| `/plan` | Enter plan mode — Claude proposes changes, you approve |
| `Esc` (in plan mode) | Exit plan mode |
| `/clear` | Clear conversation context (use between features) |
| `/compact` | Summarize long conversation to save tokens |
| `/cost` | Show token usage and $ for this session |
| `/init` | Generate a CLAUDE.md (we have one already — only use to merge) |
| `/exit` or `Ctrl+D` | Leave the session |
| `Esc` (during generation) | Cancel current response |

### Power moves

```bash
# Plan-then-implement workflow (use for any non-trivial change)
claude
> /plan
> Read X, Y, Z. Propose a plan to do A.  ← Claude plans only
> [review, push back, agree]
> Esc                                     ← exits plan mode
> Implement the plan.                     ← now it edits

# Reset and start clean if Claude is confused
> /clear                                  ← clears context, same session
> /exit                                   ← full reset, new session next time
```

---

## Git

```bash
# Daily start
git pull
git checkout -b feat/<feature>

# Daily stop
git status
git diff                                  # review what changed
git add -p                                # stage selectively
git commit -m "feat: <short message>"
git push

# Roll back a Claude Code disaster
git reset --hard HEAD                     # nuke uncommitted changes
git reset --hard HEAD~1                   # nuke the last commit (gone)
git revert HEAD                           # safer: new commit that reverses

# See what just happened
git log --oneline -10
git show HEAD                             # what was in the last commit?

# Compare branches
git diff main..feat/onboarding
```

### Commit message format
```
<type>: <short message>
```
Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`.

---

## pnpm (in `apps/web/`)

```bash
pnpm install                              # install deps
pnpm dev                                  # start dev server :3000
pnpm build                                # production build (run before deploying)
pnpm lint                                 # ESLint
pnpm typecheck                            # tsc --noEmit
pnpm db:generate                          # generate Drizzle migration
pnpm db:migrate                           # apply migrations
pnpm db:studio                            # open Drizzle Studio (browser)
pnpm seed:aids                            # seed aid catalog from JSON
pnpm seed:demo                            # seed Mak Cik Aminah demo account
```

### Adding a package
```bash
pnpm add <pkg>                            # runtime
pnpm add -D <pkg>                         # dev
pnpm add @repo/aid-catalog --workspace    # workspace (rare)
```

### When deps go weird
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Supabase

```bash
# Where to look:
# Project: https://supabase.com/dashboard/project/<id>
# Auth Logs: Project → Authentication → Logs (find OTP codes here in dev)
# Tables: Project → Database → Tables
# SQL Editor: Project → SQL Editor (run RLS policies, ad-hoc queries)
# Connection string: Project → Settings → Database → Connection string

# Reset auth for dev — delete the test user from dashboard, OTP starts fresh
```

---

## AWS

```bash
# Smoke test Bedrock from your laptop
aws bedrock-runtime invoke-model \
  --region ap-southeast-1 \
  --model-id apac.anthropic.claude-haiku-4-5-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":50,"messages":[{"role":"user","content":"hi"}]}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/out.json && cat /tmp/out.json

# Smoke test Textract (replace bucket + key)
aws textract detect-document-text \
  --region ap-southeast-5 \
  --document '{"S3Object":{"Bucket":"aida-docs-<team>","Name":"test.jpg"}}'

# List S3 bucket contents
aws s3 ls s3://aida-docs-<team>/ --recursive --region ap-southeast-5
```

---

## Vercel

```bash
# Install CLI (one-time)
pnpm add -g vercel

# Link the local project to a Vercel project
cd apps/web && vercel link

# Deploy a preview
vercel

# Deploy production
vercel --prod

# Set an env var
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# View logs of latest deploy
vercel logs <deployment-url>

# Promote a previous deploy to production (rollback)
# Via web UI: Project → Deployments → ⋯ → Promote to Production
```

---

## Quick health checks

```bash
# Is the app up?
curl https://<your-app>.vercel.app/api/health

# Is Bedrock reachable from the deployed server?
curl https://<your-app>.vercel.app/api/_dev/bedrock-ping
# (Auth-required; do this from a logged-in browser session if curl fails)

# Is the matching engine working?
# Sign in, then visit /api/match in browser (it's POST — use the home page instead)
```

---

## "I forgot what to do next" — quick decision tree

```
A prompt failed?                          →  TROUBLESHOOTING.md
A type error in some file Claude wrote?   →  Show the error to a fresh Claude Code session: "Fix this type error: <paste>"
The dev server crashed?                   →  Stop with Ctrl+C, restart with pnpm dev. Read the stack trace.
Something works locally but not in prod?  →  Check Vercel env vars match .env.local
Bedrock returns 403?                      →  DevOps; model access not granted
Can't sign in?                            →  Supabase Auth Logs (find the OTP code)
Demo URL is down?                         →  Vercel Deployments → previous deploy → Promote to Production
```
