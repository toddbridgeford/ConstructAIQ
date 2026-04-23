import { NextResponse }         from 'next/server'
import { sendPushNotification } from '@/lib/push'
import { supabaseAdmin }        from '@/lib/supabase'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

function cronSecret() { return process.env.CRON_SECRET || '' }

type WarnNotice = { company: string; state: string; employees: number; notice_date: string }
type MsaRow     = { msa_name: string; msa_code: string; bsi_change_90d: number; confidence: string; observation_date: string; classification?: string }
type StateAlloc = { state: string; allocated: number }

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (cronSecret() && auth !== `Bearer ${cronSecret()}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://constructaiq.trade'
  const results: Record<string, number> = {}

  // ── WARN Act ────────────────────────────────────────────────────────────────
  try {
    const r    = await fetch(`${baseUrl}/api/warn`, { signal: AbortSignal.timeout(10_000) })
    const data = await r.json() as { notices?: WarnNotice[] }
    const recent = (data.notices ?? []).filter(n => {
      const hoursAgo = (Date.now() - new Date(n.notice_date).getTime()) / 3_600_000
      return hoursAgo < 2 && n.employees >= 500
    })

    for (const notice of recent.slice(0, 3)) {
      const { data: existing } = await supabaseAdmin
        .from('push_notifications_log')
        .select('id')
        .eq('notification_type', 'warn')
        .like('body', `%${notice.company}%`)
        .gte('sent_at', new Date(Date.now() - 4 * 3_600_000).toISOString())
        .limit(1)

      if (!existing?.length) {
        const res = await sendPushNotification({
          type:  'warn',
          title: 'WARN Act Filing',
          body:  `${notice.company} (${notice.state}): ${notice.employees.toLocaleString()} construction workers notified of layoffs`,
          url:   '/dashboard#signals',
          tag:   `warn-${notice.company}`,
        })
        results.warn = (results.warn ?? 0) + res.sent
      }
    }
  } catch (err) {
    console.error('[push-alerts] warn check failed:', err)
  }

  // ── Satellite surges ─────────────────────────────────────────────────────────
  try {
    const r    = await fetch(`${baseUrl}/api/satellite`, { signal: AbortSignal.timeout(10_000) })
    const data = await r.json() as { msas?: MsaRow[] }
    const surges = (data.msas ?? [])
      .filter(m =>
        m.bsi_change_90d > 35 &&
        m.confidence !== 'LOW' &&
        new Date(m.observation_date) > new Date(Date.now() - 24 * 3_600_000)
      )
      .slice(0, 2)

    for (const msa of surges) {
      const { data: existing } = await supabaseAdmin
        .from('push_notifications_log')
        .select('id')
        .eq('notification_type', 'satellite')
        .like('body', `%${msa.msa_name}%`)
        .gte('sent_at', new Date(Date.now() - 7 * 24 * 3_600_000).toISOString())
        .limit(1)

      if (!existing?.length) {
        const res = await sendPushNotification({
          type:  'satellite',
          title: 'Satellite Construction Surge',
          body:  `${msa.msa_name}: +${Math.round(msa.bsi_change_90d)}% ground disturbance detected — ${(msa.classification ?? '').replace('_', ' ')}`,
          url:   '/ground-signal',
          tag:   `sat-${msa.msa_code}`,
        })
        results.satellite = (results.satellite ?? 0) + res.sent
      }
    }
  } catch (err) {
    console.error('[push-alerts] satellite check failed:', err)
  }

  // ── Federal awards ───────────────────────────────────────────────────────────
  try {
    const r    = await fetch(`${baseUrl}/api/federal`, { signal: AbortSignal.timeout(10_000) })
    const data = await r.json() as { stateAllocations?: StateAlloc[] }
    const bigAwards = (data.stateAllocations ?? [])
      .filter(s => s.allocated > 500)
      .slice(0, 1)

    for (const award of bigAwards) {
      const { data: existing } = await supabaseAdmin
        .from('push_notifications_log')
        .select('id')
        .eq('notification_type', 'federal')
        .like('body', `%${award.state}%`)
        .gte('sent_at', new Date(Date.now() - 24 * 3_600_000).toISOString())
        .limit(1)

      if (!existing?.length) {
        const res = await sendPushNotification({
          type:  'federal',
          title: 'Federal Construction Award',
          body:  `${award.state}: $${award.allocated}M in new federal construction awards`,
          url:   '/federal',
          tag:   `federal-${award.state}`,
        })
        results.federal = (results.federal ?? 0) + res.sent
      }
    }
  } catch (err) {
    console.error('[push-alerts] federal check failed:', err)
  }

  return NextResponse.json({ ok: true, results })
}
