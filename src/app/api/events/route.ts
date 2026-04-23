import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_LIMIT = 200

/**
 * GET /api/events
 *
 * Query parameters:
 *   entity_id  — filter by entity ID
 *   event_type — filter by event type (permit.filed | permit.issued | award.made | site.activated | …)
 *   days       — limit to events in the last N days (default: no limit)
 *   limit      — max rows to return (default 50, max 200)
 *   offset     — pagination offset (default 0)
 *
 * Examples:
 *   GET /api/events?entity_id=123&limit=50
 *   GET /api/events?event_type=site.activated&days=30
 *   GET /api/events?event_type=permit.issued&days=7&limit=100
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const entityIdRaw  = searchParams.get('entity_id')
  const event_type   = searchParams.get('event_type')
  const daysRaw      = searchParams.get('days')
  const limit        = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), MAX_LIMIT)
  const offset       = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  const entityId = entityIdRaw ? parseInt(entityIdRaw, 10) : null
  const days     = daysRaw     ? parseInt(daysRaw, 10)     : null

  if (entityId !== null && isNaN(entityId)) {
    return NextResponse.json({ error: 'Invalid entity_id' }, { status: 400 })
  }
  if (days !== null && (isNaN(days) || days < 1)) {
    return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('event_log')
    .select('id, entity_id, event_type, event_date, source, payload, signal_value, ingested_at', { count: 'exact' })
    .order('event_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (entityId !== null) query = query.eq('entity_id', entityId)
  if (event_type)        query = query.eq('event_type', event_type)
  if (days !== null) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('event_date', cutoff)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[events] query error:', error.message)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  return NextResponse.json({
    ok:     true,
    events: data ?? [],
    total:  count ?? 0,
    limit,
    offset,
  })
}
