#!/usr/bin/env node
/**
 * Domain health checker — diagnoses the current state of constructaiq.trade
 * without requiring any Vercel credentials.
 *
 * Usage:  node scripts/check-domain-status.mjs [--json] [--apex <url>] [--www <url>]
 *         npm run domain:check
 *
 * Flags:
 *   --json          Print machine-readable JSON instead of human text
 *   --apex <url>    Override the apex URL to probe (default: https://constructaiq.trade)
 *   --www  <url>    Override the www URL to probe  (default: https://www.constructaiq.trade/dashboard)
 *
 * Exit codes:
 *   0 — apex reachable and www redirects correctly
 *   1 — host_not_allowed (Vercel domain not bound to this project)
 *   2 — other failure
 */

import { fileURLToPath } from 'url'

const TIMEOUT_MS = 15_000
const APEX       = 'https://constructaiq.trade'
const WWW        = 'https://www.constructaiq.trade/dashboard'
const APEX_LABEL = 'apex  (constructaiq.trade)'
const WWW_LABEL  = 'www   (www.constructaiq.trade/dashboard)'

// ── Argument parsing ──────────────────────────────────────────────────────────

export function parseArgs(argv) {
  let json    = false
  let apexUrl = APEX
  let wwwUrl  = WWW

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') {
      json = true
    } else if (argv[i] === '--apex' && argv[i + 1]) {
      apexUrl = argv[++i]
    } else if (argv[i] === '--www' && argv[i + 1]) {
      wwwUrl = argv[++i]
    }
  }

  return { json, apexUrl, wwwUrl }
}

// ── Fetch helper (no redirect follow) ────────────────────────────────────────

async function probe(url) {
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      signal:   ctrl.signal,
      headers:  { 'User-Agent': 'ConstructAIQ-domain-check/1.0' },
    })
    return {
      ok:             true,
      status:         res.status,
      denyReason:     res.headers.get('x-deny-reason')    ?? null,
      location:       res.headers.get('location')          ?? null,
      server:         res.headers.get('server')            ?? null,
      cfCacheStatus:  res.headers.get('cf-cache-status')  ?? null,
      cfRay:          res.headers.get('cf-ray')            ?? null,
      xVercelId:      res.headers.get('x-vercel-id')       ?? null,
    }
  } catch (err) {
    const code = err?.cause?.code ?? err?.code ?? ''
    return {
      ok:    false,
      error: err.message ?? String(err),
      code,
    }
  } finally {
    clearTimeout(timer)
  }
}

// ── Proxy detection ──────────────────────────────────────────────────────────

export function detectProxy(result) {
  if (!result.ok) return false
  if (result.server?.toLowerCase().includes('cloudflare')) return true
  if (result.cfRay        != null) return true
  if (result.cfCacheStatus != null) return true
  return false
}

// ── Classification ────────────────────────────────────────────────────────────

export function classifyApex(result) {
  if (!result.ok) {
    const { code } = result
    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return 'DNS_MISSING'
    return 'UNKNOWN_FAILURE'
  }
  if (result.denyReason?.includes('host_not_allowed')) return 'VERCEL_DOMAIN_NOT_BOUND'
  const isRedirect = result.status >= 300 && result.status < 400
  if (isRedirect && result.location?.startsWith('https://www.constructaiq.trade')) {
    return 'APEX_REDIRECTS_TO_WWW'
  }
  if (result.status === 200 || result.status === 308 || result.status === 301) return 'APEX_OK'
  return 'UNKNOWN_FAILURE'
}

export function classifyWww(result) {
  if (!result.ok) {
    const { code } = result
    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return 'DNS_MISSING'
    return 'UNKNOWN_FAILURE'
  }
  if (result.denyReason?.includes('host_not_allowed')) return 'VERCEL_DOMAIN_NOT_BOUND'

  const isRedirect = result.status >= 300 && result.status < 400
  if (!isRedirect) return 'UNKNOWN_FAILURE'

  const loc = result.location ?? ''
  if (loc.startsWith(APEX) || loc.startsWith('https://constructaiq.trade')) {
    return 'WWW_REDIRECT_OK'
  }
  return 'WWW_REDIRECT_WRONG_TARGET'
}

// ── JSON output builder ───────────────────────────────────────────────────────

export function buildJsonOutput({ apexUrl, apexResult, apexClass, wwwUrl, wwwResult, wwwClass }) {
  const apexOk = apexClass === 'APEX_OK'
  const wwwOk  = wwwClass  === 'WWW_REDIRECT_OK'

  const hostNotAllowed =
    apexResult.denyReason?.includes('host_not_allowed') ||
    wwwResult.denyReason?.includes('host_not_allowed')

  const exitCode = (apexOk && wwwOk) ? 0 : hostNotAllowed ? 1 : 2

  const apexProxy = detectProxy(apexResult)
  const wwwProxy  = detectProxy(wwwResult)

  return {
    apex: {
      url:            apexUrl,
      status:         apexResult.ok ? apexResult.status : null,
      denyReason:     apexResult.denyReason    ?? null,
      location:       apexResult.location      ?? null,
      server:         apexResult.server        ?? null,
      cfCacheStatus:  apexResult.cfCacheStatus ?? null,
      cfRay:          apexResult.cfRay         ?? null,
      xVercelId:      apexResult.xVercelId     ?? null,
      classification: apexClass,
      proxyWarning:   apexProxy,
    },
    www: {
      url:            wwwUrl,
      status:         wwwResult.ok ? wwwResult.status : null,
      denyReason:     wwwResult.denyReason    ?? null,
      location:       wwwResult.location      ?? null,
      server:         wwwResult.server        ?? null,
      cfCacheStatus:  wwwResult.cfCacheStatus ?? null,
      cfRay:          wwwResult.cfRay         ?? null,
      xVercelId:      wwwResult.xVercelId     ?? null,
      classification: wwwClass,
      proxyWarning:   wwwProxy,
    },
    ok:           apexOk && wwwOk,
    proxyWarning: apexProxy || wwwProxy,
    exitCode,
  }
}

// ── Diagnosis messages ────────────────────────────────────────────────────────

const DIAGNOSIS = {
  DNS_MISSING:
    'DNS record not found. Add an A/CNAME record at your DNS provider ' +
    'pointing to Vercel, then add the domain in Vercel → Settings → Domains.',
  VERCEL_DOMAIN_NOT_BOUND:
    'Vercel domain not bound to this project. ' +
    'Go to Vercel dashboard → ConstructAIQ → Settings → Domains → Add the domain.',
  APEX_REDIRECTS_TO_WWW:
    'Apex redirects to www, but this repo expects apex canonical. ' +
    'Remove the Vercel-level apex-to-www redirect. ' +
    'See docs/CANONICAL_DOMAIN_DECISION.md.',
  WWW_REDIRECT_OK:
    'www redirects correctly to the apex domain.',
  WWW_REDIRECT_WRONG_TARGET:
    'www redirects, but to the wrong target. ' +
    'Check the redirects() rule in next.config.ts.',
  APEX_OK:
    'Apex domain is reachable.',
  UNKNOWN_FAILURE:
    'Unexpected response. Check the status and headers above for details.',
}

// ── Print helper ──────────────────────────────────────────────────────────────

function printResult(label, result, classification) {
  console.log(`\n  ${label}`)
  console.log(`  ${'─'.repeat(50)}`)

  if (!result.ok) {
    console.log(`  status          : (no response — ${result.code || 'network error'})`)
    console.log(`  error           : ${result.error}`)
  } else {
    console.log(`  status          : ${result.status}`)
    if (result.denyReason)    console.log(`  x-deny-reason   : ${result.denyReason}`)
    if (result.location)      console.log(`  location        : ${result.location}`)
    if (result.server)        console.log(`  server          : ${result.server}`)
    if (result.cfCacheStatus) console.log(`  cf-cache-status : ${result.cfCacheStatus}`)
    if (result.cfRay)         console.log(`  cf-ray          : ${result.cfRay}`)
    if (result.xVercelId)     console.log(`  x-vercel-id     : ${result.xVercelId}`)
  }

  console.log(`  classification  : ${classification}`)
  console.log(`  diagnosis       : ${DIAGNOSIS[classification]}`)

  if (detectProxy(result)) {
    console.log(`  ⚠  proxy warning: possible DNS provider proxy detected; Vercel recommends DNS-only for this domain`)
  }
}

// ── Main (CLI only) ───────────────────────────────────────────────────────────

async function main() {
  const { json, apexUrl, wwwUrl } = parseArgs(process.argv.slice(2))

  if (!json) {
    console.log('\nConstructAIQ — domain status check')
    console.log('═'.repeat(54))
  }

  const [apexResult, wwwResult] = await Promise.all([
    probe(apexUrl),
    probe(wwwUrl),
  ])

  const apexClass = classifyApex(apexResult)
  const wwwClass  = classifyWww(wwwResult)

  const output = buildJsonOutput({ apexUrl, apexResult, apexClass, wwwUrl, wwwResult, wwwClass })

  if (json) {
    console.log(JSON.stringify(output, null, 2))
    process.exit(output.exitCode)
  }

  const apexLabel = apexUrl === APEX ? APEX_LABEL : `apex  (${apexUrl})`
  const wwwLabel  = wwwUrl  === WWW  ? WWW_LABEL  : `www   (${wwwUrl})`

  printResult(apexLabel, apexResult, apexClass)
  printResult(wwwLabel,  wwwResult,  wwwClass)

  console.log('\n' + '═'.repeat(54))

  if (output.ok) {
    console.log('\n  ✓ All good — apex reachable, www redirects correctly.')
  } else if (apexResult.denyReason?.includes('host_not_allowed') || wwwResult.denyReason?.includes('host_not_allowed')) {
    console.log('\n  ✗ host_not_allowed — Vercel domain not bound to this project.')
  } else {
    const issues = []
    if (apexClass !== 'APEX_OK')          issues.push(`apex: ${apexClass}`)
    if (wwwClass  !== 'WWW_REDIRECT_OK')  issues.push(`www: ${wwwClass}`)
    console.log(`\n  ✗ Domain issues detected: ${issues.join(', ')}`)
  }

  if (output.proxyWarning) {
    console.log('  ⚠  proxy warning: possible DNS provider proxy detected; Vercel recommends DNS-only for this domain')
  }

  console.log('')

  process.exit(output.exitCode)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('Unexpected error:', err)
    process.exit(2)
  })
}
