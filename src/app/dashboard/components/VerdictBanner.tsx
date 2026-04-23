'use client'
import { useEffect, useState } from 'react'
import { color, font } from '@/lib/theme'
import { Skeleton } from '@/app/components/Skeleton'
import type { MarketVerdict } from '@/app/api/verdict/route'

const CACHE_KEY = 'caiq_verdict_v1'
const CACHE_TTL = 4 * 60 * 60 * 1000 // 4 hours

function loadCache(): MarketVerdict | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { verdict, ts } = JSON.parse(raw) as { verdict: MarketVerdict; ts: number }
    return Date.now() - ts < CACHE_TTL ? verdict : null
  } catch { return null }
}

function saveCache(verdict: MarketVerdict) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ verdict, ts: Date.now() })) }
  catch { /* non-fatal */ }
}

function verdictColor(overall: MarketVerdict['overall']): string {
  if (overall === 'EXPAND')   return color.green
  if (overall === 'CONTRACT') return color.red
  return color.amber
}

function verdictBg(overall: MarketVerdict['overall']): string {
  if (overall === 'EXPAND')   return color.green   + '15'
  if (overall === 'CONTRACT') return color.red     + '15'
  return color.amber + '15'
}

export function VerdictBanner() {
  const [verdict, setVerdict] = useState<MarketVerdict | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      setVerdict(cached)
      setLoading(false)
      return
    }
    fetch('/api/verdict')
      .then(r => r.ok ? r.json() as Promise<MarketVerdict> : null)
      .then(v => {
        if (v) { saveCache(v); setVerdict(v) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <Skeleton height={72} borderRadius={12} style={{ marginBottom: 20 }} />
  }
  if (!verdict) return null

  const sig = verdictColor(verdict.overall)
  const bg  = verdictBg(verdict.overall)
  const ts  = new Date(verdict.as_of).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      role="status"
      aria-label={`Market verdict: ${verdict.overall}`}
      style={{
        height:       72,
        display:      'flex',
        alignItems:   'center',
        gap:          20,
        background:   bg,
        border:       `1px solid ${sig}44`,
        borderLeft:   `4px solid ${sig}`,
        borderRadius: 12,
        padding:      '0 20px',
        marginBottom: 20,
        overflow:     'hidden',
      }}
    >
      {/* Verdict badge */}
      <span style={{
        fontFamily:    font.mono,
        fontSize:      13,
        fontWeight:    700,
        color:         sig,
        letterSpacing: '0.08em',
        flexShrink:    0,
        minWidth:      80,
      }}>
        {verdict.overall}
      </span>

      {/* Headline */}
      <span style={{
        fontFamily:  font.sys,
        fontSize:    15,
        lineHeight:  1.45,
        color:       color.t1,
        flex:        1,
        overflow:    'hidden',
        display:     '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {verdict.headline}
      </span>

      {/* Confidence + time */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'flex-end',
        gap:           3,
        flexShrink:    0,
      }}>
        <span style={{
          fontFamily:    font.mono,
          fontSize:      11,
          color:         color.t4,
          letterSpacing: '0.06em',
        }}>
          {verdict.confidence} CONFIDENCE
        </span>
        <span style={{ fontFamily: font.mono, fontSize: 10, color: color.t4 }}>
          Updated {ts}
        </span>
      </div>
    </div>
  )
}
