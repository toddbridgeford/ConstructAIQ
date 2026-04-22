import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cacheGet, cacheSet } from '../_lib'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_KEY = 'satellite:history:v1'
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
}

interface HistoryRow {
  msa_code: string
  observation_date: string
  bsi_mean: number | null
  bsi_change_90d: number | null
  cloud_cover_pct: number | null
  confidence: string | null
  msa_boundaries: {
    msa_name: string
    state_codes: string[]
  } | null
}

export async function GET() {
  try {
    const cached = await cacheGet<object>(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached, { headers: CACHE_HEADERS })
    }

    const since = new Date()
    since.setDate(since.getDate() - 90)
    const sinceStr = since.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('satellite_bsi')
      .select(`
        msa_code, observation_date, bsi_mean, bsi_change_90d,
        cloud_cover_pct, confidence,
        msa_boundaries (msa_name, state_codes)
      `)
      .gte('observation_date', sinceStr)
      .order('observation_date', { ascending: true })
      .order('msa_code', { ascending: true })

    if (error) {
      console.error('[/api/satellite/history]', error.message)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    if (!data?.length) {
      return NextResponse.json(
        { dates: [], frames: [], days_covered: 0 },
        { headers: CACHE_HEADERS },
      )
    }

    // Group observations by date into animation frames
    const frameMap = new Map<string, { date: string; msas: object[] }>()
    for (const row of (data as unknown as HistoryRow[])) {
      if (!frameMap.has(row.observation_date)) {
        frameMap.set(row.observation_date, { date: row.observation_date, msas: [] })
      }
      frameMap.get(row.observation_date)!.msas.push({
        msa_code: row.msa_code,
        msa_name: row.msa_boundaries?.msa_name ?? row.msa_code,
        state_codes: row.msa_boundaries?.state_codes ?? [],
        bsi_mean: row.bsi_mean,
        bsi_change_90d: row.bsi_change_90d,
        cloud_cover_pct: row.cloud_cover_pct,
        confidence: row.confidence,
      })
    }

    const frames = Array.from(frameMap.values())
    const dates = frames.map(f => f.date)

    const response = { dates, frames, days_covered: frames.length }

    await cacheSet(CACHE_KEY, response)

    return NextResponse.json(response, { headers: CACHE_HEADERS })
  } catch (err) {
    console.error('[/api/satellite/history]', err)
    return NextResponse.json({ error: 'Failed to fetch satellite history' }, { status: 500 })
  }
}
