#!/usr/bin/env node
/**
 * Production smoke test — runs against a live URL.
 *
 * Usage:
 *   node scripts/smoke-prod.mjs https://constructaiq.trade
 *
 * Exit 0 = all checks passed.
 * Exit 1 = one or more checks failed.
 */

const BASE = process.argv[2]

if (!BASE) {
  console.error('Usage: node scripts/smoke-prod.mjs <base-url>')
  console.error('  e.g. node scripts/smoke-prod.mjs https://constructaiq.trade')
  process.exit(1)
}

const TIMEOUT_MS = 20_000
const REQUIRED_DASHBOARD_KEYS = [
  'construction_spending',
  'employment',
  'permits',
  'cshi',
  'forecast',
  'signals',
  'commodities',
  'obs',
  'fetched_at',
]

let passed = 0
let failed = 0

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(label) {
  console.log(`  ✓  ${label}`)
  passed++
}

function fail(label, detail = '') {
  console.error(`  ✗  ${label}${detail ? `\n       ${detail}` : ''}`)
  failed++
}

async function get(url, { followRedirects = true } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      redirect: followRedirects ? 'follow' : 'manual',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'ConstructAIQ-smoke/1.0' },
    })
    const text = await res.text().catch(() => '')
    return { status: res.status, text, headers: res.headers, url: res.url }
  } finally {
    clearTimeout(timer)
  }
}

function section(title) {
  console.log(`\n${title}`)
}

// ── Checks ────────────────────────────────────────────────────────────────────

async function checkPage(path, label) {
  const url = `${BASE}${path}`
  let res
  try {
    res = await get(url)
  } catch (err) {
    fail(`${label} — fetch failed`, err.message)
    return
  }

  if (res.status !== 200) {
    fail(`${label} returns 200`, `got ${res.status}`)
    return
  }
  ok(`${label} returns 200`)

  if (res.text.includes('Something went wrong')) {
    fail(`${label} does not show global error page`, '"Something went wrong" found in body')
    return
  }
  if (res.text.includes('A rendering error occurred')) {
    fail(`${label} does not show global error page`, '"A rendering error occurred" found in body')
    return
  }
  ok(`${label} has no global error page`)
}

async function checkApiStatus() {
  const url = `${BASE}/api/status`
  let res
  try {
    res = await get(url)
  } catch (err) {
    fail('/api/status — fetch failed', err.message)
    return
  }
  if (res.status !== 200) {
    fail('/api/status returns 200', `got ${res.status}`)
  } else {
    ok('/api/status returns 200')
  }
}

async function checkApiDashboard() {
  const url = `${BASE}/api/dashboard`
  let res
  try {
    res = await get(url)
  } catch (err) {
    fail('/api/dashboard — fetch failed', err.message)
    return
  }

  if (res.status !== 200) {
    fail('/api/dashboard returns 200', `got ${res.status}`)
    return
  }
  ok('/api/dashboard returns 200')

  let json
  try {
    json = JSON.parse(res.text)
  } catch {
    fail('/api/dashboard returns valid JSON', 'body is not parseable JSON')
    return
  }
  ok('/api/dashboard returns valid JSON')

  // Required top-level keys
  const missing = REQUIRED_DASHBOARD_KEYS.filter(k => !(k in json))
  if (missing.length > 0) {
    fail('/api/dashboard has all required keys', `missing: ${missing.join(', ')}`)
  } else {
    ok('/api/dashboard has all required keys')
  }

  // signals must be an array
  if (!Array.isArray(json.signals)) {
    fail('/api/dashboard signals is an array', `got ${typeof json.signals}`)
  } else {
    ok('/api/dashboard signals is an array')
  }

  // commodities must be an array
  if (!Array.isArray(json.commodities)) {
    fail('/api/dashboard commodities is an array', `got ${typeof json.commodities}`)
  } else {
    ok('/api/dashboard commodities is an array')
  }

  // cshi may be object or null — anything but undefined/string counts
  if (json.cshi !== null && json.cshi !== undefined && typeof json.cshi !== 'object') {
    fail('/api/dashboard cshi is object or null', `got ${typeof json.cshi}: ${JSON.stringify(json.cshi)}`)
  } else {
    ok('/api/dashboard cshi is object or null (regression guard)')
  }
}

async function checkWwwRedirect() {
  // Derive the www counterpart from BASE
  const parsed = new URL(BASE)
  if (!parsed.hostname.startsWith('www.')) {
    const wwwUrl = `${parsed.protocol}//www.${parsed.hostname}/dashboard`
    const targetUrl = `${BASE}/dashboard`
    let res
    try {
      res = await get(wwwUrl, { followRedirects: false })
    } catch (err) {
      // DNS did not resolve — this is a hard failure, not a skip
      fail(
        'www subdomain is configured',
        `Could not reach ${wwwUrl} — DNS likely not configured. ` +
        `Add a CNAME record for www.${parsed.hostname} and add it as a Vercel project domain. ` +
        `Error: ${err.message}`,
      )
      return
    }

    const isRedirect = res.status >= 300 && res.status < 400
    if (!isRedirect) {
      fail(
        `www redirects to apex (expected 301/302, got ${res.status})`,
        `${wwwUrl} did not redirect — check Vercel domain settings`,
      )
      return
    }
    ok(`www subdomain returns ${res.status} redirect`)

    const location = res.headers.get('location') ?? ''
    if (!location.startsWith(targetUrl) && location !== targetUrl) {
      fail(
        'www redirect points to apex',
        `Location: ${location || '(none)'} — expected prefix: ${targetUrl}`,
      )
    } else {
      ok(`www redirect → ${location}`)
    }
  } else {
    // BASE is already www — skip this check
    ok('www redirect check skipped (BASE is already www)')
  }
}

// ── Runner ────────────────────────────────────────────────────────────────────

console.log(`\nConstructAIQ production smoke test`)
console.log(`Target: ${BASE}`)
console.log('─'.repeat(50))

section('Pages')
await checkPage('/', 'GET /')
await checkPage('/dashboard', 'GET /dashboard')

section('API')
await checkApiStatus()
await checkApiDashboard()

section('www redirect')
await checkWwwRedirect()

console.log('\n' + '─'.repeat(50))
console.log(`${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.error('\n✗ Smoke test FAILED\n')
  process.exit(1)
} else {
  console.log('\n✓ All checks passed\n')
  process.exit(0)
}
