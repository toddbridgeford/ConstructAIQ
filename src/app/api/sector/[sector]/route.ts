import { NextResponse } from 'next/server'
import { getLatestObs } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Types ──────────────────────────────────────────────────────────────────

export type SectorId = 'residential' | 'commercial' | 'infrastructure' | 'industrial'
export type Verdict   = 'EXPANDING' | 'STABLE' | 'CONTRACTING'
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface PrimarySignal {
  id:        string
  label:     string
  value:     string
  yoy:       number | null
  direction: 'UP' | 'DOWN' | 'FLAT'
  note?:     string
}

export interface SectorResponse {
  sector:             SectorId
  verdict:            Verdict
  verdict_confidence: Confidence
  headline:           string
  primary_signals:    PrimarySignal[]
  as_of:              string
}

// ── Extra seed data for series not in /api/obs ─────────────────────────────
// 24 monthly values Jan 2024 – Dec 2025

const EXTRA_SEED: Record<string, number[]> = {
  // Residential 30-yr fixed mortgage rate (%)
  MORTGAGE30US: [
    6.66,6.78,6.94,7.02,7.09,6.87,6.73,6.60,6.72,6.85,6.81,6.61,
    6.64,6.72,6.83,7.04,7.08,6.92,6.78,6.71,6.89,6.93,6.85,6.74,
  ],
  // PPI Lumber and wood products index (nominal)
  PPI_LUMBER: [
    182,178,183,188,192,196,201,198,194,191,188,186,
    184,188,193,198,203,207,212,208,204,200,196,192,
  ],
  // PPI Steel mill products index (nominal)
  PPI_STEEL: [
    284,278,272,268,264,261,258,262,267,271,275,278,
    282,279,276,272,269,265,262,259,256,260,264,268,
  ],
  // Nonresidential construction spending proxy (TLRESCONS complement)
  // = TTLCONS minus approx residential; we bake in the nonres share directly
  NONRES_SPEND: [
    1240,1235,1248,1252,1245,1248,1251,1247,1245,1242,1234,1230,
    1225,1215,1218,1214,1222,1228,1236,1228,1226,1234,1244,1238,
  ],
  // Architecture Billings Index proxy (50 = neutral; > 50 = expansion)
  ABI_PROXY: [
    49,51,52,50,48,47,48,50,52,51,50,49,
    48,49,50,51,52,53,52,50,49,50,51,52,
  ],
}

// Baked-in SEED_24 values from /api/obs (mirrors that file)
const OBS_SEED: Record<string, number[]> = {
  TTLCONS: [
    2184.6,2174.9,2206.5,2215.4,2199.8,2200.7,2205.3,2197.9,2197.1,2192.9,2176.6,2169.6,
    2165.4,2150.8,2153.4,2149.1,2160.7,2168.5,2177.2,2169.5,2167.9,2181.2,2197.6,2190.4,
  ],
  CES2000000001: [
    8170,8176,8196,8208,8236,8254,8262,8267,8276,8264,8267,8273,
    8271,8269,8267,8261,8239,8255,8243,8279,8272,8317,8304,8330,
  ],
  HOUST: [
    1552,1312,1385,1316,1327,1265,1391,1357,1352,1295,1514,1358,
    1490,1355,1398,1282,1382,1420,1291,1328,1272,1324,1387,1487,
  ],
  PERMIT: [
    1577,1476,1459,1407,1461,1436,1476,1434,1428,1508,1480,1460,
    1454,1481,1422,1394,1393,1362,1330,1415,1411,1388,1455,1386,
  ],
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchObs(series: string, n = 24): Promise<number[]> {
  try {
    const rows = await getLatestObs(series, n)
    if (rows.length > 0) return rows.map(r => Number(r.value))
  } catch { /* fall through */ }
  const seed = OBS_SEED[series] ?? EXTRA_SEED[series]
  return seed ? seed.slice(-n) : []
}

function yoyPct(vals: number[]): number | null {
  if (vals.length < 13) return null
  const curr = vals[vals.length - 1]
  const prev = vals[vals.length - 13]
  if (!prev) return null
  return ((curr - prev) / prev) * 100
}

function momPct(vals: number[]): number | null {
  if (vals.length < 2) return null
  const c = vals[vals.length - 1]
  const p = vals[vals.length - 2]
  if (!p) return null
  return ((c - p) / p) * 100
}

function direction(pct: number | null): 'UP' | 'DOWN' | 'FLAT' {
  if (pct === null) return 'FLAT'
  if (pct > 0.5)   return 'UP'
  if (pct < -0.5)  return 'DOWN'
  return 'FLAT'
}

function scoreVerdict(scores: number[]): Verdict {
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length
  if (avg > 0.4)  return 'EXPANDING'
  if (avg < -0.4) return 'CONTRACTING'
  return 'STABLE'
}

function confidence(scores: number[]): Confidence {
  const spread = Math.max(...scores) - Math.min(...scores)
  if (spread < 0.5) return 'HIGH'
  if (spread < 1.2) return 'MEDIUM'
  return 'LOW'
}

function fmtRate(v: number): string { return `${v.toFixed(2)}%` }
function fmtPPI(v: number): string  { return v.toFixed(1) }
function fmtK(v: number): string    { return `${(v / 1000).toFixed(1)}K` }
function fmtB(v: number): string    { return `$${v.toFixed(1)}B` }

// Each signal's YoY mapped to a -1..+1 score for verdict computation
function signalScore(yoy: number | null): number {
  if (yoy === null) return 0
  return Math.max(-1, Math.min(1, yoy / 10))
}

const AS_OF = '2025-12-01'

// ── Sector builders ────────────────────────────────────────────────────────

async function residential(): Promise<SectorResponse> {
  const [houst, permit, mortgage, lumber] = await Promise.all([
    fetchObs('HOUST'),
    fetchObs('PERMIT'),
    fetchObs('MORTGAGE30US'),
    fetchObs('PPI_LUMBER'),
  ])

  const houstYoy   = yoyPct(houst)
  const permitYoy  = yoyPct(permit)
  const mortgageMom = momPct(mortgage)
  const lumberYoy   = yoyPct(lumber)

  const mortgageScore = mortgage.length > 0
    ? Math.max(-1, Math.min(1, -(mortgage[mortgage.length - 1] - 6.5) / 2))
    : 0

  const scores = [
    signalScore(houstYoy),
    signalScore(permitYoy),
    mortgageScore,
    signalScore(lumberYoy ? -lumberYoy : null),
  ]
  const verd = scoreVerdict(scores)
  const conf = confidence(scores)

  const mortgageCur = mortgage[mortgage.length - 1] ?? 6.74
  const lumberCur   = lumber[lumber.length - 1]   ?? 192
  const houstCur    = houst[houst.length - 1]     ?? 1400
  const permitCur   = permit[permit.length - 1]   ?? 1386

  const headline = (() => {
    if (verd === 'CONTRACTING')
      return `Rate headwinds persisting — housing starts below 2021 levels at ${fmtK(houstCur)}`
    if (verd === 'EXPANDING')
      return `Residential cycle gaining momentum — permits up ${permitYoy?.toFixed(1) ?? '—'}% YoY`
    return `Residential market stabilizing — starts flat, permits near cycle average`
  })()

  return {
    sector: 'residential',
    verdict: verd,
    verdict_confidence: conf,
    headline,
    primary_signals: [
      {
        id: 'HOUST', label: 'Housing Starts',
        value: fmtK(houstCur),
        yoy: houstYoy,
        direction: direction(houstYoy),
        note: 'Annualized, thousands of units',
      },
      {
        id: 'PERMIT', label: 'Building Permits',
        value: fmtK(permitCur),
        yoy: permitYoy,
        direction: direction(permitYoy),
        note: 'Annualized, thousands of units',
      },
      {
        id: 'MORTGAGE30US', label: '30-yr Mortgage Rate',
        value: fmtRate(mortgageCur),
        yoy: null,
        direction: direction(-(mortgageMom ?? 0)),
        note: 'Primary affordability headwind',
      },
      {
        id: 'PPI_LUMBER', label: 'Lumber PPI',
        value: fmtPPI(lumberCur),
        yoy: lumberYoy,
        direction: direction(lumberYoy),
        note: 'Cost pressure index',
      },
    ],
    as_of: AS_OF,
  }
}

async function commercial(): Promise<SectorResponse> {
  const [ttlcons, nonres, permits, abi] = await Promise.all([
    fetchObs('TTLCONS'),
    fetchObs('NONRES_SPEND'),
    fetchObs('PERMIT'),
    fetchObs('ABI_PROXY'),
  ])

  const ttlYoy    = yoyPct(ttlcons)
  const nonresYoy = yoyPct(nonres)
  const permitYoy = yoyPct(permits)
  const abiCur    = abi[abi.length - 1] ?? 51
  const abiScore  = (abiCur - 50) / 10

  const scores = [
    signalScore(ttlYoy),
    signalScore(nonresYoy),
    signalScore(permitYoy),
    Math.max(-1, Math.min(1, abiScore)),
  ]
  const verd = scoreVerdict(scores)
  const conf = confidence(scores)

  const ttlCur   = ttlcons.length > 0
    ? ttlcons[ttlcons.length - 1]
    : null
  const nonrCur  = nonres[nonres.length - 1]   ?? 1238

  const headline = (() => {
    if (verd === 'EXPANDING')
      return `Nonresidential spending expanding — ABI at ${abiCur}, office/industrial leading`
    if (verd === 'CONTRACTING')
      return `Commercial activity softening — office vacancy constraining new starts`
    return `Commercial construction stable — nonresidential at $${(nonrCur / 1000).toFixed(2)}T`
  })()

  return {
    sector: 'commercial',
    verdict: verd,
    verdict_confidence: conf,
    headline,
    primary_signals: [
      {
        id: 'TTLCONS', label: 'Total Construction',
        value: ttlCur !== null ? fmtB(ttlCur / 1000) : '—',
        yoy: ttlYoy,
        direction: direction(ttlYoy),
        note: 'Annualized, trillions',
      },
      {
        id: 'NONRES_SPEND', label: 'Nonresidential Spend',
        value: `$${(nonrCur / 1000).toFixed(2)}T`,
        yoy: nonresYoy,
        direction: direction(nonresYoy),
        note: 'Total less residential',
      },
      {
        id: 'PERMIT_COMM', label: 'Commercial Permits',
        value: `${permits[permits.length - 1]?.toFixed(0) ?? '—'}K`,
        yoy: permitYoy,
        direction: direction(permitYoy),
        note: 'All permit classes, annualized',
      },
      {
        id: 'ABI_PROXY', label: 'Arch. Billings Index',
        value: abiCur.toFixed(0),
        yoy: null,
        direction: abiCur >= 51 ? 'UP' : abiCur <= 49 ? 'DOWN' : 'FLAT',
        note: '> 50 = expansion; ABI proxy via CSHI',
      },
    ],
    as_of: AS_OF,
  }
}

async function infrastructure(): Promise<SectorResponse> {
  // Pull federal data inline — mirrors what /api/federal returns
  const TOTAL_AUTHORIZED = 874200
  const TOTAL_OBLIGATED  = 550200
  const oblRate          = (TOTAL_OBLIGATED / TOTAL_AUTHORIZED) * 100

  // IIJA/IRA obligation velocity — higher is better; baseline is 50%
  const oblScore = Math.max(-1, Math.min(1, (oblRate - 50) / 30))

  // Employment in heavy/civil engineering (CES2000000001 proxy)
  const emp    = await fetchObs('CES2000000001')
  const empYoy = yoyPct(emp)
  const empCur = emp.length > 0
    ? emp[emp.length - 1]
    : null

  const scores = [oblScore, signalScore(empYoy), oblScore]
  const verd   = scoreVerdict(scores)
  const conf   = confidence(scores)

  const headline = (() => {
    if (verd === 'EXPANDING')
      return `Federal infrastructure at ${oblRate.toFixed(0)}% obligation rate — IIJA cycle driving heavy civil demand`
    if (verd === 'CONTRACTING')
      return `Infrastructure momentum slowing — obligation pace below historical average`
    return `Infrastructure stable — $${(TOTAL_OBLIGATED / 1000).toFixed(0)}B obligated of $${(TOTAL_AUTHORIZED / 1000).toFixed(0)}B authorized`
  })()

  return {
    sector: 'infrastructure',
    verdict: verd,
    verdict_confidence: conf,
    headline,
    primary_signals: [
      {
        id: 'FEDERAL_TOTAL', label: 'Federal Awards',
        value: `$${(TOTAL_OBLIGATED / 1000).toFixed(0)}B`,
        yoy: null,
        direction: 'UP',
        note: 'IIJA + IRA total obligated',
      },
      {
        id: 'OBL_RATE', label: 'Obligation Rate',
        value: `${oblRate.toFixed(1)}%`,
        yoy: null,
        direction: oblRate >= 65 ? 'UP' : 'FLAT',
        note: 'Share of authorized funds obligated',
      },
      {
        id: 'CES2000000001', label: 'Const. Employment',
        value: empCur !== null ? `${(empCur / 1000).toFixed(1)}M` : '—',
        yoy: empYoy,
        direction: direction(empYoy),
        note: 'BLS construction employment',
      },
      {
        id: 'HIGHWAY_ALLOC', label: 'Highway / Bridge',
        value: `$${((74800 + 24200) / 1000).toFixed(1)}B`,
        yoy: null,
        direction: 'UP',
        note: 'IIJA highway + bridge obligated',
      },
    ],
    as_of: AS_OF,
  }
}

async function industrial(): Promise<SectorResponse> {
  const [permits, steel] = await Promise.all([
    fetchObs('PERMIT'),
    fetchObs('PPI_STEEL'),
  ])

  const permitYoy = yoyPct(permits)
  const steelYoy  = yoyPct(steel)
  const steelCur  = steel[steel.length - 1] ?? 268

  // Industrial favors falling steel (lower cost pressure = good)
  const steelScore = signalScore(steelYoy ? -steelYoy : null)
  const scores = [signalScore(permitYoy), steelScore, steelScore]
  const verd   = scoreVerdict(scores)
  const conf   = confidence(scores)

  const permitCur = permits[permits.length - 1] ?? 1386

  const headline = (() => {
    if (verd === 'EXPANDING')
      return `Industrial construction expanding — warehouse and data center demand driving commercial permits`
    if (verd === 'CONTRACTING')
      return `Industrial activity moderating — steel cost pressure and permit softness`
    return `Industrial sector stable — steel at PPI ${steelCur.toFixed(0)}, permits near trend`
  })()

  return {
    sector: 'industrial',
    verdict: verd,
    verdict_confidence: conf,
    headline,
    primary_signals: [
      {
        id: 'PERMIT', label: 'Building Permits',
        value: `${(permitCur / 1000).toFixed(1)}K`,
        yoy: permitYoy,
        direction: direction(permitYoy),
        note: 'Industrial + commercial permit indicator',
      },
      {
        id: 'PPI_STEEL', label: 'Steel PPI',
        value: fmtPPI(steelCur),
        yoy: steelYoy,
        direction: direction(steelYoy),
        note: 'Dominant industrial material cost',
      },
      {
        id: 'WAREHOUSE_INDICATOR', label: 'Warehouse Demand',
        value: 'Elevated',
        yoy: null,
        direction: 'UP',
        note: 'E-commerce + nearshoring cycle',
      },
      {
        id: 'WARN_INDUSTRIAL', label: 'WARN Act — Industrial',
        value: 'Monitor',
        yoy: null,
        direction: 'FLAT',
        note: 'NAICS 31–33 layoff filings',
      },
    ],
    as_of: AS_OF,
  }
}

// ── Route handler ──────────────────────────────────────────────────────────

const BUILDERS: Record<SectorId, () => Promise<SectorResponse>> = {
  residential:    residential,
  commercial:     commercial,
  infrastructure: infrastructure,
  industrial:     industrial,
}

const VALID_SECTORS: SectorId[] = ['residential', 'commercial', 'infrastructure', 'industrial']

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sector: string }> }
) {
  const { sector } = await params
  const id = sector?.toLowerCase() as SectorId

  if (!VALID_SECTORS.includes(id)) {
    return NextResponse.json({ error: `Unknown sector: ${sector}` }, { status: 404 })
  }

  try {
    const data = await BUILDERS[id]()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error(`[/api/sector/${sector}]`, err)
    return NextResponse.json({ error: 'Sector data unavailable' }, { status: 500 })
  }
}
