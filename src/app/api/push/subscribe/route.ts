import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { endpoint, keys, preferences } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const ua = request.headers.get('user-agent') ?? ''

    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        endpoint,
        p256dh:          keys.p256dh,
        auth:            keys.auth,
        user_agent:      ua.slice(0, 200),
        alert_warn:      preferences?.warn      ?? true,
        alert_federal:   preferences?.federal   ?? true,
        alert_satellite: preferences?.satellite ?? true,
        alert_forecast:  preferences?.forecast  ?? false,
        is_active:       true,
      }, { onConflict: 'endpoint' })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('[push/subscribe]', err)
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }
}
