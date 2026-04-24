import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

let _limiter: Ratelimit | null = null

function getLimiter(): Ratelimit | null {
  if (_limiter) return _limiter
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'caiq:nlq',
  })
  return _limiter
}

async function fetchData(urls: string[], baseUrl: string) {
  const results = await Promise.all(
    urls.map(async url => {
      try {
        const r = await fetch(`${baseUrl}${url}`, { signal: AbortSignal.timeout(8000) })
        return r.ok ? { url, data: await r.json() } : { url, data: null }
      } catch { return { url, data: null } }
    })
  )
  return results.filter(r => r.data !== null)
}

// Trim large payloads when many sources are selected to stay within token limits
function trimPayload(url: string, data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data
  const d = data as Record<string, unknown>

  if (url.includes('/api/forecast')) {
    const ensemble = Array.isArray(d.ensemble) ? d.ensemble as unknown[] : []
    return {
      seriesId:  d.seriesId,
      metrics:   d.metrics,
      history:   Array.isArray(d.history) ? (d.history as unknown[]).slice(-3) : [],
      ensemble:  [...ensemble.slice(0, 3), ...ensemble.slice(-3)],
      fcstMonths: Array.isArray(d.fcstMonths)
        ? [...(d.fcstMonths as unknown[]).slice(0, 3), ...(d.fcstMonths as unknown[]).slice(-3)]
        : [],
    }
  }

  if (url.includes('/api/map')) {
    const states = Array.isArray(d.states) ? d.states as unknown[] : []
    return { ...d, states: states.slice(0, 10) }
  }

  if (url.includes('/api/satellite')) {
    const msas = Array.isArray(d.msas) ? d.msas as unknown[] : []
    const sorted = [...msas].sort((a, b) => {
      const bsi = (x: unknown) =>
        typeof x === 'object' && x !== null ? ((x as Record<string, number>).bsi_change_90d ?? 0) : 0
      return bsi(b) - bsi(a)
    })
    return { ...d, msas: sorted.slice(0, 10) }
  }

  if (url.includes('/api/signals')) {
    const signals = Array.isArray(d.signals) ? d.signals as unknown[] : []
    return { ...d, signals: signals.slice(0, 5) }
  }

  if (url.includes('/api/driver-analysis')) {
    return {
      series:         d.series,
      driver_summary: d.driver_summary,
      components:     d.components,
      macro_context:  d.macro_context,
      as_of:          d.as_of,
    }
  }

  if (url.includes('/api/benchmark')) {
    // Return only the fields the LLM needs — omit raw percentile internals
    return {
      series:           d.series,
      city:             d.city,
      current_value:    d.current_value,
      percentile:       d.percentile,
      classification:   d.classification,
      mean:             d.mean,
      median:           d.median,
      yoy_change_pct:   d.yoy_change_pct,
      trend_5yr:        d.trend_5yr,
      benchmark_period: d.benchmark_period,
      label:            d.label,
      as_of:            d.as_of,
    }
  }

  return data
}

function selectDataSources(question: string, ttlVal: number | null, permVal: number | null): string[] {
  const q = question.toLowerCase()
  const sources: string[] = []

  // Always fetch core macro data
  sources.push('/api/forecast?series=TTLCONS')
  sources.push('/api/obs?series=TTLCONS&n=12')

  if (q.includes('employ') || q.includes('job') || q.includes('labor') || q.includes('worker') || q.includes('workforce'))
    sources.push('/api/bls', '/api/obs?series=CES2000000001&n=12')

  if (q.includes('permit') || q.includes('start') || q.includes('housing') || q.includes('residential') || q.includes('home'))
    sources.push('/api/obs?series=PERMIT&n=12', '/api/obs?series=HOUST&n=12')

  if (q.includes('material') || q.includes('lumber') || q.includes('steel') || q.includes('cost') || q.includes('price') || q.includes('concrete') || q.includes('copper'))
    sources.push('/api/pricewatch')

  if (q.includes('cost') || q.includes('estimate') || q.includes('sqft') || q.includes('square foot') ||
      q.includes('build') || q.includes('how much') || q.includes('expensive') || q.includes('budget') || q.includes('price per'))
    sources.push('/api/cost-benchmark?type=office&sqft=100000&msa=national', '/api/pricewatch')

  if (q.includes('federal') || q.includes('iija') || q.includes('government') || q.includes('contract') || q.includes('award') || q.includes('infrastructure') || q.includes('ira'))
    sources.push('/api/federal')

  if (q.includes('signal') || q.includes('anomaly') || q.includes('alert') || q.includes('risk') || q.includes('trend'))
    sources.push('/api/signals')

  if (q.includes('state') || q.includes('region') || q.includes('map') || q.includes('geographic') || q.includes('msa') || q.includes('city'))
    sources.push('/api/map')

  if (q.includes('permit') || q.includes('city') || q.includes('local') ||
      q.includes('phoenix') || q.includes('dallas') || q.includes('austin') ||
      q.includes('chicago') || q.includes('houston') || q.includes('nyc') ||
      q.includes('new york') || q.includes('los angeles'))
    sources.push('/api/permits')

  if (q.includes('satellite') || q.includes('ground') || q.includes('bsi') || q.includes('activity') || q.includes('site'))
    sources.push('/api/satellite')

  if (q.includes('rate') || q.includes('mortgage') || q.includes('interest') || q.includes('fed') || q.includes('treasury'))
    sources.push('/api/rates')

  if (q.includes('forecast') || q.includes('predict') || q.includes('outlook') || q.includes('next') || q.includes('future') || q.includes('month'))
    sources.push('/api/forecast?series=TTLCONS', '/api/forecast?series=HOUST', '/api/forecast?series=PERMIT')

  if (q.includes('riskiest') || q.includes('stress') || q.includes('pressure'))
    sources.push('/api/signals', '/api/pricewatch', '/api/satellite')

  if (q.includes('recession') || q.includes('contraction') || q.includes('slowdown') || q.includes('decline'))
    sources.push('/api/cshi', '/api/signals', '/api/rates')

  if (q.includes('average') || q.includes('normal') || q.includes('historical') ||
      q.includes('compared') || q.includes(' vs ') || q.includes('benchmark') ||
      q.includes('typical') || q.includes('unusual') ||
      (q.includes('high') && (q.includes('spend') || q.includes('permit') || q.includes('employ'))) ||
      (q.includes('low')  && (q.includes('spend') || q.includes('permit') || q.includes('employ'))))
    if (ttlVal !== null)
      sources.push(`/api/benchmark?series=TTLCONS&value=${ttlVal}`)
    if (permVal !== null)
      sources.push(`/api/benchmark?series=PERMIT&value=${permVal}`)

  if (q.includes('compare') || q.includes('versus') || q.includes(' vs ') || q.includes('difference'))
    sources.push('/api/map', '/api/satellite')

  if (q.includes('disturbance'))
    sources.push('/api/satellite', '/api/fusion')

  if (q.includes('layoff') || q.includes('warn') || q.includes('cuts') || q.includes('reduction') || q.includes('contraction'))
    sources.push('/api/warn')

  if (q.includes('why') || q.includes('cause') || q.includes('driven') || q.includes('reason') ||
      q.includes('explain') || q.includes('what happened') || q.includes('decline') ||
      q.includes('increase') || q.includes('drop') || q.includes('rise') || q.includes('surge'))
    sources.push('/api/driver-analysis?series=TTLCONS', '/api/driver-analysis?series=PERMIT')

  return [...new Set(sources)]
}

const SYSTEM_PROMPT = `You are the chief economist for ConstructAIQ, a free US construction \
market intelligence platform. You answer questions about the US construction economy using \
ONLY the data provided to you.

RULES — NEVER VIOLATE:
1. Every statistic you cite must come from the provided data. Never invent or estimate numbers.
2. If the data does not contain enough information to answer the question, say exactly:
   "I don't have reliable data on that. For [topic], check [relevant government source]."
3. Never recommend investments, trades, or financial decisions.
4. Always cite the data source for every number: "According to [Census/BLS/USASpending/etc]..."
5. Keep answers under 200 words. Be specific. No vague generalities.
6. If comparing MSAs or states, name the specific ones from the data.
7. End every answer with: "Data as of [most recent date in the provided data]."

FORMAT:
- Direct answer in the first sentence
- Supporting data with source citations
- One forward-looking note if the data supports it
- Data as of [date] footer`

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const limiter = getLimiter()
  if (limiter) {
    try {
      const { success } = await limiter.limit(`ip:${ip}`)
      if (!success) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. NLQ is limited to 10 questions per hour.' },
          { status: 429 }
        )
      }
    } catch { /* rate limit unavailable — allow request */ }
  }

  try {
    const body = await request.json()
    const question = (body.question ?? '').trim()

    if (!question || question.length < 5) {
      return NextResponse.json({ error: 'Question is required (minimum 5 characters)' }, { status: 400 })
    }
    if (question.length > 500) {
      return NextResponse.json({ error: 'Question too long (max 500 characters)' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NLQ not configured', answer: 'AI query is not configured. Browse the dashboard for construction data.' },
        { status: 200 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://constructaiq.trade'

    // Fetch current values for benchmark context
    const [ttlLatest, permLatest] = await Promise.all([
      fetch(`${baseUrl}/api/obs?series=TTLCONS&n=1`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch(`${baseUrl}/api/obs?series=PERMIT&n=1`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ])

    const ttlVal  = ttlLatest?.obs?.[0]?.value  ?? null
    const permVal = permLatest?.obs?.[0]?.value ?? null

    const sources = selectDataSources(question, ttlVal, permVal)
    const raw = await fetchData(sources, baseUrl)

    // Trim payloads when many sources selected to avoid token limits
    const shouldTrim = sources.length > 5
    const dataResults = shouldTrim
      ? raw.map(r => ({ ...r, data: trimPayload(r.url, r.data) }))
      : raw

    const dataContext = dataResults
      .map(r => `[${r.url}]:\n${JSON.stringify(r.data, null, 2)}`)
      .join('\n\n---\n\n')

    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `QUESTION: ${question}\n\nAVAILABLE DATA:\n${dataContext}`,
      }],
    })

    const answer = message.content[0].type === 'text'
      ? message.content[0].text
      : 'Unable to generate answer.'

    // Log query non-blocking — never fail the request
    void (async () => {
      try {
        await supabaseAdmin.from('nlq_queries').insert({
          question:    question.slice(0, 200),
          answer_chars: answer.length,
          sources_used: sources,
          asked_at:    new Date().toISOString(),
          ip_hash:     createHash('sha256').update(ip).digest('hex').slice(0, 16),
        })
      } catch { /* non-fatal */ }
    })()

    return NextResponse.json({
      question,
      answer,
      sources_queried: sources,
      model: 'claude-sonnet-4-6',
    }, { headers: { 'Cache-Control': 'no-store' } })

  } catch (err) {
    console.error('[NLQ] error:', err)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
