import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_LIMIT  = 100
const VALID_SORTS = new Set(['momentum', 'award_value', 'name'])

/**
 * GET /api/contractors
 *
 * Query parameters:
 *   state  — filter by primary_state (2-letter code, e.g. TX)
 *   limit  — max rows to return (default 20, max 100)
 *   sort   — sort field: momentum (default) | award_value | name
 *
 * Returns:
 *   { contractors: [...], total: number, state?: string, as_of: string }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const state = searchParams.get('state')?.toUpperCase() ?? null
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), MAX_LIMIT)
  const sort  = searchParams.get('sort') ?? 'momentum'

  if (!VALID_SORTS.has(sort)) {
    return NextResponse.json(
      { error: `Invalid sort. Use: ${[...VALID_SORTS].join(', ')}` },
      { status: 400 },
    )
  }

  let query = supabaseAdmin
    .from('contractor_profiles')
    .select(
      'name, primary_state, award_count_ytd, award_value_ytd, award_count_prior, award_value_prior, momentum_score, momentum_class, last_award_date',
      { count: 'exact' },
    )

  if (state) query = query.eq('primary_state', state)

  if (sort === 'momentum') {
    query = query.order('momentum_score', { ascending: false, nullsFirst: false })
  } else if (sort === 'award_value') {
    query = query.order('award_value_ytd', { ascending: false })
  } else {
    query = query.order('name', { ascending: true })
  }

  query = query.limit(limit)

  const { data, error, count } = await query

  if (error) {
    console.error('[contractors] query error:', error.message)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  const contractors = (data ?? []).map(c => ({
    name:             c.name,
    state:            c.primary_state,
    award_value_ytd:  c.award_value_ytd,
    award_count_ytd:  c.award_count_ytd,
    momentum_score:   c.momentum_score,
    momentum_class:   c.momentum_class,
    last_award:       c.last_award_date,
  }))

  return NextResponse.json(
    {
      contractors,
      total:  count ?? 0,
      ...(state ? { state } : {}),
      as_of:  new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } },
  )
}
