import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const FALLBACK = {
    period_id: null,
    quarter: 'Q2 2025',
    opens_at: '2025-04-01T00:00:00Z',
    closes_at: '2025-05-21T23:59:59Z',
    response_count: 0,
  }

  try {
    const { data: period, error } = await supabaseAdmin
      .from('survey_periods')
      .select('id, quarter, opens_at, closes_at')
      .eq('is_active', true)
      .order('opens_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !period) return NextResponse.json(FALLBACK)

    const { count } = await supabaseAdmin
      .from('survey_responses')
      .select('id', { count: 'exact', head: true })
      .eq('period_id', period.id)

    return NextResponse.json({
      period_id: period.id,
      quarter: period.quarter,
      opens_at: period.opens_at,
      closes_at: period.closes_at,
      response_count: count ?? 0,
    })
  } catch {
    // Supabase not configured (dev) — return static fallback
    return NextResponse.json(FALLBACK)
  }
}
