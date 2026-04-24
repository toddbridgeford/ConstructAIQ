import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`
  return String(n)
}

export async function GET() {
  try {
    const [obsRes, forecastRes, lastObsRes, embedImpressionsRes] = await Promise.all([
      supabaseAdmin
        .from('observations')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('forecasts')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('observations')
        .select('obs_date')
        .order('obs_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from('embed_impressions')
        .select('count')
        .then(r => {
          if (r.error) return { total: 0 }
          const total = (r.data ?? []).reduce((sum: number, row: { count: number }) => sum + (row.count ?? 0), 0)
          return { total }
        })
        .catch(() => ({ total: 0 })),
    ])

    const obsCount      = obsRes.count ?? 0
    const forecastCount = forecastRes.count ?? 0
    const lastUpdated   = lastObsRes.data?.obs_date ?? null
    const embedImpressions = (embedImpressionsRes as { total: number }).total

    return NextResponse.json({
      cities_tracked:      40,
      msas_tracked:        20,
      data_sources:        38,
      observations_count:  obsCount,
      observations_label:  fmtCount(obsCount),
      forecasts_generated: forecastCount,
      embed_impressions:   embedImpressions,
      embed_impressions_label: fmtCount(embedImpressions),
      last_updated:        lastUpdated,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    })
  } catch {
    return NextResponse.json({
      cities_tracked:         40,
      msas_tracked:           20,
      data_sources:           38,
      observations_count:     0,
      observations_label:     '—',
      forecasts_generated:    0,
      embed_impressions:      0,
      embed_impressions_label:'—',
      last_updated:           null,
    })
  }
}
