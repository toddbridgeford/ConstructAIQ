import { NextResponse } from 'next/server'

const BEA_KEY = process.env.BEA_API_KEY || ''
const BEA_URL = 'https://apps.bea.gov/api/data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!BEA_KEY) return NextResponse.json(getSyntheticBEA(), { headers: { 'Cache-Control': 'public, s-maxage=86400' } })

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
    if (!res.ok) return NextResponse.json(getSyntheticBEA(), { headers: { 'Cache-Control': 'public, s-maxage=86400' } })

    const data = await res.json()
    const rows = data?.BEAAPI?.Results?.Data || []

    const byState: Record<string, any> = {}
    for (const r of rows) {
      const key = r.GeoName
      if (!byState[key]) byState[key] = { state: key, fips: r.GeoFips, years: {} }
      byState[key].years[r.TimePeriod] = parseFloat(r.DataValue?.replace(/,/g, '') || '0')
    }

    const states = Object.values(byState)
      .filter((s: any) => s.years['2023'] > 0)
      .sort((a: any, b: any) => b.years['2023'] - a.years['2023'])
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
    return NextResponse.json(getSyntheticBEA(), { headers: { 'Cache-Control': 'public, s-maxage=86400' } })
  }
}

function getSyntheticBEA() {
  return {
    source: 'BEA Regional GDP — synthetic fallback',
    live: false,
    unit: 'Millions of dollars',
    states: [
      { state: 'Texas',      fips: '48', years: { '2023': 98420, '2022': 91230, '2021': 82140 } },
      { state: 'California', fips: '06', years: { '2023': 94180, '2022': 88760, '2021': 79320 } },
      { state: 'Florida',    fips: '12', years: { '2023': 72340, '2022': 67890, '2021': 58420 } },
      { state: 'New York',   fips: '36', years: { '2023': 58920, '2022': 54180, '2021': 48730 } },
      { state: 'Georgia',    fips: '13', years: { '2023': 41280, '2022': 38420, '2021': 33180 } },
      { state: 'Arizona',    fips: '04', years: { '2023': 38740, '2022': 35920, '2021': 29840 } },
      { state: 'Washington', fips: '53', years: { '2023': 36180, '2022': 33740, '2021': 28920 } },
      { state: 'Colorado',   fips: '08', years: { '2023': 32840, '2022': 30180, '2021': 25740 } },
      { state: 'Tennessee',  fips: '47', years: { '2023': 29420, '2022': 27180, '2021': 22840 } },
      { state: 'Nevada',     fips: '32', years: { '2023': 26180, '2022': 24320, '2021': 19740 } },
    ],
    updated: new Date().toISOString(),
  }
}
