# /fix-sparklines — Replace Math.random() with real Supabase data

`Math.random()` is used in three places in `src/app/dashboard/page.tsx`.
This causes sparklines and charts to render differently on every paint — a hydration bug and a data integrity issue.

## Step 1 — Find all instances

```bash
grep -n "Math\.random\(\)" src/app/dashboard/page.tsx
```

Expected hits:

1. `spark()` function — used for KPI card sparklines
1. `heatmapData` — materials heatmap monthly values
1. `corrMaterials` / `corrSpend` — correlation chart data

## Step 2 — Replace spark()

The `spark()` function generates a random walk. Replace it with a real Supabase fetch.

Add to the data loading `useEffect` in dashboard/page.tsx:

```typescript
// Fetch sparkline data — last 12 monthly observations per series
const { data: sparkRows } = await supabase
  .from('observations')
  .select('series_id, obs_date, value')
  .in('series_id', ['TTLCONS', 'CES2000000001', 'HOUST', 'PERMIT'])
  .order('obs_date', { ascending: true })

// Group into arrays keyed by series_id
const sparkMap: Record<string, number[]> = {}
for (const row of sparkRows ?? []) {
  if (!sparkMap[row.series_id]) sparkMap[row.series_id] = []
  sparkMap[row.series_id].push(row.value)
}
// Take last 12 observations for each
const sparklines = Object.fromEntries(
  Object.entries(sparkMap).map(([k, v]) => [k, v.slice(-12)])
)
```

Then replace `spark(spendVal, 40)` with `sparklines['TTLCONS'] ?? []` and so on for each KPI card.

**Fallback rule:** If Supabase returns no data for a series, use `Array(12).fill(lastKnownValue)` — a flat line is better than random noise.

## Step 3 — Replace heatmapData Math.random()

```typescript
// BEFORE (broken):
months: Array.from({length:12},(_,i) => ({
  value: c.value + (Math.random()-0.5)*c.value*0.05,
  pctChange: (Math.random()-0.48)*8,
}))

// AFTER (deterministic):
months: Array.from({length:12},(_,i) => ({
  value: c.value,           // flat — no random variance
  pctChange: c.mom || 0,   // use actual MoM if available, else 0
}))
```

The materials heatmap should only show real MoM change data, or nothing. Fake variance is worse than flat.

## Step 4 — Replace corrMaterials / corrSpend

These feed the MaterialsCorrelation component. Fetch real data:

```typescript
const { data: corrObs } = await supabase
  .from('observations')
  .select('series_id, obs_date, value')
  .in('series_id', ['TTLCONS', 'WPS081'])  // WPS081 = BLS PPI lumber
  .gte('obs_date', twentyFourMonthsAgo)
  .order('obs_date', { ascending: true })

const corrMaterials = corrObs?.filter(r => r.series_id === 'WPS081')
  .map(r => ({ date: r.obs_date, value: r.value })) ?? []
const corrSpend = corrObs?.filter(r => r.series_id === 'TTLCONS')
  .map(r => ({ date: r.obs_date, value: r.value / 1000 })) ?? []
```

If these series aren’t in the observations table yet, add them to the harvest cron.

## Step 5 — Delete the spark() function

After replacing all call sites, delete `function spark(base, variance)` entirely from dashboard/page.tsx.

## Step 6 — Verify

```bash
grep -n "Math\.random\(\)" src/app/dashboard/page.tsx
```

Should return zero hits.

Reload the dashboard 5 times. Sparklines should be identical every time.