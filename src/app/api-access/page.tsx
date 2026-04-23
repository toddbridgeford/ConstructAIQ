'use client'
import { useState } from 'react'
import Link from 'next/link'
import { font, color } from '@/lib/theme'

const TABS = ['Overview', 'API Reference', 'My Keys'] as const
type Tab = typeof TABS[number]

export default function ApiAccessPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  return (
    <div style={{ minHeight: '100vh', background: color.bg0,
      color: color.t1, fontFamily: font.sys }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } a { color: inherit; text-decoration: none; } button { font-family: inherit; } input, select { color-scheme: dark; }`}</style>

      {/* Page header */}
      <div style={{ maxWidth: 960, margin: '0 auto',
        padding: '48px 40px 0' }}>
        <div style={{ fontFamily: font.mono, fontSize: 10,
          color: color.amber, letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 12 }}>
          DEVELOPER
        </div>
        <h1 style={{ fontFamily: font.sys, fontSize: 32,
          fontWeight: 700, color: color.t1, margin: 0 }}>
          ConstructAIQ API
        </h1>
        <p style={{ fontFamily: font.sys, fontSize: 16,
          color: color.t3, marginTop: 8, lineHeight: 1.6 }}>
          Free public API. No rate limit on reads.
          Standard key for 1,000 requests/day.
        </p>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginTop: 32,
          borderBottom: `1px solid ${color.bd1}` }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent', border: 'none',
                fontFamily: font.sys, fontSize: 14,
                padding: '10px 20px', cursor: 'pointer',
                color: activeTab === tab ? color.t1 : color.t3,
                borderBottom: activeTab === tab
                  ? `2px solid ${color.amber}` : '2px solid transparent',
                fontWeight: activeTab === tab ? 600 : 400,
                marginBottom: -1,
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 960, margin: '0 auto',
        padding: '40px 40px 80px' }}>
        {activeTab === 'Overview'      && <OverviewTab />}
        {activeTab === 'API Reference' && (
          <p style={{ color: color.t4, fontFamily: font.mono,
            fontSize: 12 }}>
            API Reference — built in VALUE13-B
          </p>
        )}
        {activeTab === 'My Keys' && <MyKeysPlaceholder />}
      </div>
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────

function OverviewTab() {
  const USE_CASES = [
    {
      title: 'Embed in your dashboard',
      desc:  'Pull construction market signals into your internal tools or BI platform.',
      code:  `curl https://constructaiq.trade/api/signals \\
  -H "X-API-Key: YOUR_KEY"`,
    },
    {
      title: 'Power your lending model',
      desc:  'Use forecast and benchmark data to inform construction loan underwriting.',
      code:  `const res = await fetch(
  'https://constructaiq.trade/api/forecast?series=TTLCONS',
  { headers: { 'X-API-Key': 'YOUR_KEY' } }
)
const { forecast, metrics } = await res.json()`,
    },
    {
      title: 'Automate market monitoring',
      desc:  'Subscribe to webhook events when major signals fire.',
      code:  `curl -X POST https://constructaiq.trade/api/webhooks/subscribe \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://your.app/hook",
       "events":["signal.warn_act","verdict.changed"],
       "api_key":"YOUR_KEY"}'`,
    },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns:
        'repeat(auto-fit, minmax(280px, 1fr))', gap: 20,
        marginBottom: 48 }}>
        {USE_CASES.map(uc => (
          <div key={uc.title} style={{
            background: color.bg1, borderRadius: 12,
            border: `1px solid ${color.bd1}`,
            padding: '24px', display: 'flex',
            flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontFamily: font.sys, fontSize: 15,
              fontWeight: 600, color: color.t1 }}>
              {uc.title}
            </div>
            <div style={{ fontFamily: font.sys, fontSize: 13,
              color: color.t3, lineHeight: 1.6, flex: 1 }}>
              {uc.desc}
            </div>
            <pre style={{
              background: color.bg0, borderRadius: 8,
              border: `1px solid ${color.bd1}`,
              padding: '12px 14px', margin: 0,
              fontFamily: font.mono, fontSize: 11,
              color: color.t2, lineHeight: 1.7,
              overflowX: 'auto', whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {uc.code}
            </pre>
          </div>
        ))}
      </div>

      {/* Quick start */}
      <div style={{ background: color.bg1, borderRadius: 12,
        border: `1px solid ${color.bd1}`, padding: '28px 32px' }}>
        <div style={{ fontFamily: font.mono, fontSize: 10,
          color: color.amber, letterSpacing: '0.1em',
          marginBottom: 12 }}>
          QUICK START
        </div>
        <ol style={{ fontFamily: font.sys, fontSize: 14,
          color: color.t2, lineHeight: 2, paddingLeft: 20,
          margin: 0 }}>
          <li>Get an API key from the <strong>My Keys</strong> tab</li>
          <li>Add the header <code style={{ fontFamily: font.mono,
            fontSize: 12, background: color.bg2, padding: '1px 6px',
            borderRadius: 4 }}>X-API-Key: YOUR_KEY</code> to requests</li>
          <li>Browse endpoints in the <strong>API Reference</strong> tab</li>
          <li>Use <strong>Try it</strong> to test any endpoint live</li>
        </ol>
        <div style={{ marginTop: 20 }}>
          <Link href="/methodology" style={{ fontFamily: font.sys,
            fontSize: 13, color: color.amber,
            textDecoration: 'none' }}>
            Read the methodology →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── My Keys placeholder ───────────────────────────────────────────────────

function MyKeysPlaceholder() {
  return (
    <p style={{ color: color.t4, fontFamily: font.mono, fontSize: 12 }}>
      Key management — migrated in VALUE13-B
    </p>
  )
}
