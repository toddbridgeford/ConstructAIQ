import { NextResponse }   from 'next/server'
import { generateBrief } from '@/lib/weeklyBrief'
import { writeSourceHealth } from '@/lib/sourceHealth'

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
  let briefError: unknown = null
  let briefWritten = false

  try {
    const result = await generateBrief()
    briefError  = result.error ?? null
    briefWritten = result.source === 'ai'

    return NextResponse.json({
      status:      result.source === 'ai' ? 'ok' : 'fallback',
      source:      result.source,
      generatedAt: result.generatedAt,
      durationMs:  Date.now() - start,
      ...(result.error ? { error: result.error } : {}),
    })
  } finally {
    await writeSourceHealth({
      source_id:              'ai_weekly_brief',
      source_label:           'AI Weekly Brief (Claude)',
      category:               'ai',
      status:                 briefError ? 'failed' : 'ok',
      rows_written:           briefWritten ? 1 : 0,
      duration_ms:            Date.now() - start,
      expected_cadence_hours: 168,
    })
  }
}
