import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface StatRow {
  msa_code: string
  obs_count: number
  avg_cloud: number | null
  pct_high: number
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('satellite_bsi')
      .select('msa_code, cloud_cover_pct, confidence')

    if (error) {
      console.error('[/api/satellite/stats]', error.message)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ stats: [], msa_count: 0 })
    }

    // Group by msa_code
    const groups: Record<string, { cloud: number[]; confidence: string[] }> = {}
    for (const row of data) {
      if (!groups[row.msa_code]) groups[row.msa_code] = { cloud: [], confidence: [] }
      if (row.cloud_cover_pct !== null) groups[row.msa_code].cloud.push(row.cloud_cover_pct as number)
      if (row.confidence) groups[row.msa_code].confidence.push(row.confidence as string)
    }

    const stats: StatRow[] = Object.entries(groups).map(([msa_code, g]) => {
      const obs_count = data.filter(r => r.msa_code === msa_code).length
      const avg_cloud = g.cloud.length > 0
        ? g.cloud.reduce((a, b) => a + b, 0) / g.cloud.length
        : null
      const pct_high = g.confidence.length > 0
        ? (g.confidence.filter(c => c === 'HIGH').length / g.confidence.length) * 100
        : 0
      return { msa_code, obs_count, avg_cloud, pct_high }
    }).sort((a, b) => a.msa_code.localeCompare(b.msa_code))

    return NextResponse.json(
      { stats, msa_count: stats.length },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
    )
  } catch (err) {
    console.error('[/api/satellite/stats]', err)
    return NextResponse.json({ error: 'Failed to fetch satellite stats' }, { status: 500 })
  }
}
