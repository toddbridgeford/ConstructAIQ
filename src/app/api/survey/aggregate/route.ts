import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── types ────────────────────────────────────────────────────────────────────

interface Response {
  backlog_outlook:    number
  margin_outlook:     number
  labor_availability: number
  market_outlook:     number
  material_concern:   string
  revenue_band:       string
  region:             string
  work_type:          string
}

type Dist5 = Record<string, number>
type MaterialDist = Record<string, number>
type CrossTabEntry = { backlog_net: number; margin_net: number; labor_net: number; market_net: number; n: number }
type CrossTab = Record<string, CrossTabEntry>

// ─── aggregation helpers ──────────────────────────────────────────────────────

function netScore(vals: number[]): number {
  if (!vals.length) return 0
  const n     = vals.length
  const pos   = vals.filter(v => v >= 4).length
  const neg   = vals.filter(v => v <= 2).length
  return Math.round(((pos - neg) / n) * 100 * 10) / 10
}

function dist5(vals: number[]): Dist5 {
  const n   = vals.length
  const out: Dist5 = {}
  for (let i = 1; i <= 5; i++) {
    const cnt = vals.filter(v => v === i).length
    out[String(i)] = n ? Math.round((cnt / n) * 1000) / 10 : 0
  }
  return out
}

function materialDist(vals: string[]): MaterialDist {
  const n   = vals.length
  const out: MaterialDist = {}
  const cats = ['none', 'lumber', 'steel', 'concrete', 'copper', 'fuel', 'other']
  for (const cat of cats) {
    const cnt = vals.filter(v => v === cat).length
    out[cat] = n ? Math.round((cnt / n) * 1000) / 10 : 0
  }
  return out
}

function crossTab(rows: Response[], groupKey: keyof Response): CrossTab {
  const groups = new Map<string, Response[]>()
  for (const r of rows) {
    const key = String(r[groupKey])
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  const out: CrossTab = {}
  groups.forEach((members, key) => {
    out[key] = {
      backlog_net: netScore(members.map(m => m.backlog_outlook)),
      margin_net:  netScore(members.map(m => m.margin_outlook)),
      labor_net:   netScore(members.map(m => m.labor_availability)),
      market_net:  netScore(members.map(m => m.market_outlook)),
      n: members.length,
    }
  })
  return out
}

// Normalise quarter param: '2025-Q2' → 'Q2 2025', 'Q2 2025' → 'Q2 2025'
function normaliseQuarter(q: string): string {
  const match = q.match(/^(\d{4})-Q(\d)$/)
  if (match) return `Q${match[2]} ${match[1]}`
  return q
}

// ─── route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const cronSecret = process.env.CRON_SECRET ?? ''

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let quarter: string
  try {
    const body = await request.json()
    quarter = normaliseQuarter(String(body?.quarter ?? ''))
    if (!quarter) throw new Error('quarter required')
  } catch {
    return NextResponse.json({ error: 'Body must be JSON with { quarter }' }, { status: 400 })
  }

  try {
    // ── 1. Resolve period ────────────────────────────────────────────────────
    const { data: period, error: pErr } = await supabaseAdmin
      .from('survey_periods')
      .select('id, quarter, closes_at')
      .eq('quarter', quarter)
      .single()

    if (pErr || !period) {
      return NextResponse.json({ error: `No survey period found for quarter: ${quarter}` }, { status: 404 })
    }

    // ── 2. Fetch all responses ───────────────────────────────────────────────
    const { data: rows, error: rErr } = await supabaseAdmin
      .from('survey_responses')
      .select(
        'backlog_outlook, margin_outlook, labor_availability, market_outlook, ' +
        'material_concern, revenue_band, region, work_type'
      )
      .eq('period_id', period.id)

    if (rErr) {
      console.error('[/api/survey/aggregate] fetch responses:', rErr)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    const responses = (rows ?? []) as unknown as Response[]

    // ── 3. Minimum threshold ─────────────────────────────────────────────────
    if (responses.length < 30) {
      return NextResponse.json(
        { error: 'Insufficient responses', count: responses.length, required: 30 },
        { status: 422 }
      )
    }

    // ── 4–5. Net scores & distributions ─────────────────────────────────────
    const backlogVals = responses.map(r => r.backlog_outlook)
    const marginVals  = responses.map(r => r.margin_outlook)
    const laborVals   = responses.map(r => r.labor_availability)
    const marketVals  = responses.map(r => r.market_outlook)
    const matVals     = responses.map(r => r.material_concern)

    const backlog_net = netScore(backlogVals)
    const margin_net  = netScore(marginVals)
    const labor_net   = netScore(laborVals)
    const market_net  = netScore(marketVals)

    const backlog_dist  = dist5(backlogVals)
    const margin_dist   = dist5(marginVals)
    const labor_dist    = dist5(laborVals)
    const market_dist   = dist5(marketVals)
    const material_dist = materialDist(matVals)

    // ── 6. Cross-tabs ────────────────────────────────────────────────────────
    const by_region       = crossTab(responses, 'region')
    const by_company_size = crossTab(responses, 'revenue_band')
    const by_work_type    = crossTab(responses, 'work_type')

    // ── 7. QoQ change ────────────────────────────────────────────────────────
    // Find the most recently published result (by published_at), excluding this period
    const { data: prior } = await supabaseAdmin
      .from('survey_results')
      .select('backlog_net, margin_net, labor_net, market_net')
      .neq('period_id', period.id)
      .order('published_at', { ascending: false })
      .limit(1)
      .single()

    const backlog_qoq = prior ? Math.round((backlog_net - prior.backlog_net) * 10) / 10 : null
    const margin_qoq  = prior ? Math.round((margin_net  - prior.margin_net)  * 10) / 10 : null
    const labor_qoq   = prior ? Math.round((labor_net   - prior.labor_net)   * 10) / 10 : null
    const market_qoq  = prior ? Math.round((market_net  - prior.market_net)  * 10) / 10 : null

    // ── 8. Upsert into survey_results ────────────────────────────────────────
    const { error: uErr } = await supabaseAdmin
      .from('survey_results')
      .upsert(
        {
          period_id: period.id,
          quarter: period.quarter,
          respondent_count: responses.length,
          published_at: new Date().toISOString(),
          backlog_net, margin_net, labor_net, market_net,
          backlog_qoq, margin_qoq, labor_qoq, market_qoq,
          backlog_dist, margin_dist, labor_dist, market_dist,
          material_dist,
          by_region, by_company_size, by_work_type,
        },
        { onConflict: 'period_id' }
      )

    if (uErr) {
      console.error('[/api/survey/aggregate] upsert:', uErr)
      return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
    }

    // ── 9. Mark period as published ──────────────────────────────────────────
    await supabaseAdmin
      .from('survey_periods')
      .update({ published_at: new Date().toISOString(), is_active: false })
      .eq('id', period.id)

    // ── 10. Return ───────────────────────────────────────────────────────────
    return NextResponse.json({
      quarter: period.quarter,
      respondent_count: responses.length,
      backlog_net, margin_net, labor_net, market_net,
      backlog_qoq, margin_qoq, labor_qoq, market_qoq,
      backlog_dist, margin_dist, labor_dist, market_dist,
      material_dist,
      by_region, by_company_size, by_work_type,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('supabaseUrl') || msg.includes('required')) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    console.error('[/api/survey/aggregate]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
