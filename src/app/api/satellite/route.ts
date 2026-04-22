import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface BsiRow {
  msa_code: string
  observation_date: string
  bsi_mean: number | null
  bsi_change_90d: number | null
  bsi_change_yoy: number | null
  cloud_cover_pct: number | null
  valid_pixels: number | null
  total_pixels: number | null
  confidence: string | null
  false_positive_flags: string[] | null
  scene_ids: string[] | null
  msa_boundaries: {
    msa_name: string
    state_codes: string[]
    bbox_west: number
    bbox_south: number
    bbox_east: number
    bbox_north: number
  } | null
}

export async function GET() {
  try {
    // Latest observation per MSA via ranked subquery approach: fetch all rows
    // ordered by (msa_code, observation_date DESC) and deduplicate in JS —
    // avoids Supabase's lack of DISTINCT ON support in the JS client.
    const { data, error } = await supabase
      .from('satellite_bsi')
      .select(`
        msa_code,
        observation_date,
        bsi_mean,
        bsi_change_90d,
        bsi_change_yoy,
        cloud_cover_pct,
        valid_pixels,
        total_pixels,
        confidence,
        false_positive_flags,
        scene_ids,
        msa_boundaries (
          msa_name,
          state_codes,
          bbox_west,
          bbox_south,
          bbox_east,
          bbox_north
        )
      `)
      .order('msa_code', { ascending: true })
      .order('observation_date', { ascending: false })

    if (error) {
      console.error('[/api/satellite]', error.message)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    // Deduplicate: keep first (most recent) row per msa_code
    const seen = new Set<string>()
    const latest = (data as unknown as BsiRow[]).filter(row => {
      if (seen.has(row.msa_code)) return false
      seen.add(row.msa_code)
      return true
    })

    if (latest.length === 0) {
      return NextResponse.json(
        { processing_status: 'pending_first_run', data: [] },
        { headers: { 'Cache-Control': 'public, s-maxage=300' } },
      )
    }

    const result = latest.map(row => ({
      msa_code: row.msa_code,
      msa_name: row.msa_boundaries?.msa_name ?? row.msa_code,
      state_codes: row.msa_boundaries?.state_codes ?? [],
      bbox: row.msa_boundaries
        ? {
            west: row.msa_boundaries.bbox_west,
            south: row.msa_boundaries.bbox_south,
            east: row.msa_boundaries.bbox_east,
            north: row.msa_boundaries.bbox_north,
          }
        : null,
      observation_date: row.observation_date,
      bsi_mean: row.bsi_mean,
      bsi_change_90d: row.bsi_change_90d,
      bsi_change_yoy: row.bsi_change_yoy,
      cloud_cover_pct: row.cloud_cover_pct,
      valid_pixels: row.valid_pixels,
      total_pixels: row.total_pixels,
      confidence: row.confidence,
      false_positive_flags: row.false_positive_flags ?? [],
      scene_ids: row.scene_ids ?? [],
    }))

    return NextResponse.json(
      { processing_status: 'ok', data: result },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
    )
  } catch (err) {
    console.error('[/api/satellite]', err)
    return NextResponse.json({ error: 'Failed to fetch satellite data' }, { status: 500 })
  }
}
