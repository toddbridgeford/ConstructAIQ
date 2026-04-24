import { NextResponse } from 'next/server'
import { getLatestObs } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Linear-interpolation percentile value
function pctVal(sorted: number[], p: number): number {
  const h  = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(h)
  const hi = Math.ceil(h)
  if (lo === hi) return sorted[lo]
  return Math.round((sorted[lo] + (sorted[hi] - sorted[lo]) * (h - lo)) * 10) / 10
}

// Rank: percentage of distribution strictly below value
function pctRank(sorted: number[], value: number): number {
  const below = sorted.filter(v => v < value).length
  return Math.round((below / sorted.length) * 100)
}

function classify(percentile: number): 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE' {
  if (percentile > 66) return 'ABOVE_AVERAGE'
  if (percentile < 33) return 'BELOW_AVERAGE'
  return 'AVERAGE'
}

function makeLabel(classification: string, period: string): string {
  const p = period === '5yr' ? '5-year' : period === '3yr' ? '3-year' : '2-year'
  if (classification === 'ABOVE_AVERAGE')
    return `Above ${p} average — market is in the upper third of its historical range`
  if (classification === 'BELOW_AVERAGE')
    return `Below ${p} average — market is in the lower third of its historical range`
  return `Near ${p} average — market is in the middle of its historical range`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seriesId     = (searchParams.get('series') || '').toUpperCase()
  const currentValue = parseFloat(searchParams.get('value') || '')
  const months       = Math.min(60, Math.max(6, parseInt(searchParams.get('months') || '60')))

  if (!seriesId || !/^[A-Z0-9_]{1,20}$/.test(seriesId)) {
    return NextResponse.json({ error: 'Invalid series' }, { status: 400 })
  }
  if (isNaN(currentValue)) {
    return NextResponse.json({ error: 'value param required and must be numeric' }, { status: 400 })
  }

  let obs: { date: string; value: number }[] = []

  try {
    const rows = await getLatestObs(seriesId, months)
    if (rows.length > 0) {
      obs = rows.map(r => ({ date: (r as { obs_date: string; value: number }).obs_date, value: r.value }))
    }
  } catch { /* fall through */ }

  if (obs.length === 0) {
    return NextResponse.json({
      error: 'No historical data available for this series',
      series: seriesId,
      note: 'Data populates after the first harvest cron run.',
    }, { status: 404 })
  }

  if (obs.length < 3) {
    return NextResponse.json({ error: 'Insufficient historical data for this series' }, { status: 404 })
  }

  const values = obs.map(o => o.value)
  const sorted = [...values].sort((a, b) => a - b)
  const n      = values.length

  const mean   = parseFloat((values.reduce((s, v) => s + v, 0) / n).toFixed(1))
  const median = pctVal(sorted, 50)
  const p10    = pctVal(sorted, 10)
  const p25    = pctVal(sorted, 25)
  const p75    = pctVal(sorted, 75)
  const p90    = pctVal(sorted, 90)

  const percentile     = pctRank(sorted, currentValue)
  const classification = classify(percentile)

  // YoY: current vs value ~12 observations ago
  let yoyChangePct: number | null = null
  if (n >= 13) {
    const lyVal = values[n - 13]
    if (lyVal && lyVal !== 0) {
      yoyChangePct = parseFloat(((currentValue - lyVal) / lyVal * 100).toFixed(1))
    }
  }

  // 5yr trend: recent 12 months mean vs earlier period
  let trend5yr: 'RISING' | 'DECLINING' | 'STABLE' = 'STABLE'
  if (n >= 24) {
    const recentMean = values.slice(-12).reduce((s, v) => s + v, 0) / 12
    const priorMean  = values.slice(0, -12).reduce((s, v) => s + v, 0) / (n - 12)
    const chg        = (recentMean - priorMean) / priorMean * 100
    if (chg > 1.5) trend5yr = 'RISING'
    else if (chg < -1.5) trend5yr = 'DECLINING'
  }

  const benchmarkPeriod = n >= 54 ? '5yr' : n >= 30 ? '3yr' : '2yr'
  const asOf            = obs[obs.length - 1].date

  return NextResponse.json({
    series:           seriesId,
    current_value:    currentValue,
    percentile,
    classification,
    mean,
    median,
    p25,
    p75,
    p10,
    p90,
    yoy_change_pct:   yoyChangePct,
    trend_5yr:        trend5yr,
    benchmark_period: benchmarkPeriod,
    label:            makeLabel(classification, benchmarkPeriod),
    as_of:            asOf,
  }, { headers: { 'Cache-Control': 'public, s-maxage=300' } })
}
