# ConstructAIQ — Claude Code Project Brief

## Last audited: April 21, 2026

-----

## Non-negotiables

- Follow Apple Human Interface Guidelines for layout, hierarchy, spacing, adaptability, safe areas, and iOS-native interaction patterns.
- Use Aeonik Pro throughout as the primary typeface. Font files must be self-hosted in `/public/fonts/` with `@font-face` in `globals.css`. Until files are added, the system fallback renders — this is acceptable temporarily but not production-ready.
- Do not use AI-generated templating aesthetics.
- Do not use canned dashboard color schemes.
- The UX should feel modern, impactful, calm, premium, and operationally credible.
- The UX should resemble the composure and clarity of Revolut Business without copying its UI.
- Use Mastt only as a structural reference for construction forecasting UX. Do not copy layouts, styling, or components.

-----

## Product

ConstructAIQ is a FREE construction intelligence platform — free forever, open API, open methodology. The FRED for the American construction economy. Deployed at **constructaiq.trade**.

It aggregates public construction and macroeconomic data into a unified Supabase time-series store and surfaces:

- 12-month ensemble AI forecast (Holt-Winters + SARIMA + XGBoost) with 80%/95% confidence intervals
- Anomaly detection signals (Z-score alerts, trend reversals)
- 50-state construction activity heatmap
- Materials intelligence — BUY/SELL/HOLD signals for lumber, steel, concrete, copper, WTI, diesel
- Federal infrastructure tracking (IIJA/IRA program execution)
- Scenario builder (rate shocks, IIJA funding, labor/material cost shifts)
- SAM.gov active solicitations — live federal bid opportunities (NAICS 236/237/238)
- REST API with free public access + researcher tier for .edu users
- Weekly AI intelligence brief
- Embeddable chart widgets for any third-party website

**Pricing model (free platform):**
- Dashboard access: **Free forever** — no account required
- Free API: 1,000 requests/day — open registration
- Researcher API: 10,000 requests/day — .edu email verification
- Enterprise: white-label and data licensing only (no paid dashboard tier)

-----

## Tech stack

|Layer           |Technology                                                                        |
|----------------|----------------------------------------------------------------------------------|
|Framework       |Next.js 15, React 18, TypeScript 5                                                |
|Database        |Supabase (PostgreSQL) — tables: `series`, `observations`, `forecasts`, `api_keys` |
|Rate limiting   |Upstash Redis                                                                     |
|Error monitoring|Sentry                                                                            |
|Deployment      |Vercel (constructaiq.trade)                                                       |
|Testing         |Vitest (18 tests, CI on every push via `.github/workflows/ci.yml`)                |
|Charts          |Recharts (ForecastBanner) + custom SVG (ForecastChart) — standardize on custom SVG|
|Design system   |`src/lib/theme.ts` — Aeonik Pro, Apple HIG tokens                                 |

-----

## Key file paths

```
src/lib/theme.ts                          Design tokens — source of truth for all colors, type, spacing
src/app/globals.css                       Global styles + Aeonik Pro @font-face (to be added)
src/app/layout.tsx                        Root layout — font class must be applied here
src/app/page.tsx                          Homepage — 698 lines, needs refactor
src/app/dashboard/page.tsx               Dashboard — 598 lines, needs splitting
src/app/dashboard/components/            40+ dashboard components
src/app/dashboard/sections/              (to be created) — section components split from dashboard
src/lib/models/                          Forecasting engine — DO NOT MODIFY
  ensemble.ts                            3-model weighted ensemble
  holtwinters.ts                         Holt-Winters DES
  sarima.ts                              SARIMA(1,1,0)(0,1,0)[12]
  xgboost.ts                             XGBoost gradient boosting
src/app/api/                             38+ API routes
src/app/api/cron/harvest/route.ts        Data harvest cron — FRED, Census, BLS → Supabase
src/app/api/cron/forecast/route.ts       Forecast compute cron
src/app/api/federal/route.ts             Federal data — SAM.gov solicitations wired; USASpending still mock
src/app/api/weekly-brief/route.ts        ⚠ STATIC CONTENT — needs Claude API integration
schema.sql                               PostgreSQL schema — idempotent, safe to re-run
src/app/globe/GlobeClient.tsx            WebGL globe — impressive; uses hardcoded fonts (fix)
public/widget.js                         Embeddable iframe widget loader (data-chart, data-geo, data-theme)
public/embed.js                          Alias for widget.js (served at /embed.js URL)
src/app/federal/page.tsx                 Federal Pipeline Feed (public) — programs, solicitations, leaderboard
src/app/api-access/page.tsx             API documentation, key registration, embed widget generator
src/app/methodology/page.tsx            Open methodology documentation — models, data sources, confidence
src/app/methodology/track-record/page.tsx  Forecast accuracy record — MAPE, model comparison, back-tests
src/app/embed/[chart]/page.tsx          Embeddable chart pages — forecast | federal-pipeline | signals | materials
```

-----

## Known bugs — fix before new features

### 🔴 Critical

**1. Aeonik Pro font not loaded**

- `globals.css` has no `@font-face` declaration (comment says “add when available”)
- `/public/fonts/` directory does not exist — no woff2 files present
- `layout.tsx` body has no font class: `<body>{children}</body>`
- Every screen renders in the system fallback chain
- **Fix:** Add `@font-face` to `globals.css`, apply `className="fa"` to `<html>` and `<body>` in `layout.tsx`

**2. `Math.random()` in production rendering**

- `dashboard/page.tsx` line ~200: `spark()` function uses `Math.random()` — sparklines change on every render
- `dashboard/page.tsx` heatmapData: `(Math.random()-0.5)*c.value*0.05` — heatmap values change on scroll
- `dashboard/page.tsx` corrMaterials/corrSpend: `(Math.random()-0.5)*15` — correlation chart data is random
- **Fix:** Replace with deterministic data from Supabase `observations` table

**3. Federal infrastructure data is 100% mock**

- `src/app/api/federal/route.ts` returns entirely hardcoded static arrays
- IIJA program bars, agency velocity, contractor leaderboard, state allocations — all fake
- USASpending.gov API is free and supports the needed queries
- **Fix:** Integrate USASpending API with 24-hour Supabase cache

**4. WeeklyBrief returns static content forever**

- `src/app/api/weekly-brief/route.ts` contains a hardcoded `STATIC_BRIEF` string
- Has explicit comment: `// @anthropic-ai/sdk is not installed — always return the static brief`
- **Fix:** Install `@anthropic-ai/sdk`, implement Claude API call, add to Vercel cron

### 🟡 Important

**5. `GateLock` never actually gates**

- Every `GateLock` in `dashboard/page.tsx` is called with `locked={false}`
- The component itself works (it blurs and overlays when `locked={true}`)
- Either wire to a real user plan check or remove the component
- **Decision needed:** Implement real plan gating or remove `GateLock` for now

**6. ForecastChart uses fixed `width=620`**

- Custom SVG chart uses `width={620}` as default prop
- Does not respond to container size — causes overflow on narrow screens
- Already uses `viewBox` — convert to responsive by removing fixed `width` prop and using `width="100%"`

**7. ForecastBanner uses Recharts; ForecastChart uses custom SVG**

- Two different chart libraries for the same type of content — visual inconsistency
- ForecastChart (custom SVG) is better — more control, confidence bands are cleaner
- Migrate ForecastBanner to use the same custom SVG approach as ForecastChart

**8. GlobeClient.tsx bypasses theme.ts**

- Uses hardcoded `var SYS = "-apple-system,BlinkMacSystemFont,'SF Pro Display',Arial,sans-serif"`
- Should import from `src/lib/theme.ts` like every other component

-----

## What is genuinely strong — DO NOT TOUCH

```
src/lib/models/          The 3-model ensemble is production-quality ML code
src/lib/theme.ts         Design token system is well-structured — extend, don't rewrite
src/lib/auth.ts          API key system works
src/lib/ratelimit.ts     Upstash rate limiting works
schema.sql               Database schema is clean and idempotent
.github/workflows/ci.yml CI pipeline works
src/app/api/cron/        Harvest pipeline works
src/app/api/forecast/    Forecast route works — real seed data baked in
src/app/dashboard/components/GateLock.tsx    Component logic works — just never called with locked=true
src/app/dashboard/components/CycleClock.tsx  Well-built SVG polar chart
src/app/dashboard/components/ForecastChart.tsx  Well-built — just needs responsive + additions
```

-----

## Brand and design direction

**The product should feel like:**

- Apple-grade clarity
- Revolut Business composure
- Premium dark UI — executive-readable construction intelligence
- Calm, not flashy — decisive, not noisy

**Avoid:**

- Terminal cosplay (the live ticker frames everything wrong — remove it)
- Bloomberg imitation as visual style
- Generic enterprise admin dashboards
- Rainbow chart palettes
- Over-signaled AI widgets
- Cluttered nav chrome
- Too many equal-weight cards on one page

-----

## Experience principles

1. One screen communicates one primary decision
1. One major section has one dominant visual
1. Controls support content — they don’t compete with it
1. **Forecasting is the hero capability** — it should be the first thing after KPIs
1. Signals, states, materials, and news are supporting layers
1. AI must be explainable and source-aware
1. Confidence, freshness, and context accompany all predictive outputs
1. If a screen feels crowded, reduce panel count before adding polish

-----

## Dashboard hierarchy (target)

```
1. Minimal nav header — logo | section links | LIVE dot | one key metric
2. KPI row — 6 cards, compact
3. ForecastChart HERO — large, full-width, immediately prominent
4. ScenarioBuilder — beside or below ForecastChart (not in a sidebar)
5. WeeklyBrief excerpt — 3 sentences max at this position
6. CSHI / Command Center (demoted from top)
7. Geographic / StateMap
8. Materials
9. Pipeline
10. Federal
11. Equities
12. Signals
```

**Current problem:** CSHI gauge + history + model accuracy + confidence ring sits above the forecast. The forecast is what users came for. Move it up.

-----

## Homepage structure (target)

```
1. Navigation (sticky, transparent → frosted on scroll)
2. Hero — one dominant forecast chart (live data) + one insight rail
3. Trust/proof strip — data sources, not testimonials
4. Three outcome cards — Forecast | Signals | Scenario
5. Platform showcase — real dashboard UI
6. Forecasting deep-dive — model mechanics, confidence bands
7. Use cases — three specific user types
8. Final CTA — email capture + dashboard link
```

**Current problem:** ForecastPreview in hero uses illustrative/synthetic data, not live API data.

-----

## Typography rules

- Aeonik Pro is the single active typeface: titles, headings, KPI numerals, navigation, chart titles, marketing copy
- Use `font.mono` (SF Mono fallback) ONLY for: numeric data values in tables/feeds, API key display, timestamps, series IDs, technical labels
- Mono is a technical accent — not the primary visual voice
- All type styles live in `theme.ts` as `type.*` tokens — use them; never override font-size or font-weight inline

-----

## Coding rules

- All colors come from `color.*` in `theme.ts` — never write raw hex strings in component files
- All spacing comes from `space.*` tokens where practical
- `Math.random()` is banned from all rendering paths — causes hydration mismatches and flicker
- No emoji as UI icons — use Lucide React or inline SVG
- Components over 300 lines must be split
- Every data-dependent render needs a loading state (skeleton or spinner)
- Self-review before committing:
1. Does it use theme tokens? (no raw hex strings?)
1. Is Aeonik Pro rendering — not the fallback?
1. Is hierarchy clear — one dominant element?
1. Does it work at 375px mobile width?
1. Are loading states handled?
1. Zero `Math.random()` in render paths?

-----

## Working style for Claude Code

Before coding any screen:

1. Identify the primary user decision this screen supports
1. Define the hero content (one dominant visual)
1. Define supporting content (everything else, quieter)
1. Simplify the hierarchy — remove before adding
1. Identify components to reuse or rebuild
1. Implement
1. Self-review for spacing, hierarchy, and polish

Do not decorate the existing UI. Recompose it.

-----

## Execution order (current sprint)

1. Fix font system (`layout.tsx` + `globals.css`) — everything sits on this
1. Eliminate `Math.random()` from dashboard — replace with Supabase observations data
1. Split `dashboard/page.tsx` into `sections/` components
1. Remove ticker, reorder dashboard sections — forecast as hero
1. Elevate `ForecastChart` + `ScenarioBuilder`
1. Redesign homepage (`page.tsx`) — live forecast data in hero
1. Wire `federal/route.ts` to USASpending API
1. Wire `weekly-brief/route.ts` to Claude API
1. Mobile/iPhone pass — Apple HIG, safe areas, responsive charts
1. Performance + launch readiness — skeletons, error boundaries, CSP