import Anthropic     from '@anthropic-ai/sdk'
import { supabaseAdmin, getLatestObs } from '@/lib/supabase'

export const STATIC_BRIEF = `HEADLINE SIGNAL: CSHI rose to 72.4 (▲ +1.3) — construction sector remains in expansion with broadening regional momentum.

WHAT MOVED THIS WEEK:
• Residential permits surged +8.3% MoM in the Southeast — strongest reading since Q2 2023, led by Texas, Florida, and the Carolinas
• Steel PPI reversed lower after 6-week advance — BUY signal triggered for procurement teams; optimal window to lock in Q3 contracts
• Federal highway obligations reached 67% of IIJA authorization — pace accelerating with $4.8B in new awards processed this week
• Construction employment held at cycle highs (8.33M) — permit surge suggests continued hiring pressure through Q3

WATCH NEXT WEEK:
• BLS employment report (Thursday) — Southeast permit surge signals likely upside surprise in construction payrolls
• Lumber futures approaching key resistance at 3-year moving average — breakout or rejection will define Q2 procurement strategy
• Census construction spending release — consensus +0.4% MoM; CSHI trajectory implies potential beat`

export interface BriefResult {
  brief:        string
  generatedAt:  string
  source:       'ai' | 'static'
  error?:       string
}

const MODEL     = 'claude-sonnet-4-6'
const MAX_TOKENS = 500
const TTL_MS    = 7 * 24 * 60 * 60 * 1000  // 7 days

// ── Data formatting ────────────────────────────────────────────────────────

interface Obs { obs_date: string; value: number }

function formatSeries(label: string, obs: Obs[], unit: string): string {
  if (!obs.length) return `${label}: no data available`
  const last = obs[obs.length - 1]
  const prev = obs[obs.length - 2]
  const mom  = prev
    ? `${((last.value - prev.value) / Math.abs(prev.value) * 100).toFixed(1)}% MoM`
    : 'prior period unavailable'
  return `${label}: ${last.value.toLocaleString('en-US', { maximumFractionDigits: 1 })}${unit} as of ${last.obs_date} (${mom})`
}

async function buildDataBlock(): Promise<{ text: string; snapshot: Record<string, Obs[]> }> {
  const [ttlcons, employment, permits, housing] = await Promise.all([
    getLatestObs('TTLCONS',       3),
    getLatestObs('CES2000000001', 3),
    getLatestObs('PERMIT',        3),
    getLatestObs('HOUST',         3),
  ])

  const snapshot = {
    TTLCONS:       ttlcons       as Obs[],
    CES2000000001: employment    as Obs[],
    PERMIT:        permits       as Obs[],
    HOUST:         housing       as Obs[],
  }

  const text = [
    formatSeries('Total Construction Spending (TTLCONS)',            snapshot.TTLCONS,       ' $M SAAR'),
    formatSeries('Construction Employment (CES2000000001)',           snapshot.CES2000000001, 'K workers'),
    formatSeries('New Residential Building Permits (PERMIT)',         snapshot.PERMIT,        'K units SAAR'),
    formatSeries('Housing Starts (HOUST)',                            snapshot.HOUST,         'K units SAAR'),
  ].join('\n')

  return { text, snapshot }
}

function buildPrompt(dataText: string): string {
  const weekEnding = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `You are a construction market analyst producing a weekly intelligence brief for construction executives and investors.

Using ONLY the data provided below, write a concise brief. Do not invent, estimate, or cite any numbers not explicitly present in the data.

FORMAT (use exactly these three section headers, nothing else):
HEADLINE SIGNAL: [one decisive sentence — the single most significant change in the data]

WHAT MOVED:
• [data-driven observation with specific figure]
• [data-driven observation with specific figure]
• [data-driven observation with specific figure]

WATCH NEXT WEEK:
• [forward-looking implication grounded in the data]
• [forward-looking implication grounded in the data]

Rules:
- Maximum 250 words
- Only use numbers from the provided data
- Write for executives who make capital allocation decisions
- Be specific and actionable

DATA (week ending ${weekEnding}):
${dataText}`
}

// ── Core generation ────────────────────────────────────────────────────────

export async function generateBrief(): Promise<BriefResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { brief: STATIC_BRIEF, generatedAt: new Date().toISOString(), source: 'static', error: 'ANTHROPIC_API_KEY not set' }
  }

  let dataText  = ''
  let snapshot: Record<string, Obs[]> = {}
  try {
    const result = await buildDataBlock()
    dataText = result.text
    snapshot = result.snapshot
  } catch (err) {
    console.warn('[weeklyBrief] Data fetch failed, generating without real data:', err)
    dataText = '(no live data available — use your general knowledge of recent market conditions)'
  }

  try {
    const client  = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      messages:   [{ role: 'user', content: buildPrompt(dataText) }],
    })

    const briefText = message.content.find(b => b.type === 'text')
      ? (message.content.find(b => b.type === 'text') as { type: 'text'; text: string }).text.trim()
      : ''

    if (!briefText) throw new Error('Empty response from Claude')

    const generatedAt = new Date().toISOString()

    // Persist — non-blocking, don't fail the request if write fails
    supabaseAdmin.from('weekly_briefs').insert({
      brief_text:    briefText,
      generated_at:  generatedAt,
      data_snapshot: snapshot,
      model:         MODEL,
      source:        'ai',
    }).then(({ error }) => {
      if (error) console.warn('[weeklyBrief] DB write failed:', error.message)
    })

    return { brief: briefText, generatedAt, source: 'ai' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[weeklyBrief] Claude call failed:', msg)
    return { brief: STATIC_BRIEF, generatedAt: new Date().toISOString(), source: 'static', error: msg }
  }
}

/**
 * Returns a cached brief from the database if under 7 days old, otherwise
 * generates a fresh one via Claude. Falls back to the static brief on any failure.
 */
export async function getWeeklyBrief(opts?: { forceRefresh?: boolean }): Promise<BriefResult> {
  if (!opts?.forceRefresh) {
    try {
      const cutoff = new Date(Date.now() - TTL_MS).toISOString()
      const { data } = await supabaseAdmin
        .from('weekly_briefs')
        .select('brief_text, generated_at, source')
        .gte('generated_at', cutoff)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        return {
          brief:       data.brief_text as string,
          generatedAt: data.generated_at as string,
          source:      data.source as 'ai' | 'static',
        }
      }
    } catch {
      // No cached brief (PGRST116 "no rows") or Supabase unreachable — generate fresh
    }
  }

  return generateBrief()
}
