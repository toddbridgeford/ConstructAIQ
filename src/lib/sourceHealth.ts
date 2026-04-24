import { supabaseAdmin } from './supabase'

export interface SourceHealthWrite {
  source_id:               string
  source_label:            string
  category:                'government_data' | 'permits' | 'federal' | 'satellite' | 'scores' | 'ai'
  status:                  'ok' | 'warn' | 'failed' | 'skipped' | 'not_configured'
  rows_written?:           number
  error_message?:          string
  duration_ms?:            number
  expected_cadence_hours?: number
}

export interface SourceHealthRow {
  source_id:               string
  source_label:            string
  category:                string
  status:                  string
  rows_written:            number | null
  run_at:                  string
  expected_cadence_hours:  number
}

/**
 * Write a health record after each cron run.
 * Fire-and-forget — never throws.
 */
export async function writeSourceHealth(h: SourceHealthWrite): Promise<void> {
  try {
    await supabaseAdmin
      .from('data_source_health')
      .insert({
        source_id:              h.source_id,
        source_label:           h.source_label,
        category:               h.category,
        status:                 h.status,
        rows_written:           h.rows_written ?? null,
        error_message:          h.error_message ?? null,
        duration_ms:            h.duration_ms ?? null,
        expected_cadence_hours: h.expected_cadence_hours ?? 24,
        run_at:                 new Date().toISOString(),
      })
  } catch {
    // Never block the cron on a health write failure
  }
}

/**
 * Get the latest health record for each source_id.
 * Used by /api/status.
 */
export async function getSourceHealthSummary(): Promise<SourceHealthRow[]> {
  let data: SourceHealthRow[] | null = null
  try {
    const result = await supabaseAdmin
      .from('data_source_health')
      .select('source_id, source_label, category, status, rows_written, run_at, expected_cadence_hours')
      .order('run_at', { ascending: false })
      .limit(500)
    data = result.data as SourceHealthRow[] | null
  } catch {
    // Returns [] on failure — never throws
  }

  if (!data) return []

  const latestBySource = new Map<string, SourceHealthRow>()
  for (const row of data as SourceHealthRow[]) {
    if (!latestBySource.has(row.source_id)) {
      latestBySource.set(row.source_id, row)
    }
  }
  return [...latestBySource.values()]
}
