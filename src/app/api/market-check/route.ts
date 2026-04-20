import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Synthetic market data ────────────────────────────────────────────────────

interface MarketSeed {
  market:         string
  state:          string
  score:          number
  classification: 'HOT' | 'GROWING' | 'NEUTRAL' | 'COOLING' | 'DECLINING'
  nationalRank:   number
  permitVolume:   number
  permitValue:    number   // $M
  employment:     number   // thousands
  federalAwards:  number   // $M
  materialsPressure: string
  permitYoy:      number
  permitValueYoy: number
  employmentYoy:  number
  federalYoy:     number
  materialYoy:    number
  comparables:    string[]
}

const MARKETS: MarketSeed[] = [
  {
    market: 'Dallas, TX', state: 'TX', score: 88, classification: 'HOT', nationalRank: 1,
    permitVolume: 42840, permitValue: 8420, employment: 284, federalAwards: 1840,
    materialsPressure: 'ELEVATED', permitYoy: 14.2, permitValueYoy: 18.6, employmentYoy: 6.4,
    federalYoy: 22.8, materialYoy: 8.2, comparables: ['Houston, TX', 'Austin, TX', 'Phoenix, AZ'],
  },
  {
    market: 'Houston, TX', state: 'TX', score: 82, classification: 'HOT', nationalRank: 3,
    permitVolume: 38420, permitValue: 7240, employment: 312, federalAwards: 2640,
    materialsPressure: 'HIGH', permitYoy: 11.8, permitValueYoy: 14.2, employmentYoy: 5.2,
    federalYoy: 18.4, materialYoy: 9.6, comparables: ['Dallas, TX', 'Austin, TX', 'Atlanta, GA'],
  },
  {
    market: 'Austin, TX', state: 'TX', score: 84, classification: 'HOT', nationalRank: 2,
    permitVolume: 28640, permitValue: 5840, employment: 142, federalAwards: 980,
    materialsPressure: 'ELEVATED', permitYoy: 9.4, permitValueYoy: 16.8, employmentYoy: 8.2,
    federalYoy: 14.2, materialYoy: 7.4, comparables: ['Dallas, TX', 'Nashville, TN', 'Denver, CO'],
  },
  {
    market: 'Phoenix, AZ', state: 'AZ', score: 79, classification: 'HOT', nationalRank: 4,
    permitVolume: 34280, permitValue: 6480, employment: 198, federalAwards: 1240,
    materialsPressure: 'MODERATE', permitYoy: 8.6, permitValueYoy: 12.4, employmentYoy: 5.8,
    federalYoy: 16.2, materialYoy: 6.8, comparables: ['Las Vegas, NV', 'Denver, CO', 'Dallas, TX'],
  },
  {
    market: 'Atlanta, GA', state: 'GA', score: 76, classification: 'GROWING', nationalRank: 6,
    permitVolume: 24840, permitValue: 4820, employment: 178, federalAwards: 1640,
    materialsPressure: 'MODERATE', permitYoy: 7.2, permitValueYoy: 10.8, employmentYoy: 4.6,
    federalYoy: 12.8, materialYoy: 5.4, comparables: ['Charlotte, NC', 'Nashville, TN', 'Tampa, FL'],
  },
  {
    market: 'Nashville, TN', state: 'TN', score: 78, classification: 'HOT', nationalRank: 5,
    permitVolume: 18420, permitValue: 3640, employment: 112, federalAwards: 840,
    materialsPressure: 'MODERATE', permitYoy: 12.4, permitValueYoy: 15.6, employmentYoy: 7.8,
    federalYoy: 10.4, materialYoy: 6.2, comparables: ['Atlanta, GA', 'Charlotte, NC', 'Austin, TX'],
  },
  {
    market: 'Charlotte, NC', state: 'NC', score: 74, classification: 'GROWING', nationalRank: 8,
    permitVolume: 16840, permitValue: 3280, employment: 98, federalAwards: 720,
    materialsPressure: 'LOW', permitYoy: 6.8, permitValueYoy: 9.4, employmentYoy: 4.2,
    federalYoy: 8.6, materialYoy: 4.8, comparables: ['Atlanta, GA', 'Nashville, TN', 'Raleigh, NC'],
  },
  {
    market: 'Tampa, FL', state: 'FL', score: 72, classification: 'GROWING', nationalRank: 9,
    permitVolume: 22480, permitValue: 4120, employment: 142, federalAwards: 980,
    materialsPressure: 'MODERATE', permitYoy: 5.4, permitValueYoy: 8.6, employmentYoy: 3.8,
    federalYoy: 11.2, materialYoy: 5.6, comparables: ['Orlando, FL', 'Miami, FL', 'Atlanta, GA'],
  },
  {
    market: 'Denver, CO', state: 'CO', score: 68, classification: 'GROWING', nationalRank: 12,
    permitVolume: 14280, permitValue: 2940, employment: 124, federalAwards: 1480,
    materialsPressure: 'LOW', permitYoy: 4.2, permitValueYoy: 6.8, employmentYoy: 3.2,
    federalYoy: 9.4, materialYoy: 3.8, comparables: ['Phoenix, AZ', 'Salt Lake City, UT', 'Austin, TX'],
  },
  {
    market: 'Miami, FL', state: 'FL', score: 66, classification: 'GROWING', nationalRank: 14,
    permitVolume: 18640, permitValue: 4840, employment: 168, federalAwards: 1120,
    materialsPressure: 'ELEVATED', permitYoy: 3.6, permitValueYoy: 7.4, employmentYoy: 2.8,
    federalYoy: 8.2, materialYoy: 7.2, comparables: ['Tampa, FL', 'Orlando, FL', 'Atlanta, GA'],
  },
  {
    market: 'Orlando, FL', state: 'FL', score: 70, classification: 'GROWING', nationalRank: 10,
    permitVolume: 19840, permitValue: 3680, employment: 128, federalAwards: 840,
    materialsPressure: 'MODERATE', permitYoy: 6.4, permitValueYoy: 9.8, employmentYoy: 4.4,
    federalYoy: 7.8, materialYoy: 4.6, comparables: ['Tampa, FL', 'Miami, FL', 'Charlotte, NC'],
  },
  {
    market: 'Chicago, IL', state: 'IL', score: 44, classification: 'NEUTRAL', nationalRank: 38,
    permitVolume: 12840, permitValue: 2480, employment: 198, federalAwards: 2840,
    materialsPressure: 'LOW', permitYoy: -1.4, permitValueYoy: 1.2, employmentYoy: 0.6,
    federalYoy: 4.2, materialYoy: 1.8, comparables: ['Minneapolis, MN', 'Detroit, MI', 'Indianapolis, IN'],
  },
  {
    market: 'Seattle, WA', state: 'WA', score: 58, classification: 'NEUTRAL', nationalRank: 24,
    permitVolume: 16240, permitValue: 3840, employment: 148, federalAwards: 1640,
    materialsPressure: 'ELEVATED', permitYoy: 1.8, permitValueYoy: 4.2, employmentYoy: 1.4,
    federalYoy: 6.4, materialYoy: 5.8, comparables: ['Portland, OR', 'Denver, CO', 'San Francisco, CA'],
  },
  {
    market: 'New York, NY', state: 'NY', score: 36, classification: 'COOLING', nationalRank: 52,
    permitVolume: 18420, permitValue: 6240, employment: 312, federalAwards: 4840,
    materialsPressure: 'HIGH', permitYoy: -6.8, permitValueYoy: -3.4, employmentYoy: -1.2,
    federalYoy: 2.4, materialYoy: 9.8, comparables: ['Boston, MA', 'Philadelphia, PA', 'Washington, DC'],
  },
  {
    market: 'Los Angeles, CA', state: 'CA', score: 32, classification: 'COOLING', nationalRank: 58,
    permitVolume: 14280, permitValue: 5640, employment: 248, federalAwards: 2840,
    materialsPressure: 'HIGH', permitYoy: -8.4, permitValueYoy: -5.2, employmentYoy: -2.4,
    federalYoy: 1.8, materialYoy: 10.4, comparables: ['San Francisco, CA', 'Seattle, WA', 'Phoenix, AZ'],
  },
  {
    market: 'San Francisco, CA', state: 'CA', score: 24, classification: 'DECLINING', nationalRank: 68,
    permitVolume: 6840, permitValue: 2840, employment: 84, federalAwards: 1240,
    materialsPressure: 'HIGH', permitYoy: -14.8, permitValueYoy: -11.2, employmentYoy: -5.6,
    federalYoy: -2.4, materialYoy: 11.2, comparables: ['Los Angeles, CA', 'Seattle, WA', 'Portland, OR'],
  },
  {
    market: 'Minneapolis, MN', state: 'MN', score: 48, classification: 'NEUTRAL', nationalRank: 32,
    permitVolume: 9840, permitValue: 1840, employment: 98, federalAwards: 1080,
    materialsPressure: 'LOW', permitYoy: -0.8, permitValueYoy: 2.4, employmentYoy: 0.8,
    federalYoy: 5.2, materialYoy: 2.4, comparables: ['Chicago, IL', 'Kansas City, MO', 'Indianapolis, IN'],
  },
  {
    market: 'Las Vegas, NV', state: 'NV', score: 62, classification: 'GROWING', nationalRank: 18,
    permitVolume: 14840, permitValue: 2640, employment: 86, federalAwards: 640,
    materialsPressure: 'MODERATE', permitYoy: 5.8, permitValueYoy: 8.4, employmentYoy: 3.6,
    federalYoy: 4.8, materialYoy: 5.2, comparables: ['Phoenix, AZ', 'Denver, CO', 'Salt Lake City, UT'],
  },
  {
    market: 'Salt Lake City, UT', state: 'UT', score: 64, classification: 'GROWING', nationalRank: 16,
    permitVolume: 10840, permitValue: 2080, employment: 72, federalAwards: 780,
    materialsPressure: 'MODERATE', permitYoy: 5.4, permitValueYoy: 7.8, employmentYoy: 3.8,
    federalYoy: 6.4, materialYoy: 4.6, comparables: ['Denver, CO', 'Boise, ID', 'Las Vegas, NV'],
  },
  {
    market: 'Raleigh, NC', state: 'NC', score: 76, classification: 'GROWING', nationalRank: 7,
    permitVolume: 15840, permitValue: 3040, employment: 88, federalAwards: 920,
    materialsPressure: 'LOW', permitYoy: 8.4, permitValueYoy: 11.2, employmentYoy: 5.6,
    federalYoy: 9.8, materialYoy: 4.2, comparables: ['Charlotte, NC', 'Nashville, TN', 'Atlanta, GA'],
  },
  {
    market: 'Boston, MA', state: 'MA', score: 42, classification: 'NEUTRAL', nationalRank: 42,
    permitVolume: 9480, permitValue: 2840, employment: 112, federalAwards: 2640,
    materialsPressure: 'ELEVATED', permitYoy: -2.4, permitValueYoy: 0.8, employmentYoy: 0.4,
    federalYoy: 3.8, materialYoy: 6.4, comparables: ['New York, NY', 'Philadelphia, PA', 'Washington, DC'],
  },
  {
    market: 'Washington, DC', state: 'DC', score: 52, classification: 'NEUTRAL', nationalRank: 28,
    permitVolume: 11240, permitValue: 3240, employment: 138, federalAwards: 8640,
    materialsPressure: 'MODERATE', permitYoy: 1.2, permitValueYoy: 3.4, employmentYoy: 1.8,
    federalYoy: 14.8, materialYoy: 3.6, comparables: ['Baltimore, MD', 'Philadelphia, PA', 'Boston, MA'],
  },
  {
    market: 'Portland, OR', state: 'OR', score: 34, classification: 'COOLING', nationalRank: 54,
    permitVolume: 8240, permitValue: 1640, employment: 72, federalAwards: 640,
    materialsPressure: 'LOW', permitYoy: -7.2, permitValueYoy: -4.8, employmentYoy: -2.8,
    federalYoy: 0.4, materialYoy: 2.8, comparables: ['Seattle, WA', 'Denver, CO', 'Sacramento, CA'],
  },
]

// Normalize market name for lookup
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function findMarket(query: string): MarketSeed | null {
  const q = normalize(query)
  // Exact match
  const exact = MARKETS.find(m => normalize(m.market) === q || normalize(m.state) === q)
  if (exact) return exact
  // Partial match — market name contains query word
  const partial = MARKETS.find(m => {
    const mn = normalize(m.market)
    return mn.includes(q) || q.includes(mn.split(',')[0])
  })
  if (partial) return partial
  // State match
  const stateMatch = MARKETS.find(m =>
    normalize(m.state) === q ||
    q.endsWith(m.state.toLowerCase()) ||
    q.startsWith(m.state.toLowerCase())
  )
  if (stateMatch) return stateMatch
  return null
}

// Generate synthetic 24-month history
function buildHistory(seed: MarketSeed): { label: string; permits: number }[] {
  const base = seed.permitVolume
  const trendPerMonth = seed.permitYoy / 100 / 12
  return Array.from({ length: 24 }, (_, i) => {
    const monthsAgo = 23 - i
    const noise = (Math.sin(i * 2.3 + seed.score) * 0.04 + Math.cos(i * 1.7) * 0.03)
    const trend = 1 - trendPerMonth * monthsAgo
    const raw = Math.round(base * trend * (1 + noise))
    const d = new Date()
    d.setMonth(d.getMonth() - monthsAgo)
    const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    return { label, permits: Math.max(0, raw) }
  })
}

// Autocomplete suggestions
function getSuggestions(query: string): string[] {
  const q = normalize(query)
  if (!q) return []
  return MARKETS
    .filter(m => normalize(m.market).includes(q) || m.state.toLowerCase().includes(q))
    .slice(0, 6)
    .map(m => m.market)
}

// Synthetic fallback for unknown markets
function syntheticMarket(query: string): object {
  // Derive a deterministic score from the query string chars
  const seed = query.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const score = 40 + (seed % 45)
  const classes: Array<'HOT' | 'GROWING' | 'NEUTRAL' | 'COOLING' | 'DECLINING'> =
    ['HOT', 'GROWING', 'NEUTRAL', 'COOLING', 'DECLINING']
  const cls = classes[
    score >= 80 ? 0 : score >= 65 ? 1 : score >= 50 ? 2 : score >= 35 ? 3 : 4
  ]
  const permitVolume = 4000 + (seed % 12000)
  const permitValue  = Math.round(permitVolume * (0.18 + (seed % 10) * 0.01))
  const employment   = 20 + (seed % 80)
  const federalAwards = 100 + (seed % 800)
  const permitYoy    = -10 + (seed % 25)
  const materialYoy  = 2 + (seed % 10)
  const pressure     = materialYoy > 8 ? 'HIGH' : materialYoy > 5 ? 'ELEVATED' : materialYoy > 3 ? 'MODERATE' : 'LOW'
  const rank         = 30 + (seed % 40)

  const history = Array.from({ length: 24 }, (_, i) => {
    const monthsAgo = 23 - i
    const trendPerMonth = permitYoy / 100 / 12
    const raw = Math.round(permitVolume * (1 - trendPerMonth * monthsAgo) * (1 + Math.sin(i * 1.8) * 0.04))
    const d = new Date()
    d.setMonth(d.getMonth() - monthsAgo)
    const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    return { label, permits: Math.max(0, raw) }
  })

  return {
    market: query,
    classification: cls,
    score,
    nationalRank: rank,
    metrics: {
      permitVolume:     { value: permitVolume,  yoy: permitYoy },
      permitValue:      { value: permitValue,   yoy: Math.round(permitYoy * 1.2 * 10) / 10 },
      employment:       { value: employment,    yoy: Math.round(permitYoy * 0.6 * 10) / 10 },
      federalAwards:    { value: federalAwards, yoy: Math.round(permitYoy * 0.8 * 10) / 10 },
      materialsPressure:{ value: pressure,      yoy: materialYoy },
    },
    history,
    comparables: MARKETS.slice(0, 3).map(m => ({
      market:         m.market,
      classification: m.classification,
      score:          m.score,
    })),
    source: 'ConstructAIQ Synthetic',
    live:   false,
    updated: new Date().toISOString(),
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const autocomplete = searchParams.get('autocomplete')
  const marketQuery  = searchParams.get('market')

  // Autocomplete endpoint
  if (autocomplete !== null) {
    const suggestions = getSuggestions(autocomplete)
    return NextResponse.json({ suggestions }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' },
    })
  }

  // Market check endpoint
  if (!marketQuery || !marketQuery.trim()) {
    return NextResponse.json(
      { error: 'Missing required parameter: market' },
      { status: 400 }
    )
  }

  const seed = findMarket(marketQuery.trim())

  if (seed) {
    const history = buildHistory(seed)
    const comparables = seed.comparables.map(name => {
      const c = MARKETS.find(m => m.market === name)
      return c ? { market: c.market, classification: c.classification, score: c.score } : null
    }).filter(Boolean)

    const data = {
      market:         seed.market,
      classification: seed.classification,
      score:          seed.score,
      nationalRank:   seed.nationalRank,
      metrics: {
        permitVolume:      { value: seed.permitVolume,      yoy: seed.permitYoy },
        permitValue:       { value: seed.permitValue,       yoy: seed.permitValueYoy },
        employment:        { value: seed.employment,        yoy: seed.employmentYoy },
        federalAwards:     { value: seed.federalAwards,     yoy: seed.federalYoy },
        materialsPressure: { value: seed.materialsPressure, yoy: seed.materialYoy },
      },
      history,
      comparables,
      source:  'ConstructAIQ',
      live:    false,
      updated: new Date().toISOString(),
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  }

  // Unknown market — synthetic fallback
  return NextResponse.json(syntheticMarket(marketQuery.trim()), {
    headers: { 'Cache-Control': 'public, s-maxage=3600' },
  })
}
