import { NextResponse } from 'next/server'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  category: 'capacity' | 'bidding' | 'materials' | 'risk' | 'opportunity'
  title:     string
  rationale: string
  action:    string
}

// ── Priority sort weight ─────────────────────────────────────
export const PRIORITY_WEIGHT = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const

// ── Role rule sets ───────────────────────────────────────────
// Each rule: a test function over signal data + the rec to emit

export interface Signals {
  verdict:            string
  lics:               number
  recessionProb:      number
  warnCount30d:       number
  warnTrend:          'RISING' | 'FALLING' | 'FLAT'
  lumberPctile:       number
  steelPctile:        number
  demandDrivenMsas:   number
  federalYoy:         number
  mortgageRate:       number
}

type RuleSet = Array<{
  test: (s: Signals) => boolean
  rec:  (s: Signals) => Recommendation
}>

export const CONTRACTOR_RULES: RuleSet = [
  {
    test: s => s.verdict === 'EXPAND' && s.lics > 60,
    rec:  _s => ({
      priority: 'HIGH',
      category: 'capacity',
      title:    'Consider hiring ahead of demand',
      rationale:
        'Leading indicators signal 6-month expansion. ' +
        'Labor gets tighter 2–3 months before starts peak.',
      action:
        'Review subcontractor capacity and extend ' +
        'relationships before the peak season.',
    }),
  },
  {
    test: s => s.verdict === 'EXPAND' && s.lics > 55,
    rec:  _s => ({
      priority: 'HIGH',
      category: 'bidding',
      title:    'Opportunity to tighten bid margins',
      rationale:
        'Expanding market with strong leading indicators — ' +
        'demand exceeds current supply in most tracked markets.',
      action:
        'Review recent bids: if win rate is above 40%, ' +
        'test 3–5% margin expansion on next 3 submissions.',
    }),
  },
  {
    test: s => s.warnTrend === 'RISING' && s.verdict === 'HOLD',
    rec:  _s => ({
      priority: 'MEDIUM',
      category: 'risk',
      title:    'Monitor backlog concentration',
      rationale:
        'WARN Act filings rising while market holds — ' +
        'could signal a segment-specific slowdown.',
      action:
        'Review project pipeline by sector and geography. ' +
        'Ensure no single client exceeds 30% of backlog.',
    }),
  },
  {
    test: s => s.lumberPctile > 80,
    rec:  _s => ({
      priority: 'HIGH',
      category: 'materials',
      title:    'Lock lumber prices now if possible',
      rationale:
        'Lumber is at its 80th+ historical percentile. ' +
        'Near-term price risk is elevated.',
      action:
        'Discuss fixed-price lumber agreements with suppliers ' +
        'for Q3/Q4 projects before further increases.',
    }),
  },
  {
    test: s => s.steelPctile > 75,
    rec:  _s => ({
      priority: 'MEDIUM',
      category: 'materials',
      title:    'Review steel exposure on active bids',
      rationale:
        'Steel PPI in the upper quartile of its 5-year range. ' +
        'Cost escalation risk on commercial and industrial bids.',
      action:
        'Add a materials escalation clause to bids over $1M ' +
        'with durations beyond 6 months.',
    }),
  },
  {
    test: s => s.verdict === 'CONTRACT',
    rec:  _s => ({
      priority: 'HIGH',
      category: 'risk',
      title:    'Protect margins — contraction signals active',
      rationale:
        'Multiple contraction signals across forecast, ' +
        'permits, and leading indicators.',
      action:
        'Pause speculative capacity additions. ' +
        'Review pipeline for projects dependent on ' +
        'single-sector demand.',
    }),
  },
  {
    test: s => s.recessionProb > 30,
    rec:  s => ({
      priority: 'MEDIUM',
      category: 'risk',
      title:    `Recession probability at ${s.recessionProb}% — review cash position`,
      rationale:
        'Construction-specific recession model is elevated. ' +
        'Historical lag is 12–18 months to starts decline.',
      action:
        'Ensure 90+ days of operating liquidity. ' +
        'Review payment terms on new contracts.',
    }),
  },
]

export const LENDER_RULES: RuleSet = [
  {
    test: s => s.recessionProb > 35,
    rec:  s => ({
      priority: 'HIGH',
      category: 'risk',
      title:    'Tighten LTV on speculative projects',
      rationale:
        `Recession probability at ${s.recessionProb}%. ` +
        'Historical analogs suggest 12–18 month lag to starts decline.',
      action:
        'Flag speculative commercial projects in rising-rate ' +
        'MSAs for additional stress testing.',
    }),
  },
  {
    test: s => s.federalYoy > 10 && s.demandDrivenMsas >= 2,
    rec:  _s => ({
      priority: 'MEDIUM',
      category: 'opportunity',
      title:    'Infrastructure markets offer lower risk',
      rationale:
        'Federal pipeline above trend and satellite signals ' +
        'show ground activity with contractual revenue backing.',
      action:
        'Favor infrastructure-adjacent commercial projects ' +
        'in markets with strong federal pipeline.',
    }),
  },
  {
    test: s => s.mortgageRate > 6.5 && s.verdict !== 'EXPAND',
    rec:  s => ({
      priority: 'HIGH',
      category: 'risk',
      title:    `Rate environment (${s.mortgageRate.toFixed(2)}%) compressing residential demand`,
      rationale:
        'Mortgage rates above 6.5% historically suppress ' +
        'residential starts within 6–9 months.',
      action:
        'Apply conservative stabilization assumptions on ' +
        'residential condo and multifamily pro formas.',
    }),
  },
  {
    test: s => s.verdict === 'EXPAND' && s.lics > 60,
    rec:  _s => ({
      priority: 'MEDIUM',
      category: 'opportunity',
      title:    'Expanding market supports construction lending',
      rationale:
        'Leading indicators and market verdict are aligned. ' +
        'Demand is outpacing current supply in active markets.',
      action:
        'Pipeline review: identify qualified borrowers in ' +
        'top satellite markets for proactive outreach.',
    }),
  },
  {
    test: s => s.warnTrend === 'RISING' && s.warnCount30d > 3,
    rec:  _s => ({
      priority: 'HIGH',
      category: 'risk',
      title:    'Labor stress signals emerging — review guarantor strength',
      rationale:
        'WARN Act construction filings rising. ' +
        'Labor distress precedes financial distress by 30–60 days.',
      action:
        'Run updated liquidity analysis on borrowers with ' +
        'projects in states with recent WARN notices.',
    }),
  },
]

export const SUPPLIER_RULES: RuleSet = [
  {
    test: s => s.demandDrivenMsas >= 3 && s.verdict === 'EXPAND',
    rec:  _s => ({
      priority: 'HIGH',
      category: 'opportunity',
      title:    'Build inventory in active markets',
      rationale:
        'Satellite signals show ground activity surge — ' +
        'demand leads supply orders by 4–8 weeks.',
      action:
        'Increase inventory allocation to top satellite markets. ' +
        'Contact distributors in these metros now.',
    }),
  },
  {
    test: s => s.lics > 55,
    rec:  _s => ({
      priority: 'HIGH',
      category: 'opportunity',
      title:    'Positive 6-month demand signal — position now',
      rationale:
        'Leading indicators above 55 have historically ' +
        'preceded above-trend material demand by one quarter.',
      action:
        'Review production and logistics capacity for ' +
        'Q3/Q4 demand uptick across active markets.',
    }),
  },
  {
    test: s => s.lumberPctile > 70,
    rec:  _s => ({
      priority: 'MEDIUM',
      category: 'bidding',
      title:    'Lumber prices elevated — communicate lead times early',
      rationale:
        'PPI lumber above 70th historical percentile. ' +
        'Contractor clients are under margin pressure.',
      action:
        'Proactively communicate pricing lock windows to ' +
        'key accounts before they start bidding Q3 projects.',
    }),
  },
  {
    test: s => s.verdict === 'CONTRACT',
    rec:  _s => ({
      priority: 'HIGH',
      category: 'risk',
      title:    'Reduce inventory exposure in contracting markets',
      rationale:
        'Market contraction signals active — demand ' +
        'softening typically affects material orders within 60 days.',
      action:
        'Defer discretionary inventory builds. ' +
        'Tighten payment terms on new accounts in slow markets.',
    }),
  },
  {
    test: s => s.federalYoy > 15,
    rec:  _s => ({
      priority: 'MEDIUM',
      category: 'opportunity',
      title:    'Federal pipeline growth driving structural demand',
      rationale:
        'Federal awards up year-over-year above trend. ' +
        'Infrastructure projects are heavy consumers of steel and concrete.',
      action:
        'Ensure you are registered on GSA supplier schedules ' +
        'and visible to federal prime contractors in active states.',
    }),
  },
]

const ROLE_RULES: Record<string, RuleSet> = {
  contractor: CONTRACTOR_RULES,
  lender:     LENDER_RULES,
  supplier:   SUPPLIER_RULES,
}

/** Pure function: run rules against signals, deduplicate by category, return top 3. */
export function runRules(rules: RuleSet, signals: Signals): Recommendation[] {
  const recs = rules
    .filter(r => r.test(signals))
    .map(r => r.rec(signals))

  const byCat = new Map<string, Recommendation>()
  for (const rec of recs) {
    const existing = byCat.get(rec.category)
    if (!existing || PRIORITY_WEIGHT[rec.priority] > PRIORITY_WEIGHT[existing.priority]) {
      byCat.set(rec.category, rec)
    }
  }

  return [...byCat.values()]
    .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority])
    .slice(0, 3)
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

  // ── Parse signals safely ─────────────────────────────────
  const ok = <T>(r: PromiseSettledResult<Response>): T | null => {
    if (r.status !== 'fulfilled' || !r.value.ok) return null
    return null // will be populated below with .json()
  }
  void ok // used for type hint only

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
    recessionProb:    0, // fetched separately if needed
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
