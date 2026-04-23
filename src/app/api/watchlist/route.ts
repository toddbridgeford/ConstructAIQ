import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  parseWatchPayload,
  requireApiKeyHash,
  type WatchlistItem,
  type WatchlistRow,
} from '@/lib/watchlist'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function toItem(row: WatchlistRow): WatchlistItem {
  return {
    id:           row.id,
    entity_type:  row.entity_type,
    entity_id:    row.entity_id,
    entity_label: row.entity_label,
    added_at:     row.added_at,
    last_signal:  row.last_signal,
  }
}

// ── GET /api/watchlist — list the caller's watched entities ─────────────────
export async function GET(request: Request) {
  const auth = await requireApiKeyHash(request)
  if ('response' in auth) return auth.response

  const { data, error } = await supabaseAdmin
    .from('watchlists')
    .select('id, api_key_hash, entity_type, entity_id, entity_label, added_at, last_signal')
    .eq('api_key_hash', auth.keyHash)
    .order('added_at', { ascending: false })

  if (error) {
    console.error('[/api/watchlist GET]', error.message)
    return NextResponse.json({ error: 'Failed to load watchlist.' }, { status: 500 })
  }

  const items = (data as WatchlistRow[] | null ?? []).map(toItem)
  return NextResponse.json({ items, count: items.length })
}

// ── POST /api/watchlist — add an entity to the caller's watchlist ───────────
export async function POST(request: Request) {
  const auth = await requireApiKeyHash(request)
  if ('response' in auth) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 })
  }

  const parsed = parseWatchPayload(body)
  if (parsed.ok === false) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { entity_type, entity_id, entity_label } = parsed.payload

  const { data, error } = await supabaseAdmin
    .from('watchlists')
    .upsert(
      {
        api_key_hash: auth.keyHash,
        entity_type,
        entity_id,
        entity_label,
      },
      { onConflict: 'api_key_hash,entity_type,entity_id' },
    )
    .select('id, api_key_hash, entity_type, entity_id, entity_label, added_at, last_signal')
    .single()

  if (error || !data) {
    console.error('[/api/watchlist POST]', error?.message)
    return NextResponse.json({ error: 'Failed to save watchlist entry.' }, { status: 500 })
  }

  return NextResponse.json({ item: toItem(data as WatchlistRow) }, { status: 201 })
}
