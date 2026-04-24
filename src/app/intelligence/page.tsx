import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { color, font, radius } from '@/lib/theme'
import { METROS } from './[metro]/page'
import type { OpportunityIndexResponse, MetroIndexRow } from '@/app/api/opportunity-index/route'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'US Construction Market Intelligence — All Markets — ConstructAIQ',
  description:
    'Free construction market intelligence scores for 40 US metros. ' +
    'Opportunity scores, permit trends, reality gap, and spend formation signals — updated daily.',
  openGraph: {
    title: 'US Construction Market Intelligence — All Markets — ConstructAIQ',
    description:
      'Free construction market intelligence scores for 40 US metros. Updated daily.',
    type: 'website',
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CityPermit {
  city_code:      string
  yoy_change_pct: number | null
}

// ── API helpers ───────────────────────────────────────────────────────────────

function baseUrl(host: string): string {
  return host.startsWith('localhost') ? `http://${host}` : `https://${host}`
}

async function fetchIndex(base: string): Promise<OpportunityIndexResponse | null> {
  try {
    const r = await fetch(`${base}/api/opportunity-index`, {
      next: { revalidate: 86400 },
    })
    return r.ok ? (r.json() as Promise<OpportunityIndexResponse>) : null
  } catch { return null }
}

async function fetchAllPermits(base: string): Promise<Map<string, number | null>> {
  try {
    const r = await fetch(`${base}/api/permits`, { next: { revalidate: 86400 } })
    if (!r.ok) return new Map()
    const d = await r.json() as { cities?: CityPermit[] }
    const map = new Map<string, number | null>()
    for (const c of d.cities ?? []) map.set(c.city_code, c.yoy_change_pct)
    return map
  } catch { return new Map() }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(c: string): string {
  if (c === 'PRIME')    return color.green
  if (c === 'STRONG')   return color.green
  if (c === 'MODERATE') return color.amber
  if (c === 'WEAK')     return color.red
  return color.t4
}

function scoreBg(c: string): string {
  if (c === 'PRIME')    return color.greenDim
  if (c === 'STRONG')   return color.greenDim
  if (c === 'MODERATE') return color.amberDim
  if (c === 'WEAK')     return color.redDim
  return color.bg2
}

function permitArrow(yoy: number | null): string {
  if (yoy === null) return '—'
  if (yoy >= 3)   return '▲'
  if (yoy <= -3)  return '▼'
  return '→'
}

function permitArrowColor(yoy: number | null): string {
  if (yoy === null) return color.t4
  if (yoy >= 3)   return color.green
  if (yoy <= -3)  return color.red
  return color.amber
}

function gapBadge(avg: number | null): string {
  if (avg === null) return 'No data'
  if (avg >= 40)  return 'High gap'
  if (avg >= 20)  return 'Moderate gap'
  return 'Low gap'
}

function gapBadgeColor(avg: number | null): string {
  if (avg === null) return color.t4
  if (avg >= 40)  return color.red
  if (avg >= 20)  return color.amber
  return color.green
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function IntelligenceIndexPage() {
  const h    = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const base = baseUrl(host)

  const [indexData, permitMap] = await Promise.all([
    fetchIndex(base),
    fetchAllPermits(base),
  ])

  // Build display rows: scored metros first (sorted by score), then unscored metros
  const scoredMap = new Map<string, MetroIndexRow>()
  for (const m of indexData?.metros ?? []) scoredMap.set(m.metro_code, m)

  type DisplayRow = {
    code:           string
    name:           string
    state:          string
    score:          number | null
    classification: string
    confidence:     string
    avgGap:         number | null
    yoy:            number | null
    rank:           number | null
  }

  const scored: DisplayRow[] = (indexData?.metros ?? [])
    .map((m, i) => ({
      code:           m.metro_code,
      name:           METROS[m.metro_code]?.name ?? m.metro_name ?? m.metro_code,
      state:          METROS[m.metro_code]?.state ?? m.state_code ?? '',
      score:          m.opportunity_score,
      classification: m.classification,
      confidence:     m.confidence,
      avgGap:         m.avg_gap,
      yoy:            permitMap.get(m.metro_code) ?? null,
      rank:           i + 1,
    }))

  // Metros in our canonical 40 that aren't in the scored list yet
  const unscored: DisplayRow[] = Object.entries(METROS)
    .filter(([code]) => !scoredMap.has(code))
    .map(([code, info]) => ({
      code,
      name:           info.name,
      state:          info.state,
      score:          null,
      classification: '',
      confidence:     '',
      avgGap:         null,
      yoy:            permitMap.get(code) ?? null,
      rank:           null,
    }))

  const rows: DisplayRow[] = [...scored, ...unscored]

  const totalScored = scored.length
  const avgScore    = totalScored > 0
    ? Math.round(scored.reduce((s, r) => s + (r.score ?? 0), 0) / totalScored)
    : null

  return (
    <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1 }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px 96px' }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: font.sys, fontSize: 32, fontWeight: 700,
            color: color.t1, margin: '0 0 10px', lineHeight: 1.2 }}>
            US Construction Market Intelligence
          </h1>
          <p style={{ fontFamily: font.sys, fontSize: 15, color: color.t3,
            margin: '0 0 20px', maxWidth: 600, lineHeight: 1.6 }}>
            Opportunity scores, permit trends, reality gap, and spend formation
            for {rows.length} tracked US metros. Free forever — updated daily.
          </p>

          {/* Summary strip */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Metros tracked',  value: rows.length.toString() },
              { label: 'With live scores', value: totalScored.toString() },
              { label: 'Avg opportunity', value: avgScore !== null ? `${avgScore}/100` : '—' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: font.mono, fontSize: 18, fontWeight: 700,
                  color: color.t1 }}>
                  {item.value}
                </span>
                <span style={{ fontFamily: font.mono, fontSize: 10, color: color.t4,
                  letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Metro grid ──────────────────────────────────────────────────── */}
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
          gap: 14 }}>
          {rows.map(row => {
            const sc     = row.score
            const cl     = row.classification
            const sColor = sc !== null ? scoreColor(cl) : color.t4
            const sBg    = sc !== null ? scoreBg(cl)    : color.bg2
            const yoy    = row.yoy
            const gap    = row.avgGap

            return (
              <Link key={row.code} href={`/intelligence/${row.code.toLowerCase()}`}
                style={{ textDecoration: 'none' }}>
                <div style={{ background: color.bg1, borderRadius: radius.lg,
                  border: `1px solid ${color.bd1}`,
                  padding: '20px', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>

                  {/* Card header: city + score */}
                  <div style={{ display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: font.sys, fontSize: 16, fontWeight: 600,
                        color: color.t1, marginBottom: 2 }}>
                        {row.name}
                      </div>
                      <div style={{ fontFamily: font.mono, fontSize: 11,
                        color: color.t4, letterSpacing: '0.04em' }}>
                        {row.state}
                        {row.rank !== null && (
                          <span style={{ color: color.amber, marginLeft: 6 }}>
                            #{row.rank}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score pill */}
                    <div style={{ background: sBg,
                      border: `1px solid ${sColor}44`,
                      borderRadius: radius.md,
                      padding: '6px 12px', textAlign: 'center',
                      flexShrink: 0 }}>
                      <div style={{ fontFamily: font.mono, fontSize: 22,
                        fontWeight: 700, color: sColor, lineHeight: 1 }}>
                        {sc !== null ? sc : '—'}
                      </div>
                      {cl && (
                        <div style={{ fontFamily: font.mono, fontSize: 9,
                          color: sColor, letterSpacing: '0.07em',
                          marginTop: 2, opacity: 0.85 }}>
                          {cl}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges row: gap + permit */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* Reality Gap badge */}
                    <div style={{ fontFamily: font.mono, fontSize: 10,
                      letterSpacing: '0.05em',
                      padding: '3px 8px', borderRadius: radius.sm,
                      background: gapBadgeColor(gap) + '22',
                      color: gapBadgeColor(gap),
                      border: `1px solid ${gapBadgeColor(gap)}44` }}>
                      {gapBadge(gap)}
                    </div>

                    {/* Permit trend arrow */}
                    <div style={{ fontFamily: font.mono, fontSize: 10,
                      letterSpacing: '0.05em',
                      padding: '3px 8px', borderRadius: radius.sm,
                      background: permitArrowColor(yoy) + '18',
                      color: permitArrowColor(yoy),
                      border: `1px solid ${permitArrowColor(yoy)}33` }}>
                      Permits {permitArrow(yoy)}
                      {yoy !== null && ` ${yoy >= 0 ? '+' : ''}${yoy.toFixed(0)}%`}
                    </div>
                  </div>

                  {/* View link */}
                  <div style={{ fontFamily: font.mono, fontSize: 11,
                    color: color.blue, letterSpacing: '0.04em', marginTop: 'auto' }}>
                    View intelligence →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── Footer note ─────────────────────────────────────────────────── */}
        <div style={{ marginTop: 48, padding: '20px 0',
          borderTop: `1px solid ${color.bd1}`,
          fontFamily: font.sys, fontSize: 13, color: color.t4, lineHeight: 1.7 }}>
          Data sources: US Census Bureau Building Permits Survey, FRED (Federal Reserve Economic
          Data), BLS, SAM.gov, USASpending.gov. Opportunity scores computed daily via ConstructAIQ
          ensemble model. All data is free and publicly available.{' '}
          <Link href="/methodology" style={{ color: color.amber, textDecoration: 'none' }}>
            View methodology →
          </Link>
        </div>

      </div>
    </div>
  )
}
