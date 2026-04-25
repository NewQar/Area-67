# 08 — Aids Browse + Detail Pages

> **Goal**: User can browse all aids, filter by category, search by name, and tap into a detailed view with criteria, documents, and "Open application" CTA.
>
> **Time budget**: 60 minutes
> **Use `/plan` mode**: Yes

---

## Pre-flight check

- [ ] Prompt 07 committed
- [ ] `aids` table populated (verify in Drizzle Studio)

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/design/DESIGN_PRINCIPLES.md (especially §2 the card pattern), packages/aid-catalog/aids.json (sample structure), lib/db/schema.ts, lib/data/aids.ts.

Use /plan mode. Show the page structure and component breakdown before code.

Goal: Build the Aids tab — list, filter, search, and detail pages.

Tasks:

1. Replace apps/web/app/(app)/aids/page.tsx (server component):
   - Fetch all aids via getAllAids().
   - Render a search input (client) at the top, then a horizontal scrollable category filter chips row, then the grid of AidCards.
   - Use Suspense boundaries with skeleton fallbacks.

2. apps/web/components/feature/aids/AidsBrowser.tsx (client):
   - Receives all aids as a prop.
   - Local state for searchQuery and selectedCategory.
   - Filters in memory (catalog is small ~25 entries).
   - Matches search against name (current locale), provider, tags.
   - Renders <AidCard> per match.
   - Empty state if no matches: friendly AIDa illustration + "No aids match your filter".

3. apps/web/components/feature/aids/AidCard.tsx:
   - Per the card pattern in DESIGN_PRINCIPLES.md §2:
     - Aid name (2 lines max, bold)
     - Provider (small, gray)
     - Amount badge (top-right, "up to RM 2,200/year")
     - Match status pill (we don't have matches yet; for THIS prompt, show category badge instead)
     - Single CTA "View details"
   - Whole card is clickable (Link to /aids/[id]).
   - Use shadcn Card, Badge.

4. apps/web/components/feature/aids/CategoryChips.tsx (client):
   - Horizontally scrollable row of chips.
   - "All" + each category from the data.
   - Selected chip has primary background.

5. apps/web/app/(app)/aids/[id]/page.tsx (server component):
   - Fetch aid via getAidById(params.id). 404 if not found.
   - Renders the detail layout:
     a. Hero: aid name (locale-picked), provider, big amount card.
     b. "Who qualifies" section — list of eligibility criteria, plain-language. (Format the eligibility_criteria JSON into bullets — write a helper that turns the structured criteria into human readable strings, locale-aware.)
     c. "Documents you'll need" section — bullet list from required_documents.
     d. "How to apply" section — numbered steps from application.steps. If application.online_url exists, big primary "Open application website" button at the top opening in new tab.
     e. "When to apply" section — application_window summary. If recurring, an "Add to my tracker" button (we'll wire this in prompt 13).
     f. Source note at the bottom: "Last verified {date}" plus a small "Sources" expandable showing source_urls.
     g. Sticky footer CTA: "Open application" or "Save to my list".

6. apps/web/components/feature/aids/EligibilityList.tsx:
   - Takes eligibility_criteria JSON.
   - Renders as a checklist — each criterion as a row with a checkmark/cross icon (placeholder: just bullets for now; we'll add real match status in prompt 11).
   - Locale-aware text generation. Examples:
     - { citizenship: 'malaysian' } → "Malaysian citizen" (en) / "Warganegara Malaysia" (ms)
     - { min_age: 18 } → "Age 18 or above" / "Berumur 18 tahun ke atas"
     - { income_band: 'household_income_below_5000' } → "Household income RM 5,000 or below" / "Pendapatan isi rumah RM 5,000 ke bawah"
     - { household_categories: ['isi_rumah', 'bujang', ...] } → human readable, comma-joined.
     - { required_registrations: ['ekasih'] } → "Registered with eKasih" + a small (i) tooltip
     - additional_rules: render each as a separate row with an "info" icon.

7. apps/web/lib/aids/format-eligibility.ts — pure function used by EligibilityList. Locale-aware. Handles all the criterion keys we have in aids.json.

8. apps/web/lib/aids/format-amount.ts — formats the amount JSON:
   - If tiers exist: "Up to RM {max} / year — see tiers"
   - Otherwise: "RM {min}–{max} / {is_recurring ? 'year' : 'one-off'}"

9. Apply the i18n strings — every visible string goes through useTranslations(). Add an "aids" namespace to the JSONs covering: criteria_label, documents_label, steps_label, when_label, sources_label, last_verified_label, open_application, save_to_tracker.

10. Add a "back" affordance in the detail page header (chevron-left icon button → router.back()).

Verify:
- /aids: 5 aids visible as cards.
- Search "STR" → only STR matches.
- Filter "Cash" → only cash aids.
- Tap a card → detail page renders all sections.
- Detail page mobile-first (380px width, no horizontal scroll).
- "Open application website" opens in new tab.
- Switch language to BM → all strings update, aid names update to ms variant.

Summarize and give commit message.

Do NOT add bookmarking/saving yet (that's tracker, prompt 13). Do NOT implement match status (prompt 11). Do NOT call any AI yet.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

Visit `/aids`, `/aids/str-2026`, `/aids/sara-2026` etc. on real phone. Confirm BM rendering of names and criteria.

Commit:
```bash
git add .
git commit -m "feat: aids browse + detail pages with category filter and search"
git push
```

## Move on to

`prompts/09_bedrock_client.md`
