import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateApiKey } from '../auth'

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('validateApiKey', () => {
  it('returns misconfigured error when env vars are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    const result = await validateApiKey('caiq_abc123')

    expect(result).toEqual({ valid: false, error: 'Auth service misconfigured' })
  })

  it('returns Auth lookup failed when fetch throws', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))

    const result = await validateApiKey('caiq_abc123')

    expect(result).toEqual({ valid: false, error: 'Auth lookup failed' })
  })

  it('returns Auth lookup failed when fetch returns non-ok status', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    } as unknown as Response)

    const result = await validateApiKey('caiq_abc123')

    expect(result).toEqual({ valid: false, error: 'Auth lookup failed' })
  })

  it('returns Invalid key when fetch returns empty array', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    } as unknown as Response)

    const result = await validateApiKey('caiq_abc123')

    expect(result).toEqual({ valid: false, error: 'Invalid key' })
  })

  it('returns Key inactive when row has active: false', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        { plan: 'starter', rpm_limit: 60, rpd_limit: 1000, active: false },
      ]),
    } as unknown as Response)

    const result = await validateApiKey('caiq_abc123')

    expect(result).toEqual({ valid: false, error: 'Key inactive' })
  })

  it('returns valid key info with 64-char hex key_hash for an active row', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        { plan: 'starter', rpm_limit: 60, rpd_limit: 1000, active: true },
      ]),
    } as unknown as Response)

    const result = await validateApiKey('caiq_abc123')

    expect(result.valid).toBe(true)
    expect(result.plan).toBe('starter')
    expect(result.rpm_limit).toBe(60)
    expect(result.rpd_limit).toBe(1000)
    expect(result.key_hash).toMatch(/^[0-9a-f]{64}$/)
  })
})
