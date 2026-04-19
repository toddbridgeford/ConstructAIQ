import { NextResponse } from 'next/server'

const BLS_KEY = process.env.BLS_API_KEY || ''

// JOLTS Series IDs — Construction sector (NAICS 23)
// JTU2300000000000000HIL — Hires, construction, total (thousands)
// JTU2300000000000000JOL — Job Openings, construction
// JTU2300000000000000QUL — Quits, construction
// JTU2300000000000000TSL — Total Separations, construction
const JOLTS_SERIES = [
  { id:'JTU2300000000000000JOL', name:'Job Openings',       metric:'openings'     },
  { id:'JTU2300000000000000HIL', name:'Hires',              metric:'hires'        },
  { id:'JTU2300000000000000QUL', name:'Quits',              metric:'quits'        },
  { id:'JTU2300000000000000TSL', name:'Total Separations',  metric:'separations'  },
]

async function fetchJOLTS(): Promise<any[] | null> {
  if (!BLS_KEY) return null
  try {
    const body = {
      seriesid:         JOLTS_SERIES.map(s => s.id),
      startyear:        '2023',
      endyear:          '2026',
      registrationkey:  BLS_KEY,
    }
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      next:    { revalidate: 14400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.Results?.series || null
  } catch {
    return null
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rawSeries = await fetchJOLTS()

    if (!rawSeries) {
      return NextResponse.json(getSyntheticJOLTS(), {
        headers: { 'Cache-Control': 'public, s-maxage=14400' },
      })
    }

    const processed: Record<string, any> = {}

    rawSeries.forEach((s: any) => {
      const info = JOLTS_SERIES.find(j => j.id === s.seriesID)
      if (!info) return

      const obs    = (s.data as any[])
        .filter((d: any) => d.period.startsWith('M'))
        .sort((a: any, b: any) => {
          if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year)
          return parseInt(b.period.slice(1)) - parseInt(a.period.slice(1))
        })

      const latest = parseFloat(obs[0]?.value || '0')
      const prev   = parseFloat(obs[1]?.value || latest.toString())
      const mom    = prev > 0 ? (latest - prev) / prev * 100 : 0

      processed[info.metric] = {
        latest:   latest,
        mom:      parseFloat(mom.toFixed(2)),
        history:  obs.slice(0, 24).map((d: any) => ({
          date:  `${d.year}-${d.period.slice(1).padStart(2,'0')}`,
          value: parseFloat(d.value),
        })).reverse(),
      }
    })

    const openings   = processed['openings']?.latest || 312
    const hires      = processed['hires']?.latest || 428
    const quits      = processed['quits']?.latest || 98
    const quitRate   = hires > 0 ? parseFloat((quits / hires * 100).toFixed(1)) : 22.9

    // Labor tightness signals
    const vacancyRate    = parseFloat((openings / 8330 * 100).toFixed(1))  // vs total employment
    const tightnessLabel = vacancyRate > 4 ? 'VERY TIGHT' : vacancyRate > 3 ? 'TIGHT' : vacancyRate > 2 ? 'MODERATE' : 'SLACK'

    return NextResponse.json({
      source:   'Bureau of Labor Statistics — JOLTS Construction',
      live:     true,
      data:     processed,
      summary: {
        openings,
        hires,
        quits,
        vacancyRate,
        quitRate,
        tightnessLabel,
        signal:  vacancyRate > 3.5 ? 'WARNING: Severe labor shortage constraining project delivery' : 'Labor market moderating',
      },
      updated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=14400' },
    })
  } catch (err) {
    console.error('[/api/jolts]', err)
    return NextResponse.json(getSyntheticJOLTS(), {
      headers: { 'Cache-Control': 'public, s-maxage=14400' },
    })
  }
}

function getSyntheticJOLTS() {
  return {
    source:   'BLS JOLTS — synthetic fallback',
    live:     false,
    summary: {
      openings:       312,
      hires:          428,
      quits:          98,
      vacancyRate:    3.7,    // % of construction workforce
      quitRate:       22.9,   // % of hires
      tightnessLabel: 'TIGHT',
      signal:         'WARNING: Craft labor vacancy at 3.7% — 12-year high',
    },
    monthly: [
      { date:'2024-01', openings:289, hires:412, quits:88 },
      { date:'2024-04', openings:298, hires:421, quits:92 },
      { date:'2024-07', openings:304, hires:431, quits:94 },
      { date:'2024-10', openings:308, hires:424, quits:96 },
      { date:'2025-01', openings:302, hires:418, quits:91 },
      { date:'2025-04', openings:307, hires:422, quits:93 },
      { date:'2025-07', openings:310, hires:426, quits:95 },
      { date:'2025-10', openings:314, hires:430, quits:97 },
      { date:'2026-01', openings:312, hires:428, quits:98 },
    ],
    updated: new Date().toISOString(),
  }
}
