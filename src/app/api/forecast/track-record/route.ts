import { NextResponse } from 'next/server'
import { runEnsemble } from '@/lib/models/ensemble'
import { supabase } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// TTLCONS seed — 61 months Jan 2021 → Jan 2026 (same as forecast route)
const SEED: number[] = [
  1610,1639,1703,1750,1796,1829,1847,1859,1872,1891,1906,1921,
  1938,1952,1969,1985,2001,2018,2035,2049,2062,2078,2091,2101,
  2111,2119,2133,2142,2158,2162,2168,2171,2175,2178,2180,2183,
  2184.6,2174.9,2206.5,2215.4,2199.8,2200.7,2205.3,2197.9,2197.1,2192.9,2176.6,2169.6,
  2165.4,2150.8,2153.4,2149.1,2160.7,2168.5,2177.2,2169.5,2167.9,2181.2,2197.6,2190.4,
  2190.4,
]

// Seed anchor: index 60 = January 2026
function seedIndexToDate(i: number): string {
  // index 0 = Jan 2021 → offset i months
  const d = new Date(2021, 0 + i, 1)
  return d.toISOString().slice(0, 7)
}

async function loadActuals(): Promise<{ date: string; value: number }[]> {
  try {
    const { data, error } = await supabase
      .from('observations')
      .select('obs_date, value')
      .eq('series_id', 'TTLCONS')
      .order('obs_date', { ascending: true })
      .limit(60)
    if (!error && data?.length) {
      return data.map((r: { obs_date: string; value: number }) => ({
        date:  r.obs_date.slice(0, 7),
        value: r.value,
      }))
    }
  } catch { /* fall through */ }
  // Seed fallback
  return SEED.map((v, i) => ({ date: seedIndexToDate(i), value: v }))
}

export interface TrackRecord {
  month:    string
  forecast: number
  actual:   number
  error:    number
  pctError: number
}

export async function GET() {
  const actuals = await loadActuals()
  const vals    = actuals.map(a => a.value)

  if (vals.length < 24) {
    return NextResponse.json({ records: [], message: 'Insufficient data' })
  }

  // Evaluate last 12 months: for each month M, train on data ending 12 months
  // before M, forecast 12 months ahead, compare 12th prediction to actual.
  const evalCount = 12
  const evalStart = vals.length - evalCount
  const records: TrackRecord[] = []

  for (let evalIdx = evalStart; evalIdx < vals.length; evalIdx++) {
    const trainEnd  = evalIdx - 12
    if (trainEnd < 20) continue

    const trainVals = vals.slice(0, trainEnd)
    const result    = runEnsemble(trainVals, 12)
    if (!result?.ensemble?.[11]) continue

    const forecast = Math.round(result.ensemble[11].base * 10) / 10
    const actual   = actuals[evalIdx].value
    const error    = Math.round((actual - forecast) * 10) / 10
    const pctError = Math.round(Math.abs(error / actual) * 1000) / 10

    records.push({
      month:    actuals[evalIdx].date,
      forecast,
      actual,
      error,
      pctError,
    })
  }

  const avgMape = records.length
    ? Math.round(records.reduce((s, r) => s + r.pctError, 0) / records.length * 10) / 10
    : null

  const directionCorrect = records.filter((r, i) => {
    if (i === 0) return false
    const prevActual = records[i - 1].actual
    const prevFcast  = records[i - 1].forecast
    return (r.actual > prevActual) === (r.forecast > prevFcast)
  }).length
  const directionAcc = records.length > 1
    ? Math.round(directionCorrect / (records.length - 1) * 100)
    : null

  return NextResponse.json(
    { records, avgMape, directionAcc, n: vals.length },
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
  )
}
