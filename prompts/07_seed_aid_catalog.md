# 07 — Seed the Aid Catalog

> **Goal**: Load the BAs' `packages/aid-catalog/aids.json` into the `aids` table. Handle re-running idempotently.
>
> **Time budget**: 20 minutes
> **Use `/plan` mode**: No (mechanical task)

---

## Pre-flight check

- [ ] Prompt 06 committed
- [ ] `packages/aid-catalog/aids.json` exists with at least 5 aids (the starter set we provided)
- [ ] BA1 has been notified to keep adding to this file as research progresses

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, lib/db/schema.ts, and packages/aid-catalog/aids.json.

Goal: Build a seed script that loads packages/aid-catalog/aids.json into the aids table. Should be idempotent (UPSERT, not INSERT) so BAs can keep editing the JSON and re-running.

Tasks:

1. Create apps/web/scripts/seed-aids.ts:
   - Loads .env.local via dotenv.
   - Reads ../../packages/aid-catalog/aids.json (relative to apps/web).
   - Validates each entry against a Zod schema matching our aids table shape (transform JSON nested objects to match column names).
   - UPSERTs into the aids table using Drizzle's onConflictDoUpdate on the id column.
   - Logs "Inserted X aids, updated Y aids" at the end.
   - Exits with code 0 on success, 1 on any validation error (printing the offending entry).

2. Add to apps/web/package.json scripts:
   "seed:aids": "tsx scripts/seed-aids.ts"

3. Run pnpm seed:aids and confirm via Drizzle Studio that all aids are loaded.

4. Create apps/web/lib/data/aids.ts — server-side data access helpers:
   - getAllAids(): returns all active aids ordered by category, name.
   - getAidById(id): returns one aid or null.
   - getAidsByCategory(category): filtered list.
   - getAidsByLanguage(locale): returns aids with names in the requested locale picked.
   - All cached with Next.js unstable_cache (revalidate: 300 seconds).

5. Quick sanity test — create apps/web/app/api/aids/route.ts (GET handler):
   - Returns getAllAids() as JSON.
   - Public (no auth needed — aid catalog is public).
   - Visit http://localhost:3000/api/aids in the browser, confirm JSON response with all aids.

6. Tell me how to re-run seeding when BA updates aids.json:
   "pnpm seed:aids" — that's it. No migration needed because it's a data update, not a schema change.

Verify:
- pnpm seed:aids → success log
- Drizzle Studio: aids table has rows
- /api/aids returns JSON with the aids
- Re-run pnpm seed:aids → "Updated X aids" (idempotent)

Summarize and give commit message.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

```bash
cd ~/code/aida/apps/web
pnpm seed:aids
curl http://localhost:3000/api/aids | jq '.[0]'  # should print first aid
pnpm seed:aids  # should print "Updated 5 aids"
```

Commit:
```bash
git add .
git commit -m "feat: idempotent aid catalog seed script and data helpers"
git push
```

## Move on to

`prompts/08_aids_browse.md`
