import webpush from 'web-push'
import { supabaseAdmin } from './supabase'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:hello@constructaiq.trade',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? '',
)

export interface PushPayload {
  title:  string
  body:   string
  icon?:  string
  badge?: string
  url?:   string
  tag?:   string   // deduplication key — same tag replaces prior notification
  type:   'warn' | 'federal' | 'satellite' | 'forecast'
}

export async function sendPushNotification(payload: PushPayload): Promise<{
  sent: number; failed: number; deactivated: number
}> {
  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY

  if (!vapidPublic || !vapidPrivate) {
    console.warn('[push] VAPID keys not configured — skipping')
    return { sent: 0, failed: 0, deactivated: 0 }
  }

  // Fetch active subscriptions that want this alert type
  const column = `alert_${payload.type}` as const
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('is_active', true)
    .eq(column, true)

  if (!subs?.length) return { sent: 0, failed: 0, deactivated: 0 }

  const notificationPayload = JSON.stringify({
    title:  payload.title,
    body:   payload.body,
    icon:   payload.icon  ?? '/icons/icon-192.png',
    badge:  payload.badge ?? '/icons/icon-192.png',
    url:    payload.url   ?? '/dashboard',
    tag:    payload.tag   ?? payload.type,
  })

  let sent = 0, failed = 0, deactivated = 0
  const toDeactivate: number[] = []

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notificationPayload,
          { TTL: 86400 }, // 24-hour TTL
        )
        sent++

        try {
          await supabaseAdmin.from('push_notifications_log').insert({
            subscription_id:   sub.id,
            notification_type: payload.type,
            title:             payload.title,
            body:              payload.body,
            delivered:         true,
          })
        } catch { /* non-fatal log failure */ }

        await supabaseAdmin
          .from('push_subscriptions')
          .update({ last_notified: new Date().toISOString() })
          .eq('id', sub.id)

      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          // Subscription expired — deactivate it
          toDeactivate.push(sub.id)
          deactivated++
        } else {
          failed++
          try {
            await supabaseAdmin.from('push_notifications_log').insert({
              subscription_id:   sub.id,
              notification_type: payload.type,
              title:             payload.title,
              body:              payload.body,
              delivered:         false,
              error_message:     String(err).slice(0, 200),
            })
          } catch { /* non-fatal log failure */ }
        }
      }
    })
  )

  if (toDeactivate.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .update({ is_active: false })
      .in('id', toDeactivate)
  }

  return { sent, failed, deactivated }
}
