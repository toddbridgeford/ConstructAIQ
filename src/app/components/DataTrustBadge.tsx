'use client'
import { color, font } from '@/lib/theme'
import {
  formatDataAsOf,
  formatRefreshed,
  STATUS_LABELS,
  TYPE_LABELS,
  type DataStatus,
  type DataTrustMeta,
} from '@/lib/data-trust-utils'

// Theme-aware color maps — kept here so the pure utils stay node-testable.
const STATUS_DOT: Record<DataStatus, string> = {
  fresh:    color.green,
  stale:    color.amber,
  delayed:  color.amber,
  failed:   color.red,
  fallback: color.amber,
  unknown:  color.t4,
}

export interface DataTrustBadgeProps extends DataTrustMeta {
  /**
   * expanded: shows a second row with cadence, unit, quality bar, and caveat.
   * Default: false (single compact row).
   */
  expanded?: boolean
  /**
   * variant: dark (dashboard default) or light (homepage).
   * Default: 'dark'.
   */
  variant?: 'dark' | 'light'
}

function Sep({ variant }: { variant: 'dark' | 'light' }) {
  return (
    <span style={{
      display:    'inline-block',
      width:      1,
      height:     10,
      background: variant === 'dark' ? color.bd2 : '#d4d4d4',
      margin:     '0 6px',
      flexShrink: 0,
    }} />
  )
}

function QualityBar({ score }: { score: number }) {
  const segments = 8
  const filled   = Math.round((score / 100) * segments)
  const barColor = score >= 70 ? color.green : score >= 40 ? color.amber : color.red
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }} title={`Quality score: ${score}`}>
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          style={{
            width:        3,
            height:       8,
            borderRadius: 1,
            background:   i < filled ? barColor : color.bg3,
            display:      'inline-block',
          }}
        />
      ))}
      <span style={{ fontSize: 9, fontFamily: font.mono, color: barColor, marginLeft: 4 }}>
        {score}
      </span>
    </span>
  )
}

export function DataTrustBadge({
  source,
  cadence,
  unit,
  dataAsOf,
  lastRefreshed,
  status,
  qualityScore,
  type,
  caveat,
  expanded = false,
  variant  = 'dark',
}: DataTrustBadgeProps) {
  const dot     = STATUS_DOT[status]
  const isDark  = variant === 'dark'
  const tPri    = isDark ? color.t3 : '#555'
  const tSec    = isDark ? color.t4 : '#8a8a8a'
  const MONO    = font.mono

  const asOfLabel = formatDataAsOf(dataAsOf)

  return (
    <div style={{
      display:    'flex',
      flexDirection: 'column',
      gap:        expanded ? 5 : 0,
      fontFamily: MONO,
    }}>

      {/* ── Primary row ── */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        flexWrap:   'wrap',
        rowGap:     4,
      }}>
        {/* Status indicator */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, marginRight: 6 }}>
          <span style={{
            width:        5,
            height:       5,
            borderRadius: '50%',
            background:   dot,
            display:      'inline-block',
            flexShrink:   0,
          }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: dot, letterSpacing: '0.07em' }}>
            {STATUS_LABELS[status].toUpperCase()}
          </span>
        </span>

        <Sep variant={variant} />

        {/* Source */}
        <span style={{ fontSize: 10, color: tPri, fontWeight: 500 }}>{source}</span>

        <Sep variant={variant} />

        {/* Data type */}
        <span style={{
          fontSize:      9,
          fontWeight:    600,
          color:         tSec,
          letterSpacing: '0.06em',
          border:        `1px solid ${isDark ? color.bd2 : '#d4d4d4'}`,
          borderRadius:  3,
          padding:       '0px 4px',
          lineHeight:    '14px',
          display:       'inline-block',
        }}>
          {TYPE_LABELS[type].toUpperCase()}
        </span>

        {/* Observation date */}
        {asOfLabel !== 'unknown' && (
          <>
            <Sep variant={variant} />
            <span style={{ fontSize: 10, color: tSec }}>as of {asOfLabel}</span>
          </>
        )}

        {/* Last refreshed — only on single row if not expanded */}
        {!expanded && lastRefreshed && (
          <>
            <Sep variant={variant} />
            <span style={{ fontSize: 10, color: tSec }}>
              refreshed {formatRefreshed(lastRefreshed)}
            </span>
          </>
        )}
      </div>

      {/* ── Expanded second row ── */}
      {expanded && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingLeft: 14 }}>
          {cadence && (
            <span style={{ fontSize: 10, color: tSec }}>{cadence}</span>
          )}
          {unit && (
            <span style={{ fontSize: 10, color: tSec }}>{unit}</span>
          )}
          {lastRefreshed && (
            <span style={{ fontSize: 10, color: tSec }}>
              refreshed {formatRefreshed(lastRefreshed)}
            </span>
          )}
          {qualityScore !== undefined && (
            <QualityBar score={qualityScore} />
          )}
          {caveat && (
            <span style={{
              fontSize:   10,
              color:      color.amber,
              fontStyle:  'italic',
              lineHeight: 1.4,
              maxWidth:   320,
            }}>
              {caveat}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
