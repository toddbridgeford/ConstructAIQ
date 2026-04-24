import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Base costs (Jan 2020 baseline, $/sqft) ────────────────────────────────────
const BASE_COSTS: Record<string, { low: number; mid: number; high: number }> = {
  office:      { low: 180, mid: 260, high: 380 },
  warehouse:   { low: 65,  mid: 95,  high: 140 },
  multifamily: { low: 140, mid: 200, high: 300 },
  industrial:  { low: 60,  mid: 88,  high: 125 },
  healthcare:  { low: 350, mid: 520, high: 750 },
  retail:      { low: 100, mid: 155, high: 230 },
  education:   { low: 200, mid: 295, high: 430 },
  hotel:       { low: 200, mid: 290, high: 420 },
}

// ── Input weights by building type ────────────────────────────────────────────
const WEIGHTS: Record<string, { lumber: number; steel: number; concrete: number; copper: number; diesel: number; labor: number }> = {
  office:      { lumber: 0.05, steel: 0.20, concrete: 0.20, copper: 0.10, diesel: 0.05, labor: 0.40 },
  warehouse:   { lumber: 0.05, steel: 0.30, concrete: 0.15, copper: 0.05, diesel: 0.08, labor: 0.37 },
  multifamily: { lumber: 0.20, steel: 0.10, concrete: 0.18, copper: 0.08, diesel: 0.05, labor: 0.39 },
  industrial:  { lumber: 0.03, steel: 0.35, concrete: 0.15, copper: 0.07, diesel: 0.10, labor: 0.30 },
  healthcare:  { lumber: 0.03, steel: 0.15, concrete: 0.18, copper: 0.15, diesel: 0.05, labor: 0.44 },
  retail:      { lumber: 0.10, steel: 0.15, concrete: 0.18, copper: 0.08, diesel: 0.06, labor: 0.43 },
  education:   { lumber: 0.08, steel: 0.18, concrete: 0.22, copper: 0.09, diesel: 0.06, labor: 0.37 },
  hotel:       { lumber: 0.10, steel: 0.15, concrete: 0.20, copper: 0.10, diesel: 0.06, labor: 0.39 },
}

// ── BLS PPI Jan 2020 baseline values (approximate published BLS data) ─────────
const BASE_PPI_2020 = {
  lumber:   310.0,  // WPU0811
  steel:    278.0,  // WPU101
  concrete: 242.0,  // WPU132
  copper:   289.0,  // WPU1021
  diesel:   200.0,  // WPU0561
  labor:    100.0,  // normalized 2020 = 100
}

type PPIValues = {
  lumber:   number
  steel:    number
  concrete: number
  copper:   number
  diesel:   number
  labor:    number
}

// ── Region definitions ────────────────────────────────────────────────────────
const NORTHEAST = new Set(['CT','ME','MA','NH','RI','VT','NJ','NY','PA'])
const SOUTH     = new Set(['AL','AR','DC','DE','FL','GA','KY','LA','MD','MS','NC','OK','SC','TN','TX','VA','WV'])
const WEST      = new Set(['AK','AZ','CA','CO','HI','ID','MT','NV','NM','OR','UT','WA','WY'])

const REGION_LABELS: Record<string, string> = {
  northeast: 'Northeast',
  south:     'South',
  midwest:   'Midwest',
  west:      'West',
}

const REGION_ADJUSTMENTS: Record<string, number> = {
  northeast: 0.15,
  west:      0.12,
  midwest:   0.00,
  south:     -0.08,
}

function stateToRegion(state: string): string {
  const s = state.toUpperCase()
  if (NORTHEAST.has(s)) return 'northeast'
  if (SOUTH.has(s))     return 'south'
  if (WEST.has(s))      return 'west'
  return 'midwest'
}

function msaToRegion(msa: string): string {
  // e.g. "dallas-tx" → "TX"
  const parts = msa.toLowerCase().split('-')
  const stateCode = parts[parts.length - 1].toUpperCase()
  if (stateCode.length === 2) return stateToRegion(stateCode)
  return 'midwest'
}

// Try to fetch latest PPI from Supabase observations
async function fetchCurrentPPI(): Promise<PPIValues | null> {
  try {
    const seriesMap: Record<string, keyof PPIValues> = {
      WPU0811: 'lumber',
      WPU101:  'steel',
      WPU132:  'concrete',
      WPU1021: 'copper',
      WPU0561: 'diesel',
    }
    const ids = Object.keys(seriesMap)
    const { data } = await supabase
      .from('observations')
      .select('series_id, value')
      .in('series_id', ids)
      .order('obs_date', { ascending: false })
      .limit(ids.length * 3)

    if (!data?.length) return null

    const ppi: Partial<PPIValues> = { labor: 122.4 }
    const seen = new Set<string>()
    for (const row of data) {
      const key = seriesMap[row.series_id]
      if (key && !seen.has(row.series_id)) {
        seen.add(row.series_id)
        ppi[key] = row.value
      }
    }
    if (!ppi.lumber || !ppi.steel || !ppi.concrete || !ppi.copper || !ppi.diesel) return null
    return ppi as PPIValues
  } catch {
    return null
  }
}

interface InputRatio {
  name:    string
  current: number
  base:    number
  ratio:   number
  pct:     number
}

function computeDrivers(current: PPIValues): Record<string, InputRatio> {
  return {
    lumber:   { name: 'Lumber & Wood',      current: current.lumber,   base: BASE_PPI_2020.lumber,   ratio: current.lumber   / BASE_PPI_2020.lumber,   pct: (current.lumber   / BASE_PPI_2020.lumber   - 1) * 100 },
    steel:    { name: 'Steel Mill Products', current: current.steel,    base: BASE_PPI_2020.steel,    ratio: current.steel    / BASE_PPI_2020.steel,    pct: (current.steel    / BASE_PPI_2020.steel    - 1) * 100 },
    concrete: { name: 'Ready-Mix Concrete',  current: current.concrete, base: BASE_PPI_2020.concrete, ratio: current.concrete / BASE_PPI_2020.concrete, pct: (current.concrete / BASE_PPI_2020.concrete - 1) * 100 },
    copper:   { name: 'Copper Wire',         current: current.copper,   base: BASE_PPI_2020.copper,   ratio: current.copper   / BASE_PPI_2020.copper,   pct: (current.copper   / BASE_PPI_2020.copper   - 1) * 100 },
    diesel:   { name: 'Diesel Fuel',         current: current.diesel,   base: BASE_PPI_2020.diesel,   ratio: current.diesel   / BASE_PPI_2020.diesel,   pct: (current.diesel   / BASE_PPI_2020.diesel   - 1) * 100 },
    labor:    { name: 'Construction Labor',  current: current.labor,    base: BASE_PPI_2020.labor,    ratio: current.labor    / BASE_PPI_2020.labor,    pct: (current.labor    / BASE_PPI_2020.labor    - 1) * 100 },
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const typeParam   = (searchParams.get('type')   ?? 'office').toLowerCase()
  const sqftParam   = parseInt(searchParams.get('sqft')   ?? '100000') || 100000
  const msaParam    = (searchParams.get('msa')    ?? '').toLowerCase()
  const regionParam = (searchParams.get('region') ?? '').toLowerCase()

  const buildingType = Object.keys(BASE_COSTS).includes(typeParam) ? typeParam : 'office'
  const sqft         = Math.min(5_000_000, Math.max(1_000, sqftParam))
  const region       = regionParam && REGION_ADJUSTMENTS[regionParam] !== undefined
    ? regionParam
    : msaParam ? msaToRegion(msaParam) : 'midwest'

  const base    = BASE_COSTS[buildingType]
  const weights = WEIGHTS[buildingType]

  // Fetch current PPI
  const currentPPI = await fetchCurrentPPI()
  if (!currentPPI) {
    return NextResponse.json({
      error: 'Material price data unavailable',
      note: 'Requires BLS_API_KEY to be configured and harvest cron to have run.',
    }, { status: 503 })
  }
  const drivers    = computeDrivers(currentPPI)

  // Weighted inflation factor across inputs
  const materialFactor =
    weights.lumber   * drivers.lumber.ratio   +
    weights.steel    * drivers.steel.ratio    +
    weights.concrete * drivers.concrete.ratio +
    weights.copper   * drivers.copper.ratio   +
    weights.diesel   * drivers.diesel.ratio   +
    weights.labor    * drivers.labor.ratio

  // Geographic adjustment
  const geoAdj = REGION_ADJUSTMENTS[region]

  // Size adjustment
  let sizeAdj = 0
  if (sqft < 50_000)    sizeAdj =  0.05
  else if (sqft > 200_000) sizeAdj = -0.03

  const totalFactor = materialFactor * (1 + geoAdj) * (1 + sizeAdj)

  const lowPsf  = Math.round(base.low  * totalFactor)
  const midPsf  = Math.round(base.mid  * totalFactor)
  const highPsf = Math.round(base.high * totalFactor)

  // Dominant driver by weighted contribution
  const weightedPcts = Object.entries(drivers).map(([k, d]) => ({
    name: d.name,
    contribution: (weights as Record<string, number>)[k] * d.pct,
    pct: d.pct,
  })).sort((a, b) => b.contribution - a.contribution)

  const dominantDriver = weightedPcts[0]

  // Overall material inflation (non-labor)
  const materialWeightTotal = weights.lumber + weights.steel + weights.concrete + weights.copper + weights.diesel
  const materialOnlyFactor  =
    (weights.lumber   * drivers.lumber.ratio   +
     weights.steel    * drivers.steel.ratio    +
     weights.concrete * drivers.concrete.ratio +
     weights.copper   * drivers.copper.ratio   +
     weights.diesel   * drivers.diesel.ratio)  / materialWeightTotal
  const materialInflationPct = (materialOnlyFactor - 1) * 100
  const laborInflationPct    = drivers.labor.pct

  return NextResponse.json({
    building_type: buildingType,
    sqft,
    region:        REGION_LABELS[region] ?? region,
    msa:           msaParam || null,
    cost_per_sqft: { low: lowPsf, mid: midPsf, high: highPsf },
    total_cost:    { low: lowPsf * sqft, mid: midPsf * sqft, high: highPsf * sqft },
    cost_drivers: {
      material_inflation: `${materialInflationPct >= 0 ? '+' : ''}${materialInflationPct.toFixed(1)}% since Jan 2020`,
      labor_adjustment:   `${geoAdj >= 0 ? '+' : ''}${(geoAdj * 100).toFixed(0)}% (${REGION_LABELS[region]} region)`,
      dominant_driver:    `${dominantDriver.name} (${dominantDriver.pct >= 0 ? '+' : ''}${dominantDriver.pct.toFixed(1)}%)`,
      inputs: Object.values(drivers).map(d => ({
        name:    d.name,
        pct_since_2020: parseFloat(d.pct.toFixed(1)),
      })),
    },
    inflation_vs_2020: {
      materials_pct: parseFloat(materialInflationPct.toFixed(1)),
      labor_pct:     parseFloat(laborInflationPct.toFixed(1)),
      total_factor:  parseFloat(totalFactor.toFixed(4)),
    },
    methodology: 'BLS PPI indices (WPU0811/WPU101/WPU132/WPU1021/WPU0561) + OEWS wage index + regional adjustment',
    disclaimer:  'Estimates only. Verify with a licensed estimator for project budgets.',
    as_of:       new Date().toISOString().slice(0, 10),
  }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
}
