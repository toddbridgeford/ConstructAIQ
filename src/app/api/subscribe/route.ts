import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, source = 'homepage', plan = 'waitlist' } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Use supabase admin to bypass RLS
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
      // Don't expose DB errors to client
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully',
    })
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
