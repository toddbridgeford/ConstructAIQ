import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Colors
const GREEN = '#30d158'
const AMBER = '#f5a623'
const RED   = '#ff453a'

type Trend = 'UP' | 'DOWN' | 'FLAT'
type AlertSeverity = 'WATCH' | 'INFO' | 'ANOMALY'
type CycleKey = 'current' | 'cycle2008' | 'cycle2016' | 'cycle2020'

interface HistoryPoint {
  date: string
  value: number
}

interface PipelineStage {
  id: string
  label: string
  value: number
  unit: string
  mom: number
  trend: Trend
  trendColor: string
  lagToNext: number | null
  history: HistoryPoint[]
}

interface CascadeAlert {
  id: string
  severity: AlertSeverity
  icon: string
  title: string
  message: string
  type: string
  timestamp: string
  seriesId: string
}

interface PredictiveOverlay {
  permitIndex: HistoryPoint[]
  employmentShifted: HistoryPoint[]
  prediction: string
}

interface CyclePoint {
  monthFromPeak: number
  value: number
}

interface CycleComparison {
  current: CyclePoint[]
  cycle2008: CyclePoint[]
  cycle2016: CyclePoint[]
  cycle2020: CyclePoint[]
  currentMonth: number
  description: string
}

// Seeded pseudo-random for deterministic history
function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Generate 24 months of history from May 2024 → April 2026
function monthDates(count: number): string[] {
  const dates: string[] = []
  const start = new Date('2024-05-01')
  for (let i = 0; i < count; i++) {
    const d = new Date(start)
    d.setMonth(d.getMonth() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

// Permits: trended from ~1380 → 1482 K units/yr over 24 months with variance
function generatePermitHistory(): HistoryPoint[] {
  const dates = monthDates(24)
  // Permits lead employment by ~10 weeks (~2-3 months)
  const base = [
    1380, 1392, 1405, 1388, 1414, 1428,
    1410, 1436, 1452, 1438, 1448, 1461,
    1445, 1458, 1466, 1454, 1470, 1478,
    1462, 1474, 1480, 1468, 1476, 1482,
  ]
  return dates.map((date, i) => ({
    date,
    value: base[i] + Math.round((seededRand(i + 10) - 0.5) * 18),
  }))
}

// Starts: lag permits by ~1 month, trended from ~1280 → 1380
function generateStartsHistory(): HistoryPoint[] {
  const dates = monthDates(24)
  const base = [
    1285, 1292, 1302, 1295, 1308, 1318,
    1308, 1322, 1335, 1322, 1330, 1340,
    1330, 1342, 1348, 1340, 1354, 1360,
    1348, 1358, 1365, 1358, 1368, 1380,
  ]
  return dates.map((date, i) => ({
    date,
    value: base[i] + Math.round((seededRand(i + 20) - 0.5) * 16),
  }))
}

// Employment: lag permits by ~2-3 months, trended from ~8100 → 8330 K workers
function generateEmploymentHistory(): HistoryPoint[] {
  const dates = monthDates(24)
  const base = [
    8105, 8118, 8130, 8122, 8140, 8152,
    8148, 8162, 8175, 8168, 8180, 8192,
    8188, 8202, 8210, 8204, 8218, 8228,
    8222, 8238, 8248, 8242, 8286, 8330,
  ]
  return dates.map((date, i) => ({
    date,
    value: base[i] + Math.round((seededRand(i + 30) - 0.5) * 24),
  }))
}

// Spending: $B, trended from ~2050 → 2190
function generateSpendingHistory(): HistoryPoint[] {
  const dates = monthDates(24)
  const base = [
    2052, 2065, 2074, 2068, 2082, 2092,
    2086, 2098, 2108, 2102, 2114, 2122,
    2118, 2128, 2136, 2130, 2142, 2152,
    2148, 2158, 2166, 2162, 2174, 2190,
  ]
  return dates.map((date, i) => ({
    date,
    value: base[i] + Math.round((seededRand(i + 40) - 0.5) * 28),
  }))
}

// GDP impact: % of GDP, trended from 4.5 → 4.8
function generateGdpHistory(): HistoryPoint[] {
  const dates = monthDates(24)
  const base = [
    4.50, 4.52, 4.54, 4.53, 4.56, 4.58,
    4.57, 4.60, 4.62, 4.61, 4.63, 4.65,
    4.64, 4.66, 4.68, 4.67, 4.70, 4.72,
    4.71, 4.73, 4.75, 4.74, 4.77, 4.80,
  ]
  return dates.map((date, i) => ({
    date,
    value: parseFloat((base[i] + (seededRand(i + 50) - 0.5) * 0.04).toFixed(2)),
  }))
}

function trendColor(trend: Trend): string {
  if (trend === 'UP')   return GREEN
  if (trend === 'DOWN') return RED
  return AMBER
}

const STAGES: PipelineStage[] = [
  {
    id: 'permits',
    label: 'PERMITS',
    value: 1482,
    unit: 'K units/yr',
    mom: 2.8,
    trend: 'UP',
    trendColor: trendColor('UP'),
    lagToNext: 8,
    history: generatePermitHistory(),
  },
  {
    id: 'starts',
    label: 'STARTS',
    value: 1380,
    unit: 'K units/yr',
    mom: 1.8,
    trend: 'UP',
    trendColor: trendColor('UP'),
    lagToNext: 10,
    history: generateStartsHistory(),
  },
  {
    id: 'employment',
    label: 'EMPLOYMENT',
    value: 8330,
    unit: 'K workers',
    mom: 0.31,
    trend: 'UP',
    trendColor: trendColor('UP'),
    lagToNext: 6,
    history: generateEmploymentHistory(),
  },
  {
    id: 'spending',
    label: 'SPENDING',
    value: 2190,
    unit: '$B',
    mom: 0.3,
    trend: 'FLAT',
    trendColor: trendColor('FLAT'),
    lagToNext: 8,
    history: generateSpendingHistory(),
  },
  {
    id: 'gdp',
    label: 'GDP IMPACT',
    value: 4.8,
    unit: '% of GDP',
    mom: 0.1,
    trend: 'UP',
    trendColor: trendColor('UP'),
    lagToNext: null,
    history: generateGdpHistory(),
  },
]

const CASCADE_ALERTS: CascadeAlert[] = [
  {
    id: 'alert-1',
    severity: 'WATCH',
    icon: '⚠️',
    title: 'Permit volume accelerated +2.1σ',
    message: 'Construction employment likely to rise in 8–12 weeks based on historical patterns.',
    type: 'Acceleration',
    timestamp: '2026-04-18T14:23:00Z',
    seriesId: 'PERMIT',
  },
  {
    id: 'alert-2',
    severity: 'INFO',
    icon: '🟢',
    title: 'Southeast permit surge detected',
    message: 'Capital flow into region expected to accelerate in Q3.',
    type: 'Regional Anomaly',
    timestamp: '2026-04-17T09:15:00Z',
    seriesId: 'PERMIT_SOUTHEAST',
  },
  {
    id: 'alert-3',
    severity: 'ANOMALY',
    icon: '🔴',
    title: 'Steel PPI reversed -1.8σ from trend',
    message: 'Materials cost pressure easing — favorable procurement window opening. Monitor lumber for confirmation.',
    type: 'Trend Reversal',
    timestamp: '2026-04-16T11:42:00Z',
    seriesId: 'PPI_STEEL',
  },
  {
    id: 'alert-4',
    severity: 'INFO',
    icon: '🟢',
    title: 'IIJA obligation pace accelerating',
    message: '$4.8B in new federal highway awards this week — backlog expansion likely to sustain starts through H2 2026.',
    type: 'Federal Momentum',
    timestamp: '2026-04-15T10:00:00Z',
    seriesId: 'FEDERAL_IIJA',
  },
  {
    id: 'alert-5',
    severity: 'WATCH',
    icon: '⚠️',
    title: 'Lumber futures nearing 3-year moving average resistance',
    message: 'Breakout would signal sustained cost pressure in residential construction. Watch next 2 weeks.',
    type: 'Price Watch',
    timestamp: '2026-04-14T13:30:00Z',
    seriesId: 'PPI_LUMBER',
  },
  {
    id: 'alert-6',
    severity: 'INFO',
    icon: '🟢',
    title: 'Multi-family starts diverging from single-family',
    message: 'Single-family starts +3.2% MoM vs multi-family -1.4% MoM — composition shift toward ownership units.',
    type: 'Segment Divergence',
    timestamp: '2026-04-12T08:45:00Z',
    seriesId: 'STARTS',
  },
  {
    id: 'alert-7',
    severity: 'ANOMALY',
    icon: '🔴',
    title: 'Copper PPI at 8-month high',
    message: 'Electrical and plumbing subcontractor costs rising — data center and EV manufacturing build-out driving demand.',
    type: 'Commodity Alert',
    timestamp: '2026-04-10T15:12:00Z',
    seriesId: 'PPI_COPPER',
  },
  {
    id: 'alert-8',
    severity: 'WATCH',
    icon: '⚠️',
    title: 'AZ + TX + FL simultaneously HOT',
    message: 'Three-state simultaneous HOT configuration historically signals 6–9 months of above-trend national activity.',
    type: 'Regional Configuration',
    timestamp: '2026-04-08T07:30:00Z',
    seriesId: 'MAP_REGIONAL',
  },
  {
    id: 'alert-9',
    severity: 'INFO',
    icon: '🟢',
    title: 'Construction employment at cycle high: 8.33M',
    message: 'Job openings in construction remain elevated — wage pressure may compress margins for smaller GCs in Q2.',
    type: 'Labor Market',
    timestamp: '2026-04-04T09:00:00Z',
    seriesId: 'BLS_EMPLOYMENT',
  },
  {
    id: 'alert-10',
    severity: 'WATCH',
    icon: '⚠️',
    title: 'Census spending report beat consensus by +0.3%',
    message: 'Infrastructure spending outpacing residential — federal IIJA disbursement acceleration confirmed.',
    type: 'Spending Surprise',
    timestamp: '2026-04-01T10:15:00Z',
    seriesId: 'CENSUS_SPENDING',
  },
]

// Predictive overlay: permit index (base 100 = current) and employment shifted +10 weeks
function generatePredictiveOverlay(): PredictiveOverlay {
  const permitHistory = generatePermitHistory()
  const employmentHistory = generateEmploymentHistory()
  const currentPermit = 1482
  const currentEmployment = 8330

  const permitIndex: HistoryPoint[] = permitHistory.map(p => ({
    date: p.date,
    value: parseFloat(((p.value / currentPermit) * 100).toFixed(1)),
  }))

  // Employment shifted ~10 weeks (2.5 months) forward so lead/lag is visible
  const shiftMonths = 2
  const shiftedDates = monthDates(24 + shiftMonths)
  const employmentShifted: HistoryPoint[] = employmentHistory.map((p, i) => ({
    date: shiftedDates[i + shiftMonths],
    value: parseFloat(((p.value / currentEmployment) * 100).toFixed(1)),
  }))

  return {
    permitIndex,
    employmentShifted,
    prediction:
      'Based on current permit readings (+2.8% MoM), employment is projected to increase 0.4–0.6% in 8–12 weeks.',
  }
}

// Cycle comparison — all indexed to 100 at their trough
// Current cycle trough: Oct 2022; we are at month +18 from trough (Apr 2026)
function generateCycleComparison(): CycleComparison {
  const months: number[] = [-24, -18, -12, -6, 0, 6, 12, 18]

  const makeCycle = (
    key: CycleKey,
    values: number[]
  ): CyclePoint[] =>
    months.map((m, i) => ({ monthFromPeak: m, value: values[i] }))

  // 2008 cycle: peaked around construction bust; sharp decline post-trough
  const cycle2008 = makeCycle('cycle2008', [112, 108, 104, 102, 100, 88, 78, 70])

  // 2016 cycle: moderate, steady growth
  const cycle2016 = makeCycle('cycle2016', [94, 96, 97, 99, 100, 104, 109, 115])

  // 2020 cycle: sharp COVID drop then V-recovery
  const cycle2020 = makeCycle('cycle2020', [104, 102, 98, 88, 100, 110, 116, 120])

  // Current cycle: similar to 2020 but more sustained, currently at month +18
  const current = makeCycle('current', [96, 97, 98, 99, 100, 104, 108, 112])

  return {
    current,
    cycle2008,
    cycle2016,
    cycle2020,
    currentMonth: 18,
    description: 'We are currently at month +18 from the cycle trough (Oct 2022)',
  }
}

// Suppress unused color variable warnings
void RED

export async function GET() {
  try {
    const stages = STAGES
    const cascadeAlerts = CASCADE_ALERTS
    const predictiveOverlay = generatePredictiveOverlay()
    const cycleComparison = generateCycleComparison()

    return NextResponse.json(
      {
        stages,
        cascadeAlerts,
        predictiveOverlay,
        cycleComparison,
        updatedAt: '2026-04-20T06:00:00Z',
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
    )
  } catch (err) {
    console.error('[/api/pipeline]', err)
    return NextResponse.json({ error: 'Failed to fetch pipeline data' }, { status: 500 })
  }
}
