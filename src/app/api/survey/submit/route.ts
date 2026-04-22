import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_REVENUE_BANDS = ['under_5m', '5_25m', '25_100m', '100_500m', 'over_500m']
const VALID_WORK_TYPES    = ['residential', 'commercial', 'industrial', 'infrastructure', 'specialty', 'mixed']
const VALID_REGIONS       = ['northeast', 'southeast', 'midwest', 'southwest', 'west', 'national']
const VALID_YEARS_BANDS   = ['under_5', '5_15', '15_30', 'over_30']
const VALID_MATERIALS     = ['none', 'lumber', 'steel', 'concrete', 'copper', 'fuel', 'other']

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      period_id,
      email,
      revenue_band,
      work_type,
      region,
      years_band,
      backlog_outlook,
      margin_outlook,
      labor_availability,
      material_concern,
      market_outlook,
      comments,
    } = body

    // Validate required fields
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }
    if (!period_id) {
      return NextResponse.json({ error: 'period_id required' }, { status: 400 })
    }
    if (!VALID_REVENUE_BANDS.includes(revenue_band)) {
      return NextResponse.json({ error: 'Invalid revenue_band' }, { status: 400 })
    }
    if (!VALID_WORK_TYPES.includes(work_type)) {
      return NextResponse.json({ error: 'Invalid work_type' }, { status: 400 })
    }
    if (!VALID_REGIONS.includes(region)) {
      return NextResponse.json({ error: 'Invalid region' }, { status: 400 })
    }
    if (!VALID_YEARS_BANDS.includes(years_band)) {
      return NextResponse.json({ error: 'Invalid years_band' }, { status: 400 })
    }
    for (const [field, val] of [
      ['backlog_outlook', backlog_outlook],
      ['margin_outlook', margin_outlook],
      ['labor_availability', labor_availability],
      ['market_outlook', market_outlook],
    ] as [string, unknown][]) {
      if (typeof val !== 'number' || val < 1 || val > 5) {
        return NextResponse.json({ error: `${field} must be 1–5` }, { status: 400 })
      }
    }
    if (!VALID_MATERIALS.includes(material_concern)) {
      return NextResponse.json({ error: 'Invalid material_concern' }, { status: 400 })
    }

    const email_hash = hashEmail(email)

    const { data, error } = await supabaseAdmin
      .from('survey_responses')
      .insert({
        period_id,
        email_hash,
        revenue_band,
        work_type,
        region,
        years_band,
        backlog_outlook,
        margin_outlook,
        labor_availability,
        material_concern,
        market_outlook,
        comments: comments?.trim() || null,
      })
      .select('id')
      .single()

    if (error) {
      // Unique constraint violation — already responded
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already responded' }, { status: 409 })
      }
      console.error('[/api/survey/submit] DB error:', error)
      return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
    }

    // Return the new respondent count
    const { count } = await supabaseAdmin
      .from('survey_responses')
      .select('id', { count: 'exact', head: true })
      .eq('period_id', period_id)

    return NextResponse.json({
      success: true,
      response_id: data.id,
      response_count: count ?? 1,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('supabaseUrl') || msg.includes('required')) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    console.error('[/api/survey/submit]', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
