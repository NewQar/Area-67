# 17 — Deploy to Vercel (Production URL)

> **Goal**: A real public URL, deployed from `main`, with all env vars set, and the demo working end-to-end on a phone.
>
> **Time budget**: 30 minutes
> **Use `/plan` mode**: No

---

## Pre-flight check

- [ ] Prompt 16 committed and pushed to `main`
- [ ] Vercel account created and linked to GitHub
- [ ] You have all production env vars ready in your password manager

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/cloud/CLOUD_RUNBOOK.md (§6 deployment).

Goal: Configure the repo for production deploy on Vercel.

Tasks:

1. Verify apps/web/next.config.mjs is production-ready:
   - PWA configuration enabled in production (if using next-pwa or manual SW).
   - Output: standalone if needed for Vercel — but Vercel handles Next without it. Confirm.
   - reactStrictMode: true.
   - experimental.serverActions: only if used.

2. Verify the Drizzle DB connection works in serverless:
   - In lib/db/index.ts, confirm `prepare: false` is set on the postgres client (Supabase pooler requirement).
   - Confirm pool size is small (max: 1 in serverless functions; 10 only on persistent server).

3. Add a vercel.json at apps/web/ if needed:
   - Configure functions region: "iad1" by default isn't great for SEA. Set to "sin1" (Singapore — closest to Malaysia, lowest latency to Bedrock ap-southeast-1, lowest latency to Alibaba ap-southeast-3).
   - Example:
     {
       "regions": ["sin1"],
       "functions": {
         "app/api/aida/chat/route.ts": { "maxDuration": 30 },
         "app/api/match/route.ts": { "maxDuration": 30 },
         "app/api/ocr/mykad/route.ts": { "maxDuration": 30 }
       }
     }

4. Health check endpoint:
   - apps/web/app/api/health/route.ts (GET):
     - No auth.
     - Returns { ok: true, version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7) ?? 'dev', region: process.env.VERCEL_REGION ?? 'local', ts: new Date().toISOString() }.
   - Used for uptime monitoring and demo-day verification.

5. Tell me the exact steps to deploy on Vercel:
   a. Vercel → "Import Project" → pick the GitHub repo.
   b. Framework preset: Next.js (auto-detected).
   c. Root directory: apps/web.
   d. Build command: pnpm build (auto).
   e. Output directory: .next (auto).
   f. Install command: pnpm install --frozen-lockfile.
   g. Node version: 20.
   h. Add ALL env vars from .env.local.example (paste them in one by one OR use Vercel CLI). The full list:
      - NEXT_PUBLIC_SUPABASE_URL
      - NEXT_PUBLIC_SUPABASE_ANON_KEY
      - SUPABASE_SERVICE_ROLE_KEY
      - DATABASE_URL
      - AWS_REGION
      - AWS_ACCESS_KEY_ID
      - AWS_SECRET_ACCESS_KEY
      - AWS_SESSION_TOKEN (if temporary creds)
      - S3_BUCKET, S3_REGION
      - BEDROCK_HAIKU_MODEL_ID, BEDROCK_SONNET_MODEL_ID
      - ALIBABA_RDS_URL (if used)
      - NEXT_PUBLIC_APP_URL (set this to the assigned vercel.app URL)
      - NEXT_PUBLIC_QUICK_BI_URL (optional)
   i. Deploy.

6. Post-deploy checklist (give me as a copy-pasteable terminal block):

   # Verify it's up
   curl https://<your-app>.vercel.app/api/health

   # Open the deployed site on your phone
   # - Sign up
   # - Complete onboarding
   # - Confirm /api/match returns
   # - Send a chat message to AIDa

7. Set up automatic preview deploys:
   - Push to a feature branch → Vercel auto-creates a preview URL.
   - Push to main → production deploy.
   - We use main as the demo branch.

8. Production safeguards:
   - Vercel project settings → Deployment Protection → consider "Vercel Authentication" for non-prod environments. Demo URL stays public.
   - Set environment variable scope correctly:
     - "Production" only: AWS_*, SUPABASE_SERVICE_ROLE_KEY (sensitive)
     - "All Environments": NEXT_PUBLIC_* (safe)

9. Custom domain (optional, time permitting):
   - Vercel has free vercel.app subdomains; we can use that for the demo.
   - Setting up a real domain takes 30+ minutes for DNS propagation; skip unless time is generous.

10. Rollback safety:
    - Vercel keeps every deployment. If a deploy breaks, "Promote to Production" on the prior good one in 30 seconds.

Do NOT change the build to use Edge runtime — Bedrock SDK is Node-only and we have route handlers using it. Default Node serverless runtime is correct.

After tasks are complete, summarize the deploy URL and the commit message.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

```bash
# After Vercel deploy completes:
curl https://<your-app>.vercel.app/api/health
# { "ok": true, "version": "abc1234", "region": "sin1", "ts": "..." }

# Open the URL on your phone — go through the entire flow
```

Commit:
```bash
git add .
git commit -m "chore: vercel.json + health endpoint + deployment config"
git push
```

## Move on to

`prompts/18_demo_seed.md`
