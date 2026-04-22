import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}))

import { supabaseAdmin } from '@/lib/supabase'
import { POST, GET } from '../issue/route'

const mockFrom   = vi.mocked(supabaseAdmin.from)
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockEq     = vi.fn()
const mockSingle = vi.fn()

function makeChain(overrides: Record<string, unknown> = {}) {
  const chain = {
    insert:  mockInsert,
    select:  vi.fn().mockReturnValue({ eq: mockEq }),
    eq:      vi.fn().mockReturnValue({ single: mockSingle }),
    single:  mockSingle,
    ...overrides,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabaseAdmin.from>)
  return chain
}

function makePostReq(body: unknown, authHeader?: string): Request {
  return new Request('http://localhost/api/keys/issue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  })
}

function makeGetReq(key?: string): Request {
  const url = key
    ? `http://localhost/api/keys/issue?key=${encodeURIComponent(key)}`
    : 'http://localhost/api/keys/issue'
  return new Request(url)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('CRON_SECRET', 'test-admin-secret')
  makeChain()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/keys/issue', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await POST(makePostReq({ email: 'test@example.com' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when Authorization header has wrong secret', async () => {
    const res = await POST(makePostReq({ email: 'test@example.com' }, 'Bearer wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when CRON_SECRET env var is not set', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const res = await POST(makePostReq({ email: 'test@example.com' }, 'Bearer test-admin-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing email', async () => {
    const res = await POST(makePostReq({}, 'Bearer test-admin-secret'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Valid email required')
  })

  it('returns 400 for invalid email (no @)', async () => {
    const res = await POST(makePostReq({ email: 'notanemail' }, 'Bearer test-admin-secret'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid plan', async () => {
    const res = await POST(makePostReq({ email: 'a@b.com', plan: 'platinum' }, 'Bearer test-admin-secret'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Invalid plan/)
  })

  it('returns 409 on duplicate email (DB unique constraint)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505' } })
    makeChain({ insert: mockInsert })
    const res = await POST(makePostReq({ email: 'dupe@example.com' }, 'Bearer test-admin-secret'))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/already exists/)
  })

  it('returns 201 with key on successful issuance', async () => {
    mockInsert.mockResolvedValue({ error: null })
    makeChain({ insert: mockInsert })
    const res = await POST(makePostReq({ email: 'new@example.com', plan: 'free' }, 'Bearer test-admin-secret'))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.key).toMatch(/^caiq_[0-9a-f]{64}$/)
    expect(body.plan).toBe('free')
    expect(body.limits.requestsPerMinute).toBe(60)
    expect(body.warning).toMatch(/Store this key/)
  })

  it('issues a researcher key with correct limits', async () => {
    mockInsert.mockResolvedValue({ error: null })
    makeChain({ insert: mockInsert })
    const res = await POST(makePostReq({ email: 'researcher@university.edu', plan: 'researcher' }, 'Bearer test-admin-secret'))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.limits.requestsPerMinute).toBe(60)
    expect(body.limits.requestsPerDay).toBe(10000)
  })
})

describe('GET /api/keys/issue', () => {
  it('returns 400 when key param is missing', async () => {
    const res = await GET(makeGetReq())
    expect(res.status).toBe(400)
  })

  it('returns invalid when key not found in DB', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    makeChain({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }) })
    const res = await GET(makeGetReq('caiq_badkey'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.valid).toBe(false)
  })

  it('returns invalid when key is inactive', async () => {
    mockSingle.mockResolvedValue({ data: { plan: 'starter', rpm_limit: 60, rpd_limit: 1000, active: false, usage: 0 }, error: null })
    makeChain({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }) })
    const res = await GET(makeGetReq('caiq_inactivekey'))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.valid).toBe(false)
  })

  it('returns valid key info for active key', async () => {
    mockSingle.mockResolvedValue({ data: { plan: 'professional', rpm_limit: 300, rpd_limit: 10000, active: true, usage: 42 }, error: null })
    makeChain({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }) })
    const res = await GET(makeGetReq('caiq_validkey'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.valid).toBe(true)
    expect(body.plan).toBe('professional')
    expect(body.usage).toBe(42)
  })
})
