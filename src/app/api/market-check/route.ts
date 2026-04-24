import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const base = url.origin
  const { searchParams } = url
  const autocomplete = searchParams.get('autocomplete')
  const marketQuery  = searchParams.get('market')

  if (autocomplete !== null) {
    return NextResponse.json({ suggestions: [] }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' },
    })
  }

  if (!marketQuery || !marketQuery.trim()) {
    return NextResponse.json(
      { error: 'Missing required parameter: market' },
      { status: 400 }
    )
  }

  try {
    const oppRes = await fetch(
      `${base}/api/opportunity-score?metro=${encodeURIComponent(marketQuery.trim())}`,
      { cache: 'no-store' }
    )
    const oppData = oppRes.ok ? await oppRes.json() : null

    if (!oppData || oppData.error) {
      return NextResponse.json({ error: 'Market not found or no data yet' })
    }

    return NextResponse.json(oppData, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'Market not found or no data yet' })
  }
}
