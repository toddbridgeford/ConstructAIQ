import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

// SAM.gov construction NAICS codes
const NAICS_CODES = '236115,236116,236117,236118,236210,236220,237110,237120,237130,237210,237310,237990,238110,238120,238130,238140,238150,238160,238170,238190,238210,238220,238290,238310,238320,238330,238340,238350,238390,238910,238990'

// SAM.gov solicitation types: o=Solicitation, p=Presolicitation, k=Combined, r=Sources Sought
const PTYPE = 'o,p,k,r'

interface SamOpportunity {
  noticeId:         string
  title:            string
  fullParentPathName?: string
  organizationName?: string
  officeAddress?:   { state?: string }
  placeOfPerformance?: { state?: { code?: string } }
  naicsCode?:       string
  postedDate?:      string
  responseDeadLine?: string
  awardDate?:       string
  amount?:          number | string
  typeOfSetAside?:  string
  type?:            string
  active?:          string
  awardNumber?:     string
}

function parseDate(s: string | undefined): string | null {
  if (!s) return null
  try {
    const d = new Date(s)
    if (isNaN(d.getTime())) return null
    return d.toISOString().split('T')[0]
  } catch { return null }
}

function parseValue(v: number | string | undefined): number | null {
  if (v === undefined || v === null) return null
  const n = typeof v === 'string' ? parseFloat(v.replace(/[^0-9.]/g, '')) : v
  return isNaN(n) ? null : Math.round(n)
}

function deriveStatus(opp: SamOpportunity): string {
  if (opp.active === 'No') return 'CLOSED'
  if (opp.awardNumber)    return 'AWARDED'
  return 'OPEN'
}

function normalizeOpportunity(opp: SamOpportunity) {
  const stateCode =
    opp.placeOfPerformance?.state?.code ??
    opp.officeAddress?.state ??
    null

  const agency =
    opp.organizationName ??
    opp.fullParentPathName?.split('::')[0]?.trim() ??
    'Unknown Agency'

  const office =
    opp.fullParentPathName?.split('::').pop()?.trim() ?? null

  return {
    notice_id:       opp.noticeId,
    title:           opp.title ?? 'Untitled',
    agency,
    office,
    state_code:      stateCode,
    naics:           opp.naicsCode ?? null,
    posted_date:     parseDate(opp.postedDate) ?? new Date().toISOString().split('T')[0],
    response_due:    parseDate(opp.responseDeadLine),
    award_date:      parseDate(opp.awardDate),
    estimated_value: parseValue(opp.amount),
    contract_type:   opp.type ?? null,
    status:          deriveStatus(opp),
    award_notice_id: opp.awardNumber ?? null,
    fetched_at:      new Date().toISOString(),
  }
}

export async function GET(request: Request) {
  const auth   = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET || ''
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.SAM_GOV_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      status:  'skipped',
      message: 'SAM_GOV_API_KEY not configured — solicitations feed is empty',
      upserted: 0,
    })
  }

  const params = new URLSearchParams({
    api_key:          apiKey,
    naics:            NAICS_CODES,
    ptype:            PTYPE,
    dateRange:        'activeInLastDays',
    activeInLastDays: '7',
    limit:            '100',
  })

  const url = `https://api.sam.gov/opportunities/v2/search?${params.toString()}`

  let raw: SamOpportunity[] = []
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal:  AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[cron/solicitations] SAM.gov error', res.status, body.slice(0, 200))
      return NextResponse.json({
        status:  'error',
        message: `SAM.gov returned HTTP ${res.status}`,
        upserted: 0,
      }, { status: 502 })
    }
    const json = await res.json() as { opportunitiesData?: SamOpportunity[] }
    raw = json.opportunitiesData ?? []
  } catch (err) {
    console.error('[cron/solicitations] fetch error:', err)
    return NextResponse.json({
      status:   'error',
      message:  String(err),
      upserted: 0,
    }, { status: 502 })
  }

  if (!raw.length) {
    return NextResponse.json({ status: 'ok', upserted: 0, message: 'No opportunities returned from SAM.gov' })
  }

  const rows = raw.map(normalizeOpportunity)

  const { error, count } = await supabaseAdmin
    .from('federal_solicitations')
    .upsert(rows, { onConflict: 'notice_id', count: 'exact' })

  if (error) {
    console.error('[cron/solicitations] upsert error:', error)
    return NextResponse.json({ status: 'error', message: error.message, upserted: 0 }, { status: 500 })
  }

  return NextResponse.json({
    status:   'ok',
    fetched:  raw.length,
    upserted: count ?? rows.length,
    asOf:     new Date().toISOString(),
  })
}
