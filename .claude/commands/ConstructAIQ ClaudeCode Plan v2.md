# ConstructAIQ — Claude Code Build Plan

## Grounded in the Actual Repository (toddbridgeford/ConstructAIQ)

### Audited April 21, 2026

-----

## WHAT THE CODE AUDIT FOUND

This plan is based on reading every key file in the repository. Here is the honest picture.

### What’s genuinely strong

- **3-model ensemble forecasting engine** in `src/lib/models/` — Holt-Winters, SARIMA, XGBoost with inverse-MAPE weighting and 80%/95% confidence intervals. This is production-quality ML code.
- **38+ API routes** already live across every intelligence domain — forecast, census, BLS, BEA, EIA, federal, fusion, signals, EDGAR, seismic, weather, CCCI, CSHI, pricewatch, pipeline.
- **Full design system** in `src/lib/theme.ts` — Aeonik Pro token hierarchy, Apple HIG spacing, color, radius, shadow, and typography scales. Well-structured.
- **Dashboard with 40+ components** across 8 sections — CycleClock, ScenarioBuilder, ForecastBanner, StateMap, FederalLeaderboard, WeeklyBrief, EarningsCards — conceptually comprehensive.
- **Cron-based data harvest** (`api/cron/harvest/route.ts`) pulling FRED, Census, BLS into Supabase.
- **Tiered API key system** with Upstash Redis rate limiting (Starter $490, Pro $1,490, Enterprise custom).
- **18 Vitest tests** passing CI on every push.

### What needs to be fixed — specific issues found in the code

**1. Aeonik Pro is declared but never loaded**
`globals.css` says: `"/* Self-host woff2 files in /public/fonts/ and add @font-face declarations here when available */"` — the font files don’t exist yet. Every screen is rendering in the system fallback chain, not Aeonik Pro.

**2. `Math.random()` is used for production data in dashboard/page.tsx**

```typescript
// These re-render differently on every paint — sparklines change on scroll
const heatmapData = commodities.slice(0,6).map((c) => ({
  months: Array.from({length:12},(_,i) => ({
    value: c.value + (Math.random()-0.5)*c.value*0.05,  // ← BUG
```

Also: the `spark()` function that feeds KPI card sparklines uses `Math.random()`. Real sparklines should come from the `observations` table.

**3. federal/route.ts is entirely static mock data**
The Federal Infrastructure Tracker (Section 6) shows IIJA/IRA program execution bars, agency velocity, and contractor leaderboards — but every number in that file is hardcoded. USASpending API is not connected despite the route existing.

**4. CSHI (Construction Sector Health Index) is synthetic**
`api/cshi/route.ts` computes a composite score from sub-scores that are derived from API data — but the sub-score weights and component logic produces values that don’t match what the data would actually give. The gauge looks real but needs the component calculation verified against live data.

**5. ForecastBanner uses Recharts; ForecastChart uses custom SVG**
Two different charting approaches for the same type of content. `ForecastBanner` uses Recharts `AreaChart`. `ForecastChart` renders a custom SVG with manually calculated paths. They look visually inconsistent. One approach should win.

**6. `GateLock` is never actually locking anything**
Every `GateLock` in dashboard/page.tsx has `locked={false}`. The gating logic in `src/components/GatedSection.tsx` exists but isn’t being applied. Either the gate works or it doesn’t — right now it’s decorative.

**7. WeeklyBrief falls back to static text**
`WeeklyBrief` component has a full parsing and rendering system, but `api/weekly-brief/route.ts` (needs checking) likely returns static content. The “AI-POWERED” badge suggests Claude API should be generating this.

**8. Homepage is 698 lines of monolithic JSX**
`src/app/page.tsx` is a single client component with no sub-components extracted. ForecastPreview uses illustrative/synthetic data instead of live API data. The hero forecast chart should render real numbers.

**9. Dashboard page.tsx is a 700+ line monolith**
All 8 sections, all useEffect data fetches, all state declarations live in one file. Hard to maintain, impossible to code-split properly.

**10. layout.tsx doesn’t apply font or Sentry correctly**

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>  // ← no font class, no Sentry initialization wrapper
    </html>
  )
}
```

-----

## UPDATED CLAUDE.md

### Replace the existing CLAUDE.md with this version

```markdown
# ConstructAIQ — Claude Code Project Brief

## Non-negotiables
- Follow Apple Human Interface Guidelines for layout, hierarchy, spacing, adaptability, safe areas, and iOS-native interaction patterns.
- Use Aeonik Pro throughout the project as the primary typeface. The font woff2 files must be self-hosted in /public/fonts/ with @font-face in globals.css.
- Do not use AI-generated templating aesthetics.
- Do not use canned dashboard color schemes.
- The UX should feel modern, impactful, calm, premium, and operationally credible.
- The UX should resemble the composure and clarity of Revolut Business without copying its UI.
- Use Mastt only as a structural reference for construction forecasting UX. Do not copy layouts, styling, or components.

## Product summary
ConstructAIQ is a premium construction intelligence platform deployed at constructaiq.trade.
It aggregates public construction and macroeconomic data into a unified time-series system (Supabase/PostgreSQL) and surfaces:
- 12-month ensemble forecasts (Holt-Winters + SARIMA + XGBoost) with 80%/95% confidence intervals
- Anomaly detection signals (Z-score alerts and trend reversals)
- 50-state construction activity map
- Materials intelligence (BUY/SELL/HOLD signals for lumber, steel, concrete, copper, WTI, diesel)
- Federal infrastructure tracking (IIJA/IRA program execution)
- Scenario builder (rate shocks, IIJA funding, labor/material cost shifts)
- REST API with tiered key access ($490/$1490/Enterprise)
- Weekly AI intelligence brief

## Tech stack
- Framework: Next.js 15, React 18, TypeScript 5
- Database: Supabase (PostgreSQL) — tables: series, observations, forecasts, api_keys
- Rate limiting: Upstash Redis
- Error monitoring: Sentry
- Deployment: Vercel (constructaiq.trade)
- Testing: Vitest (18 tests, CI on every push)
- Charts: Recharts (standard) + custom SVG (ForecastChart)
- Design system: src/lib/theme.ts (Aeonik Pro, Apple HIG tokens)

## Key file paths
- Design tokens: src/lib/theme.ts
- Global styles: src/app/globals.css
- Root layout: src/app/layout.tsx
- Homepage: src/app/page.tsx (698 lines — monolith, needs refactor)
- Dashboard: src/app/dashboard/page.tsx (700+ lines — monolith, needs splitting)
- Dashboard components: src/app/dashboard/components/ (40+ components)
- Forecast models: src/lib/models/ (ensemble.ts, holtwinters.ts, sarima.ts, xgboost.ts)
- API routes: src/app/api/ (38+ routes)
- Cron harvest: src/app/api/cron/harvest/route.ts
- Forecast cron: src/app/api/cron/forecast/route.ts
- Schema: schema.sql

## Known bugs — fix before any new features
1. FONT NOT LOADED: Aeonik Pro declared in theme.ts but woff2 files missing. Add @font-face to globals.css and host font files in /public/fonts/.
2. Math.random() IN PRODUCTION: spark() in dashboard/page.tsx and heatmapData use Math.random() — sparklines re-render differently on every paint. Replace with deterministic data from observations table.
3. FEDERAL DATA IS MOCK: src/app/api/federal/route.ts returns 100% hardcoded static data. Wire up to USASpending.gov API.
4. GATELOCK NEVER LOCKS: Every GateLock in dashboard/page.tsx has locked={false}. Implement plan-based gating or remove the component.
5. LAYOUT MISSING FONT CLASS: src/app/layout.tsx body tag has no font class applied.
6. FORECAST CHART INCONSISTENCY: ForecastBanner uses Recharts; ForecastChart uses custom SVG. Standardize on one approach.

## Current repo execution order (from CLAUDE.md audit)
1. Fix critical bugs (font, Math.random, layout.tsx)
2. Refactor typography system (layout.tsx → globals.css → theme.ts unified)
3. Redesign homepage (src/app/page.tsx) — hero with live forecast data
4. Redesign dashboard shell (remove ticker dominance, elevate forecast as hero)
5. Elevate ForecastChart + ScenarioBuilder as the premium centerpiece
6. Quiet supporting modules (materials, federal, signals, equities)
7. Wire up live data to mocked components (federal, CSHI, WeeklyBrief)
8. Mobile/iPhone pass (Apple HIG, safe areas, sheets)
9. Performance and SEO launch readiness

## Experience principles
- One screen should communicate one primary decision.
- One major section should have one dominant visual.
- Controls should support content, not compete with it.
- Forecasting is the hero capability.
- Signals, states, materials, and news are supporting layers.
- AI must always be explainable and source-aware.
- Confidence, freshness, and context should accompany predictive outputs.
- If a screen feels crowded, reduce panel count before adding polish.

## Design direction
The product should feel like:
- Apple-grade clarity
- Revolut Business composure
- premium dark UI
- executive-readable construction intelligence

Avoid:
- terminal cosplay (remove ticker dominance)
- Bloomberg imitation as visual style
- generic enterprise admin dashboards
- rainbow chart palettes
- over-signaled AI widgets
- cluttered nav chrome
- too many equal-weight cards on one page

## Typography rules
- Aeonik Pro is the single active typeface: page titles, section headings, KPI numerals, navigation, chart titles, marketing headlines
- Use mono (SF Mono fallback) ONLY for: numerical data values in tables, API key display, timestamps, series IDs
- Do not let mono dominate visual tone — it is a technical accent, not the primary voice
- type.* tokens in theme.ts define all text styles — use them, don't override inline

## Coding rules
- Use design tokens from theme.ts — never hardcode hex colors, px values, or font sizes inline
- Extract reusable components — a pattern used 3+ times becomes a component
- Prefer composition (Card + children) over repetitive inline styles
- Remove all Math.random() from rendering paths
- No emoji icons in production UI — use Lucide or inline SVG
- Keep components under 200 lines; split at 300
- Self-review checklist before committing:
  1. Does it use theme tokens?
  2. Is Aeonik Pro rendering (not fallback)?
  3. Is the hierarchy clear (one dominant element)?
  4. Does it work on mobile (375px)?
  5. Are loading states handled?
```

-----

## .claude/commands/ — ALL SLASH COMMANDS

-----

### `/audit` — src/app/api/cron/commands/audit.md

```markdown
# Audit the current state of a file or component

When the user runs /audit [file or component name], perform a systematic code review.

Checklist to run against any UI file:
1. FONT: Is Aeonik Pro applied via the .fa class or font.sys token? Or is it falling back?
2. TOKENS: Are all colors from color.* in theme.ts? (grep for raw hex strings like #0a84ff)
3. MATH.RANDOM: Is Math.random() used in any rendering path? Flag every instance.
4. HIERARCHY: Is there one dominant visual element, or are all elements equal weight?
5. MONO OVERUSE: Is fontFamily: MONO used for non-numeric, non-technical content?
6. INLINE STYLES: Are one-off px values or colors hardcoded instead of using tokens?
7. LOADING STATE: Does every data-dependent element have a loading state?
8. MOBILE: Does layout break below 390px width?
9. COMPONENT SIZE: Is the file over 200 lines? If over 300, flag for splitting.
10. EMOJI IN UI: Are emoji used as icons? Replace with Lucide icons or SVG.

For dashboard/page.tsx specifically, also check:
- Does the forecast chart have visual dominance over supporting sections?
- Does the ticker/chrome compete with primary content?
- Are KPI sparklines loading from real data or Math.random()?

Report all findings with line numbers and specific fixes.
```

-----

### `/fix-font` — .claude/commands/fix-font.md

```markdown
# Install and activate Aeonik Pro across the design system

The font is declared in theme.ts but not loaded. Run this to fix it end-to-end.

Step 1: Check if font files exist
ls /public/fonts/

Step 2: If not, create placeholder @font-face using a system approximation for now.
Add to the TOP of src/app/globals.css:

/* Aeonik Pro — self-hosted. Place woff2 files at /public/fonts/AeonikPro-{weight}.woff2 */
/* Weights needed: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold) */
@font-face {
  font-family: 'Aeonik Pro';
  src: url('/fonts/AeonikPro-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Aeonik Pro';
  src: url('/fonts/AeonikPro-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Aeonik Pro';
  src: url('/fonts/AeonikPro-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

Step 3: Fix src/app/layout.tsx to apply the font system class:

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="fa">
      <body className="fa">{children}</body>
    </html>
  )
}

Step 4: Verify theme.ts font.sys starts with 'Aeonik Pro' (it does).

Step 5: Run grep across src/ to find any hardcoded font-family strings not using the token:
grep -r "font-family" src/ --include="*.tsx" --include="*.ts" | grep -v "theme.ts" | grep -v "globals.css"

Fix every hit to use font.sys or font.mono from theme.ts instead.

Step 6: Run npm run dev and verify Aeonik Pro renders in DevTools → Elements → Computed → font-family
```

-----

### `/fix-sparklines` — .claude/commands/fix-sparklines.md

```markdown
# Replace Math.random() sparklines with real data from Supabase

The dashboard uses Math.random() for KPI card sparklines and materials heatmap. This causes
flicker on every render and serves fake data. Fix it.

Step 1: Find all Math.random() calls in rendering paths:
grep -n "Math.random()" src/app/dashboard/page.tsx

Step 2: For KPI sparklines — the spark() function:
The `spark()` function generates random sparklines. Replace it with a real data fetch.

Add to the dashboard data loading:
```typescript
// Fetch last 12 monthly observations for sparklines
const { data: sparkObs } = await supabase
  .from('observations')
  .select('series_id, obs_date, value')
  .in('series_id', ['TTLCONS', 'CES2000000001', 'HOUST', 'PERMIT'])
  .gte('obs_date', twelveMonthsAgo)
  .order('obs_date', { ascending: true })

// Group by series_id into sparkline arrays
const sparklines = groupBy(sparkObs, 'series_id')
```

Step 3: For heatmap data — replace the Math.random() month-level variance with:

- Use the actual monthly observations for each commodity from the observations table
- If observations don’t exist for a commodity, use a flat line (not random variance)

Step 4: Remove the `spark()` function entirely from dashboard/page.tsx.

Step 5: Verify: reload the dashboard 5 times — sparklines should be identical every time.

```
---

### `/redesign-homepage` — .claude/commands/redesign-homepage.md
```markdown
# Redesign the homepage (src/app/page.tsx)

The current homepage is 698 lines, over-sectioned, and shows illustrative/synthetic
forecast data. Apply the CLAUDE.md homepage structure with live data.

Target structure (8 sections only):
1. Navigation (sticky, transparent → frosted on scroll)
2. Hero — one dominant forecast chart (live data from /api/forecast), one supporting insight rail
3. Trust/proof strip — data sources, not testimonials
4. Three outcome cards — Forecast / Signals / Scenario
5. Platform showcase — real dashboard screenshot or live embed
6. Forecasting deep-dive — how the model works, confidence bands explained
7. Use cases — 3 specific user types
8. Final CTA — email capture + dashboard link

Rules:
- Hero forecast chart must use live API data, not the ForecastPreview illustrative fallback
- Supporting sections must be visually quieter than the hero (smaller type, less contrast)
- Lead with product UI, not stock construction imagery
- Marketing copy should follow the CLAUDE.md story hierarchy:
  1. Forecast construction risk earlier
  2. See what changed and why
  3. Compare scenarios before committing capital
  4. Trust the signal through explainable models and confidence ranges
  5. Act through decision-ready views

Implementation approach:
1. Extract hero section into src/app/components/Hero.tsx
2. Extract navigation into src/app/components/Nav.tsx (reusable across pages)
3. Extract trust strip, outcome cards into small focused components
4. Replace ForecastPreview with a live fetch from /api/forecast?series=TTLCONS
5. Keep page.tsx under 200 lines by delegating to these components
```

-----

### `/redesign-dashboard` — .claude/commands/redesign-dashboard.md

```markdown
# Redesign the dashboard shell (src/app/dashboard/page.tsx)

The dashboard is a 700+ line monolith. Key problems:
- Ticker bar dominates the top and frames everything as Bloomberg Terminal cosplay
- 8 equal-weight sections compete for attention
- Forecast (the hero capability) is buried under chrome

Target hierarchy from CLAUDE.md:
1. Page header (minimal — logo + section nav + live indicator)
2. KPI row (6 cards — compressed, not dominant)
3. Hero forecast chart (ForecastChart — large, full-width or 2/3 width)
4. AI explanation / top signals rail (WeeklyBrief excerpt + top 3 signals)
5. Supporting modules below (map, materials, federal, equities, signals)

Step 1: Remove the ticker
The `.ticker` element in globals.css and the ticker JSX in dashboard/page.tsx should be removed.
The LIVE indicator belongs in the nav, not as a scrolling strip.

Step 2: Elevate the forecast
ForecastChart should render at minimum 480px height with padding.
Place it immediately after the KPI row, not after a CSHI gauge + history + model accuracy section.

Step 3: Split the monolith
Extract each section into its own file:
- src/app/dashboard/sections/CommandCenter.tsx (CSHI + KPIs + ForecastBanner)
- src/app/dashboard/sections/ForecastSection.tsx (ForecastChart + ScenarioBuilder)
- src/app/dashboard/sections/GeographicSection.tsx (StateMap + TopStates)
- src/app/dashboard/sections/MaterialsSection.tsx
- src/app/dashboard/sections/PipelineSection.tsx
- src/app/dashboard/sections/FederalSection.tsx
- src/app/dashboard/sections/EquitiesSection.tsx
- src/app/dashboard/sections/SignalsSection.tsx

dashboard/page.tsx becomes a thin orchestrator under 150 lines.

Step 4: Fix loading states
Each section should render a skeleton while its data loads, not an empty space.
Use a consistent Skeleton component pattern from theme tokens.

Step 5: Fix the nav
Current dashboard nav has too many elements:
- Logo + section links + GLOBE link + LIVE dot + timestamp + spend value + employment + rate
Reduce to: Logo | Section links | LIVE indicator | one key metric
```

-----

### `/elevate-forecast` — .claude/commands/elevate-forecast.md

```markdown
# Elevate the ForecastChart and ScenarioBuilder as the premium hero

These are ConstructAIQ's highest-value capabilities. They need visual elevation to match.

## ForecastChart improvements (src/app/dashboard/components/ForecastChart.tsx)

Current state: Custom SVG chart, well-built, confidence bands exist.
Problems: Small (width=620 default), no driver annotation, no previous forecast comparison.

Add:
1. Driver annotation — label the biggest driver of the forecast direction
   "↑ Driven by: IIJA highway awards +18% YoY · Construction employment +0.4%"
2. Previous forecast line — show last month's forecast as a faint dashed line
   This makes the model feel accountable and honest
3. Model context strip below chart:
   "HW: 34% · SARIMA: 41% · XGB: 25% · MAPE: 2.8% · Trained on 60mo"
4. What changed summary: "vs. last month: +0.3% revision upward"
5. Increase default height to 480px minimum

## ScenarioBuilder improvements (src/app/dashboard/components/ScenarioBuilder.tsx)

Current state: Sliders exist, presets work, delta impact shows. Good foundation.
Problems: Placed as a side panel, not given visual prominence as a strategic tool.

Changes:
1. Move ScenarioBuilder to sit BESIDE or BELOW the ForecastChart, not in a sidebar
2. Show scenario delta on the ForecastChart itself as a secondary colored line
   (currently the scenario output is just a text number, not visualized on the chart)
3. Add scenario presets as prominent pill buttons above the sliders:
   "Recession" | "Baseline" | "Expansion" | "Infrastructure Push"
   (these already exist in the component — just make them visually dominant)
4. Summary card below sliders:
   "Your scenario: Spending -$42B vs base · Employment -12K · Permits -8.4%"

## Standardize on one charting approach

Decision: Keep custom SVG for ForecastChart (it's more precise for confidence bands).
Migrate ForecastBanner to also use the custom SVG approach, not Recharts.
This removes the visual inconsistency between the two forecast surfaces.
```

-----

### `/wire-federal` — .claude/commands/wire-federal.md

```markdown
# Wire up Federal Infrastructure Tracker to live USASpending data

src/app/api/federal/route.ts currently returns 100% hardcoded static data.
USASpending.gov API is free, requires no API key, and updates daily.

## USASpending API Integration

Base URL: https://api.usaspending.gov

Step 1: Add USASpending fetch to the federal route:

```typescript
// Fetch construction NAICS awards by state
const awardsResponse = await fetch(
  'https://api.usaspending.gov/api/v2/spending_by_geography/',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scope: 'place_of_performance',
      geo_layer: 'state',
      filters: {
        time_period: [{ start_date: '2024-10-01', end_date: '2025-09-30' }],
        naics_codes: ['2361','2362','2371','2372','2379','2381','2382','2383','2389'],
        award_type_codes: ['A','B','C','D']
      }
    })
  }
)
```

Step 2: Fetch active solicitations from SAM.gov:

```typescript
const samResponse = await fetch(
  `https://api.sam.gov/opportunities/v2/search?limit=10&api_key=${process.env.SAM_GOV_API_KEY}&naics=236,237,238&ptype=o&dsetaside=SBA&status=active`
)
```

Note: SAM_GOV_API_KEY must be added to .env.local (free registration at sam.gov)

Step 3: Keep static IIJA/IRA program bars as programmatic data (these are from appropriations
legislation, not an API — they’re legitimately static with slow manual updates).

Step 4: Add caching — USASpending is slow. Cache with:

- Supabase table: federal_cache (key, data_json, cached_at)
- TTL: 24 hours (data updates daily)
- On cache miss: fetch live; on cache hit: return cached

Step 5: Add SAM_GOV_API_KEY to .env.example with instructions.

Step 6: Update the FederalStateTable and FederalLeaderboard components to consume
live state allocation data instead of the static STATES array in federal/route.ts.

```
---

### `/wire-brief` — .claude/commands/wire-brief.md
```markdown
# Wire WeeklyBrief to real Claude API generation

The WeeklyBrief component has a full parsing/rendering system but the API route
likely returns static content. Connect it to the Anthropic Claude API.

## api/weekly-brief/route.ts

Step 1: Read the current route to understand what it returns.
cat src/app/api/weekly-brief/route.ts

Step 2: Implement live Claude API generation:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Gather latest data inputs
const [spendData, employData, permitData, signalData] = await Promise.all([
  fetchLatestObservation('TTLCONS'),
  fetchLatestObservation('CES2000000001'),
  fetchLatestObservation('PERMIT'),
  fetch('/api/signals').then(r => r.json()),
])

const prompt = `You are the chief economist for ConstructAIQ, a construction intelligence platform.
Write a Weekly Market Intelligence Brief using ONLY the data provided.

RULES:
- Every statistic must come from the provided data — never invent numbers
- Plain English — no jargon
- 200-300 words total
- Three sections: MARKET PULSE | KEY SIGNALS | WHAT TO WATCH

DATA:
Total Construction Spending: ${spendData?.value}B (${spendData?.mom > 0 ? '+' : ''}${spendData?.mom}% MoM)
Construction Employment: ${employData?.value}K (${employData?.mom > 0 ? '+' : ''}${employData?.mom}% MoM)
Building Permits: ${permitData?.value}K/yr (${permitData?.mom > 0 ? '+' : ''}${permitData?.mom}% MoM)
Top signals: ${JSON.stringify(signalData?.signals?.slice(0,3))}
`

const message = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 500,
  messages: [{ role: 'user', content: prompt }],
})
```

Step 3: Cache the brief — generate once per week (Monday 07:00 ET via cron).
Store in Supabase: weekly_briefs table (brief_text, generated_at, data_snapshot_json)

Step 4: Add ANTHROPIC_API_KEY to .env.example.

Step 5: The WeeklyBrief component already handles the “source” prop to badge AI vs static.
Set source=“ai” when returning Claude-generated content.

```
---

### `/mobile-pass` — .claude/commands/mobile-pass.md
```markdown
# Apply Apple HIG mobile/iPhone design pass

Run this after any major layout change to verify Apple HIG compliance.

## Checklist

1. SAFE AREAS: Every fixed/sticky element must account for safe area insets:
   padding-top: env(safe-area-inset-top, 0px);
   padding-bottom: env(safe-area-inset-bottom, 0px);
   Check: nav, bottom tabs, any fixed-position modals.

2. TOUCH TARGETS: Minimum 44×44px for every interactive element.
   Check: grep for "height: 3" and "height: 2" — likely tap targets too small.
   Check: all icon-only buttons.

3. FONT SIZE MINIMUM: No text below 11px on mobile.
   On dashboard, many mono labels are fontSize:10 — acceptable for captions, not for interactive.

4. NO HORIZONTAL SCROLL: Test at 375px (iPhone SE) and 390px (iPhone 14).
   The dashboard currently has flex-wrap but some sections may overflow.

5. CHART LEGIBILITY: Charts at mobile widths must have:
   - Readable axis labels (not squished)
   - Touch-friendly tooltips (not hover-dependent)
   - ForecastChart SVG must recompute at responsive width, not fixed width=620

6. ADVANCED CONTROLS INTO SHEETS: On mobile:
   - ScenarioBuilder should open as a bottom sheet, not be inline
   - StateDrillDown should open as a sheet, not push content right
   - Navigation filters should use native-feeling bottom sheets

7. ONE CHART PER SCREEN SECTION: On mobile, never show 2+ charts side-by-side.
   All flex-row chart pairs need a mobile breakpoint to stack vertically.

Implementation:
- Add responsive breakpoints to globals.css:
  @media (max-width: 480px) { ... } for phone
  @media (max-width: 900px) { ... } for tablet
- Create a Sheet component for mobile overlays
- All <div style={{ display:"flex", gap:20 }}> pairs need a flex-wrap:wrap + min-width guard
```

-----

### `/test-run` — .claude/commands/test-run.md

```markdown
# Run the full test suite and lint

```bash
# TypeScript type check
npx tsc --noEmit

# Run all 18 Vitest tests
npm test

# ESLint
npm run lint

# Check for Math.random() in rendering paths
grep -rn "Math.random()" src/app/ --include="*.tsx"

# Check for hardcoded hex colors not from theme.ts
grep -rn "#[0-9a-fA-F]\{6\}" src/app/ --include="*.tsx" | grep -v "theme.ts" | grep -v "globals.css" | grep -v ".next"

# Check for hardcoded font families not from theme.ts
grep -rn "font-family:" src/app/ --include="*.tsx" | grep -v "theme.ts"

# Verify no console.log in production code
grep -rn "console.log" src/app/ --include="*.tsx" --include="*.ts" | grep -v "test\|spec\|__tests__"
```

Pass criteria before any deploy:

- tsc: 0 errors
- npm test: 18/18 passing
- npm run lint: 0 errors
- Math.random(): 0 hits in rendering paths
- Hardcoded hex: 0 hits outside theme.ts and globals.css

```
---

## SESSION-BY-SESSION BUILD PLAN

Each session is a complete prompt to paste into Claude Code from the ConstructAIQ directory.

---

### SESSION 1 — Fix the Font System

**Run this first. Everything else depends on correct typography.**
```

Read src/app/layout.tsx, src/app/globals.css, and src/lib/theme.ts.

The Aeonik Pro font is declared in theme.ts but woff2 files don’t exist in /public/fonts/ and
there are no @font-face declarations in globals.css. The layout.tsx body tag has no font class.
Every screen is rendering in fallback fonts.

Do this:

1. Add @font-face declarations to globals.css for Aeonik Pro weights 400, 500, 700.
   Use font-display: swap. Point to /public/fonts/AeonikPro-{weight}.woff2.
   Add a clear comment that the actual woff2 files must be licensed and placed in /public/fonts/.
1. Fix src/app/layout.tsx:
- Apply className=“fa” to both <html> and <body>
- The .fa class is already in globals.css (font-family: ‘Aeonik Pro’, fallback chain)
- Verify the Sentry wrapper is not needed at layout level (it’s in sentry.client.config.ts)
1. Search the entire src/ directory for any hardcoded font-family strings that bypass theme.ts:
   grep -rn “font-family” src/app/ –include=”*.tsx” | grep -v “theme”
   Replace every hit to use font.sys or font.mono from theme.ts via the token.
1. Run /test-run to verify 0 TypeScript errors and 18 tests passing after changes.

Show me what you changed and the grep result confirming no hardcoded font-family strings remain.

```
---

### SESSION 2 — Eliminate Math.random() from All Rendering Paths
```

Read src/app/dashboard/page.tsx and identify every use of Math.random().

There are two problems:

1. The spark() function generates random sparklines for KPI cards — re-renders differently on every paint
1. heatmapData uses Math.random() for materials heatmap month values
1. corrMaterials and corrSpend arrays use Math.random() for correlation chart data

Fix all three:

1. Replace the spark() function.
   The real sparkline data should come from Supabase observations table.
   Add a sparkline fetch to the data loading section:
   
   Fetch last 12 monthly observations for: TTLCONS, CES2000000001, HOUST, PERMIT
   Map them into { TTLCONS: number[], CES2000000001: number[], HOUST: number[], PERMIT: number[] }
   
   If the Supabase fetch fails or returns no data, use a flat line (repeat last known value × 12),
   NOT a random walk.
1. Replace heatmapData Math.random() with:
   Use actual month-over-month changes from the commodities data when available.
   If MoM data isn’t in the API response, use 0 (flat) rather than random noise.
1. Replace corrMaterials and corrSpend with:
   Fetch from observations table: last 24 months of TTLCONS and a commodity price series.
   If not available, use the static seed data from api/forecast/route.ts (which is real data).
1. Delete the spark() function entirely after replacing all its call sites.
1. Run /test-run. No Math.random() should remain in src/app/dashboard/page.tsx.

```
---

### SESSION 3 — Split Dashboard Monolith into Sections
```

src/app/dashboard/page.tsx is 700+ lines with all 8 sections in one component.
This needs to be split for maintainability and proper code-splitting.

Create these section components:

- src/app/dashboard/sections/CommandSection.tsx (Section 1 — CSHI + KPIs + ForecastBanner)
- src/app/dashboard/sections/ForecastSection.tsx (Section 2 — ForecastChart + ScenarioBuilder)
- src/app/dashboard/sections/GeographicSection.tsx (Section 3 — StateMap + TopStates)
- src/app/dashboard/sections/MaterialsSection.tsx (Section 4 — Commodities + Heatmap + Correlation)
- src/app/dashboard/sections/PipelineSection.tsx (Section 5 — PipelineTimeline + Alerts)
- src/app/dashboard/sections/FederalSection.tsx (Section 6 — IIJA programs + agency + leaderboard)
- src/app/dashboard/sections/EquitiesSection.tsx (Section 7 — SectorChart + ETF + Earnings)
- src/app/dashboard/sections/SignalsSection.tsx (Section 8 — AnomalyFeed + DivergenceDetector + WeeklyBrief)

Rules for each section component:

- Accepts only the data it needs as props (no prop drilling through the parent)
- Has its own loading skeleton rendered when data is null
- Exports a single named component (e.g., export function ForecastSection)

Refactor dashboard/page.tsx to:

- Keep all useEffect data fetches at the page level
- Pass data down to each section as props
- Target: dashboard/page.tsx under 200 lines after refactor
- Verify all 8 sections render identically after the split

Run npm run dev and verify the dashboard looks identical before and after.
Run /test-run to confirm 0 TypeScript errors.

```
---

### SESSION 4 — Remove Ticker, Redesign Dashboard Shell
```

The dashboard has two problems with its chrome:

1. A live ticker strip below the nav that frames everything as Bloomberg Terminal cosplay
1. A nav bar with too many data values competing for attention

Apply the CLAUDE.md dashboard structure. Read dashboard/page.tsx first.

Step 1: Remove the live ticker entirely.
Delete the ticker JSX block (the div with className-style ticker scrolling animation).
The LIVE indicator belongs in the nav only.

Step 2: Simplify the nav to:
Left: ConstructAIQ logo | section navigation links
Right: LIVE indicator (pulsing dot) | current spend value (one metric only)
Remove: timestamp, employment value, rate value from the nav bar.
These belong in KPI cards, not the nav chrome.

Step 3: Reorder the dashboard sections to match CLAUDE.md priority:

1. Compact KPI row (6 cards)
1. ForecastChart as HERO — large, full-width, immediately prominent
1. ScenarioBuilder directly below or beside ForecastChart
1. AI explanation / WeeklyBrief excerpt (3 sentences max in this position)
1. Command Center / CSHI (demoted from top position)
1. Geographic / StateMap
1. Materials
1. Pipeline
1. Federal
1. Equities
1. Signals

This reordering makes the forecast — the product’s core capability — the first thing
after the KPI row. Currently it is the second section buried under CSHI.

Step 4: Increase ForecastChart default height from 360px to 480px.

Step 5: Run /test-run. Verify all 18 tests pass.

```
---

### SESSION 5 — Elevate Forecast + Scenario as Premium Hero
```

Read src/app/dashboard/components/ForecastChart.tsx and
src/app/dashboard/components/ScenarioBuilder.tsx.

The forecast is the most powerful capability. Make it look like it.

ForecastChart improvements:

1. Add a driver annotation strip below the chart title:
   “↑ Primary driver: [top signal from /api/signals]”
   If no signal available, show: “Model trained on 60 monthly observations”
1. Add a previous forecast comparison line:
   Store last month’s forecast in Supabase (forecasts table already exists).
   Fetch it and render as a faint dashed line on the same chart.
   Label: “Last month’s forecast” with low-opacity styling.
1. Add model weight strip below chart:
   “Ensemble: HW {hwWeight}% · SARIMA {sarimaWeight}% · XGB {xgboostWeight}%
   MAPE {mape}% · {n} observations”
   Source this from the EnsembleResult.metrics object already returned by runEnsemble().
1. Add series selector: TTLCONS | HOUST | PERMIT | CES2000000001
   Clicking changes which series the chart forecasts.
   Currently the forecast API supports all four.

ScenarioBuilder improvements:

1. Scenario preset pills should be visual, prominent pill buttons at the top:
   Use 4 buttons styled with the CLAUDE.md button system (.btn-f or equivalent)
   The PRESETS array already has { Recession, Baseline, Expansion, Infrastructure Push }
1. Show scenario impact ON the ForecastChart as a colored overlay line:
   When any slider is non-zero, compute the scenario-adjusted forecast values
   and render them as a separate colored line (color: color.amber) on ForecastChart.
   This is the key missing visualization — right now the scenario is just a text number.
1. The delta impact summary below the sliders is good — keep it.
   Make the numbers larger and more prominent using the type.h4 token.

Run /test-run after changes.

```
---

### SESSION 6 — Redesign Homepage
```

Read src/app/page.tsx (698 lines). Apply the CLAUDE.md homepage structure.

Current problems:

- ForecastPreview uses illustrative/synthetic data, not live API data
- Over-sectioned with equal visual weight
- 698 lines in one client component

Target: 8 sections, forecast as the hero, under 250 lines in page.tsx.

Step 1: Create these sub-components:

- src/app/components/Nav.tsx — sticky navigation (reusable across homepage + marketing pages)
- src/app/components/Hero.tsx — headline + live forecast chart + one insight rail
- src/app/components/TrustStrip.tsx — data sources (Census, FRED, BLS, etc.) not testimonials
- src/app/components/OutcomeCards.tsx — three cards: Forecast / Signals / Scenario
- src/app/components/PlatformShowcase.tsx — dashboard screenshot or iframe of live widget
- src/app/components/ForecastDeepDive.tsx — how the model works, confidence bands
- src/app/components/UseCases.tsx — three user types
- src/app/components/CtaSection.tsx — email capture + dashboard link

Step 2: Fix the hero forecast chart.
The current ForecastPreview uses illustrative data. Replace with a live fetch:
useEffect that calls /api/forecast?series=TTLCONS and renders the real forecast.
Show a skeleton while loading. If the fetch fails, show the illustrative version as fallback.

Step 3: Marketing copy should follow story hierarchy from CLAUDE.md:
H1: “Forecast construction risk earlier”
H2/subhead: “See what changed and why”
Section 3: “Compare scenarios before committing capital”
Section 4: “Trust the signal through explainable models”
Final CTA: “Act through decision-ready views”

Step 4: page.tsx becomes an orchestrator that imports these components.

Run /test-run after changes.

```
---

### SESSION 7 — Wire Federal Data to USASpending API
```

Read src/app/api/federal/route.ts carefully. It returns entirely static/hardcoded data.

Run /wire-federal to connect it to USASpending.gov.

After implementing:

1. Add SAM_GOV_API_KEY to .env.example with signup URL comment
1. Test the USASpending fetch manually:
   curl http://localhost:3000/api/federal
   Verify the stateAllocations array has real state names and values, not the hardcoded mock
1. Implement the caching layer in Supabase:
   Create a federal_cache table in schema.sql if it doesn’t exist:
   CREATE TABLE IF NOT EXISTS federal_cache (
   key TEXT PRIMARY KEY,
   data_json JSONB NOT NULL,
   cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
1. Add the USASpending harvest to the Vercel cron (api/cron/harvest/route.ts):
   Fetch daily and update federal_cache
1. Update FederalStateTable and FederalLeaderboard components to handle
   the live data shape from USASpending (different structure from the static mock)

Run /test-run to verify TypeScript still compiles cleanly.

```
---

### SESSION 8 — Connect WeeklyBrief to Claude API
```

Run /wire-brief to implement live Claude API generation for the weekly intelligence brief.

After implementing:

1. Add ANTHROPIC_API_KEY to .env.example
1. Create Supabase table for brief storage:
   CREATE TABLE IF NOT EXISTS weekly_briefs (
   id BIGSERIAL PRIMARY KEY,
   brief_text TEXT NOT NULL,
   generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   data_snapshot JSONB,
   model TEXT NOT NULL DEFAULT ‘claude-sonnet-4-5’
   );
1. Add to Vercel cron schedule — generate every Monday at 07:00 ET:
   Add to vercel.json crons array:
   { “path”: “/api/cron/brief”, “schedule”: “0 12 * * 1” }
   Create src/app/api/cron/brief/route.ts that generates and stores the brief
1. The WeeklyBrief component already accepts brief, generatedAt, and source props.
   Update the /api/weekly-brief route to query the latest row from weekly_briefs table.
1. Add a test for the brief generation that mocks the Anthropic API:
   tests/api/test-weekly-brief.ts — verify the route returns a structured brief object

Run /test-run.

```
---

### SESSION 9 — Mobile Pass
```

Run /mobile-pass across all modified screens.

Priority order for mobile fixes:

1. dashboard/page.tsx — verify all 8 sections stack properly at 375px
1. ForecastChart — the custom SVG uses fixed width=620; make it responsive
1. ScenarioBuilder — move to bottom sheet on mobile (width < 480px)
1. homepage Hero section — headline + forecast chart must be legible at 390px

ForecastChart responsive fix is the hardest:
The SVG currently takes explicit width/height props.
Make it responsive by:

1. Adding a ResizeObserver to measure the container
1. Passing measured width to the chart computation
1. Or switching to a viewBox approach: viewBox=“0 0 620 480” with width=“100%”

For bottom sheet pattern:
Create src/app/components/BottomSheet.tsx — a mobile-only overlay component
that slides up from the bottom with a drag handle, matching Apple HIG sheet behavior.
Use it for ScenarioBuilder and StateDrillDown on mobile.

Test at these widths: 375px, 390px, 414px, 768px, 1024px, 1440px.

```
---

### SESSION 10 — Performance and Launch Readiness
```

Prepare constructaiq.trade for production traffic.

1. Add loading skeletons
   Every data-dependent section needs a skeleton while its fetch resolves.
   Create src/app/components/Skeleton.tsx — a reusable shimmer component.
   Apply to: ForecastChart (tall skeleton), KPI row (6 card skeletons), StateMap.
1. Add proper error boundaries
   ErrorBoundary already exists in src/app/dashboard/components/ErrorBoundary.tsx.
   Ensure it wraps each section (not just the whole dashboard) so one section failure
   doesn’t blank the entire dashboard.
1. Optimize images
   All SVG logos should use Next.js Image component (they already do for the main logo).
   Verify no PNG/JPG is being loaded without dimensions.
1. Verify CSP headers
   next.config.ts has a Content-Security-Policy header.
   After adding Claude API calls from the server, no CSP changes should be needed.
   After adding USASpending API calls from the server, add api.usaspending.gov to connect-src.
1. Verify all environment variables
   Run: node -e “require(‘dotenv’).config({path:’.env.local’}); console.log(Object.keys(process.env).filter(k => k.includes(‘KEY’) || k.includes(‘URL’) || k.includes(‘SECRET’)))”
   Confirm all required vars from .env.example are present.
1. Run the full test suite one final time: /test-run
   All 18 tests must pass.
   0 TypeScript errors.
   0 hardcoded hex colors outside theme.ts.
   0 Math.random() in rendering paths.
   0 console.log in production code.
1. Verify Vercel deployment
   Push to main and verify the CI pipeline passes.
   Check constructaiq.trade loads within 3 seconds.
   Verify /api/status returns { status: “ok” }.

```
---

## QUICK REFERENCE — WHAT EXISTS vs. WHAT NEEDS WORK

### ✅ Solid — Don't Touch
- `src/lib/models/` — ensemble forecasting engine is production-quality
- `src/lib/theme.ts` — design token system is well-structured
- `src/app/api/` — 38+ routes, most working
- `schema.sql` — database schema is clean and idempotent
- `src/app/api/cron/harvest/route.ts` — data harvest pipeline works
- `src/lib/auth.ts` + `src/lib/ratelimit.ts` — API key system works
- `.github/workflows/ci.yml` — CI pipeline is solid

### 🔧 Fix Before Features
- `src/app/layout.tsx` — apply font class (Session 1)
- `src/app/globals.css` — add @font-face (Session 1)
- `Math.random()` in `dashboard/page.tsx` — replace with real data (Session 2)
- `src/app/api/federal/route.ts` — connect to USASpending (Session 7)

### 🏗️ Refactor
- `src/app/dashboard/page.tsx` — split monolith (Session 3)
- `src/app/page.tsx` — redesign homepage (Session 6)

### 📈 Elevate
- `ForecastChart.tsx` — add driver annotation, previous forecast, series selector (Session 5)
- `ScenarioBuilder.tsx` — scenario line on chart, better presets (Session 5)

### 🔌 Wire Up
- `src/app/api/weekly-brief/route.ts` — Claude API (Session 8)
- `GateLock` in dashboard — implement real plan gating

### 📱 Polish
- Mobile responsive pass (Session 9)
- Loading skeletons (Session 10)
- Error boundaries per-section (Session 10)

---

## HOW TO START RIGHT NOW

```bash
cd ConstructAIQ
claude
```

Paste Session 1 prompt. The font system is the foundation everything else sits on.
Fix it first. Then Session 2. Work the list.

Every session prompt is self-contained — Claude Code will read the actual files,
understand the existing code, and make targeted changes based on what’s really there.

-----

*ConstructAIQ Claude Code Plan — April 21, 2026*
*Based on full repository audit of toddbridgeford/ConstructAIQ*
*Sessions 1–10 cover: font, data integrity, architecture, UX, live data wiring, mobile, and launch*