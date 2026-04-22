# /redesign-dashboard — Recompose the dashboard shell

The dashboard has three structural problems:

1. A live ticker strip that frames everything as Bloomberg Terminal cosplay
1. Forecast (the hero capability) is buried under CSHI gauge, history, and model accuracy
1. The nav bar carries too much data clutter

This command recomposes the shell. It does not redesign individual components.

## Step 1 — Read the current structure

```bash
wc -l src/app/dashboard/page.tsx
grep -n "Section id=" src/app/dashboard/page.tsx
```

## Step 2 — Remove the live ticker

Find the ticker div in dashboard/page.tsx — it’s the `<div style={{ background:BG2, borderBottom... height:32 }}>` block with the scrolling animation.

Delete it entirely. The LIVE indicator belongs only in the nav, not as a full-width scrolling strip.

Also remove the `@keyframes ticker` from globals.css if it’s no longer used elsewhere.

## Step 3 — Simplify the nav bar

Current nav right side has: GLOBE link + LIVE dot + timestamp + spend value + employment value + 30yr rate.

Reduce to:

```
Left:  [Logo]  [divider]  [Section nav links — Command / Forecast / Map / Materials / Pipeline / Federal / Equities / Signals]
Right: [LIVE pulsing dot]  [TTLCONS spend value — one metric only]  [link to /pricing]
```

Remove: timestamp, employment value, mortgage rate from nav. These belong in KPI cards.

## Step 4 — Reorder sections to match CLAUDE.md hierarchy

The current order is:

1. Command (CSHI + KPIs + ForecastBanner)
1. Forecast (ModelAccuracy + ConfidenceRing + CycleClock)
1. Map
1. Materials
1. Pipeline
1. Federal
1. Equities
1. Signals

The target order:

1. KPI row (6 cards — move out of Command section, make standalone)
1. **ForecastChart + ScenarioBuilder — THE HERO** (move to top, full-width or 60/40 split)
1. WeeklyBrief excerpt (3 sentences — a brief pull-quote from the full brief)
1. Command / CSHI (demoted — it’s now context below the forecast)
1. Map
1. Materials
1. Pipeline
1. Federal
1. Equities
1. Signals

To do this, change the NAV_SECTIONS array and the order of `<Section>` blocks in the JSX.

## Step 5 — Create src/app/dashboard/sections/ directory

Extract each section into its own file so dashboard/page.tsx becomes an orchestrator.

Create:

- `src/app/dashboard/sections/KpiRow.tsx` — the 6 KPI cards
- `src/app/dashboard/sections/HeroForecast.tsx` — ForecastChart + ScenarioBuilder side by side
- `src/app/dashboard/sections/CommandSection.tsx` — CSHI + ModelAccuracy + CycleClock
- `src/app/dashboard/sections/GeographicSection.tsx` — StateMap + TopStates + StateDrillDown
- `src/app/dashboard/sections/MaterialsSection.tsx` — CommodityCards + ProcurementIndex + Heatmap
- `src/app/dashboard/sections/PipelineSection.tsx` — PipelineTimeline + CascadeAlerts + PredictiveOverlay
- `src/app/dashboard/sections/FederalSection.tsx` — FederalPrograms + AgencyVelocity + Leaderboard
- `src/app/dashboard/sections/EquitiesSection.tsx` — SectorChart + ETFMonitor + EarningsCards
- `src/app/dashboard/sections/SignalsSection.tsx` — AnomalyFeed + DivergenceDetector + WeeklyBrief

Each section file:

- Receives only the data it needs as props (typed)
- Renders a skeleton when data is null
- Stays under 200 lines

## Step 6 — Target dashboard/page.tsx structure after refactor

```tsx
export default function Dashboard() {
  // All useEffect fetches stay here
  // All useState declarations stay here

  return (
    <div>
      <DashboardNav spendVal={spendVal} />
      <div className="wrap">
        <KpiRow spend={spend} employ={employ} ... />
        <HeroForecast foreData={fore} signals={sigList} />
        <CommandSection cshi={cshi} ... />
        <GeographicSection mapData={mapD} ... />
        <MaterialsSection prices={prices} ... />
        <PipelineSection pipeline={pipeline} ... />
        <FederalSection federal={federal} ... />
        <EquitiesSection equities={equities} ... />
        <SignalsSection signals={signals} brief={brief} ... />
      </div>
    </div>
  )
}
```

Target: dashboard/page.tsx under 200 lines after refactor.

## Step 7 — Verify

```bash
npm run dev
```

Open the dashboard. Verify all 8 sections render identically.
Check that ForecastChart is now the first major content after the KPI row.

```bash
npx tsc --noEmit && npm test
```

Must pass with 0 errors and 18/18 tests.