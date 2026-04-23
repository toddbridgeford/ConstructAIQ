import { NextResponse } from 'next/server'
import {
  CONTRACTOR_RULES,
  LENDER_RULES,
  SUPPLIER_RULES,
  runRules,
  type Signals,
  type RuleSet,
} from '@/lib/recommendations'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

const ROLE_RULES: Record<string, RuleSet> = {
  contractor: CONTRACTOR_RULES,
  lender:     LENDER_RULES,
  supplier:   SUPPLIER_RULES,
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role    = (searchParams.get('role') ?? 'contractor')
    .toLowerCase()
  // markets param is accepted but not required —
  // the current scoring is macro/national
  // (per-market filtering is a Phase 2 enhancement)

  const rules = ROLE_RULES[role] ?? CONTRACTOR_RULES

  const base = process.env.NEXT_PUBLIC_APP_URL ??
    'https://constructaiq.trade'

  // ── Parallel signal fetch ────────────────────────────────
  const [verdictRes, licsRes, warnRes,
         lumberRes, steelRes, satRes, mortRes] =
    await Promise.allSettled([
      fetch(`${base}/api/verdict`,               { cache:'no-store' }),
      fetch(`${base}/api/leading-indicators`,    { cache:'no-store' }),
      fetch(`${base}/api/warn`,                  { cache:'no-store' }),
      fetch(`${base}/api/benchmark?series=PPI_LUMBER&value=0`,
        { cache:'no-store' }),
      fetch(`${base}/api/benchmark?series=PPI_STEEL&value=0`,
        { cache:'no-store' }),
      fetch(`${base}/api/satellite`,             { cache:'no-store' }),
      fetch(`${base}/api/obs?series=MORTGAGE30US&limit=2`,
        { cache:'no-store' }),
    ])

  async function json<T>(
    r: PromiseSettledResult<Response>
  ): Promise<T | null> {
    if (r.status !== 'fulfilled' || !r.value.ok) return null
    try { return (await r.value.json()) as T } catch { return null }
  }

  const [verdictData, licsData, warnData,
         lumberData, steelData, satData, mortData] =
    await Promise.all([
      json<{ overall?: string }>(verdictRes),
      json<{ lics?: number }>(licsRes),
      json<{ notices?: Array<{ filed_date?: string }>
              total_count?: number }>(warnRes),
      json<{ percentile?: number }>(lumberRes),
      json<{ percentile?: number }>(steelRes),
      json<{ msas?: Array<{ classification: string }> }>(satRes),
      json<{ observations?: Array<{ value: number }> }>(mortRes),
    ])

  // ── Build signals object ─────────────────────────────────
  const cutoff30 = new Date()
  cutoff30.setDate(cutoff30.getDate() - 30)
  const cutoff60 = new Date()
  cutoff60.setDate(cutoff60.getDate() - 60)

  const notices = warnData?.notices ?? []
  const warn30  = notices.filter(n =>
    !n.filed_date || new Date(n.filed_date) >= cutoff30
  ).length
  const warn60  = notices.filter(n =>
    !n.filed_date || new Date(n.filed_date) >= cutoff60
  ).length - warn30
  const warnTrend: Signals['warnTrend'] =
    warn30 > warn60 + 1 ? 'RISING'
    : warn30 < warn60 - 1 ? 'FALLING'
    : 'FLAT'

  const demandDrivenMsas = (satData?.msas ?? []).filter(
    m => m.classification === 'DEMAND_DRIVEN'
  ).length

  const mortObs = mortData?.observations ?? []
  const mortgageRate = mortObs[0]?.value ?? 6.8

  const signals: Signals = {
    verdict:          verdictData?.overall ?? 'HOLD',
    lics:             licsData?.lics ?? 50,
    recessionProb:    0,
    warnCount30d:     warn30,
    warnTrend,
    lumberPctile:     lumberData?.percentile ?? 50,
    steelPctile:      steelData?.percentile ?? 50,
    demandDrivenMsas,
    federalYoy:       0,
    mortgageRate,
  }

  // ── Run rules ────────────────────────────────────────────
  const top3 = runRules(rules, signals)

  return NextResponse.json({
    role,
    recommendations: top3,
    signals_used: {
      verdict:          signals.verdict,
      lics:             signals.lics,
      warn_30d:         signals.warnCount30d,
      warn_trend:       signals.warnTrend,
      lumber_pctile:    signals.lumberPctile,
      demand_driven_msas: signals.demandDrivenMsas,
    },
    as_of: new Date().toISOString().split('T')[0],
  })
}
