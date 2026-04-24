import { NextResponse } from 'next/server'
import { getLatestObs } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface HistoryPoint { period: string; value: number }

function toPeriod(obsDate: string): string { return obsDate.slice(0, 7) }

function avgOf(a: number | undefined, b: number | undefined): number | null {
  if (a !== undefined && b !== undefined) return (a + b) / 2
  if (a !== undefined) return a
  if (b !== undefined) return b
  return null
}

function norm(val: number | null, base: number | null): number {
  if (val === null || base === null || base === 0) return 100
  return (val / base) * 100
}

function momChg(cur: number | null, prev: number | null): number | null {
  if (cur === null || prev === null || prev === 0) return null
  return parseFloat(((cur - prev) / prev * 100).toFixed(1))
}

export async function GET() {
  try {
    const [lumber, steel, labor] = await Promise.all([
      getLatestObs('PPI_LUMBER', 72),
      getLatestObs('PPI_STEEL',  72),
      getLatestObs('CES2000000001', 72),
    ])

    if (!lumber.length && !steel.length && !labor.length) {
      return NextResponse.json(
        { error: 'No construction cost data in database' },
        { status: 503 }
      )
    }

    const lumberMap = new Map(lumber.map(r => [toPeriod(r.obs_date), Number(r.value)]))
    const steelMap  = new Map(steel.map(r  => [toPeriod(r.obs_date), Number(r.value)]))
    const laborMap  = new Map(labor.map(r  => [toPeriod(r.obs_date), Number(r.value)]))

    const allPeriods = new Set<string>()
    for (const r of [...lumber, ...steel, ...labor]) {
      const p = toPeriod(r.obs_date)
      if (p >= '2020-01') allPeriods.add(p)
    }
    const periods = Array.from(allPeriods).sort()

    if (!periods.length) {
      return NextResponse.json(
        { error: 'No construction cost data from 2020 onwards' },
        { status: 503 }
      )
    }

    // Normalise to base 100 at earliest available period at/after 2020-01
    const BASE       = periods[0]
    const baseMatRaw = avgOf(lumberMap.get(BASE), steelMap.get(BASE))
    const baseLabRaw = laborMap.get(BASE) ?? null

    // CCCI = 0.45 × mat_idx + 0.28 × lab_idx + 0.27 × 100
    // Equipment (12%), fuel (10%), overhead (5%) have no harvested series → assumed flat at base
    const history: HistoryPoint[] = periods.map(p => {
      const matRaw = avgOf(lumberMap.get(p), steelMap.get(p))
      const labRaw = laborMap.get(p) ?? null
      const ccci   = 0.45 * norm(matRaw, baseMatRaw) + 0.28 * norm(labRaw, baseLabRaw) + 0.27 * 100
      return { period: p, value: parseFloat(ccci.toFixed(2)) }
    })

    const last   = history[history.length - 1]
    const prev   = history.length >= 2  ? history[history.length - 2]  : null
    const prev12 = history.length >= 13 ? history[history.length - 13] : null

    const current    = last.value
    const mom_change = prev   ? parseFloat(((current - prev.value)   / prev.value * 100).toFixed(1)) : 0
    const yoy_change = prev12 ? parseFloat(((current - prev12.value) / prev12.value * 100).toFixed(1)) : 0

    const latLumber  = lumber.length     ? Number(lumber[lumber.length - 1].value)   : null
    const latSteel   = steel.length      ? Number(steel[steel.length - 1].value)     : null
    const latLabor   = labor.length      ? Number(labor[labor.length - 1].value)     : null
    const prevLumber = lumber.length > 1 ? Number(lumber[lumber.length - 2].value)   : null
    const prevSteel  = steel.length  > 1 ? Number(steel[steel.length - 2].value)     : null
    const prevLabor  = labor.length  > 1 ? Number(labor[labor.length - 2].value)     : null

    const latMat  = avgOf(latLumber  ?? undefined, latSteel  ?? undefined)
    const prevMat = avgOf(prevLumber ?? undefined, prevSteel ?? undefined)

    const matIdx = parseFloat(norm(latMat,   baseMatRaw).toFixed(1))
    const labIdx = parseFloat(norm(latLabor, baseLabRaw).toFixed(1))

    // 12-month forecast from 6-month linear slope
    const last6  = history.slice(-6)
    const slope  = last6.length >= 2
      ? (last6[last6.length - 1].value - last6[0].value) / (last6.length - 1)
      : 0
    const forecast_12mo = parseFloat((current + slope * 12).toFixed(1))

    return NextResponse.json(
      {
        current, base: 100, base_date: BASE, period: last.period,
        mom_change, yoy_change,
        components: {
          materials: { value: matIdx,  weight: 0.45, mom_change: momChg(latMat,   prevMat),   label: 'Materials' },
          labor:     { value: labIdx,  weight: 0.28, mom_change: momChg(latLabor, prevLabor), label: 'Labor'     },
          equipment: { value: null,    weight: 0.12, mom_change: null,                         label: 'Equipment' },
          fuel:      { value: null,    weight: 0.10, mom_change: null,                         label: 'Fuel'      },
          overhead:  { value: null,    weight: 0.05, mom_change: null,                         label: 'Overhead'  },
        },
        forecast_12mo,
        forecast_range: {
          low_80:  parseFloat((forecast_12mo - 2.5).toFixed(1)),
          high_80: parseFloat((forecast_12mo + 2.5).toFixed(1)),
        },
        history,
        updatedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
    )
  } catch (err) {
    console.error('[/api/ccci]', err)
    return NextResponse.json({ error: 'Failed to compute CCCI' }, { status: 500 })
  }
}
