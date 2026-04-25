import { supabaseAdmin } from '@/lib/supabase'

const CACHE_KEY                 = 'federal_geo_fy2025'
const LEADERBOARD_CACHE_KEY     = 'federal_leaderboard_v1'
const CACHE_TTL_MS              = 24 * 60 * 60 * 1000  // 24 hours

export interface StateAllocation {
  state:        string
  allocated:    number  // $M — back-calculated from IIJA ~72% avg obligation rate
  obligated:    number  // $M — construction contract awards from USASpending
  spent:        number  // $M — estimated at 66% of obligated
  executionPct: number
  rank:         number
}

export interface ContractorLeader {
  rank:       number
  name:       string
  awardValue: number  // $M — total prime-award value over the lookback window
  contracts:  number  // count of awards within the top-N pull
  agency:     string  // primary awarding agency by aggregated value
  state:      string  // primary place of performance state code
}

export interface AgencyShare {
  name:         string
  /**
   * Internally a *share-of-recent-construction-obligations* proxy normalized 0–100
   * (top agency = 100). The field is kept as `obligatedPct` solely for frontend
   * compatibility — it is NOT a statutory execution percentage.
   */
  obligatedPct: number
  color:        string
}

export interface FederalLeaderboard {
  contractors: ContractorLeader[]
  agencies:    AgencyShare[]
}

interface GeoResult {
  shape_code:         string
  aggregated_amount:  number
  display_name:       string
}

interface AwardResult {
  'Recipient Name':                 string | null
  'recipient_id':                   string | null
  'Awarding Agency':                string | null
  'Awarding Sub Agency':            string | null
  'Place of Performance State Code': string | null
  'Award Amount':                   number | null
}

// Construction NAICS codes: residential, non-residential, civil/specialty
const NAICS = ['2361','2362','2371','2372','2379','2381','2382','2383','2389']

function agencyColor(pct: number): string {
  return pct >= 70 ? '#30d158' : pct >= 50 ? '#f5a623' : '#ff453a'
}

async function fetchFromUSASpending(): Promise<StateAllocation[]> {
  const res = await fetch(
    'https://api.usaspending.gov/api/v2/search/spending_by_geography/',
    {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':   'ConstructAIQ/1.0 (constructaiq.trade)',
      },
      body: JSON.stringify({
        scope:     'place_of_performance',
        geo_layer: 'state',
        filters:   {
          time_period:      [{ start_date: '2024-10-01', end_date: '2025-09-30' }],
          award_type_codes: ['A', 'B', 'C', 'D'],
          naics_codes:      NAICS,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    }
  )

  if (!res.ok) throw new Error(`USASpending HTTP ${res.status}`)

  const json = (await res.json()) as { results: GeoResult[] }

  return json.results
    .filter(r => r.shape_code?.length === 2 && r.aggregated_amount > 0)
    .sort((a, b) => b.aggregated_amount - a.aggregated_amount)
    .map((r, idx) => {
      const obligated    = Math.round(r.aggregated_amount / 1e6)
      const allocated    = Math.round(obligated / 0.72)  // IIJA national avg ~72% obligation rate
      const spent        = Math.round(obligated * 0.66)
      const executionPct = parseFloat(((obligated / allocated) * 100).toFixed(1))
      return { state: r.shape_code, allocated, obligated, spent, executionPct, rank: idx + 1 }
    })
}

/**
 * Returns construction contract awards by state for FY2025 from USASpending.gov.
 * Caches results in Supabase for 24 hours. Falls back to an empty array on any
 * failure — callers are responsible for providing a static fallback.
 */
export async function getStateAllocations(
  opts?: { forceRefresh?: boolean }
): Promise<{ data: StateAllocation[]; fromCache: boolean; fetchedAt: string; error?: string }> {
  const forceRefresh = opts?.forceRefresh ?? false

  // ── 1. Check Supabase cache ────────────────────────────────
  if (!forceRefresh) {
    try {
      const { data: cached } = await supabaseAdmin
        .from('federal_cache')
        .select('data_json, cached_at')
        .eq('key', CACHE_KEY)
        .single()

      if (cached) {
        const age = Date.now() - new Date(cached.cached_at as string).getTime()
        if (age < CACHE_TTL_MS) {
          return {
            data:       cached.data_json as StateAllocation[],
            fromCache:  true,
            fetchedAt:  cached.cached_at as string,
          }
        }
      }
    } catch {
      // Supabase unreachable — fall through to live fetch
    }
  }

  // ── 2. Live fetch ──────────────────────────────────────────
  const fetchedAt = new Date().toISOString()
  try {
    const data = await fetchFromUSASpending()

    // Write to cache (fire-and-forget — never block the response)
    supabaseAdmin
      .from('federal_cache')
      .upsert({ key: CACHE_KEY, data_json: data, cached_at: fetchedAt })
      .then(({ error }) => {
        if (error) console.warn('[federal] Cache write failed:', error.message)
      })

    return { data, fromCache: false, fetchedAt }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[federal] USASpending fetch failed:', msg)
    return { data: [], fromCache: false, fetchedAt, error: msg }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Federal contractor + agency leaderboard — live USASpending aggregation
// ───────────────────────────────────────────────────────────────────────────

const LEADERBOARD_LOOKBACK_MONTHS = 24
const LEADERBOARD_PAGES           = 5     // 5 × 100 awards = top 500 by value
const LEADERBOARD_PAGE_LIMIT      = 100
const LEADERBOARD_TOP_CONTRACTORS = 20
const LEADERBOARD_TOP_AGENCIES    = 8

/** Fetch raw construction-NAICS prime awards from USASpending for the lookback window. */
async function fetchAwardsForLeaderboard(): Promise<AwardResult[]> {
  const end = new Date()
  const start = new Date(end)
  start.setMonth(start.getMonth() - LEADERBOARD_LOOKBACK_MONTHS)
  const startDate = start.toISOString().split('T')[0]
  const endDate   = end.toISOString().split('T')[0]

  const all: AwardResult[] = []
  for (let page = 1; page <= LEADERBOARD_PAGES; page++) {
    const res = await fetch(
      'https://api.usaspending.gov/api/v2/search/spending_by_award/',
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':   'ConstructAIQ/1.0 (constructaiq.trade)',
        },
        body: JSON.stringify({
          filters: {
            time_period:      [{ start_date: startDate, end_date: endDate }],
            award_type_codes: ['A', 'B', 'C', 'D'],   // contracts only
            naics_codes:      NAICS,                  // construction (236/237/238)
          },
          fields: [
            'Award ID',
            'Recipient Name',
            'recipient_id',
            'Awarding Agency',
            'Awarding Sub Agency',
            'Place of Performance State Code',
            'Award Amount',
          ],
          page,
          limit: LEADERBOARD_PAGE_LIMIT,
          sort:  'Award Amount',
          order: 'desc',
        }),
        signal: AbortSignal.timeout(15_000),
      },
    )

    if (!res.ok) throw new Error(`USASpending awards HTTP ${res.status}`)

    const json = (await res.json()) as {
      results?:        AwardResult[]
      page_metadata?: { hasNext?: boolean }
    }
    const rows = json.results ?? []
    all.push(...rows)
    if (rows.length < LEADERBOARD_PAGE_LIMIT || json.page_metadata?.hasNext === false) break
  }
  return all
}

/** Aggregate raw awards into the top-N contractor leaderboard. */
export function aggregateContractors(rows: AwardResult[]): ContractorLeader[] {
  interface Bucket {
    name:           string
    state:          string
    value:          number
    count:          number
    agencyTotals:   Map<string, number>
    primaryAgency:  string
    primaryAgencyVal: number
  }

  const byRecipient = new Map<string, Bucket>()
  for (const r of rows) {
    const name = (r['Recipient Name'] ?? '').trim()
    if (!name) continue
    const key = (r['recipient_id'] && r['recipient_id'].trim())
      || name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const value  = Math.max(0, r['Award Amount'] ?? 0)
    const state  = (r['Place of Performance State Code'] ?? '').trim()
    const agency = (r['Awarding Agency'] ?? '').trim() || 'Unknown'

    const cur = byRecipient.get(key)
    if (cur) {
      cur.value += value
      cur.count += 1
      const agencyTotal = (cur.agencyTotals.get(agency) ?? 0) + value
      cur.agencyTotals.set(agency, agencyTotal)
      if (agencyTotal > cur.primaryAgencyVal) {
        cur.primaryAgency    = agency
        cur.primaryAgencyVal = agencyTotal
      }
      // First non-empty state wins; aggregating awards to one place is unreliable
      if (!cur.state && state) cur.state = state
    } else {
      byRecipient.set(key, {
        name,
        state,
        value,
        count: 1,
        agencyTotals:    new Map([[agency, value]]),
        primaryAgency:   agency,
        primaryAgencyVal: value,
      })
    }
  }

  return [...byRecipient.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, LEADERBOARD_TOP_CONTRACTORS)
    .map((b, i) => ({
      rank:       i + 1,
      name:       b.name,
      awardValue: Math.round(b.value / 1e6),  // $M
      contracts:  b.count,
      agency:     b.primaryAgency,
      state:      b.state || '',
    }))
}

/**
 * Aggregate raw awards into a per-agency share-of-construction-obligations table.
 *
 * `obligatedPct` is computed as each agency's share of total construction
 * obligations in the lookback window, normalized so the top agency = 100.
 * It is a defensible proxy — NOT a statutory execution percentage. The field
 * name is preserved for frontend compatibility (see `AgencyShare` doc).
 */
export function aggregateAgencies(rows: AwardResult[]): AgencyShare[] {
  const byAgency = new Map<string, number>()
  for (const r of rows) {
    const agency = (r['Awarding Agency'] ?? '').trim()
    if (!agency) continue
    const value = Math.max(0, r['Award Amount'] ?? 0)
    byAgency.set(agency, (byAgency.get(agency) ?? 0) + value)
  }

  const sorted = [...byAgency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, LEADERBOARD_TOP_AGENCIES)

  if (!sorted.length) return []
  const max = sorted[0][1] || 1
  return sorted.map(([name, val]) => {
    const obligatedPct = Math.max(0, Math.min(100, Math.round((val / max) * 100)))
    return { name, obligatedPct, color: agencyColor(obligatedPct) }
  })
}

/**
 * Returns a top-contractor leaderboard and a per-agency obligation-share proxy
 * derived from USASpending.gov construction prime awards over the last
 * 24 months. Caches results in Supabase for 24 hours under
 * `federal_leaderboard_v1`. On any failure callers receive empty arrays plus
 * an `error` string — they are responsible for surfacing/fallback semantics.
 */
export async function getFederalLeaderboard(
  opts?: { forceRefresh?: boolean },
): Promise<{
  data:      FederalLeaderboard
  fromCache: boolean
  fetchedAt: string
  error?:    string
}> {
  const forceRefresh = opts?.forceRefresh ?? false
  const empty: FederalLeaderboard = { contractors: [], agencies: [] }

  // ── 1. Cache lookup ───────────────────────────────────────
  if (!forceRefresh) {
    try {
      const { data: cached } = await supabaseAdmin
        .from('federal_cache')
        .select('data_json, cached_at')
        .eq('key', LEADERBOARD_CACHE_KEY)
        .single()
      if (cached) {
        const age = Date.now() - new Date(cached.cached_at as string).getTime()
        if (age < CACHE_TTL_MS) {
          return {
            data:       cached.data_json as FederalLeaderboard,
            fromCache:  true,
            fetchedAt:  cached.cached_at as string,
          }
        }
      }
    } catch {
      // Supabase unreachable — fall through to live fetch
    }
  }

  // ── 2. Live fetch + aggregate ─────────────────────────────
  const fetchedAt = new Date().toISOString()
  try {
    const rows        = await fetchAwardsForLeaderboard()
    const contractors = aggregateContractors(rows)
    const agencies    = aggregateAgencies(rows)
    const data: FederalLeaderboard = { contractors, agencies }

    // Fire-and-forget cache write
    supabaseAdmin
      .from('federal_cache')
      .upsert({ key: LEADERBOARD_CACHE_KEY, data_json: data, cached_at: fetchedAt })
      .then(({ error }) => {
        if (error) console.warn('[federal] Leaderboard cache write failed:', error.message)
      })

    return { data, fromCache: false, fetchedAt }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[federal] USASpending leaderboard fetch failed:', msg)

    // Last-resort: try to return *stale* cache rather than nothing
    try {
      const { data: cached } = await supabaseAdmin
        .from('federal_cache')
        .select('data_json, cached_at')
        .eq('key', LEADERBOARD_CACHE_KEY)
        .single()
      if (cached) {
        return {
          data:      cached.data_json as FederalLeaderboard,
          fromCache: true,
          fetchedAt: cached.cached_at as string,
          error:     msg,
        }
      }
    } catch {
      // Cache miss — fall through
    }

    return { data: empty, fromCache: false, fetchedAt, error: msg }
  }
}
