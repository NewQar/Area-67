# 02 — Database Schema with Drizzle

> **Goal**: Define every table from CLAUDE.md §7 in Drizzle, configure Drizzle Kit, generate the first migration, and apply it to Supabase.
>
> **Time budget**: 30 minutes
> **Use `/plan` mode**: Yes (review the schema before code)

---

## Pre-flight check

- [ ] Prompt 01 committed
- [ ] Supabase project created (see `00_DEVELOPER_SETUP.md` §4.1)
- [ ] `apps/web/.env.local` exists with `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` filled in
- [ ] `pnpm dev` still runs successfully

> **Important**: This prompt sets up Drizzle pointing to Supabase Postgres for now. We will switch the primary connection to **Alibaba RDS** in a later step (or in `.env.local`) — the schema is portable, just the connection string changes.

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md (especially §7 Data Model), README.md, and docs/dev/DEVELOPER_GUIDE.md before starting.

Use /plan first. Show me the schema design as a markdown table, then wait for my approval before generating code.

I want to set up the Drizzle ORM database layer for AIDa, pointing at the DATABASE_URL in apps/web/.env.local (Supabase Postgres for now).

Tables to create (per CLAUDE.md §7):

1. users — managed by Supabase Auth, but we need a public.profiles row keyed off auth.users.id
2. user_profiles — the matching key (extends users with all the personal info)
3. aids — the catalog
4. applications — user × aid attempts
5. chat_messages — AIDa chat history
6. documents — uploaded files

Constraints:
- Use drizzle-orm with the postgres-js driver.
- Drizzle config file at apps/web/drizzle.config.ts.
- Schema file at apps/web/lib/db/schema.ts.
- Drizzle DB client at apps/web/lib/db/index.ts (export `db`).
- Migrations folder at apps/web/lib/db/migrations.
- Use uuid() default for id columns. Use timestamps with timezone.
- Use jsonb for structured fields like eligibility_criteria, application_steps, ocr_extracted, metadata.
- Use Drizzle's pgEnum for status fields where appropriate.
- Reference auth.users(id) for the user_id FK on user_profiles, applications, chat_messages, documents. (Drizzle can reference an external schema with sql\`auth.users\`.)
- Add indexes on user_id, aid_id, status, and language fields.
- Encryption note: ic_number should be a text column, but write a comment that production will use pgcrypto pgp_sym_encrypt — for hackathon we store as plain text but never log it.

Specific column shapes:

user_profiles:
- id (uuid, pk, default gen_random_uuid())
- user_id (uuid, FK auth.users(id), unique, not null, on delete cascade)
- full_name (text)
- ic_number (text)
- dob (date)
- gender (text)
- state (text — Malaysian state code, e.g. 'SGR', 'KUL')
- district (text)
- household_income_band (pgEnum: 'below_2500', '2501_5000', '5001_10000', 'above_10000', 'unknown')
- household_size (integer)
- num_children (integer default 0)
- num_elderly (integer default 0)
- employment_status (pgEnum: 'employed', 'self_employed', 'unemployed', 'student', 'retired', 'unknown')
- religion (text — nullable)
- disability_status (boolean default false)
- is_single_parent (boolean default false)
- is_caregiver_of_oku (boolean default false)
- ekasih_registered (pgEnum: 'yes', 'no', 'unknown')
- education_status (text)
- language (pgEnum: 'en', 'ms', 'zh', 'ta', default 'en')
- created_at, updated_at (timestamptz with default now())

aids:
- id (text, pk — slug-style like "str-2026")
- slug (text, unique)
- name (jsonb — {ms, en, zh, ta})
- provider (text)
- category (pgEnum: 'cash', 'groceries', 'medical', 'education', 'housing', 'business', 'registration')
- is_recurring (boolean)
- is_religion_specific (text — nullable, e.g. 'islam')
- is_state_specific (text — nullable, e.g. 'selangor')
- is_active (boolean default true)
- application_window (jsonb)
- amount (jsonb)
- eligibility_criteria (jsonb)
- required_documents (text[])
- application (jsonb)  -- includes online_url, offline_options, steps, renewal info
- linked_aids (text[])
- tags (text[])
- source_urls (text[])
- last_verified_at (date)
- created_at, updated_at (timestamptz)

applications:
- id (uuid, pk, default gen_random_uuid())
- user_id (uuid, FK auth.users(id), not null, on delete cascade)
- aid_id (text, FK aids.id, not null)
- status (pgEnum: 'eligible', 'near_miss', 'applied', 'approved', 'rejected', 'renewal_due', 'expired')
- match_metadata (jsonb — matched criteria, gaps, next step)
- applied_at (timestamptz, nullable)
- decision_at (timestamptz, nullable)
- next_action (text)
- notes (text)
- created_at, updated_at (timestamptz)
- unique constraint on (user_id, aid_id)

chat_messages:
- id (uuid, pk, default gen_random_uuid())
- user_id (uuid, FK auth.users(id), not null, on delete cascade)
- role (pgEnum: 'user', 'aida', 'system')
- content (text)
- lang (pgEnum: 'en', 'ms', 'zh', 'ta')
- metadata (jsonb — citations, suggested_replies, model used)
- created_at (timestamptz)

documents:
- id (uuid, pk, default gen_random_uuid())
- user_id (uuid, FK auth.users(id), not null, on delete cascade)
- type (pgEnum: 'mykad', 'payslip', 'utility_bill', 'birth_cert', 'oku_card', 'other')
- s3_key (text, not null)
- s3_bucket (text, not null)
- ocr_extracted (jsonb)
- uploaded_at (timestamptz default now())

Tasks:

1. Create apps/web/drizzle.config.ts pointing at lib/db/schema.ts and lib/db/migrations.

2. Create apps/web/lib/db/schema.ts with all tables above. Export every table and every enum.

3. Create apps/web/lib/db/index.ts that:
   - Reads DATABASE_URL from env.
   - Creates a postgres client with prepare: false (Supabase pooler requirement).
   - Exports `db` — a drizzle instance bound to the schema.
   - Exports a `closeDb()` helper for tests/scripts.

4. Create apps/web/lib/db/types.ts that exports Drizzle-inferred Insert and Select types for every table:
   e.g. `export type Aid = typeof aids.$inferSelect; export type NewAid = typeof aids.$inferInsert;`

5. Generate the first migration: `pnpm db:generate`. Verify the SQL looks correct.

6. Add a SQL file at apps/web/lib/db/migrations/0001_rls.sql with row-level security policies:
   - Enable RLS on user_profiles, applications, chat_messages, documents.
   - Policies: only the authenticated user (auth.uid() = user_id) can SELECT/INSERT/UPDATE/DELETE rows where user_id matches.
   - The aids table is publicly readable (no RLS) but writes are restricted to service_role.
   Then have me apply it manually via Supabase SQL editor — explain the steps.

7. Apply the Drizzle migration to Supabase: `pnpm db:migrate`. If it fails because Drizzle doesn't know about the auth schema, give me the workaround (typically: define a stub auth.users table reference in schema and mark it as external).

After all 7 steps are done, summarize the schema, list the file paths created, and tell me the commit message.

Do NOT seed any data yet — that's prompt 07. Do NOT write any UI yet.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

---

## Verification

```bash
cd ~/code/aida/apps/web

# Type check
pnpm typecheck

# Verify Drizzle Studio can connect
pnpm db:studio
# Should open a browser tab at https://local.drizzle.studio with the empty tables visible
```

Then in the Supabase dashboard → Database → Tables, confirm you can see: `user_profiles`, `aids`, `applications`, `chat_messages`, `documents`. You'll also see `auth.users` (managed by Supabase).

Run the RLS SQL manually in Supabase → SQL Editor:
```sql
-- paste the contents of apps/web/lib/db/migrations/0001_rls.sql
```

Verify RLS is on by going to Database → Tables → click any table → Auth Policies tab.

Commit:
```bash
git add .
git commit -m "feat: drizzle schema and RLS policies for all core tables"
git push
```

## If something went wrong

- **`pnpm db:migrate` fails with "permission denied for schema auth"**: That's expected. Drizzle doesn't manage auth schema. Comment out the FK references temporarily, regenerate migration, apply, then add FKs back manually via SQL editor as `references auth.users(id) on delete cascade`.
- **RLS blocks your local queries**: Use the `service_role` key for server-side queries (it bypasses RLS). The anon key respects RLS.

## Move on to

`prompts/03_auth_phone_otp.md`
