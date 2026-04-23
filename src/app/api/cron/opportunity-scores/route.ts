import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { computeOpportunityScore } from '@/lib/opportunityScore'

function cronSecret() { return process.env.CRON_SECRET || '' }

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const auth   = request.headers.get('authorization')
  const secret = cronSecret()
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  const { protocol, host } = new URL(request.url)
  const baseUrl = `${protocol}//${host}`

  const { data: sources, error: sourcesErr } = await supabaseAdmin
    .from('permit_sources')
    .select('city_code')
    .eq('status', 'active')

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

      computed.push(result.metro_code)
    } catch (err) {
      errors.push(`${metroCode}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({
    status:     'ok',
    computed,
    errors,
    durationMs: Date.now() - start,
    runAt:      new Date().toISOString(),
  })
}
