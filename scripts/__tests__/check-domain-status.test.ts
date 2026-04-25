import { describe, it, expect } from 'vitest'
import { classifyApex, classifyWww } from '../check-domain-status.mjs'

describe('classifyApex', () => {
  it('HTTP 200 -> APEX_OK', () => {
    expect(classifyApex({ ok: true, status: 200, denyReason: null, location: null }))
      .toBe('APEX_OK')
  })

  it('host_not_allowed -> VERCEL_DOMAIN_NOT_BOUND', () => {
    expect(classifyApex({ ok: true, status: 403, denyReason: 'host_not_allowed', location: null }))
      .toBe('VERCEL_DOMAIN_NOT_BOUND')
  })

  it('ENOTFOUND -> DNS_MISSING', () => {
    expect(classifyApex({ ok: false, error: 'getaddrinfo ENOTFOUND constructaiq.trade', code: 'ENOTFOUND' }))
      .toBe('DNS_MISSING')
  })

  it('unknown HTTP status -> UNKNOWN_FAILURE', () => {
    expect(classifyApex({ ok: true, status: 500, denyReason: null, location: null }))
      .toBe('UNKNOWN_FAILURE')
  })
})

describe('classifyWww', () => {
  it('301 to https://constructaiq.trade/dashboard -> WWW_REDIRECT_OK', () => {
    expect(classifyWww({ ok: true, status: 301, denyReason: null, location: 'https://constructaiq.trade/dashboard' }))
      .toBe('WWW_REDIRECT_OK')
  })

  it('302 to https://constructaiq.trade/dashboard -> WWW_REDIRECT_OK', () => {
    expect(classifyWww({ ok: true, status: 302, denyReason: null, location: 'https://constructaiq.trade/dashboard' }))
      .toBe('WWW_REDIRECT_OK')
  })

  it('308 to https://constructaiq.trade/dashboard -> WWW_REDIRECT_OK', () => {
    expect(classifyWww({ ok: true, status: 308, denyReason: null, location: 'https://constructaiq.trade/dashboard' }))
      .toBe('WWW_REDIRECT_OK')
  })

  it('redirect to wrong domain -> WWW_REDIRECT_WRONG_TARGET', () => {
    expect(classifyWww({ ok: true, status: 301, denyReason: null, location: 'https://example.com/dashboard' }))
      .toBe('WWW_REDIRECT_WRONG_TARGET')
  })

  it('host_not_allowed -> VERCEL_DOMAIN_NOT_BOUND', () => {
    expect(classifyWww({ ok: true, status: 403, denyReason: 'host_not_allowed', location: null }))
      .toBe('VERCEL_DOMAIN_NOT_BOUND')
  })

  it('unknown HTTP status -> UNKNOWN_FAILURE', () => {
    expect(classifyWww({ ok: true, status: 500, denyReason: null, location: null }))
      .toBe('UNKNOWN_FAILURE')
  })
})
