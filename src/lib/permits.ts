export interface RawPermit {
  [key: string]: string | number | null | undefined
}

export interface NormalizedPermit {
  permit_number: string
  permit_type:   string
  permit_class:  string
  status:        string
  valuation:     number | null
  sqft:          number | null
  units:         number | null
  address:       string
  zip_code:      string
  latitude:      number | null
  longitude:     number | null
  applied_date:  string | null
  issued_date:   string | null
  finaled_date:  string | null
}

// Field name mappings per city — verified against live Socrata dataset schemas
const FIELD_MAPS: Record<string, Record<string, string>> = {
  NYC: {
    permit_number: 'job__',
    permit_type:   'job_type',
    status:        'job_status',
    valuation:     'initial_cost',
    address:       'house_no',
    zip_code:      'zip_code',
    applied_date:  'pre_filing_date',
    issued_date:   'fully_permitted',
    latitude:      'gis_latitude',
    longitude:     'gis_longitude',
  },
  LAX: {
    permit_number: 'permit_nbr',
    permit_type:   'permit_type',
    status:        'status_current',
    valuation:     'valuation',
    sqft:          'sqft',
    address:       'address',
    zip_code:      'zip_code',
    applied_date:  'application_date',
    issued_date:   'issue_date',
    finaled_date:  'final_date',
    latitude:      'latitude',
    longitude:     'longitude',
  },
  CHI: {
    permit_number: 'permit_',
    permit_type:   'permit_type',
    status:        'current_status',
    valuation:     'estimated_cost',
    address:       'street_number',
    zip_code:      'zip_code',
    applied_date:  'application_start_date',
    issued_date:   'issue_date',
    latitude:      'latitude',
    longitude:     'longitude',
  },
  HOU: {
    permit_number: 'permit_number',
    permit_type:   'permit_type',
    status:        'status',
    valuation:     'declared_valuation',
    sqft:          'square_feet',
    address:       'address',
    zip_code:      'zip',
    applied_date:  'application_date',
    issued_date:   'approval_date',
    latitude:      'latitude',
    longitude:     'longitude',
  },
  PHX: {
    permit_number: 'permit_number',
    permit_type:   'type_of_work',
    status:        'status',
    valuation:     'job_value',
    sqft:          'square_footage',
    address:       'address',
    zip_code:      'zip_code',
    applied_date:  'date_applied',
    issued_date:   'date_issued',
    latitude:      'latitude',
    longitude:     'longitude',
  },
  SEA: {
    permit_number: 'application_permit_number',
    permit_type:   'permit_type',
    status:        'status_current',
    valuation:     'application_valuation',
    address:       'address',
    zip_code:      'zip_code',
    applied_date:  'application_date',
    issued_date:   'issue_date',
    latitude:      'latitude',
    longitude:     'longitude',
  },
  DEN: {
    permit_number: 'permit_no',
    permit_type:   'work_type',
    status:        'permit_status',
    valuation:     'case_project_valuation',
    address:       'address',
    zip_code:      'zip_code',
    applied_date:  'applied_date',
    issued_date:   'issued_date',
    latitude:      'latitude',
    longitude:     'longitude',
  },
  DEFAULT: {
    permit_number: 'permit_number',
    permit_type:   'permit_type',
    status:        'status',
    valuation:     'valuation',
    sqft:          'sq_ft',
    units:         'units',
    address:       'address',
    zip_code:      'zip_code',
    applied_date:  'applied_date',
    issued_date:   'issued_date',
    finaled_date:  'finaled_date',
    latitude:      'latitude',
    longitude:     'longitude',
  },
}

export function classifyPermitType(raw: string): string {
  const r = (raw ?? '').toLowerCase()
  if (r.includes('new') || r.includes('nb') || r.includes('erect'))
    return 'new_construction'
  if (r.includes('demo') || r.includes('wreck'))
    return 'demolition'
  if (r.includes('addition') || r.includes('add'))
    return 'addition'
  if (r.includes('alter') || r.includes('remodel') || r.includes('interior'))
    return 'alteration'
  return 'other'
}

export function classifyPermitClass(raw: string): string {
  const r = (raw ?? '').toLowerCase()
  if (
    r.includes('residential') || r.includes('dwelling') || r.includes('apartment') ||
    r.includes('condo') || r.includes('single family') || r.includes('multi family')
  ) return 'residential'
  if (
    r.includes('commercial') || r.includes('office') || r.includes('retail') ||
    r.includes('hotel') || r.includes('restaurant')
  ) return 'commercial'
  if (r.includes('industrial') || r.includes('warehouse') || r.includes('manufacturing'))
    return 'industrial'
  return 'other'
}

export function normalizePermit(raw: RawPermit, cityCode: string): NormalizedPermit | null {
  const map = FIELD_MAPS[cityCode] ?? FIELD_MAPS.DEFAULT

  const get = (field: string): string =>
    String(raw[map[field] ?? field] ?? '').trim()

  const getNum = (field: string): number | null => {
    const v = parseFloat(get(field).replace(/[$,]/g, ''))
    return isNaN(v) ? null : v
  }

  const getDate = (field: string): string | null => {
    const v = get(field)
    if (!v) return null
    try {
      return new Date(v).toISOString().split('T')[0]
    } catch { return null }
  }

  const permitNumber = get('permit_number')
  if (!permitNumber) return null

  const rawType = get('permit_type')

  return {
    permit_number: permitNumber,
    permit_type:   classifyPermitType(rawType),
    permit_class:  classifyPermitClass(get('permit_class') || rawType),
    status:        get('status') || 'unknown',
    valuation:     getNum('valuation'),
    sqft:          getNum('sqft'),
    units:         getNum('units') !== null ? Math.round(getNum('units')!) : null,
    address:       get('address'),
    zip_code:      get('zip_code').slice(0, 5),
    latitude:      getNum('latitude'),
    longitude:     getNum('longitude'),
    applied_date:  getDate('applied_date'),
    issued_date:   getDate('issued_date'),
    finaled_date:  getDate('finaled_date'),
  }
}

export async function fetchCityPermits(
  source: { city_code: string; api_url: string },
  limit = 2000,
  // daysBack is advisory — Socrata doesn't expose a uniform date field across all
  // city schemas, so we rely on $order=:updated_at DESC + limit to stay recent.
  _daysBack = 180,
): Promise<NormalizedPermit[]> {
  const url = new URL(source.api_url)
  url.searchParams.set('$limit', String(limit))
  url.searchParams.set('$order', ':updated_at DESC')

  const r = await fetch(url.toString(), {
    headers: {
      'Accept':     'application/json',
      'User-Agent': 'ConstructAIQ/1.0 (constructaiq.trade)',
    },
    signal: AbortSignal.timeout(30000),
  })

  if (!r.ok) throw new Error(`${source.city_code}: HTTP ${r.status}`)

  const rows: RawPermit[] = await r.json()

  return rows
    .map(row => normalizePermit(row, source.city_code))
    .filter((p): p is NormalizedPermit => p !== null)
}
