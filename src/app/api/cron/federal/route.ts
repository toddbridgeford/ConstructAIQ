import { NextResponse } from 'next/server'
import { getStateAllocations, type StateAllocation } from '@/lib/federal'
import { supabaseAdmin } from '@/lib/supabase'
import { upsertEntityBatch, writeEventLogBatch, upsertEntityEdgeBatch, type EntityRow, type EventRow } from '@/lib/entity'

function cronSecret() { return process.env.CRON_SECRET || '' }

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

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

  return NextResponse.json({
    status,
    statesRefreshed: data.length,
    fromCache,
    fetchedAt,
    durationMs: duration,
    entities:   entityStats,
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
