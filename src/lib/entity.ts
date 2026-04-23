import { supabaseAdmin } from '@/lib/supabase'

export interface EntityRow {
  type:        string
  external_id: string
  source:      string
  label:       string
  state_code?: string | null
  metro_code?: string | null
  attributes?: Record<string, unknown>
}

export interface EventRow {
  entity_id?:    number | null
  event_type:    string
  event_date:    string
  source:        string
  payload?:      Record<string, unknown>
  signal_value?: number | null
}

/**
 * Batch upsert entities. Returns map of external_id → db id.
 * Conflict key: (type, external_id, source)
 */
export async function upsertEntityBatch(rows: EntityRow[]): Promise<Map<string, number>> {
  const idMap = new Map<string, number>()
  if (!rows.length) return idMap

  const { data, error } = await supabaseAdmin
    .from('entities')
    .upsert(
      rows.map(r => ({
        type:         r.type,
        external_id:  r.external_id,
        source:       r.source,
        label:        r.label,
        state_code:   r.state_code ?? null,
        metro_code:   r.metro_code ?? null,
        attributes:   r.attributes ?? {},
        last_updated: new Date().toISOString(),
      })),
      { onConflict: 'type,external_id,source' },
    )
    .select('id, external_id')

  if (error) {
    console.error('[entity] upsert error:', error.message)
    return idMap
  }

  for (const row of (data ?? [])) {
    idMap.set(row.external_id as string, row.id as number)
  }
  return idMap
}

/**
 * Write event_log rows in batch.
 * Deduplicates by (entity_id, event_type, event_date) — requires the unique index
 * idx_event_log_entity_type_date to be present in the database.
 * Returns count of rows written.
 */
export async function writeEventLogBatch(events: EventRow[]): Promise<number> {
  if (!events.length) return 0

  const { data, error } = await supabaseAdmin
    .from('event_log')
    .upsert(
      events.map(e => ({
        entity_id:    e.entity_id ?? null,
        event_type:   e.event_type,
        event_date:   e.event_date,
        source:       e.source,
        payload:      e.payload ?? {},
        signal_value: e.signal_value ?? null,
      })),
      { onConflict: 'entity_id,event_type,event_date', ignoreDuplicates: true },
    )
    .select('id')

  if (error) {
    console.error('[entity] event_log write error:', error.message)
    return 0
  }
  return (data ?? []).length
}

/**
 * Batch upsert directed graph edges between entities.
 * Conflict key: (from_id, to_id, edge_type)
 */
export async function upsertEntityEdgeBatch(
  edges: Array<{ from_id: number; to_id: number; edge_type: string; confidence?: number }>,
): Promise<void> {
  if (!edges.length) return

  const { error } = await supabaseAdmin
    .from('entity_edges')
    .upsert(
      edges.map(e => ({
        from_id:    e.from_id,
        to_id:      e.to_id,
        edge_type:  e.edge_type,
        confidence: e.confidence ?? 1.0,
      })),
      { onConflict: 'from_id,to_id,edge_type', ignoreDuplicates: true },
    )

  if (error) console.error('[entity] edge batch upsert error:', error.message)
}
