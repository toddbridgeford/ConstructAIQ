import { supabaseAdmin } from './supabase'
import {
  clamp,
  classify,
  classifyConfidence,
  pickTopDrivers,
  scoreFromBsiDelta,
} from './opportunityScore'
import type { Classification, Confidence, ScoreDriver } from './opportunityScore'

// =============================================================================
// Formation Score — project-level probability that a construction project
// will proceed to active formation (0–100).
//
// Five drivers with independent 0–100 subscores, weighted and composited.
// Results are stored nightly in project_formation_scores.
//
// Driver weights:
//   satellite_bsi      0.25  — ground truth: soil disturbance detected
//   permit_amendments  0.25  — behavioral intent: project is being refined
//   permit_age         0.20  — timing: project is in the activation window
//   federal_proximity  0.15  — co-location with nearby federal award
//   contractor_track   0.15  — execution credibility in this metro
// =============================================================================

export type FormationDriverId =
  | 'satellite_bsi'
  | 'permit_amendments'
  | 'permit_age'
  | 'federal_proximity'
  | 'contractor_track'

// Re-export shared types so consumers only need this import
export type { Classification, Confidence }

export interface FormationDriver {
  id:     FormationDriverId
  label:  string
  score:  number        // 0–100 integer
  weight: number        // contribution to composite; all weights sum to 1.0
  value:  number | null // raw input value (null = unavailable)
  detail: string
}

export interface FormationScoreResult {
  project_id:     number
  score:          number
  classification: Classification
  confidence:     Confidence
  drivers:        FormationDriver[]
  top_drivers:    FormationDriver[]  // top 3 by deviation from neutral (50)
  computed_at:    string
  valid_through:  string
}

export const FORMATION_WEIGHTS: Record<FormationDriverId, number> = {
  satellite_bsi:     0.25,
  permit_amendments: 0.25,
  permit_age:        0.20,
  federal_proximity: 0.15,
  contractor_track:  0.15,
}

// Scores are co-aligned with the nightly opportunity-score cron (24 h TTL).
export const FORMATION_CACHE_TTL_HOURS = 24

// ── Pure scoring helpers (exported for unit testing) ─────────────────────────

/**
 * Map days elapsed since first permit event to a 0–100 score.
 *
 * The formation window is 30–180 days:
 *   - <7 d   → 30  (too fresh, no real-intent signal yet)
 *   - 7–30   → 55  (early stage)
 *   - 30–90  → 88  (ideal: moving fast through approvals)
 *   - 90–180 → 78  (mature but still active)
 *   - 180–365 → 55 (aging, risk of stall)
 *   - 365–730 → 30 (stale)
 *   - >730   → 15  (very stale / abandoned signal)
 */
export function scoreFromPermitAge(days: number | null): number {
  if (days === null || !Number.isFinite(days) || days < 0) return 50
  if (days < 7)   return 30
  if (days < 30)  return 55
  if (days < 90)  return 88
  if (days < 180) return 78
  if (days < 365) return 55
  if (days < 730) return 30
  return 15
}

/**
 * Map permit amendment count to a 0–100 score.
 *
 * Each amendment signals the applicant is actively refining the project
 * (design revisions, valuation updates, scope changes). 0 amendments is
 * ambiguous (no change needed OR no engagement). 7+ suggests stuck in
 * approval bureaucracy rather than active formation.
 */
export function scoreFromAmendments(count: number | null): number {
  if (count === null || !Number.isFinite(count) || count < 0) return 50
  if (count === 0) return 40
  if (count === 1) return 65
  if (count === 2) return 80
  if (count === 3) return 88
  if (count <= 6)  return 84
  return 68   // 7+ amendments → stuck in approvals
}

/** Boolean proximity to a nearby federal award. */
export function scoreFromFederalProximity(hasAward: boolean | null): number {
  if (hasAward === null) return 45
  return hasAward ? 82 : 42
}

/** Boolean track record: contractor has prior completions in this metro. */
export function scoreFromContractorTrack(hasPrior: boolean | null): number {
  if (hasPrior === null) return 45
  return hasPrior ? 78 : 42
}

/** Weighted composite across all five driver scores. */
export function formationComposite(drivers: FormationDriver[]): number {
  const total = drivers.reduce((s, d) => s + d.score * d.weight, 0)
  return Math.round(clamp(total))
}

/** Top 3 drivers furthest from neutral (50). */
export function pickTopFormationDrivers(drivers: FormationDriver[]): FormationDriver[] {
  return [...drivers]
    .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
    .slice(0, 3)
}

/** Count live drivers (score came from real data, not a null-fallback). */
export function countLiveFormationDrivers(drivers: FormationDriver[]): number {
  return drivers.filter(d => d.value !== null).length
}

// ── Driver builders ──────────────────────────────────────────────────────────

function buildSatelliteDriver(bsiChange: number | null): FormationDriver {
  const score = Math.round(scoreFromBsiDelta(bsiChange))
  return {
    id:     'satellite_bsi',
    label:  'Satellite BSI change (90d)',
    score,
    weight: FORMATION_WEIGHTS.satellite_bsi,
    value:  bsiChange,
    detail: bsiChange !== null
      ? `Bare Soil Index shifted ${bsiChange >= 0 ? '+' : ''}${(bsiChange * 100).toFixed(2)} pts over the last 90 days`
      : 'No satellite observation matched to this project site',
  }
}

function buildAmendmentDriver(count: number | null): FormationDriver {
  const score = Math.round(scoreFromAmendments(count))
  return {
    id:     'permit_amendments',
    label:  'Permit amendment activity',
    score,
    weight: FORMATION_WEIGHTS.permit_amendments,
    value:  count,
    detail: count !== null
      ? count === 0
        ? 'No amendments filed — intent unconfirmed'
        : `${count} amendment${count === 1 ? '' : 's'} filed — active project refinement`
      : 'Amendment history unavailable',
  }
}

function buildPermitAgeDriver(days: number | null): FormationDriver {
  const score = Math.round(scoreFromPermitAge(days))
  return {
    id:     'permit_age',
    label:  'Days since first permit event',
    score,
    weight: FORMATION_WEIGHTS.permit_age,
    value:  days,
    detail: days !== null
      ? `${days} day${days === 1 ? '' : 's'} since first permit event — ${
          days < 30  ? 'early stage'  :
          days < 180 ? 'active window' :
          days < 365 ? 'aging'         : 'stale'
        }`
      : 'Permit date unavailable',
  }
}

function buildFederalProximityDriver(hasAward: boolean | null): FormationDriver {
  const score = Math.round(scoreFromFederalProximity(hasAward))
  return {
    id:     'federal_proximity',
    label:  'Federal award co-location',
    score,
    weight: FORMATION_WEIGHTS.federal_proximity,
    value:  hasAward === null ? null : (hasAward ? 1 : 0),
    detail: hasAward === true
      ? 'A USASpending.gov award was matched within proximity of this site'
      : hasAward === false
        ? 'No federal award matched nearby'
        : 'Federal proximity data unavailable',
  }
}

function buildContractorTrackDriver(hasPrior: boolean | null): FormationDriver {
  const score = Math.round(scoreFromContractorTrack(hasPrior))
  return {
    id:     'contractor_track',
    label:  'Contractor prior completions in metro',
    score,
    weight: FORMATION_WEIGHTS.contractor_track,
    value:  hasPrior === null ? null : (hasPrior ? 1 : 0),
    detail: hasPrior === true
      ? 'Contractor has verified project completions in this metro'
      : hasPrior === false
        ? 'No prior completions found for matched contractor in this metro'
        : 'Contractor data unavailable',
  }
}

// ── Core compute function ────────────────────────────────────────────────────

export interface FormationScoreInput {
  project_id:                            number
  days_since_first_permit_event:         number | null
  permit_amendment_count:                number | null
  has_federal_award_nearby:              boolean | null
  satellite_bsi_change:                  number | null
  contractor_has_prior_completions_in_metro: boolean | null
}

export function computeFormationScore(input: FormationScoreInput): FormationScoreResult {
  const drivers: FormationDriver[] = [
    buildSatelliteDriver(input.satellite_bsi_change),
    buildAmendmentDriver(input.permit_amendment_count),
    buildPermitAgeDriver(input.days_since_first_permit_event),
    buildFederalProximityDriver(input.has_federal_award_nearby),
    buildContractorTrackDriver(input.contractor_has_prior_completions_in_metro),
  ]

  const score      = formationComposite(drivers)
  const liveCount  = countLiveFormationDrivers(drivers)
  const now        = new Date()
  const validThrough = new Date(now.getTime() + FORMATION_CACHE_TTL_HOURS * 3_600_000)

  return {
    project_id:     input.project_id,
    score,
    classification: classify(score),
    confidence:     classifyConfidence(liveCount),
    drivers,
    top_drivers:    pickTopFormationDrivers(drivers),
    computed_at:    now.toISOString(),
    valid_through:  validThrough.toISOString(),
  }
}

// ── Batch data-fetch helpers (used by the nightly cron) ──────────────────────

interface ProjectRow {
  id:                  number
  city_code:           string | null
  permit_number:       string
  applied_date:        string | null
  satellite_bsi_change: number | null
  federal_award_match: boolean
}

interface AmendmentRow {
  project_id: number
  count:      number
}

interface ContractorRow {
  project_id: number
}

/**
 * Fetch all active projects eligible for formation scoring.
 * "Active" means status applied, approved, or active (not completed/expired).
 */
async function fetchActiveProjects(
  opts?: { offset: number; limit: number },
): Promise<ProjectRow[]> {
  let q = supabaseAdmin
    .from('projects')
    .select('id, city_code, permit_number, applied_date, satellite_bsi_change, federal_award_match')
    .in('status', ['applied', 'approved', 'active'])

  if (opts) q = q.range(opts.offset, opts.offset + opts.limit - 1)

  const { data, error } = await q
  if (error) throw new Error(`fetchActiveProjects: ${error.message}`)
  return (data ?? []) as ProjectRow[]
}

/**
 * Count permit amendment events per project from project_events.
 * Amendments are logged as event_type = 'permit_amended' or 'permit_issued'
 * resubmissions — we count all permit-category events beyond the initial filing
 * as a proxy for the amendment count.
 */
async function fetchAmendmentCounts(
  projectIds: number[],
): Promise<Map<number, number>> {
  if (projectIds.length === 0) return new Map()

  // event_log stores permit.amended events keyed to the entity, but
  // project_events is the simpler join path for project_id → event_type.
  // Count any permit-related events per project; subtract 1 for the initial
  // permit.filed event to get net amendments.
  const { data, error } = await supabaseAdmin
    .from('project_events')
    .select('project_id, event_type')
    .in('project_id', projectIds)
    .ilike('event_type', 'permit%')

  if (error) throw new Error(`fetchAmendmentCounts: ${error.message}`)

  const counts = new Map<number, number>()
  for (const row of data ?? []) {
    const r = row as { project_id: number; event_type: string }
    // The first permit event (filing) is expected — count additional events as amendments
    counts.set(r.project_id, (counts.get(r.project_id) ?? 0) + 1)
  }

  // Subtract 1 for the initial permit event; clamp to 0
  for (const [id, n] of counts) {
    counts.set(id, Math.max(0, n - 1))
  }

  return counts
}

/**
 * Determine which projects have a contractor with prior completions in the
 * same metro. Strategy:
 *   1. Find contractor entities linked to the project via entity_edges
 *      (edge_type = 'award_to_contractor').
 *   2. Check if that contractor links to any other project in the same city
 *      with status = 'completed'.
 *
 * Falls back to a city-level proxy when no entity linkage exists: if the
 * city has ≥3 completed projects, we treat the market as having established
 * contractors (conservative — avoids inflating the signal for sparse data).
 */
async function fetchContractorTrackRecord(
  projects: ProjectRow[],
): Promise<Map<number, boolean>> {
  const result = new Map<number, boolean>()
  if (projects.length === 0) return result

  // Build city → completed project count lookup
  const cityCodes = [...new Set(projects.map(p => p.city_code).filter(Boolean))] as string[]

  const { data: completedData } = await supabaseAdmin
    .from('projects')
    .select('city_code')
    .in('status', ['completed'])
    .in('city_code', cityCodes)

  const cityCompletedCount = new Map<string, number>()
  for (const row of completedData ?? []) {
    const r = row as { city_code: string }
    cityCompletedCount.set(r.city_code, (cityCompletedCount.get(r.city_code) ?? 0) + 1)
  }

  // Primary: check entity_edges for award_to_contractor with a completion link
  const permitNumbers = projects.map(p => p.permit_number)

  const { data: entityData } = await supabaseAdmin
    .from('entities')
    .select('id, external_id')
    .eq('type', 'permit')
    .in('external_id', permitNumbers)

  const permitEntityMap = new Map<string, number>()
  for (const row of entityData ?? []) {
    const r = row as { id: number; external_id: string }
    permitEntityMap.set(r.external_id, r.id)
  }

  const entityIds = [...permitEntityMap.values()]
  let contractorLinkedProjects = new Set<string>()  // permit_numbers with a contractor link

  if (entityIds.length > 0) {
    const { data: edgeData } = await supabaseAdmin
      .from('entity_edges')
      .select('from_id, to_id')
      .eq('edge_type', 'award_to_contractor')
      .in('from_id', entityIds)

    const contractorIds = [...new Set((edgeData ?? []).map((r: { to_id: number }) => r.to_id))]
    const fromIdToPermitNumber = new Map<number, string>()
    for (const [pn, eid] of permitEntityMap) fromIdToPermitNumber.set(eid, pn)

    if (contractorIds.length > 0) {
      // Find other permits linked to same contractors
      const { data: reverseEdges } = await supabaseAdmin
        .from('entity_edges')
        .select('from_id, to_id')
        .eq('edge_type', 'award_to_contractor')
        .in('to_id', contractorIds)

      const otherPermitEntityIds = (reverseEdges ?? [])
        .map((r: { from_id: number }) => r.from_id)
        .filter(id => !entityIds.includes(id))

      if (otherPermitEntityIds.length > 0) {
        const { data: otherEntities } = await supabaseAdmin
          .from('entities')
          .select('id, external_id')
          .in('id', otherPermitEntityIds)

        const otherPermitNumbers = (otherEntities ?? []).map((r: { external_id: string }) => r.external_id)

        if (otherPermitNumbers.length > 0) {
          const { data: completedProjects } = await supabaseAdmin
            .from('projects')
            .select('permit_number, city_code')
            .in('permit_number', otherPermitNumbers)
            .in('status', ['completed'])

          // Map city_code → Set<contractor entity ids> that have completions there
          const cityContractorCompletions = new Map<string, Set<number>>()
          for (const cp of completedProjects ?? []) {
            const r = cp as { permit_number: string; city_code: string }
            // Find which contractor edge touches this completed permit
            const cpEntityId = (otherEntities ?? []).find(
              (e: { external_id: string }) => e.external_id === r.permit_number
            ) as { id: number } | undefined
            if (!cpEntityId) continue
            const contractorIds = (reverseEdges ?? [])
              .filter((e: { from_id: number }) => e.from_id === cpEntityId.id)
              .map((e: { to_id: number }) => e.to_id)
            if (!cityContractorCompletions.has(r.city_code)) {
              cityContractorCompletions.set(r.city_code, new Set())
            }
            for (const cid of contractorIds) {
              cityContractorCompletions.get(r.city_code)!.add(cid)
            }
          }

          // For each original project: does its city have a contractor completion?
          for (const project of projects) {
            const entityId = permitEntityMap.get(project.permit_number)
            if (!entityId) continue
            const myContractorIds = (edgeData ?? [])
              .filter((e: { from_id: number }) => e.from_id === entityId)
              .map((e: { to_id: number }) => e.to_id)
            const citySet = cityContractorCompletions.get(project.city_code ?? '')
            const hasPrior = myContractorIds.some(cid => citySet?.has(cid))
            if (hasPrior) result.set(project.id, true)
          }
        }
      }
    }
  }

  // Fallback for projects without entity linkage: city-level proxy
  for (const project of projects) {
    if (result.has(project.id)) continue
    const completedCount = cityCompletedCount.get(project.city_code ?? '') ?? 0
    result.set(project.id, completedCount >= 3)
  }

  return result
}

// ── Batch compute (used by cron route) ──────────────────────────────────────

export interface BatchFormationResult {
  computed:   FormationScoreResult[]
  errors:     string[]
  durationMs: number
  hasMore:    boolean
}

export async function batchComputeFormationScores(
  opts?: { offset: number; limit: number },
): Promise<BatchFormationResult> {
  const start = Date.now()
  const errors: string[] = []

  let projects: ProjectRow[]
  try {
    projects = await fetchActiveProjects(opts)
  } catch (err) {
    return {
      computed:   [],
      errors:     [err instanceof Error ? err.message : String(err)],
      durationMs: Date.now() - start,
      hasMore:    false,
    }
  }

  const hasMore = opts != null && projects.length === opts.limit

  if (projects.length === 0) {
    return { computed: [], errors: [], durationMs: Date.now() - start, hasMore: false }
  }

  const projectIds = projects.map(p => p.id)

  // Fan out IO for enrichment data
  const [amendmentCounts, contractorTrack] = await Promise.all([
    fetchAmendmentCounts(projectIds).catch(err => {
      errors.push(`amendment counts: ${err instanceof Error ? err.message : String(err)}`)
      return new Map<number, number>()
    }),
    fetchContractorTrackRecord(projects).catch(err => {
      errors.push(`contractor track: ${err instanceof Error ? err.message : String(err)}`)
      return new Map<number, boolean>()
    }),
  ])

  const computed: FormationScoreResult[] = []

  for (const project of projects) {
    try {
      const appliedDate = project.applied_date ? new Date(project.applied_date) : null
      const daysSinceFirst = appliedDate
        ? Math.floor((Date.now() - appliedDate.getTime()) / 86_400_000)
        : null

      const input: FormationScoreInput = {
        project_id:                            project.id,
        days_since_first_permit_event:         daysSinceFirst,
        permit_amendment_count:                amendmentCounts.get(project.id) ?? null,
        has_federal_award_nearby:              project.federal_award_match,
        satellite_bsi_change:                  project.satellite_bsi_change,
        contractor_has_prior_completions_in_metro: contractorTrack.get(project.id) ?? null,
      }

      computed.push(computeFormationScore(input))
    } catch (err) {
      errors.push(`project ${project.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { computed, errors, durationMs: Date.now() - start, hasMore }
}
