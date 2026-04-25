# 18 — Demo Seed (Mak Cik Aminah Account)

> **Goal**: A pre-seeded demo account that lands on a populated Home screen the second a judge logs in. Bypasses OTP delivery delays. The pitch demo's reliability backbone.
>
> **Time budget**: 30 minutes
> **Use `/plan` mode**: No

---

## Pre-flight check

- [ ] Prompt 17 deployed successfully
- [ ] Production URL works on phone
- [ ] Mak Cik Aminah persona spec from `BA_RESEARCH_GUIDE.md §5` is the source of truth

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/research/BA_RESEARCH_GUIDE.md (§5 personas), docs/dev/DEMO_DAY.md.

Goal: A bulletproof demo account. The judge taps a button and lands on a populated home screen with Mak Cik Aminah's matched aids, pre-applied tracker, and chat history.

Tasks:

1. Build a magic-login bypass for ONE specific demo account:
   - apps/web/app/api/_demo/login/route.ts (POST):
     - Accept body { token: string }.
     - Validate token === process.env.DEMO_LOGIN_TOKEN.
     - Use Supabase admin client to generateLink({ type: 'magiclink', email: 'demo+aminah@aida.demo' }).
     - Or simpler: directly create a session via supabase.auth.admin.signInWithPassword if you've created the user with a known password (use this approach — easier).
     - Set the session cookie.
     - Redirect to /.
   - The DEMO_LOGIN_TOKEN env var prevents random people from accessing this. Set it on Vercel.

2. Add a "Demo as Mak Cik Aminah" button on the /login page (only when DEMO_LOGIN_TOKEN is set, never in real production):
   - apps/web/components/feature/auth/DemoLoginButton.tsx — small, secondary-styled button. On click: POST to /api/_demo/login with the token (read from a public env var NEXT_PUBLIC_DEMO_TOKEN — yes, technically "public", but it's a hackathon demo, the threat model is tolerable).
   - Use a different approach: use a simpler token that's only on the server side. The client simply POSTs without a token, the server validates the request comes from the same origin, and grants only if NEXT_PUBLIC_DEMO_MODE === 'true'. Pick the simpler one and document the trade-off.

3. apps/web/scripts/seed-demo.ts — idempotent script that:
   a. Creates (or refreshes) the Aminah Supabase user via admin.createUser({ email: 'demo+aminah@aida.demo', password: <strong>, email_confirm: true }).
   b. Upserts user_profiles row matching the persona:
      - full_name: "Aminah binti Abdullah"
      - ic_number: "660102-08-1234" (a sample valid format)
      - dob: "1966-01-02"
      - gender: "F"
      - state: "SGR"
      - district: "Klang"
      - household_income_band: "below_2500"
      - household_size: 3
      - num_children: 2 (1 dependent adult, 1 schooling)
      - num_elderly: 0
      - employment_status: "self_employed"
      - religion: "islam"
      - disability_status: false
      - is_single_parent: true
      - is_caregiver_of_oku: false
      - ekasih_registered: "no"  ← deliberately "no" so we get a near-miss UX moment
      - education_status: null
      - language: "ms"
      - has_completed_onboarding: true
   c. Triggers the matching engine for this profile (pnpm tsx call directly OR call the /api/match endpoint via curl).
   d. Pre-creates a few tracker entries:
      - STR: status='applied', applied_at=last week
      - LZS Bantuan Bulanan: status='approved', decision_at=last month
      - SARA: status='near_miss' (because ekasih_registered = 'no')
      - JKM Bantuan Keluarga Miskin: status='eligible'
   e. Pre-seeds a few chat_messages so the chat looks "lived in":
      - User: "Saya ada anak 2 orang, layak ke bantuan tambahan?"
      - AIDa: <a thoughtful BM response naming relevant aids>
      - User: "Bila boleh apply STR?"
      - AIDa: <a BM response about the Oct–Nov window>
   f. Logs success.

4. Add to package.json scripts:
   "seed:demo": "tsx scripts/seed-demo.ts"

5. Document the demo flow in apps/web/scripts/README.md:
   - "Before each pitch, run pnpm seed:demo to refresh the demo account."
   - "Demo phone bookmarks the production URL. Tap 'Demo as Mak Cik Aminah' on the login page."
   - "If the magic-login fails for any reason, manually log in with email demo+aminah@aida.demo and password <stored in 1Password>."

6. Test on prod after deploying:
   - pnpm seed:demo (point DATABASE_URL at the prod Supabase).
   - Open the prod URL on phone, hit "Demo as Mak Cik Aminah".
   - Confirm: lands on home, sees matched aids, near-miss section showing SARA, AIDa chat has history.

7. Backup plan documented:
   - In docs/dev/DEMO_DAY.md add a section "If demo login fails":
     - Manual login: email demo+aminah@aida.demo, password from password manager.
     - Or: pre-recorded video already loaded in a browser tab.

Verify on the deployed URL:
- /login shows the "Demo as Mak Cik Aminah" button.
- Tap it → land on /, populated home.
- AIDa chat tab shows existing conversation in BM.
- Tracker shows pre-applied items.

Summarize and give commit message.

Do NOT skip the password fallback. We need belt + suspenders for demo day.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

After deploying this and running `pnpm seed:demo` against prod:

1. Open production URL on phone (incognito mode, fresh).
2. See "Demo as Mak Cik Aminah" button.
3. Tap → lands on populated home.
4. Click through every tab — everything has demo content.
5. AIDa chat tab — existing conversation in BM is visible.
6. Send a new message to AIDa — works.

Commit:
```bash
git add .
git commit -m "feat: demo seed script + magic login for Mak Cik Aminah persona"
git push
```

## You're done with the prompts.

Move to `docs/CHEAT_SHEET.md` and `docs/TROUBLESHOOTING.md` for ongoing reference. Then to `docs/PITCH_DEMO_SCRIPT.md` to prep the live demo flow.
