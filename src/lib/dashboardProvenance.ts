// Pure helpers that decide how UI surfaces should label provenance / fallback
// states based on the API response shape. Extracted from the React components
// so they can be unit-tested in the existing node-only Vitest environment.
//
// No theme imports, no React imports, no DOM. Components import these and
// translate the returned string identifiers into colors / icons / copy.

// ── Weekly Brief ──────────────────────────────────────────────────────────────

export type WeeklyBriefBadgeKind = 'ai' | 'editorial' | 'unavailable'

export interface WeeklyBriefBadge {
  kind:        WeeklyBriefBadgeKind
  label:       string
  /** True when no brief content can be rendered and the surface should
   *  show an explicit unavailable panel instead of a loading shimmer. */
  unavailable: boolean
}

/**
 * Decide which badge to surface and whether to show the unavailable panel.
 *
 *  - `briefText` non-empty + `source` 'ai'              → AI badge, content shown
 *  - `briefText` non-empty + any other source           → EDITORIAL badge
 *  - `briefText` missing and source 'static-fallback'   → UNAVAILABLE badge, panel
 *  - `briefText` missing and source unknown / undefined → loading shimmer
 *    (caller decides; this returns `unavailable: false`)
 */
export function weeklyBriefBadge(input: {
  briefText?: string | null | undefined
  source?:    'ai' | 'static' | 'static-fallback' | undefined
}): WeeklyBriefBadge {
  const hasText = !!input.briefText && input.briefText.length > 0
  const isFallback = input.source === 'static-fallback'

  if (!hasText) {
    if (isFallback) {
      return { kind: 'unavailable', label: 'UNAVAILABLE', unavailable: true }
    }
    // No content yet, not explicitly fallback — caller renders a loader
    return { kind: 'editorial', label: 'EDITORIAL', unavailable: false }
  }

  if (input.source === 'ai') {
    return { kind: 'ai', label: 'AI GENERATED', unavailable: false }
  }
  if (isFallback) {
    return { kind: 'unavailable', label: 'UNAVAILABLE', unavailable: true }
  }
  return { kind: 'editorial', label: 'EDITORIAL', unavailable: false }
}

// ── Federal data provenance ───────────────────────────────────────────────────

export type FederalProvenanceState =
  | 'loading'
  | 'live'
  | 'cached'
  | 'fallback'
  | 'error'

export interface FederalProvenance {
  state:     FederalProvenanceState
  /** One-line label suitable for a badge ("LIVE · USASpending.gov", "FALLBACK", ...) */
  label:     string
  /** Longer message for an inline banner. Only set for `cached` / `fallback` / `error`. */
  message?:  string
  /** ISO timestamp to display alongside the badge, when present in the payload. */
  cachedAt?: string
}

/**
 * Decide the provenance label for a `/api/federal` response. Used by both
 * the dashboard FederalSection banner and the standalone /federal page header
 * so both surfaces stay in sync.
 *
 * `null` → loading. Otherwise:
 *  - `error: true` (with `cached_at`)        → 'error' (cached fallback shown)
 *  - `dataSource: 'static-fallback'`         → 'fallback'
 *  - `fromCache: true`                       → 'cached'
 *  - everything else                         → 'live'
 */
export function federalProvenance(
  data: {
    dataSource?: string
    fromCache?:  boolean
    cached_at?:  string
    updatedAt?:  string
    error?:      boolean
  } | null,
): FederalProvenance {
  if (!data) {
    return { state: 'loading', label: 'LOADING' }
  }

  if (data.error) {
    return {
      state:    'error',
      label:    'CACHED · USASpending.gov',
      message:  'USASpending.gov returned an error. Showing most recently cached allocation data.',
      cachedAt: data.cached_at,
    }
  }

  if (data.dataSource === 'static-fallback') {
    return {
      state:   'fallback',
      label:   'STATIC FALLBACK',
      message:
        'USASpending.gov live feed is unavailable. Contractor and agency ' +
        'leaderboards are intentionally empty — they show real awards or ' +
        'nothing, never fabricated names.',
    }
  }

  if (data.fromCache) {
    return {
      state:    'cached',
      label:    'CACHED · USASpending.gov',
      cachedAt: data.cached_at ?? data.updatedAt,
    }
  }

  return { state: 'live', label: 'LIVE · USASpending.gov' }
}

// ── Forecast availability ─────────────────────────────────────────────────────

export type ForecastAvailability = 'loading' | 'available' | 'unavailable'

/**
 * Disambiguates "still loading" from "data finished loading and is genuinely
 * null". The dashboard page knows when the top-level fetch resolved
 * (`dashboardLoading` arg) — without that bit, ForecastChart would show its
 * skeleton forever when the forecast row is missing from Supabase.
 */
export function forecastAvailability(
  forecast: unknown | null,
  dashboardLoading: boolean,
): ForecastAvailability {
  if (dashboardLoading) return 'loading'
  if (forecast === null || forecast === undefined) return 'unavailable'
  return 'available'
}
