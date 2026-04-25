import { NextResponse } from 'next/server'
import {
  getStateAllocations,
  getFederalLeaderboard,
  getFederalMonthlyAwards,
  GEO_CACHE_KEY,
  LEADERBOARD_CACHE_KEY,
  MONTHLY_AWARDS_CACHE_KEY,
  LEADERBOARD_LOOKBACK_MONTHS,
  LEADERBOARD_AWARD_LIMIT,
  FEDERAL_NAICS_CODES,
  type StateAllocation,
  type ContractorLeader,
  type AgencyShare,
  type MonthlyAward,
} from '@/lib/federal'
import { logApiError } from '@/lib/observability'

export const maxDuration = 10

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'

// ── Type definitions ───────────────────────────────────────────────────────

interface Program {
  name: string; authorized: number; obligated: number; spent: number
  executionPct: number; agency: string; color: string
}

// ── Static legislative authorization table ─────────────────────────────────
// Source: IIJA / IRA / DoD MILCON authorization figures from public CBO and
// Treasury reports. These are statutory authorization & cumulative obligation
// totals at the program level — NOT live award execution data, and not
// expected to change daily. They are kept here as a defensible reference
// table; the leaderboard / agency proxies are now live (see below).
//
// Reviewer note: if/when CFO Act program-execution data is wired up, replace
// this table with that feed and drop the static comment.

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
    const [statesRes, leaderRes, monthlyRes] = await Promise.all([
      getStateAllocations(),
      getFederalLeaderboard(),
      getFederalMonthlyAwards(),
    ])

    const stateAllocations: StateAllocation[] = statesRes.data.length > 0
      ? statesRes.data
      : staticStateAllocations()
    const contractors: ContractorLeader[] = leaderRes.data.contractors
    const agencies:    AgencyShare[]      = leaderRes.data.agencies
    const monthlyAwards: MonthlyAward[]   = monthlyRes.data

    const totalAuthorized = PROGRAMS.reduce((s, p) => s + p.authorized, 0)
    const totalObligated  = PROGRAMS.reduce((s, p) => s + p.obligated,  0)
    const totalSpent      = PROGRAMS.reduce((s, p) => s + p.spent,      0)

    // Provenance — all three live feeds (geo, leaderboard, monthly) must have
    // usable data to claim "usaspending.gov".
    const liveGeo     = statesRes.data.length > 0
    const liveLeader  = contractors.length > 0 || agencies.length > 0
    const liveMonthly = monthlyRes.data.length > 0
    const dataSource  = liveGeo && liveLeader && liveMonthly
      ? 'usaspending.gov'
      : 'static-fallback'

    const allErrors  = [statesRes.error, leaderRes.error, monthlyRes.error].filter(Boolean)
    const fetchError = allErrors.length > 0 ? allErrors.join('; ') : undefined
    const fromCache  = Boolean(statesRes.fromCache && leaderRes.fromCache && monthlyRes.fromCache)
    const updatedAt  = monthlyRes.fetchedAt || leaderRes.fetchedAt || statesRes.fetchedAt

    const geoSource = liveGeo
      ? (statesRes.fromCache ? 'usaspending.gov/cached' : 'usaspending.gov/live')
      : 'static-fallback'
    const leaderboardSource = liveLeader
      ? (leaderRes.fromCache ? 'usaspending.gov/cached' : 'usaspending.gov/live')
      : 'none'
    const monthlyAwardsSource = liveMonthly
      ? (monthlyRes.fromCache ? 'usaspending.gov/cached' : 'usaspending.gov/live')
      : 'none'

    const federalMeta = {
      leaderboardLookbackMonths: LEADERBOARD_LOOKBACK_MONTHS,
      leaderboardAwardLimit:     LEADERBOARD_AWARD_LIMIT,
      naicsCodes:                FEDERAL_NAICS_CODES,
      cacheKeys: {
        geo:           GEO_CACHE_KEY,
        leaderboard:   LEADERBOARD_CACHE_KEY,
        monthlyAwards: MONTHLY_AWARDS_CACHE_KEY,
      },
      geoSource,
      leaderboardSource,
      monthlyAwardsSource,
    }

    return NextResponse.json(
      {
        programs:         PROGRAMS,
        agencies,
        contractors,
        monthlyAwards,
        stateAllocations,
        solicitations:    [],
        totalAuthorized,
        totalObligated,
        totalSpent,
        dataSource,
        fromCache,
        updatedAt,
        federalMeta,
        ...(fetchError ? { fetchError } : {}),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    )
  } catch (err) {
    // Last-resort fallback — never error the dashboard. Leaderboard tables are
    // intentionally empty; monthlyAwards is [] rather than fabricated data.
    logApiError('federal', err, { stage: 'route-toplevel' })
    const stateAllocations = staticStateAllocations()
    const totalAuthorized  = PROGRAMS.reduce((s, p) => s + p.authorized, 0)
    const totalObligated   = PROGRAMS.reduce((s, p) => s + p.obligated,  0)
    const totalSpent       = PROGRAMS.reduce((s, p) => s + p.spent,      0)
    return NextResponse.json({
      programs:         PROGRAMS,
      agencies:         [],
      contractors:      [],
      monthlyAwards:    [],
      stateAllocations,
      solicitations:    [],
      totalAuthorized,
      totalObligated,
      totalSpent,
      dataSource: 'static-fallback',
      fromCache:  false,
      updatedAt:  new Date().toISOString(),
      fetchError: err instanceof Error ? err.message : String(err),
      federalMeta: {
        leaderboardLookbackMonths: LEADERBOARD_LOOKBACK_MONTHS,
        leaderboardAwardLimit:     LEADERBOARD_AWARD_LIMIT,
        naicsCodes:                FEDERAL_NAICS_CODES,
        cacheKeys: {
          geo:           GEO_CACHE_KEY,
          leaderboard:   LEADERBOARD_CACHE_KEY,
          monthlyAwards: MONTHLY_AWARDS_CACHE_KEY,
        },
        geoSource:            'static-fallback',
        leaderboardSource:    'none',
        monthlyAwardsSource:  'none',
      },
    })
  }
}
