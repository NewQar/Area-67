# AIDa Developer Kit

> **Read this first. Then `00_DEVELOPER_SETUP.md`. Then start running prompts.**

This kit contains everything the AIDa developer needs to vibe-code the platform with Claude Code — from a fresh laptop to a deployed PWA — in a 36-hour hackathon.

---

## What's in here

```
aida-dev-kit/
├── README.md                          ← you are here
├── 00_DEVELOPER_SETUP.md              ← first read — install Claude Code, config repo
├── prompts/                           ← 18 copy-paste prompts, run in order
│   ├── 01_repo_bootstrap.md
│   ├── 02_database_schema.md
│   ├── 03_auth_phone_otp.md
│   ├── 04_app_shell.md
│   ├── 05_i18n_setup.md
│   ├── 06_onboarding_wizard.md
│   ├── 07_seed_aid_catalog.md
│   ├── 08_aids_browse.md
│   ├── 09_bedrock_client.md
│   ├── 10_matching_engine.md
│   ├── 11_home_screen.md
│   ├── 12_aida_chatbot.md
│   ├── 13_tracker.md
│   ├── 14_ocr_mykad.md
│   ├── 15_insights_dashboard.md
│   ├── 16_polish_and_translations.md
│   ├── 17_deploy_to_vercel.md
│   └── 18_demo_seed.md
├── docs/                              ← reference documents
│   ├── CHEAT_SHEET.md                 ← Claude Code commands + git commands at a glance
│   ├── TROUBLESHOOTING.md             ← every error you might hit, with fixes
│   ├── PROMPTING_PATTERNS.md          ← how to write good prompts when you go off-script
│   ├── PITCH_DEMO_SCRIPT.md           ← live demo walkthrough for pitch day
│   └── GIT_WORKFLOW.md                ← branch + commit conventions
└── reference/
    ├── ENV_VARS_REFERENCE.md          ← every env var, what it does, where it comes from
    └── PROJECT_FILE_MAP.md            ← what should exist by the end of each prompt
```

---

## The intended path through this kit

**Day 0 — Setup (1 hour, before the hackathon starts):**
1. Read `00_DEVELOPER_SETUP.md` end-to-end.
2. Install Claude Code, set up Supabase, get DevOps's AWS/Alibaba credentials.
3. Drop the `aida-docs/` folder (the previous deliverable — `CLAUDE.md`, `README.md`, `docs/`, `packages/aid-catalog/`) into the repo root.
4. Push initial commit to GitHub.

**Day 1 — Build (24 hours):**
- Run prompts `01` → `12`. Roughly the foundation + main features.
- Each prompt = one Claude Code session = one commit.
- Sleep at hour 16 if you can. Rotate with PM/BAs reviewing UI on real phones.

**Day 2 — Polish + deploy + demo prep (12 hours):**
- Run prompts `13` → `18`. Tracker, OCR, insights, polish, deploy.
- Last 2 hours: rehearse the demo using `docs/PITCH_DEMO_SCRIPT.md`.

---

## How to use a prompt file

Every prompt in `prompts/` follows the same structure:

1. **Pre-flight check** — verify dependencies are met.
2. **What this produces** — the file/folder list you'll end up with.
3. **The copy-paste prompt** — bounded by `▼▼▼` and `▲▲▲` markers. Copy everything between, paste into Claude Code.
4. **Verification** — terminal commands to confirm it worked.
5. **If something went wrong** — common failures and fixes.
6. **Move on to** — pointer to the next file.

**Don't skip prompts.** Each one assumes the previous ran cleanly. Don't reorder them — the dependency chain is real.

---

## When you're stuck

Read in this order:
1. `docs/TROUBLESHOOTING.md` — most likely your problem is here.
2. `docs/CHEAT_SHEET.md` — for "what was that command again?".
3. `docs/PROMPTING_PATTERNS.md` — when you need to ask Claude Code something not in a prompt file.
4. The relevant prompt file's "If something went wrong" section.

If still stuck after 15 minutes: ask in the team chat. Don't burn 90 minutes solo on the same wall.

---

## The two rules

1. **Commit after every working prompt.** Tiny commits = easy rollback.
2. **`/plan` mode for non-trivial prompts.** Each file tells you when. Listen to it.

---

Now open `00_DEVELOPER_SETUP.md`.
