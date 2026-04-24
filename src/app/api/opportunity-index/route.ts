import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { estimateSpendWindow } from '@/lib/spendPropagation'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TopDriver {
  id:     string
  label:  string
  score:  number
  detail: string
}

export interface MetroIndexRow {
  metro_code:           string
  metro_name:           string | null
  state_code:           string | null
  // Opportunity Score
  opportunity_score:    number
  classification:       string
  confidence:           string
  top_drivers:          TopDriver[]
  // Reality Gap (aggregated from project-level)
  avg_gap:              number | null
  ghost_count:          number
  stalled_count:        number
  on_track_count:       number
  gap_project_count:    number
  // Spend release (formation score proxy)
  high_formation_count: number  // projects with score ≥ 75
  high_formation_value: number  // USD valuation
  spend_window_90d:     number  // projects likely in 90d window
  // Context
  total_project_count:  number
  computed_at:          string
}

export interface OpportunityIndexResponse {
  metros:    MetroIndexRow[]
  total:     number
  as_of:     string
  coverage:  { with_gap_data: number; with_formation_data: number }
}

// ── DB fetch helpers ──────────────────────────────────────────────────────────

interface OpportunityScoreRow {
  metro_code:     string
  score:          number
  classification: string
  confidence:     string
  computed_at:    string
  driver_json:    {
    top_drivers?: Array<{ id: string; label: string; score: number; detail: string }>
    metro_name?:  string | null
    state_code?:  string | null
  } | null
}

interface SourceRow {
  city_code:  string
  city_name:  string
  state_code: string
}

interface ProjectRow {
  id:         number
  city_code:  string | null
  valuation:  number | null
}

interface GapRow {
  project_id:     number
  gap:            number
  classification: string
  computed_at:    string
}

interface FormationRow {
  project_id:  number
  score:       number
  computed_at: string
}

async function fetchOpportunityScores(): Promise<Map<string, OpportunityScoreRow>> {
  const { data } = await supabase
    .from('opportunity_scores')
    .select('metro_code, score, classification, confidence, computed_at, driver_json')
    .order('computed_at', { ascending: false })
    .limit(500)

  const map = new Map<string, OpportunityScoreRow>()
  for (const row of (data ?? []) as OpportunityScoreRow[]) {
    if (!map.has(row.metro_code)) map.set(row.metro_code, row)
  }
  return map
}

async function fetchMetroSources(): Promise<Map<string, SourceRow>> {
  const { data } = await supabase
    .from('permit_sources')
    .select('city_code, city_name, state_code')
    .eq('status', 'active')

  const map = new Map<string, SourceRow>()
  for (const row of (data ?? []) as SourceRow[]) {
    map.set(row.city_code, row)
  }
  return map
}

async function fetchActiveProjects(): Promise<ProjectRow[]> {
  const { data } = await supabase
    .from('projects')
    .select('id, city_code, valuation')
    .not('lifecycle_state', 'in', '("completed","inactive")')

  return (data ?? []) as ProjectRow[]
}

/** Latest reality gap classification per project — most recent 3 days only. */
async function fetchLatestGaps(): Promise<Map<number, GapRow>> {
  const since = new Date(Date.now() - 3 * 86_400_000).toISOString()
  const { data } = await supabase
    .from('project_reality_gaps')
    .select('project_id, gap, classification, computed_at')
    .gte('computed_at', since)
    .order('computed_at', { ascending: false })
    .limit(5000)

  const map = new Map<number, GapRow>()
  for (const row of (data ?? []) as GapRow[]) {
    if (!map.has(row.project_id)) map.set(row.project_id, row)
  }
  return map
}

/** Latest formation score per project — most recent 3 days only. */
async function fetchLatestFormationScores(): Promise<Map<number, FormationRow>> {
  const since = new Date(Date.now() - 3 * 86_400_000).toISOString()
  const { data } = await supabase
    .from('project_formation_scores')
    .select('project_id, score, computed_at')
    .gte('score', 60)
    .gte('computed_at', since)
    .order('computed_at', { ascending: false })
    .limit(5000)

  const map = new Map<number, FormationRow>()
  for (const row of (data ?? []) as FormationRow[]) {
    if (!map.has(row.project_id)) map.set(row.project_id, row)
  }
  return map
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  try {
    const [scoreMap, sourceMap, projects, gapMap, formationMap] = await Promise.all([
      fetchOpportunityScores(),
      fetchMetroSources(),
      fetchActiveProjects(),
      fetchLatestGaps(),
      fetchLatestFormationScores(),
    ])

    // ── Build per-metro project aggregates ────────────────────────────────────
    type MetroAgg = {
      project_ids:          number[]
      total_valuation:      number
      gap_sum:              number
      gap_count:            number
      ghost_count:          number
      stalled_count:        number
      on_track_count:       number
      high_formation_count: number
      high_formation_value: number
      spend_window_90d:     number
    }

    const metroAgg = new Map<string, MetroAgg>()

    const initAgg = (): MetroAgg => ({
      project_ids: [], total_valuation: 0, gap_sum: 0, gap_count: 0,
      ghost_count: 0, stalled_count: 0, on_track_count: 0,
      high_formation_count: 0, high_formation_value: 0, spend_window_90d: 0,
    })

    for (const p of projects) {
      if (!p.city_code) continue
      if (!metroAgg.has(p.city_code)) metroAgg.set(p.city_code, initAgg())
      const agg = metroAgg.get(p.city_code)!

      agg.project_ids.push(p.id)
      agg.total_valuation += p.valuation ?? 0

      const gap = gapMap.get(p.id)
      if (gap) {
        agg.gap_sum   += gap.gap
        agg.gap_count += 1
        if (gap.classification === 'GHOST')    agg.ghost_count++
        if (gap.classification === 'STALLED')  agg.stalled_count++
        if (gap.classification === 'ON_TRACK') agg.on_track_count++
      }

      const formation = formationMap.get(p.id)
      if (formation) {
        if (formation.score >= 75) {
          agg.high_formation_count++
          agg.high_formation_value += p.valuation ?? 0

          // Proxy window: score ≥ 75 without cadence data → assume moderately active
          const window = estimateSpendWindow(formation.score, 45, p.valuation)
          if (window === '90d') agg.spend_window_90d++
        }
      }
    }

    // ── Assemble metro rows ───────────────────────────────────────────────────
    const metros: MetroIndexRow[] = []

    // Union of all metro codes: those with opportunity scores OR active projects
    const allCodes = new Set([...scoreMap.keys(), ...metroAgg.keys()])

    for (const code of allCodes) {
      const score   = scoreMap.get(code)
      const source  = sourceMap.get(code)
      const agg     = metroAgg.get(code) ?? initAgg()

      if (!score) continue // skip metros without an opportunity score

      const topDrivers: TopDriver[] = (score.driver_json?.top_drivers ?? []).map(d => ({
        id:     d.id,
        label:  d.label,
        score:  d.score,
        detail: d.detail,
      }))

      metros.push({
        metro_code:           code,
        metro_name:           source?.city_name ?? score.driver_json?.metro_name ?? null,
        state_code:           source?.state_code ?? score.driver_json?.state_code ?? null,
        opportunity_score:    score.score,
        classification:       score.classification,
        confidence:           score.confidence,
        top_drivers:          topDrivers,
        avg_gap:              agg.gap_count > 0
          ? Math.round(agg.gap_sum / agg.gap_count)
          : null,
        ghost_count:          agg.ghost_count,
        stalled_count:        agg.stalled_count,
        on_track_count:       agg.on_track_count,
        gap_project_count:    agg.gap_count,
        high_formation_count: agg.high_formation_count,
        high_formation_value: Math.round(agg.high_formation_value),
        spend_window_90d:     agg.spend_window_90d,
        total_project_count:  agg.project_ids.length,
        computed_at:          score.computed_at,
      })
    }

    // Default sort: opportunity score descending
    metros.sort((a, b) => b.opportunity_score - a.opportunity_score)

    const withGap       = metros.filter(m => m.gap_project_count > 0).length
    const withFormation = metros.filter(m => m.high_formation_count > 0).length

    const response: OpportunityIndexResponse = {
      metros,
      total:   metros.length,
      as_of:   new Date().toISOString(),
      coverage: { with_gap_data: withGap, with_formation_data: withFormation },
    }

    return NextResponse.json(response, { headers: CACHE_HEADERS })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'Failed to compute opportunity index', detail: message },
      { status: 500 },
    )
  }
}
