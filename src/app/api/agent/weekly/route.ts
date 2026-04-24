import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

// ── Types ────────────────────────────────────────────────────────────────────

interface WatchlistEntity {
  id:           number
  entity_type:  'metro' | 'state' | 'project' | 'federal'
  entity_id:    string
  entity_label: string
  added_at:     string
}

interface StateTransition {
  from:        string | null
  to:          string
  at:          string
  explanation: string | null
}

interface EntityContext {
  entity:             WatchlistEntity
  opportunity_score:  number | null
  opportunity_class:  string | null
  reality_gap:        number | null
  reality_class:      string | null
  official_score:     number | null
  observed_score:     number | null
  state_transitions:  StateTransition[]
  spend_propagation:  unknown
}

// ── Auth helpers ─────────────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const encoded    = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

interface KeyMeta { plan: string; role: string | null }

async function fetchKeyMeta(keyHash: string): Promise<KeyMeta | null> {
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null

  const url = `${supabaseUrl}/rest/v1/api_keys?key_hash=eq.${keyHash}&select=plan,role,active&limit=1`
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        apikey:        serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    })
  } catch {
    return null
  }
  if (!res.ok) return null

  const rows = await res.json() as Array<{ plan: string; role: string | null; active: boolean }>
  if (!rows.length || !rows[0].active) return null
  return { plan: rows[0].plan, role: rows[0].role ?? null }
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchWatchlist(keyHash: string): Promise<WatchlistEntity[]> {
  const { data, error } = await supabaseAdmin
    .from('watchlists')
    .select('id, entity_type, entity_id, entity_label, added_at')
    .eq('api_key_hash', keyHash)
    .order('added_at', { ascending: false })
    .limit(10)

  if (error) throw new Error(`watchlist: ${error.message}`)
  return (data ?? []) as WatchlistEntity[]
}

async function fetchOpportunityScore(
  metroCode: string,
): Promise<{ score: number; classification: string } | null> {
  const { data } = await supabaseAdmin
    .from('opportunity_scores')
    .select('score, classification')
    .eq('metro_code', metroCode)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single()
  if (!data) return null
  return { score: (data as { score: number; classification: string }).score, classification: (data as { score: number; classification: string }).classification }
}

async function fetchRealityGap(projectId: string): Promise<{
  gap:            number
  official_score: number
  observed_score: number
  classification: string
} | null> {
  const id = parseInt(projectId, 10)
  if (isNaN(id)) return null
  const { data } = await supabaseAdmin
    .from('project_reality_gaps')
    .select('gap, official_score, observed_score, classification')
    .eq('project_id', id)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single()
  if (!data) return null
  const d = data as { gap: number; official_score: number; observed_score: number; classification: string }
  return { gap: d.gap, official_score: d.official_score, observed_score: d.observed_score, classification: d.classification }
}

async function fetchStateTransitions(projectId: string): Promise<StateTransition[]> {
  const id = parseInt(projectId, 10)
  if (isNaN(id)) return []
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabaseAdmin
    .from('project_state_history')
    .select('from_state, to_state, transitioned_at, explanation')
    .eq('project_id', id)
    .gte('transitioned_at', since)
    .order('transitioned_at', { ascending: false })

  return (data ?? []).map((r: { from_state: string | null; to_state: string; transitioned_at: string; explanation: string | null }) => ({
    from:        r.from_state,
    to:          r.to_state,
    at:          r.transitioned_at,
    explanation: r.explanation,
  }))
}

async function fetchSpendPropagation(metro: string, baseUrl: string): Promise<unknown> {
  try {
    const res = await fetch(`${baseUrl}/api/spend-propagation?metro=${encodeURIComponent(metro)}`, {
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const json = await res.json() as Record<string, unknown>
    // Trim to the fields Claude needs
    return {
      outlook:          json.outlook,
      tightness_score:  json.tightness_score,
      active_projects:  json.active_projects,
      spend_12m_usd:    json.spend_12m_usd,
      top_trade_basket: json.top_trade_basket,
    }
  } catch {
    return null
  }
}

// ── Context assembly ──────────────────────────────────────────────────────────

async function buildEntityContext(
  entity:  WatchlistEntity,
  baseUrl: string,
): Promise<EntityContext> {
  const ctx: EntityContext = {
    entity,
    opportunity_score: null,
    opportunity_class: null,
    reality_gap:       null,
    reality_class:     null,
    official_score:    null,
    observed_score:    null,
    state_transitions: [],
    spend_propagation: null,
  }

  try {
    if (entity.entity_type === 'metro') {
      const [opp, prop] = await Promise.all([
        fetchOpportunityScore(entity.entity_id),
        fetchSpendPropagation(entity.entity_id, baseUrl),
      ])
      if (opp) {
        ctx.opportunity_score = opp.score
        ctx.opportunity_class = opp.classification
      }
      ctx.spend_propagation = prop

    } else if (entity.entity_type === 'project') {
      const [gap, transitions] = await Promise.all([
        fetchRealityGap(entity.entity_id),
        fetchStateTransitions(entity.entity_id),
      ])
      if (gap) {
        ctx.reality_gap     = gap.gap
        ctx.reality_class   = gap.classification
        ctx.official_score  = gap.official_score
        ctx.observed_score  = gap.observed_score
      }
      ctx.state_transitions = transitions
    }
  } catch (err) {
    console.warn(`[agent/weekly] context fetch failed for ${entity.entity_id}:`, err)
  }

  return ctx
}

// ── Claude prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(role: string): string {
  return `You are a construction market intelligence analyst. Produce a concise weekly briefing \
for a ${role} who is watching these markets.

Rules:
- Cite specific numbers from the data provided
- Lead with the most actionable change this week
- Flag any reality gaps > 15 points with a CONCERN notice
- Note any state transitions (e.g. forming → mobilizing) as forward signals
- Total length must be under 300 words
- End with exactly 2 specific action items for this ${role}
- Be direct and precise — no filler phrases or generic market commentary`
}

function serializeContext(contexts: EntityContext[]): string {
  return JSON.stringify(
    contexts.map(c => {
      const base: Record<string, unknown> = {
        entity: `${c.entity.entity_label} (${c.entity.entity_type}: ${c.entity.entity_id})`,
      }

      if (c.opportunity_score !== null) {
        base.opportunity_score = `${c.opportunity_score}/100 — ${c.opportunity_class}`
      }

      if (c.reality_gap !== null) {
        const sign = c.reality_gap >= 0 ? '+' : ''
        base.reality_gap = `${sign}${c.reality_gap} pts (official ${c.official_score} vs observed ${c.observed_score}) — ${c.reality_class}`
        if (Math.abs(c.reality_gap) > 15) {
          base.reality_gap_alert = `CONCERN: gap exceeds 15 points`
        }
      }

      if (c.state_transitions.length > 0) {
        base.state_transitions_last_7d = c.state_transitions.map(t => {
          const label = t.from ? `${t.from} → ${t.to}` : `initial: ${t.to}`
          const date  = new Date(t.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return t.explanation ? `${label} on ${date}: ${t.explanation}` : `${label} on ${date}`
        })
      } else {
        base.state_transitions_last_7d = 'none'
      }

      if (c.spend_propagation) {
        base.spend_propagation = c.spend_propagation
      }

      return base
    }),
    null,
    2,
  )
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const apiKey = searchParams.get('api_key') ?? request.headers.get('x-api-key') ?? ''

  if (!apiKey) {
    return NextResponse.json(
      { error: 'api_key query parameter or x-api-key header required.' },
      { status: 401 },
    )
  }
  if (!apiKey.startsWith('caiq_')) {
    return NextResponse.json({ error: 'Invalid API key format.' }, { status: 401 })
  }

  let keyHash: string
  try {
    keyHash = await sha256Hex(apiKey)
  } catch {
    return NextResponse.json({ error: 'Auth failed.' }, { status: 500 })
  }

  const keyMeta = await fetchKeyMeta(keyHash)
  if (!keyMeta) {
    return NextResponse.json({ error: 'Invalid or inactive API key.' }, { status: 401 })
  }

  const role = keyMeta.role ?? 'construction professional'

  let watchlist: WatchlistEntity[]
  try {
    watchlist = await fetchWatchlist(keyHash)
  } catch (err) {
    console.error('[agent/weekly] watchlist fetch failed:', err)
    return NextResponse.json({ error: 'Failed to load watchlist.' }, { status: 500 })
  }

  if (watchlist.length === 0) {
    return NextResponse.json(
      {
        briefing:       null,
        empty_watchlist: true,
        message:        'Add markets to your watchlist to receive a personalized briefing.',
        role,
        generated_at:  new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const baseUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://constructaiq.trade'
  const contexts = await Promise.all(watchlist.map(e => buildEntityContext(e, baseUrl)))

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json(
      {
        briefing:       null,
        error:          'AI not configured — set ANTHROPIC_API_KEY.',
        role,
        entities_watched: watchlist.length,
        generated_at:  new Date().toISOString(),
      },
      { status: 200 },
    )
  }

  const contextJson    = serializeContext(contexts)
  const watchedSummary = watchlist.map(e => e.entity_label).join(', ')

  const client = new Anthropic({ apiKey: anthropicKey })

  let briefing: string
  try {
    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 700,
      system:     buildSystemPrompt(role),
      messages: [
        {
          role:    'user',
          content: `Here is this week's data for the markets I am watching (${watchedSummary}):\n\n${contextJson}`,
        },
      ],
    })
    briefing = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : 'Unable to generate briefing.'
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[agent/weekly] Claude call failed:', msg)
    return NextResponse.json({ error: 'AI generation failed.', detail: msg }, { status: 500 })
  }

  return NextResponse.json(
    {
      briefing,
      role,
      entities_watched: watchlist.length,
      watchlist: watchlist.map(e => ({
        type:  e.entity_type,
        id:    e.entity_id,
        label: e.entity_label,
      })),
      generated_at: new Date().toISOString(),
      model:        'claude-sonnet-4-6',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
