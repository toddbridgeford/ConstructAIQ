import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { sendSurveyInvitation } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Vercel cron limit: 60s on hobby, 300s on pro
// For large lists we send in a single pass — enough for early-stage subscriber counts.

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

export async function GET(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const cronSecret = process.env.CRON_SECRET ?? ''

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ── 1. Get the active survey period ─────────────────────────────────────
    const { data: period, error: pErr } = await supabaseAdmin
      .from('survey_periods')
      .select('id, quarter, closes_at')
      .eq('is_active', true)
      .order('opens_at', { ascending: false })
      .limit(1)
      .single()

    if (pErr || !period) {
      return NextResponse.json({ error: 'No active survey period found' }, { status: 404 })
    }

    // ── 2. Get current response count (for email body) ───────────────────────
    const { count: respondentCount } = await supabaseAdmin
      .from('survey_responses')
      .select('id', { count: 'exact', head: true })
      .eq('period_id', period.id)

    // ── 3. Fetch all active subscribers ─────────────────────────────────────
    const { data: subscribers, error: sErr } = await supabaseAdmin
      .from('subscribers')
      .select('email')
      .eq('active', true)

    if (sErr) {
      console.error('[/api/survey/invite] fetch subscribers:', sErr)
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
    }

    const allSubscribers = subscribers ?? []

    if (allSubscribers.length === 0) {
      return NextResponse.json({
        sent: 0,
        already_responded: 0,
        total: 0,
        quarter: period.quarter,
      })
    }

    // ── 4. Fetch all email_hashes that have responded this period ────────────
    const { data: responded, error: rErr } = await supabaseAdmin
      .from('survey_responses')
      .select('email_hash')
      .eq('period_id', period.id)

    if (rErr) {
      console.error('[/api/survey/invite] fetch responses:', rErr)
      return NextResponse.json({ error: 'Failed to check existing responses' }, { status: 500 })
    }

    const respondedHashes = new Set((responded ?? []).map(r => r.email_hash))

    // ── 5. Send invitations ──────────────────────────────────────────────────
    let sent = 0
    let alreadyResponded = 0

    for (const sub of allSubscribers) {
      const hash = hashEmail(sub.email)

      if (respondedHashes.has(hash)) {
        alreadyResponded++
        continue
      }

      const result = await sendSurveyInvitation({
        to: sub.email,
        quarter: period.quarter,
        closes_at: period.closes_at,
        respondent_count: respondentCount ?? 0,
      })

      if (result.ok) {
        sent++
      } else {
        console.warn('[/api/survey/invite] failed to send to:', sub.email)
      }
    }

    console.log(`[/api/survey/invite] ${period.quarter}: sent=${sent}, skipped=${alreadyResponded}, total=${allSubscribers.length}`)

    return NextResponse.json({
      sent,
      already_responded: alreadyResponded,
      total: allSubscribers.length,
      quarter: period.quarter,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('supabaseUrl') || msg.includes('required')) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    console.error('[/api/survey/invite]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
