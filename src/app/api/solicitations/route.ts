import { NextResponse, type NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 20
const MAX_LIMIT     = 100

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const state = searchParams.get('state')?.toUpperCase() ?? null
  const limit = Math.min(
    parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    MAX_LIMIT,
  )

  let query = supabase
    .from('federal_solicitations')
    .select('notice_id, title, agency, office, state_code, naics, posted_date, response_due, estimated_value, status', { count: 'exact' })
    .eq('status', 'OPEN')
    .order('response_due', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (state) {
    query = query.eq('state_code', state)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[/api/solicitations]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      solicitations: data ?? [],
      total:         count ?? 0,
      state_filter:  state,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    },
  )
}
