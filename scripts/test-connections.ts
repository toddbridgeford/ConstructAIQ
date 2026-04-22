#!/usr/bin/env tsx
/**
 * ConstructAIQ — Live API Connection Test
 * Tests all external service connections via the deployed endpoints.
 * Run: npx tsx scripts/test-connections.ts [base_url]
 */

const BASE = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || 'https://constructaiq.trade'
const TIMEOUT = 12_000

type Status = 'PASS' | 'FAIL' | 'WARN'

interface TestResult {
  name:     string
  status:   Status
  latencyMs: number
  detail:   string
}

async function probe(
  name: string,
  path: string,
  validate?: (body: Record<string, unknown>) => string | null,
): Promise<TestResult> {
  const t = Date.now()
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { 'Accept': 'application/json' },
    })
    const ms = Date.now() - t

    if (!res.ok) {
      return { name, status: 'FAIL', latencyMs: ms, detail: `HTTP ${res.status}` }
    }

    const body = await res.json() as Record<string, unknown>
    const warn = validate?.(body)
    return {
      name,
      status:    warn ? 'WARN' : 'PASS',
      latencyMs: ms,
      detail:    warn ?? `HTTP 200 · ${ms}ms`,
    }
  } catch (e) {
    return { name, status: 'FAIL', latencyMs: Date.now() - t, detail: String(e) }
  }
}

// ── Individual service validators ──────────────────────────────

function checkLive(field: string) {
  return (b: Record<string, unknown>) =>
    b[field] === true ? null : `live=false — using synthetic fallback`
}

function checkStatus(b: Record<string, unknown>) {
  const services = b.services as { name: string; status: string }[] | undefined
  if (!services) return 'No services array in response'
  const down = services.filter(s => s.status === 'down')
  if (down.length) return `Services down: ${down.map(s => s.name).join(', ')}`
  return null
}

function checkAI(b: Record<string, unknown>) {
  if (!b.brief && !b.narrative && !b.summary) return 'No AI content in response'
  return null
}

function checkFusion(b: Record<string, unknown>) {
  if (typeof b.score !== 'number') return 'No composite score in response'
  const q = b.dataQuality as { live: number; total: number } | undefined
  if (q && q.live < 3) return `Only ${q.live}/${q.total} data sources live`
  return null
}

// ── Test suite ─────────────────────────────────────────────────

async function main() {
  console.log(`\n🔌  ConstructAIQ Connection Test`)
  console.log(`    Target: ${BASE}`)
  console.log(`    ${new Date().toISOString()}\n`)
  console.log('─'.repeat(72))

  const tests: Promise<TestResult>[] = [
    // Infrastructure
    probe('Supabase + Status',    '/api/status',             checkStatus),

    // Federal data APIs
    probe('FRED',                 '/api/fred',               checkLive('live')),
    probe('BLS / Employment',     '/api/bls',                checkLive('live')),
    probe('Census / Housing',     '/api/census',             checkLive('live')),
    probe('BEA',                  '/api/bea',                checkLive('live')),
    probe('EIA',                  '/api/eia',                checkLive('live')),

    // Derived / model endpoints
    probe('Rates',                '/api/rates',              checkLive('live')),
    probe('FHFA / Home Prices',   '/api/fhfa',               checkLive('live')),
    probe('Housing Dashboard',    '/api/housing',            checkLive('live')),
    probe('PPI Materials',        '/api/ppi',                checkLive('live')),
    probe('JOLTS Labor',          '/api/jolts',              checkLive('live')),
    probe('Signals',              '/api/signals',            (b) => {
      const sigs = b.signals as unknown[]
      return sigs?.length ? null : 'No signals generated'
    }),

    // Intelligence
    probe('Forecast Engine',      '/api/forecast?series=TTLCONS&periods=6', (b) => {
      if (!b.ensemble) return 'No ensemble forecast in response'
      return null
    }),
    probe('Fusion Score',         '/api/fusion',             checkFusion),
    probe('AI Brief',             '/api/ai/brief',           checkAI),

    // Market data
    probe('Contracts',            '/api/contracts',          undefined),
    probe('Price Watch',          '/api/pricewatch',         undefined),
    probe('Map Data',             '/api/map',                undefined),
    probe('News',                 '/api/news',               undefined),
    probe('EDGAR / SEC',          '/api/edgar',              undefined),
    probe('Seismic',              '/api/seismic',            undefined),
    probe('Weather',              '/api/weather',            undefined),
  ]

  const results = await Promise.all(tests)

  const pass = results.filter(r => r.status === 'PASS').length
  const warn = results.filter(r => r.status === 'WARN').length
  const fail = results.filter(r => r.status === 'FAIL').length

  for (const r of results) {
    const icon  = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️ ' : '❌'
    const ms    = r.latencyMs > 0 ? `${r.latencyMs}ms`.padStart(7) : '      —'
    const name  = r.name.padEnd(24)
    console.log(`${icon}  ${name} ${ms}   ${r.detail}`)
  }

  console.log('─'.repeat(72))
  console.log(`\n    PASS: ${pass}  |  WARN: ${warn}  |  FAIL: ${fail}  |  TOTAL: ${results.length}`)

  if (fail > 0) {
    console.log('\n    FAILED endpoints need key/configuration check.')
  }
  if (warn > 0) {
    console.log('\n    WARN = endpoint responded but returned synthetic data (key may be missing or rate-limited).')
  }
  if (fail === 0 && warn === 0) {
    console.log('\n    All systems operational. ✓')
  }
  console.log()

  process.exit(fail > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
