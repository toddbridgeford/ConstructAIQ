import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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

function selectDataSources(question: string): string[] {
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

  if (q.includes('federal') || q.includes('iija') || q.includes('government') || q.includes('contract') || q.includes('award') || q.includes('infrastructure') || q.includes('ira'))
    sources.push('/api/federal')

  if (q.includes('signal') || q.includes('anomaly') || q.includes('alert') || q.includes('risk') || q.includes('trend'))
    sources.push('/api/signals')

  if (q.includes('state') || q.includes('region') || q.includes('map') || q.includes('geographic') || q.includes('msa') || q.includes('city'))
    sources.push('/api/map')

  if (q.includes('satellite') || q.includes('ground') || q.includes('bsi') || q.includes('activity') || q.includes('site'))
    sources.push('/api/satellite')

  if (q.includes('rate') || q.includes('mortgage') || q.includes('interest') || q.includes('fed') || q.includes('treasury'))
    sources.push('/api/rates')

  if (q.includes('forecast') || q.includes('predict') || q.includes('outlook') || q.includes('next') || q.includes('month'))
    sources.push('/api/forecast?series=HOUST', '/api/forecast?series=PERMIT')

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
    const sources = selectDataSources(question)
    const dataResults = await fetchData(sources, baseUrl)

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
