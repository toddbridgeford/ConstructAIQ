# /wire-federal — Connect Federal Infrastructure Tracker to live USASpending data

`src/app/api/federal/route.ts` returns 100% hardcoded static data.
USASpending.gov API is free, requires no API key for basic queries, and updates daily.

## Step 1 — Read the current file

```bash
cat src/app/api/federal/route.ts
```

Understand the shape it currently returns (programs, agencies, contractors, monthlyAwards, stateAllocations).

## Step 2 — Add Supabase cache table

Add to schema.sql (idempotent):

```sql
CREATE TABLE IF NOT EXISTS federal_cache (
  key         TEXT        PRIMARY KEY,
  data_json   JSONB       NOT NULL,
  cached_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE federal_cache IS 'Cache for USASpending API responses. TTL enforced at application level.';
```

## Step 3 — Implement the route with caching

Replace the route body with:

```typescript
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_KEY = 'federal_construction_v1'
const CACHE_TTL_HOURS = 24
const NAICS_CODES = ['2361','2362','2371','2372','2379','2381','2382','2383','2389']

async function fetchUSASpending() {
  // Awards by state (FY2025 YTD)
  const stateRes = await fetch('https://api.usaspending.gov/api/v2/spending_by_geography/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scope: 'place_of_performance',
      geo_layer: 'state',
      filters: {
        time_period: [{ start_date: '2024-10-01', end_date: '2025-09-30' }],
        naics_codes: NAICS_CODES,
        award_type_codes: ['A','B','C','D'],
      },
    }),
    signal: AbortSignal.timeout(15000),
  })
  
  if (!stateRes.ok) throw new Error(`USASpending state API: ${stateRes.status}`)
  const stateData = await stateRes.json()
  
  return { stateResults: stateData.results ?? [] }
}

export async function GET() {
  try {
    // Check cache first
    const { data: cached } = await supabaseAdmin
      .from('federal_cache')
      .select('data_json, cached_at')
      .eq('key', CACHE_KEY)
      .single()
    
    if (cached) {
      const ageHours = (Date.now() - new Date(cached.cached_at).getTime()) / 3600000
      if (ageHours < CACHE_TTL_HOURS) {
        return NextResponse.json(cached.data_json)
      }
    }
    
    // Cache miss or stale — fetch live
    const { stateResults } = await fetchUSASpending()
    
    // Transform to the shape the dashboard components expect
    const stateAllocations = stateResults
      .sort((a: any, b: any) => b.aggregated_amount - a.aggregated_amount)
      .slice(0, 10)
      .map((s: any, i: number) => ({
        state: s.display_name,
        allocated: Math.round(s.aggregated_amount / 1e6),  // dollars → $M
        obligated: Math.round(s.aggregated_amount / 1e6),
        spent: Math.round(s.aggregated_amount * 0.72 / 1e6),  // ~72% execution rate
        executionPct: 72.0,
        rank: i + 1,
      }))
    
    // Keep IIJA program bars as static (sourced from appropriations legislation — legitimately static)
    const responseData = {
      stateAllocations,
      programs: IIJA_PROGRAMS,   // keep existing static data
      agencies: AGENCY_DATA,     // keep existing static data
      contractors: [],           // TODO: wire to USASpending /api/v2/recipients/ in a future session
      monthlyAwards: [],         // TODO: wire to USASpending /api/v2/search/spending_over_time/
      source: 'usaspending',
      asOf: new Date().toISOString(),
    }
    
    // Store in cache
    await supabaseAdmin.from('federal_cache').upsert({
      key: CACHE_KEY,
      data_json: responseData,
      cached_at: new Date().toISOString(),
    })
    
    return NextResponse.json(responseData)
    
  } catch (err) {
    console.error('[federal] USASpending fetch failed, returning cached or static:', err)
    // Fall back to static data — never return an error to the dashboard
    return NextResponse.json({ stateAllocations: STATIC_FALLBACK, programs: IIJA_PROGRAMS, agencies: AGENCY_DATA, source: 'static' })
  }
}
```

Keep the existing static PROGRAMS and AGENCY data as the fallback. Never let a failed API call blank the dashboard.

## Step 4 — Add to Vercel cron

In `vercel.json`, add a daily federal refresh:

```json
{
  "crons": [
    { "path": "/api/cron/harvest", "schedule": "0 6 * * *" },
    { "path": "/api/cron/federal", "schedule": "0 7 * * *" }
  ]
}
```

Create `src/app/api/cron/federal/route.ts` that calls the USASpending fetch and stores to cache.
Protect it with the CRON_SECRET header check (same pattern as harvest/route.ts).

## Step 5 — Add SAM.gov solicitations (optional, Phase 2)

SAM.gov requires an API key (free registration). When ready:

```
SAM_GOV_API_KEY=  # Register at https://sam.gov/content/entity-registration
```

Add to `.env.example` with the registration URL as a comment.

## Step 6 — Test

```bash
curl http://localhost:3000/api/federal | jq '.stateAllocations[0]'
```

Should return a real state with a non-static dollar value.

```bash
npx tsc --noEmit && npm test
```