import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

// ── helpers ───────────────────────────────────────────────────────────────────

function makePipelineResponse(results: unknown[]) {
  return new Response(
    JSON.stringify(results.map(r => ({ result: r }))),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

// ── checkRateLimitEdge — no env vars ─────────────────────────────────────────

describe('checkRateLimitEdge — no env vars', () => {
  it('returns allowed: true when env vars are absent', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL',   '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const { checkRateLimitEdge } = await import('../ratelimit-edge')

    const result = await checkRateLimitEdge('hash', 60, 1000)
    expect(result).toEqual({ allowed: true })
  })
})

// ── incrementUsageEdge — no env vars ─────────────────────────────────────────

describe('incrementUsageEdge — no env vars', () => {
  it('resolves without error when env vars are absent', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL',   '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const { incrementUsageEdge } = await import('../ratelimit-edge')

    await expect(incrementUsageEdge('hash')).resolves.toBeUndefined()
  })
})

// ── checkRateLimitEdge — with fetch mock ──────────────────────────────────────

describe('checkRateLimitEdge — with mocked fetch', () => {
  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL',   'https://redis.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')
  })

  it('returns allowed: true with remaining when both windows are under limit', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      // SET NX → "OK", INCR → 1 (minute), SET NX → "OK", INCR → 1 (day)
      makePipelineResponse(['OK', 1, 'OK', 1]),
    )
    const { checkRateLimitEdge } = await import('../ratelimit-edge')

    const result = await checkRateLimitEdge('hash', 60, 1000)
    expect(result.allowed).toBe(true)
    expect(typeof result.remaining).toBe('number')
    expect(typeof result.reset).toBe('number')
  })

  it('returns allowed: false when minute count exceeds rpm', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makePipelineResponse([null, 61, 'OK', 1]),
    )
    const { checkRateLimitEdge } = await import('../ratelimit-edge')

    const result = await checkRateLimitEdge('hash', 60, 1000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(typeof result.reset).toBe('number')
  })

  it('returns allowed: false when day count exceeds rpd (minute ok)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makePipelineResponse([null, 1, null, 1001]),
    )
    const { checkRateLimitEdge } = await import('../ratelimit-edge')

    const result = await checkRateLimitEdge('hash', 60, 1000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(typeof result.reset).toBe('number')
  })

  it('fails open when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'))
    const { checkRateLimitEdge } = await import('../ratelimit-edge')

    const result = await checkRateLimitEdge('hash', 60, 1000)
    expect(result).toEqual({ allowed: true })
  })

  it('fails open when fetch returns a non-ok status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('error', { status: 500 }),
    )
    const { checkRateLimitEdge } = await import('../ratelimit-edge')

    const result = await checkRateLimitEdge('hash', 60, 1000)
    // null results → counts default to 0 → under any limit → allowed
    expect(result.allowed).toBe(true)
  })
})

// ── incrementUsageEdge — with fetch mock ──────────────────────────────────────

describe('incrementUsageEdge — with mocked fetch', () => {
  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL',   'https://redis.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')
  })

  it('calls fetch with the correct pipeline payload', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makePipelineResponse([1]),
    )
    const { incrementUsageEdge } = await import('../ratelimit-edge')

    await incrementUsageEdge('testhash')

    expect(spy).toHaveBeenCalledOnce()
    const [url, init] = spy.mock.calls[0]
    expect(String(url)).toContain('/pipeline')
    const body = JSON.parse(init?.body as string) as unknown[][]
    expect(body[0][0]).toBe('INCR')
    expect(String(body[0][1])).toContain('testhash')
  })

  it('resolves without error when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))
    const { incrementUsageEdge } = await import('../ratelimit-edge')

    await expect(incrementUsageEdge('testhash')).resolves.toBeUndefined()
  })
})
