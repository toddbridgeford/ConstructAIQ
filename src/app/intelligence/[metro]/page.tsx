import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { color, font, radius } from '@/lib/theme'
import type { OpportunityIndexResponse, MetroIndexRow } from '@/app/api/opportunity-index/route'

export const revalidate = 86400

// ── 40 tracked metros ─────────────────────────────────────────────────────────

export const METROS: Record<string, { name: string; state: string }> = {
  PHX: { name: 'Phoenix',           state: 'AZ' },
  DFW: { name: 'Dallas–Fort Worth', state: 'TX' },
  AUS: { name: 'Austin',            state: 'TX' },
  HOU: { name: 'Houston',           state: 'TX' },
  CHI: { name: 'Chicago',           state: 'IL' },
  NYC: { name: 'New York',          state: 'NY' },
  LAX: { name: 'Los Angeles',       state: 'CA' },
  SEA: { name: 'Seattle',           state: 'WA' },
  DEN: { name: 'Denver',            state: 'CO' },
  ATL: { name: 'Atlanta',           state: 'GA' },
  MIA: { name: 'Miami',             state: 'FL' },
  BOS: { name: 'Boston',            state: 'MA' },
  SFO: { name: 'San Francisco',     state: 'CA' },
  LAS: { name: 'Las Vegas',         state: 'NV' },
  PDX: { name: 'Portland',          state: 'OR' },
  SAN: { name: 'San Diego',         state: 'CA' },
  MCO: { name: 'Orlando',           state: 'FL' },
  CLT: { name: 'Charlotte',         state: 'NC' },
  MSP: { name: 'Minneapolis',       state: 'MN' },
  SLC: { name: 'Salt Lake City',    state: 'UT' },
  SAC: { name: 'Sacramento',        state: 'CA' },
  SJC: { name: 'San Jose',          state: 'CA' },
  TPA: { name: 'Tampa',             state: 'FL' },
  IND: { name: 'Indianapolis',      state: 'IN' },
  CMH: { name: 'Columbus',          state: 'OH' },
  JAX: { name: 'Jacksonville',      state: 'FL' },
  ABQ: { name: 'Albuquerque',       state: 'NM' },
  OMA: { name: 'Omaha',             state: 'NE' },
  TUL: { name: 'Tulsa',             state: 'OK' },
  OKC: { name: 'Oklahoma City',     state: 'OK' },
  BNA: { name: 'Nashville',         state: 'TN' },
  STL: { name: 'St. Louis',         state: 'MO' },
  MKE: { name: 'Milwaukee',         state: 'WI' },
  KCI: { name: 'Kansas City',       state: 'MO' },
  RDU: { name: 'Raleigh–Durham',    state: 'NC' },
  SAT: { name: 'San Antonio',       state: 'TX' },
  ELP: { name: 'El Paso',           state: 'TX' },
  RIV: { name: 'Riverside',         state: 'CA' },
  RNO: { name: 'Reno',              state: 'NV' },
  CHS: { name: 'Charleston',        state: 'SC' },
}

export function generateStaticParams() {
  return Object.keys(METROS).map(code => ({ metro: code.toLowerCase() }))
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CityPermit {
  city_code:      string
  yoy_change_pct: number | null
  latest_month:   { permit_count: number; year_month: string } | null
  monthly:        Array<{ year_month: string; permit_count: number }> | null
}

interface Solicitation {
  notice_id:       string
  title:           string
  agency:          string
  response_due:    string | null
  estimated_value: number | null
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

async function fetchCityPermits(base: string, cityCode: string): Promise<CityPermit | null> {
  try {
    const r = await fetch(`${base}/api/permits?city=${cityCode}`, {
      next: { revalidate: 86400 },
    })
    if (!r.ok) return null
    const d = await r.json() as { cities?: CityPermit[] }
    return d.cities?.[0] ?? null
  } catch { return null }
}

async function fetchSolicitations(base: string, stateCode: string): Promise<Solicitation[]> {
  try {
    const r = await fetch(`${base}/api/solicitations?state=${stateCode}&limit=5`, {
      next: { revalidate: 86400 },
    })
    if (!r.ok) return []
    const d = await r.json() as { solicitations?: Solicitation[] }
    return d.solicitations ?? []
  } catch { return [] }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function classificationColor(c: string): string {
  if (c === 'PRIME')    return color.green
  if (c === 'STRONG')   return color.green
  if (c === 'MODERATE') return color.amber
  return color.red
}

function classificationBg(c: string): string {
  if (c === 'PRIME')    return color.greenDim
  if (c === 'STRONG')   return color.greenDim
  if (c === 'MODERATE') return color.amberDim
  return color.redDim
}

function permitLabel(yoy: number | null): string {
  if (yoy === null) return '—'
  if (yoy >= 10)  return 'Strongly growing'
  if (yoy >= 3)   return 'Growing'
  if (yoy >= -3)  return 'Stable'
  if (yoy >= -10) return 'Declining'
  return 'Sharply declining'
}

function permitArrow(yoy: number | null): string {
  if (yoy === null) return '—'
  if (yoy >= 3)   return '▲'
  if (yoy <= -3)  return '▼'
  return '→'
}

function permitColor(yoy: number | null): string {
  if (yoy === null) return color.t4
  if (yoy >= 3)   return color.green
  if (yoy <= -3)  return color.red
  return color.amber
}

function gapLabel(avg: number | null): string {
  if (avg === null) return 'No data'
  if (avg >= 40)  return 'High gap'
  if (avg >= 20)  return 'Moderate gap'
  return 'Low gap'
}

function gapColor(avg: number | null): string {
  if (avg === null) return color.t4
  if (avg >= 40)  return color.red
  if (avg >= 20)  return color.amber
  return color.green
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ── generateMetadata ──────────────────────────────────────────────────────────

type Props = { params: Promise<{ metro: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metro } = await params
  const code = metro.toUpperCase()
  const info = METROS[code]
  if (!info) return { title: 'Construction Market Intelligence — ConstructAIQ' }

  const { name: city, state } = info

  let score: number | null = null
  let permitTrend           = ''
  let federalRank           = ''

  try {
    const h    = await headers()
    const host = h.get('host') ?? 'localhost:3000'
    const base = baseUrl(host)

    const [indexData, permitData] = await Promise.all([
      fetchIndex(base),
      fetchCityPermits(base, code),
    ])

    const row = indexData?.metros.find(m => m.metro_code === code)
    if (row) {
      score = row.opportunity_score
      const rank = (indexData?.metros ?? [])
        .findIndex(m => m.metro_code === code)
      if (rank >= 0) federalRank = `#${rank + 1}`
    }

    const yoy = permitData?.yoy_change_pct ?? null
    if (yoy !== null) permitTrend = yoy >= 3 ? 'growing' : yoy <= -3 ? 'declining' : 'stable'
  } catch { /* best-effort — static fallback below */ }

  const title = `${city} Construction Market Intelligence 2026 — ConstructAIQ`
  const parts = [
    `Free ${city}, ${state} construction market data:`,
    score !== null ? `opportunity score ${score}/100,` : '',
    permitTrend     ? `${permitTrend} permits,` : '',
    federalRank     ? `${federalRank} federal pipeline rank.` : '',
    'Updated daily.',
  ]
  const description = parts.filter(Boolean).join(' ')

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter:   { card: 'summary', title, description },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function IntelligenceMetroPage({ params }: Props) {
  const { metro } = await params
  const code = metro.toUpperCase()
  const info = METROS[code]

  if (!info) {
    return (
      <div style={{ minHeight: '100vh', background: color.bg0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontFamily: font.sys, fontSize: 15, color: color.t3 }}>
          Metro not found.
        </p>
        <Link href="/intelligence" style={{ fontFamily: font.mono, fontSize: 13,
          color: color.amber, textDecoration: 'none' }}>
          ← All markets
        </Link>
      </div>
    )
  }

  const { name: cityName, state: stateCode } = info

  const h    = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const base = baseUrl(host)

  const [indexData, permitData, solicitations] = await Promise.all([
    fetchIndex(base),
    fetchCityPermits(base, code),
    fetchSolicitations(base, stateCode),
  ])

  const row: MetroIndexRow | undefined = indexData?.metros.find(m => m.metro_code === code)

  // Rank among all scored metros
  const allMetros = indexData?.metros ?? []
  const rankIdx   = allMetros.findIndex(m => m.metro_code === code)
  const rank      = rankIdx >= 0 ? rankIdx + 1 : null

  const score          = row?.opportunity_score  ?? null
  const classification = row?.classification     ?? ''
  const confidence     = row?.confidence         ?? ''
  const avgGap         = row?.avg_gap            ?? null
  const ghostCount     = row?.ghost_count        ?? 0
  const stalledCount   = row?.stalled_count      ?? 0
  const onTrackCount   = row?.on_track_count     ?? 0
  const topDrivers     = row?.top_drivers        ?? []
  const highFormCount  = row?.high_formation_count ?? 0
  const spend90d       = row?.spend_window_90d   ?? 0
  const computedAt     = row?.computed_at        ?? null

  const yoy        = permitData?.yoy_change_pct ?? null
  const latestMonth = permitData?.latest_month  ?? null

  const scoreColor = score !== null ? classificationColor(classification) : color.t4
  const scoreBg    = score !== null ? classificationBg(classification)    : color.bg2

  // Compose SEO narrative
  const permitSentence = yoy !== null
    ? `Permit activity in ${cityName} is ${permitLabel(yoy).toLowerCase()} ` +
      `(${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}% year-over-year` +
      (latestMonth ? `, latest month: ${latestMonth.permit_count.toLocaleString()} permits` : '') + ').'
    : `Permit data for ${cityName} is pending ingestion.`

  const gapSentence = row
    ? `The Reality Gap index shows ${ghostCount} ghost project${ghostCount !== 1 ? 's' : ''}, ` +
      `${stalledCount} stalled, and ${onTrackCount} on-track across tracked metro projects.`
    : ''

  const formationSentence = highFormCount > 0
    ? `${highFormCount} high-formation project${highFormCount !== 1 ? 's' : ''} ` +
      `identified, with ${spend90d} entering the 90-day spend window.`
    : ''

  const narrative = [
    score !== null
      ? `${cityName} scores ${score}/100 on the ConstructAIQ Opportunity Index — classified as ${classification.toUpperCase()}.`
      : `${cityName} construction market intelligence is updated daily from FRED, Census BPS, and Supabase real-time feeds.`,
    permitSentence,
    gapSentence,
    formationSentence,
  ].filter(Boolean).join(' ')

  // JSON-LD structured data
  const jsonLd = {
    '@context':       'https://schema.org',
    '@type':          'Dataset',
    'name':           `${cityName} Construction Market Intelligence`,
    'description':    `Daily construction market intelligence for ${cityName}, ${stateCode}: ` +
                      `opportunity score, permit trends, federal pipeline, reality gap, ` +
                      `and spend formation signals.`,
    'publisher': {
      '@type': 'Organization',
      'name':  'ConstructAIQ',
      'url':   'https://constructaiq.trade',
    },
    'license':          'https://creativecommons.org/licenses/by/4.0/',
    'temporalCoverage': '2020/..',
    'spatialCoverage':  `${cityName}, ${stateCode}`,
    'url':              `https://constructaiq.trade/intelligence/${code.toLowerCase()}`,
    'keywords': [
      `${cityName} construction market`,
      `${cityName} construction permits 2026`,
      `${cityName} construction forecast`,
      `${stateCode} construction intelligence`,
      'construction market data',
      'ConstructAIQ',
    ],
  }

  const SL = (label: string) => (
    <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4,
      letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
      {label}
    </div>
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 96px' }}>

          {/* Back nav */}
          <Link href="/intelligence" style={{ fontFamily: font.mono, fontSize: 12,
            color: color.t4, textDecoration: 'none', display: 'inline-block',
            marginBottom: 28, letterSpacing: '0.04em' }}>
            ← All markets
          </Link>

          {/* ── Hero ───────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24,
            marginBottom: 48, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <h1 style={{ fontFamily: font.sys, fontSize: 34, fontWeight: 700,
                color: color.t1, margin: '0 0 6px', lineHeight: 1.15 }}>
                {cityName}
              </h1>
              <p style={{ fontFamily: font.sys, fontSize: 14, color: color.t3,
                margin: '0 0 12px' }}>
                {stateCode} · Construction Market Intelligence ·{' '}
                <span style={{ fontFamily: font.mono, fontSize: 12 }}>
                  {computedAt ? `Updated ${formatDate(computedAt)}` : 'Updated daily'}
                </span>
              </p>
              {rank !== null && (
                <div style={{ fontFamily: font.mono, fontSize: 12, color: color.t4 }}>
                  Ranked <span style={{ color: color.amber }}>#{rank}</span> of {allMetros.length} tracked metros
                </div>
              )}
            </div>

            {/* Score pill */}
            {score !== null && (
              <div style={{ background: scoreBg, border: `1px solid ${scoreColor}33`,
                borderRadius: radius.lg, padding: '16px 28px', textAlign: 'center',
                minWidth: 120 }}>
                <div style={{ fontFamily: font.mono, fontSize: 42, fontWeight: 700,
                  color: scoreColor, lineHeight: 1 }}>
                  {score}
                </div>
                <div style={{ fontFamily: font.mono, fontSize: 10, color: scoreColor,
                  letterSpacing: '0.08em', marginTop: 4, opacity: 0.85 }}>
                  / 100
                </div>
                <div style={{ fontFamily: font.sys, fontSize: 12, color: scoreColor,
                  marginTop: 6, fontWeight: 600 }}>
                  {classification}
                </div>
                {confidence && (
                  <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4,
                    marginTop: 3, letterSpacing: '0.06em' }}>
                    {confidence} confidence
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Market vitals ───────────────────────────────────────────────── */}
          {SL('Market Vitals')}
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
            gap: 14, marginBottom: 40 }}>

            {/* Permits */}
            <div style={{ background: color.bg1, borderRadius: radius.lg,
              border: `1px solid ${color.bd1}`, padding: '18px 20px' }}>
              <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4,
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Permit Trend
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 24, fontWeight: 700,
                color: permitColor(yoy) }}>
                {yoy !== null
                  ? `${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}%`
                  : '—'}
                {' '}
                <span style={{ fontSize: 16 }}>{permitArrow(yoy)}</span>
              </div>
              <div style={{ fontFamily: font.sys, fontSize: 12, color: color.t4, marginTop: 4 }}>
                {permitLabel(yoy)} year-over-year
              </div>
              {latestMonth && (
                <div style={{ fontFamily: font.mono, fontSize: 11, color: color.t4, marginTop: 6 }}>
                  {latestMonth.permit_count.toLocaleString()} permits ·{' '}
                  {latestMonth.year_month}
                </div>
              )}
            </div>

            {/* Reality Gap */}
            <div style={{ background: color.bg1, borderRadius: radius.lg,
              border: `1px solid ${color.bd1}`, padding: '18px 20px' }}>
              <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4,
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Reality Gap
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 24, fontWeight: 700,
                color: gapColor(avgGap) }}>
                {avgGap !== null ? `${avgGap}%` : '—'}
              </div>
              <div style={{ fontFamily: font.sys, fontSize: 12, color: color.t4, marginTop: 4 }}>
                {gapLabel(avgGap)} avg · {row?.gap_project_count ?? 0} projects tracked
              </div>
            </div>

            {/* Spend formation */}
            <div style={{ background: color.bg1, borderRadius: radius.lg,
              border: `1px solid ${color.bd1}`, padding: '18px 20px' }}>
              <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4,
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Spend Formation
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 24, fontWeight: 700,
                color: highFormCount > 0 ? color.blue : color.t4 }}>
                {highFormCount}
              </div>
              <div style={{ fontFamily: font.sys, fontSize: 12, color: color.t4, marginTop: 4 }}>
                High-formation projects · {spend90d} in 90d window
              </div>
            </div>

            {/* Metro rank */}
            <div style={{ background: color.bg1, borderRadius: radius.lg,
              border: `1px solid ${color.bd1}`, padding: '18px 20px' }}>
              <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4,
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Opportunity Rank
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 24, fontWeight: 700,
                color: rank !== null && rank <= 10 ? color.amber : color.t2 }}>
                {rank !== null ? `#${rank}` : '—'}
              </div>
              <div style={{ fontFamily: font.sys, fontSize: 12, color: color.t4, marginTop: 4 }}>
                of {allMetros.length || 40} tracked US metros
              </div>
            </div>
          </div>

          {/* ── Narrative ───────────────────────────────────────────────────── */}
          {SL('Market Summary')}
          <div style={{ background: color.bg1, borderRadius: radius.lg,
            border: `1px solid ${color.bd1}`,
            padding: '24px', marginBottom: 40,
            fontFamily: font.sys, fontSize: 15, color: color.t2, lineHeight: 1.8 }}>
            {narrative}
          </div>

          {/* ── Signal drivers ──────────────────────────────────────────────── */}
          {topDrivers.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              {SL('Top Signal Drivers')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topDrivers.slice(0, 4).map(d => {
                  const dScore = d.score
                  const dColor = dScore >= 70 ? color.green
                    : dScore >= 40 ? color.amber : color.red
                  return (
                    <div key={d.id} style={{ background: color.bg1,
                      borderRadius: radius.md,
                      border: `1px solid ${color.bd1}`,
                      padding: '14px 20px',
                      display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: font.sys, fontSize: 14,
                          fontWeight: 500, color: color.t1 }}>
                          {d.label}
                        </div>
                        {d.detail && (
                          <div style={{ fontFamily: font.sys, fontSize: 12,
                            color: color.t4, marginTop: 3, lineHeight: 1.5 }}>
                            {d.detail}
                          </div>
                        )}
                      </div>
                      {/* Score bar */}
                      <div style={{ flexShrink: 0, width: 120 }}>
                        <div style={{ height: 4, background: color.bg3,
                          borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${dScore}%`,
                            background: dColor, borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ fontFamily: font.mono, fontSize: 11,
                          color: dColor, marginTop: 4, textAlign: 'right' }}>
                          {dScore}/100
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Reality Gap breakdown ────────────────────────────────────────── */}
          {(row?.gap_project_count ?? 0) > 0 && (
            <div style={{ marginBottom: 40 }}>
              {SL('Project Reality Gap')}
              <div style={{ background: color.bg1, borderRadius: radius.lg,
                border: `1px solid ${color.bd1}`, padding: '24px',
                display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {[
                  { label: 'On Track',  count: onTrackCount, c: color.green },
                  { label: 'Stalled',   count: stalledCount, c: color.amber },
                  { label: 'Ghost',     count: ghostCount,   c: color.red   },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontFamily: font.mono, fontSize: 28,
                      fontWeight: 700, color: item.c }}>
                      {item.count}
                    </div>
                    <div style={{ fontFamily: font.sys, fontSize: 12,
                      color: color.t4, marginTop: 4 }}>
                      {item.label}
                    </div>
                  </div>
                ))}
                {avgGap !== null && (
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontFamily: font.mono, fontSize: 28,
                      fontWeight: 700, color: gapColor(avgGap) }}>
                      {avgGap}%
                    </div>
                    <div style={{ fontFamily: font.sys, fontSize: 12,
                      color: color.t4, marginTop: 4 }}>
                      Avg Gap
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Open solicitations ──────────────────────────────────────────── */}
          {solicitations.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              {SL('Open Federal Solicitations')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {solicitations.map(s => {
                  const days = s.response_due
                    ? Math.ceil((new Date(s.response_due).getTime() - Date.now()) / 86_400_000)
                    : null
                  const dueColor =
                    days === null  ? color.t4 :
                    days <= 7      ? color.red :
                    days <= 21     ? color.amber :
                    color.green
                  return (
                    <div key={s.notice_id} style={{ background: color.bg1,
                      borderRadius: radius.md,
                      border: `1px solid ${color.bd1}`,
                      padding: '14px 20px',
                      display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontFamily: font.sys, fontSize: 13,
                          fontWeight: 600, color: color.t1, lineHeight: 1.4 }}>
                          {s.title}
                        </div>
                        <div style={{ fontFamily: font.mono, fontSize: 11,
                          color: color.t4, marginTop: 3 }}>
                          {s.agency} · {s.notice_id}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column',
                        alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        {s.estimated_value !== null && (
                          <div style={{ fontFamily: font.mono, fontSize: 13,
                            fontWeight: 700, color: color.t2 }}>
                            {s.estimated_value >= 1_000_000
                              ? `$${(s.estimated_value / 1_000_000).toFixed(1)}M`
                              : s.estimated_value >= 1_000
                              ? `$${(s.estimated_value / 1_000).toFixed(0)}K`
                              : `$${s.estimated_value.toLocaleString()}`}
                          </div>
                        )}
                        {s.response_due && (
                          <div style={{ fontFamily: font.mono, fontSize: 11,
                            color: dueColor }}>
                            Due {new Date(s.response_due).toLocaleDateString('en-US',
                              { month: 'short', day: 'numeric' })}
                            {days !== null && ` · ${days <= 0 ? 'Past due' : `${days}d`}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 10 }}>
                <Link href={`/federal?tab=solicitations&state=${stateCode}`}
                  style={{ fontFamily: font.mono, fontSize: 11,
                    color: color.amber, textDecoration: 'none' }}>
                  View all {stateCode} solicitations →
                </Link>
              </div>
            </div>
          )}

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <div style={{ background: color.bg1, borderRadius: radius.xl,
            border: `1px solid ${color.bd2}`,
            padding: '32px', textAlign: 'center', marginTop: 24 }}>
            <div style={{ fontFamily: font.sys, fontSize: 18, fontWeight: 600,
              color: color.t1, marginBottom: 8 }}>
              Explore the full {cityName} forecast
            </div>
            <p style={{ fontFamily: font.sys, fontSize: 14, color: color.t3,
              margin: '0 0 20px', lineHeight: 1.6 }}>
              12-month ensemble AI forecast, scenario builder, anomaly detection,
              and SAM.gov live solicitations — free forever.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/dashboard">
                <button style={{ background: color.blue, color: color.t1,
                  fontFamily: font.sys, fontSize: 14, fontWeight: 600,
                  padding: '10px 24px', borderRadius: radius.md,
                  border: 'none', cursor: 'pointer', minHeight: 44 }}>
                  Open Dashboard →
                </button>
              </Link>
              <Link href="/intelligence">
                <button style={{ background: 'transparent', color: color.t3,
                  fontFamily: font.sys, fontSize: 14,
                  padding: '10px 24px', borderRadius: radius.md,
                  border: `1px solid ${color.bd2}`, cursor: 'pointer', minHeight: 44 }}>
                  ← All markets
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
