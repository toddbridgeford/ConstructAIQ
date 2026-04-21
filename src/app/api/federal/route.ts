import { NextResponse } from 'next/server'
import { getStateAllocations, type StateAllocation } from '@/lib/federal'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'

// ── Type definitions ───────────────────────────────────────────────────────

interface Program {
  name: string; authorized: number; obligated: number; spent: number
  executionPct: number; agency: string; color: string
}
interface Agency      { name: string; obligatedPct: number; color: string }
interface Contractor  { rank: number; name: string; awardValue: number; contracts: number; agency: string; state: string }
interface MonthlyAward { month: string; value: number }

// ── Static data — appropriations/legislation, not from a live API ──────────

function agencyColor(pct: number) {
  return pct >= 70 ? '#30d158' : pct >= 50 ? '#f5a623' : '#ff453a'
}

const PROGRAMS: Program[] = [
  { name:'IIJA — Highway Formula Funds',   authorized:110000, obligated:74800, spent:52300, executionPct:68.0, agency:'FHWA',    color:'#0a84ff' },
  { name:'IIJA — Bridge Investment Program', authorized:40000, obligated:24200, spent:14800, executionPct:60.5, agency:'FHWA',    color:'#0a84ff' },
  { name:'IIJA — Public Transit (FTA)',    authorized:39200,  obligated:28400, spent:18200, executionPct:72.4, agency:'FTA',     color:'#f5a623' },
  { name:'IIJA — Rail / Amtrak',          authorized:66000,  obligated:42800, spent:24600, executionPct:64.8, agency:'FRA',     color:'#0a84ff' },
  { name:'IIJA — Broadband (BEAD)',       authorized:65000,  obligated:18400, spent:4200,  executionPct:28.3, agency:'NTIA',    color:'#ff453a' },
  { name:'IIJA — Water Infrastructure',  authorized:55000,  obligated:38400, spent:22800, executionPct:69.8, agency:'EPA',     color:'#f5a623' },
  { name:'IIJA — Airport Infrastructure', authorized:25000, obligated:18800, spent:12400, executionPct:75.2, agency:'FAA',     color:'#30d158' },
  { name:'IRA — Clean Energy Construction', authorized:180000, obligated:124800, spent:84200, executionPct:69.3, agency:'DOE', color:'#30d158' },
  { name:'IRA — Manufacturing Investment', authorized:280000, obligated:168400, spent:98400, executionPct:60.1, agency:'Treasury', color:'#30d158' },
  { name:'DoD — Military Construction',  authorized:14000,  obligated:11400, spent:8400,  executionPct:81.4, agency:'DoD',     color:'#30d158' },
]

const AGENCIES: Agency[] = [
  { name:'FHWA',        obligatedPct:78, color:agencyColor(78) },
  { name:'Army Corps',  obligatedPct:71, color:agencyColor(71) },
  { name:'GSA',         obligatedPct:58, color:agencyColor(58) },
  { name:'DoD MILCON',  obligatedPct:82, color:agencyColor(82) },
  { name:'EPA Water',   obligatedPct:44, color:agencyColor(44) },
  { name:'FTA Transit', obligatedPct:67, color:agencyColor(67) },
  { name:'FAA Airports',obligatedPct:72, color:agencyColor(72) },
  { name:'HUD',         obligatedPct:38, color:agencyColor(38) },
]

const CONTRACTORS: Contractor[] = [
  { rank:1,  name:'Bechtel Group',         awardValue:8420, contracts:23, agency:'DOT',  state:'CA' },
  { rank:2,  name:'Turner Construction',   awardValue:6840, contracts:31, agency:'GSA',  state:'NY' },
  { rank:3,  name:'Fluor Corporation',     awardValue:6240, contracts:18, agency:'DOE',  state:'TX' },
  { rank:4,  name:'Kiewit Corporation',    awardValue:5980, contracts:27, agency:'FHWA', state:'NE' },
  { rank:5,  name:'Jacobs Engineering',    awardValue:5420, contracts:34, agency:'EPA',  state:'TX' },
  { rank:6,  name:'AECOM',                awardValue:5180, contracts:42, agency:'DOT',  state:'CA' },
  { rank:7,  name:'Skanska USA',           awardValue:4840, contracts:22, agency:'GSA',  state:'NY' },
  { rank:8,  name:'PCL Construction',      awardValue:4280, contracts:19, agency:'FHWA', state:'CO' },
  { rank:9,  name:'Whiting-Turner',        awardValue:3980, contracts:28, agency:'GSA',  state:'MD' },
  { rank:10, name:'Gilbane Building',      awardValue:3720, contracts:24, agency:'GSA',  state:'RI' },
  { rank:11, name:'McCarthy Building',     awardValue:3480, contracts:21, agency:'DOE',  state:'MO' },
  { rank:12, name:'DPR Construction',      awardValue:3240, contracts:17, agency:'NIH',  state:'CA' },
  { rank:13, name:'Suffolk Construction',  awardValue:3080, contracts:23, agency:'GSA',  state:'MA' },
  { rank:14, name:'Clark Construction',    awardValue:2940, contracts:19, agency:'GSA',  state:'MD' },
  { rank:15, name:'Hensel Phelps',         awardValue:2780, contracts:16, agency:'DoD',  state:'CO' },
  { rank:16, name:'Mortenson Construction',awardValue:2580, contracts:14, agency:'DOE',  state:'MN' },
  { rank:17, name:'JE Dunn Construction',  awardValue:2340, contracts:18, agency:'GSA',  state:'MO' },
  { rank:18, name:'Barton Malow',          awardValue:2180, contracts:15, agency:'DoD',  state:'MI' },
  { rank:19, name:'Holder Construction',   awardValue:1980, contracts:13, agency:'GSA',  state:'GA' },
  { rank:20, name:'Austin Industries',     awardValue:1840, contracts:16, agency:'FHWA', state:'TX' },
]

function buildMonthlyAwards(): MonthlyAward[] {
  const base = [
    4820,5140,4680,5380,4920,5640,
    4480,5280,5820,4940,5480,6020,
    4380,5140,5680,5020,4840,5920,
    5280,4740,5480,6120,5380,4980,
  ]
  const start = new Date('2024-05-01')
  return base.map((value, i) => {
    const d = new Date(start)
    d.setMonth(d.getMonth() + i)
    return { month: d.toISOString().split('T')[0], value }
  })
}

// Static fallback — proportional state estimates when live data unavailable
function staticStateAllocations(): StateAllocation[] {
  const raw = [
    ['TX',18420,98],['CA',17840,72],['FL',14280,94],['NY',13640,68],
    ['PA',10820,76],['IL',9480,71], ['OH',8840,80], ['GA',8280,87],
    ['NC',7920,89], ['MI',7640,74], ['WA',7280,78], ['AZ',7140,82],
    ['VA',6840,86], ['CO',6480,83], ['TN',6280,88], ['MA',8420,61],
    ['IN',5920,79], ['WI',5680,75], ['MN',5480,77], ['SC',5280,91],
    ['MO',5140,73], ['AL',4840,85], ['LA',4680,82], ['MD',4520,69],
    ['OR',4280,64], ['KY',4140,78], ['OK',3980,72], ['NV',3840,84],
    ['UT',3680,87], ['AR',3480,76], ['MS',3280,69], ['KS',3140,73],
    ['NM',2980,65], ['NE',2840,80], ['IA',2780,77], ['ID',2480,83],
    ['CT',2380,58], ['DC',2840,35], ['MT',2180,79], ['WV',2080,62],
    ['HI',1980,55], ['NH',1840,71], ['ME',1720,68], ['SD',1580,81],
    ['ND',1480,78], ['RI',1380,52], ['DE',1280,74], ['AK',1180,48],
    ['VT',1080,63], ['WY',980,72],
  ] as [string, number, number][]
  return raw
    .sort((a, b) => b[1] - a[1])
    .map(([state, allocated, pct], idx) => ({
      state,
      allocated,
      obligated: Math.round(allocated * (pct / 100)),
      spent:     Math.round(allocated * (pct / 100) * 0.68),
      executionPct: pct,
      rank: idx + 1,
    }))
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { data: liveStates, fromCache, fetchedAt, error } =
      await getStateAllocations()

    const stateAllocations = liveStates.length > 0
      ? liveStates
      : staticStateAllocations()

    const monthlyAwards  = buildMonthlyAwards()
    const totalAuthorized = PROGRAMS.reduce((s, p) => s + p.authorized, 0)
    const totalObligated  = PROGRAMS.reduce((s, p) => s + p.obligated,  0)
    const totalSpent      = PROGRAMS.reduce((s, p) => s + p.spent,      0)

    return NextResponse.json(
      {
        programs:         PROGRAMS,
        agencies:         AGENCIES,
        contractors:      CONTRACTORS,
        monthlyAwards,
        stateAllocations,
        totalAuthorized,
        totalObligated,
        totalSpent,
        // Provenance fields — visible in API response
        dataSource:   liveStates.length > 0 ? 'usaspending.gov' : 'static-fallback',
        fromCache,
        updatedAt:    fetchedAt,
        ...(error ? { fetchError: error } : {}),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    )
  } catch (err) {
    // Last-resort fallback — never error the dashboard
    console.error('[/api/federal]', err)
    const stateAllocations = staticStateAllocations()
    const monthlyAwards    = buildMonthlyAwards()
    const totalAuthorized  = PROGRAMS.reduce((s, p) => s + p.authorized, 0)
    const totalObligated   = PROGRAMS.reduce((s, p) => s + p.obligated,  0)
    const totalSpent       = PROGRAMS.reduce((s, p) => s + p.spent,      0)
    return NextResponse.json({
      programs:PROGRAMS, agencies:AGENCIES, contractors:CONTRACTORS,
      monthlyAwards, stateAllocations, totalAuthorized, totalObligated, totalSpent,
      dataSource:'static-fallback', fromCache:false,
      updatedAt: new Date().toISOString(),
    })
  }
}
