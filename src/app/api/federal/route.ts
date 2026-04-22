import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// All dollar values in $M (millions)

interface Program {
  name: string
  authorized: number
  obligated: number
  spent: number
  executionPct: number
  agency: string
  color: string
}

interface Agency {
  name: string
  obligatedPct: number
  color: string
}

interface Contractor {
  rank: number
  name: string
  awardValue: number
  contracts: number
  agency: string
  state: string
}

interface MonthlyAward {
  month: string
  value: number
}

interface StateAllocation {
  state: string
  allocated: number
  obligated: number
  spent: number
  executionPct: number
  rank: number
}

function agencyColor(pct: number): string {
  if (pct >= 70) return '#30d158'
  if (pct >= 50) return '#f5a623'
  return '#ff453a'
}

const PROGRAMS: Program[] = [
  {
    name: 'IIJA — Highway Formula Funds',
    authorized: 110000,
    obligated: 74800,
    spent: 52300,
    executionPct: parseFloat(((74800 / 110000) * 100).toFixed(1)),
    agency: 'FHWA',
    color: '#0a84ff',
  },
  {
    name: 'IIJA — Bridge Investment Program',
    authorized: 40000,
    obligated: 24200,
    spent: 14800,
    executionPct: parseFloat(((24200 / 40000) * 100).toFixed(1)),
    agency: 'FHWA',
    color: '#0a84ff',
  },
  {
    name: 'IIJA — Public Transit (FTA)',
    authorized: 39200,
    obligated: 28400,
    spent: 18200,
    executionPct: parseFloat(((28400 / 39200) * 100).toFixed(1)),
    agency: 'FTA',
    color: '#f5a623',
  },
  {
    name: 'IIJA — Rail / Amtrak',
    authorized: 66000,
    obligated: 42800,
    spent: 24600,
    executionPct: parseFloat(((42800 / 66000) * 100).toFixed(1)),
    agency: 'FRA',
    color: '#0a84ff',
  },
  {
    name: 'IIJA — Broadband (BEAD)',
    authorized: 65000,
    obligated: 18400,
    spent: 4200,
    executionPct: parseFloat(((18400 / 65000) * 100).toFixed(1)),
    agency: 'NTIA',
    color: '#ff453a',
  },
  {
    name: 'IIJA — Water Infrastructure',
    authorized: 55000,
    obligated: 38400,
    spent: 22800,
    executionPct: parseFloat(((38400 / 55000) * 100).toFixed(1)),
    agency: 'EPA',
    color: '#f5a623',
  },
  {
    name: 'IIJA — Airport Infrastructure',
    authorized: 25000,
    obligated: 18800,
    spent: 12400,
    executionPct: parseFloat(((18800 / 25000) * 100).toFixed(1)),
    agency: 'FAA',
    color: '#30d158',
  },
  {
    name: 'IRA — Clean Energy Construction',
    authorized: 180000,
    obligated: 124800,
    spent: 84200,
    executionPct: parseFloat(((124800 / 180000) * 100).toFixed(1)),
    agency: 'DOE',
    color: '#30d158',
  },
  {
    name: 'IRA — Manufacturing Investment',
    authorized: 280000,
    obligated: 168400,
    spent: 98400,
    executionPct: parseFloat(((168400 / 280000) * 100).toFixed(1)),
    agency: 'Treasury',
    color: '#30d158',
  },
  {
    name: 'DoD — Military Construction',
    authorized: 14000,
    obligated: 11400,
    spent: 8400,
    executionPct: parseFloat(((11400 / 14000) * 100).toFixed(1)),
    agency: 'DoD',
    color: '#30d158',
  },
]

const AGENCIES: Agency[] = [
  { name: 'FHWA',      obligatedPct: 78, color: agencyColor(78) },
  { name: 'Army Corps', obligatedPct: 71, color: agencyColor(71) },
  { name: 'GSA',        obligatedPct: 58, color: agencyColor(58) },
  { name: 'DoD MILCON', obligatedPct: 82, color: agencyColor(82) },
  { name: 'EPA Water',  obligatedPct: 44, color: agencyColor(44) },
  { name: 'FTA Transit', obligatedPct: 67, color: agencyColor(67) },
  { name: 'FAA Airports', obligatedPct: 72, color: agencyColor(72) },
  { name: 'HUD',        obligatedPct: 38, color: agencyColor(38) },
]

const CONTRACTORS: Contractor[] = [
  { rank: 1,  name: 'Bechtel Group',      awardValue: 8420, contracts: 23, agency: 'DOT',     state: 'CA' },
  { rank: 2,  name: 'Turner Construction', awardValue: 6840, contracts: 31, agency: 'GSA',     state: 'NY' },
  { rank: 3,  name: 'Fluor Corporation',   awardValue: 6240, contracts: 18, agency: 'DOE',     state: 'TX' },
  { rank: 4,  name: 'Kiewit Corporation',  awardValue: 5980, contracts: 27, agency: 'FHWA',    state: 'NE' },
  { rank: 5,  name: 'Jacobs Engineering',  awardValue: 5420, contracts: 34, agency: 'EPA',     state: 'TX' },
  { rank: 6,  name: 'AECOM',              awardValue: 5180, contracts: 42, agency: 'DOT',     state: 'CA' },
  { rank: 7,  name: 'Skanska USA',         awardValue: 4840, contracts: 22, agency: 'GSA',     state: 'NY' },
  { rank: 8,  name: 'PCL Construction',    awardValue: 4280, contracts: 19, agency: 'FHWA',    state: 'CO' },
  { rank: 9,  name: 'Whiting-Turner',      awardValue: 3980, contracts: 28, agency: 'GSA',     state: 'MD' },
  { rank: 10, name: 'Gilbane Building',    awardValue: 3720, contracts: 24, agency: 'GSA',     state: 'RI' },
  { rank: 11, name: 'McCarthy Building',   awardValue: 3480, contracts: 21, agency: 'DOE',     state: 'MO' },
  { rank: 12, name: 'DPR Construction',    awardValue: 3240, contracts: 17, agency: 'NIH',     state: 'CA' },
  { rank: 13, name: 'Suffolk Construction', awardValue: 3080, contracts: 23, agency: 'GSA',    state: 'MA' },
  { rank: 14, name: 'Clark Construction',  awardValue: 2940, contracts: 19, agency: 'GSA',     state: 'MD' },
  { rank: 15, name: 'Hensel Phelps',       awardValue: 2780, contracts: 16, agency: 'DoD',     state: 'CO' },
  { rank: 16, name: 'Mortenson Construction', awardValue: 2580, contracts: 14, agency: 'DOE',  state: 'MN' },
  { rank: 17, name: 'JE Dunn Construction', awardValue: 2340, contracts: 18, agency: 'GSA',    state: 'MO' },
  { rank: 18, name: 'Barton Malow',        awardValue: 2180, contracts: 15, agency: 'DoD',     state: 'MI' },
  { rank: 19, name: 'Holder Construction', awardValue: 1980, contracts: 13, agency: 'GSA',     state: 'GA' },
  { rank: 20, name: 'Austin Industries',   awardValue: 1840, contracts: 16, agency: 'FHWA',    state: 'TX' },
]

function generateMonthlyAwards(): MonthlyAward[] {
  // 24 months: May 2024 → April 2026
  // Values $M, range 3800–6400 with realistic monthly variance
  const base = [
    4820, 5140, 4680, 5380, 4920, 5640,
    4480, 5280, 5820, 4940, 5480, 6020,
    4380, 5140, 5680, 5020, 4840, 5920,
    5280, 4740, 5480, 6120, 5380, 4980,
  ]
  const months: MonthlyAward[] = []
  const start = new Date('2024-05-01')
  for (let i = 0; i < 24; i++) {
    const d = new Date(start)
    d.setMonth(d.getMonth() + i)
    months.push({
      month: d.toISOString().split('T')[0],
      value: base[i],
    })
  }
  return months
}

function generateStateAllocations(): StateAllocation[] {
  // All 50 states with realistic values proportional to state size
  const stateData: Array<{ state: string; allocated: number; executionPct: number }> = [
    { state: 'TX', allocated: 18420, executionPct: 98 },
    { state: 'CA', allocated: 17840, executionPct: 72 },
    { state: 'FL', allocated: 14280, executionPct: 94 },
    { state: 'NY', allocated: 13640, executionPct: 68 },
    { state: 'PA', allocated: 10820, executionPct: 76 },
    { state: 'IL', allocated: 9480,  executionPct: 71 },
    { state: 'OH', allocated: 8840,  executionPct: 80 },
    { state: 'GA', allocated: 8280,  executionPct: 87 },
    { state: 'NC', allocated: 7920,  executionPct: 89 },
    { state: 'MI', allocated: 7640,  executionPct: 74 },
    { state: 'WA', allocated: 7280,  executionPct: 78 },
    { state: 'AZ', allocated: 7140,  executionPct: 82 },
    { state: 'VA', allocated: 6840,  executionPct: 86 },
    { state: 'CO', allocated: 6480,  executionPct: 83 },
    { state: 'TN', allocated: 6280,  executionPct: 88 },
    { state: 'IN', allocated: 5920,  executionPct: 79 },
    { state: 'WI', allocated: 5680,  executionPct: 75 },
    { state: 'MN', allocated: 5480,  executionPct: 77 },
    { state: 'SC', allocated: 5280,  executionPct: 91 },
    { state: 'MO', allocated: 5140,  executionPct: 73 },
    { state: 'AL', allocated: 4840,  executionPct: 85 },
    { state: 'LA', allocated: 4680,  executionPct: 82 },
    { state: 'MD', allocated: 4520,  executionPct: 69 },
    { state: 'OR', allocated: 4280,  executionPct: 64 },
    { state: 'KY', allocated: 4140,  executionPct: 78 },
    { state: 'OK', allocated: 3980,  executionPct: 72 },
    { state: 'NV', allocated: 3840,  executionPct: 84 },
    { state: 'UT', allocated: 3680,  executionPct: 87 },
    { state: 'AR', allocated: 3480,  executionPct: 76 },
    { state: 'MS', allocated: 3280,  executionPct: 69 },
    { state: 'KS', allocated: 3140,  executionPct: 73 },
    { state: 'NM', allocated: 2980,  executionPct: 65 },
    { state: 'NE', allocated: 2840,  executionPct: 80 },
    { state: 'IA', allocated: 2780,  executionPct: 77 },
    { state: 'ID', allocated: 2480,  executionPct: 83 },
    { state: 'CT', allocated: 2380,  executionPct: 58 },
    { state: 'MT', allocated: 2180,  executionPct: 79 },
    { state: 'WV', allocated: 2080,  executionPct: 62 },
    { state: 'HI', allocated: 1980,  executionPct: 55 },
    { state: 'NH', allocated: 1840,  executionPct: 71 },
    { state: 'ME', allocated: 1720,  executionPct: 68 },
    { state: 'SD', allocated: 1580,  executionPct: 81 },
    { state: 'ND', allocated: 1480,  executionPct: 78 },
    { state: 'RI', allocated: 1380,  executionPct: 52 },
    { state: 'DE', allocated: 1280,  executionPct: 74 },
    { state: 'AK', allocated: 1180,  executionPct: 48 },
    { state: 'VT', allocated: 1080,  executionPct: 63 },
    { state: 'WY', allocated: 980,   executionPct: 72 },
    { state: 'MA', allocated: 8420,  executionPct: 61 },
    { state: 'DC', allocated: 2840,  executionPct: 35 },
  ]

  return stateData
    .sort((a, b) => b.allocated - a.allocated)
    .map((s, idx) => {
      const obligated = Math.round(s.allocated * (s.executionPct / 100))
      const spent = Math.round(obligated * 0.68)
      return {
        state: s.state,
        allocated: s.allocated,
        obligated,
        spent,
        executionPct: s.executionPct,
        rank: idx + 1,
      }
    })
}

interface Solicitation {
  id: string
  title: string
  agency: string
  naics: string
  state: string
  estimatedValue: number | null
  closeDate: string | null
  postedDate: string | null
  url: string
}

async function fetchSolicitations(): Promise<Solicitation[]> {
  const samKey = process.env.SAM_GOV_API_KEY
  if (!samKey) return []

  try {
    const url =
      `https://api.sam.gov/opportunities/v2/search?` +
      `limit=25&api_key=${samKey}` +
      `&naics=236,237,238` +
      `&ptype=o` +
      `&status=active` +
      `&sort=-modifiedDate`

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) {
      console.error('[federal] SAM.gov returned', res.status)
      return []
    }
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.opportunitiesData ?? []).map((opp: any): Solicitation => ({
      id: opp.noticeId,
      title: opp.title,
      agency: opp.fullParentPathName ?? opp.organizationName ?? '',
      naics: opp.naicsCode ?? '',
      state: opp.placeOfPerformance?.state?.code ?? 'N/A',
      estimatedValue: opp.award?.amount ?? null,
      closeDate: opp.responseDeadLine ?? null,
      postedDate: opp.postedDate ?? null,
      url: `https://sam.gov/opp/${opp.noticeId}/view`,
    }))
  } catch (e) {
    console.error('[federal] SAM.gov fetch failed:', e)
    return []
  }
}

export async function GET() {
  try {
    const programs = PROGRAMS
    const agencies = AGENCIES
    const contractors = CONTRACTORS
    const monthlyAwards = generateMonthlyAwards()
    const stateAllocations = generateStateAllocations()
    const solicitations = await fetchSolicitations()

    const totalAuthorized = programs.reduce((s, p) => s + p.authorized, 0)
    const totalObligated = programs.reduce((s, p) => s + p.obligated, 0)
    const totalSpent = programs.reduce((s, p) => s + p.spent, 0)

    return NextResponse.json(
      {
        programs,
        agencies,
        contractors,
        monthlyAwards,
        stateAllocations,
        solicitations,
        totalAuthorized,
        totalObligated,
        totalSpent,
        updatedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
    )
  } catch (err) {
    console.error('[/api/federal]', err)
    return NextResponse.json({ error: 'Failed to fetch federal data' }, { status: 500 })
  }
}
