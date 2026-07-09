---
name: Dashboard real-data source of truth
description: How the general dashboard's per-company/per-advisor breakdowns are derived from Supabase, and known gaps (percentages, login testing).
---

The dashboard's "by company" breakdowns (bar chart, donut, company performance) are not driven by a `companies` selector anywhere in the sales tables — a sale's company must be resolved by joining `production_orders -> quotations.business_id -> businesses.company_id -> companies`. `salesService.getPaidSales()` did not originally expose `businessId`; it was added since every company/client rollup needs it.

**Why:** There is no `sales.company_id` shortcut column, and the app is single-company today but designed to support several, so the join chain must stay intact rather than hardcoding the one active company.

**How to apply:** When adding new sales aggregations, always resolve company through `businesses.company_id`, not by assuming a single company. There is no sales-goal/quota table, so any "percentage" shown for advisor ranking or company performance must be computed relative to the top performer in the same list (not a real target) — make sure this is documented in code, not presented as if it were an actual quota.

**Testing gap:** There are no seeded test credentials or dev auth bypass in this project — logging into the app UI to visually verify authenticated pages (like the dashboard) is not possible without real Supabase Auth + `user_applications` records. Verify such changes via build/lint and careful code review instead of a live screenshot.
