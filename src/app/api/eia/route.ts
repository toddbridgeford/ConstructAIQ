import { NextResponse } from 'next/server'

const EIA_KEY = process.env.EIA_API_KEY || ''

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!EIA_KEY) return NextResponse.json(getSyntheticEIA(), { headers: { 'Cache-Control': 'public, s-maxage=14400' } })

    const url = 'https://api.eia.gov/v2/total-energy/data/?api_key=' + EIA_KEY + '&frequency=monthly&data[0]=value&facets[msn][]=CNCBUS&sort[0][column]=period&sort[0][direction]=desc&length=24'
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return NextResponse.json(getSyntheticEIA(), { headers: { 'Cache-Control': 'public, s-maxage=14400' } })

    const data = await res.json()
    const rows = data?.response?.data || []

    type EiaRow = { period: string; value: string | null; 'unit-name'?: string }
    const series = (rows as EiaRow[])
      .filter(r => r.value != null)
      .map(r => ({
        period: r.period,
        value: parseFloat(r.value!),
        unit: r['unit-name'] || 'Trillion BTU',
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    const latest = series[series.length - 1]
    const prev   = series[series.length - 2]
    const mom    = prev && prev.value > 0 ? ((latest.value - prev.value) / prev.value * 100) : 0

    return NextResponse.json({
      source: 'U.S. Energy Information Administration',
      live: true,
      series: 'Construction sector energy consumption (CNCBUS)',
      unit: 'Trillion BTU',
      data: series,
      summary: {
        latest: latest?.value,
        period: latest?.period,
        mom: parseFloat(mom.toFixed(2)),
        signal: mom > 3 ? 'ELEVATED — energy cost pressure rising' : mom < -3 ? 'DECLINING — energy cost relief' : 'STABLE',
      },
      updated: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'public, s-maxage=14400' } })
  } catch (err) {
    console.error('[/api/eia]', err)
    return NextResponse.json(getSyntheticEIA(), { headers: { 'Cache-Control': 'public, s-maxage=14400' } })
  }
}

function getSyntheticEIA() {
  return {
    source: 'EIA — synthetic fallback',
    live: false,
    unit: 'Trillion BTU',
    data: [
      { period: '2024-01', value: 284.2 }, { period: '2024-04', value: 291.8 },
      { period: '2024-07', value: 312.4 }, { period: '2024-10', value: 298.7 },
      { period: '2025-01', value: 279.3 }, { period: '2025-04', value: 287.6 },
      { period: '2025-07', value: 308.9 }, { period: '2025-10', value: 294.2 },
      { period: '2026-01', value: 281.7 }, { period: '2026-02', value: 276.4 },
    ],
    summary: { latest: 276.4, period: '2026-02', mom: -1.9, signal: 'STABLE' },
    updated: new Date().toISOString(),
  }
}
