import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies before importing middleware
vi.mock('@/lib/auth')
vi.mock('@/lib/ratelimit-edge')

import { validateApiKey } from '@/lib/auth'
import { checkRateLimitEdge, incrementUsageEdge } from '@/lib/ratelimit-edge'
import { middleware } from '../../middleware'

const mockValidate    = vi.mocked(validateApiKey)
const mockCheckRL     = vi.mocked(checkRateLimitEdge)
const mockIncrement   = vi.mocked(incrementUsageEdge)

function makeReq(pathname: string, headers: Record<string, string> = {}): NextRequest {
  const req = new NextRequest(`http://localhost${pathname}`)
  for (const [k, v] of Object.entries(headers)) req.headers.set(k, v)
  return req
}

beforeEach(() => {
  vi.resetAllMocks()
  mockIncrement.mockResolvedValue(undefined)
})

describe('middleware', () => {
  it('passes through non-API paths without auth', async () => {
    const res = await middleware(makeReq('/dashboard'))
    expect(res.status).toBe(200)
    expect(mockValidate).not.toHaveBeenCalled()
  })

  it('passes through public paths without auth', async () => {
    for (const path of ['/api/status', '/api/subscribe', '/api/keys/issue']) {
      const res = await middleware(makeReq(path))
      expect(res.status).toBe(200)
      expect(mockValidate).not.toHaveBeenCalled()
    }
  })

  it('passes through API requests with no key (open dashboard access)', async () => {
    const res = await middleware(makeReq('/api/forecast'))
    expect(res.status).toBe(200)
    expect(mockValidate).not.toHaveBeenCalled()
  })

  it('rejects keys that do not start with caiq_', async () => {
    const res = await middleware(makeReq('/api/forecast', { 'x-api-key': 'sk-bad-key' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid API key format')
    expect(mockValidate).not.toHaveBeenCalled()
  })

  it('rejects invalid keys with 401', async () => {
    mockValidate.mockResolvedValue({ valid: false, error: 'Invalid key' })
    const res = await middleware(makeReq('/api/forecast', { 'x-api-key': 'caiq_badkey' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid key')
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockValidate.mockResolvedValue({
      valid: true, plan: 'starter', rpm_limit: 60, rpd_limit: 1000, key_hash: 'abc123',
    })
    mockCheckRL.mockResolvedValue({ allowed: false, remaining: 0, reset: Date.now() + 30000 })
    const res = await middleware(makeReq('/api/forecast', { 'x-api-key': 'caiq_valid' }))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  it('forwards request and sets plan headers on valid key within limit', async () => {
    mockValidate.mockResolvedValue({
      valid: true, plan: 'professional', rpm_limit: 300, rpd_limit: 10000, key_hash: 'deadbeef',
    })
    mockCheckRL.mockResolvedValue({ allowed: true, remaining: 299 })
    const res = await middleware(makeReq('/api/forecast', { 'x-api-key': 'caiq_valid' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('x-key-plan')).toBe('professional')
    expect(res.headers.get('x-key-hash')).toBe('deadbeef')
  })

  it('fires usage increment without blocking the response', async () => {
    mockValidate.mockResolvedValue({
      valid: true, plan: 'starter', rpm_limit: 60, rpd_limit: 1000, key_hash: 'abc',
    })
    mockCheckRL.mockResolvedValue({ allowed: true })
    await middleware(makeReq('/api/forecast', { 'x-api-key': 'caiq_valid' }))
    expect(mockIncrement).toHaveBeenCalledWith('abc')
  })

  it('uses fallback error message when keyInfo.error is undefined', async () => {
    mockValidate.mockResolvedValue({ valid: false })
    const res = await middleware(makeReq('/api/forecast', { 'x-api-key': 'caiq_key' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })
})
