# Next 30 Days — ConstructAIQ

**Horizon:** 2026-04-26 → 2026-05-26  
**Branch:** `claude/remove-public-api-pages-iRjfJ`

See [PRODUCT_BLUEPRINT.md](./PRODUCT_BLUEPRINT.md) for full roadmap context.

---

## Status at start of window

| Item | Status | Notes |
|---|---|---|
| Remove API public pages | ✅ Done | `/api-access` and `/docs/api` deleted; nav updated; e2e tombstone |
| Homepage clarity | ✅ Done | Reframed around role promises; secondary CTA → Methodology |
| DataTrustBadge | ✅ Done | `src/app/components/DataTrustBadge.tsx`; 29 unit tests |
| Trust Center `/trust` | ✅ Done | Six sections; no fake statistics; links from methodology and status |
| `/status` page | ✅ Done | Environment readiness + data state + source health + PAR trend |
| Dashboard context labels | ✅ Done | KPI source lines; forecast direction chip; signals empty state fixed |

---

## Remaining items

### Forecast accuracy page v1

**File:** `src/app/methodology/track-record/page.tsx`  
**Current state:** Page exists but shows placeholder accuracy figures. PAR data is available from `/api/par` and `/api/par/weekly`.

**Required changes:**
- Replace any hardcoded accuracy values with live fetches from `/api/par`
- Show PAR by confidence level (80%, 95%) and by horizon (1mo, 3mo, 6mo, 12mo) if the API returns breakdown data
- Show resolved vs pending prediction counts
- Label all figures as "computed from `n` resolved predictions" — no fake precision on small samples
- If PAR API returns `null`, show "Insufficient resolved predictions — check back as the platform ages" rather than `—` or `0%`

---

### Source health schema live

**Files:** `src/lib/sourceHealth.ts`, harvest cron routes  
**Current state:** `writeSourceHealth()` exists; `data_source_health` table is defined. Harvest cron may not call `writeSourceHealth` on every run.

**Required changes:**
- Audit each cron route in `src/app/api/cron/` and confirm `writeSourceHealth()` is called at the end of each source's fetch block
- Write a `failed` record (with `error_message`) in the catch path — not just on success
- Verify `/api/status` `getSourceHealthSummary()` returns the latest run per source (not cumulative)
- `/status` page already renders source health if present — no page changes needed

---

### Watchlist v1

**Files:** `src/app/dashboard/components/WatchlistCard.tsx`, `src/app/api/watchlist/`  
**Current state:** WatchlistCard exists; items sync via API key. No alert generation.

**Required changes for v1:**
- Confirm add/remove API routes exist and work without requiring account creation
- Items must persist to `watchlist_items` table keyed by `user_api_key`
- On page load, fetch existing watchlist items and render them
- Empty state: "Add metros, states, and federal rows you want to track" — not a shimmer
- Do not add alert generation in this window (post-30-day)

---

### Font system

**Files:** `src/app/globals.css`, `src/app/layout.tsx`  
**Current state:** No `@font-face` declaration; no font class on `<body>`; every screen renders in system fallback.

**Required changes:**
- Obtain Aeonik Pro woff2 files and place in `public/fonts/`
- Add `@font-face` declaration in `globals.css` for Regular (400), Medium (500), Bold (700)
- Add `fontFamily: 'Aeonik Pro', ...font.sys` to the `font.sys` token in `src/lib/theme.ts`
- Apply font class to `<html>` and `<body>` in `src/app/layout.tsx`
- Verify rendering on `/`, `/dashboard`, `/trust`, `/status`

Note: font files are not in the repo. This item is blocked until files are available. Do not fake it with a Google Fonts substitute.

---

### Forecast hero elevation

**Files:** `src/app/dashboard/sections/HeroForecast.tsx`, `src/app/dashboard/page.tsx`  
**Current state:** ForecastChart renders in the Forecast tab (not the default Overview tab). KPI cards and signals render first.

**Required changes:**
- Move ForecastChart above the KPI grid in the Overview section, or make Forecast the default active section on first load
- ForecastChart must be responsive: remove fixed `width={620}`, use `width="100%"` with viewBox
- Scenario builder stays beside or below ForecastChart — not in a sidebar
- Do not add new charts or panels; elevate what already exists

---

## Sequence recommendation

1. **Source health schema** — low risk, unblocks `/status` accuracy; do this first
2. **Watchlist v1** — confirm read/write works end-to-end; catch broken empty states
3. **Forecast accuracy page** — purely additive; fetches live data
4. **Forecast hero elevation** — layout change; verify mobile at 375px
5. **Font system** — blocked on Aeonik Pro files; pick up when files land

---

## Definition of done (for each item)

- `npm run lint` — no errors
- `npm test` — all tests pass
- `npm run build` — exit 0
- No hardcoded accuracy statistics
- No `Math.random()` in any render path
- Loading states for every async fetch
- Empty states that explain what is missing, not shimmer
