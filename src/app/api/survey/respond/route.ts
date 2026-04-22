import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COMPANY_SIZES    = ['under_5m','5m_25m','25m_100m','100m_500m','over_500m'] as const
const WORK_TYPES       = ['residential','commercial','industrial','infrastructure','specialty','mixed'] as const
const REGIONS          = ['northeast','southeast','midwest','southwest','west','national'] as const
const YEARS_OPTIONS    = ['under_5','5_15','15_30','over_30'] as const
const MATERIAL_OPTIONS = ['none','lumber','steel','concrete','copper','labor','fuel','other'] as const

function isLikert(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5
}

function isIn<T extends string>(v: unknown, arr: readonly T[]): v is T {
  return typeof v === 'string' && (arr as readonly string[]).includes(v)
}

function stripPII(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email removed]')
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[phone removed]')
    .trim()
    .slice(0, 500)
}

function weeksUntilClose(closesAt: string): string {
  const days = Math.ceil((new Date(closesAt).getTime() - Date.now()) / 86_400_000)
  if (days <= 0)  return 'shortly'
  if (days <= 7)  return `${days} day${days === 1 ? '' : 's'}`
  const weeks = Math.round(days / 7)
  return `${weeks} week${weeks === 1 ? '' : 's'}`
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      email,
      company_size, primary_work_type, primary_region, years_in_business,
      backlog_outlook, margin_outlook, labor_availability,
      material_concern, market_outlook,
      comments,
    } = body

    // Validate email
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    // Validate profile fields
    if (!isIn(company_size, COMPANY_SIZES)) {
      return NextResponse.json({ error: `company_size must be one of: ${COMPANY_SIZES.join(', ')}` }, { status: 400 })
    }
    if (!isIn(primary_work_type, WORK_TYPES)) {
      return NextResponse.json({ error: `primary_work_type must be one of: ${WORK_TYPES.join(', ')}` }, { status: 400 })
    }
    if (!isIn(primary_region, REGIONS)) {
      return NextResponse.json({ error: `primary_region must be one of: ${REGIONS.join(', ')}` }, { status: 400 })
    }
    if (!isIn(years_in_business, YEARS_OPTIONS)) {
      return NextResponse.json({ error: `years_in_business must be one of: ${YEARS_OPTIONS.join(', ')}` }, { status: 400 })
    }

    // Validate Likert responses
    const likertFields: [string, unknown][] = [
      ['backlog_outlook',    backlog_outlook],
      ['margin_outlook',     margin_outlook],
      ['labor_availability', labor_availability],
      ['market_outlook',     market_outlook],
    ]
    for (const [field, val] of likertFields) {
      if (!isLikert(val)) {
        return NextResponse.json({ error: `${field} must be an integer from 1 to 5` }, { status: 400 })
      }
    }
    if (!isIn(material_concern, MATERIAL_OPTIONS)) {
      return NextResponse.json({ error: `material_concern must be one of: ${MATERIAL_OPTIONS.join(', ')}` }, { status: 400 })
    }

    // Find the open survey period
    const now = new Date().toISOString()
    const { data: period, error: periodErr } = await supabase
      .from('survey_periods')
      .select('id, quarter, closes_at, status, respondent_count')
      .eq('status', 'open')
      .lte('opens_at', now)
      .gte('closes_at', now)
      .order('opens_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (periodErr) {
      console.error('[/api/survey/respond] period lookup:', periodErr.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    if (!period) {
      return NextResponse.json(
        { error: 'No survey is currently open. Check back next quarter.' },
        { status: 404 },
      )
    }

    // Hash email + quarter — never store the email itself
    const respondent_hash = createHash('sha256')
      .update(email.toLowerCase().trim() + period.quarter)
      .digest('hex')

    // Check for duplicate submission
    const { data: existing } = await supabaseAdmin
      .from('survey_responses')
      .select('id')
      .eq('survey_period_id', period.id)
      .eq('respondent_hash', respondent_hash)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a response for this quarter' },
        { status: 409 },
      )
    }

    // Store response (email is never saved)
    const { error: insertErr } = await supabaseAdmin
      .from('survey_responses')
      .insert({
        survey_period_id:   period.id,
        respondent_hash,
        company_size,
        primary_work_type,
        primary_region,
        years_in_business,
        backlog_outlook,
        margin_outlook,
        labor_availability,
        material_concern,
        market_outlook,
        comments: typeof comments === 'string' && comments.trim().length > 0
          ? stripPII(comments)
          : null,
      })

    if (insertErr) {
      console.error('[/api/survey/respond] insert:', insertErr.message)
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
    }

    // Atomic respondent count increment
    await supabaseAdmin.rpc('increment_survey_respondents', { period_id: period.id })

    return NextResponse.json(
      {
        success: true,
        quarter: period.quarter,
        message: `Thank you. Results publish in ${weeksUntilClose(period.closes_at)}.`,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[/api/survey/respond]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
