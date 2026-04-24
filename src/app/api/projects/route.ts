import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_CLASSES = new Set(['residential', 'commercial', 'industrial', 'all'])
const VALID_TYPES   = new Set(['new_construction', 'all'])
const VALID_SORTS   = new Set(['valuation', 'date', 'city'])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const city      = searchParams.get('city')?.toUpperCase() ?? null
  const cls       = searchParams.get('class') ?? 'all'
  const type      = searchParams.get('type')  ?? 'all'
  const minValue  = parseInt(searchParams.get('min_value') ?? '500000') || 500000
  const sort      = searchParams.get('sort')  ?? 'valuation'
  const limit     = Math.min(parseInt(searchParams.get('limit') ?? '50') || 50, 200)

  if (!VALID_CLASSES.has(cls))
    return NextResponse.json({ error: `Invalid class. Use: ${[...VALID_CLASSES].join(', ')}` }, { status: 400 })
  if (!VALID_TYPES.has(type))
    return NextResponse.json({ error: `Invalid type. Use: ${[...VALID_TYPES].join(', ')}` }, { status: 400 })
  if (!VALID_SORTS.has(sort))
    return NextResponse.json({ error: `Invalid sort. Use: ${[...VALID_SORTS].join(', ')}` }, { status: 400 })

  let query = supabaseAdmin
    .from('projects')
    .select('id, project_name, project_type, building_class, status, address, city, state_code, zip_code, valuation, sqft, units, applied_date, approved_date, latitude, longitude, satellite_bsi_change, federal_award_match, ai_summary', { count: 'exact' })
    .gte('valuation', minValue)

  if (city)       query = query.eq('city_code', city)
  if (cls !== 'all')  query = query.eq('building_class', cls)
  if (type !== 'all') query = query.eq('project_type', type)

  if (sort === 'valuation') query = query.order('valuation', { ascending: false })
  else if (sort === 'date') query = query.order('applied_date', { ascending: false })
  else if (sort === 'city') query = query.order('city', { ascending: true }).order('valuation', { ascending: false })

  query = query.limit(limit)

  const { data, error, count } = await query

  if (error) {
    console.error('[projects] query error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }

  const projects = (data ?? []).map(p => ({
    id:                 p.id,
    project_name:       p.project_name,
    project_type:       p.project_type,
    building_class:     p.building_class,
    status:             p.status,
    address:            p.address,
    city:               p.city,
    state_code:         p.state_code,
    zip_code:           p.zip_code,
    valuation:          p.valuation,
    sqft:               p.sqft,
    units:              p.units,
    applied_date:       p.applied_date,
    approved_date:      p.approved_date,
    latitude:           p.latitude,
    longitude:          p.longitude,
    satellite_signal:   p.satellite_bsi_change != null && (p.satellite_bsi_change as number) > 0.05,
    federal_award_match: p.federal_award_match,
    ai_summary:         p.ai_summary,
  }))

  const filtersApplied: Record<string, unknown> = { min_value: minValue }
  if (city)       filtersApplied.city  = city
  if (cls  !== 'all') filtersApplied.class = cls
  if (type !== 'all') filtersApplied.type  = type

  return NextResponse.json(
    {
      projects,
      total:           count ?? 0,
      filters_applied: filtersApplied,
      as_of:           new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } },
  )
}
