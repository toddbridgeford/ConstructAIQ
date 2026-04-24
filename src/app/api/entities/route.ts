import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_LIMIT = 100

/**
 * GET /api/entities
 *
 * Query parameters:
 *   type    — entity type filter (permit | award | metro | project | contractor | agency | site)
 *   metro   — metro_code filter (e.g. PHX, NYC)
 *   state   — state_code filter (e.g. AZ, TX)
 *   source  — source filter (socrata | usaspending | msa_boundaries | sam_gov)
 *   limit   — max rows to return (default 20, max 100)
 *   offset  — pagination offset (default 0)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const type   = searchParams.get('type')
  const metro  = searchParams.get('metro')
  const state  = searchParams.get('state')
  const source = searchParams.get('source')
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), MAX_LIMIT)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  let query = supabaseAdmin
    .from('entities')
    .select('id, type, external_id, source, label, state_code, metro_code, attributes, first_seen, last_updated', { count: 'exact' })
    .order('last_updated', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type)   query = query.eq('type', type)
  if (metro)  query = query.eq('metro_code', metro)
  if (state)  query = query.eq('state_code', state)
  if (source) query = query.eq('source', source)

  const { data, error, count } = await query

  if (error) {
    console.error('[entities] query error:', error.message)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  return NextResponse.json({
    ok:       true,
    entities: data ?? [],
    total:    count ?? 0,
    limit,
    offset,
  })
}
