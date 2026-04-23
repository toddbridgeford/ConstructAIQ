import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid:        ['CES2000000001', 'PRS30006092', 'PCU2362--2362--'],
        startyear:       '2023',
        endyear:         '2026',
        registrationkey: process.env.BLS_API_KEY,
      }),
    })
    if (!res.ok) throw new Error(`BLS ${res.status}`)
    const data = await res.json()

    // Derive data_as_of from the most recent observation period in the BLS response
    const latestObs = data?.Results?.series?.[0]?.data?.[0]
    const data_as_of = latestObs?.year && latestObs?.period
      ? `${latestObs.year}-${latestObs.period.replace('M', '').padStart(2, '0')}-01`
      : null

    return NextResponse.json(
      { data, data_as_of },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
    )
  } catch (e) {
    console.error('[/api/bls]', e)
    return NextResponse.json({ error: 'Failed to fetch employment data' }, { status: 502 })
  }
}
