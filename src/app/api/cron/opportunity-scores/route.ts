import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { computeOpportunityScore } from '@/lib/opportunityScore'

function cronSecret() { return process.env.CRON_SECRET || '' }

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
// This route processes one batch of 20 metros per call to stay within
// the 10s Hobby limit. Called by GitHub Actions with CRON_SECRET.
export const maxDuration = 10

const BATCH_SIZE = 20

export async function GET(request: Request) {
  const auth   = request.headers.get('authorization')
  const secret = cronSecret()
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url   = new URL(request.url)
  const batch = Math.max(0, parseInt(url.searchParams.get('batch') ?? '0', 10))

  const start = Date.now()
  const { protocol, host } = new URL(request.url)
  const baseUrl = `${protocol}//${host}`

  const { data: sources, error: sourcesErr } = await supabaseAdmin
    .from('permit_sources')
    .select('city_code')
    .eq('status', 'active')
    .range(batch * BATCH_SIZE, batch * BATCH_SIZE + BATCH_SIZE - 1)

  if (sourcesErr) {
    return NextResponse.json(
      { error: 'Failed to load permit_sources', detail: sourcesErr.message },
      { status: 500 },
    )
  }

  const computed: string[] = []
  const errors:   string[] = []

  for (const row of sources ?? []) {
    const metroCode = (row as { city_code: string }).city_code
    try {
      const result = await computeOpportunityScore(metroCode, { baseUrl })
      if (!result) {
        errors.push(`${metroCode}: metro not resolvable`)
        continue
      }

      const { error: writeErr } = await supabaseAdmin
        .from('opportunity_scores')
        .upsert(
          {
            metro_code:     result.metro_code,
            score:          result.score,
            classification: result.classification,
            confidence:     result.confidence,
            driver_json:    {
              drivers:     result.drivers,
              top_drivers: result.top_drivers,
              metro_name:  result.metro_name,
              state_code:  result.state_code,
              msa_code:    result.msa_code,
            },
            computed_at:   result.computed_at,
            valid_through: result.valid_through,
          },
          { onConflict: 'metro_code,computed_at' },
        )

      if (writeErr) {
        errors.push(`${metroCode}: ${writeErr.message}`)
        continue
      }

      if (result.score >= 70) {
        const predictedAt   = new Date(result.computed_at)
        const outcomeDueAt  = new Date(predictedAt.getTime() + 90 * 24 * 60 * 60 * 1000)
        await supabaseAdmin.from('prediction_outcomes').insert({
          entity_type:     'metro',
          entity_id:       result.metro_code,
          score_type:      'opportunity',
          predicted_value: result.score,
          predicted_class: 'HIGH',
          predicted_at:    predictedAt.toISOString(),
          horizon_days:    90,
          outcome_due_at:  outcomeDueAt.toISOString(),
        })
      }

      computed.push(result.metro_code)
    } catch (err) {
      errors.push(`${metroCode}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const nextBatch = (sources ?? []).length === BATCH_SIZE ? batch + 1 : null

  return NextResponse.json({
    status:     'ok',
    processed:  computed.length,
    nextBatch,
    computed,
    errors,
    durationMs: Date.now() - start,
    runAt:      new Date().toISOString(),
  })
}
