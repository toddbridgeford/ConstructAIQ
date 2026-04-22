import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomBytes, createHash } from 'crypto'
import { sendApiKeyWelcome } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLANS = {
  starter:      { rpm: 60,   rpd: 1000,  price: 490  },
  professional: { rpm: 300,  rpd: 10000, price: 1490 },
  enterprise:   { rpm: 1000, rpd: 100000, price: 0   },
}

function generateKey(): { key: string; prefix: string; hash: string } {
  const raw    = randomBytes(32).toString('hex')
  const key    = `caiq_${raw}`
  const prefix = `caiq_${raw.slice(0, 8)}`
  const hash   = createHash('sha256').update(key).digest('hex')
  return { key, prefix, hash }
}

export async function POST(request: Request) {
  // Require CRON_SECRET (admin token) to issue keys programmatically
  const adminToken = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body  = await request.json()
    const { email, plan = 'starter', name = '' } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) {
      return NextResponse.json(
        { error: `Invalid plan. Options: ${Object.keys(PLANS).join(', ')}` },
        { status: 400 }
      )
    }

    const { key, prefix, hash } = generateKey()

    // Store hashed key in Supabase — never store the raw key
    const { error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        email:      email.toLowerCase().trim(),
        name:       name || email.split('@')[0],
        plan,
        key_prefix: prefix,
        key_hash:   hash,
        rpm_limit:  planConfig.rpm,
        rpd_limit:  planConfig.rpd,
        created_at: new Date().toISOString(),
        active:     true,
        usage:      0,
      })

    if (error) {
      // Email may already have a key
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An API key already exists for this email. Contact support to rotate.' },
          { status: 409 }
        )
      }
      console.error('[/api/keys/issue]', error)
      return NextResponse.json({ error: 'Key generation failed' }, { status: 500 })
    }

    // Check if the survey is currently open (best-effort, non-blocking)
    let surveyOpen = false
    let surveyQuarter = 'Q2 2025'
    try {
      const surveyRes = await supabaseAdmin
        .from('survey_periods')
        .select('quarter')
        .eq('is_active', true)
        .limit(1)
        .single()
      if (surveyRes.data) {
        surveyOpen    = true
        surveyQuarter = surveyRes.data.quarter
      }
    } catch {/* ignore — survey state is non-critical */}

    // Send welcome email with API key (fire-and-forget)
    sendApiKeyWelcome({
      to: email,
      key,
      prefix,
      plan,
      surveyOpen,
      surveyQuarter,
    }).catch(err => console.warn('[/api/keys/issue] welcome email failed:', err))

    // Return the key once — it is never stored in plaintext
    return NextResponse.json({
      success:    true,
      key,                    // ← show once, never again
      prefix,
      plan,
      limits: {
        requestsPerMinute: planConfig.rpm,
        requestsPerDay:    planConfig.rpd,
      },
      endpoints:  'https://constructaiq.trade/api/*',
      docs:       'https://docs.constructaiq.trade',
      warning:    'Store this key securely. It will not be shown again.',
    }, { status: 201 })

  } catch (err) {
    console.error('[/api/keys/issue]', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// GET: validate a key (used by API middleware)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keyToValidate = searchParams.get('key')

  if (!keyToValidate) {
    return NextResponse.json({ error: 'key param required' }, { status: 400 })
  }

  const hash = createHash('sha256').update(keyToValidate).digest('hex')

  try {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('plan, rpm_limit, rpd_limit, active, usage')
      .eq('key_hash', hash)
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Invalid key' }, { status: 401 })
    }

    if (!data.active) {
      return NextResponse.json({ valid: false, error: 'Key inactive' }, { status: 403 })
    }

    return NextResponse.json({
      valid:  true,
      plan:   data.plan,
      limits: { rpm: data.rpm_limit, rpd: data.rpd_limit },
      usage:  data.usage,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 })
  }
}
