import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { batchComputeRealityGaps } from '@/lib/realityGap'
import type { RealityGapResult } from '@/lib/realityGap'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
// This route processes one batch of 20 projects per call to stay within
// the 10s Hobby limit. Called by GitHub Actions with CRON_SECRET.
export const maxDuration = 10

function cronSecret() { return process.env.CRON_SECRET || '' }

const BATCH_SIZE = 20

export async function GET(request: Request) {
  const auth   = request.headers.get('authorization')
  const secret = cronSecret()
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url   = new URL(request.url)
  const batch = Math.max(0, parseInt(url.searchParams.get('batch') ?? '0', 10))

  const { computed, errors, durationMs, hasMore } = await batchComputeRealityGaps({
    offset: batch * BATCH_SIZE,
    limit:  BATCH_SIZE,
  })

  if (computed.length === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: 'Batch computation failed', details: errors },
      { status: 500 },
    )
  }

  const writeErrors: string[] = []

  const CHUNK = 200
  for (let i = 0; i < computed.length; i += CHUNK) {
    const chunk = computed.slice(i, i + CHUNK)
    const rows  = chunk.map((r: RealityGapResult) => ({
      project_id:     r.project_id,
      gap:            r.gap,
      official_score: r.official_score,
      observed_score: r.observed_score,
      classification: r.classification,
      driver_json:    {
        official_drivers: r.official_drivers,
        observed_drivers: r.observed_drivers,
        top_gap_drivers:  r.top_gap_drivers,
      },
      computed_at:   r.computed_at,
      valid_through: r.valid_through,
    }))

    const { error } = await supabaseAdmin
      .from('project_reality_gaps')
      .upsert(rows, { onConflict: 'project_id,computed_at' })

    if (error) {
      writeErrors.push(`chunk ${i}–${i + chunk.length - 1}: ${error.message}`)
    }
  }

  const byClassification = computed.reduce<Record<string, number>>((acc, r) => {
    acc[r.classification] = (acc[r.classification] ?? 0) + 1
    return acc
  }, {})

  const nextBatch = hasMore ? batch + 1 : null

  return NextResponse.json({
    status:            writeErrors.length === 0 ? 'ok' : 'partial',
    processed:         computed.length,
    by_classification: byClassification,
    nextBatch,
    errors:            [...errors, ...writeErrors],
    durationMs,
    runAt:             new Date().toISOString(),
  })
}
