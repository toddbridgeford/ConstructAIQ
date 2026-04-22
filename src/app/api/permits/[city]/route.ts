import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ZipBucket { zip_code: string; count: number; total_valuation: number }

export async function GET(
  _request: Request,
  { params }: { params: { city: string } },
) {
  const city = params.city.toUpperCase()

  // Verify city exists
  const { data: source, error: srcErr } = await supabaseAdmin
    .from('permit_sources')
    .select('city_code, city_name, state_code, last_fetched, record_count, status')
    .eq('city_code', city)
    .single()

  if (srcErr || !source) {
    return NextResponse.json({ error: `City not found: ${city}` }, { status: 404 })
  }

  const twoYearsAgo  = new Date(Date.now() - 730 * 86400000).toISOString().split('T')[0]
  const ninetyDaysAgo = new Date(Date.now() -  90 * 86400000).toISOString().split('T')[0]

  // Run all three queries in parallel
  const [monthlyResult, zipResult, highValueResult] = await Promise.all([
    // 24 months of aggregations — 'all' type/class for the overview
    supabaseAdmin
      .from('permit_monthly_agg')
      .select('year_month, permit_type, permit_class, permit_count, total_valuation, total_units, total_sqft')
      .eq('city_code', city)
      .gte('year_month', twoYearsAgo.slice(0, 7))
      .order('year_month', { ascending: true }),

    // Raw permits for zip grouping — last 12 months, just the columns needed
    supabaseAdmin
      .from('city_permits')
      .select('zip_code, valuation')
      .eq('city_code', city)
      .gte('issued_date', new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0])
      .not('zip_code', 'is', null)
      .neq('zip_code', '')
      .limit(5000),

    // High-value permits — last 90 days, valuation > $5M
    supabaseAdmin
      .from('city_permits')
      .select('permit_number, permit_type, permit_class, valuation, address, zip_code, issued_date')
      .eq('city_code', city)
      .gt('valuation', 5000000)
      .gte('issued_date', ninetyDaysAgo)
      .order('valuation', { ascending: false })
      .limit(10),
  ])

  const allMonthly = monthlyResult.data ?? []

  // Monthly overview (permit_type='all', permit_class='all')
  const monthlyOverview = allMonthly
    .filter(r => r.permit_type === 'all' && r.permit_class === 'all')
    .map(r => ({
      year_month:      r.year_month,
      permit_count:    r.permit_count,
      total_valuation: r.total_valuation,
      total_units:     r.total_units,
      total_sqft:      r.total_sqft,
    }))

  // Permit type breakdown — latest available month, all classes
  const latestYM = monthlyOverview[monthlyOverview.length - 1]?.year_month ?? null
  const typeBreakdown = latestYM
    ? allMonthly
        .filter(r => r.year_month === latestYM && r.permit_class === 'all' && r.permit_type !== 'all')
        .map(r => ({ permit_type: r.permit_type, permit_count: r.permit_count, total_valuation: r.total_valuation }))
    : []

  // Zip code aggregation — group in JS
  const zipMap: Record<string, ZipBucket> = {}
  for (const row of zipResult.data ?? []) {
    const z = (row.zip_code as string).slice(0, 5)
    if (!z || z.length < 5) continue
    if (!zipMap[z]) zipMap[z] = { zip_code: z, count: 0, total_valuation: 0 }
    zipMap[z].count++
    zipMap[z].total_valuation += (row.valuation as number) ?? 0
  }
  const topZips = Object.values(zipMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(z => ({ ...z, total_valuation: Math.round(z.total_valuation) }))

  const highValuePermits = (highValueResult.data ?? []).map(p => ({
    permit_number:  p.permit_number,
    permit_type:    p.permit_type,
    permit_class:   p.permit_class,
    valuation:      p.valuation,
    address:        p.address,
    zip_code:       p.zip_code,
    issued_date:    p.issued_date,
  }))

  return NextResponse.json(
    {
      city_code:          source.city_code,
      city_name:          source.city_name,
      state_code:         source.state_code,
      last_fetched:       source.last_fetched,
      record_count:       source.record_count,
      status:             source.status,
      monthly:            monthlyOverview,
      type_breakdown:     typeBreakdown,
      top_zips:           topZips,
      high_value_permits: highValuePermits,
      as_of:              new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } },
  )
}
