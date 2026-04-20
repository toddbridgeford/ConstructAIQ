/**
 * Tests for CRON_SECRET enforcement on cron route handlers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Minimal supabase chain mock so routes don't crash before reaching auth guard
const mockDbChain = {
  select: vi.fn(),
  insert: vi.fn().mockResolvedValue({ error: null }),
  update: vi.fn(),
  eq:     vi.fn(),
  order:  vi.fn(),
  limit:  vi.fn().mockResolvedValue({ data: [], error: null }),
}
mockDbChain.select.mockReturnValue(mockDbChain)
mockDbChain.update.mockReturnValue(mockDbChain)
mockDbChain.eq.mockReturnValue(mockDbChain)
mockDbChain.order.mockReturnValue(mockDbChain)

vi.mock('@/lib/supabase', () => ({
  supabase:           { from: vi.fn(() => mockDbChain) },
  supabaseAdmin:      { from: vi.fn(() => mockDbChain) },
  upsertObservations: vi.fn().mockResolvedValue(undefined),
  upsertForecasts:    vi.fn().mockResolvedValue(undefined),
  touchSeries:        vi.fn().mockResolvedValue(undefined),
  insertSignal:       vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/models/ensemble', () => ({
  runEnsemble: vi.fn().mockReturnValue(null),
}))

import { GET as harvestGET }  from '../harvest/route'
import { GET as forecastGET } from '../forecast/route'

function makeReq(auth?: string): Request {
  return new Request('http://localhost/api/cron/harvest', {
    headers: auth ? { authorization: auth } : {},
  })
}

beforeEach(() => vi.stubEnv('CRON_SECRET', 'test-cron-secret'))
afterEach(() => vi.unstubAllEnvs())

describe('harvest cron auth guard', () => {
  it('returns 401 with no Authorization header', async () => {
    const res = await harvestGET(makeReq())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 with wrong secret', async () => {
    const res = await harvestGET(makeReq('Bearer wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('proceeds past auth with correct secret', async () => {
    const res = await harvestGET(makeReq('Bearer test-cron-secret'))
    expect(res.status).not.toBe(401)
  })

  it('allows through when CRON_SECRET is empty (dev mode)', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const res = await harvestGET(makeReq())
    expect(res.status).not.toBe(401)
  })
})

describe('forecast cron auth guard', () => {
  it('returns 401 with no Authorization header', async () => {
    const res = await forecastGET(makeReq())
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong secret', async () => {
    const res = await forecastGET(makeReq('Bearer bad-token'))
    expect(res.status).toBe(401)
  })

  it('proceeds past auth with correct secret', async () => {
    const res = await forecastGET(makeReq('Bearer test-cron-secret'))
    expect(res.status).not.toBe(401)
  })
})
