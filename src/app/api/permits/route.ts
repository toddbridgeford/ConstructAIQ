import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_KEY    = 'city_permits_v1'
const CACHE_TTL_MS = 2 * 60 * 60 * 1000  // 2 hours

interface AggRow {
  city_code:       string
  year_month:      string
  permit_count:    number
  total_valuation: number
  total_units:     number
  total_sqft:      number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cityFilter  = searchParams.get('city')?.toUpperCase() ?? null
  const typeFilter  = searchParams.get('type')  || 'all'
  const classFilter = searchParams.get('class') || 'all'
  const months      = Math.min(parseInt(searchParams.get('months') || '12', 10), 24)

  // Only cache the default (no-filter) request
  const useCache = !cityFilter && typeFilter === 'all' && classFilter === 'all' && months === 12

  if (useCache) {
    try {
      const { data: cached } = await supabaseAdmin
        .from('federal_cache')
        .select('data_json, cached_at')
        .eq('key', CACHE_KEY)
        .single()

      if (cached) {
        const age = Date.now() - new Date(cached.cached_at as string).getTime()
        if (age < CACHE_TTL_MS) {
          return NextResponse.json(cached.data_json, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
          })
        }
      }
    } catch {
      // cache miss or unavailable — fall through
    }
  }

  // Load active sources
  let sourcesQ = supabaseAdmin
    .from('permit_sources')
    .select('city_code, city_name, state_code, last_fetched')
    .eq('status', 'active')
  if (cityFilter) sourcesQ = sourcesQ.eq('city_code', cityFilter)

  const { data: sources } = await sourcesQ
  if (!sources?.length) {
    return NextResponse.json(
      { cities: [], national_total: null, as_of: new Date().toISOString() },
    )
  }

  // Compute year-month cutoff for requested window
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const cutoffYM = cutoff.toISOString().slice(0, 7)

  // Monthly aggregations — current window
  let aggQ = supabaseAdmin
    .from('permit_monthly_agg')
    .select('city_code, year_month, permit_count, total_valuation, total_units, total_sqft')
    .eq('permit_type', typeFilter)
    .eq('permit_class', classFilter)
    .gte('year_month', cutoffYM)
    .order('year_month', { ascending: true })
  if (cityFilter) aggQ = aggQ.eq('city_code', cityFilter)

  const { data: aggRows } = await aggQ

  // Same months one year earlier for YoY
  const lyStart = new Date()
  lyStart.setMonth(lyStart.getMonth() - months - 12)
  const lyStartYM = lyStart.toISOString().slice(0, 7)
  const lyEndYM   = cutoffYM

  let lyQ = supabaseAdmin
    .from('permit_monthly_agg')
    .select('city_code, year_month, permit_count, total_valuation')
    .eq('permit_type', typeFilter)
    .eq('permit_class', classFilter)
    .gte('year_month', lyStartYM)
    .lte('year_month', lyEndYM)
  if (cityFilter) lyQ = lyQ.eq('city_code', cityFilter)

  const { data: lyRows } = await lyQ

  // Index data for fast lookups
  const aggByCity: Record<string, AggRow[]> = {}
  for (const row of aggRows ?? []) {
    if (!aggByCity[row.city_code]) aggByCity[row.city_code] = []
    aggByCity[row.city_code].push(row as AggRow)
  }

  const lyByCity: Record<string, Record<string, { count: number; val: number }>> = {}
  for (const row of lyRows ?? []) {
    if (!lyByCity[row.city_code]) lyByCity[row.city_code] = {}
    lyByCity[row.city_code][row.year_month] = {
      count: row.permit_count as number,
      val:   row.total_valuation as number,
    }
  }

  const thisYear = new Date().getFullYear().toString()

  const cities = sources.map(source => {
    const monthly   = aggByCity[source.city_code] ?? []
    const latestRow = monthly[monthly.length - 1] ?? null

    let yoyChangePct: number | null = null
    if (latestRow) {
      const [yr, mo]  = latestRow.year_month.split('-')
      const lyYM      = `${parseInt(yr) - 1}-${mo}`
      const lyData    = lyByCity[source.city_code]?.[lyYM]
      if (lyData?.count) {
        yoyChangePct = parseFloat(
          (((latestRow.permit_count - lyData.count) / lyData.count) * 100).toFixed(1)
        )
      }
    }

    const ytdRows      = monthly.filter(r => r.year_month.startsWith(thisYear))
    const ytdCount     = ytdRows.reduce((s, r) => s + r.permit_count, 0)
    const ytdValuation = ytdRows.reduce((s, r) => s + (r.total_valuation ?? 0), 0)

    return {
      city_code:    source.city_code,
      city_name:    source.city_name,
      state_code:   source.state_code,
      last_fetched: source.last_fetched,
      monthly:      monthly.map(r => ({
        year_month:      r.year_month,
        permit_count:    r.permit_count,
        total_valuation: r.total_valuation,
        total_units:     r.total_units,
      })),
      latest_month: latestRow
        ? {
            year_month:      latestRow.year_month,
            permit_count:    latestRow.permit_count,
            total_valuation: latestRow.total_valuation,
            total_units:     latestRow.total_units,
          }
        : null,
      yoy_change_pct: yoyChangePct,
      ytd_count:      ytdCount,
      ytd_valuation:  ytdValuation,
    }
  })

  const withLatest           = cities.filter(c => c.latest_month !== null)
  const latestMonthCount     = withLatest.reduce((s, c) => s + (c.latest_month?.permit_count ?? 0), 0)
  const latestMonthValuation = withLatest.reduce((s, c) => s + (c.latest_month?.total_valuation ?? 0), 0)
  const yoyValues            = withLatest.filter(c => c.yoy_change_pct !== null).map(c => c.yoy_change_pct!)
  const nationalYoY          = yoyValues.length
    ? parseFloat((yoyValues.reduce((s, v) => s + v, 0) / yoyValues.length).toFixed(1))
    : null

  const payload = {
    cities,
    national_total: {
      cities_covered:         sources.length,
      latest_month_count:     latestMonthCount,
      latest_month_valuation: latestMonthValuation,
      yoy_change_pct:         nationalYoY,
    },
    as_of: new Date().toISOString(),
  }

  if (useCache) {
    supabaseAdmin
      .from('federal_cache')
      .upsert({ key: CACHE_KEY, data_json: payload, cached_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.warn('[permits] Cache write failed:', error.message)
      })
  }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  })
}
