import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSourceHealthSummary } from '@/lib/sourceHealth'
import { isWeeklyBriefConfigured } from '@/lib/weeklyBrief'
import { LEADERBOARD_CACHE_KEY } from '@/lib/federal'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SeriesRow = { source: string; last_updated: string | null }

const SOURCE_LABELS: Record<string, string> = {
  FRED:         'FRED / Federal Reserve',
  Census:       'Census Bureau',
  BLS:          'BLS',
  'Freddie Mac':'Freddie Mac',
  USASpending:  'USASpending.gov',
  Copernicus:   'ESA Copernicus (Satellite)',
  SAM:          'SAM.gov Solicitations',
  Socrata:      '40-City Permit Portals',
  WARN:         'DOL WARN Act',
}

function staleness(lastUpdated: string | null): 'ok' | 'warn' | 'stale' {
  if (!lastUpdated) return 'stale'
  const ageDays = (Date.now() - new Date(lastUpdated).getTime()) / 86_400_000
  if (ageDays <= 2) return 'ok'
  if (ageDays <= 7) return 'warn'
  return 'stale'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const deep = searchParams.get('deep') === '1'

  const now      = new Date()
  const day7ago  = new Date(now); day7ago.setDate(now.getDate() - 7)
  const day30ago = new Date(now); day30ago.setDate(now.getDate() - 30)

  // ── Environment booleans (safe — no secret values exposed) ────────────────
  const env = {
    supabaseConfigured:   !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    anthropicConfigured:  !!process.env.ANTHROPIC_API_KEY,
    upstashConfigured:    !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    sentryConfigured:     !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    cronSecretConfigured: !!process.env.CRON_SECRET,
  }

  // ── Runtime context ───────────────────────────────────────────────────────
  const runtimeSection = {
    nodeEnv:    process.env.NODE_ENV ?? 'unknown',
    appUrl:     process.env.NEXT_PUBLIC_APP_URL ?? null,
    siteLocked: process.env.SITE_LOCKED === 'true',
  }

  const hasEiaKey  = !!process.env.EIA_API_KEY
  const hasBEAKey  = !!process.env.BEA_API_KEY
  const hasSamKey  = !!process.env.SAM_GOV_API_KEY
  const hasPolyKey = !!process.env.POLYGON_API_KEY

  const [
    seriesRes,
    oppRes,
    predMadeRes,
    predDueRes,
    predEvalRes,
    predCorrectRes,
    entityRes,
    edgeRes,
    eventRes,
    ttlconsRes,
    federalCacheRes,
    sourceHealth,
  ] = await Promise.all([
    supabaseAdmin.from('series').select('source, last_updated').order('source'),
    supabaseAdmin.from('opportunity_scores').select('metro_code', { count: 'exact', head: true }),
    supabaseAdmin.from('prediction_outcomes').select('*', { count: 'exact', head: true }).gte('predicted_at', day7ago.toISOString()),
    supabaseAdmin.from('prediction_outcomes').select('*', { count: 'exact', head: true }).lte('outcome_due_at', now.toISOString()).is('outcome_correct', null),
    supabaseAdmin.from('prediction_outcomes').select('*', { count: 'exact', head: true }).gte('outcome_checked_at', day7ago.toISOString()).not('outcome_correct', 'is', null),
    supabaseAdmin.from('prediction_outcomes').select('*', { count: 'exact', head: true }).gte('outcome_checked_at', day7ago.toISOString()).eq('outcome_correct', true),
    supabaseAdmin.from('entities').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('entity_edges').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('event_log').select('*', { count: 'exact', head: true }).gte('event_date', day30ago.toISOString().slice(0, 10)),
    supabaseAdmin.from('observations').select('*', { count: 'exact', head: true }).eq('series_id', 'TTLCONS'),
    supabaseAdmin.from('federal_cache').select('cached_at').eq('key', LEADERBOARD_CACHE_KEY).maybeSingle(),
    getSourceHealthSummary(),
  ])

  // ── Data freshness ────────────────────────────────────────────────────────
  const freshness: {
    source: string
    label: string
    last_updated: string | null
    status: 'ok' | 'warn' | 'stale'
  }[] = []

  if (!seriesRes.error) {
    const bySource: Record<string, string | null> = {}
    for (const row of (seriesRes.data ?? []) as SeriesRow[]) {
      const src = row.source ?? 'Unknown'
      const cur = bySource[src]
      if (!cur || (row.last_updated && row.last_updated > cur)) {
        bySource[src] = row.last_updated
      }
    }
    for (const [source, last_updated] of Object.entries(bySource)) {
      freshness.push({
        source,
        label: SOURCE_LABELS[source] ?? source,
        last_updated,
        status: staleness(last_updated),
      })
    }
    freshness.sort((a, b) => a.label.localeCompare(b.label))
  }

  const ttlconsCount  = ttlconsRes.count  ?? 0
  const oppCount      = oppRes.count      ?? 0
  const madeLast7     = predMadeRes.count  ?? 0
  const dueUnresolved = predDueRes.count   ?? 0
  const evalLast7     = predEvalRes.count  ?? 0
  const correctLast7  = predCorrectRes.count ?? 0
  const entityCount   = entityRes.count    ?? 0
  const edgeCount     = edgeRes.count      ?? 0
  const eventCount    = eventRes.count     ?? 0

  const par7d = evalLast7 > 0
    ? Math.round((correctLast7 / evalLast7) * 1000) / 10
    : null

  // ── Data section — inspect cache tables only, no sub-route calls ──────────
  let federalSource: 'usaspending.gov' | 'static-fallback' | 'unknown'
  if (federalCacheRes.error) {
    federalSource = 'unknown'
  } else if (federalCacheRes.data?.cached_at) {
    const ageHours = (Date.now() - new Date(federalCacheRes.data.cached_at).getTime()) / 3_600_000
    federalSource = ageHours < 24 ? 'usaspending.gov' : 'static-fallback'
  } else {
    federalSource = 'static-fallback'
  }

  const dataSection: {
    federalSource:      'usaspending.gov' | 'static-fallback' | 'unknown'
    weeklyBriefSource:  'ai' | 'static-fallback'
    dashboardShapeOk?:  boolean
  } = {
    federalSource,
    weeklyBriefSource: isWeeklyBriefConfigured() ? 'ai' : 'static-fallback',
  }

  // ?deep=1 — additional Supabase queries to verify dashboard shape
  if (deep) {
    const [empRes, permitRes] = await Promise.all([
      supabaseAdmin.from('observations').select('*', { count: 'exact', head: true }).eq('series_id', 'CES2000000001'),
      supabaseAdmin.from('observations').select('*', { count: 'exact', head: true }).eq('series_id', 'PERMIT'),
    ])
    dataSection.dashboardShapeOk =
      ttlconsCount > 0 &&
      (empRes.count ?? 0) > 0 &&
      (permitRes.count ?? 0) > 0
  }

  return NextResponse.json({
    env,
    data:    dataSection,
    runtime: runtimeSection,
    freshness,
    api_health: {
      pricewatch:    ttlconsCount > 0,
      benchmark:     ttlconsCount >= 24,
      eia:           hasEiaKey,
      bea:           hasBEAKey,
      solicitations: hasSamKey,
      equities:      hasPolyKey,
    },
    weekly_brief: {
      configured: isWeeklyBriefConfigured(),
    },
    opportunity_metros: oppCount,
    predictions: {
      made_last_7d:      madeLast7,
      due_unresolved:    dueUnresolved,
      evaluated_last_7d: evalLast7,
      correct_last_7d:   correctLast7,
      par_last_7d:       par7d,
    },
    entity_graph: {
      entities: entityCount,
      edges:    edgeCount,
    },
    events_last_30d: eventCount,
    source_health:   sourceHealth,
    as_of: now.toISOString(),
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}
