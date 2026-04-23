'use client'

import type { EntityType, WatchlistItem, WatchAddPayload } from './watchlist'

// =============================================================================
// Browser-side helpers for the server-persisted watchlist.
//
// Storing the API key in localStorage (never in cookies) keeps it off server
// requests until the user explicitly wants to hit an authenticated endpoint,
// mirroring the posture of the rest of the (deliberately open) product.
// =============================================================================

export const API_KEY_STORAGE_KEY = 'constructaiq_api_key'
export const WATCHLIST_EVENT     = 'constructaiq:watchlist'

export interface WatchlistEventDetail {
  action: 'add' | 'remove' | 'refresh'
  item?:  WatchlistItem
  id?:    number
}

// ── API-key storage ──────────────────────────────────────────────────────────

export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(API_KEY_STORAGE_KEY, key)
  window.dispatchEvent(
    new CustomEvent<WatchlistEventDetail>(WATCHLIST_EVENT, { detail: { action: 'refresh' } }),
  )
}

export function clearStoredApiKey(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(API_KEY_STORAGE_KEY)
  window.dispatchEvent(
    new CustomEvent<WatchlistEventDetail>(WATCHLIST_EVENT, { detail: { action: 'refresh' } }),
  )
}

// ── Fetch helpers ────────────────────────────────────────────────────────────

export class WatchlistError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function requestJson<T>(
  input:  string,
  init:   RequestInit,
  apiKey: string,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      'x-api-key':   apiKey,
      'content-type': 'application/json',
    },
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) msg = body.error
    } catch {
      /* empty body */
    }
    throw new WatchlistError(msg, res.status)
  }

  return (await res.json()) as T
}

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const key = getStoredApiKey()
  if (!key) return []
  const data = await requestJson<{ items: WatchlistItem[] }>(
    '/api/watchlist',
    { method: 'GET' },
    key,
  )
  return data.items
}

export async function addToWatchlist(payload: WatchAddPayload): Promise<WatchlistItem> {
  const key = getStoredApiKey()
  if (!key) throw new WatchlistError('API key required.', 401)
  const data = await requestJson<{ item: WatchlistItem }>(
    '/api/watchlist',
    { method: 'POST', body: JSON.stringify(payload) },
    key,
  )
  window.dispatchEvent(
    new CustomEvent<WatchlistEventDetail>(WATCHLIST_EVENT, {
      detail: { action: 'add', item: data.item },
    }),
  )
  return data.item
}

export async function removeFromWatchlist(id: number): Promise<void> {
  const key = getStoredApiKey()
  if (!key) throw new WatchlistError('API key required.', 401)
  await requestJson<{ deleted: number }>(
    `/api/watchlist/${id}`,
    { method: 'DELETE' },
    key,
  )
  window.dispatchEvent(
    new CustomEvent<WatchlistEventDetail>(WATCHLIST_EVENT, {
      detail: { action: 'remove', id },
    }),
  )
}

// ── Local lookup helper ──────────────────────────────────────────────────────

export function findWatchlistEntry(
  items: WatchlistItem[],
  entityType: EntityType,
  entityId: string,
): WatchlistItem | undefined {
  const normalized =
    entityType === 'metro' || entityType === 'state' || entityType === 'federal'
      ? entityId.toUpperCase()
      : entityId
  return items.find(
    i => i.entity_type === entityType && i.entity_id === normalized,
  )
}
