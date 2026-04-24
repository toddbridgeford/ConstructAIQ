import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Allowed widget types — prevents arbitrary data insertion
const VALID_TYPES = new Set([
  'opportunity', 'verdict', 'map', 'materials', 'leaderboard',
  // legacy chart-based embeds
  'forecast', 'federal-pipeline', 'signals',
])

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>

    const widget_type  = typeof body.widget_type  === 'string' ? body.widget_type.slice(0, 64)  : 'unknown'
    const origin_domain = typeof body.origin_domain === 'string' ? body.origin_domain.slice(0, 255) : 'direct'

    if (!VALID_TYPES.has(widget_type)) {
      return NextResponse.json({ ok: false, error: 'invalid widget_type' }, { status: 400 })
    }

    // Upsert into embed_impressions — best-effort, never fail the embed
    const rpcResult = await supabaseAdmin.rpc('upsert_embed_impression', {
      p_widget_type: widget_type,
      p_origin:      origin_domain,
    })
    if (rpcResult.error) {
      // Fallback: direct upsert if the RPC doesn't exist yet
      await supabaseAdmin.from('embed_impressions').upsert(
        { widget_type, origin: origin_domain, day: new Date().toISOString().slice(0, 10), count: 1 },
        { onConflict: 'widget_type,origin,day', ignoreDuplicates: false },
      )
    }
  } catch {
    // Impression tracking must never break the embed — swallow all errors
  }

  return NextResponse.json({ ok: true }, {
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
