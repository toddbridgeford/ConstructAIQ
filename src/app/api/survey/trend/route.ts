import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('survey_results')
      .select(`
        quarter, published_at, respondent_count,
        backlog_net_score, margin_net_score, labor_net_score, market_net_score,
        backlog_change_qoq, margin_change_qoq, labor_change_qoq, market_change_qoq
      `)
      .not('published_at', 'is', null)
      .order('quarter', { ascending: false })
      .limit(4)

    if (error) {
      console.error('[/api/survey/trend]', error.message)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    const quarters = (data ?? []).map(r => r.quarter).reverse()
    const boi = (data ?? []).map(r => r.backlog_net_score).reverse()
    const mei = (data ?? []).map(r => r.margin_net_score).reverse()
    const lai = (data ?? []).map(r => r.labor_net_score).reverse()
    const moi = (data ?? []).map(r => r.market_net_score).reverse()

    return NextResponse.json(
      {
        quarters,
        series: { boi, mei, lai, moi },
        respondents: (data ?? []).map(r => r.respondent_count).reverse(),
        quarters_available: quarters.length,
        message: quarters.length === 0 ? 'No published results yet.' : null,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
    )
  } catch (err) {
    console.error('[/api/survey/trend]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
