import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const captureExceptionMock = vi.hoisted(() => vi.fn())
const withScopeMock        = vi.hoisted(() => vi.fn((cb: (s: unknown) => void) => {
  cb({ setTag: vi.fn(), setContext: vi.fn() })
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: captureExceptionMock,
  withScope:        withScopeMock,
}))

import { logApiError, logApiWarn, redactContext } from '../observability'

let consoleErrorSpy: ReturnType<typeof vi.spyOn>
let consoleWarnSpy:  ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  consoleWarnSpy  = vi.spyOn(console, 'warn').mockImplementation(() => {})
  captureExceptionMock.mockClear()
  withScopeMock.mockClear()
})

afterEach(() => {
  consoleErrorSpy.mockRestore()
  consoleWarnSpy.mockRestore()
})

// ── redactContext ─────────────────────────────────────────────────────────────

describe('redactContext', () => {
  it('returns undefined for undefined input', () => {
    expect(redactContext(undefined)).toBeUndefined()
  })

  it('redacts keys containing api_key / apiKey / api-key', () => {
    const out = redactContext({
      api_key: 'sk-real-key',
      apiKey:  'sk-real-key-2',
      'api-key': 'sk-real-key-3',
    }) as Record<string, unknown>
    expect(out.api_key).toBe('[redacted]')
    expect(out.apiKey).toBe('[redacted]')
    expect(out['api-key']).toBe('[redacted]')
  })

  it('redacts secret/token/password/authorization/bearer keys', () => {
    const out = redactContext({
      secret:        'shhh',
      token:         'tok',
      password:      'pw',
      authorization: 'Bearer abc',
      bearer:        'def',
    }) as Record<string, unknown>
    for (const v of Object.values(out)) expect(v).toBe('[redacted]')
  })

  it('redacts service_role and SUPABASE_SERVICE_ROLE_KEY-style keys', () => {
    const out = redactContext({
      service_role_key: 'srk',
      SERVICE_ROLE:     'srv',
    }) as Record<string, unknown>
    expect(out.service_role_key).toBe('[redacted]')
    expect(out.SERVICE_ROLE).toBe('[redacted]')
  })

  it('redacts anthropic_api_key and dsn / sentry keys', () => {
    const out = redactContext({
      ANTHROPIC_API_KEY: 'sk-ant-xxx',
      sentry_dsn:        'https://xxx@sentry.io/1',
      session_cookie:    'abc=def',
    }) as Record<string, unknown>
    expect(out.ANTHROPIC_API_KEY).toBe('[redacted]')
    expect(out.sentry_dsn).toBe('[redacted]')
    expect(out.session_cookie).toBe('[redacted]')
  })

  it('redacts string values starting with sk- / Bearer / eyJ', () => {
    const out = redactContext({
      detail:    'sk-ant-12345abcde',
      auth:      'Bearer xxxxxxxx',
      jwt:       'eyJhbGciOiJIUzI1NiJ9.payload',
      // Note: 'jwt' is not a flagged key, but the value pattern is.
    }) as Record<string, unknown>
    expect(out.detail).toBe('[redacted]')
    expect(out.auth).toBe('[redacted]')
    expect(out.jwt).toBe('[redacted]')
  })

  it('keeps non-secret strings, numbers, and booleans untouched', () => {
    const out = redactContext({
      endpoint: 'states',
      status:   503,
      live:     false,
    }) as Record<string, unknown>
    expect(out).toEqual({ endpoint: 'states', status: 503, live: false })
  })

  it('walks nested objects', () => {
    const out = redactContext({
      ctx: { api_key: 'sk-secret', endpoint: 'leaderboard' },
    }) as Record<string, Record<string, unknown>>
    expect(out.ctx.api_key).toBe('[redacted]')
    expect(out.ctx.endpoint).toBe('leaderboard')
  })

  it('Errors are reduced to their message (no stack leak)', () => {
    const out = redactContext({ error: new Error('boom') }) as Record<string, unknown>
    expect(out.error).toBe('boom')
  })

  it('caps recursion depth so circular-ish objects do not loop', () => {
    type Node = { next?: Node; api_key?: string }
    const a: Node = { api_key: 'sk-secret' }
    let cur: Node = a
    for (let i = 0; i < 10; i++) {
      cur.next = { api_key: 'sk-deep' }
      cur = cur.next
    }
    expect(() => redactContext({ root: a })).not.toThrow()
  })
})

// ── logApiError ──────────────────────────────────────────────────────────────

describe('logApiError', () => {
  it('does not throw for any input', () => {
    expect(() => logApiError('federal', new Error('boom'))).not.toThrow()
    expect(() => logApiError('federal', 'string error')).not.toThrow()
    expect(() => logApiError('federal', { weird: 'object' })).not.toThrow()
    expect(() => logApiError('federal', null)).not.toThrow()
    expect(() => logApiError('federal', undefined)).not.toThrow()
  })

  it('does not throw when context contains circular reference', () => {
    type Node = { self?: Node; tag: string }
    const a: Node = { tag: 'a' }
    a.self = a
    // The walker caps depth so circular refs do not stack-overflow.
    expect(() => logApiError('federal', new Error('x'), a as unknown as Record<string, unknown>)).not.toThrow()
  })

  it('writes scope-prefixed message to console.error', () => {
    logApiError('federal', new Error('USASpending unreachable'))
    expect(consoleErrorSpy).toHaveBeenCalled()
    const call = consoleErrorSpy.mock.calls[0]
    expect(String(call[0])).toBe('[federal]')
    expect(String(call[1])).toContain('USASpending unreachable')
  })

  it('forwards to Sentry.captureException', () => {
    const err = new Error('boom')
    logApiError('weeklyBrief', err)
    expect(captureExceptionMock).toHaveBeenCalledWith(err)
  })

  it('redacts secret-like context fields before logging', () => {
    logApiError('federal', new Error('x'), {
      api_key:  'sk-LEAK',
      endpoint: 'states',
    })
    const serialized = JSON.stringify(consoleErrorSpy.mock.calls)
    expect(serialized).not.toContain('sk-LEAK')
    expect(serialized).toContain('[redacted]')
    expect(serialized).toContain('states')
  })

  it('survives Sentry SDK throwing', () => {
    captureExceptionMock.mockImplementationOnce(() => { throw new Error('sentry down') })
    expect(() => logApiError('federal', new Error('x'))).not.toThrow()
  })
})

// ── logApiWarn ───────────────────────────────────────────────────────────────

describe('logApiWarn', () => {
  it('does not throw and does not call Sentry', () => {
    expect(() => logApiWarn('pricewatch', 'BLS upstream non-OK', { seriesId: 'WPU0811' })).not.toThrow()
    expect(captureExceptionMock).not.toHaveBeenCalled()
  })

  it('writes scope-prefixed warning to console.warn', () => {
    logApiWarn('forecast', 'persist failed')
    expect(consoleWarnSpy).toHaveBeenCalled()
    expect(String(consoleWarnSpy.mock.calls[0][0])).toBe('[forecast]')
    expect(String(consoleWarnSpy.mock.calls[0][1])).toBe('persist failed')
  })

  it('redacts secrets in warning context too', () => {
    logApiWarn('weeklyBrief', 'DB write failed', { token: 'sk-WARN-LEAK' })
    const serialized = JSON.stringify(consoleWarnSpy.mock.calls)
    expect(serialized).not.toContain('sk-WARN-LEAK')
    expect(serialized).toContain('[redacted]')
  })
})
