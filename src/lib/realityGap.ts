import { supabaseAdmin } from './supabase'
import { clamp, scoreFromBsiDelta, scoreFromWarnCount } from './opportunityScore'

// =============================================================================
// RealityGap — signed divergence between what a project claims and what the
// ground shows. Measures whether observable signals confirm or contradict the
// official project record.
//
//   gap = observed_score − official_score   (range: −100 → +100)
//   − negative: reality is worse than declared (project is lagging / ghost)
//   + positive: reality is ahead of official record (construction outpacing paperwork)
//
// Official momentum sub-signals (what is declared):
//   permit_valuation    0.45  — declared permit value in USD
//   award_amount        0.35  — obligated federal award amount
//   announced_milestone 0.20  — milestone text + date from entity attributes
//
// Observed momentum sub-signals (ground truth):
//   satellite_bsi       0.45  — Sentinel-2 BSI 90d delta at the project site
//   amendment_cadence   0.35  — days since last permit-activity event (recency)
//   warn_stress         0.20  — WARN Act filings in metro (inverse — fewer = better)
//
// Classifications:
//   ON_TRACK  gap ≥ −15                       reality roughly matches or leads
//   LAGGING   −50 ≤ gap < −15                 behind schedule but still active
//   STALLED   gap < −50 (observed > 20)       active start, significant drop-off
//   GHOST     gap < −25 AND observed ≤ 20     official record with no ground signal
// =============================================================================

export type RealityGapClassification = 'ON_TRACK' | 'LAGGING' | 'STALLED' | 'GHOST'

// 'official' drivers inflate the claim; 'observed' drivers reveal the ground truth.
export type GapDriverSide = 'official' | 'observed'

export type OfficialDriverId = 'permit_valuation' | 'award_amount' | 'announced_milestone'
export type ObservedDriverId = 'satellite_bsi'     | 'amendment_cadence' | 'warn_stress'
export type GapDriverId      = OfficialDriverId | ObservedDriverId

export interface GapDriver {
  id:     GapDriverId
  label:  string
  score:  number         // 0–100 integer
  weight: number         // within its side (official or observed); sum per side = 1.0
  value:  number | string | null
  detail: string
  side:   GapDriverSide
}

export interface RealityGapResult {
  project_id:       number
  gap:              number                 // −100 to +100; observed_score − official_score
  official_score:   number                 // 0–100
  observed_score:   number                 // 0–100
  classification:   RealityGapClassification
  official_drivers: GapDriver[]            // 3 official sub-signals
  observed_drivers: GapDriver[]            // 3 observed sub-signals
  top_gap_drivers:  GapDriver[]            // 3 drivers furthest from neutral (50)
  computed_at:      string
  valid_through:    string
}

export const OFFICIAL_WEIGHTS: Record<OfficialDriverId, number> = {
  permit_valuation:    0.45,
  award_amount:        0.35,
  announced_milestone: 0.20,
}

export const OBSERVED_WEIGHTS: Record<ObservedDriverId, number> = {
  satellite_bsi:    0.45,
  amendment_cadence: 0.35,
  warn_stress:       0.20,
}

export const REALITY_GAP_CACHE_TTL_HOURS = 24

// ── Pure scoring helpers (exported for unit tests) ───────────────────────────

/**
 * Map declared permit valuation (USD) to a 0–100 official commitment score.
 * Follows log-scale breakpoints: larger declared value = higher official claim.
 */
export function scoreFromValuation(value: number | null): number {
  if (value === null || !Number.isFinite(value) || value <= 0) return 30
  if (value < 100_000)      return 28
  if (value < 500_000)      return 44
  if (value < 2_000_000)    return 58
  if (value < 10_000_000)   return 72
  if (value < 50_000_000)   return 83
  return 92
}

/**
 * Map federal award obligated amount (USD) to a 0–100 official signal.
 * null = no award matched → neutral 45 (slightly below 50 since absence is a weak negative).
 */
export function scoreFromAwardAmount(amount: number | null): number {
  if (amount === null) return 45           // no federal award = no additional commitment
  if (amount <= 0)     return 45
  if (amount < 100_000)      return 55
  if (amount < 1_000_000)    return 67
  if (amount < 10_000_000)   return 78
  if (amount < 100_000_000)  return 87
  return 93
}

/**
 * Score an announced milestone.
 * No milestone → below neutral (42) — silence is a weak negative signal.
 * Future milestone → 72 (project has a declared target).
 * Past milestone → 28 (overdue — lagging in its own official record).
 */
export function scoreFromMilestone(
  text: string | null,
  dateStr: string | null,
): number {
  if (!text) return 42
  if (!dateStr) return 63           // milestone text but no date = soft commitment
  const ms        = new Date(dateStr)
  const daysUntil = (ms.getTime() - Date.now()) / 86_400_000
  if (daysUntil > 30)   return 75  // actively future milestone
  if (daysUntil >= -14) return 52  // within the landing window (on/just past target)
  return 28                        // materially overdue
}

/**
 * Map days since the most recent permit activity event to a 0–100 observed
 * cadence score. Recent activity = high observed momentum; silence = stalling.
 */
export function scoreFromAmendmentCadence(daysSinceLast: number | null): number {
  if (daysSinceLast === null || !Number.isFinite(daysSinceLast)) return 50
  if (daysSinceLast <= 7)   return 90
  if (daysSinceLast <= 14)  return 82
  if (daysSinceLast <= 30)  return 72
  if (daysSinceLast <= 60)  return 52
  if (daysSinceLast <= 90)  return 35
  if (daysSinceLast <= 180) return 20
  return 10
}

/** WARN Act inverse: more filings in metro = greater labor stress = lower observed momentum. */
export function scoreFromWarnStress(count: number | null): number {
  return scoreFromWarnCount(count)   // reuse: 0→100, 20+→0
}

/**
 * Compute weighted average of a driver subset (official or observed side).
 * Returns 0–100 rounded integer.
 */
export function sideScore(drivers: GapDriver[]): number {
  const total = drivers.reduce((s, d) => s + d.score * d.weight, 0)
  return Math.round(clamp(total))
}

/**
 * Classify based on the signed gap and the absolute observed score.
 *
 *   GHOST:    no ground signal + significant negative gap
 *   STALLED:  large negative gap but some activity detected
 *   LAGGING:  moderate negative gap
 *   ON_TRACK: gap within tolerance (including positive gaps)
 */
export function classifyGap(
  gap: number,
  observedScore: number,
): RealityGapClassification {
  if (observedScore <= 20 && gap <= -25) return 'GHOST'
  if (gap <= -50) return 'STALLED'
  if (gap <= -15) return 'LAGGING'
  return 'ON_TRACK'
}

/** Top 3 individual drivers (across both sides) furthest from neutral (50). */
export function pickTopGapDrivers(
  official: GapDriver[],
  observed: GapDriver[],
): GapDriver[] {
  return [...official, ...observed]
    .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
    .slice(0, 3)
}

// ── Driver builders ──────────────────────────────────────────────────────────

function buildValuationDriver(valuation: number | null): GapDriver {
  const score = Math.round(scoreFromValuation(valuation))
  return {
    id:     'permit_valuation',
    label:  'Declared permit valuation',
    score,
    weight: OFFICIAL_WEIGHTS.permit_valuation,
    value:  valuation,
    detail: valuation
      ? `$${(valuation / 1_000_000).toFixed(2)}M declared on permit — ${
          valuation >= 10_000_000 ? 'major project commitment'  :
          valuation >= 2_000_000  ? 'substantial commitment'    :
          valuation >= 500_000    ? 'mid-scale commitment'      : 'modest commitment'
        }`
      : 'No valuation declared on permit',
    side: 'official',
  }
}

function buildAwardAmountDriver(amount: number | null): GapDriver {
  const score = Math.round(scoreFromAwardAmount(amount))
  return {
    id:     'award_amount',
    label:  'Federal award obligated',
    score,
    weight: OFFICIAL_WEIGHTS.award_amount,
    value:  amount,
    detail: amount !== null
      ? `$${(amount / 1_000_000).toFixed(2)}M obligated via USASpending.gov`
      : 'No federal award matched to this project',
    side: 'official',
  }
}

function buildMilestoneDriver(text: string | null, dateStr: string | null): GapDriver {
  const score = Math.round(scoreFromMilestone(text, dateStr))
  let detail: string
  if (!text) {
    detail = 'No milestone announced in project record'
  } else if (!dateStr) {
    detail = `Milestone declared: "${text}" — no target date set`
  } else {
    const daysUntil = Math.round((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
    detail = daysUntil > 0
      ? `"${text}" targeted in ${daysUntil} day${daysUntil === 1 ? '' : 's'} (${dateStr})`
      : `"${text}" target date was ${dateStr} — ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} overdue`
  }
  return {
    id: 'announced_milestone', label: 'Announced milestone', score,
    weight: OFFICIAL_WEIGHTS.announced_milestone,
    value: text ?? null, detail, side: 'official',
  }
}

function buildSatelliteObservedDriver(bsiChange: number | null): GapDriver {
  const score = Math.round(scoreFromBsiDelta(bsiChange))
  return {
    id:     'satellite_bsi',
    label:  'Satellite BSI progression (90d)',
    score,
    weight: OBSERVED_WEIGHTS.satellite_bsi,
    value:  bsiChange,
    detail: bsiChange !== null
      ? `Site BSI ${bsiChange >= 0 ? '+' : ''}${(bsiChange * 100).toFixed(2)} pts — ${
          bsiChange > 0.03  ? 'active ground disturbance detected'   :
          bsiChange > 0     ? 'minor soil activity observed'         :
          bsiChange > -0.02 ? 'minimal change — site appears quiet'  : 'BSI declining — no new disturbance'
        }`
      : 'No satellite observation available for this project site',
    side: 'observed',
  }
}

function buildCadenceDriver(daysSinceLast: number | null): GapDriver {
  const score = Math.round(scoreFromAmendmentCadence(daysSinceLast))
  return {
    id:     'amendment_cadence',
    label:  'Permit activity recency',
    score,
    weight: OBSERVED_WEIGHTS.amendment_cadence,
    value:  daysSinceLast,
    detail: daysSinceLast !== null
      ? daysSinceLast <= 14
        ? `Permit activity ${daysSinceLast} day${daysSinceLast === 1 ? '' : 's'} ago — project actively engaged`
        : daysSinceLast <= 60
          ? `Last permit activity ${daysSinceLast} days ago — moderately current`
          : `No permit activity in ${daysSinceLast} days — potential stall signal`
      : 'No permit activity events found for this project',
    side: 'observed',
  }
}

function buildWarnStressDriver(warnCount: number | null, metroCode: string | null): GapDriver {
  const score = Math.round(scoreFromWarnStress(warnCount))
  return {
    id:     'warn_stress',
    label:  'WARN Act labor stress (metro, 60d)',
    score,
    weight: OBSERVED_WEIGHTS.warn_stress,
    value:  warnCount,
    detail: warnCount !== null
      ? warnCount === 0
        ? `No construction WARN notices in ${metroCode ?? 'metro'} (60d) — stable labor market`
        : `${warnCount} WARN notice${warnCount === 1 ? '' : 's'} in ${metroCode ?? 'metro'} (60d) — ${
            warnCount >= 10 ? 'significant labor stress' : 'moderate labor pressure'
          }`
      : 'WARN Act data unavailable for this metro',
    side: 'observed',
  }
}

// ── Core compute function ─────────────────────────────────────────────────────

export interface RealityGapInput {
  project_id:              number
  city_code:               string | null
  // Official signals
  permit_valuation:        number | null
  federal_award_amount:    number | null
  announced_milestone:     string | null
  announced_milestone_date: string | null
  // Observed signals
  satellite_bsi_change:    number | null
  days_since_last_amendment: number | null
  warn_count_metro_60d:    number | null
}

export function computeRealityGap(input: RealityGapInput): RealityGapResult {
  const official_drivers: GapDriver[] = [
    buildValuationDriver(input.permit_valuation),
    buildAwardAmountDriver(input.federal_award_amount),
    buildMilestoneDriver(input.announced_milestone, input.announced_milestone_date),
  ]

  const observed_drivers: GapDriver[] = [
    buildSatelliteObservedDriver(input.satellite_bsi_change),
    buildCadenceDriver(input.days_since_last_amendment),
    buildWarnStressDriver(input.warn_count_metro_60d, input.city_code),
  ]

  const official_score = sideScore(official_drivers)
  const observed_score = sideScore(observed_drivers)
  const gap            = Math.round(clamp(observed_score - official_score, -100, 100))

  const now          = new Date()
  const validThrough = new Date(now.getTime() + REALITY_GAP_CACHE_TTL_HOURS * 3_600_000)

  return {
    project_id:    input.project_id,
    gap,
    official_score,
    observed_score,
    classification: classifyGap(gap, observed_score),
    official_drivers,
    observed_drivers,
    top_gap_drivers: pickTopGapDrivers(official_drivers, observed_drivers),
    computed_at:   now.toISOString(),
    valid_through: validThrough.toISOString(),
  }
}

// ── Batch data-fetch helpers ─────────────────────────────────────────────────

interface ProjectRow {
  id:                   number
  city_code:            string | null
  state_code:           string | null
  permit_number:        string
  valuation:            number | null
  federal_award_match:  boolean
  federal_award_id:     string | null
  satellite_bsi_change: number | null
}

async function fetchEligibleProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id, city_code, state_code, permit_number, valuation, federal_award_match, federal_award_id, satellite_bsi_change')
    .not('lifecycle_state', 'in', '("completed","inactive")')

  if (error) throw new Error(`fetchEligibleProjects: ${error.message}`)
  return (data ?? []) as ProjectRow[]
}

/**
 * Fetch obligated dollar amounts for matched federal awards from entity attributes.
 * Returns a map of federal_award_id → obligated amount.
 */
async function fetchAwardAmounts(awardIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (awardIds.length === 0) return map

  const { data } = await supabaseAdmin
    .from('entities')
    .select('external_id, attributes')
    .eq('type', 'award')
    .in('external_id', awardIds)

  for (const row of data ?? []) {
    const r      = row as { external_id: string; attributes: Record<string, unknown> }
    const amount = Number(r.attributes?.obligated ?? r.attributes?.amount ?? 0)
    if (Number.isFinite(amount) && amount > 0) {
      map.set(r.external_id, amount)
    }
  }

  return map
}

/**
 * Fetch announced milestone text and dates from project entity attributes.
 * Returns a map of permit_number → { milestone, milestone_date }.
 */
async function fetchMilestones(
  permitNumbers: string[],
): Promise<Map<string, { text: string; date: string | null }>> {
  const map = new Map<string, { text: string; date: string | null }>()
  if (permitNumbers.length === 0) return map

  const { data } = await supabaseAdmin
    .from('entities')
    .select('external_id, attributes')
    .eq('type', 'project')
    .in('external_id', permitNumbers)

  for (const row of data ?? []) {
    const r    = row as { external_id: string; attributes: Record<string, unknown> }
    const text = r.attributes?.milestone as string | undefined
    if (text) {
      map.set(r.external_id, {
        text,
        date: (r.attributes?.milestone_date as string | null) ?? null,
      })
    }
  }

  return map
}

/**
 * Fetch days since most recent permit-category event per project.
 * Returns a map of project_id → days since last event.
 */
async function fetchDaysSinceLastAmendment(
  projectIds: number[],
): Promise<Map<number, number>> {
  const map = new Map<number, number>()
  if (projectIds.length === 0) return map

  const { data } = await supabaseAdmin
    .from('project_events')
    .select('project_id, event_date')
    .in('project_id', projectIds)
    .ilike('event_type', 'permit%')
    .order('event_date', { ascending: false })

  // Keep the most recent event per project
  for (const row of data ?? []) {
    const r = row as { project_id: number; event_date: string }
    if (!map.has(r.project_id)) {
      const days = Math.floor((Date.now() - new Date(r.event_date).getTime()) / 86_400_000)
      map.set(r.project_id, days)
    }
  }

  return map
}

/**
 * Fetch WARN Act filing counts per metro from the most recent opportunity_scores
 * driver_json. This reuses WARN data already computed by the opportunity-score cron
 * rather than re-querying the raw event_log.
 *
 * Returns a map of city_code → warn_inverse driver score (0–100).
 * Callers invert back to a count proxy: count ≈ (100 − score) / 5.
 */
async function fetchWarnCountsPerMetro(
  cityCodes: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (cityCodes.length === 0) return map

  // Latest row per metro
  const { data } = await supabaseAdmin
    .from('opportunity_scores')
    .select('metro_code, driver_json, computed_at')
    .in('metro_code', cityCodes)
    .order('computed_at', { ascending: false })

  const seen = new Set<string>()
  for (const row of data ?? []) {
    const r = row as {
      metro_code:  string
      driver_json: { drivers?: Array<{ id: string; value: number | null }> }
    }
    if (seen.has(r.metro_code)) continue
    seen.add(r.metro_code)

    const warnDriver = r.driver_json?.drivers?.find(d => d.id === 'warn_inverse')
    if (warnDriver?.value != null) {
      // driver.value is the raw WARN count stored at score-compute time
      map.set(r.metro_code, warnDriver.value)
    }
  }

  return map
}

// ── Batch compute ─────────────────────────────────────────────────────────────

export interface BatchRealityGapResult {
  computed:   RealityGapResult[]
  errors:     string[]
  durationMs: number
}

export async function batchComputeRealityGaps(): Promise<BatchRealityGapResult> {
  const start  = Date.now()
  const errors: string[] = []

  let projects: ProjectRow[]
  try {
    projects = await fetchEligibleProjects()
  } catch (err) {
    return {
      computed:   [],
      errors:     [err instanceof Error ? err.message : String(err)],
      durationMs: Date.now() - start,
    }
  }

  if (projects.length === 0) {
    return { computed: [], errors: [], durationMs: Date.now() - start }
  }

  const projectIds    = projects.map(p => p.id)
  const permitNumbers = projects.map(p => p.permit_number)
  const awardIds      = projects.map(p => p.federal_award_id).filter(Boolean) as string[]
  const cityCodes     = [...new Set(projects.map(p => p.city_code).filter(Boolean) as string[])]

  // Fan out all enrichment queries concurrently
  const [awardAmounts, milestones, daysSinceLast, warnCounts] = await Promise.all([
    fetchAwardAmounts(awardIds).catch(err => {
      errors.push(`award amounts: ${err instanceof Error ? err.message : String(err)}`)
      return new Map<string, number>()
    }),
    fetchMilestones(permitNumbers).catch(err => {
      errors.push(`milestones: ${err instanceof Error ? err.message : String(err)}`)
      return new Map<string, { text: string; date: string | null }>()
    }),
    fetchDaysSinceLastAmendment(projectIds).catch(err => {
      errors.push(`amendment cadence: ${err instanceof Error ? err.message : String(err)}`)
      return new Map<number, number>()
    }),
    fetchWarnCountsPerMetro(cityCodes).catch(err => {
      errors.push(`WARN counts: ${err instanceof Error ? err.message : String(err)}`)
      return new Map<string, number>()
    }),
  ])

  const computed: RealityGapResult[] = []

  for (const project of projects) {
    try {
      const milestone     = milestones.get(project.permit_number) ?? null
      const awardAmount   = project.federal_award_id
        ? (awardAmounts.get(project.federal_award_id) ?? null)
        : null

      const input: RealityGapInput = {
        project_id:               project.id,
        city_code:                project.city_code,
        permit_valuation:         project.valuation,
        federal_award_amount:     awardAmount,
        announced_milestone:      milestone?.text ?? null,
        announced_milestone_date: milestone?.date ?? null,
        satellite_bsi_change:     project.satellite_bsi_change,
        days_since_last_amendment: daysSinceLast.get(project.id) ?? null,
        warn_count_metro_60d:     project.city_code
          ? (warnCounts.get(project.city_code) ?? null)
          : null,
      }

      computed.push(computeRealityGap(input))
    } catch (err) {
      errors.push(`project ${project.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { computed, errors, durationMs: Date.now() - start }
}
