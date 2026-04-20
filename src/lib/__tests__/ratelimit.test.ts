import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Shared mock function for Ratelimit.limit — controlled per test
const mockRatelimitLimit = vi.fn()

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn()
    constructor() {}
    limit = mockRatelimitLimit
  },
}))

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor() {}
    incr = vi.fn().mockResolvedValue(1)
  },
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('checkRateLimit — no Redis env vars', () => {
  it('returns allowed: true when Redis env vars are not set', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const { checkRateLimit } = await import('../ratelimit')

    const result = await checkRateLimit('somehash', 60, 1000)

    expect(result).toEqual({ allowed: true })
  })
})

describe('incrementUsage — no Redis env vars', () => {
  it('resolves without error when Redis env vars are not set', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const { incrementUsage } = await import('../ratelimit')

    await expect(incrementUsage('somehash')).resolves.toBeUndefined()
  })
})

describe('checkRateLimit — with mocked Redis', () => {
  it('returns allowed with remaining and reset when RPM is under limit', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')

    // Both RPM and RPD succeed
    mockRatelimitLimit.mockResolvedValue({
      success: true,
      remaining: 55,
      reset: 1700000060000,
    })

    const { checkRateLimit } = await import('../ratelimit')
    const result = await checkRateLimit('somehash', 60, 1000)

    expect(result.allowed).toBe(true)
    expect(typeof result.remaining).toBe('number')
    expect(typeof result.reset).toBe('number')
  })

  it('returns allowed: false with remaining 0 when RPM is over limit', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')

    mockRatelimitLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: 1700000060000,
    })

    const { checkRateLimit } = await import('../ratelimit')
    const result = await checkRateLimit('somehash', 60, 1000)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(typeof result.reset).toBe('number')
  })

  it('returns allowed: false with remaining 0 when RPM ok but RPD is over limit', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')

    // First call (RPM) succeeds, second call (RPD) fails
    mockRatelimitLimit
      .mockResolvedValueOnce({ success: true, remaining: 55, reset: 1700000060000 })
      .mockResolvedValueOnce({ success: false, remaining: 0, reset: 1700086400000 })

    const { checkRateLimit } = await import('../ratelimit')
    const result = await checkRateLimit('somehash', 60, 1000)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(typeof result.reset).toBe('number')
  })
})
