import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Rate-limit by IP: 5 subscribe attempts per hour via Upstash Redis
  // Falls back to allowing the request when Redis is not configured
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous'
  const rl = await checkRateLimit(`subscribe:${ip}`, 5, 5)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { email, source = 'homepage', plan = 'waitlist' } = await request.json()

    if (!email || !email.includes('@') || email.length > 320) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('subscribers')
      .upsert(
        {
          email:      email.toLowerCase().trim(),
          source,
          plan,
          created_at: new Date().toISOString(),
          active:     true,
        },
        { onConflict: 'email' }
      )

    if (error) {
      console.error('[/api/subscribe]', error)
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully' })
  } catch (err) {
    console.error('[/api/subscribe]', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// Allow preflight
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
