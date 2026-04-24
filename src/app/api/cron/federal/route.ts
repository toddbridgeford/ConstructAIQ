import { NextResponse } from 'next/server'
import { getStateAllocations, type StateAllocation } from '@/lib/federal'
import { supabaseAdmin } from '@/lib/supabase'
import { upsertEntityBatch, writeEventLogBatch, upsertEntityEdgeBatch, type EntityRow, type EventRow } from '@/lib/entity'

function cronSecret() { return process.env.CRON_SECRET || '' }

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const auth   = request.headers.get('authorization')
  const secret = cronSecret()
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  const { data, fromCache, fetchedAt, error } =
    await getStateAllocations({ forceRefresh: true })

  const duration = Date.now() - start
  const status   = error ? 'error' : 'ok'

  // Entity ingestion — non-fatal; runs alongside the existing cache refresh
  let entityStats = { entities: 0, events: 0, edges: 0 }
  if (data.length) {
    try {
      entityStats = await ingestFederalEntities(data)
    } catch (err) {
      console.error('[federal] entity ingestion error:', err)
    }
  }

  // Contractor momentum ingestion — non-fatal
  let contractorStats = { upserted: 0 }
  try {
    contractorStats = await ingestContractors()
  } catch (err) {
    console.error('[federal] contractor ingestion error:', err)
  }

  return NextResponse.json({
    status,
    statesRefreshed: data.length,
    fromCache,
    fetchedAt,
    durationMs:  duration,
    entities:    entityStats,
    contractors: contractorStats,
    ...(error ? { error } : {}),
  })
}

// ---------------------------------------------------------------------------
// Entity ingestion
// ---------------------------------------------------------------------------

// FY2025 starts 1 Oct 2024 — used as the canonical award.made event date.
const FY_START = '2024-10-01'

async function ingestFederalEntities(
  allocations: StateAllocation[],
): Promise<{ entities: number; events: number; edges: number }> {

  // ── 1. Upsert one award entity per state ──────────────────────────────────
  const awardRows: EntityRow[] = allocations.map(a => ({
    type:        'award',
    external_id: `usaspending_fy2025_${a.state}`,
    source:      'usaspending',
    label:       `FY2025 Federal Construction Awards — ${a.state}`,
    state_code:  a.state,
    metro_code:  null,
    attributes: {
      obligated_m:   a.obligated,
      allocated_m:   a.allocated,
      spent_m:       a.spent,
      execution_pct: a.executionPct,
      rank:          a.rank,
      fiscal_year:   2025,
    },
  }))

  const awardIdMap = await upsertEntityBatch(awardRows)

  // ── 2. Write award.made events (one per state, idempotent) ────────────────
  const eventRows: EventRow[] = allocations.flatMap(a => {
    const entityId = awardIdMap.get(`usaspending_fy2025_${a.state}`)
    if (!entityId) return []
    return [{
      entity_id:   entityId,
      event_type:  'award.made',
      event_date:  FY_START,
      source:      'usaspending',
      payload: {
        state:         a.state,
        obligated_m:   a.obligated,
        allocated_m:   a.allocated,
        execution_pct: a.executionPct,
        rank:          a.rank,
      },
      signal_value: a.executionPct,
    }]
  })

  const eventsWritten = await writeEventLogBatch(eventRows)

  // ── 3. Attempt award → metro edges via state_code ─────────────────────────
  const awardedStates = new Set(allocations.map(a => a.state))

  const { data: msas } = await supabaseAdmin
    .from('msa_boundaries')
    .select('msa_code, msa_name, state_codes')

  if (!msas?.length) {
    return { entities: awardIdMap.size, events: eventsWritten, edges: 0 }
  }

  // Only process MSAs that overlap at least one awarded state
  const relevantMsas = msas.filter(m =>
    (m.state_codes as string[]).some(sc => awardedStates.has(sc))
  )

  // Upsert metro entities (type='metro') for every relevant MSA
  const metroRows: EntityRow[] = relevantMsas.map(m => ({
    type:        'metro',
    external_id: m.msa_code as string,
    source:      'msa_boundaries',
    label:       m.msa_name as string,
    state_code:  (m.state_codes as string[])[0] ?? null,
    metro_code:  m.msa_code as string,
  }))

  const metroIdMap = await upsertEntityBatch(metroRows)

  // Build edges: award entity → metro entity, confidence 0.5 (state-level match)
  const edgeRows: Array<{ from_id: number; to_id: number; edge_type: string; confidence: number }> = []
  for (const msa of relevantMsas) {
    const metroId = metroIdMap.get(msa.msa_code as string)
    if (!metroId) continue

    for (const stateCode of (msa.state_codes as string[])) {
      const awardId = awardIdMap.get(`usaspending_fy2025_${stateCode}`)
      if (!awardId) continue
      edgeRows.push({ from_id: awardId, to_id: metroId, edge_type: 'award_to_metro', confidence: 0.5 })
    }
  }

  await upsertEntityEdgeBatch(edgeRows)

  return {
    entities: awardIdMap.size + metroIdMap.size,
    events:   eventsWritten,
    edges:    edgeRows.length,
  }
}

// ---------------------------------------------------------------------------
// Contractor momentum ingestion
// ---------------------------------------------------------------------------

const CONSTRUCTION_NAICS = ['2361','2362','2371','2372','2379','2381','2382','2383','2389']

interface AwardBucket {
  name:     string
  state:    string
  count:    number
  value:    number
  lastDate: string
}

// Fetch top 100 construction awards from USASpending for a date range,
// aggregated by recipient_id (USASpending internal stable entity key).
async function fetchTopAwards(
  startDate: string,
  endDate:   string,
): Promise<Map<string, AwardBucket>> {
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
          award_type_codes: ['A', 'B', 'C', 'D'],
          naics_codes:      CONSTRUCTION_NAICS,
        },
        fields: [
          'Award ID',
          'Recipient Name',
          'recipient_id',
          'Place of Performance State Code',
          'Award Amount',
          'Last Modified Date',
        ],
        page:  1,
        limit: 100,
        sort:  'Award Amount',
        order: 'desc',
      }),
      signal: AbortSignal.timeout(12_000),
    },
  )

  if (!res.ok) throw new Error(`USASpending awards HTTP ${res.status}`)

  const json = (await res.json()) as {
    results: Array<{
      'Recipient Name':                    string
      'recipient_id':                      string | null
      'Place of Performance State Code':   string | null
      'Award Amount':                      number | null
      'Last Modified Date':                string | null
    }>
  }

  const map = new Map<string, AwardBucket>()

  for (const r of json.results ?? []) {
    const name  = (r['Recipient Name'] ?? '').trim()
    const state = (r['Place of Performance State Code'] ?? '').trim()
    const value = Math.max(0, r['Award Amount'] ?? 0)
    const date  = r['Last Modified Date'] ?? startDate

    // Use recipient_id as stable key; fall back to normalized name
    const key = r['recipient_id']
      || name.toLowerCase().replace(/[^a-z0-9]+/g, '_')

    const existing = map.get(key)
    if (existing) {
      existing.count++
      existing.value += value
      if (date > existing.lastDate) existing.lastDate = date
    } else {
      map.set(key, { name, state, count: 1, value, lastDate: date })
    }
  }

  return map
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 200)
}

async function ingestContractors(): Promise<{ upserted: number }> {
  // Compute fiscal year date ranges — same calendar period, 1 FY apart
  const now = new Date()
  const fy  = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()

  const ytdStart   = `${fy - 1}-10-01`
  const ytdEnd     = now.toISOString().split('T')[0]
  const priorStart = `${fy - 2}-10-01`
  const priorEnd   = [
    fy - 1,
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  // Fetch both periods in parallel
  const [ytd, prior] = await Promise.all([
    fetchTopAwards(ytdStart, ytdEnd),
    fetchTopAwards(priorStart, priorEnd),
  ])

  const rows: Array<{
    name:              string
    name_normalized:   string
    uei:               string
    primary_state:     string | null
    award_count_ytd:   number
    award_value_ytd:   number
    award_count_prior: number
    award_value_prior: number
    momentum_score:    number | null
    momentum_class:    string
    last_award_date:   string | null
    updated_at:        string
  }> = []

  for (const [uei, d] of ytd) {
    if (!d.name) continue

    const p        = prior.get(uei)
    const ytdVal   = d.value
    const priorVal = p?.value ?? 0

    let momentumScore: number | null = null
    let momentumClass = 'STABLE'

    if (priorVal > 0) {
      momentumScore = parseFloat(((ytdVal / priorVal - 1) * 100).toFixed(1))
      if      (momentumScore > 20)  momentumClass = 'ACCELERATING'
      else if (momentumScore < -10) momentumClass = 'DECELERATING'
    } else if (ytdVal > 0) {
      momentumScore = 100
      momentumClass = 'ACCELERATING'
    }

    rows.push({
      name:              d.name,
      name_normalized:   normalizeName(d.name),
      uei,
      primary_state:     d.state || null,
      award_count_ytd:   d.count,
      award_value_ytd:   Math.round(ytdVal),
      award_count_prior: p?.count ?? 0,
      award_value_prior: Math.round(priorVal),
      momentum_score:    momentumScore,
      momentum_class:    momentumClass,
      last_award_date:   d.lastDate || null,
      updated_at:        now.toISOString(),
    })
  }

  if (!rows.length) return { upserted: 0 }

  const { error } = await supabaseAdmin
    .from('contractor_profiles')
    .upsert(rows, { onConflict: 'uei', ignoreDuplicates: false })

  if (error) throw new Error(`contractor_profiles upsert: ${error.message}`)

  return { upserted: rows.length }
}
