import { supabase } from './supabase'

// =============================================================================
// Opportunity Truth Index — metro-level opportunity score (0–100)
//
// The score is a weighted composite of six signals, each independently scored
// to 0–100 and then combined. The composite is clamped, rounded, and mapped
// to a five-band classification (FORMATION → CONTRACTING).
// =============================================================================

export type Classification =
  | 'FORMATION'
  | 'BUILDING'
  | 'STABLE'
  | 'COOLING'
  | 'CONTRACTING'

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

export type DriverSource = 'live' | 'fallback' | 'unavailable'

export interface ScoreDriver {
  id:      DriverId
  label:   string
  score:   number  // 0–100 integer
  weight:  number  // 0–1 (sum across drivers = 1)
  value:   number | null
  detail:  string
  source:  DriverSource
}

export type DriverId =
  | 'permit_trend'
  | 'federal_awards'
  | 'satellite_bsi'
  | 'lics'
  | 'warn_inverse'
  | 'sector_verdict'

export interface OpportunityScoreResult {
  metro_code:     string
  metro_name:     string | null
  state_code:     string | null
  msa_code:       string | null
  score:          number
  classification: Classification
  confidence:     Confidence
  drivers:        ScoreDriver[]
  top_drivers:    ScoreDriver[]
  computed_at:    string
  valid_through:  string
}

// Driver weights — must sum to 1.0
export const WEIGHTS: Record<DriverId, number> = {
  permit_trend:   0.25,
  federal_awards: 0.20,
  satellite_bsi:  0.20,
  lics:           0.15,
  warn_inverse:   0.10,
  sector_verdict: 0.10,
}

// Scores are valid for 24 hours after compute — matches the daily cron cadence.
export const CACHE_TTL_HOURS = 24

// ── Pure helpers (exported for unit testing) ─────────────────────────────────

export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n))
}

/**
 * Classify a composite 0–100 score into one of the five opportunity bands.
 * Band edges follow the spec: 80+ FORMATION, 60–79 BUILDING, 40–59 STABLE,
 * 20–39 COOLING, 0–19 CONTRACTING.
 */
export function classify(score: number): Classification {
  if (score >= 80) return 'FORMATION'
  if (score >= 60) return 'BUILDING'
  if (score >= 40) return 'STABLE'
  if (score >= 20) return 'COOLING'
  return 'CONTRACTING'
}

/**
 * Confidence is HIGH when 5+ drivers have live data, MEDIUM at 3–4, LOW below.
 */
export function classifyConfidence(liveCount: number): Confidence {
  if (liveCount >= 5) return 'HIGH'
  if (liveCount >= 3) return 'MEDIUM'
  return 'LOW'
}

/** Map a percent change to a 0–100 score, linear within the ±range band. */
export function scoreFromPct(pct: number | null, range = 20): number {
  if (pct === null || !Number.isFinite(pct)) return 50
  return clamp(50 + (pct / range) * 50)
}

/** Map a ratio (state/national) where 1.0 = neutral 50 to a 0–100 score. */
export function scoreFromRatio(ratio: number | null): number {
  if (ratio === null || !Number.isFinite(ratio) || ratio <= 0) return 50
  // 0.5x → 25, 1.0x → 50, 1.5x → 75, 2.0x+ → 100
  return clamp(50 * ratio)
}

/** Map BSI 90-day delta (raw decimal) to 0–100. ±0.05 spans the full range. */
export function scoreFromBsiDelta(delta: number | null): number {
  if (delta === null || !Number.isFinite(delta)) return 50
  return clamp(50 + (delta / 0.05) * 50)
}

/** More WARN notices in-state → worse opportunity. 0 notices = 100, 20+ = 0. */
export function scoreFromWarnCount(count: number | null): number {
  if (count === null || !Number.isFinite(count)) return 50
  return clamp(100 - count * 5)
}

export function sectorVerdictScore(
  verdict: 'EXPANDING' | 'STABLE' | 'CONTRACTING' | null,
): number {
  if (verdict === 'EXPANDING')   return 75
  if (verdict === 'CONTRACTING') return 25
  return 50
}

/** Weighted composite across all driver scores, rounded to int 0–100. */
export function compositeScore(drivers: ScoreDriver[]): number {
  const total = drivers.reduce((s, d) => s + d.score * d.weight, 0)
  return Math.round(clamp(total))
}

/** Pick the three drivers furthest from neutral (50) — these moved the dial most. */
export function pickTopDrivers(drivers: ScoreDriver[]): ScoreDriver[] {
  return [...drivers]
    .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
    .slice(0, 3)
}

// ── Data-fetch helpers ───────────────────────────────────────────────────────

interface MetroSource {
  city_code:  string
  city_name:  string
  state_code: string
  msa_code:   string | null
}

async function fetchMetroSource(metroCode: string): Promise<MetroSource | null> {
  try {
    const { data } = await supabase
      .from('permit_sources')
      .select('city_code, city_name, state_code, msa_code')
      .eq('city_code', metroCode)
      .maybeSingle()
    if (data) return data as MetroSource
    return null
  } catch {
    return null
  }
}

interface MonthlyAgg { year_month: string; permit_count: number }

async function fetchPermitHistory(cityCode: string): Promise<MonthlyAgg[]> {
  try {
    const { data } = await supabase
      .from('permit_monthly_agg')
      .select('year_month, permit_count')
      .eq('city_code', cityCode)
      .eq('permit_type', 'all')
      .eq('permit_class', 'all')
      .order('year_month', { ascending: false })
      .limit(24)
    return (data ?? []).reverse() as MonthlyAgg[]
  } catch {
    return []
  }
}

interface BsiRow { bsi_change_90d: number | null; observation_date: string }

async function fetchBsi(msaCode: string | null): Promise<BsiRow | null> {
  if (!msaCode) return null
  try {
    const { data } = await supabase
      .from('satellite_bsi')
      .select('bsi_change_90d, observation_date')
      .eq('msa_code', msaCode)
      .order('observation_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data as BsiRow | null) ?? null
  } catch {
    return null
  }
}

interface FederalJson {
  stateAllocations?: { state: string; obligated: number }[]
}
interface WarnJson {
  by_state?: Record<string, { count: number }>
  total_count?: number
}
interface LicsJson { lics?: number }
interface SectorJson {
  verdict?: 'EXPANDING' | 'STABLE' | 'CONTRACTING'
}

async function fetchJson<T>(url: string, timeoutMs = 6_000): Promise<T | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    return r.ok ? ((await r.json()) as T) : null
  } catch {
    return null
  }
}

// ── Driver builders ──────────────────────────────────────────────────────────

function buildPermitDriver(history: MonthlyAgg[]): ScoreDriver {
  const weight = WEIGHTS.permit_trend
  const id     = 'permit_trend'
  const label  = 'Permit trend vs 24-month baseline'

  // Need at least 6 months to say anything meaningful
  if (history.length < 6) {
    return {
      id, label, score: 50, weight, value: null,
      detail: 'Insufficient permit history — baseline not established',
      source: 'unavailable',
    }
  }

  const recent3  = history.slice(-3)
  const baseline = history.slice(0, Math.max(history.length - 3, 1))

  const recentAvg   = recent3.reduce((s, r) => s + r.permit_count, 0) / recent3.length
  const baselineAvg = baseline.reduce((s, r) => s + r.permit_count, 0) / baseline.length

  if (baselineAvg <= 0) {
    return {
      id, label, score: 50, weight, value: null,
      detail: 'Baseline has zero permits — cannot compute trend',
      source: 'fallback',
    }
  }

  const pct   = ((recentAvg - baselineAvg) / baselineAvg) * 100
  const score = Math.round(scoreFromPct(pct, 20))

  return {
    id, label, score, weight,
    value:  parseFloat(pct.toFixed(1)),
    detail: `Last 3 months averaged ${recentAvg.toFixed(0)} permits vs baseline ${baselineAvg.toFixed(0)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`,
    source: 'live',
  }
}

function buildFederalDriver(
  federal: FederalJson | null,
  stateCode: string | null,
): ScoreDriver {
  const weight = WEIGHTS.federal_awards
  const id     = 'federal_awards'
  const label  = 'Federal awards vs national average'

  if (!federal?.stateAllocations?.length || !stateCode) {
    return {
      id, label, score: 50, weight, value: null,
      detail: 'Federal award data unavailable for this state',
      source: 'unavailable',
    }
  }

  const allocations = federal.stateAllocations
  const stateRow    = allocations.find(a => a.state === stateCode)
  if (!stateRow) {
    return {
      id, label, score: 50, weight, value: null,
      detail: `No federal construction awards on record for ${stateCode}`,
      source: 'fallback',
    }
  }

  const nationalAvg = allocations.reduce((s, a) => s + a.obligated, 0) / allocations.length
  if (nationalAvg <= 0) {
    return {
      id, label, score: 50, weight, value: null,
      detail: 'National federal-award baseline unavailable',
      source: 'fallback',
    }
  }

  const ratio = stateRow.obligated / nationalAvg
  const score = Math.round(scoreFromRatio(ratio))

  return {
    id, label, score, weight,
    value:  parseFloat(ratio.toFixed(2)),
    detail: `${stateCode} federal construction awards are ${ratio.toFixed(2)}× the 50-state average`,
    source: 'live',
  }
}

function buildSatelliteDriver(bsi: BsiRow | null, msaCode: string | null): ScoreDriver {
  const weight = WEIGHTS.satellite_bsi
  const id     = 'satellite_bsi'
  const label  = 'Satellite BSI change (90d)'

  if (!msaCode) {
    return {
      id, label, score: 50, weight, value: null,
      detail: 'Metro not yet mapped to an MSA for satellite coverage',
      source: 'unavailable',
    }
  }

  if (!bsi || bsi.bsi_change_90d === null) {
    return {
      id, label, score: 50, weight, value: null,
      detail: 'No recent satellite observation for this MSA',
      source: 'unavailable',
    }
  }

  const delta = bsi.bsi_change_90d
  const score = Math.round(scoreFromBsiDelta(delta))

  return {
    id, label, score, weight,
    value:  parseFloat(delta.toFixed(4)),
    detail: `Bare Soil Index shifted ${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(2)} pts over the last 90 days (${bsi.observation_date})`,
    source: 'live',
  }
}

function buildLicsDriver(lics: LicsJson | null): ScoreDriver {
  const weight = WEIGHTS.lics
  const id     = 'lics'
  const label  = 'Leading Indicator Composite (LICS)'

  if (lics?.lics == null) {
    return {
      id, label, score: 50, weight, value: null,
      detail: 'LICS composite unavailable — neutral default applied',
      source: 'unavailable',
    }
  }

  const score = Math.round(clamp(lics.lics))

  return {
    id, label, score, weight,
    value:  lics.lics,
    detail: `National 6-month leading indicator composite at ${score}`,
    source: 'live',
  }
}

function buildWarnDriver(warn: WarnJson | null, stateCode: string | null): ScoreDriver {
  const weight = WEIGHTS.warn_inverse
  const id     = 'warn_inverse'
  const label  = 'WARN Act filings (inverse)'

  if (!warn) {
    return {
      id, label, score: 50, weight, value: null,
      detail: 'WARN Act data unavailable',
      source: 'unavailable',
    }
  }

  const count = stateCode ? warn.by_state?.[stateCode]?.count ?? 0 : warn.total_count ?? 0
  const score = Math.round(scoreFromWarnCount(count))

  return {
    id, label, score, weight,
    value:  count,
    detail: stateCode
      ? `${count} construction WARN notices filed in ${stateCode} over the last reporting window`
      : `${count} construction WARN notices filed nationally`,
    source: 'live',
  }
}

function buildSectorDriver(
  residential: SectorJson | null,
  commercial:  SectorJson | null,
): ScoreDriver {
  const weight = WEIGHTS.sector_verdict
  const id     = 'sector_verdict'
  const label  = 'Sector verdict (residential + commercial)'

  const resScore = sectorVerdictScore(residential?.verdict ?? null)
  const comScore = sectorVerdictScore(commercial?.verdict  ?? null)
  const score    = Math.round((resScore + comScore) / 2)

  const hasData = residential?.verdict || commercial?.verdict

  return {
    id, label, score, weight,
    value:  score,
    detail: `Residential: ${residential?.verdict ?? 'unknown'} · Commercial: ${commercial?.verdict ?? 'unknown'}`,
    source: hasData ? 'live' : 'unavailable',
  }
}

// ── Main entry point ─────────────────────────────────────────────────────────

export interface ComputeOptions {
  baseUrl?: string
}

/**
 * Compute the opportunity score for a metro. Returns `null` when the metro
 * code is unknown (i.e. no row in permit_sources).
 */
export async function computeOpportunityScore(
  metroCodeRaw: string,
  opts: ComputeOptions = {},
): Promise<OpportunityScoreResult | null> {
  const metroCode = metroCodeRaw.toUpperCase()
  const source    = await fetchMetroSource(metroCode)
  if (!source) return null

  const { baseUrl } = opts

  // Fan out all IO concurrently
  const [permitHistory, bsi, federal, warn, lics, residential, commercial] =
    await Promise.all([
      fetchPermitHistory(source.city_code),
      fetchBsi(source.msa_code),
      baseUrl ? fetchJson<FederalJson>(`${baseUrl}/api/federal`, 8_000) : Promise.resolve(null),
      baseUrl ? fetchJson<WarnJson>(`${baseUrl}/api/warn`, 8_000)        : Promise.resolve(null),
      baseUrl ? fetchJson<LicsJson>(`${baseUrl}/api/leading-indicators`) : Promise.resolve(null),
      baseUrl ? fetchJson<SectorJson>(`${baseUrl}/api/sector/residential`) : Promise.resolve(null),
      baseUrl ? fetchJson<SectorJson>(`${baseUrl}/api/sector/commercial`)  : Promise.resolve(null),
    ])

  const drivers: ScoreDriver[] = [
    buildPermitDriver(permitHistory),
    buildFederalDriver(federal, source.state_code),
    buildSatelliteDriver(bsi, source.msa_code),
    buildLicsDriver(lics),
    buildWarnDriver(warn, source.state_code),
    buildSectorDriver(residential, commercial),
  ]

  const score        = compositeScore(drivers)
  const liveCount    = drivers.filter(d => d.source === 'live').length
  const now          = new Date()
  const validThrough = new Date(now.getTime() + CACHE_TTL_HOURS * 3_600_000)

  return {
    metro_code:     source.city_code,
    metro_name:     source.city_name,
    state_code:     source.state_code,
    msa_code:       source.msa_code,
    score,
    classification: classify(score),
    confidence:     classifyConfidence(liveCount),
    drivers,
    top_drivers:    pickTopDrivers(drivers),
    computed_at:    now.toISOString(),
    valid_through:  validThrough.toISOString(),
  }
}
