import { headers } from 'next/headers'
import Link from 'next/link'
import { color, font } from '@/lib/theme'
import type { MetroIndexRow, OpportunityIndexResponse } from '@/app/api/opportunity-index/route'

export const dynamic   = 'force-dynamic'
export const revalidate = 1800

export const metadata = {
  title: 'Reality Gap Intelligence — ConstructAIQ',
  description:
    'Where official project momentum diverges from satellite and permit signals — ' +
    'markets quietly ahead, and markets hiding risk.',
}

const SYS  = font.sys
const MONO = font.mono

async function fetchIndex(): Promise<OpportunityIndexResponse | null> {
  try {
    const h    = await headers()
    const host = h.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const res  = await fetch(`${proto}://${host}/api/opportunity-index`, {
      next: { revalidate: 1800 },
    })
    if (!res.ok) return null
    return res.json() as Promise<OpportunityIndexResponse>
  } catch {
    return null
  }
}

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfBadge({ level }: { level: string }) {
  const c =
    level === 'HIGH'   ? color.green :
    level === 'MEDIUM' ? color.amber :
    color.t4
  return (
    <span style={{
      display:       'inline-block',
      fontFamily:    MONO,
      fontSize:      9,
      fontWeight:    600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      color:         c,
      background:    c + '18',
      border:        `1px solid ${c}33`,
      borderRadius:  4,
      padding:       '2px 6px',
    }}>
      {level}
    </span>
  )
}

// ── Gap score display ─────────────────────────────────────────────────────────

function GapScore({ gap }: { gap: number }) {
  const isAhead   = gap >  5
  const isLagging = gap < -5
  const c = isAhead ? color.green : isLagging ? color.red : color.t3
  const sign = gap > 0 ? '+' : ''
  return (
    <span style={{
      fontFamily: MONO,
      fontSize:   20,
      fontWeight: 700,
      color:      c,
      lineHeight: 1,
    }}>
      {sign}{gap}
    </span>
  )
}

// ── Metro card ────────────────────────────────────────────────────────────────

function MetroCard({
  row,
  side,
}: {
  row:  MetroIndexRow
  side: 'ahead' | 'behind'
}) {
  const gap        = row.avg_gap ?? 0
  const gapSign    = gap > 0 ? '+' : ''
  const gapColor   = side === 'ahead' ? color.green : color.red
  const accentDim  = side === 'ahead' ? color.greenDim : color.redDim

  // Build one-line official signal summary from ghost/stalled/on-track counts
  const officialSummary = (() => {
    const parts: string[] = []
    if (row.high_formation_count > 0) parts.push(`${row.high_formation_count} high-formation project${row.high_formation_count !== 1 ? 's' : ''}`)
    if (row.spend_window_90d > 0)     parts.push(`${row.spend_window_90d} in 90-day spend window`)
    return parts.length > 0
      ? parts.join(' · ')
      : 'Official record shows active momentum'
  })()

  // Build one-line observed signal summary
  const observedSummary = (() => {
    if (side === 'ahead') {
      return `Ground signals confirm or exceed official pace${
        row.on_track_count > 0 ? ` — ${row.on_track_count} on-track project${row.on_track_count !== 1 ? 's' : ''}` : ''
      }`
    }
    const alerts: string[] = []
    if (row.ghost_count   > 0) alerts.push(`${row.ghost_count} ghost project${row.ghost_count   !== 1 ? 's' : ''}`)
    if (row.stalled_count > 0) alerts.push(`${row.stalled_count} stalled project${row.stalled_count !== 1 ? 's' : ''}`)
    return alerts.length > 0
      ? `Observed signals weaker than declared — ${alerts.join(', ')}`
      : 'Observed signals diverge from official pace'
  })()

  const stateSlug = row.state_code?.toLowerCase()

  return (
    <div style={{
      background:   color.bg1,
      border:       `1px solid ${color.bd1}`,
      borderRadius: 12,
      padding:      '18px 20px',
      display:      'flex',
      flexDirection:'column' as const,
      gap:          12,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{
            fontFamily: SYS,
            fontSize:   15,
            fontWeight: 600,
            color:      color.t1,
            lineHeight: 1.2,
          }}>
            {row.metro_name ?? row.metro_code}
          </div>
          {row.state_code && (
            <div style={{
              fontFamily:    MONO,
              fontSize:      9,
              letterSpacing: '0.1em',
              color:         color.t4,
              marginTop:     3,
            }}>
              {row.metro_code} · {row.state_code}
            </div>
          )}
        </div>
        <div style={{
          display:    'flex',
          flexDirection: 'column' as const,
          alignItems: 'flex-end',
          gap:        4,
        }}>
          <div style={{
            display:      'flex',
            alignItems:   'baseline',
            gap:          4,
            background:   accentDim,
            border:       `1px solid ${gapColor}33`,
            borderRadius: 8,
            padding:      '5px 10px',
          }}>
            <GapScore gap={gap} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: gapColor, letterSpacing: '0.08em' }}>
              GAP
            </span>
          </div>
          <ConfBadge level={row.confidence} />
        </div>
      </div>

      {/* Signal lines */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            fontFamily:    MONO,
            fontSize:      9,
            letterSpacing: '0.08em',
            color:         color.t4,
            flexShrink:    0,
            paddingTop:    2,
            width:         56,
          }}>
            OFFICIAL
          </span>
          <span style={{
            fontFamily: SYS,
            fontSize:   12,
            color:      color.t3,
            lineHeight: 1.5,
          }}>
            {officialSummary}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            fontFamily:    MONO,
            fontSize:      9,
            letterSpacing: '0.08em',
            color:         color.t4,
            flexShrink:    0,
            paddingTop:    2,
            width:         56,
          }}>
            OBSERVED
          </span>
          <span style={{
            fontFamily: SYS,
            fontSize:   12,
            color:      side === 'ahead' ? color.green : color.red,
            lineHeight: 1.5,
          }}>
            {observedSummary}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>
          {row.gap_project_count > 0
            ? `${row.gap_project_count} project${row.gap_project_count !== 1 ? 's' : ''} tracked`
            : 'gap data pending'}
        </span>
        {stateSlug ? (
          <Link
            href={`/markets/${stateSlug}`}
            style={{
              fontFamily:    MONO,
              fontSize:      10,
              color:         color.blue,
              letterSpacing: '0.04em',
              textDecoration:'none',
            }}
          >
            Deep dive →
          </Link>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>
            {gapSign}{gap} gap
          </span>
        )}
      </div>
    </div>
  )
}

// ── Column header ─────────────────────────────────────────────────────────────

function ColumnHeader({
  label,
  sublabel,
  accent,
  count,
}: {
  label:    string
  sublabel: string
  accent:   string
  count:    number
}) {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'baseline',
      gap:          10,
      marginBottom: 16,
    }}>
      <div style={{
        fontFamily:    MONO,
        fontSize:      9,
        fontWeight:    700,
        letterSpacing: '0.14em',
        color:         accent,
        background:    accent + '18',
        border:        `1px solid ${accent}33`,
        borderRadius:  4,
        padding:       '3px 8px',
      }}>
        {label}
      </div>
      <span style={{ fontFamily: SYS, fontSize: 13, color: color.t3 }}>
        {sublabel}
      </span>
      <span style={{
        marginLeft:    'auto',
        fontFamily:    MONO,
        fontSize:      11,
        color:         color.t4,
        letterSpacing: '0.06em',
      }}>
        {count} market{count !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyColumn({ message }: { message: string }) {
  return (
    <div style={{
      padding:      '48px 24px',
      textAlign:    'center' as const,
      fontFamily:   SYS,
      fontSize:     13,
      color:        color.t4,
      background:   color.bg1,
      border:       `1px solid ${color.bd1}`,
      borderRadius: 12,
    }}>
      {message}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RealityGapPage() {
  const data = await fetchIndex()

  const metros = data?.metros ?? []

  // Only include metros that have gap data
  const withGap = metros.filter(m => m.avg_gap !== null && m.gap_project_count > 0)

  // Sort: overperformers by highest positive gap; underperformers by most negative
  const overperformers  = withGap
    .filter(m => (m.avg_gap ?? 0) > 0)
    .sort((a, b) => (b.avg_gap ?? 0) - (a.avg_gap ?? 0))

  const underperformers = withGap
    .filter(m => (m.avg_gap ?? 0) <= 0)
    .sort((a, b) => (a.avg_gap ?? 0) - (b.avg_gap ?? 0))

  const lastComputed = data?.as_of
    ? new Date(data.as_of).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour:  '2-digit', minute: '2-digit',
      })
    : null

  const hasData = withGap.length > 0

  return (
    <main style={{
      minHeight:  '100vh',
      background: color.bg0,
      color:      color.t1,
      fontFamily: SYS,
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        @media(max-width:768px){
          .rg-columns{grid-template-columns:1fr!important}
          .rg-header{padding:20px 16px 0!important}
          .rg-body{padding:20px 16px 48px!important}
        }
      `}</style>

      {/* Header */}
      <div
        className="rg-header"
        style={{ padding: '32px 40px 0', marginBottom: 32 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{
              fontFamily:    SYS,
              fontSize:      26,
              fontWeight:    700,
              letterSpacing: '-0.02em',
              color:         color.t1,
              marginBottom:  6,
            }}>
              Reality Gap Intelligence
            </h1>
            <p style={{
              fontFamily: SYS,
              fontSize:   14,
              color:      color.t3,
              lineHeight: 1.6,
              maxWidth:   520,
            }}>
              Where official momentum diverges from observed signals — markets quietly
              outpacing the narrative, and markets where the headline hides the risk.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {lastComputed && (
              <span style={{
                background:    color.bg2,
                border:        `1px solid ${color.bd1}`,
                borderRadius:  6,
                padding:       '4px 10px',
                fontFamily:    MONO,
                fontSize:      10,
                color:         color.t4,
                letterSpacing: '0.06em',
              }}>
                {lastComputed}
              </span>
            )}
            <span style={{
              background:    color.bg2,
              border:        `1px solid ${color.bd1}`,
              borderRadius:  6,
              padding:       '4px 10px',
              fontFamily:    MONO,
              fontSize:      10,
              color:         color.amber,
              letterSpacing: '0.08em',
            }}>
              UPDATED NIGHTLY
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: color.bd1, marginTop: 24 }} />
      </div>

      {/* Body */}
      <div
        className="rg-body"
        style={{ padding: '0 40px 64px' }}
      >
        {!hasData ? (
          <div style={{
            padding:    '80px 24px',
            textAlign:  'center' as const,
            fontFamily: SYS,
            fontSize:   14,
            color:      color.t4,
          }}>
            No Reality Gap data yet — run{' '}
            <code style={{ fontFamily: MONO, color: color.amber }}>/api/cron/reality-gaps</code>
            {' '}to populate the engine.
          </div>
        ) : (
          <div
            className="rg-columns"
            style={{
              display:             'grid',
              gridTemplateColumns: '1fr 1fr',
              gap:                 32,
              alignItems:          'start',
            }}
          >
            {/* LEFT — Overperformers */}
            <div>
              <ColumnHeader
                label="AHEAD OF NARRATIVE"
                sublabel="Satellite + permits show more activity than announced"
                accent={color.green}
                count={overperformers.length}
              />
              {overperformers.length === 0 ? (
                <EmptyColumn message="No markets currently ahead of their official narrative." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {overperformers.map(row => (
                    <MetroCard key={row.metro_code} row={row} side="ahead" />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Underperformers */}
            <div>
              <ColumnHeader
                label="BEHIND NARRATIVE"
                sublabel="Official momentum is high but ground signals are weakening"
                accent={color.red}
                count={underperformers.length}
              />
              {underperformers.length === 0 ? (
                <EmptyColumn message="No markets currently lagging behind their official narrative." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {underperformers.map(row => (
                    <MetroCard key={row.metro_code} row={row} side="behind" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Methodology footnote */}
        {hasData && (
          <div style={{
            marginTop:    40,
            padding:      '14px 18px',
            background:   color.bg1,
            border:       `1px solid ${color.bd1}`,
            borderRadius: 10,
          }}>
            <p style={{
              fontFamily: SYS,
              fontSize:   12,
              color:      color.t4,
              lineHeight: 1.7,
            }}>
              Reality Gap = observed score − official score (−100 to +100). Observed
              signals: Sentinel-2 BSI 90-day delta (45%), permit amendment cadence (35%),
              WARN Act metro stress (20%). Official signals: permit valuation (45%),
              federal award obligation (35%), announced milestones (20%). Classifications:
              ON_TRACK (gap ≥ −15) · LAGGING (−50 ≤ gap &lt; −15) · STALLED (gap &lt; −50) ·
              GHOST (gap &lt; −25, observed ≤ 20).{' '}
              <Link href="/methodology" style={{ color: color.amber }}>
                Full methodology →
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
