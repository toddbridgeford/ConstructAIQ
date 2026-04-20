import { NextResponse } from 'next/server'

const USA_SPENDING = 'https://api.usaspending.gov/api/v2'

// ── Award type codes for contracts (not grants) ────────────────
const CONTRACT_CODES = ['A', 'B', 'C', 'D']

// ── Construction NAICS prefixes ───────────────────────────────
const NAICS_CODES = [
  '2361','2362','2371','2372','2373','2379',
  '2381','2382','2383','2389'
]

// Fiscal year: October prior year through September current year
function getFYRange() {
  const now   = new Date()
  const fyEnd = new Date(now.getFullYear(), 8, 30)   // Sept 30
  const fyStart = new Date(now.getFullYear() - 1, 9, 1) // Oct 1 prior year
  if (now < fyEnd) {
    return {
      start: `${now.getFullYear() - 1}-10-01`,
      end:   now.toISOString().slice(0, 10),
    }
  }
  return {
    start: `${now.getFullYear()}-10-01`,
    end:   now.toISOString().slice(0, 10),
  }
}

// ── Fetch total awards by awarding agency ────────────────────
async function fetchByAgency(fy: { start: string; end: string }) {
  const body = {
    filters: {
      award_type_codes: CONTRACT_CODES,
      naics_codes:      NAICS_CODES,
      time_period: [{ start_date: fy.start, end_date: fy.end }],
    },
    category: 'awarding_agency',
    limit:    10,
    page:     1,
  }

  const res = await fetch(`${USA_SPENDING}/search/spending_by_category/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`USASpending agency: ${res.status}`)
  return res.json()
}

// ── Fetch individual recent large awards ─────────────────────
async function fetchRecentAwards(fy: { start: string; end: string }) {
  const body = {
    filters: {
      award_type_codes: CONTRACT_CODES,
      naics_codes:      NAICS_CODES,
      time_period: [{ start_date: fy.start, end_date: fy.end }],
    },
    fields: [
      'Award ID',
      'Recipient Name',
      'Award Amount',
      'Awarding Agency',
      'Start Date',
      'Description',
      'Place of Performance State Code',
    ],
    page:  1,
    limit: 10,
    sort:  'Award Amount',
    order: 'desc',
  }

  const res = await fetch(`${USA_SPENDING}/search/spending_by_award/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`USASpending awards: ${res.status}`)
  return res.json()
}

// ── Total construction spending via spending_over_time ────────
async function fetchMonthlyTrend(fy: { start: string; end: string }) {
  const body = {
    filters: {
      award_type_codes: CONTRACT_CODES,
      naics_codes:      NAICS_CODES,
      time_period: [{ start_date: '2024-01-01', end_date: fy.end }],
    },
    group:     'month',
    subawards: false,
  }

  const res = await fetch(`${USA_SPENDING}/search/spending_over_time/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`USASpending trend: ${res.status}`)
  return res.json()
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const fy = getFYRange()

  try {
    const [agencyRes, awardsRes, trendRes] = await Promise.allSettled([
      fetchByAgency(fy),
      fetchRecentAwards(fy),
      fetchMonthlyTrend(fy),
    ])

    // ── Agency breakdown ────────────────────────────────────
    type AgencyRow = { name?: string; agency_name?: string; aggregated_amount?: number; amount?: number }
    type AwardRow  = { 'Award ID': string; 'Recipient Name': string; 'Award Amount': number; 'Awarding Agency': string; 'Start Date': string; 'Place of Performance State Code': string; 'Description'?: string }
    type TrendRow  = { aggregated_amount?: number; time_period?: { fiscal_year?: string; month?: number } }

    const agencyData = agencyRes.status === 'fulfilled' ? agencyRes.value : null
    const agencies   = agencyData?.results?.map((r: AgencyRow) => ({
      name:   r.name || r.agency_name || 'Unknown Agency',
      amount: Math.round((r.aggregated_amount || r.amount || 0) / 1e9 * 10) / 10,
    })).filter(a => a.amount > 0) || []

    // ── Individual awards ───────────────────────────────────
    const awardsData = awardsRes.status === 'fulfilled' ? awardsRes.value : null
    const awards     = awardsData?.results?.map((r: AwardRow) => ({
      id:       r['Award ID'],
      recipient: r['Recipient Name'],
      amount:   r['Award Amount'],
      agency:   r['Awarding Agency'],
      date:     r['Start Date'],
      state:    r['Place of Performance State Code'],
      description: r['Description'] || '',
    })) || []

    // ── Monthly trend ───────────────────────────────────────
    const trendData  = trendRes.status === 'fulfilled' ? trendRes.value : null
    const monthly    = trendData?.results?.map((r: TrendRow) => ({
      month:  `${r.time_period?.fiscal_year}-${String(r.time_period?.month).padStart(2,'0')}`,
      amount: Math.round((r.aggregated_amount || 0) / 1e9 * 100) / 100,
    })) || []

    // ── Total FY amount ─────────────────────────────────────
    const fyTotal = agencies.reduce((s: number, a: { amount: number }) => s + a.amount, 0)

    const anyLive = agencyRes.status === 'fulfilled' || awardsRes.status === 'fulfilled'

    if (!anyLive || (!agencies.length && !awards.length)) {
      return NextResponse.json(getSyntheticContracts(), {
        headers: { 'Cache-Control': 'public, s-maxage=14400' },
      })
    }

    return NextResponse.json({
      source:       'USASpending.gov — Federal Construction Contracts',
      live:         true,
      fyPeriod:     fy,
      fyTotal:      Math.round(fyTotal * 10) / 10,
      agencies:     agencies.slice(0, 8),
      awards:       awards.slice(0, 10),
      monthly,
      iijaPipeline: 890, // $B remaining IIJA active obligations
      updated:      new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=14400' },
    })
  } catch (err) {
    console.error('[/api/contracts]', err)
    return NextResponse.json(getSyntheticContracts(), {
      headers: { 'Cache-Control': 'public, s-maxage=14400' },
    })
  }
}

// ── Synthetic fallback with realistic data ────────────────────
function getSyntheticContracts() {
  return {
    source:   'USASpending.gov — synthetic fallback',
    live:     false,
    fyTotal:  285.4,  // $B FY2026 YTD
    agencies: [
      { name:'Dept of Transportation',   amount:84.2 },
      { name:'Army Corps of Engineers',  amount:58.7 },
      { name:'Dept of Housing (HUD)',    amount:42.1 },
      { name:'Dept of Energy',           amount:38.4 },
      { name:'GSA Public Buildings Svc', amount:28.9 },
      { name:'Dept of Defense',          amount:24.6 },
      { name:'Dept of Veterans Affairs', amount:18.3 },
      { name:'Bureau of Reclamation',    amount:14.8 },
    ],
    awards: [
      { recipient:'Fluor Corp',                amount:1840000000, agency:'Army Corps', state:'TX', date:'2026-02-14' },
      { recipient:'Bechtel Group',             amount:1420000000, agency:'DOE',        state:'CA', date:'2026-01-28' },
      { recipient:'Turner Construction',       amount:892000000,  agency:'DOD',        state:'VA', date:'2026-03-02' },
      { recipient:'Skanska USA',               amount:748000000,  agency:'DOT',        state:'NY', date:'2026-02-19' },
      { recipient:'Kiewit Corp',               amount:682000000,  agency:'DOT',        state:'TX', date:'2026-03-08' },
      { recipient:'PCL Construction',          amount:524000000,  agency:'GSA',        state:'DC', date:'2026-01-15' },
      { recipient:'Clark Construction',        amount:487000000,  agency:'VA',         state:'MD', date:'2026-02-28' },
      { recipient:'Walsh Group',               amount:412000000,  agency:'Corps',      state:'IL', date:'2026-03-12' },
    ],
    monthly: [
      { month:'2024-01', amount:18.4 }, { month:'2024-02', amount:22.1 },
      { month:'2024-03', amount:24.8 }, { month:'2024-04', amount:26.3 },
      { month:'2024-05', amount:28.7 }, { month:'2024-06', amount:27.2 },
      { month:'2024-07', amount:29.4 }, { month:'2024-08', amount:28.8 },
      { month:'2024-09', amount:31.2 }, { month:'2024-10', amount:30.1 },
      { month:'2024-11', amount:29.4 }, { month:'2024-12', amount:28.7 },
      { month:'2025-01', amount:24.2 }, { month:'2025-02', amount:27.8 },
      { month:'2025-03', amount:31.4 }, { month:'2025-04', amount:33.2 },
      { month:'2025-05', amount:35.8 }, { month:'2025-06', amount:34.1 },
      { month:'2025-07', amount:37.4 }, { month:'2025-08', amount:36.8 },
      { month:'2025-09', amount:39.2 }, { month:'2025-10', amount:38.4 },
      { month:'2025-11', amount:37.8 }, { month:'2025-12', amount:36.9 },
      { month:'2026-01', amount:32.4 }, { month:'2026-02', amount:38.2 },
      { month:'2026-03', amount:41.8 },
    ],
    iijaPipeline: 890,
    updated: new Date().toISOString(),
  }
}
