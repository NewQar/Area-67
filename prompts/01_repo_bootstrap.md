# 01 — Repo Bootstrap

> **Goal**: Scaffold the Next.js 15 PWA, install all dependencies, set up the folder structure, and get `pnpm dev` running on `http://localhost:3000`.
>
> **Time budget**: 30 minutes
> **Use `/plan` mode**: No (mechanical task)

---

## Pre-flight check

- [ ] `00_DEVELOPER_SETUP.md` completed
- [ ] You are in `~/code/aida` (or wherever your repo lives)
- [ ] `CLAUDE.md`, `README.md`, and the `docs/` folder are at the repo root
- [ ] `git status` shows a clean working tree
- [ ] `node --version` shows 20+, `pnpm --version` shows 9+

## What this prompt produces

```
aida/
├── apps/
│   └── web/                    ← Next.js 15 PWA
│       ├── app/                ← App Router
│       ├── components/
│       │   └── ui/             ← shadcn components live here
│       ├── lib/
│       ├── messages/           ← i18n JSON
│       ├── public/
│       │   ├── manifest.json
│       │   └── icons/
│       ├── package.json
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── .env.local.example
├── pnpm-workspace.yaml
├── package.json
└── .gitignore (updated)
```

## How to run

1. `cd ~/code/aida`
2. `claude`
3. Paste the prompt below
4. Approve file edits as Claude Code asks
5. Run the verification commands

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, README.md, and docs/dev/DEVELOPER_GUIDE.md before doing anything else.

I'm starting the AIDa repo. Bootstrap the Next.js 15 app exactly as specified in DEVELOPER_GUIDE.md §1.

Constraints:
- Use pnpm, never npm.
- Use a pnpm workspace at the repo root, with apps/web as the Next.js app.
- TypeScript strict mode, App Router, Tailwind, ESLint, NO src/ dir.
- Import alias: @/*
- Node 20.

Tasks (do these in order, stop after each so I can confirm):

1. Create the root `package.json` and `pnpm-workspace.yaml` so apps/web is a workspace package.

2. Inside apps/web, scaffold a Next.js 15 app:
   pnpm dlx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias="@/*" --use-pnpm
   (Run this from the apps/web folder. Confirm the .gitignore created plays well with our existing one — merge if needed.)

3. Install runtime dependencies (single pnpm command from apps/web):
   - zustand
   - @tanstack/react-query
   - react-hook-form
   - zod
   - @hookform/resolvers
   - drizzle-orm
   - postgres
   - @supabase/supabase-js
   - @supabase/ssr
   - next-intl
   - lucide-react
   - @aws-sdk/client-bedrock-runtime
   - @aws-sdk/client-s3
   - @aws-sdk/client-textract
   - @aws-sdk/client-comprehend
   - @aws-sdk/s3-request-presigner
   - clsx
   - tailwind-merge
   - class-variance-authority

4. Install dev dependencies:
   - drizzle-kit
   - @types/node
   - tsx
   - dotenv-cli

5. Initialize shadcn/ui in apps/web:
   pnpm dlx shadcn@latest init
   When prompted: TypeScript yes, default style, slate base color, CSS variables yes, app/globals.css path, no react server components rsc setting (it should auto-detect App Router).

6. Add these initial shadcn components:
   pnpm dlx shadcn@latest add button card input label select dialog sheet drawer toast skeleton progress badge avatar tabs separator

7. Create the folder skeleton inside apps/web:
   - lib/ai/         (with a placeholder index.ts)
   - lib/ai/prompts/ (empty)
   - lib/db/         (with a placeholder index.ts)
   - lib/i18n/       (empty)
   - lib/utils.ts    (already exists from shadcn — leave it)
   - messages/en.json with {"app": {"name": "AIDa"}}
   - messages/ms.json with {"app": {"name": "AIDa"}}
   - messages/zh.json with {"app": {"name": "AIDa"}}
   - messages/ta.json with {"app": {"name": "AIDa"}}
   - components/feature/ (empty placeholder)

8. Create apps/web/.env.local.example with all the env vars listed in docs/dev/DEVELOPER_GUIDE.md §1.3, with placeholder values. Include a comment header saying "Copy to .env.local and fill in real values. Never commit .env.local."

9. Update the root .gitignore to also ignore apps/web/.env.local, apps/web/.env*.local, and apps/web/.next/.

10. Create a top-level apps/web/README.md with: a one-line description, "pnpm dev" / "pnpm build" / "pnpm lint" commands, and a link back to the root README.md.

11. Update apps/web/package.json scripts to include:
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"

12. Replace apps/web/app/page.tsx with a simple placeholder server component that says "AIDa — coming soon" centered on the page, using a Card from shadcn. Use Tailwind for layout. No client component needed.

13. Verify:
    - cd apps/web && pnpm install (should succeed)
    - pnpm dev (should start on :3000 and the placeholder page should render)

Do NOT add anything beyond what I asked. Do NOT install Prisma, Express, Redis, or any other framework. Do NOT add tests yet. Do NOT initialize Drizzle config — that's the next prompt.

After all 13 steps are done, summarize what was created and tell me the exact commit message I should use.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

---

## Verification

After Claude Code finishes, run these in your terminal:

```bash
cd ~/code/aida/apps/web
pnpm install
pnpm typecheck   # should pass with 0 errors
pnpm dev
```

Open http://localhost:3000. You should see "AIDa — coming soon" in a card.

`Ctrl+C` to stop. Then commit:
```bash
cd ~/code/aida
git add .
git commit -m "feat: bootstrap Next.js 15 PWA with Tailwind, shadcn, and dependencies"
git push
```

## If something went wrong

- **`pnpm install` fails**: Delete `apps/web/node_modules` and `pnpm-lock.yaml`, re-run.
- **shadcn init asked questions Claude didn't answer**: It will have committed defaults — usually fine. Verify `components.json` exists in `apps/web/`.
- **`pnpm dev` shows blank page or hydration errors**: Open browser console, screenshot the error, paste back into a fresh Claude Code session: "I ran prompt 01. The dev server shows this error: [paste]. Fix it."

## Move on to

`prompts/02_database_schema.md`
