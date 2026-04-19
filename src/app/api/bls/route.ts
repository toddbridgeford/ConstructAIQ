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

    return NextResponse.json(
      { data, updated: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
    )
  } catch (e) {
    console.error('[/api/bls]', e)
    return NextResponse.json({ error: 'Failed to fetch employment data' }, { status: 502 })
  }
}
