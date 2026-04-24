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
      source:      result.source,
      ...(result.error ? { error: result.error } : {}),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  )
}
