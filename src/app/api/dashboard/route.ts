import { NextResponse }                       from 'next/server'
import { supabase, supabaseAdmin, getLatestObs } from '@/lib/supabase'
import { runEnsemble }                          from '@/lib/models/ensemble'
import { computeCshi }                          from '@/lib/cshi'
import type { CshiResult }                      from '@/lib/cshi'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

// ── Seed data — mirrors obs/route.ts SEED_24 ──────────────────────────────────
// Anchored to Jan 2026 (25 months = Jan 2024 – Jan 2026)
function seedDates(n: number): string[] {
  const dates: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    let m = 0 - i, y = 2026
    while (m < 0) { m += 12; y-- }
    dates.push(`${y}-${String(m + 1).padStart(2, '0')}-01`)
  }
  return dates
}

type ObsRow = { obs_date: string; value: number }

function makeSeed(values: number[]): ObsRow[] {
  const dates = seedDates(values.length)
  return values.map((value, i) => ({ obs_date: dates[i], value }))
}

const SEED = {
  TTLCONS: makeSeed([
    2184.6,2174.9,2206.5,2215.4,2199.8,2200.7,2205.3,2197.9,
    2197.1,2192.9,2176.6,2169.6,2165.4,2150.8,2153.4,2149.1,
    2160.7,2168.5,2177.2,2169.5,2167.9,2181.2,2197.6,2190.4,
    2190.4,
  ]),
  CES2000000001: makeSeed([
    8170,8176,8196,8208,8236,8254,8262,8267,8276,8264,8267,8273,
    8271,8269,8267,8261,8239,8255,8243,8279,8272,8317,8304,8330,
    8363,
  ]),
  PERMIT: makeSeed([
    1577,1476,1459,1407,1461,1436,1476,1434,1428,1508,1480,1460,
    1454,1481,1422,1394,1393,1362,1330,1415,1411,1388,1455,1386,
    1376,
  ]),
}

// Full 61-month TTLCONS for ensemble model training
const TTLCONS_60 = [
  1610,1639,1703,1750,1796,1829,1847,1859,1872,1891,1906,1921,
  1938,1952,1969,1985,2001,2018,2035,2049,2062,2078,2091,2101,
  2111,2119,2133,2142,2158,2162,2168,2171,2175,2178,2180,2183,
  2184.6,2174.9,2206.5,2215.4,2199.8,2200.7,2205.3,2197.9,
  2197.1,2192.9,2176.6,2169.6,2165.4,2150.8,2153.4,2149.1,
  2160.7,2168.5,2177.2,2169.5,2167.9,2181.2,2197.6,2190.4,
  2190.4,
]


// ── Helper ────────────────────────────────────────────────────────────────────
async function tryQuery<T>(p: Promise<T>): Promise<T | null> {
  try { return await p } catch { return null }
}

// ── GET /api/dashboard ────────────────────────────────────────────────────────
export async function GET() {
  const now = Date.now()

  const [
    ttl12raw, emp12raw, permit12raw, ttl24raw, wps24raw,
    forecastRows, signalRows, briefRow, cshiData,
  ] = await Promise.all([
    tryQuery(getLatestObs('TTLCONS',       12)),
    tryQuery(getLatestObs('CES2000000001', 12)),
    tryQuery(getLatestObs('PERMIT',        12)),
    tryQuery(getLatestObs('TTLCONS',       24)),
    tryQuery(getLatestObs('WPS081',        24)),
    // Cached ensemble forecast for TTLCONS — within last 4 hours
    tryQuery((async () => {
      const r = await supabase
        .from('forecasts')
        .select('base_value,lo80,hi80,lo95,hi95,mape,accuracy,run_date,horizon_steps')
        .eq('series_id', 'TTLCONS')
        .eq('model', 'ensemble')
        .gte('run_date', new Date(now - 4 * 3600_000).toISOString().slice(0, 10))
        .order('run_date',      { ascending: false })
        .order('horizon_steps', { ascending: true  })
        .limit(12)
      return r.data ?? []
    })()),
    // Active signals from DB
    tryQuery((async () => {
      const r = await supabase
        .from('signals')
        .select('type,series_id,title,description,confidence,method,value_at_signal,threshold,is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10)
      return r.data ?? []
    })()),
    // Latest brief from DB (no generation — stays within time budget)
    tryQuery((async () => {
      const r = await supabaseAdmin
        .from('weekly_briefs')
        .select('brief_text,generated_at')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()
      return r.data
    })()),
    // CSHI composite score — null on failure; dashboard degrades gracefully
    (async (): Promise<CshiResult | null> => {
      try { return await computeCshi() } catch { return null }
    })(),
  ])

  // ── Obs arrays with seed fallback ─────────────────────────────────────────
  const ttl12   = (ttl12raw?.length   ? ttl12raw   : SEED.TTLCONS.slice(-12))  as ObsRow[]
  const emp12   = (emp12raw?.length   ? emp12raw   : SEED.CES2000000001.slice(-12)) as ObsRow[]
  const permit12 = (permit12raw?.length ? permit12raw : SEED.PERMIT.slice(-12)) as ObsRow[]
  const ttl24   = (ttl24raw?.length   ? ttl24raw   : SEED.TTLCONS)             as ObsRow[]
  const wps24   = (wps24raw           ?? [])                                    as ObsRow[]

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const spendVal  = ttl12.at(-1)?.value   ?? null
  const prevSpend = ttl12.at(-2)?.value   ?? null
  const spendMom  = spendVal != null && prevSpend && prevSpend > 0
    ? ((spendVal - prevSpend) / prevSpend) * 100 : null

  const empVal  = emp12.at(-1)?.value  ?? null
  const prevEmp = emp12.at(-2)?.value  ?? null
  const empMom  = empVal != null && prevEmp && prevEmp > 0
    ? ((empVal - prevEmp) / prevEmp) * 100 : null

  const permitVal  = permit12.at(-1)?.value  ?? null
  const prevPermit = permit12.at(-2)?.value  ?? null
  const permitMom  = permitVal != null && prevPermit && prevPermit > 0
    ? ((permitVal - prevPermit) / prevPermit) * 100 : null

  // ── Forecast — cached or freshly computed ──────────────────────────────────
  type ForecastRow = { base_value: number; lo80: number; hi80: number; lo95: number; hi95: number; mape?: number; accuracy?: number; run_date: string }
  const rows = (forecastRows ?? []) as ForecastRow[]
  let forecast: {
    ensemble:  { base: number; lo80: number; hi80: number; lo95: number; hi95: number }[]
    models:    { model: string; weight: number; mape: number; accuracy: number }[]
    metrics:   { accuracy: number; mape: number; models: number }
    history:   number[]
    run_at:    string
    trained_on: number
  } | null = null

  if (rows.length > 0) {
    forecast = {
      ensemble:   rows.map(r => ({ base: r.base_value, lo80: r.lo80, hi80: r.hi80, lo95: r.lo95, hi95: r.hi95 })),
      models:     [],
      metrics:    { accuracy: rows[0]?.accuracy ?? null, mape: rows[0]?.mape ?? null, models: 3 },
      history:    ttl12.map(r => r.value),
      run_at:     rows[0]?.run_date ? `${rows[0].run_date}T00:00:00Z` : new Date().toISOString(),
      trained_on: 60,
    }
  } else {
    // No cached forecast — run ensemble on DB obs or seed data
    try {
      const trainVals = ttl24raw?.length
        ? ttl24raw.map((r: ObsRow) => r.value)
        : TTLCONS_60
      const result = runEnsemble(trainVals, 12)
      if (result) {
        forecast = {
          ensemble:   result.ensemble,
          models:     result.models.map(m => ({ model: m.model, weight: m.weight, mape: m.mape, accuracy: m.accuracy })),
          metrics:    { accuracy: result.metrics.accuracy, mape: result.metrics.mape, models: result.models.length },
          history:    ttl12.map(r => r.value),
          run_at:     new Date().toISOString(),
          trained_on: trainVals.length,
        }
      }
    } catch { /* forecast stays null */ }
  }

  // ── Signals ───────────────────────────────────────────────────────────────
  const signals = signalRows ?? []
  // Empty signals array is honest — the dashboard renders an empty state.

  // ── Pricewatch ────────────────────────────────────────────────────────────
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://constructaiq.trade'
  const priceRes = await fetch(`${base}/api/pricewatch`, { cache: 'no-store' })
  const priceData = priceRes.ok ? await priceRes.json() : null
  const commodities = priceData?.items ?? []

  // ── Brief ─────────────────────────────────────────────────────────────────
  const briefText = (briefRow as { brief_text?: string } | null)?.brief_text ?? null
  const briefAt   = (briefRow as { generated_at?: string } | null)?.generated_at ?? null

  return NextResponse.json(
    {
      construction_spending: {
        value:      spendVal,
        mom_change: spendMom  != null ? parseFloat(spendMom.toFixed(2))  : null,
        data_as_of: ttl12.at(-1)?.obs_date ?? null,
        spark:      ttl12.map(r => r.value),
      },
      employment: {
        value:      empVal,
        mom_change: empMom    != null ? parseFloat(empMom.toFixed(2))    : null,
        data_as_of: emp12.at(-1)?.obs_date ?? null,
      },
      permits: {
        value:      permitVal,
        mom_change: permitMom != null ? parseFloat(permitMom.toFixed(2)) : null,
        data_as_of: permit12.at(-1)?.obs_date ?? null,
        spark:      permit12.map(r => r.value),
      },
      cshi:     cshiData ?? null,
      forecast,
      signals,
      commodities,
      brief_excerpt: briefText?.slice(0, 400) ?? null,
      brief_as_of:   briefAt,
      obs: {
        TTLCONS_12:       ttl12.map(r   => ({ date: r.obs_date, value: r.value })),
        CES2000000001_12: emp12.map(r   => ({ date: r.obs_date, value: r.value })),
        PERMIT_12:        permit12.map(r => ({ date: r.obs_date, value: r.value })),
        TTLCONS_24:       ttl24.map(r   => ({ date: r.obs_date, value: r.value })),
        WPS081_24:        wps24.map(r   => ({ date: r.obs_date, value: r.value })),
      },
      fetched_at: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
  )
}
