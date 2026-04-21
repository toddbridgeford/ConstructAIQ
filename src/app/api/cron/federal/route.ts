import { NextResponse } from 'next/server'
import { getStateAllocations } from '@/lib/federal'

function cronSecret() { return process.env.CRON_SECRET || '' }

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const auth   = request.headers.get('authorization')
  const secret = cronSecret()
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  console.log('[FederalCron] Starting federal data refresh at', new Date().toISOString())

  const { data, fromCache, fetchedAt, error } =
    await getStateAllocations({ forceRefresh: true })

  const duration = Date.now() - start
  const status   = error ? 'error' : 'ok'

  console.log(`[FederalCron] ${status} — ${data.length} states, ${duration}ms`)

  return NextResponse.json({
    status,
    statesRefreshed: data.length,
    fromCache,
    fetchedAt,
    durationMs: duration,
    ...(error ? { error } : {}),
  })
}
