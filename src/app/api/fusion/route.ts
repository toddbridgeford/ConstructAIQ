import { NextResponse } from 'next/server'

export const maxDuration = 10

export const dynamic = 'force-dynamic'

type SignalType = 'BULLISH' | 'BEARISH' | 'CAUTION'
interface Signal { type: SignalType; text: string }
interface FusionData { narrative: string; signals: Signal[]; verdict: string }

const REGIONAL: Record<string, FusionData> = {
  US: {
    narrative: "National construction activity is holding above trend despite materials cost pressure. Permit volumes remain positive YoY in Sun Belt metros while Rust Belt markets show deceleration. Federal construction awards are tracking 4.2% below prior-year pace driven by DOD and DOT slowdowns.",
    signals: [
      { type: 'BULLISH',  text: 'Total construction spending $2.19T — near cycle highs' },
      { type: 'BULLISH',  text: 'Sun Belt permit momentum intact: TX, FL, AZ leading' },
      { type: 'CAUTION',  text: 'Materials PPI +8.4% YoY — cost overrun risk elevated' },
      { type: 'BEARISH',  text: 'Federal award pipeline -4.2% YoY across construction NAICS' },
      { type: 'CAUTION',  text: 'Midwest CDI trending up 3 consecutive months' },
    ],
    verdict: "Neutral-to-cautious. Sun Belt momentum offsets Midwest softness. Monitor federal award velocity and Q2 employment data as leading signals for H2 outlook.",
  },
  TX: {
    narrative: "Texas remains the highest-volume construction market nationally. Permit activity is up 6.1% YoY led by multifamily and industrial. Federal contract awards are steady, anchored by Fort Worth DOD expansion and Gulf Coast energy infrastructure.",
    signals: [
      { type: 'BULLISH', text: 'Permit volume +6.1% YoY — top quartile nationally' },
      { type: 'BULLISH', text: 'Industrial construction surging: 22M sqft pipeline in DFW' },
      { type: 'BULLISH', text: 'Employment +2.8% YoY in construction trades' },
      { type: 'CAUTION', text: 'Concrete and rebar costs +11% above 5-year avg' },
    ],
    verdict: "Bullish. Texas fundamentals remain strong across residential, industrial, and infrastructure. Lenders should maintain full deployment posture with standard cost-overrun reserves.",
  },
  CA: {
    narrative: "California construction is bifurcated: coastal metros cooling while Inland Empire and Sacramento remain active. Permit values have declined 9% in LA and SF. Labor costs are 28% above national average, compressing margins on public projects.",
    signals: [
      { type: 'BEARISH',  text: 'LA/SF permit values -9% YoY — pipeline contracting' },
      { type: 'BULLISH',  text: 'Inland Empire industrial pipeline strong: 15M sqft active' },
      { type: 'CAUTION',  text: 'Labor cost premium +28% vs national — margin compression' },
      { type: 'CAUTION',  text: 'Seismic zone exposure elevated in SF Bay Area projects' },
    ],
    verdict: "Mixed. Avoid overleveraged coastal residential. Industrial and infrastructure in secondary metros still viable with appropriate labor cost assumptions in underwriting.",
  },
  FL: {
    narrative: "Florida sustains top-3 construction volume nationally driven by residential migration and coastal infrastructure. Hurricane hardening mandates are adding 8-12% to residential cost bases. Miami-Dade and Hillsborough are outperforming.",
    signals: [
      { type: 'BULLISH', text: 'Net in-migration sustains housing demand — 380K annual' },
      { type: 'BULLISH', text: 'Infrastructure bill allocations: $4.2B in active projects' },
      { type: 'CAUTION', text: 'Insurance costs +34% — residential pro forma impact' },
      { type: 'CAUTION', text: 'Hurricane hardening mandates +8-12% cost premium' },
    ],
    verdict: "Bullish with caveats. Strong demand fundamentals but rising insurance and code compliance costs warrant conservative contingency reserves in project underwriting.",
  },
  NY: {
    narrative: "New York construction activity is recovering from a prolonged slowdown. 421-a expiration created a multifamily gap that is now partially offset by affordable housing programs. Infrastructure spending via MTA and Port Authority remains elevated.",
    signals: [
      { type: 'CAUTION',  text: '421-a expiration created multifamily development gap' },
      { type: 'BULLISH',  text: 'MTA capital program: $15B in active construction' },
      { type: 'BULLISH',  text: 'Affordable housing pipeline recovering — $2.1B in awards' },
      { type: 'BEARISH',  text: 'Labor costs highest nationally — union scale +22% since 2021' },
    ],
    verdict: "Cautious-to-neutral. Infrastructure spending stabilizes the market but private development economics remain challenged. Public project exposure preferred over speculative residential.",
  },
  IL: {
    narrative: "Illinois — particularly Chicago — is showing the most acute CDI signals in the Midwest. Permit volume is down 18% YoY and construction employment has declined 3.2% over 12 months. Federal award flow has moderated. Active lenders should stress-test completion timelines.",
    signals: [
      { type: 'BEARISH', text: 'Permit volume -18% YoY — pipeline contraction accelerating' },
      { type: 'BEARISH', text: 'Construction employment -3.2% YoY — labor tightening' },
      { type: 'BEARISH', text: 'CDI at 74.2 — highest in watchlist for 3 consecutive months' },
      { type: 'CAUTION', text: 'Materials cost +19% above 5-yr avg in Chicago metro' },
    ],
    verdict: "Bearish. Illinois fundamentals are deteriorating across permit, employment, and cost metrics. Lenders should increase covenant monitoring frequency and stress-test completion guarantees at 15-20% overrun scenarios.",
  },
}

function generateFusion(region: string): FusionData {
  return {
    narrative: `Construction market intelligence for ${region} is being aggregated. Activity indicators show mixed signals consistent with the national trend. Monitor permit velocity and employment data as leading indicators.`,
    signals: [
      { type: 'BULLISH', text: 'Permit activity tracking above prior-quarter baseline' },
      { type: 'CAUTION', text: 'Materials cost environment remains elevated nationally' },
      { type: 'CAUTION', text: 'Federal award timing creating near-term revenue uncertainty' },
    ],
    verdict: "Neutral. Insufficient regional-specific data to establish directional conviction. Default to national overlay with standard construction lending underwriting criteria.",
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const region = (searchParams.get('region') || 'US').toUpperCase()
  const data = REGIONAL[region] ?? generateFusion(region)

  return NextResponse.json(
    { region, ...data, generated_at: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  )
}
