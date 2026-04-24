// =============================================================================
// Spend Propagation — forward-looking trade demand derived from high
// Formation Score projects.
//
// For each project scoring ≥ FORMATION_MIN_SCORE (BUILDING/FORMATION class):
//   1. Assign a spend release window: 90 / 180 / 360 days
//   2. Estimate a trade demand basket by building class
//      (residential → lumber/labor; commercial → steel/concrete)
//   3. Flag the metro window as tight if 3+ projects fall in the same bucket
//   4. Emit a 'trade_demand_signal' event when aggregate basket crosses threshold
//
// Pure computation only — no DB access. DB queries live in the API route.
// =============================================================================

export type SpendWindowKey = '90d' | '180d' | '360d'

export type Commodity =
  | 'lumber'
  | 'steel'
  | 'concrete'
  | 'copper'
  | 'labor_residential'
  | 'labor_commercial'

export type TightnessLevel = 'LOOSE' | 'MODERATE' | 'TIGHT' | 'VERY_TIGHT'
export type SignalStrength  = 'STRONG' | 'MODERATE' | 'WEAK'

export interface ProjectSpendInput {
  project_id:                number
  project_name:              string | null
  building_class:            string | null
  project_type:              string | null
  valuation:                 number | null
  formation_score:           number
  formation_confidence:      string
  days_since_last_amendment: number | null
}

export interface ProjectWindowSummary {
  project_id:      number
  project_name:    string | null
  formation_score: number
  building_class:  string | null
  valuation:       number | null
  window_reason:   string
}

export interface SpendWindowEntry {
  window:          SpendWindowKey
  project_count:   number
  total_valuation: number     // USD
  is_tight:        boolean    // true when project_count >= TIGHT_THRESHOLD
  projects:        ProjectWindowSummary[]
}

export interface TradeBasket {
  commodity:       Commodity
  label:           string
  window:          SpendWindowKey
  estimated_value: number   // USD
  project_count:   number
  pct_of_window:   number   // 0–1 fraction of window's total valuation
  signal_strength: SignalStrength
}

export interface TightnessScore {
  score:         number          // 0–100
  level:         TightnessLevel
  hot_window:    SpendWindowKey | null
  driver:        string
  tight_windows: SpendWindowKey[]  // windows with 3+ projects
}

export interface SpendPropagationResult {
  metro_code:          string
  as_of:               string
  formation_threshold: number
  project_count:       number
  spend_windows:       SpendWindowEntry[]
  trade_baskets:       TradeBasket[]
  tightness_score:     TightnessScore
  signal_emitted:      boolean
  signal_detail:       string | null
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Minimum formation score to include in propagation analysis. */
export const FORMATION_MIN_SCORE = 60

/** A window is "tight" when this many or more projects fall into it. */
export const TIGHT_THRESHOLD = 3

/** 90-day basket value (USD) above which a trade_demand_signal is emitted. */
export const SIGNAL_THRESHOLD_90D = 10_000_000   // $10M

/** Total basket value (any window combo) above which a signal is emitted. */
export const SIGNAL_THRESHOLD_TOTAL = 25_000_000  // $25M

/** Projects above this valuation (USD) face extended mobilization timelines. */
const MEGA_PROJECT_THRESHOLD = 25_000_000

/** Urgency multipliers used for weighted tightness scoring. */
const WINDOW_URGENCY: Record<SpendWindowKey, number> = {
  '90d':  3,
  '180d': 2,
  '360d': 1,
}

// ── Trade allocation ratios ───────────────────────────────────────────────────
//
// Fraction of project valuation attributed to each commodity, by building class.
// Ratios are based on standard construction cost breakdowns (RSMeans / RICS data).
// Rows need not sum to 1.0 — the remainder goes to untracked categories
// (permits, overhead, contingency, design fees).

const ALLOCATIONS: Record<string, Partial<Record<Commodity, number>>> = {
  residential: {
    lumber:            0.22,
    labor_residential: 0.38,
    concrete:          0.12,
    copper:            0.08,
  },
  commercial: {
    steel:             0.28,
    concrete:          0.22,
    labor_commercial:  0.32,
    copper:            0.10,
  },
  industrial: {
    steel:             0.35,
    concrete:          0.25,
    labor_commercial:  0.25,
    copper:            0.15,
  },
  mixed: {
    lumber:            0.11,
    steel:             0.14,
    concrete:          0.17,
    labor_residential: 0.19,
    labor_commercial:  0.16,
    copper:            0.09,
  },
}

const DEFAULT_ALLOCATION: Partial<Record<Commodity, number>> = {
  steel:            0.18,
  concrete:         0.18,
  lumber:           0.12,
  labor_commercial: 0.22,
  copper:           0.08,
}

export const COMMODITY_LABELS: Record<Commodity, string> = {
  lumber:            'Lumber & Wood Products',
  steel:             'Structural Steel',
  concrete:          'Ready-Mix Concrete',
  copper:            'Copper & Wiring',
  labor_residential: 'Residential Trades Labor',
  labor_commercial:  'Commercial Trades Labor',
}

// ── Pure scoring helpers (exported for unit tests) ───────────────────────────

/**
 * Assign a spend release window based on formation score, amendment recency,
 * and project valuation.
 *
 * Decision logic:
 *   Mega (≥$25M):    high-score → 180d, otherwise → 360d (long mobilization)
 *   Score ≥ 75 + amendment ≤ 30d:  → 90d  (imminent)
 *   Score ≥ 60 + amendment ≤ 60d:  → 180d (moderate)
 *   Otherwise:                      → 360d (deferred)
 */
export function estimateSpendWindow(
  formationScore: number,
  daysSinceLastAmendment: number | null,
  valuation: number | null,
): SpendWindowKey {
  const isMega       = (valuation ?? 0) >= MEGA_PROJECT_THRESHOLD
  const recentActive = daysSinceLastAmendment !== null && daysSinceLastAmendment <= 30
  const moderActive  = daysSinceLastAmendment !== null && daysSinceLastAmendment <= 60

  if (isMega) return formationScore >= 70 ? '180d' : '360d'
  if (formationScore >= 75 && recentActive) return '90d'
  if (formationScore >= 60 && moderActive)  return '180d'
  return '360d'
}

/** Human-readable explanation of why a project was assigned its window. */
export function windowReason(
  formationScore: number,
  daysSinceLastAmendment: number | null,
  valuation: number | null,
  window: SpendWindowKey,
): string {
  const isMega = (valuation ?? 0) >= MEGA_PROJECT_THRESHOLD
  const valStr = valuation ? `$${(valuation / 1_000_000).toFixed(1)}M` : 'undisclosed value'

  if (isMega) {
    return window === '180d'
      ? `${valStr} mega-project — minimum 180-day mobilization pipeline`
      : `${valStr} mega-project with lower formation score — extended procurement cycle`
  }
  if (window === '90d') {
    return `Score ${formationScore} + permit activity ${daysSinceLastAmendment}d ago — imminent spend release`
  }
  if (window === '180d') {
    return daysSinceLastAmendment !== null
      ? `Score ${formationScore} + permit activity ${daysSinceLastAmendment}d ago — mid-cycle activation`
      : `Score ${formationScore} — mid-cycle formation, amendment cadence unknown`
  }
  return daysSinceLastAmendment !== null
    ? `Score ${formationScore} + ${daysSinceLastAmendment}d since last permit activity — deferred spend cycle`
    : `Score ${formationScore} — insufficient cadence signal, conservative window assigned`
}

// ── Aggregation functions ─────────────────────────────────────────────────────

/** Group projects into spend windows and return sorted window entries. */
export function buildSpendWindows(projects: ProjectSpendInput[]): SpendWindowEntry[] {
  const byWindow: Record<SpendWindowKey, ProjectWindowSummary[]> = {
    '90d': [], '180d': [], '360d': [],
  }
  const valuationByWindow: Record<SpendWindowKey, number> = {
    '90d': 0, '180d': 0, '360d': 0,
  }

  for (const p of projects) {
    const w      = estimateSpendWindow(p.formation_score, p.days_since_last_amendment, p.valuation)
    const reason = windowReason(p.formation_score, p.days_since_last_amendment, p.valuation, w)

    byWindow[w].push({
      project_id:      p.project_id,
      project_name:    p.project_name,
      formation_score: p.formation_score,
      building_class:  p.building_class,
      valuation:       p.valuation,
      window_reason:   reason,
    })
    valuationByWindow[w] += p.valuation ?? 0
  }

  return (['90d', '180d', '360d'] as SpendWindowKey[])
    .filter(w => byWindow[w].length > 0)
    .map(w => ({
      window:          w,
      project_count:   byWindow[w].length,
      total_valuation: Math.round(valuationByWindow[w]),
      is_tight:        byWindow[w].length >= TIGHT_THRESHOLD,
      // Sort descending by formation score within each window
      projects: byWindow[w].sort((a, b) => b.formation_score - a.formation_score),
    }))
}

/**
 * Derive trade demand baskets from the project set.
 * Each basket is a (commodity, window) pair with aggregated estimated spend.
 */
export function buildTradeBaskets(
  projects: ProjectSpendInput[],
  windows:  SpendWindowEntry[],
): TradeBasket[] {
  const basketAccum = new Map<string, { value: number; count: number }>()

  for (const p of projects) {
    const w         = estimateSpendWindow(p.formation_score, p.days_since_last_amendment, p.valuation)
    const valuation = p.valuation ?? 0
    const alloc     = ALLOCATIONS[p.building_class?.toLowerCase() ?? ''] ?? DEFAULT_ALLOCATION

    for (const [commodity, ratio] of Object.entries(alloc) as [Commodity, number][]) {
      const key     = `${commodity}::${w}`
      const current = basketAccum.get(key) ?? { value: 0, count: 0 }
      basketAccum.set(key, {
        value: current.value + valuation * ratio,
        count: current.count + 1,
      })
    }
  }

  const windowTotals = Object.fromEntries(
    windows.map(w => [w.window, w.total_valuation]),
  ) as Record<SpendWindowKey, number>

  const baskets: TradeBasket[] = []

  for (const [key, { value, count }] of basketAccum) {
    const [commodity, window] = key.split('::') as [Commodity, SpendWindowKey]
    const windowTotal         = windowTotals[window] ?? 1
    const pctOfWindow         = windowTotal > 0 ? value / windowTotal : 0

    baskets.push({
      commodity,
      label:           COMMODITY_LABELS[commodity],
      window,
      estimated_value: Math.round(value),
      project_count:   count,
      pct_of_window:   parseFloat(pctOfWindow.toFixed(3)),
      signal_strength: value >= 5_000_000 ? 'STRONG' : value >= 1_000_000 ? 'MODERATE' : 'WEAK',
    })
  }

  // Order: urgency of window first, then value descending within window
  return baskets.sort((a, b) => {
    const wDiff = WINDOW_URGENCY[b.window] - WINDOW_URGENCY[a.window]
    return wDiff !== 0 ? wDiff : b.estimated_value - a.estimated_value
  })
}

/** Compute metro capacity tightness from the assembled windows. */
export function computeTightness(windows: SpendWindowEntry[]): TightnessScore {
  const tightWindows = windows
    .filter(w => w.is_tight)
    .map(w => w.window)

  // Weighted project count: 90d counts 3x, 180d 2x, 360d 1x
  const weightedSum = windows.reduce(
    (s, w) => s + w.project_count * WINDOW_URGENCY[w.window],
    0,
  )

  // Normalize to 0–100: 30 weighted units maps to score 100
  const score = Math.min(100, Math.round((weightedSum / 30) * 100))

  const level: TightnessLevel =
    score >= 75 ? 'VERY_TIGHT' :
    score >= 50 ? 'TIGHT'      :
    score >= 25 ? 'MODERATE'   : 'LOOSE'

  // Hottest window = highest urgency-weighted project count
  const hotWindow = [...windows]
    .sort(
      (a, b) =>
        b.project_count * WINDOW_URGENCY[b.window] -
        a.project_count * WINDOW_URGENCY[a.window],
    )[0]?.window ?? null

  let driver: string
  if (tightWindows.length === 0) {
    driver =
      `No window has ${TIGHT_THRESHOLD}+ high-formation projects — ` +
      'metro capacity appears available'
  } else {
    const hw = windows.find(w => w.window === hotWindow)!
    driver =
      `${hw.project_count} high-formation projects in the ${hotWindow} window — ` +
      (score >= 75
        ? 'severe capacity constraint likely; book trades immediately'
        : score >= 50
          ? 'material and labor tightness expected; early procurement advised'
          : 'early capacity pressure forming; monitor bid spreads')
  }

  return { score, level, hot_window: hotWindow, driver, tight_windows: tightWindows }
}

/**
 * Determine whether a trade_demand_signal should be emitted for this metro.
 * Fires when the 90d basket exceeds SIGNAL_THRESHOLD_90D, or when the total
 * basket across all windows exceeds SIGNAL_THRESHOLD_TOTAL.
 */
export function shouldEmitSignal(
  windows:  SpendWindowEntry[],
  baskets:  TradeBasket[],
): { emit: boolean; reason: string; trigger_window: SpendWindowKey | null; total_value: number } {
  const window90      = windows.find(w => w.window === '90d')
  const total90Value  = baskets
    .filter(b => b.window === '90d')
    .reduce((s, b) => s + b.estimated_value, 0)
  const totalAllValue = baskets.reduce((s, b) => s + b.estimated_value, 0)

  if (window90 && total90Value >= SIGNAL_THRESHOLD_90D) {
    return {
      emit:           true,
      reason:         `$${(total90Value / 1_000_000).toFixed(1)}M in trade demand projected within 90 days across ${window90.project_count} project${window90.project_count === 1 ? '' : 's'}`,
      trigger_window: '90d',
      total_value:    total90Value,
    }
  }

  if (totalAllValue >= SIGNAL_THRESHOLD_TOTAL) {
    return {
      emit:           true,
      reason:         `$${(totalAllValue / 1_000_000).toFixed(1)}M total trade demand across all formation windows`,
      trigger_window: null,
      total_value:    totalAllValue,
    }
  }

  return { emit: false, reason: '', trigger_window: null, total_value: totalAllValue }
}
