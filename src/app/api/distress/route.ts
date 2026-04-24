import { NextResponse } from "next/server"
import { getLatestObs } from "@/lib/supabase"

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function toPeriod(obsDate: string): string { return obsDate.slice(0, 7) }

function nationalCDI(permitYoy: number | null, empYoy: number | null): number {
  const pPenalty = permitYoy !== null ? Math.max(-20, Math.min(20, -permitYoy * 1.5)) : 0
  const ePenalty = empYoy    !== null ? Math.max(-15, Math.min(15, -empYoy    * 8.0)) : 0
  return Math.max(0, Math.min(100, Math.round(28 + pPenalty + ePenalty)))
}

function classify(cdi: number): string {
  if (cdi >= 60) return 'HIGH'
  if (cdi >= 40) return 'ELEVATED'
  return 'LOW RISK'
}

export async function GET() {
  try {
    const [permit, labor] = await Promise.all([
      getLatestObs('PERMIT', 72),
      getLatestObs('CES2000000001', 72),
    ])

    if (!permit.length && !labor.length) {
      return NextResponse.json(
        { error: 'No construction indicator data in database' },
        { status: 503 }
      )
    }

    const permitMap = new Map(permit.map(r => [toPeriod(r.obs_date), Number(r.value)]))
    const laborMap  = new Map(labor.map(r  => [toPeriod(r.obs_date), Number(r.value)]))

    const allPeriods = new Set([...permitMap.keys(), ...laborMap.keys()])
    const periods    = Array.from(allPeriods).sort()

    // Build CDI history for each period that has a 12-period lag
    const histData: { month: string; cdi: number }[] = []
    for (let i = 12; i < periods.length; i++) {
      const p   = periods[i]
      const p12 = periods[i - 12]
      const pCur  = permitMap.get(p)   ?? null
      const p12v  = permitMap.get(p12) ?? null
      const eCur  = laborMap.get(p)    ?? null
      const e12v  = laborMap.get(p12)  ?? null
      const permitYoy = pCur && p12v ? (pCur - p12v) / p12v * 100 : null
      const empYoy    = eCur && e12v  ? (eCur - e12v) / e12v * 100 : null
      const cdi = nationalCDI(permitYoy, empYoy)
      const d   = new Date(p + '-01')
      const month = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      histData.push({ month, cdi })
    }

    const hist_data = histData.slice(-36)
    const latest    = hist_data[hist_data.length - 1]
    const national_avg_cdi          = latest?.cdi ?? 28
    const national_classification   = classify(national_avg_cdi)

    return NextResponse.json({
      national_avg_cdi,
      national_classification,
      watchlist: [],
      recovery:  [],
      hist_data,
      generated_at: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    })
  } catch (err) {
    console.error('[/api/distress]', err)
    return NextResponse.json({ error: 'Failed to compute distress index' }, { status: 500 })
  }
}
