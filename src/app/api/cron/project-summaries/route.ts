import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

const BATCH_SIZE      = 10  // AI summary generation
const LIFECYCLE_BATCH = 20  // lifecycle evaluation

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET ?? ''
  if (secret && auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey)
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

  // ── 1. Project lifecycle evaluation (Project Emergence Model seed) ─────────
  const lifecycle = await runLifecycleEvaluation()

  // ── 2. AI summary generation (existing behaviour) ──────────────────────────
  const { data: projects, error } = await supabaseAdmin
    .from('projects')
    .select('id, project_name, building_class, valuation, sqft, city, state_code')
    .is('ai_summary', null)
    .gt('valuation', 0)
    .order('valuation', { ascending: false })
    .limit(BATCH_SIZE)

  if (error) {
    console.error('[project-summaries] fetch error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }

  if (!projects?.length)
    return NextResponse.json({
      ok: true, processed: 0, message: 'No projects pending summary',
      lifecycle,
    })

  const client = new Anthropic({ apiKey })
  let processed = 0
  let failed = 0

  for (const project of projects) {
    try {
      const prompt = `Write a single sentence describing this construction project. Be specific about size, type, and location. No preamble.
Project: ${project.project_name}, ${project.building_class}, $${Number(project.valuation).toLocaleString()}, ${project.sqft ? `${Number(project.sqft).toLocaleString()} sq ft, ` : ''}${project.city} ${project.state_code}.`

      const message = await client.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages:   [{ role: 'user', content: prompt }],
      })

      const summary = message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : null

      if (summary) {
        await supabaseAdmin
          .from('projects')
          .update({ ai_summary: summary, ai_generated_at: new Date().toISOString() })
          .eq('id', project.id)
        processed++
      }
    } catch (err) {
      console.error(`[project-summaries] failed for project ${project.id}:`, err)
      failed++
    }
  }

  return NextResponse.json({ ok: true, processed, failed, total_eligible: projects.length, lifecycle })
}

// ---------------------------------------------------------------------------
// Project Lifecycle Evaluation — Project Emergence Model seed
// ---------------------------------------------------------------------------

interface LifecycleResult { evaluated: number; changed: number }

async function runLifecycleEvaluation(): Promise<LifecycleResult> {
  // Fetch oldest-updated projects first so every project gets evaluated over time
  const { data: projects, error } = await supabaseAdmin
    .from('projects')
    .select('id, permit_number, city_code, lifecycle_state, last_updated_at')
    .order('last_updated_at', { ascending: true })
    .limit(LIFECYCLE_BATCH)

  if (error || !projects?.length) return { evaluated: 0, changed: 0 }

  const permitNumbers = projects
    .map(p => p.permit_number as string)
    .filter(Boolean)

  // Look up entity IDs for these permits (written by the permits cron)
  const { data: entities } = permitNumbers.length
    ? await supabaseAdmin
        .from('entities')
        .select('id, external_id')
        .eq('type', 'permit')
        .eq('source', 'socrata')
        .in('external_id', permitNumbers)
    : { data: [] }

  // permit_number → entity id
  const permitEntityMap = new Map<string, number>()
  for (const e of (entities ?? [])) {
    permitEntityMap.set(e.external_id as string, e.id as number)
  }

  const entityIds = [...permitEntityMap.values()]

  // Fetch all event_log entries for these entities in one query
  const { data: events } = entityIds.length
    ? await supabaseAdmin
        .from('event_log')
        .select('entity_id, event_type, event_date')
        .in('entity_id', entityIds)
        .order('event_date', { ascending: false })
    : { data: [] }

  // entity_id → events[]
  const entityEvents = new Map<number, Array<{ event_type: string; event_date: string }>>()
  for (const ev of (events ?? [])) {
    const eid = ev.entity_id as number
    if (!entityEvents.has(eid)) entityEvents.set(eid, [])
    entityEvents.get(eid)!.push({
      event_type: ev.event_type as string,
      event_date: ev.event_date as string,
    })
  }

  let changed = 0
  const now = Date.now()

  for (const project of projects) {
    const entityId    = permitEntityMap.get(project.permit_number as string)
    const evts        = entityId ? (entityEvents.get(entityId) ?? []) : []
    const currentState = project.lifecycle_state as string

    const newState = classifyLifecycle(evts, now)

    // No change or no entity yet to determine state
    if (newState === null || newState === currentState) continue

    const now_iso  = new Date().toISOString()
    const today    = now_iso.split('T')[0]
    const confidence = entityId ? 0.9 : 0.5

    // Update projects.lifecycle_state
    await supabaseAdmin
      .from('projects')
      .update({ lifecycle_state: newState, last_updated_at: now_iso })
      .eq('id', project.id)

    // Audit entry in project_state_history
    await supabaseAdmin
      .from('project_state_history')
      .insert({
        project_id:      project.id,
        from_state:      currentState,
        to_state:        newState,
        transitioned_at: now_iso,
        confidence,
        explanation:     transitionExplanation(currentState, newState, evts, now),
      })

    // Signal: write to project_events so downstream consumers can react
    await supabaseAdmin
      .from('project_events')
      .insert({
        project_id:  project.id,
        event_type:  `lifecycle.${newState}`,
        event_date:  today,
        description: `Lifecycle transition: ${currentState} → ${newState}`,
        source:      'lifecycle_engine',
      })

    changed++
  }

  return { evaluated: projects.length, changed }
}

// ---------------------------------------------------------------------------
// Lifecycle classification logic
// ---------------------------------------------------------------------------

type EventEntry = { event_type: string; event_date: string }

/**
 * Returns the derived lifecycle state for a project given its event history,
 * or null when there is insufficient data to make a determination.
 *
 * Rules (ordered by priority):
 *   stalled     — any event history but nothing in the last 60 days
 *   active      — permit.issued + site.activated present
 *   mobilizing  — site.activated (BSI ground-disturbance signal) present
 *   forming     — permit.filed or permit.issued present
 *   null        — no events; cannot classify
 */
function classifyLifecycle(events: EventEntry[], nowMs: number): string | null {
  if (!events.length) return null

  const STALL_MS = 60 * 24 * 60 * 60 * 1000

  const latestMs = Math.max(...events.map(e => new Date(e.event_date).getTime()))
  const stale    = (nowMs - latestMs) > STALL_MS

  if (stale) return 'stalled'

  const has = (type: string) => events.some(e => e.event_type === type)

  if (has('permit.issued') && has('site.activated')) return 'active'
  if (has('site.activated'))                          return 'mobilizing'
  if (has('permit.filed') || has('permit.issued'))    return 'forming'

  return null
}

function transitionExplanation(
  from:   string,
  to:     string,
  events: EventEntry[],
  nowMs:  number,
): string {
  if (to === 'stalled') {
    const latestMs  = events.length
      ? Math.max(...events.map(e => new Date(e.event_date).getTime()))
      : 0
    const days = Math.round((nowMs - latestMs) / (24 * 60 * 60 * 1000))
    return `No permit or site activity in ${days} days`
  }
  if (to === 'active')     return 'Active permit with confirmed ground disturbance (BSI signal)'
  if (to === 'mobilizing') return 'Ground disturbance detected via satellite BSI'
  if (to === 'forming')    return events.some(e => e.event_type === 'permit.filed')
    ? 'Permit application filed'
    : 'Permit issued; no ground activity yet'
  return `Transitioned from ${from} to ${to}`
}
