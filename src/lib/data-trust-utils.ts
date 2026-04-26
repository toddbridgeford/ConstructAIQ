// Pure helpers for DataTrustBadge — no theme imports, no React imports, no DOM.
// Components import these and map the returned identifiers to colors/icons.
// Rule: everything here must be unit-testable in a node-only Vitest environment.

export type DataStatus =
  | 'fresh'
  | 'stale'
  | 'delayed'
  | 'failed'
  | 'fallback'
  | 'unknown'

export type DataType =
  | 'actual'
  | 'forecast'
  | 'derived'
  | 'ai-generated'
  | 'fallback'

export interface DataTrustMeta {
  source:         string
  cadence?:       string
  unit?:          string
  dataAsOf?:      string    // ISO date of the source observation
  lastRefreshed?: string    // ISO timestamp when ConstructAIQ last fetched
  status:         DataStatus
  qualityScore?:  number    // 0–100 (accuracy / confidence)
  type:           DataType
  caveat?:        string    // short honest caveat shown to users
}

export const TYPE_LABELS: Record<DataType, string> = {
  actual:         'Actual',
  forecast:       'Forecast',
  derived:        'Derived',
  'ai-generated': 'AI-generated',
  fallback:       'Fallback',
}

export const STATUS_LABELS: Record<DataStatus, string> = {
  fresh:    'Fresh',
  stale:    'Stale',
  delayed:  'Delayed',
  failed:   'Failed',
  fallback: 'Fallback',
  unknown:  'Unknown',
}

/**
 * Format an ISO date string as "Apr 2026" for display in the badge.
 * Returns "unknown" if the date is missing or unparseable.
 */
export function formatDataAsOf(iso?: string | null): string {
  if (!iso) return 'unknown'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  } catch {
    return iso
  }
}

/**
 * Format an ISO timestamp as a relative time string ("2h ago", "3d ago").
 * Returns "unknown" if the timestamp is missing or unparseable.
 */
export function formatRefreshed(iso?: string | null): string {
  if (!iso) return 'unknown'
  try {
    const ms = Date.now() - new Date(iso).getTime()
    if (isNaN(ms)) return iso
    if (ms < 0)            return 'just now'
    const mins = Math.floor(ms / 60_000)
    if (mins < 2)          return 'just now'
    if (mins < 60)         return `${mins}m ago`
    const hrs = Math.floor(ms / 3_600_000)
    if (hrs < 24)          return `${hrs}h ago`
    const days = Math.floor(ms / 86_400_000)
    return `${days}d ago`
  } catch {
    return iso
  }
}

/**
 * Derive a DataStatus from the age of a source timestamp.
 *   < 24 h  → fresh
 *   < 7 d   → stale
 *   ≥ 7 d   → delayed
 *   missing → unknown
 */
export function statusFromAge(isoDate?: string | null): DataStatus {
  if (!isoDate) return 'unknown'
  try {
    const ms = Date.now() - new Date(isoDate).getTime()
    if (isNaN(ms))                  return 'unknown'
    if (ms < 0)                     return 'fresh'     // clock skew
    if (ms < 24 * 3_600_000)        return 'fresh'
    if (ms < 7  * 24 * 3_600_000)   return 'stale'
    return 'delayed'
  } catch {
    return 'unknown'
  }
}

/** Map the federal provenance state (from dashboardProvenance.ts) to DataStatus. */
export type FederalProvenanceState = 'loading' | 'live' | 'cached' | 'fallback' | 'error'

export function statusFromFederalProvenance(
  state: FederalProvenanceState,
): DataStatus {
  switch (state) {
    case 'live':     return 'fresh'
    case 'cached':   return 'stale'
    case 'fallback': return 'fallback'
    case 'error':    return 'failed'
    case 'loading':  return 'unknown'
  }
}
