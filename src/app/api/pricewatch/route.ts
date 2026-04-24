import { NextResponse } from 'next/server'

const FRED_KEY  = process.env.FRED_API_KEY  || ''
const BLS_KEY   = process.env.BLS_API_KEY   || ''
const EIA_KEY   = process.env.EIA_API_KEY   || ''

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── BLS PPI series relevant to construction ───────────────────────────────────
const PPI_SERIES: Record<string, { name: string; unit: string }> = {
  'WPU0811':   { name: 'Lumber & Wood',        unit: 'Index 1982=100' },
  'WPU101':    { name: 'Iron & Steel',          unit: 'Index 1982=100' },
  'WPU132':    { name: 'Concrete Products',     unit: 'Index 1982=100' },
  'WPU1021':   { name: 'Copper & Products',     unit: 'Index 1982=100' },
  'WPU0561':   { name: 'Diesel Fuel',           unit: 'Index 1982=100' },
  'WPUFD4131': { name: 'Architectural Glass',   unit: 'Index 1982=100' },
}

// ── FRED commodity series ─────────────────────────────────────────────────────
const FRED_SERIES: Record<string, { name: string; unit: string }> = {
  'DCOILWTICO': { name: 'WTI Crude Oil',    unit: '$/bbl'  },
  'PCOPPUSDM':  { name: 'Copper Price',     unit: '$/tonne' },
  'PWHEAMTUSDM':{ name: 'Wheat (Proxy)',    unit: '$/tonne' },
}

interface Commodity {
  id:        string
  name:      string
  value:     number
  prevValue: number
  mom:       number
  yoy:       number
  unit:      string
  source:    string
  signal:    'BUY' | 'SELL' | 'HOLD'
  trend:     'UP' | 'DOWN' | 'FLAT'
  updated:   string
}

async function fetchBLSSeries(seriesId: string): Promise<{ value: number; prev: number } | null> {
  if (!BLS_KEY) return null
  try {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        seriesid:       [seriesId],
        startyear:      '2024',
        endyear:        '2026',
        registrationkey: BLS_KEY,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const series = data?.Results?.series?.[0]?.data || []
    if (series.length < 2) return null
    return { value: parseFloat(series[0].value), prev: parseFloat(series[1].value) }
  } catch {
    return null
  }
}

async function fetchFREDSeries(seriesId: string): Promise<{ value: number; prev: number } | null> {
  if (!FRED_KEY) return null
  try {
    const url = 'https://api.stlouisfed.org/fred/series/observations' +
      '?series_id=' + seriesId +
      '&api_key=' + FRED_KEY +
      '&file_type=json&sort_order=desc&limit=2'
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    const obs = data?.observations || []
    if (obs.length < 2) return null
    const v  = parseFloat(obs[0].value)
    const pv = parseFloat(obs[1].value)
    if (isNaN(v) || isNaN(pv)) return null
    return { value: v, prev: pv }
  } catch {
    return null
  }
}

function calcSignal(mom: number, yoy: number): 'BUY' | 'SELL' | 'HOLD' {
  if (mom < -2 && yoy < -5) return 'BUY'    // Prices falling — buy materials now
  if (mom > 3  && yoy > 10) return 'SELL'   // Prices rising — sell / hedge
  return 'HOLD'
}

function calcTrend(mom: number): 'UP' | 'DOWN' | 'FLAT' {
  if (mom > 0.5) return 'UP'
  if (mom < -0.5) return 'DOWN'
  return 'FLAT'
}

export async function GET() {
  const commodities: Commodity[] = []
  const now = new Date().toISOString()

  // Fetch BLS PPI series
  const blsResults = await Promise.allSettled(
    Object.entries(PPI_SERIES).map(async ([id, meta]) => {
      const result = await fetchBLSSeries(id)
      return { id, meta, result }
    })
  )

  for (const r of blsResults) {
    if (r.status !== 'fulfilled') continue
    const { id, meta, result } = r.value
    if (!result) continue
    const mom = ((result.value - result.prev) / result.prev) * 100
    const yoy = mom * 12 // Approximate annualized
    commodities.push({
      id, name: meta.name, value: result.value, prevValue: result.prev,
      mom: parseFloat(mom.toFixed(2)), yoy: parseFloat(yoy.toFixed(1)),
      unit: meta.unit, source: 'BLS PPI', updated: now,
      signal: calcSignal(mom, yoy), trend: calcTrend(mom),
    })
  }

  // Fetch FRED series
  const fredResults = await Promise.allSettled(
    Object.entries(FRED_SERIES).map(async ([id, meta]) => {
      const result = await fetchFREDSeries(id)
      return { id, meta, result }
    })
  )

  for (const r of fredResults) {
    if (r.status !== 'fulfilled') continue
    const { id, meta, result } = r.value
    if (!result) continue
    const mom = ((result.value - result.prev) / result.prev) * 100
    const yoy = mom * 12
    commodities.push({
      id, name: meta.name, value: result.value, prevValue: result.prev,
      mom: parseFloat(mom.toFixed(2)), yoy: parseFloat(yoy.toFixed(1)),
      unit: meta.unit, source: 'FRED', updated: now,
      signal: calcSignal(mom, yoy), trend: calcTrend(mom),
    })
  }

  if (commodities.length === 0) {
    return NextResponse.json({
      source:     'ConstructAIQ PriceWatch',
      live:       false,
      commodities: [],
      compositeIndex: null,
      error: 'Price data temporarily unavailable. Configure BLS_API_KEY and FRED_API_KEY.',
      updated: null,
    }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  // Compute composite index
  const avgMom = commodities.reduce((s, c) => s + c.mom, 0) / commodities.length
  const compositeSignal = avgMom < -1 ? 'BUY' : avgMom > 2 ? 'SELL' : 'HOLD'

  return NextResponse.json({
    source:          'ConstructAIQ PriceWatch',
    live:            true,
    commodities:     commodities.sort((a, b) => Math.abs(b.mom) - Math.abs(a.mom)),
    compositeIndex: {
      avgMoM:       parseFloat(avgMom.toFixed(2)),
      signal:       compositeSignal,
      description:  compositeSignal === 'BUY'
        ? 'Materials softening — favorable procurement window'
        : compositeSignal === 'SELL'
        ? 'Materials inflation accelerating — hedge or lock in prices'
        : 'Materials prices stable — standard procurement pace',
    },
    updated: now,
  }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
}

