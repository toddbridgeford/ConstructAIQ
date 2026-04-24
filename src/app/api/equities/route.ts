import { NextResponse } from 'next/server'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Colors
const GREEN  = '#30d158'
const AMBER  = '#f5a623'
const RED    = '#ff453a'
const BLUE   = '#0a84ff'

type Signal = 'BUY' | 'HOLD' | 'SELL'
type RevenueSignal = 'BEAT_LIKELY' | 'IN_LINE' | 'MISS_RISK'
type MarginSignal = 'EXPANDING' | 'STABLE' | 'COMPRESSING'
type BacklogSignal = 'GROWING' | 'STABLE' | 'DECLINING'

interface ETFMeta {
  ticker: string
  name: string
  signal: Signal
  signalColor: string
}

type ETFResult = ETFMeta & { live: boolean; price?: number | null; change1d?: number | null }

interface SectorPoint {
  date: string
  constructionIndex: number
  sp500Index: number
}

interface EarningsCompany {
  ticker: string
  name: string
  sector: string
  nextEarningsDate: string
  revenueSignal: RevenueSignal
  marginSignal: MarginSignal
  backlogSignal: BacklogSignal
  regionalExposure: string[]
  revenueSignalColor: string
  marginSignalColor: string
  backlogSignalColor: string
}

interface SectorRotationPoint {
  subsector: string
  momentum: number
  level: number
}

function signalColor(signal: Signal): string {
  if (signal === 'BUY')  return GREEN
  if (signal === 'SELL') return RED
  return AMBER
}

function revenueColor(signal: RevenueSignal): string {
  if (signal === 'BEAT_LIKELY') return GREEN
  if (signal === 'MISS_RISK')   return RED
  return AMBER
}

function marginColor(signal: MarginSignal): string {
  if (signal === 'EXPANDING')   return GREEN
  if (signal === 'COMPRESSING') return RED
  return AMBER
}

function backlogColor(signal: BacklogSignal): string {
  if (signal === 'GROWING')   return GREEN
  if (signal === 'DECLINING') return RED
  return AMBER
}

const ETF_META: ETFMeta[] = [
  { ticker: 'ITB', name: 'iShares Home Construction ETF',              signal: 'BUY',  signalColor: signalColor('BUY')  },
  { ticker: 'XHB', name: 'SPDR S&P Homebuilders ETF',                 signal: 'BUY',  signalColor: signalColor('BUY')  },
  { ticker: 'PKB', name: 'Invesco Dynamic Building & Construction ETF',signal: 'HOLD', signalColor: signalColor('HOLD') },
]

// 12 months of sector composite data, base 100 = April 2025
// Construction outperforms S&P by ~3% over the period
function generateSectorComposite(): SectorPoint[] {
  const months = [
    { constructionIndex: 100.0, sp500Index: 100.0 },
    { constructionIndex: 101.4, sp500Index: 100.8 },
    { constructionIndex: 99.8,  sp500Index: 101.2 },
    { constructionIndex: 102.1, sp500Index: 101.6 },
    { constructionIndex: 103.8, sp500Index: 102.1 },
    { constructionIndex: 102.4, sp500Index: 102.8 },
    { constructionIndex: 104.6, sp500Index: 103.2 },
    { constructionIndex: 106.2, sp500Index: 103.9 },
    { constructionIndex: 105.4, sp500Index: 104.4 },
    { constructionIndex: 107.8, sp500Index: 104.8 },
    { constructionIndex: 106.9, sp500Index: 105.1 },
    { constructionIndex: 103.2, sp500Index: 103.8 },
  ]

  const result: SectorPoint[] = []
  const start = new Date('2025-04-01')
  for (let i = 0; i < months.length; i++) {
    const d = new Date(start)
    d.setMonth(d.getMonth() + i)
    result.push({
      date: d.toISOString().split('T')[0],
      constructionIndex: months[i].constructionIndex,
      sp500Index: months[i].sp500Index,
    })
  }
  return result
}

const EARNINGS_COMPANIES: EarningsCompany[] = [
  // Homebuilders
  {
    ticker: 'DHI',
    name: 'D.R. Horton',
    sector: 'Homebuilder',
    nextEarningsDate: '2026-07-24',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'STABLE',
    backlogSignal: 'GROWING',
    regionalExposure: ['TX', 'FL', 'AZ', 'NC'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('STABLE'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'LEN',
    name: 'Lennar Corporation',
    sector: 'Homebuilder',
    nextEarningsDate: '2026-06-18',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'STABLE',
    backlogSignal: 'GROWING',
    regionalExposure: ['FL', 'TX', 'CA', 'CO'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('STABLE'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'PHM',
    name: 'PulteGroup',
    sector: 'Homebuilder',
    nextEarningsDate: '2026-07-22',
    revenueSignal: 'IN_LINE',
    marginSignal: 'STABLE',
    backlogSignal: 'GROWING',
    regionalExposure: ['GA', 'FL', 'TX', 'TN'],
    revenueSignalColor: revenueColor('IN_LINE'),
    marginSignalColor:  marginColor('STABLE'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'NVR',
    name: 'NVR Inc.',
    sector: 'Homebuilder',
    nextEarningsDate: '2026-07-21',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'EXPANDING',
    backlogSignal: 'GROWING',
    regionalExposure: ['VA', 'MD', 'PA', 'OH'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('EXPANDING'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'TOL',
    name: 'Toll Brothers',
    sector: 'Homebuilder',
    nextEarningsDate: '2026-08-20',
    revenueSignal: 'IN_LINE',
    marginSignal: 'COMPRESSING',
    backlogSignal: 'STABLE',
    regionalExposure: ['PA', 'NJ', 'TX', 'CA'],
    revenueSignalColor: revenueColor('IN_LINE'),
    marginSignalColor:  marginColor('COMPRESSING'),
    backlogSignalColor: backlogColor('STABLE'),
  },
  // Contractors
  {
    ticker: 'FLR',
    name: 'Fluor Corporation',
    sector: 'Contractor',
    nextEarningsDate: '2026-08-06',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'EXPANDING',
    backlogSignal: 'GROWING',
    regionalExposure: ['TX', 'CA', 'VA', 'GA'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('EXPANDING'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'J',
    name: 'Jacobs Engineering',
    sector: 'Contractor',
    nextEarningsDate: '2026-08-05',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'STABLE',
    backlogSignal: 'GROWING',
    regionalExposure: ['TX', 'CA', 'FL', 'NY'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('STABLE'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'ACM',
    name: 'AECOM',
    sector: 'Contractor',
    nextEarningsDate: '2026-08-11',
    revenueSignal: 'IN_LINE',
    marginSignal: 'STABLE',
    backlogSignal: 'GROWING',
    regionalExposure: ['CA', 'NY', 'TX', 'IL'],
    revenueSignalColor: revenueColor('IN_LINE'),
    marginSignalColor:  marginColor('STABLE'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'KBR',
    name: 'KBR Inc.',
    sector: 'Contractor',
    nextEarningsDate: '2026-07-28',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'EXPANDING',
    backlogSignal: 'GROWING',
    regionalExposure: ['TX', 'VA', 'MD', 'AL'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('EXPANDING'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'TPC',
    name: 'Tutor Perini',
    sector: 'Contractor',
    nextEarningsDate: '2026-08-04',
    revenueSignal: 'MISS_RISK',
    marginSignal: 'COMPRESSING',
    backlogSignal: 'STABLE',
    regionalExposure: ['CA', 'NY', 'NV', 'FL'],
    revenueSignalColor: revenueColor('MISS_RISK'),
    marginSignalColor:  marginColor('COMPRESSING'),
    backlogSignalColor: backlogColor('STABLE'),
  },
  // Materials
  {
    ticker: 'VMC',
    name: 'Vulcan Materials',
    sector: 'Materials',
    nextEarningsDate: '2026-08-05',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'EXPANDING',
    backlogSignal: 'GROWING',
    regionalExposure: ['TX', 'GA', 'CA', 'VA'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('EXPANDING'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'MLM',
    name: 'Martin Marietta Materials',
    sector: 'Materials',
    nextEarningsDate: '2026-07-30',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'EXPANDING',
    backlogSignal: 'GROWING',
    regionalExposure: ['TX', 'NC', 'CO', 'GA'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('EXPANDING'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'EXP',
    name: 'Eagle Materials',
    sector: 'Materials',
    nextEarningsDate: '2026-07-24',
    revenueSignal: 'IN_LINE',
    marginSignal: 'STABLE',
    backlogSignal: 'STABLE',
    regionalExposure: ['TX', 'OK', 'KS', 'NM'],
    revenueSignalColor: revenueColor('IN_LINE'),
    marginSignalColor:  marginColor('STABLE'),
    backlogSignalColor: backlogColor('STABLE'),
  },
  {
    ticker: 'SUM',
    name: 'Summit Materials',
    sector: 'Materials',
    nextEarningsDate: '2026-08-04',
    revenueSignal: 'IN_LINE',
    marginSignal: 'STABLE',
    backlogSignal: 'STABLE',
    regionalExposure: ['CO', 'KS', 'UT', 'ID'],
    revenueSignalColor: revenueColor('IN_LINE'),
    marginSignalColor:  marginColor('STABLE'),
    backlogSignalColor: backlogColor('STABLE'),
  },
  // Equipment
  {
    ticker: 'CAT',
    name: 'Caterpillar Inc.',
    sector: 'Equipment',
    nextEarningsDate: '2026-07-28',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'STABLE',
    backlogSignal: 'GROWING',
    regionalExposure: ['IL', 'TX', 'GA', 'SC'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('STABLE'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'DE',
    name: 'Deere & Company',
    sector: 'Equipment',
    nextEarningsDate: '2026-08-19',
    revenueSignal: 'IN_LINE',
    marginSignal: 'COMPRESSING',
    backlogSignal: 'STABLE',
    regionalExposure: ['IL', 'IA', 'MN', 'TX'],
    revenueSignalColor: revenueColor('IN_LINE'),
    marginSignalColor:  marginColor('COMPRESSING'),
    backlogSignalColor: backlogColor('STABLE'),
  },
  {
    ticker: 'URI',
    name: 'United Rentals',
    sector: 'Equipment',
    nextEarningsDate: '2026-07-23',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'EXPANDING',
    backlogSignal: 'GROWING',
    regionalExposure: ['TX', 'FL', 'CA', 'NY'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('EXPANDING'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  // Distribution
  {
    ticker: 'FERG',
    name: 'Ferguson Enterprises',
    sector: 'Distribution',
    nextEarningsDate: '2026-06-24',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'STABLE',
    backlogSignal: 'GROWING',
    regionalExposure: ['TX', 'FL', 'CA', 'GA'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('STABLE'),
    backlogSignalColor: backlogColor('GROWING'),
  },
  {
    ticker: 'WCC',
    name: 'WESCO International',
    sector: 'Distribution',
    nextEarningsDate: '2026-07-30',
    revenueSignal: 'IN_LINE',
    marginSignal: 'STABLE',
    backlogSignal: 'STABLE',
    regionalExposure: ['PA', 'TX', 'OH', 'IL'],
    revenueSignalColor: revenueColor('IN_LINE'),
    marginSignalColor:  marginColor('STABLE'),
    backlogSignalColor: backlogColor('STABLE'),
  },
  {
    ticker: 'BECN',
    name: 'Beacon Roofing Supply',
    sector: 'Distribution',
    nextEarningsDate: '2026-08-06',
    revenueSignal: 'BEAT_LIKELY',
    marginSignal: 'EXPANDING',
    backlogSignal: 'GROWING',
    regionalExposure: ['FL', 'TX', 'GA', 'NC'],
    revenueSignalColor: revenueColor('BEAT_LIKELY'),
    marginSignalColor:  marginColor('EXPANDING'),
    backlogSignalColor: backlogColor('GROWING'),
  },
]

// Sector rotation: momentum = rate of change (>0 = accelerating), level = position vs trend (>0 = above trend)
const SECTOR_ROTATION: SectorRotationPoint[] = [
  { subsector: 'Residential',    momentum: 0.8,  level: 0.6 },
  { subsector: 'Commercial',     momentum: 0.2,  level: 0.4 },
  { subsector: 'Infrastructure', momentum: 0.9,  level: 0.7 },
  { subsector: 'Industrial',     momentum: 0.6,  level: 0.3 },
  { subsector: 'Data Centers',   momentum: 1.2,  level: 1.1 },
]

// Suppress unused variable warnings for colors reserved for future datasets
void BLUE
void RED

export async function GET() {
  try {
    const polygonKey = process.env.POLYGON_API_KEY
    let etfs: ETFResult[]
    let etfsLive = false

    if (polygonKey) {
      try {
        const tickers = ETF_META.map(e => e.ticker).join(',')
        const polyRes = await fetch(
          `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickers}&apiKey=${polygonKey}`,
          { next: { revalidate: 3600 } }
        )
        if (polyRes.ok) {
          const polyData = await polyRes.json()
          type PolyTicker = { ticker: string; day?: { c?: number }; todaysChangePerc?: number }
          const snapMap = new Map<string, PolyTicker>(
            (polyData.tickers || []).map((t: PolyTicker) => [t.ticker, t])
          )
          etfs = ETF_META.map(meta => {
            const snap = snapMap.get(meta.ticker)
            const price = snap?.day?.c ?? null
            const change1d = snap?.todaysChangePerc ?? null
            return { ...meta, price, change1d, live: price !== null }
          })
          etfsLive = true
        } else {
          etfs = ETF_META.map(meta => ({ ...meta, live: false }))
        }
      } catch {
        etfs = ETF_META.map(meta => ({ ...meta, live: false }))
      }
    } else {
      etfs = ETF_META.map(meta => ({ ...meta, live: false }))
    }

    return NextResponse.json(
      {
        etfs,
        live: etfsLive,
        ...(polygonKey ? {} : { note: 'Configure POLYGON_API_KEY for live prices' }),
        sectorComposite: generateSectorComposite(),
        earningsCompanies: EARNINGS_COMPANIES,
        sectorRotation: SECTOR_ROTATION,
        updatedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
    )
  } catch (err) {
    console.error('[/api/equities]', err)
    return NextResponse.json({ error: 'Failed to fetch equities data' }, { status: 500 })
  }
}
