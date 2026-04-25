import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const {
  federalCacheSingleMock,
  sourceHealthMock,
  weeklyBriefConfiguredMock,
  obsEqMock,
  fromMock,
} = vi.hoisted(() => {
  const federalCacheSingleMock    = vi.fn()
  const sourceHealthMock          = vi.fn()
  const weeklyBriefConfiguredMock = vi.fn()
  const obsEqMock                 = vi.fn()

  // Build a thenable chain that resolves to `result`.
  // Every method returns the same chain so arbitrary `.select().eq().gte()...`
  // chains work regardless of order.
  function makeChain(result: unknown) {
    const chain: Record<string, unknown> = {
      select:      () => chain,
      order:       () => chain,
      gte:         () => chain,
      lte:         () => chain,
      is:          () => chain,
      not:         () => chain,
      maybeSingle: federalCacheSingleMock,
      // `eq` on observations dispatches to obsEqMock so tests can return
      // per-series counts; on all other tables it just returns the chain.
      eq: (...args: unknown[]) => {
        if (args[0] === 'series_id') {
          return obsEqMock(...args)
        }
        // federal_cache key lookup: after eq('key', ...) we call .maybeSingle()
        chain.maybeSingle = federalCacheSingleMock
        return chain
      },
      then:    (res?: unknown, rej?: unknown) =>
        Promise.resolve(result).then(res as never, rej as never),
      catch:   (fn?: unknown) =>
        Promise.resolve(result).catch(fn as never),
      finally: (fn?: unknown) =>
        Promise.resolve(result).finally(fn as never),
    }
    return chain
  }

  const fromMock = vi.fn((table: string) => {
    if (table === 'series') return makeChain({ data: [], error: null })
    return makeChain({ count: 0, error: null })
  })

  return { federalCacheSingleMock, sourceHealthMock, weeklyBriefConfiguredMock, obsEqMock, fromMock }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: fromMock },
}))

vi.mock('@/lib/sourceHealth', () => ({
  getSourceHealthSummary: sourceHealthMock,
}))

vi.mock('@/lib/weeklyBrief', () => ({
  isWeeklyBriefConfigured: weeklyBriefConfiguredMock,
}))

vi.mock('@/lib/federal', () => ({
  LEADERBOARD_CACHE_KEY: 'federal_leaderboard_v1',
}))

import { GET } from '../route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/status')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new Request(url.toString())
}

const FRESH_CACHE_AT = new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min ago
const STALE_CACHE_AT = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 h ago

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()

  // Safe defaults: no env vars set, no cache, source health empty
  sourceHealthMock.mockResolvedValue([])
  weeklyBriefConfiguredMock.mockReturnValue(false)
  federalCacheSingleMock.mockResolvedValue({ data: null, error: null })
  obsEqMock.mockResolvedValue({ count: 0, error: null })
  fromMock.mockImplementation((table: string) => {
    if (table === 'series') return buildSeriesChain([])
    return buildCountChain(0)
  })
})

function buildCountChain(count: number) {
  const result = { count, error: null }
  const chain: Record<string, unknown> = {
    select:      () => chain,
    order:       () => chain,
    gte:         () => chain,
    lte:         () => chain,
    is:          () => chain,
    not:         () => chain,
    maybeSingle: federalCacheSingleMock,
    eq: (...args: unknown[]) => {
      if (args[0] === 'series_id') return obsEqMock(...args)
      chain.maybeSingle = federalCacheSingleMock
      return chain
    },
    then:    (res?: unknown, rej?: unknown) =>
      Promise.resolve(result).then(res as never, rej as never),
    catch:   (fn?: unknown) =>
      Promise.resolve(result).catch(fn as never),
    finally: (fn?: unknown) =>
      Promise.resolve(result).finally(fn as never),
  }
  return chain
}

function buildSeriesChain(data: unknown[]) {
  const result = { data, error: null }
  const chain: Record<string, unknown> = {
    select: () => chain,
    order:  () => chain,
    eq:     () => chain,
    then:   (res?: unknown, rej?: unknown) =>
      Promise.resolve(result).then(res as never, rej as never),
    catch:  (fn?: unknown) =>
      Promise.resolve(result).catch(fn as never),
    finally:(fn?: unknown) =>
      Promise.resolve(result).finally(fn as never),
  }
  return chain
}

// ── env section ───────────────────────────────────────────────────────────────

describe('env section', () => {
  it('returns all five booleans', async () => {
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    const env  = body.env as Record<string, unknown>
    expect(Object.keys(env).sort()).toEqual([
      'anthropicConfigured',
      'cronSecretConfigured',
      'sentryConfigured',
      'supabaseConfigured',
      'upstashConfigured',
    ])
    for (const v of Object.values(env)) {
      expect(typeof v).toBe('boolean')
    }
  })

  it('all booleans are false when env vars are absent', async () => {
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    const env  = body.env as Record<string, boolean>
    expect(env.supabaseConfigured).toBe(false)
    expect(env.anthropicConfigured).toBe(false)
    expect(env.upstashConfigured).toBe(false)
    expect(env.sentryConfigured).toBe(false)
    expect(env.cronSecretConfigured).toBe(false)
  })

  it('anthropicConfigured is true when ANTHROPIC_API_KEY is set', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key')
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect((body.env as Record<string, boolean>).anthropicConfigured).toBe(true)
  })

  it('supabaseConfigured requires both URL and service key', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://proj.supabase.co')
    let res  = await GET(makeReq())
    let body = await res.json() as Record<string, unknown>
    // Only URL set — service key missing → false
    expect((body.env as Record<string, boolean>).supabaseConfigured).toBe(false)

    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-xyz')
    res  = await GET(makeReq())
    body = await res.json() as Record<string, unknown>
    expect((body.env as Record<string, boolean>).supabaseConfigured).toBe(true)
  })

  it('upstashConfigured requires both URL and token', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.upstash.io')
    let res  = await GET(makeReq())
    let body = await res.json() as Record<string, unknown>
    expect((body.env as Record<string, boolean>).upstashConfigured).toBe(false)

    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token-abc')
    res  = await GET(makeReq())
    body = await res.json() as Record<string, unknown>
    expect((body.env as Record<string, boolean>).upstashConfigured).toBe(true)
  })

  it('never exposes secret values — all env fields are booleans, not strings', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-THIS-MUST-NOT-APPEAR')
    vi.stubEnv('CRON_SECRET', 'super-secret-cron-value')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-secret')
    const res  = await GET(makeReq())
    const raw  = await res.text()
    expect(raw).not.toContain('sk-ant-THIS-MUST-NOT-APPEAR')
    expect(raw).not.toContain('super-secret-cron-value')
    expect(raw).not.toContain('service-role-secret')
  })
})

// ── runtime section ───────────────────────────────────────────────────────────

describe('runtime section', () => {
  it('includes nodeEnv, appUrl, and siteLocked', async () => {
    const res     = await GET(makeReq())
    const body    = await res.json() as Record<string, unknown>
    const runtime = body.runtime as Record<string, unknown>
    expect(runtime).toHaveProperty('nodeEnv')
    expect(runtime).toHaveProperty('appUrl')
    expect(runtime).toHaveProperty('siteLocked')
    expect(typeof runtime.siteLocked).toBe('boolean')
  })

  it('siteLocked is false by default', async () => {
    const res     = await GET(makeReq())
    const body    = await res.json() as Record<string, unknown>
    expect((body.runtime as Record<string, boolean>).siteLocked).toBe(false)
  })

  it('siteLocked is true when SITE_LOCKED=true', async () => {
    vi.stubEnv('SITE_LOCKED', 'true')
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect((body.runtime as Record<string, boolean>).siteLocked).toBe(true)
  })

  it('appUrl reflects NEXT_PUBLIC_APP_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://constructaiq.trade')
    const res     = await GET(makeReq())
    const body    = await res.json() as Record<string, unknown>
    expect((body.runtime as Record<string, string>).appUrl).toBe('https://constructaiq.trade')
  })

  it('appUrl is null when NEXT_PUBLIC_APP_URL is unset', async () => {
    const res     = await GET(makeReq())
    const body    = await res.json() as Record<string, unknown>
    expect((body.runtime as Record<string, unknown>).appUrl).toBeNull()
  })
})

// ── data section — federalSource ──────────────────────────────────────────────

describe('data.federalSource', () => {
  it('is "usaspending.gov" when leaderboard cache is fresh (< 24h)', async () => {
    federalCacheSingleMock.mockResolvedValue({
      data:  { cached_at: FRESH_CACHE_AT },
      error: null,
    })
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect((body.data as Record<string, string>).federalSource).toBe('usaspending.gov')
  })

  it('is "static-fallback" when leaderboard cache is stale (> 24h)', async () => {
    federalCacheSingleMock.mockResolvedValue({
      data:  { cached_at: STALE_CACHE_AT },
      error: null,
    })
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect((body.data as Record<string, string>).federalSource).toBe('static-fallback')
  })

  it('is "static-fallback" when no cache row exists', async () => {
    federalCacheSingleMock.mockResolvedValue({ data: null, error: null })
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect((body.data as Record<string, string>).federalSource).toBe('static-fallback')
  })

  it('is "unknown" when the Supabase query errors', async () => {
    federalCacheSingleMock.mockResolvedValue({
      data:  null,
      error: { message: 'relation "federal_cache" does not exist' },
    })
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect((body.data as Record<string, string>).federalSource).toBe('unknown')
  })
})

// ── data section — weeklyBriefSource ─────────────────────────────────────────

describe('data.weeklyBriefSource', () => {
  it('is "ai" when isWeeklyBriefConfigured returns true', async () => {
    weeklyBriefConfiguredMock.mockReturnValue(true)
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect((body.data as Record<string, string>).weeklyBriefSource).toBe('ai')
  })

  it('is "static-fallback" when isWeeklyBriefConfigured returns false', async () => {
    weeklyBriefConfiguredMock.mockReturnValue(false)
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect((body.data as Record<string, string>).weeklyBriefSource).toBe('static-fallback')
  })
})

// ── deep param ────────────────────────────────────────────────────────────────

describe('?deep param', () => {
  it('omits dashboardShapeOk without ?deep=1', async () => {
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect((body.data as Record<string, unknown>)).not.toHaveProperty('dashboardShapeOk')
  })

  it('includes dashboardShapeOk with ?deep=1', async () => {
    obsEqMock.mockResolvedValue({ count: 24, error: null })
    // ttlconsRes chain: fromMock for observations returns count > 0
    fromMock.mockImplementation((table: string) => {
      if (table === 'series') return buildSeriesChain([])
      if (table === 'observations') return buildCountChain(24)
      return buildCountChain(0)
    })
    const res  = await GET(makeReq({ deep: '1' }))
    const body = await res.json() as Record<string, unknown>
    expect((body.data as Record<string, unknown>)).toHaveProperty('dashboardShapeOk')
    expect(typeof (body.data as Record<string, boolean>).dashboardShapeOk).toBe('boolean')
  })

  it('dashboardShapeOk is true when all three key series have observations', async () => {
    obsEqMock.mockResolvedValue({ count: 50, error: null })
    fromMock.mockImplementation((table: string) => {
      if (table === 'series') return buildSeriesChain([])
      if (table === 'observations') return buildCountChain(50)
      return buildCountChain(0)
    })
    const res  = await GET(makeReq({ deep: '1' }))
    const body = await res.json() as Record<string, unknown>
    expect((body.data as Record<string, boolean>).dashboardShapeOk).toBe(true)
  })

  it('dashboardShapeOk is false when observations table is empty', async () => {
    obsEqMock.mockResolvedValue({ count: 0, error: null })
    fromMock.mockImplementation((table: string) => {
      if (table === 'series') return buildSeriesChain([])
      return buildCountChain(0)
    })
    const res  = await GET(makeReq({ deep: '1' }))
    const body = await res.json() as Record<string, unknown>
    expect((body.data as Record<string, boolean>).dashboardShapeOk).toBe(false)
  })
})

// ── backward-compat: existing sections still present ──────────────────────────

describe('existing sections preserved', () => {
  it('still returns freshness, api_health, weekly_brief, as_of', async () => {
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect(body).toHaveProperty('freshness')
    expect(body).toHaveProperty('api_health')
    expect(body).toHaveProperty('weekly_brief')
    expect(body).toHaveProperty('as_of')
    expect(body).toHaveProperty('env')
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('runtime')
  })

  it('weekly_brief.configured mirrors isWeeklyBriefConfigured()', async () => {
    weeklyBriefConfiguredMock.mockReturnValue(true)
    const res  = await GET(makeReq())
    const body = await res.json() as Record<string, unknown>
    expect((body.weekly_brief as Record<string, boolean>).configured).toBe(true)
  })
})
