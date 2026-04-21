# /wire-brief — Connect WeeklyBrief to live Claude API generation

`src/app/api/weekly-brief/route.ts` has an explicit comment:
`// @anthropic-ai/sdk is not installed — always return the static brief`

This command installs the SDK and implements real LLM-powered brief generation.

## Step 1 — Install the SDK

```bash
npm install @anthropic-ai/sdk
```

## Step 2 — Add ANTHROPIC_API_KEY to .env.local

```
ANTHROPIC_API_KEY=sk-ant-...
```

Add to `.env.example`:

```
ANTHROPIC_API_KEY=  # Anthropic API key — https://console.anthropic.com
```

## Step 3 — Add weekly_briefs table to schema.sql

```sql
CREATE TABLE IF NOT EXISTS weekly_briefs (
  id            BIGSERIAL   PRIMARY KEY,
  brief_text    TEXT        NOT NULL,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_snapshot JSONB,
  model         TEXT        NOT NULL DEFAULT 'claude-sonnet-4-5',
  source        TEXT        NOT NULL DEFAULT 'ai'
);
CREATE INDEX IF NOT EXISTS idx_weekly_briefs_generated_at
  ON weekly_briefs (generated_at DESC);
COMMENT ON TABLE weekly_briefs IS 'LLM-generated weekly market intelligence briefs.';
```

## Step 4 — Implement the generation route

Replace `src/app/api/weekly-brief/route.ts` with:

```typescript
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const CACHE_TTL_HOURS = 168  // 7 days — regenerate weekly

async function getLatestObservation(seriesId: string) {
  const { data } = await supabaseAdmin
    .from('observations')
    .select('value, obs_date')
    .eq('series_id', seriesId)
    .order('obs_date', { ascending: false })
    .limit(2)
  if (!data || data.length < 2) return null
  const current = data[0].value
  const prior   = data[1].value
  const mom     = prior > 0 ? ((current - prior) / prior * 100).toFixed(1) : '0.0'
  return { value: current, obs_date: data[0].obs_date, mom: parseFloat(mom) }
}

export async function GET() {
  try {
    // Check for recent brief (within TTL)
    const { data: recent } = await supabaseAdmin
      .from('weekly_briefs')
      .select('brief_text, generated_at, source')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (recent) {
      const ageHours = (Date.now() - new Date(recent.generated_at).getTime()) / 3600000
      if (ageHours < CACHE_TTL_HOURS) {
        return NextResponse.json({
          brief: recent.brief_text,
          generatedAt: recent.generated_at,
          source: recent.source,
        }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
      }
    }

    // Generate a new brief
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Fall back to static if no API key
      return NextResponse.json({
        brief: STATIC_BRIEF,
        generatedAt: new Date().toISOString(),
        source: 'static',
      })
    }

    // Gather latest data
    const [spend, employ, permits, starts] = await Promise.all([
      getLatestObservation('TTLCONS'),
      getLatestObservation('CES2000000001'),
      getLatestObservation('PERMIT'),
      getLatestObservation('HOUST'),
    ])

    const snapshot = { spend, employ, permits, starts }

    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are the chief economist for ConstructAIQ, a construction intelligence platform.
Write a Weekly Market Intelligence Brief. Use ONLY the data provided below.

STRICT RULES:
- Every statistic you mention must come from the data provided
- Do not invent or estimate any numbers
- Plain English — no jargon
- 200-280 words total
- Use this exact format with these exact headers:

HEADLINE SIGNAL: [one sentence summary of the biggest development]

WHAT MOVED THIS WEEK:
• [bullet 1 with specific number from data]
• [bullet 2 with specific number from data]
• [bullet 3 with specific number from data]

WATCH NEXT WEEK:
• [specific upcoming data release or signal to watch]
• [specific upcoming data release or signal to watch]

CURRENT DATA:
Total Construction Spending: ${spend ? `$${(spend.value/1000).toFixed(2)}T (${spend.mom > 0 ? '+' : ''}${spend.mom}% MoM)` : 'unavailable'}
Construction Employment: ${employ ? `${(employ.value/1000).toFixed(1)}M (${employ.mom > 0 ? '+' : ''}${employ.mom}% MoM)` : 'unavailable'}
Building Permits: ${permits ? `${permits.value.toFixed(0)}K/yr SAAR (${permits.mom > 0 ? '+' : ''}${permits.mom}% MoM)` : 'unavailable'}
Housing Starts: ${starts ? `${starts.value.toFixed(0)}K/yr SAAR (${starts.mom > 0 ? '+' : ''}${starts.mom}% MoM)` : 'unavailable'}`,
      }],
    })

    const briefText = message.content[0].type === 'text' ? message.content[0].text : STATIC_BRIEF

    // Store in database
    await supabaseAdmin.from('weekly_briefs').insert({
      brief_text: briefText,
      data_snapshot: snapshot,
      model: 'claude-sonnet-4-5',
      source: 'ai',
    })

    return NextResponse.json({
      brief: briefText,
      generatedAt: new Date().toISOString(),
      source: 'ai',
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })

  } catch (err) {
    console.error('[weekly-brief] generation failed:', err)
    return NextResponse.json({
      brief: STATIC_BRIEF,
      generatedAt: new Date().toISOString(),
      source: 'static',
    })
  }
}

// Static fallback — used when API key absent or Claude API fails
const STATIC_BRIEF = `HEADLINE SIGNAL: Construction sector remains in expansion with positive momentum across spending, employment, and permits.

WHAT MOVED THIS WEEK:
• Real-time data currently unavailable — check back shortly
• Weekly brief generates automatically when data refreshes
• Configure ANTHROPIC_API_KEY to enable AI-powered briefs

WATCH NEXT WEEK:
• Census Construction Put-in-Place (monthly release)
• BLS Employment Situation (construction payrolls)`
```

## Step 5 — Add cron job for Monday generation

Create `src/app/api/cron/brief/route.ts`:

```typescript
// Called by Vercel cron every Monday at 07:00 ET (12:00 UTC)
// Simply calls the weekly-brief GET endpoint to trigger generation and cache
import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/weekly-brief`)
  const data = await res.json()
  return NextResponse.json({ ok: true, source: data.source })
}
```

Add to vercel.json crons:

```json
{ "path": "/api/cron/brief", "schedule": "0 12 * * 1" }
```

## Step 6 — Test

```bash
# Verify the route returns a structured response
curl http://localhost:3000/api/weekly-brief | jq '{source, generatedAt}'

# With API key configured, source should be "ai"
# Without API key, source should be "static"
```

```bash
npx tsc --noEmit && npm test
```