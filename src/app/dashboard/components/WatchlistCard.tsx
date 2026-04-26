'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, Trash2 } from 'lucide-react'
import { color, font } from '@/lib/theme'
import type { WatchlistItem } from '@/lib/watchlist'
import {
  fetchWatchlist,
  getStoredApiKey,
  removeFromWatchlist,
  setStoredApiKey,
  WATCHLIST_EVENT,
  type WatchlistEventDetail,
} from '@/lib/watchlistClient'
import { removeMarket } from '@/lib/preferences'

interface ScoreSummary {
  score:          number
  classification: string
  confidence:     string
}

const CLASS_COLOR: Record<string, string> = {
  FORMATION:   color.green,
  BUILDING:    color.greenMuted,
  STABLE:      color.amber,
  COOLING:     color.orange,
  CONTRACTING: color.red,
}

const TYPE_LABEL: Record<string, string> = {
  metro:   'Metro',
  state:   'State',
  project: 'Project',
  federal: 'Federal',
}

function relativeTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(delta) || delta < 0) return 'just now'
  const min = Math.floor(delta / 60_000)
  if (min < 1)    return 'just now'
  if (min < 60)   return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24)    return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 30)     return `${d}d ago`
  const mo = Math.floor(d / 30)
  return `${mo}mo ago`
}

export function WatchlistCard() {
  const [items,    setItems]    = useState<WatchlistItem[] | null>(null)
  const [scores,   setScores]   = useState<Record<string, ScoreSummary>>({})
  const [hasKey,   setHasKey]   = useState<boolean>(false)
  const [keyDraft, setKeyDraft] = useState<string>('')
  const [loading,  setLoading]  = useState<boolean>(true)
  const [error,    setError]    = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const key = getStoredApiKey()
    setHasKey(Boolean(key))
    if (!key) {
      setItems([])
      setLoading(false)
      return
    }
    setError(null)
    try {
      const list = await fetchWatchlist()
      setItems(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load watchlist.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const handler = (_e: Event) => { void refresh() }
    window.addEventListener(WATCHLIST_EVENT, handler)
    return () => window.removeEventListener(WATCHLIST_EVENT, handler)
  }, [refresh])

  // Fetch opportunity scores for all metro entries (one request each, in parallel).
  const metroIds = useMemo(
    () => (items ?? [])
      .filter(i => i.entity_type === 'metro')
      .map(i => i.entity_id),
    [items],
  )

  useEffect(() => {
    if (metroIds.length === 0) return
    let cancelled = false
    Promise.all(
      metroIds.map(async id => {
        try {
          const r = await fetch(`/api/opportunity-score?metro=${encodeURIComponent(id)}`)
          if (!r.ok) return [id, null] as const
          const d = await r.json()
          if (typeof d?.score !== 'number') return [id, null] as const
          return [id, {
            score:          d.score,
            classification: d.classification,
            confidence:     d.confidence,
          }] as const
        } catch {
          return [id, null] as const
        }
      }),
    ).then(entries => {
      if (cancelled) return
      const next: Record<string, ScoreSummary> = {}
      for (const [id, s] of entries) if (s) next[id] = s
      setScores(next)
    })
    return () => { cancelled = true }
  }, [metroIds])

  async function handleRemove(item: WatchlistItem) {
    try {
      await removeFromWatchlist(item.id)
      setItems(prev => (prev ?? []).filter(i => i.id !== item.id))
      if (item.entity_type === 'metro') removeMarket(item.entity_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove entry.')
    }
  }

  function handleSaveKey() {
    const trimmed = keyDraft.trim()
    if (!trimmed.startsWith('caiq_')) {
      setError('API keys start with "caiq_". Check your key and try again.')
      return
    }
    setStoredApiKey(trimmed)
    setKeyDraft('')
    setHasKey(true)
    setLoading(true)
    void refresh()
  }

  const shell = (children: React.ReactNode) => (
    <div
      style={{
        background:   color.bg1,
        border:       `1px solid ${color.bd1}`,
        borderRadius: 14,
        padding:      24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Eye size={14} strokeWidth={2.2} color={color.amber} />
        <div style={{
          fontFamily:    font.mono, fontSize: 11, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: color.t3,
        }}>
          Your Watchlist
        </div>
      </div>
      {children}
    </div>
  )

  if (loading) {
    return shell(
      <div style={{ fontFamily: font.mono, fontSize: 12, color: color.t4 }}>
        Loading…
      </div>,
    )
  }

  if (!hasKey) {
    return shell(
      <div>
        <p style={{
          fontFamily: font.sys, fontSize: 14, lineHeight: 1.5,
          color: color.t2, margin: '0 0 14px',
        }}>
          Save the metros, states, projects, and federal rows you care about.
          Your watchlist syncs across every device signed in with your free API key.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="password"
            value={keyDraft}
            onChange={e => setKeyDraft(e.target.value)}
            placeholder="Paste your API key (caiq_…)"
            onKeyDown={e => { if (e.key === 'Enter') handleSaveKey() }}
            style={{
              flex:         '1 1 220px',
              minWidth:     0,
              padding:      '8px 10px',
              fontFamily:   font.mono,
              fontSize:     12,
              color:        color.t1,
              background:   color.bg2,
              border:       `1px solid ${color.bd1}`,
              borderRadius: 8,
            }}
          />
          <button
            type="button"
            onClick={handleSaveKey}
            style={{
              padding:      '8px 14px',
              fontFamily:   font.mono,
              fontSize:     12,
              fontWeight:   600,
              letterSpacing: '0.04em',
              color:        color.bg0,
              background:   color.amber,
              border:       `1px solid ${color.amber}`,
              borderRadius: 8,
              cursor:       'pointer',
            }}
          >
            Connect
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 10, fontFamily: font.mono, fontSize: 11, color: color.red }}>
            {error}
          </div>
        )}
      </div>,
    )
  }

  if (!items || items.length === 0) {
    return shell(
      <div style={{ fontFamily: font.sys, fontSize: 14, color: color.t3, lineHeight: 1.5 }}>
        Nothing watched yet. Tap <strong style={{ color: color.amber }}>Watch</strong> on any
        metro, state, project, or federal row to pin it here.
      </div>,
    )
  }

  return shell(
    <div>
      {error && (
        <div style={{
          fontFamily: font.mono, fontSize: 11, color: color.red, marginBottom: 10,
        }}>
          {error}
        </div>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map(item => {
          const score = item.entity_type === 'metro' ? scores[item.entity_id] ?? null : null
          const cls   = score?.classification ?? null
          const cColor = cls ? CLASS_COLOR[cls] ?? color.t3 : color.t3
          const lastSignal = (item.last_signal && typeof item.last_signal === 'object')
            ? ((item.last_signal as Record<string, unknown>).summary as string | undefined)
            : undefined

          return (
            <li
              key={item.id}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           14,
                padding:       '10px 0',
                borderBottom:  `1px solid ${color.bd1}`,
              }}
            >
              {/* Entity type badge */}
              <span style={{
                flexShrink:    0,
                fontFamily:    font.mono,
                fontSize:      9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color:         color.t4,
                border:        `1px solid ${color.bd1}`,
                borderRadius:  4,
                padding:       '2px 6px',
              }}>
                {TYPE_LABEL[item.entity_type] ?? item.entity_type}
              </span>

              {/* Label + id */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily:    font.sys,
                  fontSize:      13,
                  fontWeight:    600,
                  color:         color.t1,
                  whiteSpace:    'nowrap',
                  overflow:      'hidden',
                  textOverflow:  'ellipsis',
                }}>
                  {item.entity_label}
                </div>
                <div style={{
                  fontFamily: font.mono,
                  fontSize:   10,
                  color:      color.t4,
                  marginTop:  2,
                }}>
                  {item.entity_id} · added {relativeTime(item.added_at)}
                  {lastSignal ? ` · ${lastSignal}` : ''}
                </div>
              </div>

              {/* Score pill (metros only) */}
              {item.entity_type === 'metro' && (
                <div style={{
                  display:      'flex',
                  flexDirection: 'column',
                  alignItems:   'flex-end',
                  gap:          2,
                  minWidth:     72,
                }}>
                  <span style={{
                    fontFamily: font.mono, fontSize: 14, fontWeight: 700,
                    color:      score ? cColor : color.t4,
                    lineHeight: 1,
                  }}>
                    {score ? score.score : '—'}
                  </span>
                  <span style={{
                    fontFamily: font.mono, fontSize: 9, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: color.t4,
                  }}>
                    {cls ?? 'score pending'}
                  </span>
                </div>
              )}

              {/* Remove */}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                aria-label={`Remove ${item.entity_label} from watchlist`}
                title="Remove"
                style={{
                  flexShrink:   0,
                  background:   'transparent',
                  border:       `1px solid transparent`,
                  borderRadius: 6,
                  padding:      6,
                  cursor:       'pointer',
                  color:        color.t4,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = color.red; e.currentTarget.style.borderColor = color.bd1 }}
                onMouseLeave={e => { e.currentTarget.style.color = color.t4; e.currentTarget.style.borderColor = 'transparent' }}
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </li>
          )
        })}
      </ul>
    </div>,
  )
}
