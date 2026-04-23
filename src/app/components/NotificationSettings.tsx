"use client"
import { useState, useEffect } from 'react'
import { color, font, radius } from '@/lib/theme'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer  = new ArrayBuffer(rawData.length)
  const view    = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i)
  return view
}

interface Props {
  onClose: () => void
}

export function NotificationSettings({ onClose }: Props) {
  const [supported,  setSupported]  = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [prefs, setPrefs] = useState({
    warn: true, federal: true, satellite: true, forecast: false,
  })

  useEffect(() => {
    const ok = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(ok)
    if (ok) setPermission(Notification.permission)

    navigator.serviceWorker?.ready
      .then(reg => reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub)))
      .catch(() => {})
  }, [])

  async function subscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC)
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })

      const subJson = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys, preferences: prefs }),
      })

      setSubscribed(true)
      setPermission('granted')
    } catch (err) {
      console.error('[push subscribe]', err)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      console.error('[push unsubscribe]', err)
    } finally {
      setLoading(false)
    }
  }

  const SYS = font.sys

  const ALERT_TYPES = [
    { key: 'warn',      label: 'WARN Act Filings',  desc: 'Mass layoff notices in construction'     },
    { key: 'federal',   label: 'Federal Awards',     desc: 'Major USASpending contract awards'       },
    { key: 'satellite', label: 'Satellite Surges',   desc: 'BSI activity spikes in your markets'    },
    { key: 'forecast',  label: 'Forecast Changes',   desc: 'Significant model revisions'             },
  ] as const

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:   color.bg1,
          border:       `1px solid ${color.bd1}`,
          borderRadius: `${radius.xl2}px ${radius.xl2}px 0 0`,
          padding:      'calc(24px) 24px calc(24px + env(safe-area-inset-bottom, 0px))',
          width:        '100%',
          maxWidth:     480,
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, background: color.bd2,
          borderRadius: 2, margin: '0 auto 20px',
        }} />

        <div style={{ fontFamily: SYS, fontSize: 17, fontWeight: 700, color: color.t1, marginBottom: 6 }}>
          Signal Alerts
        </div>
        <div style={{ fontFamily: SYS, fontSize: 14, color: color.t3, marginBottom: 24, lineHeight: 1.6 }}>
          Get notified when major construction signals fire —
          WARN Act filings, satellite surges, federal awards.
        </div>

        {!supported && (
          <div style={{
            fontFamily: SYS, fontSize: 14, color: color.amber,
            padding: '12px 16px', background: color.amberDim,
            borderRadius: radius.md, marginBottom: 20,
          }}>
            Push notifications require a modern browser.
            Install the app from your home screen for the best experience.
          </div>
        )}

        {supported && !subscribed && (
          <>
            {ALERT_TYPES.map(({ key, label, desc }) => (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontFamily: SYS, fontSize: 15, color: color.t1, fontWeight: 500 }}>{label}</div>
                  <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3 }}>{desc}</div>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                  aria-label={`Toggle ${label}`}
                  style={{
                    width: 44, height: 26, borderRadius: 13,
                    background: prefs[key] ? color.blue : color.bd2,
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3,
                    left: prefs[key] ? 21 : 3,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            ))}

            <button
              onClick={subscribe}
              disabled={loading || !VAPID_PUBLIC}
              style={{
                width: '100%', height: 50, borderRadius: radius.md,
                background: color.blue, color: '#fff', border: 'none',
                fontFamily: SYS, fontSize: 16, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1, marginTop: 8,
              }}
            >
              {loading ? 'Enabling…' : 'Enable Notifications'}
            </button>
          </>
        )}

        {supported && subscribed && (
          <div>
            <div style={{
              fontFamily: SYS, fontSize: 15, color: color.green,
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>✓</span> Notifications enabled
            </div>
            <button
              onClick={unsubscribe}
              disabled={loading}
              style={{
                width: '100%', height: 44, borderRadius: radius.md,
                background: 'transparent', color: color.red,
                border: `1px solid ${color.red}44`,
                fontFamily: SYS, fontSize: 14, cursor: 'pointer',
              }}
            >
              {loading ? 'Disabling…' : 'Disable Notifications'}
            </button>
          </div>
        )}

        {/* Blocked state */}
        {supported && permission === 'denied' && (
          <div style={{
            fontFamily: SYS, fontSize: 14, color: color.t3,
            padding: '12px 16px', background: color.bg2,
            borderRadius: radius.md, marginTop: 8,
          }}>
            Notifications are blocked. Enable them in your browser settings to receive alerts.
          </div>
        )}
      </div>
    </div>
  )
}
