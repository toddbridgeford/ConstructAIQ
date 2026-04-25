/**
 * Tests for CRON_SECRET enforcement on the brief cron route handler.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the weeklyBrief lib so tests never call Claude or Supabase
vi.mock('@/lib/weeklyBrief', () => ({
  generateBrief: vi.fn().mockResolvedValue({
    brief:       'HEADLINE SIGNAL: Test.',
    generatedAt: '2025-01-06T12:00:00Z',
    source:      'static-fallback',
    live:        false,
    configured:  false,
  }),
  getWeeklyBrief: vi.fn().mockResolvedValue({
    brief:       'HEADLINE SIGNAL: Test.',
    generatedAt: '2025-01-06T12:00:00Z',
    source:      'static-fallback',
    live:        false,
    configured:  false,
  }),
  STATIC_BRIEF: 'HEADLINE SIGNAL: Test.',
  isWeeklyBriefConfigured: () => false,
}))

import { GET as briefGET } from '../brief/route'

function makeReq(auth?: string): Request {
  return new Request('http://localhost/api/cron/brief', {
    headers: auth ? { authorization: auth } : {},
  })
}

beforeEach(() => vi.stubEnv('CRON_SECRET', 'test-cron-secret'))
afterEach(() => vi.unstubAllEnvs())

describe('brief cron auth guard', () => {
  it('returns 401 with no Authorization header', async () => {
    const res = await briefGET(makeReq())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 with wrong secret', async () => {
    const res = await briefGET(makeReq('Bearer wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('proceeds past auth with correct secret', async () => {
    const res = await briefGET(makeReq('Bearer test-cron-secret'))
    expect(res.status).not.toBe(401)
  })

  it('allows through when CRON_SECRET is empty (dev mode)', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const res = await briefGET(makeReq())
    expect(res.status).not.toBe(401)
  })

  it('returns source and generatedAt in response body', async () => {
    const res  = await briefGET(makeReq('Bearer test-cron-secret'))
    const body = await res.json()
    expect(body).toHaveProperty('source')
    expect(body).toHaveProperty('generatedAt')
    expect(body).toHaveProperty('durationMs')
  })
})
