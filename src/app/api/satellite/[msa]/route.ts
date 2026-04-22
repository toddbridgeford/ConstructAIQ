import { NextResponse, type NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { classifyActivity, FALSE_POSITIVE_EXPLANATIONS, type Classification } from '../_lib'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
}

interface BsiDetail {
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
}

interface BsiSparkPoint {
  observation_date: string
  bsi_mean: number | null
  bsi_change_90d: number | null
  cloud_cover_pct: number | null
  confidence: string | null
}

interface FusionDetail {
  computed_at: string
  federal_awards_90d: number | null
  storm_events_90d: number | null
  classification: string | null
  confidence: string | null
  interpretation: string | null
}

interface MsaBoundary {
  msa_name: string
  state_codes: string[]
  bbox_west: number
  bbox_south: number
  bbox_east: number
  bbox_north: number
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ msa: string }> },
) {
  const { msa } = await params
  const msa_code = msa.toUpperCase()

  if (!/^[A-Z]{2,5}$/.test(msa_code)) {
    return NextResponse.json({ error: 'Invalid MSA code' }, { status: 400 })
  }

  try {
    const [latestResult, historyResult, fusionResult, boundaryResult] = await Promise.all([
      supabase
        .from('satellite_bsi')
        .select('*')
        .eq('msa_code', msa_code)
        .order('observation_date', { ascending: false })
        .limit(1),
      supabase
        .from('satellite_bsi')
        .select('observation_date, bsi_mean, bsi_change_90d, cloud_cover_pct, confidence')
        .eq('msa_code', msa_code)
        .order('observation_date', { ascending: false })
        .limit(12),
      supabase
        .from('signal_fusion')
        .select('computed_at, federal_awards_90d, storm_events_90d, classification, confidence, interpretation')
        .eq('msa_code', msa_code)
        .order('computed_at', { ascending: false })
        .limit(1),
      supabase
        .from('msa_boundaries')
        .select('msa_name, state_codes, bbox_west, bbox_south, bbox_east, bbox_north')
        .eq('msa_code', msa_code)
        .single(),
    ])

    if (!latestResult.data?.length) {
      return NextResponse.json(
        { error: `No satellite data for MSA: ${msa_code}` },
        { status: 404 },
      )
    }

    const latest = latestResult.data[0] as BsiDetail
    const fusion = (fusionResult.data?.[0] ?? null) as FusionDetail | null
    const boundary = (boundaryResult.data ?? null) as MsaBoundary | null

    const classification: Classification =
      (fusion?.classification as Classification | null) ??
      classifyActivity(
        latest.bsi_change_90d,
        fusion?.federal_awards_90d ?? 0,
        fusion?.storm_events_90d ?? 0,
      )

    // Annotate each false positive flag with a human-readable explanation
    const annotatedFlags = (latest.false_positive_flags ?? []).map(flag => ({
      flag,
      explanation:
        FALSE_POSITIVE_EXPLANATIONS[flag] ??
        'Potential non-construction source detected in this MSA',
    }))

    // Return time series oldest-first for sparkline rendering
    const timeSeries = ((historyResult.data ?? []) as BsiSparkPoint[]).reverse()

    return NextResponse.json(
      {
        msa_code,
        msa_name: boundary?.msa_name ?? msa_code,
        state_codes: boundary?.state_codes ?? [],
        bbox: boundary
          ? {
              west: boundary.bbox_west,
              south: boundary.bbox_south,
              east: boundary.bbox_east,
              north: boundary.bbox_north,
            }
          : null,
        observation_date: latest.observation_date,
        bsi_mean: latest.bsi_mean,
        bsi_change_90d: latest.bsi_change_90d,
        bsi_change_yoy: latest.bsi_change_yoy,
        cloud_cover_pct: latest.cloud_cover_pct,
        valid_pixels: latest.valid_pixels,
        total_pixels: latest.total_pixels,
        confidence: latest.confidence,
        false_positive_flags: annotatedFlags,
        scene_ids: latest.scene_ids ?? [],
        classification,
        interpretation: fusion?.interpretation ?? null,
        fusion: fusion
          ? {
              federal_awards_90d: fusion.federal_awards_90d,
              storm_events_90d: fusion.storm_events_90d,
              confidence: fusion.confidence,
              computed_at: fusion.computed_at,
            }
          : null,
        time_series: timeSeries,
      },
      { headers: CACHE_HEADERS },
    )
  } catch (err) {
    console.error(`[/api/satellite/${msa_code}]`, err)
    return NextResponse.json({ error: 'Failed to fetch MSA satellite data' }, { status: 500 })
  }
}
