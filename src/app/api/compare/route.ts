import { NextResponse } from "next/server"

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SECTOR_LABELS: Record<string, string> = {
  residential:    'Residential',
  commercial:     'Commercial',
  infrastructure: 'Infrastructure',
  industrial:     'Industrial',
}

export async function GET(req: Request) {
  const url  = new URL(req.url)
  const base = url.origin

  const [res, com, inf, ind] = await Promise.all([
    fetch(`${base}/api/sector/residential`,   { cache: 'no-store' }).then(r => r.json()),
    fetch(`${base}/api/sector/commercial`,    { cache: 'no-store' }).then(r => r.json()),
    fetch(`${base}/api/sector/infrastructure`,{ cache: 'no-store' }).then(r => r.json()),
    fetch(`${base}/api/sector/industrial`,    { cache: 'no-store' }).then(r => r.json()),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectors = [res, com, inf, ind].map((s: any) => ({
    ...s,
    id:    s.sector,
    label: SECTOR_LABELS[s.sector] ?? s.sector,
  }))

  // Derive rotation signals from sector verdicts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expanding    = sectors.filter((s: any) => s.verdict === 'EXPANDING')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contracting  = sectors.filter((s: any) => s.verdict === 'CONTRACTING')

  const rotation_signals = contracting.flatMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (from: any) => expanding.map((to: any) => ({
      from:      from.label,
      to:        to.label,
      strength:  'MODERATE' as const,
      rationale: `${from.label} showing contraction signals while ${to.label} is expanding`,
    }))
  )

  return NextResponse.json({
    sectors,
    rotation_signals,
  }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
  })
}
