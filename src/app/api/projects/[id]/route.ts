import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const id = parseInt(rawId)
  if (isNaN(id) || id < 1)
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })

  const [projectResult, eventsResult] = await Promise.all([
    supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single(),

    supabaseAdmin
      .from('project_events')
      .select('id, event_type, event_date, description, value, source, created_at')
      .eq('project_id', id)
      .order('event_date', { ascending: true }),
  ])

  if (projectResult.error || !projectResult.data)
    return NextResponse.json({ error: `Project not found: ${id}` }, { status: 404 })

  const p = projectResult.data

  return NextResponse.json(
    {
      id:                   p.id,
      project_name:         p.project_name,
      project_type:         p.project_type,
      building_class:       p.building_class,
      status:               p.status,
      address:              p.address,
      city:                 p.city,
      state_code:           p.state_code,
      zip_code:             p.zip_code,
      latitude:             p.latitude,
      longitude:            p.longitude,
      valuation:            p.valuation,
      sqft:                 p.sqft,
      units:                p.units,
      applied_date:         p.applied_date,
      approved_date:        p.approved_date,
      started_date:         p.started_date,
      estimated_completion: p.estimated_completion,
      satellite_bsi_change: p.satellite_bsi_change,
      federal_award_match:  p.federal_award_match,
      federal_award_id:     p.federal_award_id,
      ai_summary:           p.ai_summary,
      ai_generated_at:      p.ai_generated_at,
      first_seen_at:        p.first_seen_at,
      last_updated_at:      p.last_updated_at,
      events:               eventsResult.data ?? [],
    },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } },
  )
}
