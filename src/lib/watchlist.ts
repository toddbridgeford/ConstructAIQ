import { validateApiKey } from './auth'

// =============================================================================
// Shared types & guards for the /api/watchlist routes and the WatchlistCard
// =============================================================================

export const ENTITY_TYPES = ['metro', 'state', 'project', 'federal'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export interface WatchlistRow {
  id:            number
  api_key_hash:  string
  entity_type:   EntityType
  entity_id:     string
  entity_label:  string
  added_at:      string
  last_signal:   unknown
}

export interface WatchlistItem {
  id:           number
  entity_type:  EntityType
  entity_id:    string
  entity_label: string
  added_at:     string
  last_signal:  unknown
}

export interface WatchAddPayload {
  entity_type:  EntityType
  entity_id:    string
  entity_label: string
}

export function isEntityType(v: unknown): v is EntityType {
  return typeof v === 'string' && (ENTITY_TYPES as readonly string[]).includes(v)
}

/**
 * Extract + validate the caller's API key from an incoming request.
 * Returns the SHA-256 hex hash on success, or a Response describing the
 * failure that the caller can return as-is.
 */
export async function requireApiKeyHash(
  request: Request,
): Promise<{ keyHash: string } | { response: Response }> {
  const key = request.headers.get('x-api-key')

  if (!key) {
    return {
      response: Response.json(
        { error: 'API key required. Pass it in the x-api-key header.' },
        { status: 401 },
      ),
    }
  }

  if (!key.startsWith('caiq_')) {
    return {
      response: Response.json(
        { error: 'Invalid API key format.' },
        { status: 401 },
      ),
    }
  }

  const info = await validateApiKey(key)
  if (!info.valid || !info.key_hash) {
    return {
      response: Response.json(
        { error: info.error ?? 'Unauthorized' },
        { status: 401 },
      ),
    }
  }

  return { keyHash: info.key_hash }
}

/**
 * Normalize a raw `/api/watchlist` POST body — trims, uppercases metro/state
 * ids, length-caps the label, and rejects unknown entity_types.
 *
 * Returns either a clean payload or an error message.
 */
export function parseWatchPayload(
  raw: unknown,
): { ok: true; payload: WatchAddPayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Body must be a JSON object.' }
  }

  const r = raw as Record<string, unknown>

  if (!isEntityType(r.entity_type)) {
    return {
      ok: false,
      error: `entity_type must be one of: ${ENTITY_TYPES.join(', ')}`,
    }
  }

  const idRaw = typeof r.entity_id === 'string' ? r.entity_id.trim() : ''
  if (!idRaw) return { ok: false, error: 'entity_id is required.' }
  if (idRaw.length > 120) {
    return { ok: false, error: 'entity_id must be ≤ 120 characters.' }
  }

  const labelRaw = typeof r.entity_label === 'string' ? r.entity_label.trim() : ''
  if (!labelRaw) return { ok: false, error: 'entity_label is required.' }
  if (labelRaw.length > 200) {
    return { ok: false, error: 'entity_label must be ≤ 200 characters.' }
  }

  // Metro + state entity ids are always short codes — normalize to uppercase
  // so "phx" and "PHX" resolve to the same watchlist row.
  const entity_id =
    r.entity_type === 'metro' ||
    r.entity_type === 'state' ||
    r.entity_type === 'federal'
      ? idRaw.toUpperCase()
      : idRaw

  return {
    ok: true,
    payload: {
      entity_type:  r.entity_type,
      entity_id,
      entity_label: labelRaw,
    },
  }
}
