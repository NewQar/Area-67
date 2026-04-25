# 15 — Insights Dashboard (B2G Story)

> **Goal**: An admin-only `/insights` page showing aggregate, anonymized aid-uptake data — the B2G monetization slide come to life. Quick BI iframe OR custom charts.
>
> **Time budget**: 45 minutes
> **Use `/plan` mode**: No (mostly UI)

---

## Pre-flight check

- [ ] Prompt 14 committed
- [ ] Either: Alibaba Quick BI dashboard set up by DevOps with a public share URL **OR** we'll build it client-side with synthetic data

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/research/BA_RESEARCH_GUIDE.md (§7 Insights content), docs/cloud/CLOUD_RUNBOOK.md (§4.5–4.6 the Alibaba analytics path).

Goal: Build an Insights page that tells the B2G story. Two fallback levels:

OPTION A (preferred): Quick BI iframe.
- DevOps sets up Quick BI on Alibaba Cloud with 3 charts. Shares public URL.
- We embed via iframe.

OPTION B (fallback): Custom charts with synthetic data.
- Build with Recharts.
- Synthetic but plausible numbers, clearly labeled "Illustrative — based on representative sampling."

Implement BOTH paths. The page tries Option A; if QUICK_BI_URL env var is missing or returns 4xx, falls back to Option B.

Tasks:

1. Add the Recharts dep:
   pnpm add recharts

2. apps/web/app/(app)/insights/page.tsx (server):
   - For the hackathon, ANY logged-in user can see this (we don't have admin roles). In a real app this'd be admin-only. Add a TODO comment.
   - If process.env.NEXT_PUBLIC_QUICK_BI_URL is set, render <QuickBiEmbed url={...} />.
   - Otherwise render <SyntheticInsights />.
   - Wrapper:
     - Header: "Aid uptake insights" + subtitle: "Anonymized data shared with policy partners."
     - Top KPI row: 4 stat cards (Total Users, Total Matched Aid Value RM, Eligible But Not Applied %, Top Underutilized Aid).
     - Then the iframe or charts.
     - Footer disclaimer: "Demo data for illustration. Real deployment uses live Alibaba AnalyticDB aggregates."

3. apps/web/components/feature/insights/QuickBiEmbed.tsx (client):
   - Just an iframe with the public URL. Set width 100%, height 600px, loading="lazy".

4. apps/web/components/feature/insights/SyntheticInsights.tsx (client, with synthetic data):
   - 3 charts using Recharts:
     a. Bar chart — "Aid uptake by state": 16 Malaysian states, x=state code, y=% of estimated eligible reached. Synthetic numbers ranging 30-65%. Sorted desc.
     b. Donut chart — "Matched aid categories distribution": cash 45%, groceries 22%, medical 15%, education 12%, others 6%.
     c. Line chart — "Applications over time (illustrative)": 12 months of growing applications.
   - Use brand-primary and brand-accent for colors.
   - All charts responsive.

5. apps/web/components/feature/insights/KpiStatCard.tsx:
   - Big number with a small label below, optional trend arrow.
   - Examples: "12,847 — Total users", "RM 3.2M — Aid value matched", "63% — Eligible but unclaimed", "MyKasih — Top underutilized".

6. apps/web/components/feature/insights/TopGapsList.tsx:
   - List: "Top 5 reasons users miss aid":
     1. Not registered with eKasih (38%)
     2. Income field outdated (24%)
     3. Missed STR October–November window (17%)
     4. Disability not declared (11%)
     5. Education status not provided (10%)
   - Visual: each row has a thin horizontal bar showing the percentage.

7. Add a "Share with policy partner" button at the top right that opens a Dialog with: "This dashboard would be shared with government policy teams under a data-sharing agreement. In production, anonymized aggregates flow to Alibaba AnalyticDB → Quick BI → partner-specific views." Just a marketing element for the demo.

8. The page should look polished — use the brand colors, not grayscale defaults. Use proper Tailwind spacing.

9. Linking: add a small icon button somewhere in the Profile tab → "View insights (preview)" that links to /insights. Don't add to bottom nav (only 5 spots; not for end users).

Verify:
- /insights renders.
- All charts visible on mobile (might need to scale down on narrow viewport — make Recharts ResponsiveContainer use 100%).
- Looks impressive in screenshots for the deck.

Summarize and give commit message.

Do NOT add real database aggregate queries — synthetic is fine. Do NOT add user-facing privacy controls (we'd need them in production but not in 36 hours).
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

`/insights` looks like a real dashboard. Take screenshots for the pitch deck.

Commit:
```bash
git add .
git commit -m "feat: insights dashboard for B2G story (Quick BI iframe + synthetic fallback)"
git push
```

## Move on to

`prompts/16_polish_and_translations.md`
