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
        {activeTab === 'API Reference' && <ApiReferenceTab />}
        {activeTab === 'My Keys'       && <MyKeysTab />}
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

// ── API Reference tab ─────────────────────────────────────────────────────

type EndpointParam = { name: string; type: string; req: boolean; desc: string }
type Endpoint = {
  method: string
  path: string
  desc: string
  params: EndpointParam[]
  example: string
}

function ApiReferenceTab() {
  const [openEndpoint, setOpenEndpoint] = useState<string | null>(null)
  const [tryResults,   setTryResults]   = useState<Record<string, string>>({})
  const [loading,      setLoading]      = useState<Record<string, boolean>>({})

  const ENDPOINTS: Endpoint[] = [
    {
      method: 'GET', path: '/api/forecast',
      desc: 'AI ensemble forecast for a construction series.',
      params: [{ name: 'series', type: 'string', req: true, desc: 'e.g. TTLCONS' }],
      example: '{"forecast":[2190,2185,...],"metrics":{"accuracy":87.3}}',
    },
    {
      method: 'GET', path: '/api/signals',
      desc: 'Anomaly signals and market alerts.',
      params: [],
      example: '{"signals":[{"type":"BULLISH","title":"...","confidence":92}]}',
    },
    {
      method: 'GET', path: '/api/federal',
      desc: 'Federal construction awards by state (USASpending.gov).',
      params: [],
      example: '{"stateAllocations":[{"state":"TX","obligated":8400}]}',
    },
    {
      method: 'GET', path: '/api/permits',
      desc: 'City building permit activity across 40 US cities.',
      params: [
        { name: 'city',   type: 'string', req: false, desc: 'City code e.g. PHX' },
        { name: 'months', type: 'number', req: false, desc: 'History depth (default 12)' },
      ],
      example: '{"cities":[{"city_code":"PHX","latest_month_count":412}]}',
    },
    {
      method: 'GET', path: '/api/satellite',
      desc: 'Sentinel-2 BSI ground disturbance for 20 US MSAs.',
      params: [],
      example: '{"msas":[{"msa_code":"PHX","bsi_change_90d":41.2}]}',
    },
    {
      method: 'GET', path: '/api/warn',
      desc: 'DOL WARN Act construction layoff notices.',
      params: [],
      example: '{"notices":[{"company":"...","state":"TX","employees":523}]}',
    },
    {
      method: 'GET', path: '/api/verdict',
      desc: 'Overall market verdict: EXPAND, HOLD, or CONTRACT.',
      params: [],
      example: '{"overall":"HOLD","confidence":"HIGH","headline":"..."}',
    },
    {
      method: 'GET', path: '/api/benchmark',
      desc: 'Historical percentile ranking for a series value.',
      params: [
        { name: 'series', type: 'string', req: true, desc: 'Series ID e.g. TTLCONS' },
        { name: 'value',  type: 'number', req: true, desc: 'Current value to rank' },
      ],
      example: '{"percentile":62,"classification":"AVERAGE"}',
    },
    {
      method: 'GET', path: '/api/leading-indicators',
      desc: 'Leading Indicator Composite Score (LICS) — 6-month forward signal.',
      params: [],
      example: '{"lics":67.4,"interpretation":"POSITIVE"}',
    },
    {
      method: 'GET', path: '/api/recession-probability',
      desc: 'Construction-specific recession probability model.',
      params: [],
      example: '{"probability_pct":27,"classification":"LOW"}',
    },
    {
      method: 'POST', path: '/api/nlq',
      desc: 'Natural language query over all construction data sources.',
      params: [{ name: 'question', type: 'string', req: true, desc: 'Plain English question' }],
      example: '{"answer":"Construction spending is...","sources_queried":[...]}',
    },
  ]

  async function tryEndpoint(ep: Endpoint) {
    const key = ep.path
    setLoading(prev => ({ ...prev, [key]: true }))
    try {
      let url = ep.path
      if (url === '/api/forecast')  url += '?series=TTLCONS'
      if (url === '/api/benchmark') url += '?series=TTLCONS&value=2190'

      let result: string
      if (ep.method === 'POST') {
        const r = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ question: 'What is the current state of US construction?' }),
        })
        result = JSON.stringify(await r.json(), null, 2)
      } else {
        const r = await fetch(url)
        result = JSON.stringify(await r.json(), null, 2)
      }
      if (result.length > 800) result = result.slice(0, 800) + '\n...(truncated)'
      setTryResults(prev => ({ ...prev, [key]: result }))
    } catch (err) {
      setTryResults(prev => ({ ...prev, [key]: `Error: ${err}` }))
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const methodColor = (m: string) => m === 'GET' ? color.green : color.blue

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {ENDPOINTS.map(ep => {
        const key    = ep.path
        const isOpen = openEndpoint === key
        const result = tryResults[key]
        return (
          <div key={key} style={{
            borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${color.bd1}`,
          }}>
            {/* Header row — always visible */}
            <button
              onClick={() => setOpenEndpoint(isOpen ? null : key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 14, padding: '14px 20px',
                background: isOpen ? color.bg2 : color.bg1,
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
              <span style={{
                fontFamily: font.mono, fontSize: 11, fontWeight: 700,
                color: methodColor(ep.method), minWidth: 36,
              }}>
                {ep.method}
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 13, color: color.t1 }}>
                {ep.path}
              </span>
              <span style={{ fontFamily: font.sys, fontSize: 13, color: color.t3, flex: 1 }}>
                {ep.desc}
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 10, color: color.t4 }}>
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div style={{ padding: '20px 24px', background: color.bg1,
                borderTop: `1px solid ${color.bd1}` }}>

                {/* Params table */}
                {ep.params.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: font.mono, fontSize: 10,
                      color: color.t4, letterSpacing: '0.08em', marginBottom: 8 }}>
                      PARAMETERS
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse',
                      fontFamily: font.sys, fontSize: 13 }}>
                      <thead>
                        <tr>
                          {['Name', 'Type', 'Required', 'Description'].map(h => (
                            <th key={h} style={{ textAlign: 'left',
                              padding: '6px 12px', color: color.t4,
                              fontWeight: 500, fontSize: 11,
                              borderBottom: `1px solid ${color.bd1}` }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ep.params.map(p => (
                          <tr key={p.name}>
                            <td style={{ padding: '8px 12px',
                              fontFamily: font.mono, fontSize: 12,
                              color: color.amber }}>
                              {p.name}
                            </td>
                            <td style={{ padding: '8px 12px', color: color.t3 }}>
                              {p.type}
                            </td>
                            <td style={{ padding: '8px 12px',
                              color: p.req ? color.red : color.t4 }}>
                              {p.req ? 'required' : 'optional'}
                            </td>
                            <td style={{ padding: '8px 12px', color: color.t2 }}>
                              {p.desc}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Try it button */}
                <button
                  onClick={() => tryEndpoint(ep)}
                  disabled={loading[key]}
                  style={{
                    background: color.blue, color: '#fff',
                    border: 'none', borderRadius: 8,
                    padding: '8px 20px', fontFamily: font.sys,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    opacity: loading[key] ? 0.6 : 1,
                    marginBottom: result ? 12 : 0,
                  }}>
                  {loading[key] ? 'Fetching...' : 'Try it →'}
                </button>

                {/* Live result */}
                {result && (
                  <pre style={{
                    background: color.bg0, borderRadius: 8,
                    border: `1px solid ${color.bd1}`,
                    padding: '14px 16px', margin: 0,
                    fontFamily: font.mono, fontSize: 11,
                    color: color.t2, lineHeight: 1.7,
                    overflowX: 'auto', maxHeight: 320,
                    overflowY: 'auto',
                  }}>
                    {result}
                  </pre>
                )}

                {/* Example (shown when no live result yet) */}
                {!result && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ fontFamily: font.sys,
                      fontSize: 12, color: color.t4, cursor: 'pointer' }}>
                      Example response
                    </summary>
                    <pre style={{
                      background: color.bg0, borderRadius: 8,
                      border: `1px solid ${color.bd1}`,
                      padding: '10px 14px', marginTop: 8,
                      fontFamily: font.mono, fontSize: 11,
                      color: color.t3, lineHeight: 1.6,
                    }}>
                      {ep.example}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── My Keys tab ───────────────────────────────────────────────────────────

const KEY_USE_CASES = [
  'Research', 'Construction lending', 'General contracting',
  'Investment analysis', 'Software development', 'Other',
]

function MyKeysTab() {
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4,
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        Self-Serve Registration
      </div>
      <h2 style={{ fontFamily: font.sys, fontSize: 24, fontWeight: 700,
        color: color.t1, letterSpacing: '-0.02em', marginBottom: 28 }}>
        Get your free API key
      </h2>
      <KeyRegistrationForm />
    </div>
  )
}

function KeyRegistrationForm() {
  const [email,  setEmail]  = useState('')
  const [use,    setUse]    = useState(KEY_USE_CASES[0])
  const [busy,   setBusy]   = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [err,    setErr]    = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || busy) return
    setBusy(true)
    setErr(null)
    try {
      const res  = await fetch('/api/keys/issue', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), plan: 'free', name: use }),
      })
      const data = await res.json() as { key?: string; error?: string }
      if (!res.ok) {
        setErr(data.error ?? 'Key generation failed. Please try again.')
      } else {
        setApiKey(data.key ?? null)
      }
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function copyKey() {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (apiKey) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%',
            background: color.green, display: 'inline-block' }} />
          <span style={{ fontFamily: font.mono, fontSize: 12,
            color: color.green, fontWeight: 600 }}>
            Your API key is ready
          </span>
        </div>

        <div style={{ background: color.bg2, border: `1px solid ${color.green}44`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <code style={{ fontFamily: font.mono, fontSize: 13, color: color.green,
            flex: '1 1 200px', wordBreak: 'break-all' }}>
            {apiKey}
          </code>
          <button
            onClick={copyKey}
            style={{
              flexShrink: 0,
              background: copied ? color.green + '22' : 'transparent',
              border: `1px solid ${copied ? color.green : color.bd2}`,
              color: copied ? color.green : color.t3,
              borderRadius: 8, padding: '8px 16px',
              fontFamily: font.mono, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', minHeight: 44, letterSpacing: '0.04em',
              transition: 'all 0.15s',
            }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div style={{ background: color.amber + '14', border: `1px solid ${color.amber}44`,
          borderRadius: 10, padding: '12px 16px',
          fontFamily: font.sys, fontSize: 13, color: color.amber, lineHeight: 1.6 }}>
          Store this key securely. It is shown once and never stored in plaintext.
        </div>

        <div style={{ marginTop: 20, fontFamily: font.sys, fontSize: 13, color: color.t4 }}>
          Pass your key as an{' '}
          <code style={{ fontFamily: font.mono, fontSize: 12, color: color.t3 }}>X-Api-Key</code>
          {' '}header on every request.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontFamily: font.mono, fontSize: 10, color: color.t4,
            letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            EMAIL ADDRESS
          </label>
          <input
            type="email" required placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', background: color.bg2, border: `1px solid ${color.bd2}`,
              borderRadius: 10, padding: '12px 14px',
              fontFamily: font.sys, fontSize: 14, color: color.t1,
              outline: 'none', minHeight: 44,
            }}
          />
        </div>

        <div>
          <label style={{ fontFamily: font.mono, fontSize: 10, color: color.t4,
            letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            INTENDED USE
          </label>
          <select
            value={use} onChange={e => setUse(e.target.value)}
            style={{
              width: '100%', background: color.bg2, border: `1px solid ${color.bd2}`,
              borderRadius: 10, padding: '12px 14px',
              fontFamily: font.sys, fontSize: 14, color: color.t2,
              outline: 'none', cursor: 'pointer', minHeight: 44,
            }}>
            {KEY_USE_CASES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        {err && (
          <div style={{ background: color.red + '18', border: `1px solid ${color.red}44`,
            borderRadius: 10, padding: '10px 14px',
            fontFamily: font.sys, fontSize: 13, color: color.red }}>
            {err}
          </div>
        )}

        <button
          type="submit" disabled={busy}
          style={{
            background: busy ? color.blueDim : color.blue,
            color: busy ? color.t4 : color.bg0,
            border: 'none', borderRadius: 12, padding: '14px 24px',
            fontFamily: font.mono, fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em', cursor: busy ? 'default' : 'pointer',
            minHeight: 44, opacity: busy ? 0.7 : 1, transition: 'all 0.15s',
          }}>
          {busy ? 'Generating…' : 'Get My Free API Key →'}
        </button>

        <p style={{ fontFamily: font.sys, fontSize: 12, color: color.t4,
          margin: 0, lineHeight: 1.6 }}>
          Free forever. No credit card. Keys are issued instantly.
          By requesting a key you agree to the{' '}
          <Link href="/about" style={{ color: color.t3 }}>terms of use</Link>.
        </p>
      </div>
    </form>
  )
}
