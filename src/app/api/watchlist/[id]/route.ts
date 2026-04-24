import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireApiKeyHash } from '@/lib/watchlist'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── DELETE /api/watchlist/:id — remove an entity from the caller's watchlist ─
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKeyHash(request)
  if ('response' in auth) return auth.response

  const { id: idRaw } = await context.params
  const id = Number.parseInt(idRaw, 10)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid watchlist id.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('watchlists')
    .delete()
    .eq('id', id)
    .eq('api_key_hash', auth.keyHash)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[/api/watchlist DELETE]', error.message)
    return NextResponse.json({ error: 'Failed to remove entry.' }, { status: 500 })
  }

  if (!data) {
    // Either the id doesn't exist or belongs to a different key — same 404.
    return NextResponse.json({ error: 'Watchlist entry not found.' }, { status: 404 })
  }

  return NextResponse.json({ deleted: id })
}
