import { NextResponse }  from 'next/server'
import { computeCshi }  from '@/lib/cshi'

export const maxDuration = 10
export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'

export async function GET() {
  try {
    const result = await computeCshi()
    return NextResponse.json(
      result,
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
    )
  } catch (err) {
    console.error('[/api/cshi]', err)
    return NextResponse.json({ error: 'Failed to compute CSHI' }, { status: 500 })
  }
}
