import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { classifyActivity, cacheGet, cacheSet, type Classification } from './_lib'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_KEY = 'satellite:list:v1'
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
}

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
  msa_boundaries: {
    msa_name: string
    state_codes: string[]
    bbox_west: number
    bbox_south: number
    bbox_east: number
    bbox_north: number
  } | null
}

interface FusionRow {
  msa_code: string
  computed_at: string
  federal_awards_90d: number | null
  storm_events_90d: number | null
  classification: string | null
  confidence: string | null
  interpretation: string | null
}

export async function GET() {
  try {
    const cached = await cacheGet<object>(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached, { headers: CACHE_HEADERS })
    }

    // Fetch latest BSI per MSA and latest signal_fusion per MSA in parallel.
    // Dedup in JS — Supabase JS client lacks DISTINCT ON support.
    const [bsiResult, fusionResult] = await Promise.all([
      supabase
        .from('satellite_bsi')
        .select(`
          msa_code, observation_date, bsi_mean,
          bsi_change_90d, bsi_change_yoy, cloud_cover_pct,
          valid_pixels, total_pixels, confidence, false_positive_flags,
          msa_boundaries (
            msa_name, state_codes,
            bbox_west, bbox_south, bbox_east, bbox_north
          )
        `)
        .order('msa_code', { ascending: true })
        .order('observation_date', { ascending: false }),
      supabase
        .from('signal_fusion')
        .select(`
          msa_code, computed_at,
          federal_awards_90d, storm_events_90d,
          classification, confidence, interpretation
        `)
        .order('msa_code', { ascending: true })
        .order('computed_at', { ascending: false }),
    ])

    if (bsiResult.error) {
      console.error('[/api/satellite]', bsiResult.error.message)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    // Latest BSI per MSA
    const bsiSeen = new Set<string>()
    const latestBsi = (bsiResult.data as unknown as BsiRow[]).filter(row => {
      if (bsiSeen.has(row.msa_code)) return false
      bsiSeen.add(row.msa_code)
      return true
    })

    if (latestBsi.length === 0) {
      return NextResponse.json(
        {
          processing_status: 'pending_first_run',
          msas: [],
          msa_count: 0,
          ranked_by_activity: [],
        },
        { headers: CACHE_HEADERS },
      )
    }

    // Latest signal_fusion per MSA
    const fusionByMsa = new Map<string, FusionRow>()
    if (!fusionResult.error && fusionResult.data) {
      const fusionSeen = new Set<string>()
      ;(fusionResult.data as unknown as FusionRow[]).forEach(row => {
        if (!fusionSeen.has(row.msa_code)) {
          fusionSeen.add(row.msa_code)
          fusionByMsa.set(row.msa_code, row)
        }
      })
    }

    const msas = latestBsi.map(row => {
      const fusion = fusionByMsa.get(row.msa_code)
      const classification: Classification =
        (fusion?.classification as Classification | null) ??
        classifyActivity(
          row.bsi_change_90d,
          fusion?.federal_awards_90d ?? 0,
          fusion?.storm_events_90d ?? 0,
        )

      return {
        msa_code: row.msa_code,
        msa_name: row.msa_boundaries?.msa_name ?? row.msa_code,
        state_codes: row.msa_boundaries?.state_codes ?? [],
        observation_date: row.observation_date,
        bsi_mean: row.bsi_mean,
        bsi_change_90d: row.bsi_change_90d,
        bsi_change_yoy: row.bsi_change_yoy,
        cloud_cover_pct: row.cloud_cover_pct,
        confidence: row.confidence,
        false_positive_flags: row.false_positive_flags ?? [],
        classification,
        interpretation: fusion?.interpretation ?? null,
      }
    })

    // Rank by bsi_change_90d descending — most active first
    const ranked_by_activity = [...msas]
      .filter(m => m.bsi_change_90d !== null)
      .sort((a, b) => (b.bsi_change_90d ?? 0) - (a.bsi_change_90d ?? 0))
      .map(m => m.msa_code)

    const last_processed = latestBsi.reduce(
      (max, r) => (r.observation_date > max ? r.observation_date : max),
      latestBsi[0].observation_date,
    )

    const response = {
      processing_status: 'live' as const,
      last_processed,
      msa_count: msas.length,
      msas,
      ranked_by_activity,
    }

    await cacheSet(CACHE_KEY, response)

    return NextResponse.json(response, { headers: CACHE_HEADERS })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Supabase not configured — treat the same as no data yet
    if (msg.includes('supabaseUrl') || msg.includes('required')) {
      return NextResponse.json(
        { processing_status: 'pending_first_run', msas: [], msa_count: 0, ranked_by_activity: [] },
        { headers: CACHE_HEADERS },
      )
    }
    console.error('[/api/satellite]', err)
    return NextResponse.json({ error: 'Failed to fetch satellite data' }, { status: 500 })
  }
}
