import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Realistic demo data shown when Supabase is unavailable or no results published
const DEMO_RESULTS = {
  quarter: 'Q2 2025',
  respondent_count: 0,
  published_at: null,
  collecting: true,
  closes_at: '2025-05-21T23:59:59Z',
  backlog_net: null,
  margin_net: null,
  labor_net: null,
  market_net: null,
  backlog_qoq: null,
  margin_qoq: null,
  labor_qoq: null,
  market_qoq: null,
  backlog_dist: {},
  margin_dist: {},
  labor_dist: {},
  market_dist: {},
  material_dist: {},
  by_region: {},
  by_company_size: {},
  by_work_type: {},
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const quarter = searchParams.get('quarter')

  try {
    // Fetch the active/most-recent period first for context
    let periodQuery = supabase
      .from('survey_periods')
      .select('id, quarter, closes_at, is_active, published_at')
      .order('opens_at', { ascending: false })
      .limit(1)

    if (quarter) {
      periodQuery = supabase
        .from('survey_periods')
        .select('id, quarter, closes_at, is_active, published_at')
        .eq('quarter', quarter)
        .limit(1)
    }

    const { data: periods, error: pErr } = await periodQuery
    if (pErr || !periods?.length) return NextResponse.json(DEMO_RESULTS)

    const period = periods[0]

    // Check if results have been published
    let resultsQuery = supabase
      .from('survey_results')
      .select('*')
      .eq('period_id', period.id)
      .limit(1)

    const { data: results, error: rErr } = await resultsQuery
    if (rErr) return NextResponse.json(DEMO_RESULTS)

    // Get current response count for the collecting state
    const { count } = await supabase
      .from('survey_responses')
      .select('id', { count: 'exact', head: true })
      .eq('period_id', period.id)

    if (!results?.length) {
      // No published results yet — return collecting state
      return NextResponse.json({
        ...DEMO_RESULTS,
        quarter: period.quarter,
        closes_at: period.closes_at,
        respondent_count: count ?? 0,
        collecting: true,
      })
    }

    const r = results[0]
    return NextResponse.json({
      quarter: r.quarter,
      respondent_count: r.respondent_count,
      published_at: r.published_at,
      closes_at: period.closes_at,
      collecting: false,
      backlog_net: r.backlog_net,
      margin_net: r.margin_net,
      labor_net: r.labor_net,
      market_net: r.market_net,
      backlog_qoq: r.backlog_qoq,
      margin_qoq: r.margin_qoq,
      labor_qoq: r.labor_qoq,
      market_qoq: r.market_qoq,
      backlog_dist: r.backlog_dist ?? {},
      margin_dist: r.margin_dist ?? {},
      labor_dist: r.labor_dist ?? {},
      market_dist: r.market_dist ?? {},
      material_dist: r.material_dist ?? {},
      by_region: r.by_region ?? {},
      by_company_size: r.by_company_size ?? {},
      by_work_type: r.by_work_type ?? {},
    })
  } catch {
    return NextResponse.json(DEMO_RESULTS)
  }
}
