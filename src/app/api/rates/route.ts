import { NextResponse } from 'next/server'

export const maxDuration = 10

const FRED_KEY = process.env.FRED_API_KEY || ''
const BASE     = 'https://api.stlouisfed.org/fred/series/observations'

const RATE_SERIES = [
  { id:'DGS10',        name:'10-Year Treasury Yield',           unit:'Percent' },
  { id:'MORTGAGE30US', name:'30-Year Fixed Mortgage Rate',      unit:'Percent' },
  { id:'DPRIME',       name:'Bank Prime Loan Rate',             unit:'Percent' },
  { id:'FEDFUNDS',     name:'Federal Funds Rate',               unit:'Percent' },
]

async function fetchSeries(seriesId: string, limit = 24) {
  if (!FRED_KEY) return null
  const url = `${BASE}?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=${limit}&observation_start=2024-01-01`
  const res  = await fetch(url, { next: { revalidate: 3600 } }) // 1hr cache for rates
  if (!res.ok) return null
  type FredObs = { date: string; value: string }
  const data = await res.json()
  return data?.observations
    ?.filter((o: FredObs) => o.value !== '.')
    ?.map((o: FredObs) => ({ date: o.date, value: parseFloat(o.value) }))
    ?.reverse() || null
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UNAVAILABLE = {
  source: 'FRED',
  live: false,
  error: 'Rate data temporarily unavailable',
  monthly: [],
  summary: null,
  updated: null,
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      RATE_SERIES.map(s => fetchSeries(s.id))
    )

    type SeriesData = { name: string; unit: string; observations: { date: string; value: number }[] }
    const series: Record<string, SeriesData> = {}
    let anyLive = false

    RATE_SERIES.forEach((s, i) => {
      const r = results[i]
      if (r.status === 'fulfilled' && r.value) {
        series[s.id] = { name: s.name, unit: s.unit, observations: r.value }
        anyLive = true
      }
    })

    if (!anyLive) {
      return NextResponse.json(UNAVAILABLE, {
        headers: { 'Cache-Control': 'public, s-maxage=3600' },
      })
    }

    // Compute key metrics
    const latest10yr   = series['DGS10']?.observations?.slice(-1)[0]?.value || 4.32
    const latestMortg  = series['MORTGAGE30US']?.observations?.slice(-1)[0]?.value || 6.82
    const prevMortg    = series['MORTGAGE30US']?.observations?.slice(-2, -1)[0]?.value || latestMortg
    const mortgChg     = parseFloat((latestMortg - prevMortg).toFixed(2))

    return NextResponse.json({
      source:   'Federal Reserve FRED',
      live:     true,
      series,
      summary: {
        treasury10yr:     latest10yr,
        mortgage30yr:     latestMortg,
        mortgageChg1wk:   mortgChg,
        constructionLoan: parseFloat((latest10yr + 2.25).toFixed(2)), // prime + spread approx
        rateEnvironment:  latest10yr > 4.5 ? 'ELEVATED' : latest10yr > 3.5 ? 'MODERATE' : 'LOW',
        affordabilityNote: latestMortg > 7 ? 'Rate headwinds constraining residential' : 'Rate pressure easing',
      },
      updated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  } catch (err) {
    console.error('[/api/rates]', err)
    return NextResponse.json(UNAVAILABLE, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  }
}
