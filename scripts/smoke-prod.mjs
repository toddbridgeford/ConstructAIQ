#!/usr/bin/env node
/**
 * Production smoke test — runs against a live URL.
 *
 * Usage:
 *   node scripts/smoke-prod.mjs https://constructaiq.trade
 *   node scripts/smoke-prod.mjs https://constructaiq.trade --www-only
 *
 * Exit 0 = all checks passed.
 * Exit 1 = one or more checks failed.
 */

const args = process.argv.slice(2)
const BASE     = args.find(a => !a.startsWith('--'))
const WWW_ONLY = args.includes('--www-only')

if (!BASE) {
  console.error('Usage: node scripts/smoke-prod.mjs <base-url> [--www-only]')
  console.error('  e.g. node scripts/smoke-prod.mjs https://constructaiq.trade')
  console.error('  e.g. node scripts/smoke-prod.mjs https://constructaiq.trade --www-only')
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

// ── www diagnostics ────────────────────────────────────────────────────────
//
// The redirect at next.config.ts only fires AFTER three things are true:
//   1. www.<apex> has a DNS record pointing at Vercel.
//   2. www.<apex> is added to the Vercel project as a domain alias.
//   3. The deployed app contains the redirects() rule.
//
// If any of those is missing the user sees one of four distinct symptoms.
// This checker reports which one so the operator knows exactly what to fix.

function classifyDnsError(err) {
  const code = err?.cause?.code ?? err?.code
  if (code === 'ENOTFOUND')        return 'ENOTFOUND'
  if (code === 'EAI_AGAIN')        return 'EAI_AGAIN'
  if (code === 'ECONNREFUSED')     return 'ECONNREFUSED'
  if (code === 'CERT_HAS_EXPIRED') return 'CERT_HAS_EXPIRED'
  // Node's undici wraps DNS errors as "TypeError: fetch failed" — fall through
  // to a generic "unreachable" classification.
  return null
}

const FIX_DNS = (host) =>
  `Fix: add a CNAME record  ${host}  →  cname.vercel-dns.com  ` +
  `at your DNS provider, then add ${host} to the Vercel project ` +
  `under Settings → Domains. See docs/PRODUCTION_SMOKE.md.`

const FIX_VERCEL_ALIAS = (host) =>
  `Fix: add ${host} as a Vercel project domain. ` +
  `Vercel dashboard → ConstructAIQ project → Settings → Domains → Add → "${host}". ` +
  `See docs/PRODUCTION_SMOKE.md.`

const FIX_REDIRECT_RULE = (apex, host) =>
  `Fix: the next.config.ts redirects() rule should map host="${host}" → ` +
  `"https://${apex}/:path*". Verify the rule, redeploy, and re-run smoke:www.`

async function checkWwwRedirect() {
  const parsed = new URL(BASE)

  if (parsed.hostname.startsWith('www.')) {
    ok('www redirect check skipped (BASE is already www)')
    return
  }

  const apexHost   = parsed.hostname
  const wwwHost    = `www.${apexHost}`
  const wwwUrl     = `${parsed.protocol}//${wwwHost}/dashboard`
  const apexTarget = `${BASE}/dashboard`

  // ── (a) DNS resolution ────────────────────────────────────────────────
  let res
  try {
    res = await get(wwwUrl, { followRedirects: false })
  } catch (err) {
    const kind = classifyDnsError(err)
    if (kind === 'ENOTFOUND' || kind === 'EAI_AGAIN') {
      fail(
        'www DNS resolves',
        `${wwwHost} does not resolve or is not assigned to this Vercel project. ` +
        `Add www as a Vercel domain and DNS CNAME. ` +
        `${FIX_DNS(wwwHost)} (DNS error: ${kind})`,
      )
      return
    }
    fail(
      'www is reachable',
      `Could not reach ${wwwUrl}: ${err.message ?? err}. ` +
      `${FIX_DNS(wwwHost)}`,
    )
    return
  }
  ok(`www DNS resolves (${wwwHost} responded)`)

  // ── (b) Vercel project / domain alignment ─────────────────────────────
  // Vercel returns HTTP 403 with an "DEPLOYMENT_NOT_FOUND" body when the
  // host resolves to *.vercel-dns.com but isn't bound to any project.
  if (res.status === 403) {
    const body = res.text ?? ''
    const looksLikeVercelMismatch =
      /DEPLOYMENT_NOT_FOUND|deployment not found|vercel/i.test(body) ||
      res.headers.get('server') === 'Vercel'
    fail(
      'www is bound to this Vercel project',
      `${wwwUrl} returned HTTP 403. ${
        looksLikeVercelMismatch
          ? `${wwwHost} resolves to Vercel but is not assigned to this project.`
          : `${wwwHost} resolves but is rejected (403).`
      } ${FIX_VERCEL_ALIAS(wwwHost)}`,
    )
    return
  }

  // ── (c) No redirect at all (status 2xx / 4xx other than 403) ──────────
  const isRedirect = res.status >= 300 && res.status < 400
  if (!isRedirect) {
    fail(
      'www returns a 30x redirect',
      `${wwwUrl} returned HTTP ${res.status} — the Next.js redirects() rule did not fire. ` +
      `The most common cause is that ${wwwHost} is not registered as a Vercel project ` +
      `domain so requests never reach the application layer. ` +
      `${FIX_VERCEL_ALIAS(wwwHost)}`,
    )
    return
  }
  ok(`www returns ${res.status} redirect`)

  // ── (d) Wrong redirect target ─────────────────────────────────────────
  const location = res.headers.get('location') ?? ''
  const targetIsApex =
    location === apexTarget ||
    location.startsWith(apexTarget) ||
    location === BASE ||
    location.startsWith(`${BASE}/`)

  if (!targetIsApex) {
    fail(
      'www redirect target is the apex domain',
      `Location header was "${location || '(none)'}" — expected something starting with "${BASE}". ` +
      `${FIX_REDIRECT_RULE(apexHost, wwwHost)}`,
    )
    return
  }
  ok(`www redirect target → ${location}`)
}

// ── Runner ────────────────────────────────────────────────────────────────────

console.log(`\nConstructAIQ production smoke test`)
console.log(`Target: ${BASE}${WWW_ONLY ? '  (--www-only)' : ''}`)
console.log('─'.repeat(50))

if (!WWW_ONLY) {
  section('Pages')
  await checkPage('/', 'GET /')
  await checkPage('/dashboard', 'GET /dashboard')

  section('API')
  await checkApiStatus()
  await checkApiDashboard()
}

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
