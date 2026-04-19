import { NextResponse } from 'next/server'

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
  const data = await res.json()
  return data?.observations
    ?.filter((o: any) => o.value !== '.')
    ?.map((o: any) => ({ date: o.date, value: parseFloat(o.value) }))
    ?.reverse() || null
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const results = await Promise.allSettled(
      RATE_SERIES.map(s => fetchSeries(s.id))
    )

    const series: Record<string, any> = {}
    let anyLive = false

    RATE_SERIES.forEach((s, i) => {
      const r = results[i]
      if (r.status === 'fulfilled' && r.value) {
        series[s.id] = { name: s.name, unit: s.unit, observations: r.value }
        anyLive = true
      }
    })

    if (!anyLive) {
      return NextResponse.json(getSyntheticRates(), {
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
    return NextResponse.json(getSyntheticRates(), {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  }
}

function getSyntheticRates() {
  const months = ['Jan\'24','Feb\'24','Mar\'24','Apr\'24','May\'24','Jun\'24','Jul\'24','Aug\'24','Sep\'24','Oct\'24','Nov\'24','Dec\'24','Jan\'25','Feb\'25','Mar\'25','Apr\'25','May\'25','Jun\'25','Jul\'25','Aug\'25','Sep\'25','Oct\'25','Nov\'25','Dec\'25','Jan\'26','Feb\'26','Mar\'26']
  const tenYr  = [3.97,4.21,4.20,4.56,4.47,4.36,4.25,3.84,3.77,4.20,4.41,4.26,4.53,4.49,4.28,4.34,4.48,4.40,4.26,4.24,3.78,4.22,4.41,4.56,4.40,4.29,4.32]
  const mortg  = [6.62,6.78,6.87,6.99,7.09,6.92,6.82,6.49,6.20,6.72,6.84,6.72,6.96,6.89,6.76,6.81,6.93,6.82,6.75,6.63,6.18,6.72,6.84,6.95,6.88,6.82,6.85]

  return {
    source:   'Federal Reserve FRED — synthetic fallback',
    live:     false,
    monthly:  months.map((m, i) => ({ m, tenYr: tenYr[i], mortgage: mortg[i] })),
    summary: {
      treasury10yr:     4.32,
      mortgage30yr:     6.85,
      mortgageChg1wk:   0.03,
      constructionLoan: 6.57,
      rateEnvironment:  'MODERATE',
      affordabilityNote:'Rate environment constraining multifamily starts',
    },
    updated: new Date().toISOString(),
  }
}
