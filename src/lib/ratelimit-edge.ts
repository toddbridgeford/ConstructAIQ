// Edge Runtime rate limiting — uses Upstash REST API via fetch only.
// Do NOT import @upstash/redis or @upstash/ratelimit here; both pull in
// Node.js APIs that are unavailable in the Edge Runtime.

export interface RateLimitResult {
  allowed: boolean
  remaining?: number
  reset?: number
}

type RedisCommand = (string | number)[]

function getConfig(): { url: string; token: string } | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url, token }
}

async function pipeline(commands: RedisCommand[]): Promise<unknown[]> {
  const cfg = getConfig()
  if (!cfg) return commands.map(() => null)

  const resp = await fetch(`${cfg.url}/pipeline`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })

  if (!resp.ok) return commands.map(() => null)

  const data = await resp.json() as { result: unknown }[]
  return data.map(d => d.result)
}

// Fixed-window rate limiting using time-bucketed Redis keys.
// Keys auto-rotate as time passes; slightly over-sized TTLs ensure cleanup.
export async function checkRateLimitEdge(
  keyHash: string,
  rpm: number,
  rpd: number,
): Promise<RateLimitResult> {
  if (!getConfig()) return { allowed: true }

  const now          = Date.now()
  const minuteBucket = Math.floor(now / 60_000)
  const dayBucket    = new Date(now).toISOString().slice(0, 10)

  const minuteKey  = `caiq:rl:${keyHash}:rpm:${minuteBucket}`
  const dayKey     = `caiq:rl:${keyHash}:rpd:${dayBucket}`
  const minuteReset = (minuteBucket + 1) * 60_000
  const dayReset    = (Math.floor(now / 86_400_000) + 1) * 86_400_000

  try {
    // Pipeline: init key if absent (NX), then INCR — avoids sliding EXPIRE.
    const results = await pipeline([
      ['SET', minuteKey, '0', 'EX', '120',    'NX'],
      ['INCR', minuteKey],
      ['SET', dayKey,    '0', 'EX', '172800', 'NX'],
      ['INCR', dayKey],
    ])

    const minuteCount = (results[1] as number) ?? 0
    const dayCount    = (results[3] as number) ?? 0

    if (minuteCount > rpm) {
      return { allowed: false, remaining: 0, reset: minuteReset }
    }
    if (dayCount > rpd) {
      return { allowed: false, remaining: 0, reset: dayReset }
    }

    return {
      allowed:   true,
      remaining: Math.min(rpm - minuteCount, rpd - dayCount),
      reset:     minuteReset,
    }
  } catch {
    // Redis unreachable — fail open so a Redis outage doesn't block all API traffic.
    return { allowed: true }
  }
}

// Fire-and-forget daily usage counter; synced to DB by cron.
export async function incrementUsageEdge(keyHash: string): Promise<void> {
  if (!getConfig()) return
  const date = new Date().toISOString().slice(0, 10)
  try {
    await pipeline([['INCR', `caiq:usage:${keyHash}:${date}`]])
  } catch {
    // Intentionally swallowed — this is best-effort telemetry.
  }
}
