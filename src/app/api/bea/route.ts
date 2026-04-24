import { NextResponse } from 'next/server'

const BEA_KEY = process.env.BEA_API_KEY || ''
const BEA_URL = 'https://apps.bea.gov/api/data'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!BEA_KEY) {
      return NextResponse.json({
        source: 'BEA',
        live: false,
        error: 'BEA_API_KEY not configured',
        states: [],
        updated: null,
      }, { status: 503 })
    }

    const url = new URL(BEA_URL)
    url.searchParams.set('UserID', BEA_KEY)
    url.searchParams.set('method', 'GetData')
    url.searchParams.set('datasetname', 'Regional')
    url.searchParams.set('TableName', 'SAGDP2N')
    url.searchParams.set('LineCode', '11')
    url.searchParams.set('GeoFips', 'STATE')
    url.searchParams.set('Year', '2023,2022,2021')
    url.searchParams.set('ResultFormat', 'JSON')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) })
    if (!res.ok) {
      return NextResponse.json({
        source: 'BEA',
        live: false,
        error: `BEA API returned ${res.status}`,
        states: [],
        updated: null,
      }, { status: 503 })
    }

    const data = await res.json()
    const rows = data?.BEAAPI?.Results?.Data || []

    type StateEntry = { state: string; fips: string; years: Record<string, number> }
    const byState: Record<string, StateEntry> = {}
    for (const r of rows) {
      const key = r.GeoName
      if (!byState[key]) byState[key] = { state: key, fips: r.GeoFips, years: {} }
      byState[key].years[r.TimePeriod] = parseFloat(r.DataValue?.replace(/,/g, '') || '0')
    }

    const states = Object.values(byState)
      .filter(s => s.years['2023'] > 0)
      .sort((a, b) => b.years['2023'] - a.years['2023'])
      .slice(0, 20)

    return NextResponse.json({
      source: 'Bureau of Economic Analysis — Regional GDP',
      live: true,
      series: 'Construction sector GDP by state (SAGDP2N Line 11)',
      unit: 'Millions of dollars',
      states,
      updated: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400' } })
  } catch (err) {
    console.error('[/api/bea]', err)
    return NextResponse.json({
      source: 'BEA',
      live: false,
      error: 'BEA fetch failed',
      states: [],
      updated: null,
    }, { status: 503 })
  }
}
