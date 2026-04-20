import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimitResult {
  allowed: boolean
  remaining?: number
  reset?: number
}

let redis: Redis | null = null
const limiters = new Map<number, Ratelimit>()

function getRedis(): Redis | null {
  if (redis !== null) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

function getLimiter(rpm: number): Ratelimit {
  const cached = limiters.get(rpm)
  if (cached) return cached
  const client = getRedis()!
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(rpm, '60 s'),
    prefix: 'caiq:rl',
  })
  limiters.set(rpm, limiter)
  return limiter
}

export async function checkRateLimit(keyHash: string, rpm: number): Promise<RateLimitResult> {
  if (!getRedis()) {
    return { allowed: true }
  }

  const limiter = getLimiter(rpm)
  const result = await limiter.limit(keyHash)

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}
