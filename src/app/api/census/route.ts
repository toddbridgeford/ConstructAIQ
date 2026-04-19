import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.FRED_API_KEY
  if (!key) return NextResponse.json({ error: 'FRED_API_KEY not configured' }, { status: 503 })

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=TTLCONS&api_key=${key}&file_type=json&limit=24&sort_order=desc`
    const res  = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`FRED ${res.status}`)
    const data = await res.json()

    return NextResponse.json({
      source:       'U.S. Census Bureau via FRED',
      series:       'Total Construction Put in Place (TTLCONS)',
      units:        'Millions of Dollars, SAAR',
      latest:       data.observations?.[0] ?? null,
      observations: data.observations ?? [],
      updated:      new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
  } catch (e) {
    console.error('[/api/census]', e)
    return NextResponse.json({ error: 'Failed to fetch construction spending' }, { status: 502 })
  }
}
