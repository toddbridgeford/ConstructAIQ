# /elevate-forecast — Make ForecastChart the premium hero it deserves to be

The ForecastChart custom SVG is already well-built — confidence bands, delta annotation,
bridge dot, amber/blue color split. It just needs additions and visual elevation.

## Read first

```bash
cat src/app/dashboard/components/ForecastChart.tsx
cat src/app/dashboard/components/ScenarioBuilder.tsx
cat src/app/dashboard/types.ts
```

-----

## ForecastChart additions

### Addition 1 — Make it responsive

Current: `width = 620` default prop with fixed SVG dimensions.
The SVG already uses `viewBox` — remove the fixed width and use `width="100%"`.

```tsx
// Before:
<svg width="100%" viewBox={`0 0 ${width} ${height}`}

// After: remove width prop from component signature; hardcode viewBox to "0 0 620 480"
// The SVG scales via width="100%" on the element and viewBox handles internal coordinates
export function ForecastChart({ foreData, height = 480 }: {
  foreData: ForecastData | null
  height?: number
}) {
  // Use fixed internal coordinate space
  const width = 620
  // ... rest stays the same
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}
           style={{ overflow: "visible", display: "block" }}>
```

### Addition 2 — Series selector

Add a series selector row above the chart. Currently it only shows TTLCONS.

```tsx
const SERIES = [
  { id: 'TTLCONS',       label: 'Total Spending',  unit: '$T' },
  { id: 'HOUST',         label: 'Housing Starts',  unit: 'K/mo' },
  { id: 'PERMIT',        label: 'Permits',          unit: 'K/mo' },
  { id: 'CES2000000001', label: 'Employment',       unit: 'K' },
]
```

Render as pill buttons above the chart. On click, pass the selected series ID up to the parent
to refetch from `/api/forecast?series={id}`.

### Addition 3 — Model context strip

Below the chart legend, add a single row of model metadata:

```tsx
<div style={{ display: 'flex', gap: 24, paddingLeft: PAD.left, marginTop: 8 }}>
  <span>{font.mono} HW {foreData.metrics.hwWeight}%</span>
  <span>SARIMA {foreData.metrics.sarimaWeight}%</span>
  <span>XGB {foreData.metrics.xgboostWeight}%</span>
  <span>MAPE {foreData.metrics.mape}%</span>
  <span>{foreData.metrics.n} months</span>
</div>
```

The `EnsembleResult.metrics` object is already returned by `runEnsemble()` and available in foreData.

### Addition 4 — Previous forecast comparison line

When the forecasts table in Supabase has a prior forecast run, overlay it as a faint dashed line.

Add to ForecastChart props: `prevForecast?: number[]`

Render as:

```tsx
{prevForecast && (
  <path d={prevFcstPath} fill="none" stroke={T4}
        strokeWidth={1.5} strokeDasharray="4,3" strokeOpacity={0.4} />
)}
```

Label it with a legend entry: `{ col: T4, label: "Prior forecast", opacity: 0.4, dashed: true }`

The parent component fetches the prior forecast from Supabase:

```typescript
const { data: priorRows } = await supabase
  .from('forecasts')
  .select('base_value')
  .eq('series_id', activeSeries)
  .eq('model', 'ensemble')
  .lt('run_date', today)
  .order('run_date', { ascending: false })
  .limit(12)
```

-----

## ScenarioBuilder additions

### Addition 1 — Scenario line on the ForecastChart

This is the most important missing piece. The scenario output is currently just a text number.
It should appear as a live colored line on ForecastChart.

1. ScenarioBuilder computes adjusted forecast values based on slider positions
1. It passes `scenarioForecast: number[]` up to the parent
1. Parent passes it to ForecastChart as a `scenarioLine` prop
1. ForecastChart renders it as a colored overlay line (color: `color.amber`)

Scenario adjustment (keep it simple — linear elasticities):

```typescript
function applyScenario(baseForecast: number[], rate: number, iija: number, labor: number, material: number) {
  return baseForecast.map((v, i) => {
    const rateFactor    = 1 - (rate / 100) * 0.012       // -1.2% per 100bps
    const iijaFactor    = 1 + ((iija - 100) / 100) * 0.007 // +0.7% per 10% IIJA increase
    const laborFactor   = 1 + (labor / 100) * 0.008
    const materialFactor = 1 - (material / 100) * 0.003
    return Math.round(v * rateFactor * iijaFactor * laborFactor * materialFactor * 10) / 10
  })
}
```

### Addition 2 — Preset pills visual prominence

The PRESETS array exists: `{ Recession, Baseline, Expansion, Infrastructure Push }`.
Currently rendered as small buttons. Make them prominent:

```tsx
<div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
  {PRESETS.map((p, i) => (
    <button
      key={p.label}
      onClick={() => { setRate(p.rate); setIija(p.iija); setLabor(p.labor); setMaterial(p.material); setActive(i) }}
      className={active === i ? 'btn-f' : 'btn-g'}
      style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10 }}
    >
      {p.label}
    </button>
  ))}
</div>
```

### Addition 3 — Summary output card

The delta impact summary already exists at the bottom. Make numbers larger:
Use `type.h4` token (fontSize: 19) for the delta values — not fontSize: 14.

-----

## Run after changes

```bash
npx tsc --noEmit
npm test
npm run dev
```

Verify:

1. ForecastChart fills its container width on all screen sizes
1. Series selector pills switch the forecast correctly
1. Moving a ScenarioBuilder slider draws a second colored line on ForecastChart
1. Model weights strip appears below the chart legend