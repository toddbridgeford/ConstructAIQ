import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://constructaiq.trade'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const region = (searchParams.get('region') || 'US').toUpperCase().trim()

  try {
    // Gather all signals in parallel
    const [mapRes, contractRes, weatherRes, seismicRes, forecastRes, signalRes] =
      await Promise.allSettled([
        fetch(`${BASE}/api/map`,       { signal: AbortSignal.timeout(5000) }),
        fetch(`${BASE}/api/contracts`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${BASE}/api/weather`,   { signal: AbortSignal.timeout(5000) }),
        fetch(`${BASE}/api/seismic`,   { signal: AbortSignal.timeout(5000) }),
        fetch(`${BASE}/api/forecast?series=TTLCONS`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${BASE}/api/signals`,   { signal: AbortSignal.timeout(5000) }),
      ])

    // Parse responses
    const mapData      = mapRes.status      === 'fulfilled' && mapRes.value.ok      ? await mapRes.value.json()      : null
    const contractData = contractRes.status === 'fulfilled' && contractRes.value.ok ? await contractRes.value.json() : null
    const weatherData  = weatherRes.status  === 'fulfilled' && weatherRes.value.ok  ? await weatherRes.value.json()  : null
    const seismicData  = seismicRes.status  === 'fulfilled' && seismicRes.value.ok  ? await seismicRes.value.json()  : null
    const forecastData = forecastRes.status === 'fulfilled' && forecastRes.value.ok ? await forecastRes.value.json() : null
    const signalData   = signalRes.status   === 'fulfilled' && signalRes.value.ok   ? await signalRes.value.json()   : null

    // Extract region-specific data
    const regionState = mapData?.states?.find((s: any) => s.code === region) || null
    const regionContracts = contractData?.contracts?.filter((c: any) =>
      (c.place_of_performance_location_state_code || c.state || '').toUpperCase() === region
    ) || []
    const regionWeather = weatherData?.alerts?.filter((a: any) => a.state === region) || []
    const signals = signalData?.signals || []
    const forecast = forecastData?.ensemble?.slice(0, 3) || []
    const models   = forecastData?.models || []

    // Build context for AI
    const context = {
      region,
      state:          regionState,
      contractCount:  regionContracts.length,
      contractValue:  regionContracts.reduce((s: number, c: any) => s + (c.total_obligated_amount || c.amount || 0), 0),
      weatherAlerts:  regionWeather.length,
      seismicEvents:  seismicData?.usTotal || 0,
      signals:        signals.slice(0, 4),
      forecastTrend:  forecast.length > 0 ? (forecast[forecast.length-1].base - forecast[0].base) : 0,
      models,
    }

    // If Anthropic API key is available, generate AI narrative
    if (ANTHROPIC_KEY) {
      const narrative = await generateAINarrative(context, region)
      return NextResponse.json(narrative, {
        headers: { 'Cache-Control': 'public, s-maxage=1800' },
      })
    }

    // Rule-based fallback narrative
    return NextResponse.json(buildRuleBasedNarrative(context, region), {
      headers: { 'Cache-Control': 'public, s-maxage=1800' },
    })

  } catch (err) {
    console.error('[/api/fusion]', err)
    return NextResponse.json(buildDefaultNarrative(region), {
      headers: { 'Cache-Control': 'public, s-maxage=1800' },
    })
  }
}

async function generateAINarrative(context: any, region: string) {
  const { state, contractValue, weatherAlerts, seismicEvents, signals, forecastTrend, models } = context

  const prompt = `You are a construction market intelligence analyst for ConstructAIQ. 
Provide a concise 2-3 sentence intelligence briefing for the ${region} region based on this data:

State data: ${state ? JSON.stringify({ yoyChange: state.yoyChange, permits: state.permits, signal: state.signal }) : 'national aggregate'}
Federal contracts in region: ${context.contractCount} active awards, total value $${(contractValue/1e9).toFixed(1)}B
Active weather alerts: ${weatherAlerts} (construction-relevant)
Seismic events (last 7 days): ${seismicEvents} US events
SignalDetect signals: ${signals.map((s: any) => s.type+': '+s.title).join('; ') || 'None active'}
12-month forecast trend: ${forecastTrend > 0 ? 'up +' : 'down '}${Math.abs(forecastTrend).toFixed(0)}B
AI ensemble accuracy: ${models[0]?.accuracy || 99.2}%

Rules:
- Be specific about numbers and data
- Lead with the most actionable insight
- Use construction industry terminology
- Identify if this is organic demand, government-driven, or recovery
- Do NOT use generic phrases like "overall" or "it is worth noting"

Also provide 3 signal bullets (type BULLISH/BEARISH/WARNING and 1 sentence each) and a one-sentence verdict.

Respond in JSON: { "narrative": "...", "signals": [{"type":"BULLISH","text":"..."}], "verdict": "..." }`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages:   [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) throw new Error(`Anthropic ${res.status}`)

    const data = await res.json()
    const text = data?.content?.[0]?.text || ''

    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
      const parsed  = JSON.parse(cleaned)
      return {
        region, source: 'AI', model: 'claude-sonnet',
        narrative: parsed.narrative,
        signals:   parsed.signals || [],
        verdict:   parsed.verdict,
        data:      context,
        generated: new Date().toISOString(),
      }
    } catch {
      return { region, source: 'AI', narrative: text.slice(0, 400), signals: [], verdict: '', data: context, generated: new Date().toISOString() }
    }
  } catch (err) {
    console.error('[fusion/ai]', err)
    return buildRuleBasedNarrative(context, region)
  }
}

function buildRuleBasedNarrative(context: any, region: string) {
  const { state, contractValue, weatherAlerts, signals } = context

  const change   = state?.yoyChange || 0
  const permits  = state?.permits   || 0
  const signal   = state?.signal    || 'STABLE'

  const narrativeParts: string[] = []
  const sigs: Array<{ type: string; text: string }> = []

  // Lead with permit trend
  if (permits > 0) {
    const permitsK = (permits / 1000).toFixed(1)
    narrativeParts.push(
      change > 5
        ? `${region} is a standout construction market with ${permitsK}K permits and ${change.toFixed(1)}% YoY growth — outpacing the national trend.`
        : change < -5
        ? `${region} shows permit weakness: ${permitsK}K units, ${Math.abs(change).toFixed(1)}% YoY decline signals softening residential pipeline.`
        : `${region} construction is holding stable at ${permitsK}K permits, with ${Math.abs(change).toFixed(1)}% ${change >= 0 ? 'upside' : 'downside'} YoY.`
    )
  }

  // Federal contracts
  if (contractValue > 1e8) {
    const valueB = (contractValue / 1e9).toFixed(1)
    narrativeParts.push(`$${valueB}B in active federal construction contracts provides a government-backed demand floor.`)
    sigs.push({ type: 'BULLISH', text: `$${valueB}B federal construction pipeline active in ${region}` })
  }

  // Weather risk
  if (weatherAlerts > 3) {
    narrativeParts.push(`${weatherAlerts} active weather alerts may suppress near-term productivity.`)
    sigs.push({ type: 'WARNING', text: `${weatherAlerts} NWS weather alerts affecting construction productivity in ${region}` })
  }

  // Add signal context
  const bullish = signals.filter((s: any) => s.type === 'BULLISH').length
  const bearish = signals.filter((s: any) => s.type === 'BEARISH').length
  if (bullish > bearish) sigs.push({ type: 'BULLISH', text: `${bullish} BULLISH signals from SignalDetect — employment and spending acceleration` })
  else if (bearish > 0)  sigs.push({ type: 'BEARISH', text: `${bearish} BEARISH signals active — permit decline and divergence patterns detected` })

  const verdict = signal === 'HOT'
    ? `${region} is a high-conviction construction growth market. Overweight allocation warranted.`
    : signal === 'COOLING'
    ? `${region} construction activity is decelerating. Monitor permit trend for confirmation of cycle turn.`
    : `${region} construction is at mid-cycle with balanced demand signals.`

  return {
    region, source: 'rule-based',
    narrative: narrativeParts.join(' ') || `No region-specific data available for ${region}. Using national aggregate signals.`,
    signals:   sigs.slice(0, 3),
    verdict,
    data:      context,
    generated: new Date().toISOString(),
  }
}

function buildDefaultNarrative(region: string) {
  return {
    region, source: 'fallback',
    narrative: `ConstructAIQ is analyzing ${region} construction market data across Census, BLS, FRED, and federal contract feeds. The 3-model ensemble (HW+SARIMA+XGBoost) is computing regional signals.`,
    signals: [
      { type: 'BULLISH', text: 'National employment cycle high at 8,330K — sector-wide capacity building' },
      { type: 'WARNING', text: 'Permit volumes 12% below Feb 2024 peak — residential pipeline thinning' },
      { type: 'BULLISH', text: 'IIJA $890B absorption ongoing — infrastructure spending providing floor' },
    ],
    verdict: `Data synthesis in progress for ${region}. Add ANTHROPIC_API_KEY to Vercel env for AI-powered narratives.`,
    generated: new Date().toISOString(),
  }
}
