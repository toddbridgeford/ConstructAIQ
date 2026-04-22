import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('survey_periods')
      .select('quarter, opens_at, closes_at, status, respondent_count')
      .eq('status', 'open')
      .lte('opens_at', now)
      .gte('closes_at', now)
      .order('opens_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[/api/survey/current]', error.message)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    return NextResponse.json(
      { survey: data ?? null },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    )
  } catch (err) {
    console.error('[/api/survey/current]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
