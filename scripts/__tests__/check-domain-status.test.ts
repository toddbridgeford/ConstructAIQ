import { describe, it, expect } from 'vitest'
import {
  classifyApex,
  classifyWww,
  parseArgs,
  buildJsonOutput,
} from '../check-domain-status.mjs'

const DEFAULT_APEX = 'https://constructaiq.trade'
const DEFAULT_WWW  = 'https://www.constructaiq.trade/dashboard'

// ── classifyApex ──────────────────────────────────────────────────────────────

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

// ── classifyWww ───────────────────────────────────────────────────────────────

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

// ── parseArgs ─────────────────────────────────────────────────────────────────

describe('parseArgs', () => {
  it('returns defaults when no flags are given', () => {
    expect(parseArgs([])).toEqual({ json: false, apexUrl: DEFAULT_APEX, wwwUrl: DEFAULT_WWW })
  })

  it('--json sets json=true', () => {
    expect(parseArgs(['--json'])).toMatchObject({ json: true })
  })

  it('--apex overrides apexUrl', () => {
    expect(parseArgs(['--apex', 'https://preview.vercel.app']))
      .toMatchObject({ apexUrl: 'https://preview.vercel.app' })
  })

  it('--www overrides wwwUrl', () => {
    expect(parseArgs(['--www', 'https://www-preview.vercel.app/dashboard']))
      .toMatchObject({ wwwUrl: 'https://www-preview.vercel.app/dashboard' })
  })

  it('all three flags together', () => {
    expect(parseArgs(['--json', '--apex', 'https://a.example.com', '--www', 'https://b.example.com']))
      .toEqual({ json: true, apexUrl: 'https://a.example.com', wwwUrl: 'https://b.example.com' })
  })

  it('--apex without a value leaves default unchanged', () => {
    expect(parseArgs(['--apex'])).toMatchObject({ apexUrl: DEFAULT_APEX })
  })
})

// ── buildJsonOutput ───────────────────────────────────────────────────────────

const okApexResult  = { ok: true, status: 200, denyReason: null, location: null }
const okWwwResult   = { ok: true, status: 301, denyReason: null, location: 'https://constructaiq.trade/dashboard' }
const denyResult    = { ok: true, status: 403, denyReason: 'host_not_allowed', location: null }
const failWwwResult = { ok: true, status: 500, denyReason: null, location: null }
const netErrResult  = { ok: false, error: 'ENOTFOUND', code: 'ENOTFOUND' }

describe('buildJsonOutput', () => {
  it('has the required top-level shape', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: okApexResult, apexClass: 'APEX_OK',
      wwwUrl: DEFAULT_WWW,   wwwResult:  okWwwResult,  wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out).toHaveProperty('apex')
    expect(out).toHaveProperty('www')
    expect(out).toHaveProperty('ok')
    expect(out).toHaveProperty('exitCode')
  })

  it('apex entry includes url, status, denyReason, location, classification', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: okApexResult, apexClass: 'APEX_OK',
      wwwUrl: DEFAULT_WWW,   wwwResult:  okWwwResult,  wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.apex).toEqual({
      url:            DEFAULT_APEX,
      status:         200,
      denyReason:     null,
      location:       null,
      classification: 'APEX_OK',
    })
  })

  it('ok=true and exitCode=0 when both sides pass', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: okApexResult, apexClass: 'APEX_OK',
      wwwUrl: DEFAULT_WWW,   wwwResult:  okWwwResult,  wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.ok).toBe(true)
    expect(out.exitCode).toBe(0)
  })

  it('exitCode=1 when host_not_allowed on apex', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: denyResult, apexClass: 'VERCEL_DOMAIN_NOT_BOUND',
      wwwUrl: DEFAULT_WWW,   wwwResult:  okWwwResult, wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.exitCode).toBe(1)
    expect(out.ok).toBe(false)
  })

  it('exitCode=1 when host_not_allowed on www', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: okApexResult, apexClass: 'APEX_OK',
      wwwUrl: DEFAULT_WWW,   wwwResult:  denyResult,   wwwClass:  'VERCEL_DOMAIN_NOT_BOUND',
    })
    expect(out.exitCode).toBe(1)
  })

  it('exitCode=2 for other www failure', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: okApexResult,  apexClass: 'APEX_OK',
      wwwUrl: DEFAULT_WWW,   wwwResult:  failWwwResult,  wwwClass:  'UNKNOWN_FAILURE',
    })
    expect(out.exitCode).toBe(2)
    expect(out.ok).toBe(false)
  })

  it('status is null when probe returned a network error', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: netErrResult, apexClass: 'DNS_MISSING',
      wwwUrl: DEFAULT_WWW,   wwwResult:  okWwwResult,  wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.apex.status).toBeNull()
  })

  it('reflects custom URLs passed via --apex / --www', () => {
    const out = buildJsonOutput({
      apexUrl: 'https://staging.example.com', apexResult: okApexResult, apexClass: 'APEX_OK',
      wwwUrl:  'https://www-staging.example.com/dashboard', wwwResult: okWwwResult, wwwClass: 'WWW_REDIRECT_OK',
    })
    expect(out.apex.url).toBe('https://staging.example.com')
    expect(out.www.url).toBe('https://www-staging.example.com/dashboard')
  })
})
