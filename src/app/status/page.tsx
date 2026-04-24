'use client'
import { useEffect, useState, useRef } from 'react'
import { font, color, space } from '@/lib/theme'

// ── Types ─────────────────────────────────────────────────────────────────

type FreshnessRow = {
  source:       string
  label:        string
  last_updated: string | null
  status:       'ok' | 'warn' | 'stale'
}

type ApiHealth = {
  pricewatch:    boolean
  benchmark:     boolean
  eia:           boolean
  bea:           boolean
  solicitations: boolean
  equities:      boolean
}

type SourceHealthRow = {
  source_id:              string
  source_label:           string
  category:               string
  status:                 string
  rows_written:           number | null
  run_at:                 string
  expected_cadence_hours: number
}

type StatusData = {
  freshness:          FreshnessRow[]
  api_health:         ApiHealth
  opportunity_metros: number
  predictions: {
    made_last_7d:       number
    due_unresolved:     number
    evaluated_last_7d:  number
    correct_last_7d:    number
    par_last_7d:        number | null
  }
  entity_graph: {
    entities: number
    edges:    number
  }
  events_last_30d: number
  source_health:   SourceHealthRow[]
  as_of:           string
}

type PARData = {
  overall_par: number | null
  sample_size: number
  as_of:       string
  note:        string
}

type WeekPoint = {
  week_ending:  string
  par:          number | null
  sample_size:  number
}

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function fmtAge(iso: string | null): string {
  if (!iso) return '—'
  const ageMins = (Date.now() - new Date(iso).getTime()) / 60_000
  if (ageMins < 90)         return `${Math.round(ageMins)}m ago`
  if (ageMins < 1440)       return `${Math.round(ageMins / 60)}h ago`
  return `${Math.round(ageMins / 1440)}d ago`
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Status indicator dot ──────────────────────────────────────────────────

const STATUS_DOT: Record<'ok' | 'warn' | 'stale', { bg: string; label: string }> = {
  ok:    { bg: color.green,  label: 'Current' },
  warn:  { bg: color.amber,  label: 'Aging'   },
  stale: { bg: color.red,    label: 'Stale'   },
}

const HEALTH_BADGE: Record<string, { bg: string; label: string }> = {
  ok:             { bg: color.green,  label: 'Fresh'          },
  warn:           { bg: color.amber,  label: 'Degraded'       },
  failed:         { bg: color.red,    label: 'Failed'         },
  skipped:        { bg: '#888',       label: 'Skipped'        },
  not_configured: { bg: '#888',       label: 'Not configured' },
  unknown:        { bg: '#888',       label: 'Unknown'        },
}

// ── PAR Trend Chart ───────────────────────────────────────────────────────

const CHART_W   = 680
const CHART_H   = 180
const PAD_L     = 44
const PAD_R     = 16
const PAD_T     = 16
const PAD_B     = 32
const INNER_W   = CHART_W - PAD_L - PAD_R
const INNER_H   = CHART_H - PAD_T - PAD_B
const TARGET    = 70 // % target PAR

function PARTrendChart({ weeks }: { weeks: WeekPoint[] }) {
  const hasData = weeks.some(w => w.par !== null)

  // Y scale: 0–100
  const yPct = (v: number) => PAD_T + INNER_H * (1 - v / 100)
  // X scale: evenly spaced across 12 points
  const xAt  = (i: number) => PAD_L + (i / (weeks.length - 1)) * INNER_W

  const gridLines = [0, 25, 50, 70, 100]

  // Build polyline points for connected segments (skip null gaps)
  const segments: string[][] = []
  let cur: string[] = []
  weeks.forEach((w, i) => {
    if (w.par !== null) {
      cur.push(`${xAt(i).toFixed(1)},${yPct(w.par).toFixed(1)}`)
    } else {
      if (cur.length > 1) segments.push(cur)
      cur = []
    }
  })
  if (cur.length > 1) segments.push(cur)

  // Fill polygon below the line (first segment only for simplicity)
  const fillPoints = segments.length > 0
    ? [
        ...segments[0],
        `${segments[0][segments[0].length - 1].split(',')[0]},${(PAD_T + INNER_H).toFixed(1)}`,
        `${segments[0][0].split(',')[0]},${(PAD_T + INNER_H).toFixed(1)}`,
      ].join(' ')
    : ''

  const targetY = yPct(TARGET)

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      width="100%"
      aria-label="12-week PAR trend"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Grid lines */}
      {gridLines.map(g => (
        <g key={g}>
          <line
            x1={PAD_L} y1={yPct(g)} x2={PAD_L + INNER_W} y2={yPct(g)}
            stroke={g === TARGET ? color.amber : '#333'}
            strokeWidth={g === TARGET ? 1.5 : 0.5}
            strokeDasharray={g === TARGET ? '6 4' : undefined}
            opacity={g === TARGET ? 0.8 : 0.4}
          />
          <text
            x={PAD_L - 6} y={yPct(g) + 4}
            textAnchor="end" fontSize={10}
            fontFamily={font.mono} fill={color.t4}
          >
            {g}%
          </text>
        </g>
      ))}

      {/* Target label */}
      <text
        x={PAD_L + INNER_W + 4} y={targetY + 4}
        fontSize={10} fontFamily={font.mono} fill={color.amber} opacity={0.9}
      >
        70% target
      </text>

      {/* Fill area */}
      {fillPoints && (
        <polygon
          points={fillPoints}
          fill={color.blue} opacity={0.08}
        />
      )}

      {/* Data lines */}
      {segments.map((pts, si) => (
        <polyline
          key={si}
          points={pts.join(' ')}
          fill="none"
          stroke={color.blue}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}

      {/* Data dots + hover areas */}
      {weeks.map((w, i) => {
        if (w.par === null) return null
        const cx = xAt(i)
        const cy = yPct(w.par)
        const aboveTarget = w.par >= TARGET
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={3.5}
            fill={aboveTarget ? color.green : color.blue}
            stroke={color.bg1}
            strokeWidth={1.5}
          />
        )
      })}

      {/* X-axis week labels — every 3rd */}
      {weeks.map((w, i) => {
        if (i % 3 !== 0 && i !== weeks.length - 1) return null
        return (
          <text
            key={i}
            x={xAt(i)} y={PAD_T + INNER_H + 20}
            textAnchor="middle" fontSize={10}
            fontFamily={font.mono} fill={color.t4}
          >
            {shortDate(w.week_ending)}
          </text>
        )
      })}

      {/* No-data placeholder */}
      {!hasData && (
        <text
          x={PAD_L + INNER_W / 2} y={PAD_T + INNER_H / 2 + 5}
          textAnchor="middle" fontSize={13}
          fontFamily={font.sys} fill={color.t4}
        >
          No resolved predictions yet — chart populates as horizons elapse
        </text>
      )}
    </svg>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div style={{
      background: color.bg2,
      border:     `1px solid ${color.bd1}`,
      borderRadius: 10,
      padding: '18px 20px',
      flex: '1 1 0',
      minWidth: 130,
    }}>
      <div style={{
        fontFamily: font.mono, fontSize: 10, color: color.t4,
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: font.mono, fontSize: 28, fontWeight: 700, lineHeight: 1,
        color: accent ?? color.t1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: font.mono, fontSize: 11, color: color.t4, marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const [status,  setStatus]  = useState<StatusData | null>(null)
  const [par,     setPar]     = useState<PARData | null>(null)
  const [weeks,   setWeeks]   = useState<WeekPoint[]>([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    Promise.all([
      fetch('/api/status').then(r => r.json()),
      fetch('/api/par').then(r => r.json()),
      fetch('/api/par/weekly').then(r => r.json()),
    ]).then(([s, p, w]) => {
      if (!mountedRef.current) return
      setStatus(s)
      setPar(p)
      setWeeks(w.weeks ?? [])
    }).catch(() => {/* non-blocking */}).finally(() => {
      if (mountedRef.current) setLoading(false)
    })
    return () => { mountedRef.current = false }
  }, [])

  const pred = status?.predictions

  // Skeleton/loading state
  const val = (v: number | string | undefined | null, fallback = '—') =>
    loading ? '—' : (v == null ? fallback : String(v))

  const parColor = (par?.overall_par ?? 0) >= 70 ? color.green : (par?.overall_par ?? 0) >= 50 ? color.amber : color.red

  return (
    <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1 }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @media(max-width:680px){
          .status-kpi-row{flex-wrap:wrap!important}
          .status-kpi-row>*{min-width:calc(50% - 8px)!important}
          .status-two-col{flex-direction:column!important}
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: `${space.xxl}px ${space.lg}px` }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: space.xl, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md }}>
          <div>
            <div style={{ fontFamily: font.mono, fontSize: 11, color: color.t4, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              ConstructAIQ
            </div>
            <h1 style={{ fontFamily: font.sys, fontSize: 28, fontWeight: 700, color: color.t1, marginBottom: 8 }}>
              Platform Health
            </h1>
            <p style={{ fontFamily: font.sys, fontSize: 14, color: color.t3, lineHeight: 1.6, maxWidth: 480 }}>
              Live data freshness, prediction accuracy, and engine output across all ConstructAIQ systems.
              These numbers update continuously — no editorial adjustment.
            </p>
          </div>
          {status && (
            <div style={{ fontFamily: font.mono, fontSize: 11, color: color.t4, whiteSpace: 'nowrap', paddingTop: 4 }}>
              As of {fmtAge(status.as_of)}
            </div>
          )}
        </div>

        {/* ── KPI Row ── */}
        <div className="status-kpi-row" style={{ display: 'flex', gap: space.sm, marginBottom: space.xl }}>
          <KPICard
            label="Overall PAR"
            value={par === null ? '—' : par.overall_par === null ? '—' : `${par.overall_par}%`}
            sub={par ? `n = ${par.sample_size}` : 'Loading…'}
            accent={par?.overall_par != null ? parColor : undefined}
          />
          <KPICard
            label="Metros scored"
            value={val(status?.opportunity_metros)}
            sub="opportunity scores"
          />
          <KPICard
            label="Entity graph"
            value={val(status ? fmtK(status.entity_graph.entities) : null)}
            sub={status ? `${fmtK(status.entity_graph.edges)} edges` : undefined}
          />
          <KPICard
            label="Events (30d)"
            value={val(status ? fmtK(status.events_last_30d) : null)}
            sub="from event log"
          />
          <KPICard
            label="Predictions due"
            value={val(pred?.due_unresolved)}
            sub="pending evaluation"
            accent={pred && pred.due_unresolved > 0 ? color.amber : undefined}
          />
          <KPICard
            label="PAR (7d)"
            value={pred?.par_last_7d != null ? `${pred.par_last_7d}%` : '—'}
            sub={pred ? `${pred.evaluated_last_7d} evaluated` : undefined}
            accent={pred?.par_last_7d != null
              ? (pred.par_last_7d >= 70 ? color.green : pred.par_last_7d >= 50 ? color.amber : color.red)
              : undefined}
          />
        </div>

        {/* ── PAR Trend Chart ── */}
        <div style={{
          background: color.bg1,
          border:     `1px solid ${color.bd1}`,
          borderRadius: 12,
          padding: `${space.lg}px ${space.lg}px ${space.md}px`,
          marginBottom: space.xl,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: space.md }}>
            <div>
              <div style={{ fontFamily: font.sys, fontSize: 16, fontWeight: 600, color: color.t1, marginBottom: 4 }}>
                12-Week PAR Trend
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 11, color: color.t4 }}>
                Prediction Accuracy Rate by week — target 70%
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 2, background: color.blue, borderRadius: 1 }} />
                <span style={{ fontFamily: font.mono, fontSize: 10, color: color.t4 }}>Weekly PAR</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 1.5, background: color.amber, borderRadius: 1, opacity: 0.8 }} />
                <span style={{ fontFamily: font.mono, fontSize: 10, color: color.t4 }}>70% target</span>
              </div>
            </div>
          </div>
          <PARTrendChart weeks={weeks} />
        </div>

        {/* ── Two-column: Data Freshness + Prediction Activity ── */}
        <div className="status-two-col" style={{ display: 'flex', gap: space.md, marginBottom: space.xl }}>

          {/* Data Freshness */}
          <div style={{
            flex: '1 1 0',
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: 12,
            padding: `${space.md}px ${space.lg}px`,
          }}>
            <div style={{ fontFamily: font.sys, fontSize: 15, fontWeight: 600, color: color.t1, marginBottom: 16 }}>
              Data Freshness
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Source', 'Updated', 'Status'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '6px 0',
                      fontFamily: font.mono, fontSize: 10, color: color.t4,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      borderBottom: `1px solid ${color.bd2}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {[120, 60, 52].map((w, j) => (
                        <td key={j} style={{ padding: '8px 0', borderBottom: `1px solid ${color.bd1}` }}>
                          <div style={{ width: w, height: 11, background: color.bg3, borderRadius: 3 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : status?.freshness.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '16px 0', fontFamily: font.mono, fontSize: 12, color: color.t4 }}>
                      No series data yet
                    </td>
                  </tr>
                ) : (
                  (status?.freshness ?? []).map(row => {
                    const dot = STATUS_DOT[row.status]
                    return (
                      <tr key={row.source}>
                        <td style={{ padding: '8px 0', borderBottom: `1px solid ${color.bd1}`, fontFamily: font.sys, fontSize: 13, color: color.t2 }}>
                          {row.label}
                        </td>
                        <td style={{ padding: '8px 0', borderBottom: `1px solid ${color.bd1}`, fontFamily: font.mono, fontSize: 12, color: color.t3 }}>
                          {fmtAge(row.last_updated)}
                        </td>
                        <td style={{ padding: '8px 0', borderBottom: `1px solid ${color.bd1}` }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontFamily: font.mono, fontSize: 11, color: dot.bg,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot.bg, display: 'inline-block' }} />
                            {dot.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Prediction Activity */}
          <div style={{
            flex: '1 1 0',
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: 12,
            padding: `${space.md}px ${space.lg}px`,
          }}>
            <div style={{ fontFamily: font.sys, fontSize: 15, fontWeight: 600, color: color.t1, marginBottom: 16 }}>
              Prediction Activity — Last 7 Days
            </div>

            {[
              { label: 'Predictions made',      value: pred?.made_last_7d     },
              { label: 'Predictions evaluated', value: pred?.evaluated_last_7d },
              { label: 'Outcomes correct',      value: pred?.correct_last_7d  },
              { label: 'Pending evaluation',    value: pred?.due_unresolved, accent: pred && pred.due_unresolved > 0 ? color.amber : undefined },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 0', borderBottom: `1px solid ${color.bd1}`,
              }}>
                <span style={{ fontFamily: font.sys, fontSize: 13, color: color.t3 }}>
                  {label}
                </span>
                <span style={{ fontFamily: font.mono, fontSize: 18, fontWeight: 700, color: accent ?? color.t1 }}>
                  {loading ? '—' : (value ?? '—')}
                </span>
              </div>
            ))}

            {/* PAR this week bar */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: font.mono, fontSize: 10, color: color.t4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  PAR this week
                </span>
                <span style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 700, color: pred?.par_last_7d != null ? (pred.par_last_7d >= 70 ? color.green : color.amber) : color.t4 }}>
                  {pred?.par_last_7d != null ? `${pred.par_last_7d}%` : '—'}
                </span>
              </div>
              <div style={{ height: 6, background: color.bg3, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pred?.par_last_7d ?? 0}%`,
                  background: pred?.par_last_7d != null && pred.par_last_7d >= 70 ? color.green : color.blue,
                  borderRadius: 3,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              {/* Target marker */}
              <div style={{ position: 'relative', marginTop: 4 }}>
                <div style={{
                  position: 'absolute', left: '70%',
                  width: 1, height: 8, background: color.amber,
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Entity Graph Stats ── */}
        <div style={{
          background: color.bg1,
          border: `1px solid ${color.bd1}`,
          borderRadius: 12,
          padding: `${space.md}px ${space.lg}px`,
          marginBottom: space.xl,
        }}>
          <div style={{ fontFamily: font.sys, fontSize: 15, fontWeight: 600, color: color.t1, marginBottom: 16 }}>
            Entity Graph
          </div>
          <div style={{ display: 'flex', gap: space.xl }}>
            {[
              { label: 'Entities',     value: status ? fmtK(status.entity_graph.entities) : '—', sub: 'sites, permits, projects, contractors, agencies, awards' },
              { label: 'Graph edges',  value: status ? fmtK(status.entity_graph.edges)    : '—', sub: 'permit→project, award→contractor, site→permit links' },
              { label: 'Events (30d)', value: status ? fmtK(status.events_last_30d)        : '—', sub: 'permit filings, award activations, site signals' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ flex: '1 1 0' }}>
                <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {label}
                </div>
                <div style={{ fontFamily: font.mono, fontSize: 26, fontWeight: 700, color: color.t1, marginBottom: 4 }}>
                  {loading ? '—' : value}
                </div>
                <div style={{ fontFamily: font.sys, fontSize: 12, color: color.t4, lineHeight: 1.5 }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Source Health ── */}
        <div style={{
          background: color.bg1,
          border: `1px solid ${color.bd1}`,
          borderRadius: 12,
          padding: `${space.md}px ${space.lg}px`,
          marginBottom: space.xl,
        }}>
          <div style={{ fontFamily: font.sys, fontSize: 15, fontWeight: 600, color: color.t1, marginBottom: 4 }}>
            Source Health
          </div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            Per-source ingestion status — latest run per source
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Source', 'Category', 'Rows', 'Last run', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '6px 0',
                    fontFamily: font.mono, fontSize: 10, color: color.t4,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    borderBottom: `1px solid ${color.bd2}`,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {[160, 90, 50, 70, 80].map((w, j) => (
                      <td key={j} style={{ padding: '8px 0', borderBottom: `1px solid ${color.bd1}` }}>
                        <div style={{ width: w, height: 11, background: color.bg3, borderRadius: 3 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !status?.source_health?.length ? (
                <tr>
                  <td colSpan={5} style={{ padding: '16px 0', fontFamily: font.mono, fontSize: 12, color: color.t4 }}>
                    No health records yet — records appear after the first cron run
                  </td>
                </tr>
              ) : (
                (status.source_health ?? []).map(row => {
                  const badge = HEALTH_BADGE[row.status] ?? HEALTH_BADGE.unknown
                  return (
                    <tr key={row.source_id}>
                      <td style={{ padding: '8px 0', borderBottom: `1px solid ${color.bd1}`, fontFamily: font.sys, fontSize: 13, color: color.t2 }}>
                        {row.source_label}
                      </td>
                      <td style={{ padding: '8px 0', borderBottom: `1px solid ${color.bd1}`, fontFamily: font.mono, fontSize: 11, color: color.t4 }}>
                        {row.category}
                      </td>
                      <td style={{ padding: '8px 0', borderBottom: `1px solid ${color.bd1}`, fontFamily: font.mono, fontSize: 12, color: color.t3 }}>
                        {row.rows_written != null ? row.rows_written.toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '8px 0', borderBottom: `1px solid ${color.bd1}`, fontFamily: font.mono, fontSize: 12, color: color.t3 }}>
                        {fmtAge(row.run_at)}
                      </td>
                      <td style={{ padding: '8px 0', borderBottom: `1px solid ${color.bd1}` }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontFamily: font.mono, fontSize: 11, color: badge.bg,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.bg, display: 'inline-block' }} />
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── API Configuration ── */}
        <div style={{
          background: color.bg1,
          border: `1px solid ${color.bd1}`,
          borderRadius: 12,
          padding: `${space.md}px ${space.lg}px`,
          marginBottom: space.xl,
        }}>
          <div style={{ fontFamily: font.sys, fontSize: 15, fontWeight: 600, color: color.t1, marginBottom: 4 }}>
            API Configuration
          </div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            Live data active per configured key
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 36, marginBottom: 4, borderRadius: 6, background: color.bg3 }} />
            ))
          ) : (
            ([
              { key: 'pricewatch',    label: 'Materials PriceWatch',       desc: 'BLS_API_KEY / FRED_API_KEY' },
              { key: 'benchmark',     label: 'Historical Benchmark',        desc: '≥ 24 TTLCONS observations in DB' },
              { key: 'eia',           label: 'EIA Energy Data',             desc: 'EIA_API_KEY' },
              { key: 'bea',           label: 'BEA State GDP',               desc: 'BEA_API_KEY' },
              { key: 'solicitations', label: 'SAM.gov Solicitations',       desc: 'SAM_GOV_API_KEY' },
              { key: 'equities',      label: 'Equities / ETF Prices',       desc: 'POLYGON_API_KEY' },
            ] as { key: keyof ApiHealth; label: string; desc: string }[]).map(({ key, label, desc }) => {
              const active = status?.api_health?.[key] ?? false
              return (
                <div key={key} style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  padding:        '10px 0',
                  borderBottom:   `1px solid ${color.bd1}`,
                }}>
                  <div>
                    <span style={{ fontFamily: font.sys, fontSize: 13, color: color.t2 }}>{label}</span>
                    <span style={{ fontFamily: font.mono, fontSize: 11, color: color.t4, marginLeft: 10 }}>{desc}</span>
                  </div>
                  <span style={{
                    display:      'inline-flex',
                    alignItems:   'center',
                    gap:          5,
                    fontFamily:   font.mono,
                    fontSize:     11,
                    color:        active ? color.green : color.amber,
                    whiteSpace:   'nowrap',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? color.green : color.amber, display: 'inline-block' }} />
                    {active ? 'Live data active' : 'Key not configured — using empty state'}
                  </span>
                </div>
              )
            })
          )}

          <div style={{ fontFamily: font.sys, fontSize: 12, color: color.t4, marginTop: 14, lineHeight: 1.6 }}>
            Configure missing keys in Vercel environment variables.
            See <a href="/.env.example" style={{ color: color.amber, textDecoration: 'none' }}>.env.example</a> for registration links.
          </div>
        </div>

        {/* ── Footer note ── */}
        <div style={{ fontFamily: font.sys, fontSize: 13, color: color.t4, lineHeight: 1.7, textAlign: 'center' }}>
          PAR accumulates as the platform ages — early figures reflect small sample sizes.
          Outcomes are evaluated weekly (Wednesdays) once the prediction horizon elapses.
          These numbers are live and are not editorially adjusted.
        </div>

      </div>
    </div>
  )
}
