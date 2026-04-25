import { NextResponse }    from 'next/server'
import { getWeeklyBrief } from '@/lib/weeklyBrief'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

export async function GET() {
  const result = await getWeeklyBrief()
  return NextResponse.json(
    {
      brief:       result.brief,
      generatedAt: result.generatedAt,
      // Provenance — every field is required reading for any UI that
      // displays this brief. `source` is the canonical flag; `live` and
      // `configured` are convenience booleans for status surfaces.
      source:      result.source,
      live:        result.live,
      configured:  result.configured,
      ...(result.warning ? { warning: result.warning } : {}),
      ...(result.error   ? { error:   result.error   } : {}),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  )
}
