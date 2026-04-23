"use client"
import { useState, useEffect } from "react"
import { Nav } from "@/app/components/Nav"
import { color, font, radius } from "@/lib/theme"
import { Copy, Check, Download, Clock } from "lucide-react"

const SYS  = font.sys
const MONO = font.mono

// ── Types ──────────────────────────────────────────────────────────────────

interface BriefData {
  brief:       string
  generatedAt: string
  source:      string
  error?:      string
}

interface MetricRow {
  label:   string
  raw:     string
  mom:     number | null
  yoy:     number | null
  momUnit: 'pct' | 'pp'
  source:  string
  loading: boolean
}

interface CalendarEvent {
  id:          string
  date:        string
  name:        string
  source:      string
  importance:  string
  description: string
  impact:      string[]
}

// ── Seed metrics (always-available fallback) ───────────────────────────────

const SEED: Omit<MetricRow, 'loading'>[] = [
  { label: 'Construction Spending',   raw: '$2,190B',     mom:  0.3, yoy: -1.4, momUnit: 'pct', source: 'Census C30'  },
  { label: 'Construction Employment', raw: '8,330K',      mom:  0.4, yoy:  1.2, momUnit: 'pct', source: 'BLS CES'     },
  { label: 'Building Permits',        raw: '1,386K ann.', mom: -2.1, yoy: -3.2, momUnit: 'pct', source: 'Census'      },
  { label: 'Housing Starts',          raw: '1,394K ann.', mom:  1.2, yoy: -2.8, momUnit: 'pct', source: 'Census'      },
  { label: '30yr Mortgage Rate',      raw: '6.82%',       mom:  0.12,yoy:  0.42,momUnit: 'pp',  source: 'Freddie Mac' },
  { label: 'Lumber PPI',              raw: 'Index 312',   mom:  1.1, yoy: -4.2, momUnit: 'pct', source: 'BLS PPI'     },
]

// ── Format helpers ─────────────────────────────────────────────────────────

type Obs = { date: string; value: number }

function obsMetric(
  obs: Obs[],
  fmt: (v: number) => string,
  absolute = false,
): { raw: string; mom: number | null; yoy: number | null } | null {
  if (!obs || obs.length < 2) return null
  const v0 = obs[0].value, v1 = obs[1].value
  const v12 = obs.length >= 13 ? obs[12].value : null
  const mom = absolute
    ? +(v0 - v1).toFixed(4)
    : v1 > 0 ? ((v0 - v1) / v1) * 100 : null
  const yoy = v12 != null
    ? absolute ? +(v0 - v12).toFixed(4) : v12 > 0 ? ((v0 - v12) / v12) * 100 : null
    : null
  return { raw: fmt(v0), mom, yoy }
}

function fmtChange(val: number | null, unit: 'pct' | 'pp'): string {
  if (val == null) return '—'
  const abs = Math.abs(val)
  const sign = val >= 0 ? '+' : '-'
  return unit === 'pp'
    ? `${sign}${abs.toFixed(2)}pp`
    : `${sign}${abs.toFixed(1)}%`
}

function changeColor(val: number | null): string {
  if (val == null) return color.t4
  return val > 0 ? color.green : val < 0 ? color.red : color.t3
}

function impColor(imp: string): string {
  return imp === 'high' ? color.red : imp === 'medium' ? color.amber : color.t4
}

function relDate(iso: string): string {
  const now = new Date(), d = new Date(iso)
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff > 0 && diff <= 7) return `In ${diff} days`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skel({ w = 80, h = 16 }: { w?: number; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 4, display: 'inline-block',
      background: `linear-gradient(90deg,${color.bg2} 25%,${color.bg3} 50%,${color.bg2} 75%)`,
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
    }} />
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const [brief,    setBrief]    = useState<BriefData | null>(null)
  const [briefLoading, setBriefLoading] = useState(true)
  const [metrics,  setMetrics]  = useState<MetricRow[]>(SEED.map(s => ({ ...s, loading: true })))
  const [calendar, setCalendar] = useState<CalendarEvent[]>([])
  const [calLoading, setCalLoading] = useState(true)
  const [copied,   setCopied]   = useState(false)

  useEffect(() => {
    async function safe<T>(url: string): Promise<T | null> {
      try { const r = await fetch(url); return r.ok ? (r.json() as Promise<T>) : null }
      catch { return null }
    }

    safe<BriefData>('/api/weekly-brief').then(d => {
      setBrief(d && !d.error ? d : null)
      setBriefLoading(false)
    })

    safe<CalendarEvent[]>('/api/calendar').then(d => {
      if (Array.isArray(d)) setCalendar(d)
      setCalLoading(false)
    })

    Promise.all([
      safe<{ obs: Obs[] }>('/api/obs?series=TTLCONS&n=14'),
      safe<{ obs: Obs[] }>('/api/obs?series=CES2000000001&n=14'),
      safe<{ obs: Obs[] }>('/api/obs?series=PERMIT&n=14'),
      safe<{ obs: Obs[] }>('/api/obs?series=HOUST&n=14'),
      safe<{ obs: Obs[] }>('/api/obs?series=MORTGAGE30US&n=14'),
      safe<{ commodities: { name: string; value: number; mom: number; yoy: number }[] }>('/api/pricewatch'),
    ]).then(([ttl, ces, pmt, hst, mtg, pw]) => {
      setMetrics(prev => prev.map((m, i) => {
        const done = { loading: false }
        if (i === 0 && ttl?.obs?.length) {
          const r = obsMetric(ttl.obs, v => `$${Math.round(v / 1000).toLocaleString()}B`)
          return r ? { ...m, ...done, ...r } : { ...m, ...done }
        }
        if (i === 1 && ces?.obs?.length) {
          const r = obsMetric(ces.obs, v => `${Math.round(v).toLocaleString()}K`)
          return r ? { ...m, ...done, ...r } : { ...m, ...done }
        }
        if (i === 2 && pmt?.obs?.length) {
          const r = obsMetric(pmt.obs, v => `${Math.round(v).toLocaleString()}K ann.`)
          return r ? { ...m, ...done, ...r } : { ...m, ...done }
        }
        if (i === 3 && hst?.obs?.length) {
          const r = obsMetric(hst.obs, v => `${Math.round(v).toLocaleString()}K ann.`)
          return r ? { ...m, ...done, ...r } : { ...m, ...done }
        }
        if (i === 4 && mtg?.obs?.length) {
          const r = obsMetric(mtg.obs, v => `${v.toFixed(2)}%`, true)
          return r ? { ...m, ...done, ...r } : { ...m, ...done }
        }
        if (i === 5 && pw?.commodities?.length) {
          const lb = pw.commodities.find(c => c.name.toLowerCase().includes('lumber'))
          if (lb) return { ...m, ...done, raw: `Index ${Math.round(lb.value)}`, mom: lb.mom, yoy: lb.yoy }
        }
        return { ...m, ...done }
      }))
    })
  }, [])

  // ── Clipboard snapshot text ────────────────────────────────────────────────

  function snapshotText(): string {
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const sep  = '─'.repeat(52)
    const rows = metrics.map(m => {
      const mom = m.mom != null ? ` (${fmtChange(m.mom, m.momUnit)} MoM, ${fmtChange(m.yoy, m.momUnit)} YoY)` : ''
      return `${m.label}: ${m.raw}${mom} | ${m.source}`
    })
    return [`ConstructAIQ Market Snapshot — ${date}`, sep, ...rows, sep,
      'Source: constructaiq.trade · Data: Census, BLS, FRED'].join('\n')
  }

  function handleCopy() {
    navigator.clipboard.writeText(snapshotText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleExportCSV() {
    const date   = new Date().toISOString().split('T')[0]
    const header = 'Metric,Current Value,MoM Change,YoY Change,Source,Date'
    const rows   = metrics.map(m =>
      [`"${m.label}"`, `"${m.raw}"`,
       `"${fmtChange(m.mom, m.momUnit)}"`, `"${fmtChange(m.yoy, m.momUnit)}"`,
       `"${m.source}"`, `"${date}"`].join(',')
    )
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `constructaiq-snapshot-${date}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const today       = new Date().toISOString().split('T')[0]
  const upcoming    = calendar
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8)
  const briefDate   = brief?.generatedAt
    ? new Date(brief.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null
  const briefParas  = brief?.brief
    ? brief.brief.split(/\n{2,}/).filter(p => p.trim().length > 0)
    : []

  return (
    <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1, fontFamily: SYS }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
      <Nav />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '52px 28px 80px' }}>

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: '0.1em', marginBottom: 12 }}>
            CONSTRUCTAIQ · RESEARCH & INTELLIGENCE
          </div>
          <div style={{
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <h1 style={{
                fontFamily: SYS, fontSize: 36, fontWeight: 700, color: color.t1,
                letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0,
              }}>
                Construction Market Intelligence
              </h1>
              <p style={{
                fontFamily: SYS, fontSize: 15, color: color.t3, lineHeight: 1.6,
                marginTop: 10, maxWidth: 560,
              }}>
                Live market data, AI-generated weekly brief, and upcoming data release calendar.
                Updated daily from Census, BLS, and FRED.
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: MONO, fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: copied ? color.green : color.t2,
                  background: copied ? color.greenDim : color.bg2,
                  border: `1px solid ${copied ? color.green + '44' : color.bd2}`,
                  borderRadius: radius.sm, padding: '8px 14px', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'COPIED' : 'COPY SNAPSHOT'}
              </button>
              <button
                onClick={handleExportCSV}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: MONO, fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.06em', color: color.t2,
                  background: color.bg2, border: `1px solid ${color.bd2}`,
                  borderRadius: radius.sm, padding: '8px 14px', cursor: 'pointer',
                }}
              >
                <Download size={13} />
                EXPORT CSV
              </button>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: Weekly Brief ───────────────────────────────────── */}
        {(briefLoading || brief) && (
          <div style={{
            background:   color.bg1,
            border:       `1px solid ${color.bd1}`,
            borderLeft:   `4px solid ${color.amber}`,
            borderRadius: 12,
            padding:      '28px 32px',
            marginBottom: 32,
          }}>
            {briefLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skel w={180} h={14} />
                <Skel w={320} h={20} />
                <Skel w={620} h={14} />
                <Skel w={580} h={14} />
                <Skel w={540} h={14} />
              </div>
            ) : brief && (
              <>
                {/* Brief header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                    color: color.amber, background: color.amberDim,
                    border: `1px solid ${color.amber}33`, borderRadius: 4, padding: '3px 8px',
                  }}>
                    WEEKLY BRIEF
                  </span>
                  {briefDate && (
                    <span style={{ fontFamily: MONO, fontSize: 11, color: color.t4 }}>
                      {briefDate}
                    </span>
                  )}
                  <span style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
                    color: color.blue, background: color.blueDim,
                    border: `1px solid ${color.blue}33`, borderRadius: 4, padding: '3px 8px',
                  }}>
                    AI GENERATED
                  </span>
                </div>

                {/* Brief paragraphs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {briefParas.map((para, i) => (
                    <p key={i} style={{
                      fontFamily: SYS, fontSize: 15, color: color.t2,
                      lineHeight: 1.75, margin: 0,
                    }}>
                      {para.trim()}
                    </p>
                  ))}
                </div>

                {/* Attribution */}
                <div style={{
                  marginTop: 24, paddingTop: 16, borderTop: `1px solid ${color.bd1}`,
                  fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.06em',
                }}>
                  Generated by Claude · Anthropic · {brief.source ?? 'constructaiq.trade'}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SECTION 2: Market Metrics Snapshot ───────────────────────── */}
        <div style={{
          background: color.bg1, border: `1px solid ${color.bd1}`,
          borderRadius: 12, overflow: 'hidden', marginBottom: 32,
        }}>
          {/* Table header */}
          <div style={{
            padding: '16px 24px 14px', borderBottom: `1px solid ${color.bd1}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: color.t4, marginBottom: 4 }}>
                MARKET METRICS SNAPSHOT
              </div>
              <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3 }}>
                Key indicators — updated daily from Census, BLS, and FRED
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.04em' }}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${color.bd1}` }}>
                  {['Metric', 'Current Value', 'MoM', 'YoY', 'Source'].map((h, i) => (
                    <th key={h} style={{
                      padding:       '10px 20px',
                      fontFamily:    MONO,
                      fontSize:      9,
                      fontWeight:    700,
                      letterSpacing: '0.1em',
                      color:         color.t4,
                      textAlign:     i > 0 ? 'right' : 'left',
                      background:    color.bg2,
                      whiteSpace:    'nowrap',
                    }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={m.label} style={{ borderBottom: i < metrics.length - 1 ? `1px solid ${color.bd1}` : 'none' }}>
                    {/* Metric label */}
                    <td style={{ padding: '14px 20px', fontFamily: SYS, fontSize: 14, fontWeight: 500, color: color.t1, whiteSpace: 'nowrap' }}>
                      {m.label}
                    </td>
                    {/* Current value */}
                    <td style={{ padding: '14px 20px', fontFamily: MONO, fontSize: 15, fontWeight: 700, color: color.t1, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {m.loading ? <Skel w={80} h={18} /> : m.raw}
                    </td>
                    {/* MoM */}
                    <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {m.loading ? <Skel w={48} /> : (
                        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: changeColor(m.mom) }}>
                          {fmtChange(m.mom, m.momUnit)}
                        </span>
                      )}
                    </td>
                    {/* YoY */}
                    <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {m.loading ? <Skel w={48} /> : (
                        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: changeColor(m.yoy) }}>
                          {fmtChange(m.yoy, m.momUnit)}
                        </span>
                      )}
                    </td>
                    {/* Source */}
                    <td style={{ padding: '14px 20px', fontFamily: MONO, fontSize: 10, color: color.t4, textAlign: 'right', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                      {m.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div style={{
            padding: '10px 20px', borderTop: `1px solid ${color.bd1}`,
            fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.green,
              boxShadow: `0 0 6px ${color.green}`, display: 'inline-block',
              animation: 'pulse 2s infinite', flexShrink: 0 }} />
            LIVE · Updated daily · Source: U.S. Census Bureau, Bureau of Labor Statistics, FRED
          </div>
        </div>

        {/* ── SECTION 3: Data Release Calendar ─────────────────────────── */}
        <div style={{
          background: color.bg1, border: `1px solid ${color.bd1}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 24px 14px', borderBottom: `1px solid ${color.bd1}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Clock size={14} color={color.t4} />
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: color.t4, marginBottom: 3 }}>
                UPCOMING DATA RELEASES
              </div>
              <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3 }}>
                Government construction data releases · next 60 days
              </div>
            </div>
          </div>

          {calLoading ? (
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[0,1,2,3].map(i => <Skel key={i} w={400} h={18} />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div style={{ padding: '32px 24px', fontFamily: SYS, fontSize: 14, color: color.t4, textAlign: 'center' }}>
              No upcoming releases in the next 60 days.
            </div>
          ) : (
            <div>
              {upcoming.map((evt, i) => (
                <div key={evt.id} style={{
                  padding: '16px 24px',
                  borderBottom: i < upcoming.length - 1 ? `1px solid ${color.bd1}` : 'none',
                  display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap',
                }}>
                  {/* Date + importance */}
                  <div style={{ minWidth: 100, flexShrink: 0 }}>
                    <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: color.t1, marginBottom: 3 }}>
                      {relDate(evt.date)}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>
                      {new Date(evt.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{
                      display: 'inline-block', marginTop: 5,
                      fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
                      color: impColor(evt.importance), padding: '2px 6px',
                      border: `1px solid ${impColor(evt.importance)}44`,
                      borderRadius: 3, textTransform: 'uppercase',
                    }}>
                      {evt.importance}
                    </div>
                  </div>

                  {/* Release info */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: color.t1, marginBottom: 4 }}>
                      {evt.name}
                    </div>
                    <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.5, marginBottom: 8 }}>
                      {evt.description}
                    </div>
                    {evt.impact?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {evt.impact.map(tag => (
                          <span key={tag} style={{
                            fontFamily:    MONO, fontSize: 9, fontWeight: 600,
                            letterSpacing: '0.06em', color: color.t4,
                            background:    color.bg2, border: `1px solid ${color.bd1}`,
                            borderRadius:  4, padding: '2px 7px',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Source */}
                  <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, flexShrink: 0, paddingTop: 2 }}>
                    {evt.source}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Source line */}
        <div style={{
          marginTop: 28, fontFamily: MONO, fontSize: 10, color: color.t4,
          letterSpacing: '0.06em', lineHeight: 1.6,
        }}>
          Data sources: U.S. Census Bureau · Bureau of Labor Statistics · Federal Reserve FRED ·
          Freddie Mac PMMS · BLS PPI · constructaiq.trade
        </div>

      </div>
    </div>
  )
}
