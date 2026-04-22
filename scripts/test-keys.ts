#!/usr/bin/env tsx
/**
 * ConstructAIQ — Direct API Key Test
 * Calls each external API directly (no app server needed).
 * Usage: npx tsx scripts/test-keys.ts
 * Keys loaded from .env.local automatically.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ── Load .env.local ────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const k = trimmed.slice(0, eq).trim()
    const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}

const T = 10_000
type Status = 'PASS' | 'FAIL' | 'SKIP'
interface Result { name: string; status: Status; ms: number; detail: string }

async function test(
  name: string,
  keyEnv: string,
  run: (key: string) => Promise<string>,
): Promise<Result> {
  const key = process.env[keyEnv]
  if (!key || key.includes('your_') || key.includes('...')) {
    return { name, status: 'SKIP', ms: 0, detail: `${keyEnv} not set` }
  }
  const t = Date.now()
  try {
    const detail = await run(key)
    return { name, status: 'PASS', ms: Date.now() - t, detail }
  } catch (e) {
    return { name, status: 'FAIL', ms: Date.now() - t, detail: String(e) }
  }
}

async function fetchOk(url: string, opts?: RequestInit): Promise<Response> {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(T) })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return res
}

// ── Tests ──────────────────────────────────────────────────────
async function main() {
  console.log('\n🔑  ConstructAIQ — Direct API Key Test')
  console.log(`    ${new Date().toISOString()}\n`)
  console.log('─'.repeat(72))

  const results = await Promise.all([

    // Supabase — anon key
    test('Supabase (anon)', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', async (key) => {
      const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
      const res  = await fetchOk(`${url}/rest/v1/observations?select=count`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
      })
      const count = res.headers.get('content-range') ?? 'connected'
      return `Connected · rows: ${count}`
    }),

    // Supabase — service role
    test('Supabase (service role)', 'SUPABASE_SERVICE_ROLE_KEY', async (key) => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
      const res = await fetchOk(`${url}/rest/v1/observations?select=count&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
      })
      const count = res.headers.get('content-range') ?? 'connected'
      return `Service role connected · rows: ${count}`
    }),

    // FRED
    test('FRED (St. Louis Fed)', 'FRED_API_KEY', async (key) => {
      const res  = await fetchOk(
        `https://api.stlouisfed.org/fred/series?series_id=TTLCONS&api_key=${key}&file_type=json`
      )
      const data = await res.json() as { seriess?: { title: string }[] }
      return `Series: ${data.seriess?.[0]?.title ?? 'OK'}`
    }),

    // BLS
    test('BLS (Bureau of Labor Statistics)', 'BLS_API_KEY', async (key) => {
      const res  = await fetchOk('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ seriesid: ['CES2000000001'], startyear: '2024', endyear: '2025', registrationkey: key }),
      })
      const data = await res.json() as { status?: string; Results?: { series?: { data?: unknown[] }[] } }
      if (data.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS status: ${data.status}`)
      const pts = data.Results?.series?.[0]?.data?.length ?? 0
      return `${pts} data points returned`
    }),

    // BEA
    test('BEA (Bureau of Economic Analysis)', 'BEA_API_KEY', async (key) => {
      const res  = await fetchOk(
        `https://apps.bea.gov/api/data?UserID=${key}&method=GetDataSetList&ResultFormat=JSON`
      )
      const data = await res.json() as { BEAAPI?: { Results?: { Dataset?: unknown[] } } }
      const sets = data.BEAAPI?.Results?.Dataset?.length ?? 0
      return `${sets} datasets available`
    }),

    // EIA
    test('EIA (Energy Information Admin)', 'EIA_API_KEY', async (key) => {
      const res  = await fetchOk(
        `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${key}&frequency=weekly&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=1`
      )
      const data = await res.json() as { response?: { data?: unknown[] } }
      const pts  = data.response?.data?.length ?? 0
      return `${pts} record returned`
    }),

    // Census
    test('Census Bureau', 'CENSUS_API_KEY', async (key) => {
      const res  = await fetchOk(
        `https://api.census.gov/data/2023/acs/acs1?get=NAME&for=state:06&key=${key}`
      )
      const data = await res.json() as unknown[][]
      return `${data.length - 1} record returned`
    }),

    // Anthropic
    test('Anthropic (Claude AI)', 'ANTHROPIC_API_KEY', async (key) => {
      const res  = await fetchOk('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: {
          'x-api-key':         key,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json',
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 16,
          messages:   [{ role: 'user', content: 'Reply with OK only.' }],
        }),
      })
      const data = await res.json() as { content?: { text: string }[] }
      return `Model responded: "${data.content?.[0]?.text?.trim() ?? ''}"`
    }),

  ])

  const pass = results.filter(r => r.status === 'PASS').length
  const fail = results.filter(r => r.status === 'FAIL').length
  const skip = results.filter(r => r.status === 'SKIP').length

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'SKIP' ? '⬜' : '❌'
    const ms   = r.ms > 0 ? `${r.ms}ms`.padStart(7) : '      —'
    console.log(`${icon}  ${r.name.padEnd(36)} ${ms}   ${r.detail}`)
  }

  console.log('─'.repeat(72))
  console.log(`\n    PASS: ${pass}  |  FAIL: ${fail}  |  SKIP: ${skip}  |  TOTAL: ${results.length}`)
  if (skip > 0)  console.log(`\n    ⬜  SKIP = key not found in .env.local`)
  if (fail > 0)  console.log(`\n    ❌  FAIL = key present but rejected or network error`)
  if (fail === 0 && skip === 0) console.log('\n    All keys verified. ✓')
  console.log()

  process.exit(fail > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
