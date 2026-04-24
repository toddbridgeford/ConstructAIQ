import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { batchComputeFormationScores } from '@/lib/formationScore'
import type { FormationScoreResult } from '@/lib/formationScore'

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

  const { computed, errors, durationMs, hasMore } = await batchComputeFormationScores({
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
    const rows  = chunk.map((r: FormationScoreResult) => ({
      project_id:     r.project_id,
      score:          r.score,
      classification: r.classification,
      confidence:     r.confidence,
      driver_json:    {
        drivers:     r.drivers,
        top_drivers: r.top_drivers,
      },
      computed_at:    r.computed_at,
      valid_through:  r.valid_through,
    }))

    const { error } = await supabaseAdmin
      .from('project_formation_scores')
      .upsert(rows, { onConflict: 'project_id,computed_at' })

    if (error) {
      writeErrors.push(`chunk ${i}–${i + chunk.length - 1}: ${error.message}`)
    }
  }

  const nextBatch = hasMore ? batch + 1 : null

  return NextResponse.json({
    status:    writeErrors.length === 0 ? 'ok' : 'partial',
    processed: computed.length,
    nextBatch,
    errors:    [...errors, ...writeErrors],
    durationMs,
    runAt:     new Date().toISOString(),
  })
}
