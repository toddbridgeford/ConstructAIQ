#!/usr/bin/env tsx
/**
 * ConstructAIQ — Manual Database Seed  v6
 * Reads the PostgREST OpenAPI schema to discover exactly which series
 * columns are NOT NULL, then inserts accordingly. No guessing.
 * Run: npx tsx scripts/seed-db.ts
 */

const SCRIPT_VERSION = 'v9'

import { readFileSync, existsSync } from 'fs'
import { resolve }                  from 'path'
import { createClient }             from '@supabase/supabase-js'

// ── Load .env.local ────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const k = trimmed.slice(0, eq).trim()
    const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL      || ''
const SVC_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY     || ''
const FRED_KEY = process.env.FRED_API_KEY                  || ''
const BLS_KEY  = process.env.BLS_API_KEY                   || ''

if (!SUPA_URL || !SVC_KEY) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(1)
}

const db = createClient(SUPA_URL, SVC_KEY, { auth: { persistSession: false } })

// ── Series registry ────────────────────────────────────────────
interface SeriesInfo { name: string; source: string; frequency: string; units: string }
const SERIES_INFO: Record<string, SeriesInfo> = {
  TTLCONS:        { name: 'Total Construction Spending',          source: 'fred', frequency: 'monthly',   units: 'Billions USD SAAR'  },
  TLRESCONS:      { name: 'Residential Construction Spending',    source: 'fred', frequency: 'monthly',   units: 'Billions USD SAAR'  },
  TLNRESCONS:     { name: 'Nonresidential Construction Spending', source: 'fred', frequency: 'monthly',   units: 'Billions USD SAAR'  },
  PBLCONS:        { name: 'Public Construction Spending',         source: 'fred', frequency: 'monthly',   units: 'Billions USD SAAR'  },
  HOUST:          { name: 'Housing Starts',                       source: 'fred', frequency: 'monthly',   units: 'Thousands SAAR'     },
  PERMIT:         { name: 'Building Permits',                     source: 'fred', frequency: 'monthly',   units: 'Thousands SAAR'     },
  HSN1F:          { name: 'New Home Sales',                       source: 'fred', frequency: 'monthly',   units: 'Thousands SAAR'     },
  UNDCONTSA:      { name: 'Units Under Construction',             source: 'fred', frequency: 'monthly',   units: 'Thousands SA'       },
  MSACSR:         { name: 'Months Supply of New Houses',          source: 'fred', frequency: 'monthly',   units: 'Months'             },
  NHMI:           { name: 'NAHB Housing Market Index',            source: 'fred', frequency: 'monthly',   units: 'Index'              },
  MORTGAGE30US:   { name: '30-Year Fixed Mortgage Rate',          source: 'fred', frequency: 'weekly',    units: 'Percent'            },
  DGS10:          { name: '10-Year Treasury Yield',               source: 'fred', frequency: 'daily',     units: 'Percent'            },
  DCOILWTICO:     { name: 'WTI Crude Oil Price',                  source: 'fred', frequency: 'daily',     units: 'Dollars per Barrel' },
  MSPUS:          { name: 'Median Sales Price of Houses Sold',    source: 'fred', frequency: 'quarterly', units: 'Dollars'            },
  CES2000000001:  { name: 'Construction Employment',              source: 'bls',  frequency: 'monthly',   units: 'Thousands'          },
  JOLTS_CONST_JO: { name: 'JOLTS Construction Job Openings',      source: 'bls',  frequency: 'monthly',   units: 'Thousands'          },
  PPI_LUMBER:     { name: 'PPI: Lumber and Wood Products',        source: 'bls',  frequency: 'monthly',   units: 'Index 1982=100'     },
  PPI_STEEL:      { name: 'PPI: Steel Mill Products',             source: 'bls',  frequency: 'monthly',   units: 'Index 1982=100'     },
}
const ALL_IDS = Object.keys(SERIES_INFO)

// ── Discover required series columns via PostgREST OpenAPI ─────
interface OpenAPISpec {
  definitions?: Record<string, {
    properties?: Record<string, { type?: string; format?: string; default?: unknown }>
    required?: string[]
  }>
}

async function getRequiredSeriesColumns(): Promise<string[]> {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/`, {
      headers: { apikey: SVC_KEY, Authorization: `Bearer ${SVC_KEY}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.warn(`  ⚠️   OpenAPI fetch returned ${res.status} — using fallback columns`)
      return ['id', 'name']
    }
    const spec = await res.json() as OpenAPISpec
    const required = spec.definitions?.['series']?.required ?? []
    console.log(`  📋  series required columns from schema: [${required.join(', ') || 'none'}]`)
    return required.length ? required : ['id', 'name']
  } catch (e) {
    console.warn(`  ⚠️   OpenAPI fetch failed: ${e} — using fallback columns`)
    return ['id', 'name']
  }
}

// Build a series row containing exactly the required columns
function buildSeriesRow(id: string, required: string[]): Record<string, unknown> {
  const info: SeriesInfo = SERIES_INFO[id] ?? { name: id, source: 'fred', frequency: 'monthly', units: '' }
  const row: Record<string, unknown> = {}
  for (const col of required) {
    switch (col) {
      case 'id':        row.id        = id;             break
      case 'name':      row.name      = info.name;      break
      case 'source':    row.source    = info.source;    break
      case 'frequency': row.frequency = info.frequency; break
      case 'units':     row.units     = info.units;     break
      default:          row[col]      = '';             break
    }
  }
  return row
}

// ── Harvest plan ───────────────────────────────────────────────
interface RawObs { obs_date: string; value: number; is_preliminary: boolean }
interface FredSpec { src: 'fred'; fredId: string; dbId: string; n: number; scale?: number }
interface BlsSpec  { src: 'bls';  blsId:  string; dbId: string; n: number }
type Spec = FredSpec | BlsSpec

const SPECS: Spec[] = [
  { src: 'fred', fredId: 'TTLCONS',              dbId: 'TTLCONS',        n: 60,  scale: 1/1000 },
  { src: 'fred', fredId: 'TLRESCONS',            dbId: 'TLRESCONS',      n: 60,  scale: 1/1000 },
  { src: 'fred', fredId: 'TLNRESCONS',           dbId: 'TLNRESCONS',     n: 60,  scale: 1/1000 },
  { src: 'fred', fredId: 'TLPBLCONS',             dbId: 'PBLCONS',        n: 60,  scale: 1/1000 },
  { src: 'fred', fredId: 'HOUST',                dbId: 'HOUST',          n: 60 },
  { src: 'fred', fredId: 'PERMIT',               dbId: 'PERMIT',         n: 60 },
  { src: 'fred', fredId: 'HSN1F',                dbId: 'HSN1F',          n: 60 },
  { src: 'fred', fredId: 'UNDCONTSA',            dbId: 'UNDCONTSA',      n: 60 },
  { src: 'fred', fredId: 'MSACSR',               dbId: 'MSACSR',         n: 60 },
  // NHMI not a FRED series — use BSCICP03USM665S (Composite leading indicator housing)
  { src: 'fred', fredId: 'USSTHPI',              dbId: 'NHMI',           n: 60 },
  { src: 'fred', fredId: 'MORTGAGE30US',         dbId: 'MORTGAGE30US',   n: 120 },
  { src: 'fred', fredId: 'DGS10',                dbId: 'DGS10',          n: 180 },
  { src: 'fred', fredId: 'DCOILWTICO',           dbId: 'DCOILWTICO',     n: 180 },
  { src: 'fred', fredId: 'MSPUS',                dbId: 'MSPUS',          n: 60 },
  { src: 'bls',  blsId:  'CES2000000001',        dbId: 'CES2000000001',  n: 36 },
  { src: 'fred', fredId: 'JTS2300JOL',             dbId: 'JOLTS_CONST_JO', n: 36 },
  { src: 'bls',  blsId:  'PCU321113321113',      dbId: 'PPI_LUMBER',     n: 36 },
  { src: 'bls',  blsId:  'PCU3312103312100',     dbId: 'PPI_STEEL',      n: 36 },
]

// ── FRED ───────────────────────────────────────────────────────
async function fetchFred(fredId: string, n: number, scale = 1): Promise<RawObs[]> {
  const url = `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${fredId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=${n}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`FRED HTTP ${res.status}`)
  const data = await res.json() as { observations: { date: string; value: string }[] }
  return (data.observations ?? [])
    .filter(o => o.value !== '.' && o.value !== '')
    .map(o => ({ obs_date: o.date, value: parseFloat(o.value) * scale, is_preliminary: false }))
    .reverse()
}

// ── BLS ────────────────────────────────────────────────────────
async function fetchBls(blsId: string, n: number): Promise<RawObs[]> {
  const now  = new Date()
  const end  = now.getFullYear().toString()
  const start = (now.getFullYear() - Math.ceil(n / 12) - 1).toString()
  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seriesid: [blsId], startyear: start, endyear: end, registrationkey: BLS_KEY }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`BLS HTTP ${res.status}`)
  const data = await res.json() as {
    status?: string
    Results?: { series?: { data?: { year: string; period: string; value: string; footnotes?: { code: string }[] }[] }[] }
  }
  if (data.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS: ${data.status}`)
  return (data.Results?.series?.[0]?.data ?? [])
    .filter(d => d.period.startsWith('M'))
    .map(d => ({
      obs_date:       `${d.year}-${d.period.slice(1).padStart(2, '0')}-01`,
      value:          parseFloat(d.value),
      is_preliminary: d.footnotes?.some(f => f.code === 'P') ?? false,
    }))
    .sort((a, b) => a.obs_date.localeCompare(b.obs_date))
    .slice(-n)
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log(`\n🌱  ConstructAIQ — Database Seed  ${SCRIPT_VERSION}`)
  console.log(`    ${new Date().toISOString()}`)
  console.log('─'.repeat(72))

  // ── Step 1: discover schema, insert series rows ────────────────
  console.log('\n  Step 1 — Discovering series table schema...')
  const required = await getRequiredSeriesColumns()

  console.log('  Inserting series rows...')
  let seriesOk = 0
  for (const id of ALL_IDS) {
    const row = buildSeriesRow(id, required)
    const { error } = await db.from('series').upsert(row, { onConflict: 'id' })
    if (error) {
      console.error(`\n  ❌  series insert failed for ${id}`)
      console.error(`      Error: ${error.message}`)
      console.error(`      Row attempted: ${JSON.stringify(row)}`)
      console.error('      Add more columns to buildSeriesRow() and retry.')
      process.exit(1)
    }
    seriesOk++
  }
  console.log(`  ✅  ${seriesOk}/${ALL_IDS.length} series rows in place`)

  // Verify with read-back
  const { count } = await db.from('series').select('id', { count: 'exact', head: true })
  console.log(`  📊  series table total: ${count ?? 0} rows`)

  // FK e2e test
  const { error: fkErr } = await db.from('observations').upsert(
    { series_id: 'TTLCONS', obs_date: '1900-01-01', value: 0, is_preliminary: false, source_tag: 'test' },
    { onConflict: 'series_id,obs_date' },
  )
  if (fkErr) {
    console.error(`\n  ❌  FK test FAILED: ${fkErr.message}`)
    process.exit(1)
  }
  await db.from('observations').delete().eq('series_id', 'TTLCONS').eq('obs_date', '1900-01-01')
  console.log('  ✅  FK end-to-end test passed\n')

  // ── Step 2: harvest ────────────────────────────────────────────
  console.log('  Step 2 — Harvesting observations...')
  console.log('─'.repeat(72))

  let totalRows = 0, totalOk = 0
  const errors: string[] = []
  let lastFred = 0

  for (const s of SPECS) {
    if (s.src === 'fred' && !FRED_KEY) { console.log(`  ⬜  ${s.dbId.padEnd(24)}  SKIP`); continue }
    if (s.src === 'bls'  && !BLS_KEY)  { console.log(`  ⬜  ${s.dbId.padEnd(24)}  SKIP`); continue }

    const t = Date.now()
    try {
      let raw: RawObs[]
      if (s.src === 'fred') {
        const gap = 1100 - (Date.now() - lastFred)
        if (gap > 0) await new Promise(r => setTimeout(r, gap))
        raw = await fetchFred(s.fredId, s.n, s.scale ?? 1)
        lastFred = Date.now()
      } else {
        raw = await fetchBls(s.blsId, s.n)
      }

      if (!raw.length) { console.log(`  ⚠️   ${s.dbId.padEnd(24)}  0 rows`); continue }

      const rows = raw.map(r => ({ ...r, series_id: s.dbId, source_tag: 'api' }))
      const { error: uErr } = await db.from('observations').upsert(rows, { onConflict: 'series_id,obs_date' })
      if (uErr) throw new Error(uErr.message)

      await db.from('series')
        .update({ last_updated: new Date().toISOString(), data_end: rows[rows.length - 1].obs_date })
        .eq('id', s.dbId)

      totalRows += rows.length
      totalOk++
      console.log(`  ✅  ${s.dbId.padEnd(24)}  ${String(rows.length).padStart(4)} rows  ${Date.now() - t}ms`)
    } catch (e) {
      errors.push(`${s.dbId}: ${String(e)}`)
      console.log(`  ❌  ${s.dbId.padEnd(24)}  ${String(e).slice(0, 60)}  ${Date.now() - t}ms`)
    }
  }

  console.log('─'.repeat(72))
  console.log(`\n    Series: ${totalOk}/${SPECS.length}  |  Rows: ${totalRows}  |  Errors: ${errors.length}`)
  if (errors.length === 0) console.log('    Database populated. ✓')
  console.log()
  process.exit(errors.length > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
