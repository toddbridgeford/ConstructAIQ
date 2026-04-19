import { NextResponse } from 'next/server'

const BLS_KEY = process.env.BLS_API_KEY || ''

// BLS PPI Series IDs for construction materials
const PPI_SERIES = [
  { id:'PCU321113321113',  name:'Lumber & Wood Products',       code:'LBR', unit:'$/MBF approx' },
  { id:'PCU3312103312100', name:'Steel Mill Products',          code:'SHR', unit:'$/ton approx'  },
  { id:'PCU327320327320',  name:'Ready-Mix Concrete',           code:'RMC', unit:'$/CY approx'   },
  { id:'PCU327120327120',  name:'Gypsum Products',              code:'GYP', unit:'Index 1982=100' },
  { id:'PCU3319303319300', name:'Aluminum Mill Products',       code:'ALU', unit:'$/lb approx'   },
  { id:'PCU212312212312',  name:'Copper Ores & NEC',            code:'CU',  unit:'$/lb approx'   },
]

const BLS_API = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'

async function fetchPPISeries(seriesIds: string[]): Promise<any[] | null> {
  if (!BLS_KEY) return null
  try {
    const body = {
      seriesid: seriesIds,
      startyear: '2024',
      endyear:   '2026',
      registrationkey: BLS_KEY,
    }
    const res  = await fetch(BLS_API, {
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
    const rawSeries = await fetchPPISeries(PPI_SERIES.map(s => s.id))

    if (!rawSeries) {
      return NextResponse.json(getSyntheticPPI(), {
        headers: { 'Cache-Control': 'public, s-maxage=14400' },
      })
    }

    // Build response — each series with latest value + MoM change
    const processed = rawSeries.map((s: any, i: number) => {
      const info  = PPI_SERIES.find(p => p.id === s.seriesID) || PPI_SERIES[i]
      const obs   = s.data as any[]

      const sorted  = obs
        .filter((d: any) => d.period.startsWith('M'))
        .sort((a: any, b: any) => {
          const da = new Date(a.year + '-' + a.period.slice(1).padStart(2, '0'))
          const db = new Date(b.year + '-' + b.period.slice(1).padStart(2, '0'))
          return db.getTime() - da.getTime()
        })

      const latest  = parseFloat(sorted[0]?.value || '0')
      const prev    = parseFloat(sorted[1]?.value || latest.toString())
      const mom     = prev > 0 ? (latest - prev) / prev * 100 : 0
      const yoyData = sorted.find((d: any) => d.year === String(parseInt(sorted[0]?.year) - 1) && d.period === sorted[0]?.period)
      const yoy     = yoyData ? (latest - parseFloat(yoyData.value)) / parseFloat(yoyData.value) * 100 : 0

      // AI signal
      const signal = mom > 2 ? 'SELL' : mom < -2 ? 'BUY' : 'HOLD'

      return {
        seriesId:  s.seriesID,
        code:      info.code,
        name:      info.name,
        unit:      info.unit,
        latest,
        mom:       parseFloat(mom.toFixed(2)),
        yoy:       parseFloat(yoy.toFixed(2)),
        signal,
        history:   sorted.slice(0, 24).map((d: any) => ({
          date:    `${d.year}-${d.period.slice(1).padStart(2,'0')}`,
          value:   parseFloat(d.value),
        })).reverse(),
      }
    })

    // Composite cost pressure index (weighted average of MoMs)
    const weights  = [0.30, 0.25, 0.20, 0.08, 0.09, 0.08]
    const pressure = processed.reduce((s, p, i) => s + (weights[i] || 0.1) * (p.mom + 5), 0)
    const cpi      = Math.min(100, Math.max(0, parseFloat(pressure.toFixed(1))))

    return NextResponse.json({
      source:  'Bureau of Labor Statistics — Producer Price Indices',
      live:    true,
      series:  processed,
      compositePressureIndex: {
        value:  cpi,
        label:  cpi > 65 ? 'ELEVATED PRESSURE' : cpi > 45 ? 'MODERATE PRESSURE' : 'LOW PRESSURE',
      },
      updated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=14400' },
    })
  } catch (err) {
    console.error('[/api/ppi]', err)
    return NextResponse.json(getSyntheticPPI(), {
      headers: { 'Cache-Control': 'public, s-maxage=14400' },
    })
  }
}

function getSyntheticPPI() {
  return {
    source:  'BLS PPI — synthetic fallback',
    live:    false,
    series: [
      { code:'LBR', name:'Lumber & Wood',   mom:3.2,  yoy:8.1,  latest:512, signal:'BUY'  },
      { code:'SHR', name:'Steel HR',        mom:-1.4, yoy:-3.2, latest:748, signal:'SELL' },
      { code:'RMC', name:'Ready-Mix Conc.', mom:0.2,  yoy:4.8,  latest:168, signal:'BUY'  },
      { code:'GYP', name:'Gypsum',          mom:-0.6, yoy:1.2,  latest:234, signal:'HOLD' },
      { code:'ALU', name:'Aluminum',        mom:1.1,  yoy:6.4,  latest:142, signal:'HOLD' },
      { code:'CU',  name:'Copper',          mom:0.8,  yoy:12.3, latest:482, signal:'HOLD' },
    ],
    compositePressureIndex: { value:62, label:'MODERATE PRESSURE' },
    updated: new Date().toISOString(),
  }
}
