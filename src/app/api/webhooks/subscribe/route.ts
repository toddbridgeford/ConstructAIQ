import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_EVENTS = [
  'signal.fired',
  'signal.warn_act',
  'signal.satellite_surge',
  'forecast.updated',
  'verdict.changed',
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, events, api_key } = body

    if (!url || !url.startsWith('https://')) {
      return NextResponse.json(
        { error: 'url must be a valid https:// URL' },
        { status: 400 },
      )
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'events must be a non-empty array' },
        { status: 400 },
      )
    }

    const invalidEvents = events.filter(e => !VALID_EVENTS.includes(e))
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}`,
          valid_events: VALID_EVENTS },
        { status: 400 },
      )
    }

    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json(
        { error: 'api_key is required' },
        { status: 400 },
      )
    }

    const api_key_hash = createHash('sha256')
      .update(api_key)
      .digest('hex')

    // Verify the API key exists
    const { data: keyRow } = await supabaseAdmin
      .from('api_keys')
      .select('id')
      .eq('key_hash', api_key_hash)
      .single()

    if (!keyRow) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 },
      )
    }

    // Upsert webhook subscription (one per URL per key)
    const { data, error } = await supabaseAdmin
      .from('webhook_subscriptions')
      .upsert(
        { api_key_hash, url, events, is_active: true },
        { onConflict: 'api_key_hash,url' },
      )
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      id: data.id,
      url,
      events,
      message: `Webhook registered. You will receive POST requests to ${url} when the subscribed events fire.`,
    })

  } catch (err) {
    console.error('[webhooks/subscribe]', err)
    return NextResponse.json(
      { error: 'Subscription failed' },
      { status: 500 },
    )
  }
}
