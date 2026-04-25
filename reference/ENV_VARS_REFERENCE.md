# Environment Variables Reference

> Every env var AIDa uses. What it is, where it comes from, when to rotate, what to do if it leaks.

---

## How env vars work in this project

- **Local dev**: `apps/web/.env.local` (NEVER committed; in `.gitignore`).
- **Production (Vercel)**: Project Settings → Environment Variables.
- **Template**: `apps/web/.env.local.example` (committed, with placeholder values).

**Naming rule**: anything prefixed `NEXT_PUBLIC_` is exposed to the browser. Anything else is server-only. **Never** put a secret behind `NEXT_PUBLIC_`.

---

## Required env vars (local + prod)

### Supabase

| Var | Public | What | Where to find |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL | Supabase dashboard → Project Settings → API → "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Browser-safe public key (RLS-respected) | Supabase dashboard → Project Settings → API → "anon public" |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | **Bypasses RLS.** Server-only. | Supabase dashboard → Project Settings → API → "service_role" |
| `DATABASE_URL` | ❌ | Postgres connection string. **Use the transaction pooler** (port 6543), not the direct connection. | Supabase dashboard → Project Settings → Database → Connection string → "Transaction pooler" |

**If `SUPABASE_SERVICE_ROLE_KEY` leaks**: rotate immediately in Supabase dashboard → Project Settings → API → "Reset service_role secret". Update Vercel + local `.env.local`. Audit recent admin operations.

---

### AWS

| Var | Public | What |
|---|---|---|
| `AWS_REGION` | ❌ | Default region for AWS SDK. Set to `ap-southeast-1` (Singapore — required for Bedrock APAC). |
| `AWS_ACCESS_KEY_ID` | ❌ | Access key ID for the IAM user/role. |
| `AWS_SECRET_ACCESS_KEY` | ❌ | The secret. |
| `AWS_SESSION_TOKEN` | ❌ | Only set if using temporary credentials (e.g. STS-vended for hackathon credits). |
| `S3_REGION` | ❌ | Region for the S3 bucket. We use `ap-southeast-5` (Malaysia). |
| `S3_BUCKET` | ❌ | The S3 bucket name, e.g. `aida-docs-<team>`. |
| `BEDROCK_HAIKU_MODEL_ID` | ❌ | Full model ID with APAC inference profile prefix, e.g. `apac.anthropic.claude-haiku-4-5-v1:0` |
| `BEDROCK_SONNET_MODEL_ID` | ❌ | e.g. `apac.anthropic.claude-sonnet-4-6-v1:0` |

**Where to find**: DevOps creates an IAM user with attached policies, gives you the access key + secret. See `docs/cloud/CLOUD_RUNBOOK.md` for the IAM policy spec.

**If AWS keys leak**: rotate in IAM → Users → security credentials → Make Inactive on the key, create a new one. Update Vercel + local. **Check CloudTrail for unauthorized usage** in the last 24h.

---

### Alibaba Cloud (if used as primary DB)

| Var | Public | What |
|---|---|---|
| `ALIBABA_RDS_URL` | ❌ | PostgreSQL connection string for Alibaba RDS in `ap-southeast-3`. Format: `postgres://user:pass@host:port/db?sslmode=require`. |
| `ALIBABA_OSS_REGION` | ❌ | OSS region, `ap-southeast-3`. |
| `ALIBABA_OSS_BUCKET` | ❌ | Bucket name. |
| `ALIBABA_OSS_ACCESS_KEY_ID` | ❌ | RAM user access key. |
| `ALIBABA_OSS_ACCESS_KEY_SECRET` | ❌ | Secret. |

**Note**: For the hackathon, our `DATABASE_URL` points at Supabase (because Drizzle + Supabase Auth integration is already wired). The `ALIBABA_RDS_URL` is the migration target — set it but don't actively use it as primary unless you've completed the cutover. See `docs/cloud/CLOUD_RUNBOOK.md` §5.

---

### App config

| Var | Public | What |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✅ | The deployed origin, e.g. `https://aida.vercel.app`. Used for absolute URLs in OG tags, share links. |
| `NEXT_PUBLIC_QUICK_BI_URL` | ✅ | (Optional) Public Quick BI dashboard URL for /insights iframe. If unset, /insights falls back to synthetic charts. |

---

### Demo mode (production-only, for the pitch)

| Var | Public | What |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | ✅ | `true` to show the "Demo as Mak Cik Aminah" button on /login. **Set to `true` for the pitch URL only.** |
| `DEMO_LOGIN_TOKEN` | ❌ | Server-side guard for the magic-login endpoint. Generate a long random string; the client sends it via the demo button. |

**For real production launch**: both should be unset / `false`.

---

## The `.env.local.example` template

Save this exact file at `apps/web/.env.local.example`:

```bash
# ============================================
# AIDa env vars — copy to .env.local and fill in
# Never commit .env.local
# ============================================

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgres://postgres.<id>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# AWS
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
# AWS_SESSION_TOKEN=...   # only if temporary creds
S3_REGION=ap-southeast-5
S3_BUCKET=aida-docs-<team>
BEDROCK_HAIKU_MODEL_ID=apac.anthropic.claude-haiku-4-5-v1:0
BEDROCK_SONNET_MODEL_ID=apac.anthropic.claude-sonnet-4-6-v1:0

# Alibaba (used post-cutover; safe to leave blank for v1)
# ALIBABA_RDS_URL=postgres://...:5432/aida?sslmode=require
# ALIBABA_OSS_REGION=ap-southeast-3
# ALIBABA_OSS_BUCKET=aida-docs-<team>
# ALIBABA_OSS_ACCESS_KEY_ID=...
# ALIBABA_OSS_ACCESS_KEY_SECRET=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
# NEXT_PUBLIC_QUICK_BI_URL=https://...

# Demo mode (set to true on pitch URL only)
NEXT_PUBLIC_DEMO_MODE=false
DEMO_LOGIN_TOKEN=
```

---

## Setting env vars on Vercel

**Web UI**: Project → Settings → Environment Variables → Add. Pick the right scope (Production / Preview / Development).

**CLI**:
```bash
cd apps/web
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# (paste value when prompted)
```

**Bulk import from `.env.local`**:
```bash
# DON'T just `vercel env pull` — that downloads. To upload:
# Use the web UI for bulk paste, or write a one-liner:
while IFS='=' read -r key val; do
  [[ $key =~ ^# ]] && continue
  [[ -z $key ]] && continue
  echo "$val" | vercel env add "$key" production
done < .env.local
```

---

## Local dev quick check

```bash
cd apps/web
# Confirm .env.local exists
ls -la .env.local

# Confirm critical vars are set
cat .env.local | grep -E '^(DATABASE_URL|NEXT_PUBLIC_SUPABASE_URL|AWS_REGION|BEDROCK_HAIKU_MODEL_ID)='

# Test DB connection
pnpm db:studio   # should open the studio without errors

# Test Bedrock (after signing in)
curl -b cookies.txt http://localhost:3000/api/_dev/bedrock-ping
```

---

## Production sanity check

```bash
# After deploying, hit health:
curl https://<your-app>.vercel.app/api/health
# Should return JSON with version, region, ts

# If it returns 500: check Vercel function logs for missing env vars
```

---

## Security hygiene during the hackathon

- Never paste an env var value in a Claude Code prompt or in a Slack message.
- Never put env values into a committed file (`.env.local.example` only has placeholders).
- If a value leaks (committed by accident, pasted in a public channel): rotate **immediately**. Don't wait.
- After the hackathon: rotate everything anyway. Hackathon credentials get reused; reused credentials are leaked credentials.
