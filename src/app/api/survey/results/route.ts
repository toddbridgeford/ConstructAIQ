import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const quarterParam = searchParams.get('quarter')

    let query = supabase
      .from('survey_results')
      .select('*')
      .not('published_at', 'is', null)
      .order('quarter', { ascending: false })
      .limit(1)

    if (quarterParam) {
      query = query.eq('quarter', quarterParam)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('[/api/survey/results]', error.message)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    if (data) {
      return NextResponse.json(
        { status: 'published', results: data },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
      )
    }

    // No published results — find the current or most recent period to give context
    const { data: period } = await supabase
      .from('survey_periods')
      .select('quarter, respondent_count, closes_at, status')
      .in('status', ['open', 'closed'])
      .order('closes_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json(
      {
        status: 'collecting',
        quarter: period?.quarter ?? null,
        respondent_count: period?.respondent_count ?? 0,
        message: 'Results publish after survey closes and data is reviewed.',
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300' } },
    )
  } catch (err) {
    console.error('[/api/survey/results]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
