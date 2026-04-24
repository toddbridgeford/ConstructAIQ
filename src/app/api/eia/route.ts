import { NextResponse } from 'next/server'

const EIA_KEY = process.env.EIA_API_KEY || ''

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!EIA_KEY) {
      return NextResponse.json({
        source: 'EIA',
        live: false,
        error: 'EIA_API_KEY not configured',
        data: [],
        summary: null,
        updated: null,
      }, { status: 503 })
    }

    const url = 'https://api.eia.gov/v2/total-energy/data/?api_key=' + EIA_KEY + '&frequency=monthly&data[0]=value&facets[msn][]=CNCBUS&sort[0][column]=period&sort[0][direction]=desc&length=24'
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) {
      return NextResponse.json({
        source: 'EIA',
        live: false,
        error: `EIA API returned ${res.status}`,
        data: [],
        summary: null,
        updated: null,
      }, { status: 503 })
    }

    const data = await res.json()
    const rows = data?.response?.data || []

    type EiaRow = { period: string; value: string | null; 'unit-name'?: string }
    const series = (rows as EiaRow[])
      .filter(r => r.value != null)
      .map(r => ({
        period: r.period,
        value: parseFloat(r.value!),
        unit: r['unit-name'] || 'Trillion BTU',
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    const latest = series[series.length - 1]
    const prev   = series[series.length - 2]
    const mom    = prev && prev.value > 0 ? ((latest.value - prev.value) / prev.value * 100) : 0

    return NextResponse.json({
      source: 'U.S. Energy Information Administration',
      live: true,
      series: 'Construction sector energy consumption (CNCBUS)',
      unit: 'Trillion BTU',
      data: series,
      summary: {
        latest: latest?.value,
        period: latest?.period,
        mom: parseFloat(mom.toFixed(2)),
        signal: mom > 3 ? 'ELEVATED — energy cost pressure rising' : mom < -3 ? 'DECLINING — energy cost relief' : 'STABLE',
      },
      updated: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'public, s-maxage=14400' } })
  } catch (err) {
    console.error('[/api/eia]', err)
    return NextResponse.json({
      source: 'EIA',
      live: false,
      error: 'EIA fetch failed',
      data: [],
      summary: null,
      updated: null,
    }, { status: 503 })
  }
}
