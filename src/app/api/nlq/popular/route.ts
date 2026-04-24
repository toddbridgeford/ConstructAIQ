import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

    const { data, error } = await supabase
      .from('nlq_queries')
      .select('question')
      .gte('asked_at', since)
      .limit(500)

    if (error || !data?.length) {
      return NextResponse.json(
        { questions: [], as_of: new Date().toISOString() },
        { headers: { 'Cache-Control': 'public, s-maxage=300' } },
      )
    }

    // Count occurrences in JS — avoids needing a stored procedure
    const counts = new Map<string, number>()
    for (const row of data) {
      const q = (row.question ?? '').trim()
      if (q) counts.set(q, (counts.get(q) ?? 0) + 1)
    }

    const popular = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question]) => question)

    return NextResponse.json(
      { questions: popular, as_of: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=300' } },
    )
  } catch {
    return NextResponse.json(
      { questions: [], as_of: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=60' } },
    )
  }
}
