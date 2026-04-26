# ConstructAIQ Product Blueprint

**Last updated:** 2026-04-26  
**Branch:** `claude/remove-public-api-pages-iRjfJ`

---

## 1. North Star

ConstructAIQ is the FRED for the American construction economy: free, open, and authoritative. Every contractor, supplier, lender, and public-sector analyst should be able to answer "what is the construction market doing right now and where is it heading?" without paying for a terminal or signing an NDA.

The platform wins by being more trustworthy, more transparent, and more useful than any alternative — not by being more expensive.

---

## 2. Product Positioning

| Dimension | Position |
|---|---|
| Price | Free forever. No dashboard paywall. No account required. |
| API | Free tier (1,000 req/day open registration) · Researcher tier (10,000 req/day, .edu verification) · Enterprise (white-label, licensing) |
| Data | Public government sources only. No synthetic or scraped data. Sources cited on every output. |
| Forecast | Published methodology, open backtest results, live PAR tracking. |
| AI | Answers are grounded in data fetched at query time. Sources cited. No invented numbers. |

The benchmark is a platform a serious analyst could reference in a written report. If the data quality or transparency doesn't clear that bar, it does not ship.

---

## 3. Data Trust Standard

Every data point must carry:

- **Source** — the originating agency and series ID (e.g. Census Bureau TTLCONS)
- **Type** — `actual` | `forecast` | `derived` | `fallback`
- **Data as-of** — the reference period the value describes (not the fetch date)
- **Last refreshed** — when the pipeline last ran successfully
- **Status** — `fresh` (< 24 h) | `stale` (1–6 d) | `delayed` (≥ 7 d) | `unknown`
- **Response mode** — `live` | `cached` | `fallback`

Implementation:
- `DataTrustBadge` component renders these for every dashboard section
- `DataStatus` / `DataType` types in `src/lib/data-trust-utils.ts`
- `/status` page exposes pipeline health and environment readiness to users

Rules:
- Never show a metric without its source label
- Never show a forecast as a fact
- Never show shimmer indefinitely after the API has returned empty data
- Fallback data must be labeled as fallback

---

## 4. Forecast Validation Standard

Forecasts are produced by a 3-model accuracy-weighted ensemble:
- **Holt-Winters DES** — captures level and trend
- **SARIMA(1,1,0)(0,1,0)[12]** — seasonal autoregression
- **XGBoost** — gradient-boosted tree on lagged features

Models live in `src/lib/models/` and must not be modified without a documented accuracy comparison.

Validation requirements:
- Every forecast run logs predicted values + confidence intervals + maturity date to `prediction_outcomes`
- Outcomes are evaluated against Census Bureau actuals when the maturity month arrives
- **PAR (Prediction Accuracy Rate)** — fraction of resolved predictions where actuals fell within the stated interval — is computed live and exposed at `/api/par`
- No accuracy figure may be stated statically in documentation; all figures must be fetched from `/api/par` or `/methodology/track-record`
- MAPE > 6% triggers a `caveat` on the DataTrustBadge and in AI answers

---

## 5. Entity Graph Direction

The entity graph (`entities` + `entity_edges` tables) links sites, permits, projects, contractors, agencies, and award records. Current state: schema and write path exist; reads are used for opportunity scoring.

Target capability:
- Given a federal award, show related contractor → prior projects → site locations
- Given a permit address, show related contractor → federal awards in same MSA
- Surface "connected activity" as a signal: when permit volume + awards + BSI all move together in a market

Priority: entity graph enrichment is post-30-day work. Do not add graph reads to the dashboard before the write-path data density is sufficient to produce non-trivial connections.

---

## 6. Project Intelligence Direction

Project intelligence = permit-level + award-level data combined with address geocoding to produce trackable project records.

Current state: city permit data (59 cities), federal awards, and Sentinel-2 BSI exist as separate series. They are not yet joined at the project level.

Target capability:
- A permit record that can be followed from issuance → start (BSI signal) → award (if federal) → contractor
- Searchable by MSA, NAICS code, value range, and contractor

Priority: requires address normalization and geocoding work. Post-60-day.

---

## 7. AI Analyst Answer Standard

The AI analyst (`/ask`) answers questions by fetching live data from ConstructAIQ's internal APIs and passing it to Claude as context. The model is instructed to answer from that context only.

Required behavior on every answer:
1. **Cite the source** of every statistic — which endpoint was queried
2. **State confidence** — forecasts are "model estimates," not facts
3. **Label forecasts as forecasts** — never in the same register as historical actuals
4. **Return "insufficient data"** when the question requires data not in context
5. **No invented numbers** — every figure must be traceable to the context
6. **No professional advice as certainty** — market context, not investment/legal/procurement decisions

These are enforced via system prompt. They are design intentions, not hard technical constraints. Violations should be logged and treated as bugs.

---

## 8. Alerts and Watchlists Direction

Current state: `WatchlistCard` stores items in localStorage keyed by API key; syncs across devices via `watchlist_items` table.

Target capability:
- Users save metros, states, federal rows, and commodities to a watchlist
- When a saved item generates a signal (anomaly, WARN notice, forecast shift > threshold), surface an alert
- Alert delivery: in-app badge on next visit + optional email digest

Implementation requirements:
- Alert generation runs in the cron pipeline, not in the API response path
- Alerts are stored in `event_log` with `entity_id` and `user_api_key`
- Alert threshold is configurable per item (not system-wide)
- No alert is sent for a stale or fallback data condition — only live signals trigger alerts

Priority: watchlist write/read path is functional. Alert generation + delivery is 30–60 day work.

---

## 9. Trust Center Standard

`/trust` is the canonical location for all platform transparency documentation. It must:

- Accurately describe every source, its lag, and its caching behavior
- Explain forecast methodology and confidence bands without inventing statistics
- Define PAR and link to live accuracy figures (never hardcode them)
- State AI guardrails as design intentions with an explicit note that violations are bugs
- List real limitations including data lag, revision, geographic coverage, and fallback behavior
- Provide original-source links for every government dataset cited

The Trust Center is a living document. When a new data source is added, a new section is added to `/trust`. When a methodology changes, `/trust` and `/methodology` are updated before the change ships.

---

## 10. Roadmap

### 2 weeks (by ~2026-05-10)

- [x] Remove `/api-access` and `/docs/api` public pages
- [x] Homepage reframe — "Free construction market intelligence" with role promises
- [x] `DataTrustBadge` component — source, type, status, as-of on every section
- [x] Trust Center `/trust` — six sections, no fake statistics
- [x] `/status` — environment readiness + data state visible to users
- [x] Dashboard context labels — KPI source lines, forecast direction chip, empty states

### 30 days (by ~2026-05-26)

- [ ] Forecast accuracy page v1 — `/methodology/track-record` shows live PAR from `/api/par`
- [ ] Source health schema live — `data_source_health` writes from every cron; `/status` reads it
- [ ] Watchlist v1 — save/remove works, items persist to DB, no alerts yet
- [ ] Font system — Aeonik Pro `@font-face` in `globals.css`, applied in `layout.tsx`
- [ ] Forecast hero elevation — ForecastChart is the dominant element above KPIs on dashboard

### 60 days (by ~2026-06-25)

- [ ] Alert generation — cron writes alerts for watchlisted items that generate signals
- [ ] Alert delivery — in-app badge; email digest opt-in
- [ ] Wire `weekly-brief/route.ts` to Claude API (ANTHROPIC_API_KEY)
- [ ] Wire `federal/route.ts` to live USASpending.gov data with 24h cache
- [ ] Mobile pass — Apple HIG safe areas, responsive ForecastChart, touch targets

### 90 days (by ~2026-07-25)

- [ ] Project intelligence v1 — permit + award join by address for top 10 MSAs
- [ ] Entity graph reads — connected contractor/award/permit on federal pipeline page
- [ ] Embeddable widgets — ForecastChart and SignalFeed work as iframes on third-party sites
- [ ] Researcher API tier — `.edu` verification flow, 10,000 req/day quota

---

## Engineering rules (standing)

- Colors: `color.*` from `src/lib/theme.ts` — never raw hex in components
- No `Math.random()` in any render path
- No metric without a source label
- No forecast presented as a fact
- Components > 300 lines must be split
- Every data-dependent render needs a loading state
- `src/lib/models/` — do not modify without a documented accuracy comparison
