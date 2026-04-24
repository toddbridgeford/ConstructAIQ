'use client'

import { useState, useMemo } from 'react'
import { color, font, fmtB } from '@/lib/theme'
import type { MetroIndexRow, OpportunityIndexResponse } from '@/app/api/opportunity-index/route'

// ── Design tokens (local aliases) ─────────────────────────────────────────────
const SYS  = font.sys
const MONO = font.mono

// ── Classification colors ──────────────────────────────────────────────────────
const BAND_COLOR: Record<string, string> = {
  FORMATION:   color.green,
  BUILDING:    color.blue,
  STABLE:      color.t3,
  COOLING:     color.amber,
  CONTRACTING: color.red,
}

const BAND_DIM: Record<string, string> = {
  FORMATION:   color.greenDim,
  BUILDING:    color.blueDim,
  STABLE:      '#1a1a1a',
  COOLING:     color.amberDim,
  CONTRACTING: color.redDim,
}

const GAP_COLOR = (gap: number | null): string => {
  if (gap === null) return color.t4
  if (gap >  5)    return color.green   // ahead of narrative
  if (gap >= -10)  return color.t3      // on-track
  return color.red                      // lagging / behind narrative
}

const CONF_COLOR: Record<string, string> = {
  HIGH:   color.green,
  MEDIUM: color.amber,
  LOW:    color.t4,
}

// ── Sort config ────────────────────────────────────────────────────────────────
type SortKey = 'formation_score' | 'reality_gap' | 'spend_release' | 'recent_change'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'formation_score', label: 'Formation Score' },
  { key: 'reality_gap',     label: 'Reality Gap'     },
  { key: 'spend_release',   label: 'Spend Release'   },
  { key: 'recent_change',   label: 'Recent Change'   },
]

function sortRows(rows: MetroIndexRow[], key: SortKey): MetroIndexRow[] {
  return [...rows].sort((a, b) => {
    switch (key) {
      case 'formation_score':
        return b.opportunity_score - a.opportunity_score
      case 'reality_gap':
        // Worst gap (most negative) first — surfaces risk
        if (a.avg_gap === null && b.avg_gap === null) return 0
        if (a.avg_gap === null) return 1
        if (b.avg_gap === null) return -1
        return a.avg_gap - b.avg_gap
      case 'spend_release':
        // Most 90d projects first, then by high formation count
        const diff = b.spend_window_90d - a.spend_window_90d
        return diff !== 0 ? diff : b.high_formation_count - a.high_formation_count
      case 'recent_change':
        return new Date(b.computed_at).getTime() - new Date(a.computed_at).getTime()
    }
  })
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ScoreBadge({ score, classification }: { score: number; classification: string }) {
  const c = BAND_COLOR[classification] ?? color.t3
  const dim = BAND_DIM[classification] ?? color.bg2
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: dim, borderRadius: 6, padding: '4px 9px',
    }}>
      <span style={{
        fontFamily: MONO, fontSize: 15, fontWeight: 700, color: c, lineHeight: 1,
      }}>
        {score}
      </span>
      <span style={{
        fontFamily: MONO, fontSize: 8.5, fontWeight: 500, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const, color: c, opacity: 0.8,
      }}>
        {classification}
      </span>
    </div>
  )
}

function GapBadge({ gap, ghostCount, stalledCount }: {
  gap: number | null
  ghostCount: number
  stalledCount: number
}) {
  if (gap === null) {
    return (
      <span style={{ fontFamily: MONO, fontSize: 12, color: color.t4 }}>—</span>
    )
  }
  const c    = GAP_COLOR(gap)
  const sign = gap > 0 ? '+' : ''
  const arrow = gap >= -10 ? '↑' : '↓'
  const alertCount = ghostCount + stalledCount

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: c }}>
        {sign}{gap} {arrow}
      </span>
      {alertCount > 0 && (
        <span style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em',
          color: color.red, textTransform: 'uppercase' as const,
        }}>
          {ghostCount > 0 && `${ghostCount}G`}
          {ghostCount > 0 && stalledCount > 0 && ' · '}
          {stalledCount > 0 && `${stalledCount}S`}
        </span>
      )}
    </div>
  )
}

function SpendRelease({ count90d, highCount, value }: {
  count90d: number
  highCount: number
  value: number
}) {
  if (highCount === 0) {
    return <span style={{ fontFamily: MONO, fontSize: 12, color: color.t4 }}>—</span>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: color.t1 }}>
        {count90d > 0 ? (
          <><span style={{ color: color.green }}>{count90d} × 90d</span>
          {highCount > count90d && <span style={{ color: color.t4 }}> +{highCount - count90d}</span>}</>
        ) : (
          <span style={{ color: color.amber }}>{highCount} × 180d+</span>
        )}
      </span>
      {value > 0 && (
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>
          {fmtB(value)}
        </span>
      )}
    </div>
  )
}

function ConfidenceDot({ level }: { level: string }) {
  const c = CONF_COLOR[level] ?? color.t4
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0,
      }} />
      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em',
        textTransform: 'uppercase' as const, color: c }}>
        {level}
      </span>
    </div>
  )
}

function TopDriverPill({ driver }: { driver: MetroIndexRow['top_drivers'][0] | undefined }) {
  if (!driver) return <span style={{ fontFamily: MONO, fontSize: 11, color: color.t4 }}>—</span>
  const isPositive = driver.score >= 65
  const isNegative = driver.score <= 35
  const c = isPositive ? color.green : isNegative ? color.red : color.amber
  const arrow = isPositive ? '↑' : isNegative ? '↓' : '→'

  return (
    <div style={{ maxWidth: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.07em',
          textTransform: 'uppercase' as const, color: c }}>
          {arrow} {driver.label}
        </span>
      </div>
      <div style={{
        fontFamily: SYS, fontSize: 11, color: color.t4,
        lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
      }}>
        {driver.detail}
      </div>
    </div>
  )
}

function AgePill({ computedAt }: { computedAt: string }) {
  const ms    = Date.now() - new Date(computedAt).getTime()
  const hours = Math.floor(ms / 3_600_000)
  const days  = Math.floor(hours / 24)
  const label = days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : 'just now'
  return (
    <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{label}</span>
  )
}

// ── Summary strip ──────────────────────────────────────────────────────────────

function SummaryStrip({ metros }: { metros: MetroIndexRow[] }) {
  const formationCount  = metros.filter(m => m.classification === 'FORMATION').length
  const buildingCount   = metros.filter(m => m.classification === 'BUILDING').length
  const alertCount      = metros.reduce((s, m) => s + m.ghost_count + m.stalled_count, 0)
  const projects90d     = metros.reduce((s, m) => s + m.spend_window_90d, 0)
  const value90d        = metros.reduce((s, m) => s + (m.spend_window_90d > 0 ? m.high_formation_value : 0), 0)

  const stats = [
    { label: 'Metros Tracked',      value: String(metros.length),         color: color.t1      },
    { label: 'Formation Class',     value: String(formationCount),         color: color.green   },
    { label: 'Building Class',      value: String(buildingCount),          color: color.blue    },
    { label: '90-Day Projects',     value: projects90d > 0 ? `${projects90d} · ${fmtB(value90d)}` : '0',
      color: projects90d > 0 ? color.green : color.t4 },
    { label: 'Ghost / Stalled',     value: String(alertCount),
      color: alertCount > 0 ? color.red : color.t4 },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 1,
      background: color.bd1,
      border: `1px solid ${color.bd1}`,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: color.bg1, padding: '14px 16px',
          display: 'flex', flexDirection: 'column' as const, gap: 4,
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em',
            textTransform: 'uppercase' as const, color: color.t4,
          }}>
            {s.label}
          </div>
          <div style={{
            fontFamily: MONO, fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1,
          }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Table header ──────────────────────────────────────────────────────────────

const COL_LABEL: React.CSSProperties = {
  fontFamily: MONO, fontSize: 9, fontWeight: 500, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: color.t4, padding: '10px 12px',
  borderBottom: `1px solid ${color.bd1}`, userSelect: 'none',
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OpportunityIndexClient({
  data,
}: {
  data: OpportunityIndexResponse
}) {
  const [sort, setSort] = useState<SortKey>('formation_score')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data.metros
    return data.metros.filter(m =>
      m.metro_code.toLowerCase().includes(q) ||
      (m.metro_name?.toLowerCase().includes(q) ?? false) ||
      (m.state_code?.toLowerCase().includes(q) ?? false),
    )
  }, [data.metros, query])

  const sorted = useMemo(() => sortRows(filtered, sort), [filtered, sort])

  return (
    <div style={{ fontFamily: SYS }}>

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 6 }}>
          <h1 style={{
            margin: 0, fontFamily: SYS, fontSize: 28, fontWeight: 700,
            color: color.t1, letterSpacing: '-0.02em',
          }}>
            Opportunity Index
          </h1>
          <span style={{
            fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: color.t4,
          }}>
            {data.total} metro{data.total !== 1 ? 's' : ''}
          </span>
        </div>
        <p style={{
          margin: 0, fontFamily: SYS, fontSize: 13.5, color: color.t3, lineHeight: 1.6,
        }}>
          Formation Score · Reality Gap · 90-day spend release · Top signal drivers
        </p>
      </div>

      {/* ── Summary strip ──────────────────────────────────────────────── */}
      <SummaryStrip metros={data.metros} />

      {/* ── Controls row ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        flexWrap: 'wrap' as const,
      }}>
        {/* Sort tabs */}
        <div style={{
          display: 'flex', gap: 2,
          background: color.bg2, borderRadius: 8, padding: 2, border: `1px solid ${color.bd1}`,
        }}>
          {SORT_OPTIONS.map(o => (
            <button
              key={o.key}
              onClick={() => setSort(o.key)}
              style={{
                padding: '5px 12px',
                fontFamily: MONO, fontSize: 10, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: sort === o.key ? color.bg0 : color.t4,
                background: sort === o.key ? color.amber : 'transparent',
                border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Filter input */}
        <input
          type="text"
          placeholder="Filter by metro or state…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: '1 1 200px', minWidth: 0,
            padding: '6px 12px',
            fontFamily: MONO, fontSize: 12, color: color.t1,
            background: color.bg2, border: `1px solid ${color.bd1}`,
            borderRadius: 8, outline: 'none',
          }}
        />

        {/* As-of stamp */}
        <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4, flexShrink: 0 }}>
          as of {new Date(data.as_of).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* ── Index table ────────────────────────────────────────────────── */}
      <div style={{
        background: color.bg1, border: `1px solid ${color.bd1}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 160px 90px 140px 1fr 80px 70px',
          background: color.bg2,
        }}>
          {[
            'Metro',
            'Score',
            'Reality Gap',
            'Spend Release',
            'Top Signal Driver',
            'Conf.',
            'Updated',
          ].map(h => (
            <div key={h} style={COL_LABEL}>{h}</div>
          ))}
        </div>

        {/* Data rows */}
        {sorted.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center' as const,
            fontFamily: MONO, fontSize: 12, color: color.t4,
          }}>
            {query ? `No metros match "${query}"` : 'No opportunity scores computed yet — run the opportunity-scores cron'}
          </div>
        ) : (
          sorted.map((row, i) => (
            <MetroRow key={row.metro_code} row={row} isLast={i === sorted.length - 1} />
          ))
        )}
      </div>

      {/* ── Coverage note ──────────────────────────────────────────────── */}
      {data.metros.length > 0 && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: color.bg2, border: `1px solid ${color.bd1}`,
          borderRadius: 8, display: 'flex', gap: 24,
        }}>
          <CoverageNote
            label="Reality Gap data"
            count={data.coverage.with_gap_data}
            total={data.total}
          />
          <CoverageNote
            label="Formation Score data"
            count={data.coverage.with_formation_data}
            total={data.total}
          />
          <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginLeft: 'auto' }}>
            Project-level signals update nightly · Run{' '}
            <code style={{ color: color.amber }}>/api/cron/formation-scores</code>{' '}
            and{' '}
            <code style={{ color: color.amber }}>/api/cron/reality-gaps</code>{' '}
            to populate
          </span>
        </div>
      )}
    </div>
  )
}

function CoverageNote({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 8, height: 8, borderRadius: 2,
        background: pct >= 50 ? color.green : pct >= 20 ? color.amber : color.t4,
      }} />
      <span style={{ fontFamily: MONO, fontSize: 10, color: color.t3 }}>
        {label}: <span style={{ color: color.t1, fontWeight: 600 }}>{count}/{total}</span>
      </span>
    </div>
  )
}

function MetroRow({ row, isLast }: { row: MetroIndexRow; isLast: boolean }) {
  const [hovered, setHovered] = useState(false)
  const topDriver = row.top_drivers[0]

  return (
    <a
      href={`/api/spend-propagation?metro=${row.metro_code}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 160px 90px 140px 1fr 80px 70px',
        borderBottom: isLast ? 'none' : `1px solid ${color.bd1}`,
        background: hovered ? color.bg2 : 'transparent',
        textDecoration: 'none',
        transition: 'background 0.12s',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Metro name */}
      <div style={{ padding: '13px 12px', display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
        <span style={{
          fontFamily: SYS, fontSize: 13.5, fontWeight: 600, color: color.t1,
        }}>
          {row.metro_name ?? row.metro_code}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: color.t4,
          }}>
            {row.metro_code}
          </span>
          {row.state_code && (
            <>
              <span style={{ color: color.bd2, fontSize: 8 }}>·</span>
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', color: color.t4,
              }}>
                {row.state_code}
              </span>
            </>
          )}
          {row.total_project_count > 0 && (
            <>
              <span style={{ color: color.bd2, fontSize: 8 }}>·</span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>
                {row.total_project_count}p
              </span>
            </>
          )}
        </div>
      </div>

      {/* Score */}
      <div style={{ padding: '13px 12px', display: 'flex', alignItems: 'center' }}>
        <ScoreBadge score={row.opportunity_score} classification={row.classification} />
      </div>

      {/* Reality Gap */}
      <div style={{ padding: '13px 12px', display: 'flex', alignItems: 'center' }}>
        <GapBadge
          gap={row.avg_gap}
          ghostCount={row.ghost_count}
          stalledCount={row.stalled_count}
        />
      </div>

      {/* Spend Release */}
      <div style={{ padding: '13px 12px', display: 'flex', alignItems: 'center' }}>
        <SpendRelease
          count90d={row.spend_window_90d}
          highCount={row.high_formation_count}
          value={row.high_formation_value}
        />
      </div>

      {/* Top driver */}
      <div style={{ padding: '13px 12px', display: 'flex', alignItems: 'center' }}>
        <TopDriverPill driver={topDriver} />
      </div>

      {/* Confidence */}
      <div style={{ padding: '13px 12px', display: 'flex', alignItems: 'center' }}>
        <ConfidenceDot level={row.confidence} />
      </div>

      {/* Updated */}
      <div style={{ padding: '13px 12px', display: 'flex', alignItems: 'center' }}>
        <AgePill computedAt={row.computed_at} />
      </div>
    </a>
  )
}
