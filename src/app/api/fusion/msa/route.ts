import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { cacheGet, cacheSet, classifyActivity, type Classification } from '../../satellite/_lib'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_KEY   = 'fusion:msa:v1'
const CACHE_HDR   = { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' }

// Quarterly federal construction allocation estimate per state ($M).
// Source: IIJA/IRA stateAllocations from /api/federal, divided by 4.
const STATE_FED_QTR: Record<string, number> = {
  TX:4605, CA:4460, FL:3570, NY:3410, PA:2705, IL:2370, OH:2210, GA:2070,
  NC:1980, MI:1910, WA:1820, AZ:1785, VA:1710, CO:1620, TN:1570, IN:1480,
  WI:1420, MN:1370, SC:1320, MO:1285, AL:1210, LA:1170, MD:1130, OR:1070,
  KY:1035, OK:995,  NV:960,  UT:920,  AR:870,  MS:820,  KS:785,  NM:745,
  NE:710,  IA:695,  ID:620,  CT:595,  MT:545,  WV:520,  HI:495,  NH:460,
  ME:430,  SD:395,  ND:370,  RI:345,  DE:320,  AK:295,  VT:270,  WY:245,
  MA:2105, DC:710,  NJ:1520,
}

const STORM_EVENTS = [
  'Tornado Warning', 'Tornado Watch',
  'Hurricane Warning', 'Hurricane Watch', 'Tropical Storm Warning',
  'Flood Warning', 'Flash Flood Warning', 'Areal Flood Warning',
  'Severe Thunderstorm Warning', 'Winter Storm Warning', 'Blizzard Warning',
]

async function fetchStormCount(state: string): Promise<number> {
  try {
    const r = await fetch(
      `https://api.weather.gov/alerts/active?area=${state}`,
      { headers: { Accept: 'application/geo+json' }, signal: AbortSignal.timeout(5000) },
    )
    if (!r.ok) return 0
    const data = await r.json()
    return (data.features ?? []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any) => STORM_EVENTS.some(evt => (f.properties?.event ?? '').includes(evt.split(' ')[0]))
    ).length
  } catch {
    return 0
  }
}

function buildInterpretation(cls: Classification, change: number | null, fed: number, storms: number): string {
  const chg = change?.toFixed(1) ?? '—'
  switch (cls) {
    case 'RECONSTRUCTION':
      return `Elevated ground disturbance (+${chg}% BSI) consistent with post-storm debris removal and reconstruction. ${storms} active severe weather alert${storms !== 1 ? 's' : ''} detected in region.`
    case 'FEDERAL_INVESTMENT':
      return `Ground activity (+${chg}% BSI) aligned with federal construction awards ($${Math.round(fed)}M estimated in region). IIJA/IRA infrastructure investment is the likely driver.`
    case 'DEMAND_DRIVEN':
      return `Strong organic construction demand (+${chg}% BSI). No storm or federal drivers detected. Likely private residential or commercial development.`
    case 'ORGANIC_GROWTH':
      return `Moderate construction activity (+${chg}% BSI) with mixed public and private drivers.`
    case 'LOW_ACTIVITY':
      return `Low ground disturbance signal (${chg}% BSI change). Construction activity is within normal seasonal variation.`
    default:
      return 'Insufficient satellite data to classify construction activity. Cloud cover or scene availability may be limiting analysis.'
  }
}

interface BsiRow {
  msa_code: string
  observation_date: string
  bsi_mean: number | null
  bsi_change_90d: number | null
  bsi_change_yoy: number | null
  cloud_cover_pct: number | null
  valid_pixels: number | null
  total_pixels: number | null
  confidence: string | null
  false_positive_flags: string[] | null
  msa_boundaries: {
    msa_name: string
    state_codes: string[]
    bbox_west: number
    bbox_south: number
    bbox_east: number
    bbox_north: number
  } | null
}

export async function GET() {
  try {
    const cached = await cacheGet<object>(CACHE_KEY)
    if (cached) return NextResponse.json(cached, { headers: CACHE_HDR })

    // Latest BSI per MSA
    const { data, error } = await supabase
      .from('satellite_bsi')
      .select(`
        msa_code, observation_date, bsi_mean, bsi_change_90d, bsi_change_yoy,
        cloud_cover_pct, valid_pixels, total_pixels, confidence, false_positive_flags,
        msa_boundaries (
          msa_name, state_codes,
          bbox_west, bbox_south, bbox_east, bbox_north
        )
      `)
      .order('msa_code', { ascending: true })
      .order('observation_date', { ascending: false })

    if (error) {
      console.error('[/api/fusion/msa]', error.message)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    // Dedup — latest per MSA
    const seen = new Set<string>()
    const latest = (data as unknown as BsiRow[]).filter(row => {
      if (seen.has(row.msa_code)) return false
      seen.add(row.msa_code)
      return true
    })

    if (latest.length === 0) {
      return NextResponse.json(
        { processing_status: 'pending_first_run', msas: [], msa_count: 0, ranked_by_activity: [] },
        { headers: CACHE_HDR },
      )
    }

    // Fetch storm counts for unique primary states in parallel
    const uniqueStates = [...new Set(latest.flatMap(r => r.msa_boundaries?.state_codes?.slice(0, 1) ?? []))]
    const stormCounts  = await Promise.all(uniqueStates.map(s => fetchStormCount(s)))
    const stormByState = Object.fromEntries(uniqueStates.map((s, i) => [s, stormCounts[i]]))

    // Build fusion results
    const msas = latest.map(row => {
      const states   = row.msa_boundaries?.state_codes ?? []
      const fedTotal = states.reduce((sum, s) => sum + (STATE_FED_QTR[s] ?? 0), 0)
      const storms   = states.reduce((sum, s) => sum + (stormByState[s] ?? 0), 0)

      const classification = classifyActivity(row.bsi_change_90d, fedTotal, storms)
      const interpretation = buildInterpretation(classification, row.bsi_change_90d, fedTotal, storms)

      return {
        msa_code: row.msa_code,
        msa_name: row.msa_boundaries?.msa_name ?? row.msa_code,
        state_codes: states,
        bbox: row.msa_boundaries
          ? { west: row.msa_boundaries.bbox_west, south: row.msa_boundaries.bbox_south,
              east: row.msa_boundaries.bbox_east, north: row.msa_boundaries.bbox_north }
          : null,
        observation_date: row.observation_date,
        bsi_mean: row.bsi_mean,
        bsi_change_90d: row.bsi_change_90d,
        bsi_change_yoy: row.bsi_change_yoy,
        cloud_cover_pct: row.cloud_cover_pct,
        confidence: row.confidence,
        false_positive_flags: row.false_positive_flags ?? [],
        classification,
        interpretation,
        federal_awards_90d: fedTotal,
        storm_events_90d: storms,
      }
    })

    // Upsert to signal_fusion for persistence
    const fusionRows = msas.map(m => ({
      msa_code:           m.msa_code,
      computed_at:        new Date().toISOString(),
      bsi_change_90d:     m.bsi_change_90d,
      federal_awards_90d: m.federal_awards_90d,
      storm_events_90d:   m.storm_events_90d,
      classification:     m.classification,
      confidence:         m.confidence,
      interpretation:     m.interpretation,
    }))
    // Fire-and-forget — don't block the response on this write
    supabaseAdmin.from('signal_fusion').upsert(fusionRows).then(({ error: e }) => {
      if (e) console.error('[fusion/msa] signal_fusion upsert:', e.message)
    })

    const ranked_by_activity = [...msas]
      .filter(m => m.bsi_change_90d !== null)
      .sort((a, b) => (b.bsi_change_90d ?? 0) - (a.bsi_change_90d ?? 0))
      .map(m => m.msa_code)

    const last_processed = latest.reduce(
      (max, r) => (r.observation_date > max ? r.observation_date : max),
      latest[0].observation_date,
    )

    const response = { processing_status: 'live' as const, last_processed, msa_count: msas.length, msas, ranked_by_activity }
    await cacheSet(CACHE_KEY, response)
    return NextResponse.json(response, { headers: CACHE_HDR })
  } catch (err) {
    console.error('[/api/fusion/msa]', err)
    return NextResponse.json({ error: 'Failed to compute signal fusion' }, { status: 500 })
  }
}
