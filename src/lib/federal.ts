import { supabaseAdmin } from '@/lib/supabase'

const CACHE_KEY    = 'federal_geo_fy2025'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24 hours

export interface StateAllocation {
  state:        string
  allocated:    number  // $M — back-calculated from IIJA ~72% avg obligation rate
  obligated:    number  // $M — construction contract awards from USASpending
  spent:        number  // $M — estimated at 66% of obligated
  executionPct: number
  rank:         number
}

interface GeoResult {
  shape_code:         string
  aggregated_amount:  number
  display_name:       string
}

// Construction NAICS codes: residential, non-residential, civil/specialty
const NAICS = ['2361','2362','2371','2372','2379','2381','2382','2383','2389']

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
