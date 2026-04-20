import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// @anthropic-ai/sdk is not installed — always return the static brief.
// When the SDK is added to package.json, replace this with the Anthropic client logic.

const STATIC_BRIEF = `HEADLINE SIGNAL: CSHI rose to 72.4 (▲ +1.3) — construction sector remains in expansion with broadening regional momentum.

WHAT MOVED THIS WEEK:
• Residential permits surged +8.3% MoM in the Southeast — strongest reading since Q2 2023, led by Texas, Florida, and the Carolinas
• Steel PPI reversed lower after 6-week advance — BUY signal triggered for procurement teams; optimal window to lock in Q3 contracts
• Federal highway obligations reached 67% of IIJA authorization — pace accelerating with $4.8B in new awards processed this week
• Construction employment held at cycle highs (8.33M) — permit surge suggests continued hiring pressure through Q3

WATCH NEXT WEEK:
• BLS employment report (Thursday) — Southeast permit surge signals likely upside surprise in construction payrolls
• Lumber futures approaching key resistance at 3-year moving average — breakout or rejection will define Q2 procurement strategy
• Census construction spending release — consensus +0.4% MoM; CSHI trajectory implies potential beat

REGIONAL SPOTLIGHT: Texas, Florida, and Arizona all hold HOT classification simultaneously — a configuration last seen in Q2 2021 and historically associated with 6–9 months of above-trend national construction activity.`

export async function GET() {
  return NextResponse.json(
    {
      brief: STATIC_BRIEF,
      generatedAt: new Date().toISOString(),
      source: 'static',
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
  )
}
