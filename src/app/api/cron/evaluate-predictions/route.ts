import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { computeOpportunityScore } from '@/lib/opportunityScore'
import { writeSourceHealth } from '@/lib/sourceHealth'

function cronSecret() { return process.env.CRON_SECRET || '' }

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

type PredictionRow = {
  id:              number
  entity_type:     string
  entity_id:       string
  score_type:      string
  predicted_class: string
  predicted_value: number
}

/**
 * Re-fetch the current score for an entity and return its classification.
 * Supports score_type: 'opportunity'.
 * Returns null when the entity cannot be resolved.
 */
async function fetchCurrentScore(
  row: PredictionRow,
  baseUrl: string,
): Promise<{ score: number; classification: string } | null> {
  if (row.score_type === 'opportunity' && row.entity_type === 'metro') {
    const result = await computeOpportunityScore(row.entity_id, { baseUrl })
    if (!result) return null
    return { score: result.score, classification: result.classification }
  }
  return null
}

export async function GET(request: Request) {
  const auth   = request.headers.get('authorization')
  const secret = cronSecret()
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  let evaluated = 0

  try {
    const { protocol, host } = new URL(request.url)
    const baseUrl = `${protocol}//${host}`
    const now     = new Date().toISOString()

    // 1. Fetch up to 50 unresolved predictions whose horizon has elapsed
    const { data: due, error: fetchErr } = await supabaseAdmin
      .from('prediction_outcomes')
      .select('id, entity_type, entity_id, score_type, predicted_class, predicted_value')
      .lte('outcome_due_at', now)
      .is('outcome_observed', null)
      .limit(50)

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    const rows = (due ?? []) as PredictionRow[]
    let correct   = 0
    const errors: string[] = []

    // 2. Resolve each row
    for (const row of rows) {
      try {
        const current = await fetchCurrentScore(row, baseUrl)
        if (!current) {
          errors.push(`${row.entity_id}: could not fetch current score`)
          continue
        }

        const isCorrect = current.classification === row.predicted_class

        const { error: updateErr } = await supabaseAdmin
          .from('prediction_outcomes')
          .update({
            outcome_observed:   current.classification,
            outcome_score:      current.score,
            outcome_correct:    isCorrect,
            outcome_checked_at: now,
          })
          .eq('id', row.id)

        if (updateErr) {
          errors.push(`${row.entity_id}: ${updateErr.message}`)
          continue
        }

        evaluated++
        if (isCorrect) correct++
      } catch (err) {
        errors.push(`${row.entity_id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    const parPct = evaluated > 0 ? Math.round((correct / evaluated) * 1000) / 10 : null

    return NextResponse.json({
      status:    'ok',
      evaluated,
      correct,
      par_pct:   parPct,
      errors,
      runAt:     now,
    })
  } finally {
    await writeSourceHealth({
      source_id:              'par_evaluation',
      source_label:           'PAR — Prediction Outcome Evaluation',
      category:               'scores',
      status:                 'ok',
      rows_written:           evaluated,
      duration_ms:            Date.now() - start,
      expected_cadence_hours: 168,
    })
  }
}
