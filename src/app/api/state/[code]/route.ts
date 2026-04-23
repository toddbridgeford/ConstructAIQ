import { NextResponse } from 'next/server'
import { STATE_NAMES } from '@/lib/state-names'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

// ── City → State mapping for permit filtering ────────────────
// Maps permit city_code to its 2-letter state code
const CITY_STATE: Record<string, string> = {
  NYC:'NY', LAX:'CA', CHI:'IL', HOU:'TX', PHX:'AZ',
  PHL:'PA', SAN:'CA', DAL:'TX', SJC:'CA', AUS:'TX',
  JAX:'FL', FTW:'TX', CLB:'OH', CHA:'NC', IND:'IN',
  SFO:'CA', SEA:'WA', DEN:'CO', NAS:'TN', OKC:'OK',
  ELP:'TX', BOS:'MA', LVG:'NV', MEM:'TN', LOU:'KY',
  BAL:'MD', MIL:'WI', ABQ:'NM', TUC:'AZ', FRE:'CA',
  SAC:'CA', MES:'AZ', KCM:'MO', ATL:'GA', OMA:'NE',
  CLV:'OH', RAL:'NC', MIA:'FL', VBH:'VA', MIN:'MN',
  TAM:'FL', ORL:'FL', ARL:'TX', BKN:'NY',
}

// ── MSA → State mapping for satellite filtering ──────────────
const MSA_STATE: Record<string, string[]> = {
  NYC:['NY','NJ'], LAX:['CA'], CHI:['IL','IN'],
  DFW:['TX'], HOU:['TX'], PHX:['AZ'], PHL:['PA','NJ'],
  ATL:['GA'], MIA:['FL'], SEA:['WA'], DEN:['CO'],
  BOS:['MA'], TPA:['FL'], SAN:['CA'], LAS:['NV'],
  MSP:['MN'], ORL:['FL'], STL:['MO','IL'],
  CLT:['NC'], AUS:['TX'],
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params
  const code = rawCode.toUpperCase()
  const stateName = STATE_NAMES[code]
  if (!stateName) {
    return NextResponse.json(
      { error: `Unknown state code: ${code}` },
      { status: 404 },
    )
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ??
    'https://constructaiq.trade'

  // ── Parallel fetch all data sources ─────────────────────────
  const [fedRes, satRes, warnRes, permitsRes] =
    await Promise.allSettled([
      fetch(`${base}/api/federal`,  { cache: 'no-store' }),
      fetch(`${base}/api/satellite`, { cache: 'no-store' }),
      fetch(`${base}/api/warn`,      { cache: 'no-store' }),
      fetch(`${base}/api/permits`,   { cache: 'no-store' }),
    ])

  // ── Federal ──────────────────────────────────────────────────
  let federalAwardsTotal = 0
  let federalAwardsRank  = 0
  let federalYoy         = 0

  if (fedRes.status === 'fulfilled' && fedRes.value.ok) {
    type FedData = {
      stateAllocations?: Array<{
        state: string
        obligated: number
        yoy?: number
      }>
    }
    const fedData = (await fedRes.value.json()) as FedData
    const allocs  = fedData.stateAllocations ?? []
    const mine    = allocs.find(a => a.state === code)
    if (mine) {
      federalAwardsTotal = mine.obligated ?? 0
      federalYoy         = mine.yoy ?? 0
      const sorted = [...allocs].sort(
        (a, b) => (b.obligated ?? 0) - (a.obligated ?? 0)
      )
      federalAwardsRank =
        sorted.findIndex(a => a.state === code) + 1
    }
  }

  // ── Satellite ────────────────────────────────────────────────
  type MsaRow = {
    msa_code: string
    classification: string
    bsi_change_90d: number | null
  }
  let satelliteMsas:          string[]  = []
  let dominantSatelliteClass: string    = 'UNKNOWN'

  if (satRes.status === 'fulfilled' && satRes.value.ok) {
    type SatData = { msas?: MsaRow[] }
    const satData = (await satRes.value.json()) as SatData
    const msas    = satData.msas ?? []
    const mine    = msas.filter(m =>
      (MSA_STATE[m.msa_code] ?? []).includes(code)
    )
    satelliteMsas = mine.map(m => m.msa_code)
    const demandDriven = mine.filter(
      m => m.classification === 'DEMAND_DRIVEN'
    )
    if (demandDriven.length > 0)
      dominantSatelliteClass = 'DEMAND_DRIVEN'
    else if (mine.length > 0)
      dominantSatelliteClass = mine[0].classification
  }

  // ── WARN ─────────────────────────────────────────────────────
  let warnNotices30d = 0

  if (warnRes.status === 'fulfilled' && warnRes.value.ok) {
    type WarnData = {
      notices?: Array<{ state: string; filed_date?: string }>
    }
    const warnData = (await warnRes.value.json()) as WarnData
    const cutoff   = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    warnNotices30d = (warnData.notices ?? []).filter(n => {
      if (n.state !== code) return false
      if (!n.filed_date) return true
      return new Date(n.filed_date) >= cutoff
    }).length
  }

  // ── Permits ──────────────────────────────────────────────────
  let cities:      string[] = []
  let permitTrend: string   = 'UNKNOWN'

  if (permitsRes.status === 'fulfilled' && permitsRes.value.ok) {
    type PermitData = {
      cities?: Array<{
        city_code: string
        yoy_change_pct?: number
      }>
    }
    const pd       = (await permitsRes.value.json()) as PermitData
    const allCities = pd.cities ?? []
    const mine      = allCities.filter(
      c => CITY_STATE[c.city_code] === code
    )
    cities = mine.map(c => c.city_code)

    if (mine.length > 0) {
      const avgYoy = mine.reduce(
        (s, c) => s + (c.yoy_change_pct ?? 0), 0
      ) / mine.length
      permitTrend =
        avgYoy > 3  ? 'GROWING'
        : avgYoy < -3 ? 'DECLINING'
        : 'STABLE'
    }
  }

  // ── Score → Verdict ──────────────────────────────────────────
  let score = 0
  const nationalAvgObligated = 2000 // $M rough national average
  if (federalAwardsTotal > nationalAvgObligated * 1.1) score += 2
  else if (federalAwardsTotal < nationalAvgObligated * 0.9) score -= 1

  if (permitTrend === 'GROWING')   score += 2
  if (permitTrend === 'DECLINING') score -= 1

  if (dominantSatelliteClass === 'DEMAND_DRIVEN') score += 1

  if (warnNotices30d > 3) score -= 2

  const verdict =
    score >= 3 ? 'EXPANDING'
    : score <= -2 ? 'CONTRACTING'
    : 'STABLE'

  return NextResponse.json({
    state_code:               code,
    state_name:               stateName,
    verdict,
    federal_awards_rank:      federalAwardsRank,
    federal_awards_total:     federalAwardsTotal,
    federal_yoy:              federalYoy,
    cities,
    permit_trend:             permitTrend,
    satellite_msas:           satelliteMsas,
    dominant_satellite_class: dominantSatelliteClass,
    warn_notices_30d:         warnNotices30d,
    as_of:                    new Date().toISOString().split('T')[0],
  })
}
