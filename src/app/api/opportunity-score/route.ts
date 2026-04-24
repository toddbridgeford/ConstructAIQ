import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { apiError, ERROR_CODES } from '@/lib/errors'
import {
  computeOpportunityScore,
  type Classification,
  type Confidence,
  type ScoreDriver,
} from '@/lib/opportunityScore'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
}

interface CachedRow {
  metro_code:     string
  score:          number
  classification: Classification
  confidence:     Confidence
  driver_json:    {
    drivers?:     ScoreDriver[]
    top_drivers?: ScoreDriver[]
    metro_name?:  string | null
    state_code?:  string | null
    msa_code?:    string | null
  } | null
  computed_at:    string
  valid_through:  string
}

export async function GET(request: Request) {
  const { searchParams, protocol, host } = new URL(request.url)
  const type  = (searchParams.get('type') ?? 'metro').toLowerCase()
  const metro = (searchParams.get('metro') ?? searchParams.get('id') ?? '')
    .trim()
    .toUpperCase()
  const force = searchParams.get('force') === 'true'

  if (type !== 'metro') {
    return apiError('Only type=metro is supported today.', 400, ERROR_CODES.INVALID_PARAMS)
  }
  if (!metro) {
    return apiError('Metro code required. Use ?metro=PHX or ?id=PHX.', 400, ERROR_CODES.INVALID_PARAMS)
  }

  // ── 1. Serve a fresh cached score if we have one ──────────────────────────
  if (!force) {
    try {
      const { data: cached } = await supabase
        .from('opportunity_scores')
        .select('metro_code, score, classification, confidence, driver_json, computed_at, valid_through')
        .eq('metro_code', metro)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const row = cached as CachedRow | null
      if (row && new Date(row.valid_through).getTime() > Date.now()) {
        return NextResponse.json(
          {
            metro_code:     row.metro_code,
            metro_name:     row.driver_json?.metro_name  ?? null,
            state_code:     row.driver_json?.state_code  ?? null,
            msa_code:       row.driver_json?.msa_code    ?? null,
            score:          row.score,
            classification: row.classification,
            confidence:     row.confidence,
            drivers:        row.driver_json?.drivers     ?? [],
            top_drivers:    row.driver_json?.top_drivers ?? [],
            computed_at:    row.computed_at,
            valid_through:  row.valid_through,
            cached:         true,
          },
          { headers: CACHE_HEADERS },
        )
      }
    } catch {
      // Cache miss or Supabase unavailable — fall through to live compute
    }
  }

  // ── 2. Live compute ───────────────────────────────────────────────────────
  const baseUrl = `${protocol}//${host}`
  const result  = await computeOpportunityScore(metro, { baseUrl })

  if (!result) {
    return apiError(`Metro "${metro}" is not tracked. Known metros come from permit_sources.`, 404, ERROR_CODES.NOT_FOUND)
  }

  // Best-effort persistence so the next read hits cache
  void (async () => {
    try {
      await supabaseAdmin
        .from('opportunity_scores')
        .upsert(
          {
            metro_code:     result.metro_code,
            score:          result.score,
            classification: result.classification,
            confidence:     result.confidence,
            driver_json:    {
              drivers:     result.drivers,
              top_drivers: result.top_drivers,
              metro_name:  result.metro_name,
              state_code:  result.state_code,
              msa_code:    result.msa_code,
            },
            computed_at:   result.computed_at,
            valid_through: result.valid_through,
          },
          { onConflict: 'metro_code,computed_at' },
        )
    } catch (err) {
      console.warn('[opportunity-score] persistence failed:', err)
    }
  })()

  return NextResponse.json({ ...result, cached: false }, { headers: CACHE_HEADERS })
}
