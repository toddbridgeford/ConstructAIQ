import { NextResponse }   from 'next/server'
import { generateBrief } from '@/lib/weeklyBrief'

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

  const start    = Date.now()
  const result   = await generateBrief()
  const duration = Date.now() - start

  return NextResponse.json({
    status:     result.source === 'ai' ? 'ok' : 'fallback',
    source:     result.source,
    generatedAt: result.generatedAt,
    durationMs: duration,
    ...(result.error ? { error: result.error } : {}),
  })
}
