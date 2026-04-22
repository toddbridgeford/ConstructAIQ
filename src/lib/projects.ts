import { supabaseAdmin } from '@/lib/supabase'

export async function promotePermitsToProjects(cityCode: string): Promise<number> {
  const { data: permits } = await supabaseAdmin
    .from('city_permits')
    .select('id, permit_number, permit_type, permit_class, status, valuation, sqft, units, address, zip_code, latitude, longitude, applied_date, issued_date, finaled_date, city_code')
    .eq('city_code', cityCode)
    .or('valuation.gt.500000,permit_type.eq.new_construction')
    .neq('permit_type', 'demolition')
    .order('issued_date', { ascending: false })
    .limit(500)

  if (!permits?.length) return 0

  const rows = permits.map(p => ({
    city_code:       p.city_code as string,
    permit_id:       p.id as number,
    permit_number:   p.permit_number as string,
    project_name:    `${formatType(p.permit_type as string)} at ${p.address}`,
    project_type:    p.permit_type as string,
    building_class:  p.permit_class as string,
    status:          mapStatus(p.status as string),
    address:         p.address as string,
    city:            cityCode,
    state_code:      stateFromCity(cityCode),
    zip_code:        p.zip_code as string,
    latitude:        p.latitude as number | null,
    longitude:       p.longitude as number | null,
    valuation:       p.valuation as number | null,
    sqft:            p.sqft as number | null,
    units:           p.units as number | null,
    applied_date:    p.applied_date as string | null,
    approved_date:   p.issued_date as string | null,
    last_updated_at: new Date().toISOString(),
  }))

  const { error } = await supabaseAdmin
    .from('projects')
    .upsert(rows, { onConflict: 'city_code,permit_number', ignoreDuplicates: false })

  return error ? 0 : rows.length
}

function formatType(type: string): string {
  const map: Record<string, string> = {
    new_construction: 'New Construction',
    addition:         'Addition',
    alteration:       'Renovation',
    other:            'Permit',
  }
  return map[type] ?? 'Project'
}

function mapStatus(raw: string): string {
  const r = (raw ?? '').toLowerCase()
  if (r.includes('final') || r.includes('complet') || r.includes('closed'))
    return 'completed'
  if (r.includes('issued') || r.includes('approved') || r.includes('active'))
    return 'active'
  if (r.includes('applied') || r.includes('pending') || r.includes('review'))
    return 'applied'
  if (r.includes('expired') || r.includes('void') || r.includes('cancel'))
    return 'expired'
  return 'unknown'
}

const CITY_STATES: Record<string, string> = {
  NYC:'NY', LAX:'CA', CHI:'IL', HOU:'TX', PHX:'AZ', SAN:'TX', DAL:'TX',
  JAX:'FL', AUS:'TX', COL:'OH', IND:'IN', SJC:'CA', SEA:'WA', DEN:'CO',
  NSH:'TN', CLT:'NC', TPA:'FL', ATL:'GA', MIA:'FL', POR:'OR',
  MIN:'MN', STL:'MO', KCY:'MO', ORL:'FL', LVG:'NV', RAL:'NC',
}

function stateFromCity(code: string): string { return CITY_STATES[code] ?? '' }
