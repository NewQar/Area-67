# 13 — Tracker (Applied / Eligible / Renewals)

> **Goal**: User sees what they've applied to, what they're eligible for but haven't applied, and what's coming up for renewal. Includes per-aid document checklist.
>
> **Time budget**: 60 minutes
> **Use `/plan` mode**: Yes

---

## Pre-flight check

- [ ] Prompt 12 committed
- [ ] `applications` table has rows from prompt 10's matching run

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md (§7 schema), docs/research/BA_RESEARCH_GUIDE.md (the renewal_required field on aids), and existing components/feature/aids/.

Use /plan. Show the tab structure and data shapes.

Goal: Build the Tracker tab. Three tabs inside it: Applied, Eligible, Renewals.

Tasks:

1. apps/web/app/(app)/tracker/page.tsx (server component):
   - Auth.
   - Fetch applications joined with aids for the current user.
   - Compute three buckets:
     - Applied: status in ('applied', 'approved', 'rejected')
     - Eligible: status in ('eligible', 'near_miss') AND not applied
     - Renewals: status = 'approved' AND aid.is_recurring AND application_window opens within next 60 days, OR status = 'renewal_due'
   - Render <TrackerScreen> with the three buckets.

2. apps/web/components/feature/tracker/TrackerScreen.tsx (client):
   - shadcn Tabs with 3 tabs: Applied / Eligible / Renewals.
   - Counts in tab labels: "Applied (3)" / "Eligible (5)" / "Renewals (1)".
   - Each tab body: vertical stack of TrackerItem cards.

3. apps/web/components/feature/tracker/TrackerItem.tsx:
   - Aid name, provider, amount.
   - Status pill (color-coded).
   - "Applied {date}" / "Decision: {decision}" / "Renewal opens {date}" depending on bucket.
   - Expandable "Documents" section showing a checklist of required_documents — checkbox per item, persists locally to user_profiles or a new user_aid_documents table (TODO; for now, persist to localStorage keyed by user+aid).
   - Action buttons:
     - Eligible bucket: "Mark as applied" + "Open application"
     - Applied bucket: "Mark as approved" / "Mark as rejected"
     - Renewals bucket: "Apply now" + "Snooze 7 days"

4. apps/web/app/api/applications/[id]/route.ts (PATCH):
   - Auth + ownership check (user_id = auth.uid()).
   - Body: { status?, applied_at?, decision_at?, notes? }.
   - Validate enum values for status.
   - Update + return updated row.

5. apps/web/app/api/applications/route.ts (POST):
   - Used when "Mark as applied" creates a new application row (in case matching never persisted it for an ineligible-now-applying scenario).
   - Body: { aidId, status }.
   - Upserts.

6. apps/web/components/feature/tracker/DocumentChecklist.tsx:
   - Renders the required_documents array as checkboxes.
   - State persists to localStorage (key: aida_docs_{userId}_{aidId}).
   - "Upload {document}" button next to each — for THIS prompt, just shows a file picker that uploads to /api/documents/upload (POST). The actual S3 wiring is in prompt 14 — for now, stub with TODO and use a fake "Uploaded ✓" state in localStorage.

7. apps/web/components/feature/tracker/RenewalReminderCard.tsx:
   - Used in Renewals tab.
   - Highlights the open/close window dates.
   - Big primary CTA: "Apply now".
   - Snooze sets a `snoozed_until` field in localStorage that hides the card for 7 days.

8. Empty states:
   - Applied empty: "Tap 'Mark as applied' on an eligible aid to track it here."
   - Eligible empty: "Complete onboarding or update your profile to find aids you qualify for." → link to /profile.
   - Renewals empty: "All caught up! We'll remind you when something's due."

9. i18n strings — add a "tracker" namespace covering everything above.

10. Quick smoke test:
    - Sign in as Aminah.
    - Tracker → Eligible tab shows the matched aids.
    - Tap "Mark as applied" on STR → moves to Applied tab.
    - Reload → state persists (DB).
    - Tap a checklist item → checkmark stays after reload (localStorage).

Summarize and give commit message.

Do NOT wire S3 upload yet (next prompt). Do NOT compute the renewal date with high accuracy — just use application_window.open_month from current year for the demo.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

Click through Applied / Eligible / Renewals tabs. Mark an aid applied → confirm DB row updated.

Commit:
```bash
git add .
git commit -m "feat: tracker tab with applied/eligible/renewals + document checklist"
git push
```

## Move on to

`prompts/14_ocr_mykad.md`
