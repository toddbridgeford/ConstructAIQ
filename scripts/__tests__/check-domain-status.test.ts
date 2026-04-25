import { describe, it, expect } from 'vitest'
import {
  classifyApex,
  classifyWww,
  parseArgs,
  buildJsonOutput,
  detectProxy,
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

  it('308 Location https://www.constructaiq.trade -> APEX_REDIRECTS_TO_WWW', () => {
    expect(classifyApex({ ok: true, status: 308, denyReason: null, location: 'https://www.constructaiq.trade/' }))
      .toBe('APEX_REDIRECTS_TO_WWW')
  })

  it('301 Location https://www.constructaiq.trade/dashboard -> APEX_REDIRECTS_TO_WWW', () => {
    expect(classifyApex({ ok: true, status: 301, denyReason: null, location: 'https://www.constructaiq.trade/dashboard' }))
      .toBe('APEX_REDIRECTS_TO_WWW')
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

const okApexResult  = { ok: true, status: 200, denyReason: null, location: null, server: null, cfCacheStatus: null, cfRay: null, xVercelId: null }
const okWwwResult   = { ok: true, status: 301, denyReason: null, location: 'https://constructaiq.trade/dashboard', server: null, cfCacheStatus: null, cfRay: null, xVercelId: null }
const denyResult    = { ok: true, status: 403, denyReason: 'host_not_allowed', location: null, server: null, cfCacheStatus: null, cfRay: null, xVercelId: null }
const failWwwResult = { ok: true, status: 500, denyReason: null, location: null, server: null, cfCacheStatus: null, cfRay: null, xVercelId: null }
const netErrResult  = { ok: false, error: 'ENOTFOUND', code: 'ENOTFOUND' }

const cfApexResult  = {
  ok: true, status: 200, denyReason: null, location: null,
  server: 'cloudflare', cfCacheStatus: 'DYNAMIC', cfRay: 'abc123-IAD', xVercelId: null,
}
const cfWwwResult   = {
  ok: true, status: 308, denyReason: null, location: 'https://constructaiq.trade/dashboard',
  server: 'cloudflare', cfCacheStatus: 'MISS', cfRay: 'def456-IAD', xVercelId: null,
}

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

  it('apex entry includes url, status, denyReason, location, diagnostic headers, classification, proxyWarning', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: okApexResult, apexClass: 'APEX_OK',
      wwwUrl: DEFAULT_WWW,   wwwResult:  okWwwResult,  wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.apex).toEqual({
      url:            DEFAULT_APEX,
      status:         200,
      denyReason:     null,
      location:       null,
      server:         null,
      cfCacheStatus:  null,
      cfRay:          null,
      xVercelId:      null,
      classification: 'APEX_OK',
      proxyWarning:   false,
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

  it('exitCode=2 and ok=false when apex redirects to www (canonical mismatch)', () => {
    const apexToWwwResult = { ok: true, status: 308, denyReason: null, location: 'https://www.constructaiq.trade/' }
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: apexToWwwResult, apexClass: 'APEX_REDIRECTS_TO_WWW',
      wwwUrl: DEFAULT_WWW,   wwwResult:  okWwwResult,     wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.exitCode).toBe(2)
    expect(out.ok).toBe(false)
    expect(out.apex.classification).toBe('APEX_REDIRECTS_TO_WWW')
    // www-to-apex redirect is still correctly classified even when apex is broken
    expect(out.www.classification).toBe('WWW_REDIRECT_OK')
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

  it('proxyWarning=false when no Cloudflare headers present', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: okApexResult, apexClass: 'APEX_OK',
      wwwUrl: DEFAULT_WWW,   wwwResult:  okWwwResult,  wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.proxyWarning).toBe(false)
    expect(out.apex.proxyWarning).toBe(false)
    expect(out.www.proxyWarning).toBe(false)
  })

  it('proxyWarning=true when apex has Cloudflare server header', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: cfApexResult, apexClass: 'APEX_OK',
      wwwUrl: DEFAULT_WWW,   wwwResult:  okWwwResult,  wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.apex.proxyWarning).toBe(true)
    expect(out.proxyWarning).toBe(true)
  })

  it('proxyWarning=true when www has cf-ray header', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: okApexResult, apexClass: 'APEX_OK',
      wwwUrl: DEFAULT_WWW,   wwwResult:  cfWwwResult,  wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.www.proxyWarning).toBe(true)
    expect(out.proxyWarning).toBe(true)
  })

  it('proxyWarning does not change exitCode when apex/www are otherwise correct', () => {
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: cfApexResult, apexClass: 'APEX_OK',
      wwwUrl: DEFAULT_WWW,   wwwResult:  cfWwwResult,  wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.proxyWarning).toBe(true)
    expect(out.exitCode).toBe(0)
    expect(out.ok).toBe(true)
  })

  it('APEX_REDIRECTS_TO_WWW still yields exitCode=2 regardless of proxyWarning', () => {
    const apexToWwwCf = {
      ok: true, status: 308, denyReason: null,
      location: 'https://www.constructaiq.trade/',
      server: 'cloudflare', cfCacheStatus: 'DYNAMIC', cfRay: 'xyz-IAD', xVercelId: null,
    }
    const out = buildJsonOutput({
      apexUrl: DEFAULT_APEX, apexResult: apexToWwwCf, apexClass: 'APEX_REDIRECTS_TO_WWW',
      wwwUrl: DEFAULT_WWW,   wwwResult:  cfWwwResult, wwwClass:  'WWW_REDIRECT_OK',
    })
    expect(out.apex.classification).toBe('APEX_REDIRECTS_TO_WWW')
    expect(out.exitCode).toBe(2)
    expect(out.ok).toBe(false)
    expect(out.proxyWarning).toBe(true)
  })
})

// ── detectProxy ───────────────────────────────────────────────────────────────

describe('detectProxy', () => {
  it('returns false when result.ok is false', () => {
    expect(detectProxy({ ok: false, error: 'ENOTFOUND', code: 'ENOTFOUND' })).toBe(false)
  })

  it('returns false when no proxy headers present', () => {
    expect(detectProxy({ ok: true, status: 200, server: null, cfCacheStatus: null, cfRay: null })).toBe(false)
  })

  it('returns true when server is "cloudflare"', () => {
    expect(detectProxy({ ok: true, status: 200, server: 'cloudflare', cfCacheStatus: null, cfRay: null })).toBe(true)
  })

  it('returns true when server contains "cloudflare" mixed-case', () => {
    expect(detectProxy({ ok: true, status: 200, server: 'Cloudflare', cfCacheStatus: null, cfRay: null })).toBe(true)
  })

  it('returns true when cf-ray header is present', () => {
    expect(detectProxy({ ok: true, status: 200, server: null, cfCacheStatus: null, cfRay: 'abc123-IAD' })).toBe(true)
  })

  it('returns true when cf-cache-status header is present', () => {
    expect(detectProxy({ ok: true, status: 200, server: null, cfCacheStatus: 'HIT', cfRay: null })).toBe(true)
  })

  it('returns false when only x-vercel-id is present (Vercel-direct, no proxy)', () => {
    expect(detectProxy({ ok: true, status: 200, server: null, cfCacheStatus: null, cfRay: null, xVercelId: 'iad1::abc' })).toBe(false)
  })
})
