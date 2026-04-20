import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimitResult {
  allowed: boolean
  remaining?: number
  reset?: number
}

let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()

function getRedis(): Redis | null {
  if (redis !== null) return redis
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

function getLimiter(key: string, limit: number, window: Duration): Ratelimit {
  const cacheKey = `${key}:${limit}:${window}`
  const cached = limiters.get(cacheKey)
  if (cached) return cached
  const limiter = new Ratelimit({
    redis: getRedis()!,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: 'caiq:rl',
  })
  limiters.set(cacheKey, limiter)
  return limiter
}

export async function checkRateLimit(
  keyHash: string,
  rpm: number,
  rpd: number,
): Promise<RateLimitResult> {
  if (!getRedis()) return { allowed: true }

  // Check per-minute limit first (faster feedback)
  const minuteLimiter = getLimiter('rpm', rpm, '60 s' as Duration)
  const minuteResult  = await minuteLimiter.limit(`${keyHash}:rpm`)

  if (!minuteResult.success) {
    return {
      allowed:   false,
      remaining: minuteResult.remaining,
      reset:     minuteResult.reset,
    }
  }

  // Check per-day limit
  const dayLimiter = getLimiter('rpd', rpd, '86400 s' as Duration)
  const dayResult  = await dayLimiter.limit(`${keyHash}:rpd`)

  return {
    allowed:   dayResult.success,
    remaining: dayResult.remaining,
    reset:     dayResult.reset,
  }
}

export async function incrementUsage(keyHash: string): Promise<void> {
  const client = getRedis()
  if (!client) return
  // Fire-and-forget daily counter; synced to DB by cron
  await client.incr(`caiq:usage:${keyHash}:${new Date().toISOString().slice(0, 10)}`)
}
