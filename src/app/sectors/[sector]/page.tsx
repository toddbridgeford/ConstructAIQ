"use client"
import { useState, useEffect } from "react"
import { useParams }           from "next/navigation"
import Link                    from "next/link"
import { Nav }                 from "@/app/components/Nav"
import { DriverPanel }         from "@/app/dashboard/components/DriverPanel"
import { BenchmarkBadge }      from "@/app/components/ui/BenchmarkBadge"
import { color, font, layout as L } from "@/lib/theme"
import type { SectorResponse, Verdict, PrimarySignal } from "@/app/api/sector/[sector]/route"

const MONO = font.mono
const SYS  = font.sys

// ── Sector metadata ────────────────────────────────────────────────────────

type SectorId = 'residential' | 'commercial' | 'infrastructure' | 'industrial'

interface SectorMeta {
  label:         string
  icon:          string
  primarySeries: string   // series ID for DriverPanel
  trendLabel:    string
  sectionFour:   React.FC<{ data: SectorResponse }>
}

// ── Section 4 variants ─────────────────────────────────────────────────────

function ResidentialExtra({ data }: { data: SectorResponse }) {
  const mortgageSig = data.primary_signals.find(s => s.id === 'MORTGAGE30US')
  const lumberSig   = data.primary_signals.find(s => s.id === 'PPI_LUMBER')
  const rate        = parseFloat(mortgageSig?.value ?? '6.74')
  const medianPrice = 420000
  const monthlyPayment = Math.round((medianPrice * 0.8 * (rate / 100 / 12)) /
    (1 - Math.pow(1 + rate / 100 / 12, -360)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <InsightRow
        label="Affordability Index"
        value={`~$${monthlyPayment.toLocaleString()}/mo`}
        note={`Estimated P&I on $${(medianPrice * 0.8 / 1000).toFixed(0)}K loan at ${mortgageSig?.value ?? '—'}`}
      />
      <InsightRow
        label="Lumber Cost Pressure"
        value={lumberSig?.value ?? '—'}
        note="PPI lumber index — elevated above 180 signals cost headwind"
      />
      <InsightRow
        label="Rate Sensitivity"
        value={rate > 7 ? 'HIGH' : rate > 6.5 ? 'MODERATE' : 'LOW'}
        note="Impact of current mortgage rate on first-time buyer qualification"
      />
    </div>
  )
}

function CommercialExtra() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <InsightRow
        label="ABI Reading"
        value="51"
        note="Architecture Billings Index above 50 signals near-term construction demand"
      />
      <InsightRow
        label="Office Vacancy Context"
        value="~18% national"
        note="High office vacancy dampening new office starts; industrial and lab offset"
      />
      <InsightRow
        label="Leading Indicator"
        value="Mixed"
        note="Industrial/data center strong; office/retail soft — net commercial stable"
      />
    </div>
  )
}

function InfrastructureExtra() {
  // Top 3 states by federal award growth from static federal data
  const TOP_STATES = [
    { state: 'TX', awards: '$18.4B', yoy: '+12.4%' },
    { state: 'CA', awards: '$17.8B', yoy: '+8.2%'  },
    { state: 'FL', awards: '$14.3B', yoy: '+15.1%' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.08em',
                    textTransform: 'uppercase', marginBottom: 4 }}>
        Top 3 States · Federal Award Growth
      </div>
      {TOP_STATES.map(({ state, awards, yoy }) => (
        <div key={state} style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'space-between',
          borderLeft:    `3px solid ${color.blue}`,
          paddingLeft:   10,
        }}>
          <div>
            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: color.t1 }}>{state}</span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: color.t3, marginLeft: 10 }}>{awards}</span>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: color.green }}>
            {yoy}
          </span>
        </div>
      ))}
    </div>
  )
}

function IndustrialExtra() {
  // Top 3 cities by commercial permit volume (deterministic)
  const TOP_CITIES = [
    { city: 'Phoenix, AZ',  permits: '4,820', yoy: '+18.2%' },
    { city: 'Dallas, TX',   permits: '3,960', yoy: '+22.4%' },
    { city: 'Houston, TX',  permits: '3,540', yoy: '+14.8%' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.08em',
                    textTransform: 'uppercase', marginBottom: 4 }}>
        Top 3 Cities · Commercial Permit Volume
      </div>
      {TOP_CITIES.map(({ city, permits, yoy }) => (
        <div key={city} style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'space-between',
          borderLeft:    `3px solid ${color.purple}`,
          paddingLeft:   10,
        }}>
          <div>
            <span style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t1 }}>{city}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: color.t3, marginLeft: 10 }}>{permits} permits</span>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: color.green }}>
            {yoy}
          </span>
        </div>
      ))}
    </div>
  )
}

const SECTOR_META: Record<SectorId, SectorMeta> = {
  residential: {
    label: 'Residential', icon: '🏠',
    primarySeries: 'HOUST',
    trendLabel: 'Housing Starts + Permits — 24 Months',
    sectionFour: ResidentialExtra,
  },
  commercial: {
    label: 'Commercial', icon: '🏢',
    primarySeries: 'TTLCONS',
    trendLabel: 'Nonresidential Construction Spending — 24 Months',
    sectionFour: CommercialExtra,
  },
  infrastructure: {
    label: 'Infrastructure', icon: '🌉',
    primarySeries: 'CES2000000001',
    trendLabel: 'Federal Awards Trend + Construction Employment',
    sectionFour: InfrastructureExtra,
  },
  industrial: {
    label: 'Industrial', icon: '🏭',
    primarySeries: 'PERMIT',
    trendLabel: 'Commercial Permits + Steel PPI — 24 Months',
    sectionFour: IndustrialExtra,
  },
}

// ── Shared UI atoms ────────────────────────────────────────────────────────

function verdictColor(v: Verdict | undefined): string {
  if (v === 'EXPANDING')   return color.green
  if (v === 'CONTRACTING') return color.red
  return color.amber
}

function VerdictBadge({ verdict, size = 'md' }: { verdict: Verdict | undefined; size?: 'sm' | 'md' }) {
  const col = verdictColor(verdict)
  const fs  = size === 'sm' ? 11 : 13
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           6,
      fontFamily:    MONO,
      fontSize:      fs,
      fontWeight:    700,
      letterSpacing: '0.08em',
      color:         col,
      background:    col + '18',
      border:        `1px solid ${col}33`,
      borderRadius:  20,
      padding:       size === 'sm' ? '3px 10px' : '5px 14px',
    }}>
      <span style={{ width: size === 'sm' ? 6 : 8, height: size === 'sm' ? 6 : 8,
                     borderRadius: '50%', background: col, flexShrink: 0 }} />
      {verdict ?? '—'}
    </span>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:    color.bg1,
      border:        `1px solid ${color.bd1}`,
      borderRadius:  L.cardRadius,
      padding:       '24px 28px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily:    MONO,
      fontSize:      10,
      color:         color.t4,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom:  16,
    }}>
      {children}
    </div>
  )
}

function InsightRow({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      gap:           3,
      borderLeft:    `2px solid ${color.bd2}`,
      paddingLeft:   12,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t2 }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: color.t1, flexShrink: 0 }}>{value}</span>
      </div>
      <span style={{ fontFamily: SYS, fontSize: 11, color: color.t4 }}>{note}</span>
    </div>
  )
}

// ── KPI signal card ────────────────────────────────────────────────────────

function SignalKpiCard({ sig }: { sig: PrimarySignal }) {
  const dirCol = sig.direction === 'UP' ? color.green : sig.direction === 'DOWN' ? color.red : color.t4
  const arrow  = sig.direction === 'UP' ? '↑' : sig.direction === 'DOWN' ? '↓' : '→'

  return (
    <div style={{
      background:    color.bg1,
      border:        `1px solid ${color.bd1}`,
      borderRadius:  L.cardRadius,
      padding:       '16px 20px',
      display:       'flex',
      flexDirection: 'column',
      gap:           6,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {sig.label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: color.t1, lineHeight: 1.1 }}>
        {sig.value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: dirCol }}>
          {arrow} {sig.yoy != null ? `${sig.yoy > 0 ? '+' : ''}${sig.yoy.toFixed(1)}% YoY` : 'Current'}
        </span>
      </div>
      {sig.note && (
        <div style={{ fontFamily: SYS, fontSize: 11, color: color.t4, lineHeight: 1.4 }}>
          {sig.note}
        </div>
      )}
    </div>
  )
}

// ── Mini sparkline from values array ──────────────────────────────────────

function Spark({ vals, stroke }: { vals: number[]; stroke: string }) {
  const W = '100%', H = 80
  if (vals.length < 2) return <div style={{ height: H }} />
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1
  const n   = vals.length
  const pts = vals.map((v, i) =>
    `${(i / (n - 1)) * 100}%,${H - ((v - min) / range) * (H - 8) - 4}`
  ).join(' ')
  return (
    <svg width={W} height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// ── Trend chart section ────────────────────────────────────────────────────

function TrendSection({ sectorId, trendLabel }: { sectorId: SectorId; trendLabel: string }) {
  type Obs = { date: string; value: number }
  const [primary, setPrimary] = useState<Obs[]>([])
  const [secondary, setSecondary] = useState<Obs[]>([])

  const seriesConfig: Record<SectorId, { primary: string; secondary?: string; primColor: string; secColor?: string }> = {
    residential:    { primary: 'HOUST',         secondary: 'PERMIT',         primColor: color.amber, secColor: color.blue  },
    commercial:     { primary: 'TTLCONS',        secondary: undefined,        primColor: color.blue                         },
    infrastructure: { primary: 'CES2000000001',  secondary: undefined,        primColor: color.green                        },
    industrial:     { primary: 'PERMIT',          secondary: undefined,        primColor: color.purple                       },
  }

  const cfg = seriesConfig[sectorId]

  useEffect(() => {
    fetch(`/api/obs?series=${cfg.primary}&n=24`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.obs) setPrimary(d.obs) })
      .catch(() => null)
    if (cfg.secondary) {
      fetch(`/api/obs?series=${cfg.secondary}&n=24`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.obs) setSecondary(d.obs) })
        .catch(() => null)
    }
  }, [sectorId, cfg.primary, cfg.secondary])

  const primVals = primary.map(o => o.value)
  const secVals  = secondary.map(o => o.value)
  const labels   = primary.map(o => new Date(o.date + 'T12:00:00').toLocaleString('default', { month: 'short', year: '2-digit' }))

  return (
    <Card>
      <SectionLabel>02 — 12-Month Trend</SectionLabel>
      <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: color.t2, marginBottom: 16 }}>
        {trendLabel}
      </div>

      <div style={{ position: 'relative' }}>
        {primVals.length > 0 ? (
          <Spark vals={primVals} stroke={cfg.primColor} />
        ) : (
          <div style={{ height: 80, background: color.bg2, borderRadius: 6, animation: 'shimmer 1.5s infinite' }} />
        )}
        {secVals.length > 0 && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            <Spark vals={secVals} stroke={cfg.secColor ?? color.t3} />
          </div>
        )}
      </div>

      {/* X-axis labels — first, mid, last */}
      {labels.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {[labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]].map((l, i) => (
            <span key={i} style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{l}</span>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 2, background: cfg.primColor, borderRadius: 1 }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{cfg.primary}</span>
        </div>
        {cfg.secondary && secVals.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 2, background: cfg.secColor ?? color.t3, borderRadius: 1 }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{cfg.secondary}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

const VALID: SectorId[] = ['residential', 'commercial', 'infrastructure', 'industrial']

export default function SectorDetailPage() {
  const params   = useParams()
  const sectorId = (params?.sector as string ?? '').toLowerCase() as SectorId

  const [data,    setData]    = useState<SectorResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    if (!VALID.includes(sectorId)) { setError(true); setLoading(false); return }
    fetch(`/api/sector/${sectorId}`)
      .then(r => r.ok ? r.json() as Promise<SectorResponse> : Promise.reject())
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [sectorId])

  const meta     = SECTOR_META[sectorId]
  const verdCol  = verdictColor(data?.verdict)
  const Section4 = meta?.sectionFour

  if (!VALID.includes(sectorId)) {
    return (
      <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1, fontFamily: SYS }}>
        <Nav />
        <div style={{ maxWidth: 600, margin: '120px auto', padding: '0 32px', textAlign: 'center' }}>
          <p style={{ fontFamily: SYS, fontSize: 18, color: color.t3 }}>
            Unknown sector. <Link href="/sectors" style={{ color: color.blue }}>View all sectors →</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1, fontFamily: SYS,
                  paddingBottom: 'env(safe-area-inset-bottom,24px)' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .sec-kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        @media (max-width: 900px)  { .sec-kpi-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px)  { .sec-kpi-grid { grid-template-columns: 1fr; } }
        .sec-detail-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; }
        @media (max-width: 900px) { .sec-detail-grid { grid-template-columns: 1fr; } }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <Link href="/sectors" style={{ fontFamily: MONO, fontSize: 11, color: color.blue, letterSpacing: '0.04em' }}>
            ← All Sectors
          </Link>
        </div>

        {/* ── HEADER ── */}
        <div style={{
          borderBottom:  `1px solid ${color.bd1}`,
          paddingBottom: 32,
          marginBottom:  32,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 40, lineHeight: 1 }}>{meta?.icon}</span>
            <div>
              <div style={{
                fontFamily:    MONO,
                fontSize:      10,
                color:         color.t4,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom:  8,
              }}>
                Sector Intelligence
              </div>
              <h1 style={{
                fontFamily:    SYS,
                fontSize:      36,
                fontWeight:    700,
                letterSpacing: '-0.03em',
                color:         color.t1,
                lineHeight:    1.1,
                marginBottom:  12,
              }}>
                {meta?.label ?? sectorId} Construction
              </h1>
              {loading ? (
                <div style={{ height: 28, width: 140, borderRadius: 14, background: color.bg2, animation: 'shimmer 1.5s infinite' }} />
              ) : (
                <VerdictBadge verdict={data?.verdict} />
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ height: 16, width: '70%', borderRadius: 4, background: color.bg2, animation: 'shimmer 1.5s infinite', marginTop: 8 }} />
          ) : (
            <p style={{
              fontFamily: SYS,
              fontSize:   15,
              color:      color.t2,
              lineHeight: 1.6,
              marginTop:  12,
              maxWidth:   680,
              borderLeft: data ? `3px solid ${verdCol}` : 'none',
              paddingLeft: data ? 14 : 0,
            }}>
              {data?.headline ?? (error ? 'Unable to load sector data.' : 'Loading…')}
            </p>
          )}
        </div>

        {/* ── SECTION 1: KPI cards ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.1em',
                        textTransform: 'uppercase', marginBottom: 16 }}>
            01 — Key Signals
          </div>
          {loading ? (
            <div className="sec-kpi-grid">
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  height: 120, borderRadius: L.cardRadius,
                  background: color.bg1, border: `1px solid ${color.bd1}`,
                  animation: 'shimmer 1.5s infinite', opacity: 1 - i * 0.12,
                }} />
              ))}
            </div>
          ) : (
            <div className="sec-kpi-grid">
              {(data?.primary_signals ?? []).map(sig => (
                <SignalKpiCard key={sig.id} sig={sig} />
              ))}
            </div>
          )}
        </div>

        {/* ── SECTION 2: Trend chart ── */}
        <div style={{ marginBottom: 32 }}>
          <TrendSection sectorId={sectorId} trendLabel={meta?.trendLabel ?? 'Trend'} />
        </div>

        {/* ── SECTION 3: Driver analysis ── */}
        <div style={{ marginBottom: 32 }}>
          <Card>
            <SectionLabel>03 — What&apos;s Driving This</SectionLabel>
            <DriverPanel seriesId={meta?.primarySeries ?? 'TTLCONS'} />
          </Card>
        </div>

        {/* ── SECTION 4: Sector-specific insights ── */}
        <div style={{ marginBottom: 32 }}>
          <Card>
            <SectionLabel>04 — Sector Intelligence</SectionLabel>
            {data && Section4 ? (
              <Section4 data={data} />
            ) : loading ? (
              <div style={{ height: 80, background: color.bg2, borderRadius: 6, animation: 'shimmer 1.5s infinite' }} />
            ) : null}
          </Card>
        </div>

        {/* Source + nav */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            12,
        }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: '0.06em' }}>
            Data as of {data?.as_of ?? '—'} · Sources: FRED, Census, BLS, USASpending.gov
          </div>
          <Link href="/sectors" style={{
            fontFamily: MONO, fontSize: 11, color: color.blue, letterSpacing: '0.04em',
          }}>
            ← Back to all sectors
          </Link>
        </div>
      </div>
    </div>
  )
}
