'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Eye, Plus } from 'lucide-react'
import { color, font } from '@/lib/theme'
import type { EntityType } from '@/lib/watchlist'
import {
  addToWatchlist,
  findWatchlistEntry,
  fetchWatchlist,
  getStoredApiKey,
  removeFromWatchlist,
  setStoredApiKey,
  WATCHLIST_EVENT,
  WatchlistError,
  type WatchlistEventDetail,
} from '@/lib/watchlistClient'
import { addMarket, removeMarket } from '@/lib/preferences'

type Size = 'sm' | 'md'

interface WatchButtonProps {
  entityType:  EntityType
  entityId:    string
  entityLabel: string
  size?:       Size
  /** Optional label override; defaults are tuned per-size. */
  labelWatch?:   string
  labelWatched?: string
}

/**
 * Toggle-style button that adds/removes an entity from the authenticated
 * user's server-persisted watchlist. Falls back to a "link to API key"
 * affordance when no key is stored locally.
 *
 * For metro entities the click also mirrors into the legacy preferences.markets
 * store so the existing RecommendationsCard keeps working without changes.
 */
export function WatchButton({
  entityType,
  entityId,
  entityLabel,
  size = 'sm',
  labelWatch,
  labelWatched,
}: WatchButtonProps) {
  const [hasKey,     setHasKey]     = useState<boolean>(false)
  const [entryId,    setEntryId]    = useState<number | null>(null)
  const [busy,       setBusy]       = useState<boolean>(false)
  const [hovering,   setHovering]   = useState<boolean>(false)
  const [error,      setError]      = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState<boolean>(false)
  const lastSyncRef = useRef<string>('')

  const normalizedId =
    entityType === 'metro' || entityType === 'state' || entityType === 'federal'
      ? entityId.toUpperCase()
      : entityId

  // Load initial state: API key + whether this entity is already watched
  const refresh = useCallback(async () => {
    const key = getStoredApiKey()
    setHasKey(Boolean(key))
    if (!key) {
      setEntryId(null)
      return
    }
    const sig = `${key}:${entityType}:${normalizedId}`
    if (lastSyncRef.current === sig) return
    lastSyncRef.current = sig
    try {
      const items = await fetchWatchlist()
      const match = findWatchlistEntry(items, entityType, normalizedId)
      setEntryId(match?.id ?? null)
    } catch {
      // Key might have been revoked server-side — stay in no-entry state.
      setEntryId(null)
    }
  }, [entityType, normalizedId])

  useEffect(() => {
    refresh()
    const handler = () => {
      lastSyncRef.current = ''
      refresh()
    }
    window.addEventListener(WATCHLIST_EVENT, handler as EventListener)
    return () => window.removeEventListener(WATCHLIST_EVENT, handler as EventListener)
  }, [refresh])

  // Dismiss the "paste key" mini-popover on outside click
  const popoverRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!showPrompt) return
    const onDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPrompt(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showPrompt])

  const isWatched = entryId !== null

  async function toggle() {
    if (busy) return
    if (!hasKey) {
      setShowPrompt(v => !v)
      return
    }

    setBusy(true)
    setError(null)
    try {
      if (isWatched && entryId !== null) {
        await removeFromWatchlist(entryId)
        setEntryId(null)
        if (entityType === 'metro') removeMarket(normalizedId)
      } else {
        const item = await addToWatchlist({
          entity_type:  entityType,
          entity_id:    normalizedId,
          entity_label: entityLabel,
        })
        setEntryId(item.id)
        if (entityType === 'metro') addMarket(normalizedId)
      }
    } catch (err) {
      if (err instanceof WatchlistError && err.status === 401) {
        setError('Your stored API key was rejected. Please re-enter it.')
        setHasKey(false)
        setShowPrompt(true)
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setBusy(false)
    }
  }

  function handlePromptSave(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return
    if (!trimmed.startsWith('caiq_')) {
      setError('API keys start with "caiq_". Check your key and try again.')
      return
    }
    setStoredApiKey(trimmed)
    setHasKey(true)
    setShowPrompt(false)
    setError(null)
    // Immediately attempt the add that the user originally intended
    void (async () => {
      setBusy(true)
      try {
        const item = await addToWatchlist({
          entity_type:  entityType,
          entity_id:    normalizedId,
          entity_label: entityLabel,
        })
        setEntryId(item.id)
        if (entityType === 'metro') addMarket(normalizedId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save to watchlist.')
      } finally {
        setBusy(false)
      }
    })()
  }

  const baseStyle: React.CSSProperties = {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          6,
    fontFamily:   font.mono,
    fontWeight:   600,
    letterSpacing: '0.04em',
    borderRadius: 8,
    cursor:       busy ? 'wait' : 'pointer',
    transition:   'all 0.15s ease',
    flexShrink:   0,
  }

  const sizeStyle: React.CSSProperties =
    size === 'md'
      ? { fontSize: 12, padding: '8px 14px', minHeight: 34 }
      : { fontSize: 11, padding: '5px 10px', minHeight: 28 }

  const watchedStyle: React.CSSProperties = hovering
    ? { background: 'transparent', border: `1px solid ${color.red}`, color: color.red }
    : { background: color.amber + '22', border: `1px solid ${color.amber}`, color: color.amber }

  const unwatchedStyle: React.CSSProperties = {
    background: 'transparent',
    border:     `1px solid ${color.bd1}`,
    color:      color.t3,
  }

  const watchLabel   = labelWatch   ?? 'Watch'
  const watchedLabel = labelWatched ?? 'Watching'

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={toggle}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        disabled={busy}
        aria-pressed={isWatched}
        title={
          !hasKey
            ? 'Sign in with an API key to save this watchlist entry across devices'
            : isWatched
              ? `Stop watching ${entityLabel}`
              : `Watch ${entityLabel}`
        }
        style={{ ...baseStyle, ...sizeStyle, ...(isWatched ? watchedStyle : unwatchedStyle) }}
      >
        {isWatched
          ? <Check size={size === 'md' ? 14 : 12} strokeWidth={2.2} />
          : <Eye   size={size === 'md' ? 14 : 12} strokeWidth={2} />}
        {isWatched
          ? (hovering ? 'Remove' : watchedLabel)
          : watchLabel}
        {!isWatched && !hasKey && (
          <Plus size={size === 'md' ? 12 : 10} strokeWidth={2} style={{ opacity: 0.7 }} />
        )}
      </button>

      {showPrompt && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Connect API key"
          style={{
            position:   'absolute',
            top:        'calc(100% + 8px)',
            right:      0,
            zIndex:     50,
            width:      300,
            padding:    16,
            borderRadius: 12,
            background:   color.bg2,
            border:       `1px solid ${color.bd2}`,
            boxShadow:    '0 12px 32px rgba(0,0,0,0.38)',
            fontFamily:   font.sys,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: color.t1, marginBottom: 6 }}>
            Connect your API key
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.45, color: color.t3, marginBottom: 10 }}>
            Watchlists sync across devices. Paste your free ConstructAIQ API key
            — or{' '}
            <Link href="/api-access" style={{ color: color.amber, textDecoration: 'underline' }}>
              get one here
            </Link>
            .
          </div>
          <input
            type="password"
            placeholder="caiq_…"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handlePromptSave((e.target as HTMLInputElement).value)
            }}
            style={{
              width:      '100%',
              padding:    '8px 10px',
              fontFamily: font.mono,
              fontSize:   12,
              color:      color.t1,
              background: color.bg1,
              border:     `1px solid ${color.bd1}`,
              borderRadius: 6,
              marginBottom: 10,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowPrompt(false)}
              style={{
                fontFamily: font.mono,
                fontSize:   11,
                padding:    '5px 10px',
                border:     `1px solid ${color.bd1}`,
                borderRadius: 6,
                background: 'transparent',
                color:      color.t3,
                cursor:     'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={e => {
                const input = (e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement | null)
                handlePromptSave(input?.value ?? '')
              }}
              style={{
                fontFamily: font.mono,
                fontSize:   11,
                padding:    '5px 12px',
                border:     `1px solid ${color.amber}`,
                borderRadius: 6,
                background: color.amber,
                color:      color.bg0,
                cursor:     'pointer',
                fontWeight: 600,
              }}
            >
              Save
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 8, fontFamily: font.mono, fontSize: 10, color: color.red }}>
              {error}
            </div>
          )}
        </div>
      )}

      {error && !showPrompt && (
        <div
          style={{
            position:   'absolute',
            top:        'calc(100% + 6px)',
            right:      0,
            fontFamily: font.mono,
            fontSize:   10,
            color:      color.red,
            maxWidth:   280,
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
