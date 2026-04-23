import { NextResponse } from 'next/server'
import { upsertObservations, touchSeries, supabaseAdmin, type Observation } from '@/lib/supabase'

// Read per-request so env changes take effect without redeploying
function cronSecret() { return process.env.CRON_SECRET || '' }

// ── API Base URLs ──────────────────────────────────────────
const FRED_KEY   = process.env.FRED_API_KEY   || ''
const BLS_KEY    = process.env.BLS_API_KEY    || ''
const CENSUS_KEY = process.env.CENSUS_API_KEY || ''

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'
export const maxDuration = 10

export async function GET(request: Request) {
  // Verify Vercel cron secret
  const auth = request.headers.get('authorization')
  const secret = cronSecret()
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const harvested: string[] = []
  const errors:    string[] = []
  let   totalRows = 0


  // ── 1. Census TTLCONS (via FRED) ──────────────────────────
  try {
    const rows = await fetchFREDSeries('TTLCONS', 24, v => v / 1000) // millions → billions
    if (rows.length) {
      await upsertObservations(rows.map(r => ({ ...r, series_id: 'TTLCONS', source_tag: 'api' })))
      await touchSeries('TTLCONS', rows[rows.length - 1].obs_date)
      harvested.push('TTLCONS')
      totalRows += rows.length
    }
  } catch (e) { errors.push(`TTLCONS: ${e}`) }

  // ── 2. FRED HOUST ─────────────────────────────────────────
  try {
    const rows = await fetchFREDSeries('HOUST', 24)
    if (rows.length) {
      await upsertObservations(rows.map(r => ({ ...r, series_id: 'HOUST', source_tag: 'api' })))
      await touchSeries('HOUST', rows[rows.length - 1].obs_date)
      harvested.push('HOUST')
      totalRows += rows.length
    }
  } catch (e) { errors.push(`HOUST: ${e}`) }

  // ── 3. FRED PERMIT ────────────────────────────────────────
  try {
    const rows = await fetchFREDSeries('PERMIT', 24)
    if (rows.length) {
      await upsertObservations(rows.map(r => ({ ...r, series_id: 'PERMIT', source_tag: 'api' })))
      await touchSeries('PERMIT', rows[rows.length - 1].obs_date)
      harvested.push('PERMIT')
      totalRows += rows.length
    }
  } catch (e) { errors.push(`PERMIT: ${e}`) }

  // ── 4. FRED TLRESCONS ────────────────────────────────────
  try {
    const rows = await fetchFREDSeries('TLRESCONS', 24, v => v / 1000)
    if (rows.length) {
      await upsertObservations(rows.map(r => ({ ...r, series_id: 'TLRESCONS', source_tag: 'api' })))
      await touchSeries('TLRESCONS', rows[rows.length - 1].obs_date)
      harvested.push('TLRESCONS')
      totalRows += rows.length
    }
  } catch (e) { errors.push(`TLRESCONS: ${e}`) }

  // ── 5. BLS CES2000000001 (Employment) ─────────────────────
  try {
    const rows = await fetchBLSSeries('CES2000000001', 36)
    if (rows.length) {
      await upsertObservations(rows.map(r => ({ ...r, series_id: 'CES2000000001', source_tag: 'api' })))
      await touchSeries('CES2000000001', rows[rows.length - 1].obs_date)
      harvested.push('CES2000000001')
      totalRows += rows.length
    }
  } catch (e) { errors.push(`CES2000000001: ${e}`) }

  // ── 6. FRED Mortgage Rate ────────────────────────────────
  try {
    const rows = await fetchFREDSeries('MORTGAGE30US', 48)
    if (rows.length) {
      await upsertObservations(rows.map(r => ({ ...r, series_id: 'MORTGAGE30US', source_tag: 'api' })))
      await touchSeries('MORTGAGE30US', rows[rows.length - 1].obs_date)
      harvested.push('MORTGAGE30US')
      totalRows += rows.length
    }
  } catch (e) { errors.push(`MORTGAGE30US: ${e}`) }

  // ── 7. FRED 10yr Treasury ─────────────────────────────────
  try {
    const rows = await fetchFREDSeries('DGS10', 90)  // daily
    if (rows.length) {
      await upsertObservations(rows.map(r => ({ ...r, series_id: 'DGS10', source_tag: 'api' })))
      await touchSeries('DGS10', rows[rows.length - 1].obs_date)
      harvested.push('DGS10')
      totalRows += rows.length
    }
  } catch (e) { errors.push(`DGS10: ${e}`) }

  // ── 8. BLS JOLTS Job Openings (Construction) ─────────────
  try {
    const rows = await fetchBLSSeries('JTU2300000000000000JOL', 24)
    if (rows.length) {
      await upsertObservations(rows.map(r => ({ ...r, series_id: 'JOLTS_CONST_JO', source_tag: 'api' })))
      await touchSeries('JOLTS_CONST_JO', rows[rows.length - 1].obs_date)
      harvested.push('JOLTS_CONST_JO')
      totalRows += rows.length
    }
  } catch (e) { errors.push(`JOLTS: ${e}`) }

  // ── 9. BLS PPI Lumber ────────────────────────────────────
  try {
    const rows = await fetchBLSSeries('PCU321113321113', 24)
    if (rows.length) {
      await upsertObservations(rows.map(r => ({ ...r, series_id: 'PPI_LUMBER', source_tag: 'api' })))
      await touchSeries('PPI_LUMBER', rows[rows.length - 1].obs_date)
      harvested.push('PPI_LUMBER')
      totalRows += rows.length
    }
  } catch (e) { errors.push(`PPI_LUMBER: ${e}`) }

  // ── 10. BLS PPI Steel ────────────────────────────────────
  try {
    const rows = await fetchBLSSeries('PCU3312103312100', 24)
    if (rows.length) {
      await upsertObservations(rows.map(r => ({ ...r, series_id: 'PPI_STEEL', source_tag: 'api' })))
      await touchSeries('PPI_STEEL', rows[rows.length - 1].obs_date)
      harvested.push('PPI_STEEL')
      totalRows += rows.length
    }
  } catch (e) { errors.push(`PPI_STEEL: ${e}`) }

  const duration = Date.now() - startTime

  // ── Log harvest run ───────────────────────────────────────
  try {
    await supabaseAdmin.from('harvest_log').insert({
      run_at:           new Date().toISOString(),
      sources:          harvested,
      records_upserted: totalRows,
      errors:           errors,
      duration_ms:      duration,
      triggered_by:     'cron',
    })
  } catch (logErr) {
    console.warn('[DataHarvest] Log write failed:', logErr)
  }


  return NextResponse.json({
    status:           'ok',
    harvested,
    errors,
    recordsUpserted:  totalRows,
    durationMs:       duration,
    runAt:            new Date().toISOString(),
  })
}

// ── FRED Fetcher ──────────────────────────────────────────────
async function fetchFREDSeries(
  seriesId:  string,
  limit:     number  = 24,
  transform: (v: number) => number = v => v,
): Promise<Omit<Observation, 'series_id' | 'source_tag'>[]> {
  if (!FRED_KEY) return []

  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=${limit}`
  const res  = await fetch(url)
  if (!res.ok) return []

  const data = await res.json()
  type FredObs = { date: string; value: string }
  return (data.observations as FredObs[] || [])
    .filter(o => o.value !== '.')
    .map(o => ({
      obs_date:        o.date,
      value:           transform(parseFloat(o.value)),
      is_preliminary:  false,
    }))
    .reverse()
}

// ── BLS Fetcher ───────────────────────────────────────────────
async function fetchBLSSeries(
  seriesId: string,
  limit:    number = 24,
): Promise<Omit<Observation, 'series_id' | 'source_tag'>[]> {
  if (!BLS_KEY) return []

  const now      = new Date()
  const endYear  = now.getFullYear().toString()
  const startYear = (now.getFullYear() - Math.ceil(limit / 12) - 1).toString()

  const body = JSON.stringify({
    seriesid:         [seriesId],
    startyear:        startYear,
    endyear:          endYear,
    registrationkey:  BLS_KEY,
  })

  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  if (!res.ok) return []

  const data   = await res.json()
  const series = data?.Results?.series?.[0]
  if (!series) return []

  type BlsDataPoint = { year: string; period: string; value: string; footnotes?: { code: string }[] }
  return (series.data as BlsDataPoint[])
    .filter(d => d.period.startsWith('M'))
    .map(d => ({
      obs_date:        `${d.year}-${d.period.slice(1).padStart(2,'0')}-01`,
      value:           parseFloat(d.value),
      is_preliminary:  d.footnotes?.some(f => f.code === 'P') || false,
    }))
    .reverse()
    .slice(-limit)
}
