import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import {
  buildSpendWindows,
  buildTradeBaskets,
  computeTightness,
  shouldEmitSignal,
  FORMATION_MIN_SCORE,
  type ProjectSpendInput,
  type SpendPropagationResult,
} from '@/lib/spendPropagation'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
}

// ── DB helpers ───────────────────────────────────────────────────────────────

interface ProjectMeta {
  id:            number
  building_class: string | null
  project_type:  string | null
  project_name:  string | null
  valuation:     number | null
  applied_date:  string | null
}

interface FormationRow {
  project_id:     number
  score:          number
  classification: string
  confidence:     string
  computed_at:    string
}

async function fetchMetroProjects(metro: string): Promise<ProjectMeta[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, building_class, project_type, project_name, valuation, applied_date')
    .eq('city_code', metro)
    .not('lifecycle_state', 'in', '("completed","inactive")')

  if (error) throw new Error(`fetchMetroProjects: ${error.message}`)
  return (data ?? []) as ProjectMeta[]
}

/** Returns only the most recent formation score per project. */
async function fetchLatestFormationScores(
  projectIds: number[],
  minScore:   number,
): Promise<Map<number, FormationRow>> {
  if (projectIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('project_formation_scores')
    .select('project_id, score, classification, confidence, computed_at')
    .in('project_id', projectIds)
    .gte('score', minScore)
    .order('computed_at', { ascending: false })

  if (error) throw new Error(`fetchLatestFormationScores: ${error.message}`)

  // Deduplicate: keep the most recent row per project
  const map = new Map<number, FormationRow>()
  for (const row of (data ?? []) as FormationRow[]) {
    if (!map.has(row.project_id)) {
      map.set(row.project_id, row)
    }
  }
  return map
}

/** Days since the most recent permit-category event per project. */
async function fetchDaysSinceLastAmendment(
  projectIds: number[],
): Promise<Map<number, number>> {
  const map = new Map<number, number>()
  if (projectIds.length === 0) return map

  const { data } = await supabase
    .from('project_events')
    .select('project_id, event_date')
    .in('project_id', projectIds)
    .ilike('event_type', 'permit%')
    .order('event_date', { ascending: false })

  for (const row of (data ?? []) as { project_id: number; event_date: string }[]) {
    if (!map.has(row.project_id)) {
      map.set(
        row.project_id,
        Math.floor((Date.now() - new Date(row.event_date).getTime()) / 86_400_000),
      )
    }
  }
  return map
}

/**
 * Guard against duplicate signals: return true if a trade_demand_signal was
 * already emitted for this metro within the last 24 hours.
 */
async function recentSignalExists(metro: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString()
  const { count } = await supabaseAdmin
    .from('event_log')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'trade_demand_signal')
    .filter('payload->>metro_code', 'eq', metro)
    .gte('ingested_at', since)

  return (count ?? 0) > 0
}

async function emitTradeSignal(
  metro:        string,
  triggerWindow: string | null,
  totalValue:   number,
  baskets:      { commodity: string; window: string; estimated_value: number }[],
  projectCount: number,
): Promise<void> {
  const topCommodities = baskets
    .slice(0, 4)
    .map(b => b.commodity)

  await supabaseAdmin.from('event_log').insert({
    entity_id:    null,
    event_type:   'trade_demand_signal',
    event_date:   new Date().toISOString(),
    source:       'spend_propagation',
    payload: {
      metro_code:     metro,
      trigger_window: triggerWindow,
      total_value:    Math.round(totalValue),
      commodities:    topCommodities,
      project_count:  projectCount,
    },
    signal_value: totalValue,
  })
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const metro            = searchParams.get('metro')?.trim().toUpperCase()
  const minScore         = Math.max(
    0,
    Math.min(100, Number(searchParams.get('min_score') ?? FORMATION_MIN_SCORE)),
  )

  if (!metro) {
    return NextResponse.json(
      { error: 'metro parameter required — e.g. ?metro=PHX' },
      { status: 400 },
    )
  }

  try {
    // ── 1. Fetch metro projects ───────────────────────────────────────────────
    const projects = await fetchMetroProjects(metro)
    if (projects.length === 0) {
      return NextResponse.json(
        {
          metro_code:          metro,
          as_of:               new Date().toISOString(),
          formation_threshold: minScore,
          project_count:       0,
          spend_windows:       [],
          trade_baskets:       [],
          tightness_score:     {
            score: 0, level: 'LOOSE', hot_window: null,
            driver: 'No active projects found for this metro',
            tight_windows: [],
          },
          signal_emitted: false,
          signal_detail:  null,
        } satisfies SpendPropagationResult,
        { headers: CACHE_HEADERS },
      )
    }

    const projectIds = projects.map(p => p.id)

    // ── 2. Fetch formation scores + amendment cadence concurrently ────────────
    const [formationMap, cadenceMap] = await Promise.all([
      fetchLatestFormationScores(projectIds, minScore),
      fetchDaysSinceLastAmendment(projectIds),
    ])

    if (formationMap.size === 0) {
      return NextResponse.json(
        {
          metro_code:          metro,
          as_of:               new Date().toISOString(),
          formation_threshold: minScore,
          project_count:       0,
          spend_windows:       [],
          trade_baskets:       [],
          tightness_score: {
            score: 0, level: 'LOOSE', hot_window: null,
            driver: `No formation scores ≥ ${minScore} found — run the formation-scores cron first`,
            tight_windows: [],
          },
          signal_emitted: false,
          signal_detail:  null,
        } satisfies SpendPropagationResult,
        { headers: CACHE_HEADERS },
      )
    }

    // ── 3. Assemble project spend inputs ──────────────────────────────────────
    const projectMeta = new Map(projects.map(p => [p.id, p]))

    const spendInputs: ProjectSpendInput[] = []
    for (const [projectId, score] of formationMap) {
      const meta = projectMeta.get(projectId)
      if (!meta) continue
      spendInputs.push({
        project_id:                projectId,
        project_name:              meta.project_name,
        building_class:            meta.building_class,
        project_type:              meta.project_type,
        valuation:                 meta.valuation,
        formation_score:           score.score,
        formation_confidence:      score.confidence,
        days_since_last_amendment: cadenceMap.get(projectId) ?? null,
      })
    }

    // ── 4. Compute propagation signals ────────────────────────────────────────
    const spend_windows   = buildSpendWindows(spendInputs)
    const trade_baskets   = buildTradeBaskets(spendInputs, spend_windows)
    const tightness_score = computeTightness(spend_windows)

    // ── 5. Emit trade_demand_signal if basket crosses threshold ───────────────
    const { emit, reason, trigger_window, total_value } = shouldEmitSignal(
      spend_windows,
      trade_baskets,
    )

    let signal_emitted = false
    let signal_detail: string | null = null

    if (emit) {
      const alreadyEmitted = await recentSignalExists(metro)
      if (!alreadyEmitted) {
        try {
          await emitTradeSignal(
            metro,
            trigger_window,
            total_value,
            trade_baskets,
            spendInputs.length,
          )
          signal_emitted = true
          signal_detail  = reason
        } catch {
          // Non-fatal — propagation result is still valid without the event
        }
      } else {
        signal_detail = `Signal threshold met but suppressed — already emitted within 24h (${reason})`
      }
    }

    const result: SpendPropagationResult = {
      metro_code:          metro,
      as_of:               new Date().toISOString(),
      formation_threshold: minScore,
      project_count:       spendInputs.length,
      spend_windows,
      trade_baskets,
      tightness_score,
      signal_emitted,
      signal_detail,
    }

    return NextResponse.json(result, { headers: CACHE_HEADERS })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'Failed to compute spend propagation', detail: message },
      { status: 500 },
    )
  }
}
