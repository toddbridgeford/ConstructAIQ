import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { classifyScore, classifyConfidence } from '@/lib/verdict'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface MarketVerdict {
  overall:    'EXPAND' | 'HOLD' | 'CONTRACT'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  headline:   string
  supporting: string[]
  as_of:      string
}

// ── Internal data fetch helpers ─────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8_000) })
    return r.ok ? (r.json() as Promise<T>) : null
  } catch { return null }
}

type ObsRow = { obs_date: string; value: number }

async function getObs(seriesId: string, n: number): Promise<ObsRow[]> {
  try {
    const { data } = await supabase
      .from('observations')
      .select('obs_date, value')
      .eq('series_id', seriesId)
      .order('obs_date', { ascending: false })
      .limit(n)
    return data ? [...data].reverse() : []
  } catch { return [] }
}

// ── Seed fallbacks (mirrors obs/route.ts) ────────────────────────────────────

const PERMIT_SEED = [1577,1476,1459,1407,1461,1436,1476,1434,1428,1508,1480,1460,
                     1454,1481,1422,1394,1393,1362,1330,1415,1411,1388,1455,1386]
const TTLCONS_SEED = [2184.6,2174.9,2206.5,2215.4,2199.8,2200.7,2205.3,2197.9,2197.1,
                      2192.9,2176.6,2169.6,2165.4,2150.8,2153.4,2149.1,2160.7,2168.5,
                      2177.2,2169.5,2167.9,2181.2,2197.6,2190.4]

// ── Headline templates ───────────────────────────────────────────────────────

function buildHeadline(
  overall: 'EXPAND' | 'HOLD' | 'CONTRACT',
  cshiScore: number | null,
  forecastPct: number | null,
  warnCount: number,
): string {
  if (overall === 'EXPAND') {
    if (forecastPct !== null && forecastPct > 3)
      return `Construction fundamentals support aggressive bidding — forecast shows ${forecastPct.toFixed(1)}% growth and key indicators are aligned.`
    if (cshiScore !== null && cshiScore > 70)
      return `Construction fundamentals support aggressive bidding — permits, employment, and satellite signals are aligned.`
    return `Market signals are broadly positive. Conditions support measured expansion of capacity and bidding.`
  }
  if (overall === 'CONTRACT') {
    if (warnCount > 20)
      return `Multiple contraction signals active including elevated WARN Act filings. Protect margins and review backlog concentration.`
    if (forecastPct !== null && forecastPct < -3)
      return `Multiple contraction signals active. Protect margins and review backlog concentration.`
    return `Spending and leading indicators have turned cautious. Reduce new commitments and protect working capital.`
  }
  // HOLD
  if (cshiScore !== null && cshiScore > 55)
    return `Mixed signals. Federal pipeline is strong but permits are softening. Maintain current capacity.`
  return `Market is at an inflection point — hold current commitments while monitoring permit and employment data.`
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { protocol, host } = new URL(request.url)
  const base = `${protocol}//${host}`

  // Fetch all data sources in parallel
  const [cshiData, foreData, satData, warnData, recData, permitObs, spendObs] = await Promise.all([
    fetchJson<{ score: number; weeklyChange?: number }>(
      `${base}/api/cshi`
    ),
    fetchJson<{ ensemble?: { base: number }[]; history?: number[]; metrics?: { accuracy: number; mape: number } }>(
      `${base}/api/forecast?series=TTLCONS`
    ),
    fetchJson<{ msas?: { classification: string; msa_name: string; bsi_mean: number | null }[]; processing_status?: string }>(
      `${base}/api/satellite`
    ),
    fetchJson<{ total_count: number; total_employees_affected: number }>(
      `${base}/api/warn`
    ),
    fetchJson<{ probability: number; probability_pct: number }>(
      `${base}/api/recession-probability`
    ),
    getObs('PERMIT',  14),
    getObs('TTLCONS', 14),
  ])

  // ── Scoring ───────────────────────────────────────────────────────────────

  let score = 0
  let directional = 0  // count of non-neutral signals for confidence
  const bullets: string[] = []

  // 1. Forecast direction (+2/-2/0)
  let forecastPct: number | null = null
  {
    const hist = foreData?.history ?? TTLCONS_SEED
    const ens  = foreData?.ensemble ?? []
    const lastHist = hist[hist.length - 1] ?? null
    const lastFcst = ens.length > 0 ? ens[ens.length - 1]?.base : null

    if (lastHist && lastFcst) {
      forecastPct = ((lastFcst - lastHist) / lastHist) * 100
      if (forecastPct > 2) {
        score += 2; directional++
        bullets.push(`12-month forecast is +${forecastPct.toFixed(1)}% above current spending.`)
      } else if (forecastPct < -2) {
        score -= 2; directional++
        bullets.push(`12-month forecast is ${forecastPct.toFixed(1)}% below current spending — headwinds ahead.`)
      } else {
        bullets.push(`12-month forecast is flat (${forecastPct > 0 ? '+' : ''}${forecastPct.toFixed(1)}%) — no major directional shift expected.`)
      }
    }
  }

  // 2. Permits YoY (+1/-1/0)
  {
    const rows = permitObs.length >= 13 ? permitObs : PERMIT_SEED.slice(-14).map((v, i) => ({ obs_date: '', value: v }))
    const latest = rows[rows.length - 1]?.value ?? null
    const lyVal  = rows.length >= 13 ? rows[rows.length - 13]?.value ?? null : null

    if (latest !== null && lyVal !== null && lyVal > 0) {
      const yoy = ((latest - lyVal) / lyVal) * 100
      if (yoy > 1) {
        score += 1; directional++
        bullets.push(`Building permits up ${yoy.toFixed(1)}% year-over-year — pipeline is expanding.`)
      } else if (yoy < -1) {
        score -= 1; directional++
        bullets.push(`Building permits down ${Math.abs(yoy).toFixed(1)}% year-over-year — pipeline is contracting.`)
      } else {
        bullets.push(`Building permits are flat year-over-year (${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}%).`)
      }
    }
  }

  // 3. CSHI/LICS (+2/-2/0)
  const cshiScore = cshiData?.score ?? null
  {
    if (cshiScore !== null) {
      if (cshiScore > 60) {
        score += 2; directional++
        bullets.push(`CSHI is ${cshiScore.toFixed(0)} — market health is in the positive zone.`)
      } else if (cshiScore < 40) {
        score -= 2; directional++
        bullets.push(`CSHI is ${cshiScore.toFixed(0)} — market health is in the negative zone.`)
      }
    }
  }

  // 4. WARN Act filings (+1/-1/0)
  const warnCount = warnData?.total_count ?? 0
  {
    if (warnCount > 20) {
      score -= 1; directional++
      bullets.push(`${warnCount} construction WARN Act notices in the last 30 days — above historical average.`)
    } else if (warnCount < 5 && warnData !== null) {
      score += 1; directional++
      bullets.push(`Only ${warnCount} construction WARN Act notices in the last 30 days — labor market is stable.`)
    }
  }

  // 5. Satellite signal (+1/-1/0)
  {
    const msas = satData?.msas ?? []
    if (msas.length > 0) {
      const active   = msas.filter(m => m.classification !== 'LOW_ACTIVITY').length
      const demand   = msas.filter(m => m.classification === 'DEMAND_DRIVEN').length
      const lowAct   = msas.filter(m => m.classification === 'LOW_ACTIVITY').length
      if (demand > 3) {
        score += 1; directional++
        bullets.push(`${demand} of ${msas.length} tracked markets show demand-driven ground activity.`)
      } else if (lowAct > 3) {
        score -= 1; directional++
        bullets.push(`${lowAct} of ${msas.length} tracked markets show low satellite activity.`)
      } else if (active > 0) {
        bullets.push(`${active} of ${msas.length} tracked markets show active construction activity.`)
      }
    }
  }

  // 6. Recession probability (+1/-2/0)
  {
    const rp = recData?.probability ?? null
    if (rp !== null) {
      if (rp > 0.40) {
        score -= 2; directional++
        bullets.push(`Recession probability is ${(rp * 100).toFixed(0)}% — elevated risk of demand shock.`)
      } else if (rp < 0.20) {
        score += 1; directional++
        bullets.push(`Recession probability is ${(rp * 100).toFixed(0)}% — macro backdrop is supportive.`)
      }
    }
  }

  // ── Classification ────────────────────────────────────────────────────────

  const overall     = classifyScore(score)
  const confidence  = classifyConfidence(directional)

  const headline   = buildHeadline(overall, cshiScore, forecastPct, warnCount)
  const supporting = bullets.slice(0, 3)

  return NextResponse.json(
    {
      overall,
      confidence,
      headline,
      supporting,
      as_of: new Date().toISOString(),
    } satisfies MarketVerdict,
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  )
}
