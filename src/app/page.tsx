"use client"
import { useState, useEffect, Fragment } from "react"
import Image                             from "next/image"
import Link                              from "next/link"
import dynamic                           from "next/dynamic"
import { color, font, type as TS, signal as SIG, layout as L } from "@/lib/theme"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStats = any

const HomeMap = dynamic(
  () => import("./components/HomeMap").then(m => m.HomeMap),
  { ssr: false, loading: () => <MapPlaceholder /> },
)

const SYS  = font.sys
const MONO = font.mono

// Light-mode palette from existing theme tokens
const WHITE = color.t1       // #fff
const BG    = color.lightBg  // #f8f8f8
const BD    = color.lightBd  // #e5e5e5
const T1    = color.bg1      // #0d0d0d  — primary text on white
const T3    = color.t4       // #6e6e73  — muted text

async function safeFetch(url: string) {
  try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
}

function fmtMillions(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}T`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}B`
  return `$${v.toFixed(0)}M`
}

function trendColor(v: number): string {
  return v > 0.05 ? SIG.expand : v < -0.05 ? SIG.contract : SIG.watch
}

function verdictFor(mom: number, posLabel: string, negLabel: string): { label: string; col: string } {
  if (mom >  0.15) return { label: posLabel, col: SIG.expand   }
  if (mom < -0.15) return { label: negLabel, col: SIG.contract }
  return              { label: 'WATCH',    col: SIG.watch    }
}

function blsSeries(raw: Record<string, unknown> | null, id: string) {
  const series = (raw as { data?: { Results?: { series?: Array<{ seriesID: string; data: Array<{ value: string }> }> } } } | null)
    ?.data?.Results?.series ?? []
  return series.find(s => s.seriesID === id)
}

function MapPlaceholder() {
  return (
    <div style={{
      width: '100%', height: 380,
      background: color.lightBgSkel,
      animation: 'shimmer 1.5s infinite',
      backgroundImage: `linear-gradient(90deg, ${color.lightBgSkel} 25%, ${color.lightBgSub} 50%, ${color.lightBgSkel} 75%)`,
      backgroundSize: '200% 100%',
    }} />
  )
}

interface Card {
  label:   string
  verdict: string | null
  col:     string
  metric:  string
  sub:     string
}

function StatusCard({ label, verdict, col, metric, sub }: Card) {
  return (
    <div style={{
      background:      WHITE,
      borderRadius:    L.cardRadius,
      border:          `1px solid ${BD}`,
      borderLeft:      `3px solid ${col}`,
      padding:         L.cardPad,
      boxShadow:       '0 2px 8px rgba(0,0,0,0.06)',
      display:         'flex',
      flexDirection:   'column',
      gap:             10,
    }}>
      <div style={{ ...TS.label, color: T3 }}>{label}</div>
      {verdict && (
        <span style={{
          alignSelf:     'flex-start',
          background:    `${col}18`,
          border:        `1px solid ${col}40`,
          borderRadius:  6,
          padding:       '3px 10px',
          fontSize:      11,
          fontFamily:    MONO,
          fontWeight:    600,
          color:         col,
          letterSpacing: '0.08em',
        }}>
          {verdict}
        </span>
      )}
      <div style={{ fontSize: 36, fontFamily: MONO, fontWeight: 700, color: T1, lineHeight: 1.1 }}>
        {metric}
      </div>
      <div style={{ fontSize: 13, fontFamily: MONO, color: T3 }}>{sub}</div>
    </div>
  )
}

function NewsletterSignup() {
  const [email,  setEmail]  = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    try {
      const res = await fetch("/api/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, source: "homepage", plan: "newsletter" }),
      })
      setStatus(res.ok ? "success" : "error")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      <div style={{
        fontFamily:    MONO,
        fontSize:      10,
        color:         color.amber,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        marginBottom:  12,
      }}>
        The Signal — Free Weekly
      </div>
      <h2 style={{
        fontSize:      22,
        fontWeight:    700,
        letterSpacing: "-0.02em",
        color:         T1,
        margin:        "0 0 8px",
      }}>
        Construction market intelligence, every Monday.
      </h2>
      <p style={{ fontSize: 14, color: T3, margin: "0 0 24px", lineHeight: 1.6 }}>
        Verdict, key numbers, and the week&apos;s top signal — delivered free.
      </p>

      {status === "success" ? (
        <p style={{
          fontSize:   14,
          fontFamily: MONO,
          color:      color.green,
          fontWeight: 600,
        }}>
          You&apos;re on the list. First issue next Monday.
        </p>
      ) : (
        <form onSubmit={submit} style={{
          display:        "flex",
          gap:            8,
          justifyContent: "center",
          flexWrap:       "wrap",
        }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{
              background:   color.bg0,
              border:       `1px solid ${BD}`,
              borderRadius: 10,
              padding:      "11px 16px",
              fontSize:     14,
              color:        T1,
              fontFamily:   SYS,
              outline:      "none",
              width:        240,
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              background:   color.amber,
              color:        "#000",
              border:       "none",
              borderRadius: 10,
              padding:      "11px 20px",
              fontSize:     14,
              fontWeight:   600,
              cursor:       status === "loading" ? "wait" : "pointer",
              fontFamily:   SYS,
            }}
          >
            {status === "loading" ? "..." : "Subscribe free"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p style={{ fontSize: 12, color: color.red, marginTop: 8 }}>
          Something went wrong. <Link href="/subscribe" style={{ color: color.blue }}>Try here</Link>.
        </p>
      )}
    </div>
  )
}

export default function HomePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [census,  setCensus]  = useState<AnyStats>(null)
  const [bls,     setBls]     = useState<AnyStats>(null)
  const [federal, setFederal] = useState<AnyStats>(null)
  const [mapData, setMapData] = useState<AnyStats>(null)
  const [mapDate, setMapDate] = useState('')
  const [stats,   setStats]   = useState<AnyStats>(null)

  useEffect(() => {
    Promise.all([
      safeFetch('/api/census'),
      safeFetch('/api/bls'),
      safeFetch('/api/federal'),
      safeFetch('/api/map'),
      safeFetch('/api/platform-stats'),
    ]).then(([c, b, f, m, s]) => {
      if (c) setCensus(c)
      if (b) setBls(b)
      if (f) setFederal(f)
      if (m) setMapData(m)
      if (s) setStats(s)
    })
    setMapDate(new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }))
  }, [])

  // ── Census spending ──
  const obs0     = parseFloat(census?.observations?.[0]?.value ?? '0')
  const obs1     = parseFloat(census?.observations?.[1]?.value ?? '0')
  const spendMom = obs0 > 0 && obs1 > 0 ? ((obs0 - obs1) / obs1) * 100 : 0
  const spendDisp = census ? fmtMillions(obs0) : null

  // ── BLS series ──
  const empSer  = blsSeries(bls, 'CES2000000001')
  const ppiSer  = blsSeries(bls, 'PCU2362--2362--')
  const empK    = parseFloat(empSer?.data?.[0]?.value ?? '0')
  const empPrev = parseFloat(empSer?.data?.[1]?.value ?? '0')
  const empMom  = empPrev > 0 ? ((empK - empPrev) / empPrev) * 100 : 0
  const ppiV    = parseFloat(ppiSer?.data?.[0]?.value ?? '0')
  const ppiPrev = parseFloat(ppiSer?.data?.[1]?.value ?? '0')
  const ppiMom  = ppiPrev > 0 ? ((ppiV - ppiPrev) / ppiPrev) * 100 : 0

  const empDisp  = empK >= 1000 ? `${(empK / 1000).toFixed(1)}M` : empK > 0 ? `${empK.toFixed(0)}K` : '—'
  const laborV   = verdictFor(empMom, 'EXPANDING', 'CONTRACTING')
  const matsV    = verdictFor(-ppiMom, 'EXPANDING', 'CONTRACTING')

  // ── Federal pipeline ──
  const fedObl  = federal?.totalObligated ?? 0
  const fedDisp = fedObl > 0 ? fmtMillions(fedObl) : '—'

  // ── Map states ──
  const mapStates = mapData?.states ?? []

  const cards: Card[] = [
    {
      label:   'LABOR MARKET',
      verdict: bls ? laborV.label : null,
      col:     bls ? laborV.col   : BD,
      metric:  bls ? empDisp      : '—',
      sub:     bls ? `${empMom >= 0 ? '+' : ''}${empMom.toFixed(2)}% MoM · Construction employment` : 'Loading…',
    },
    {
      label:   'MATERIAL COSTS',
      verdict: bls ? matsV.label : null,
      col:     bls ? matsV.col   : BD,
      metric:  bls ? `${ppiV.toFixed(1)}` : '—',
      sub:     bls ? `${ppiMom >= 0 ? '+' : ''}${ppiMom.toFixed(2)}% MoM · PPI construction` : 'Loading…',
    },
    {
      label:   'ACTIVE PIPELINE',
      verdict: federal ? 'ACTIVE' : null,
      col:     federal ? SIG.federal : BD,
      metric:  federal ? fedDisp : '—',
      sub:     federal ? 'Federal construction obligations (IIJA + IRA)' : 'Loading…',
    },
  ]

  return (
    <div style={{ background: WHITE, color: T1, fontFamily: SYS, minHeight: '100vh' }}>
      <style>{`
        .hp-cards  { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .hp-trust  { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .hp-proof  { display: flex; align-items: center; justify-content: center; gap: 40px; }
        .hp-proof-div { width: 1px; height: 20px; background: ${BD}; }
        @media (max-width: 768px) {
          .hp-cards { grid-template-columns: 1fr; gap: 12px; }
          .hp-trust { grid-template-columns: 1fr; gap: 16px; }
          .hp-proof { gap: 20px; }
          .hp-kpi   { font-size: 64px !important; }
        }
        @media (max-width: 480px) {
          .hp-h1  { font-size: 32px !important; }
          .hp-kpi { font-size: 52px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position:       'sticky', top: 0, zIndex: 100,
        background:     'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom:   `1px solid ${BD}`,
        padding:        '0 40px',
        display:        'flex', alignItems: 'center', justifyContent: 'space-between',
        height:         60,
      }}>
        <Link href="/">
          <Image src="/ConstructAIQBlackLogo.svg" width={124} height={22} alt="ConstructAIQ"
                 style={{ height: 20, width: 'auto', display: 'block' }} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/methodology"
                style={{ fontSize: 14, fontWeight: 500, color: T3, textDecoration: 'none' }}>
            Methodology
          </Link>
          <Link href="/dashboard" style={{
            display:        'inline-flex', alignItems: 'center', justifyContent: 'center',
            background:     color.blue, color: WHITE,
            fontSize:       14, fontWeight: 600,
            padding:        '8px 20px', borderRadius: 10, minHeight: 44,
            textDecoration: 'none', letterSpacing: '-0.01em',
          }}>
            Open Dashboard
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight:     'calc(100vh - 60px)',
        display:       'flex', alignItems: 'center', justifyContent: 'center',
        padding:       '80px 40px',
        background:    WHITE,
      }}>
        <div style={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
          <div style={{ ...TS.label, color: T3, marginBottom: 24 }}>CONSTRUCTAIQ</div>

          <h1 className="hp-h1" style={{
            fontSize:      'clamp(36px,5vw,52px)',
            fontFamily:    SYS, fontWeight: 700,
            lineHeight:    1.15, letterSpacing: '-0.03em',
            color:         T1, marginBottom: 16,
          }}>
            The US construction economy,<br />in real time.
          </h1>

          <p style={{
            fontSize: 18, fontFamily: SYS, fontWeight: 400,
            color:    T3, lineHeight: 1.65,
            maxWidth: 460, margin: '0 auto 56px',
          }}>
            Free intelligence for contractors, lenders, and suppliers.
            Updated daily.
          </p>

          {/* ── Spending KPI ── */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ ...TS.label, color: T3, marginBottom: 12 }}>
              Total US Construction Spending
            </div>

            {spendDisp ? (
              <>
                <div className="hp-kpi" style={{
                  fontSize:   'clamp(64px,10vw,96px)',
                  fontFamily: MONO, fontWeight: 700,
                  color:      T1, lineHeight: 1, marginBottom: 12,
                }}>
                  {spendDisp}
                </div>
                <div style={{
                  display:    'inline-flex', alignItems: 'center', gap: 6,
                  fontSize:   15, fontFamily: MONO,
                  color:      trendColor(spendMom),
                  fontWeight: 600,
                }}>
                  <span>{spendMom >= 0 ? '↑' : '↓'}</span>
                  <span>{spendMom >= 0 ? '+' : ''}{spendMom.toFixed(2)}% MoM</span>
                </div>
              </>
            ) : (
              <div style={{
                height: 88, width: 220, margin: '0 auto 12px',
                borderRadius: 8, background: color.lightBgSkel,
                backgroundImage: `linear-gradient(90deg,${color.lightBgSkel} 25%,${color.lightBgSub} 50%,${color.lightBgSkel} 75%)`,
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }} />
            )}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Link href="/dashboard" style={{
              display:        'inline-flex', alignItems: 'center', justifyContent: 'center',
              background:     color.blue, color: WHITE,
              fontSize:       16, fontWeight: 600,
              padding:        '14px 32px', borderRadius: 12, minHeight: 52,
              textDecoration: 'none', letterSpacing: '-0.01em',
              boxShadow:      '0 4px 20px rgba(10,132,255,0.28)',
            }}>
              Open the Dashboard →
            </Link>
            <Link href="/methodology" style={{
              fontSize: 14, color: T3, fontFamily: SYS,
              textDecoration: 'underline', textDecorationColor: BD,
            }}>
              See methodology
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section style={{ background: BG, borderTop: `1px solid ${BD}`, padding: '48px 40px' }}>
        <NewsletterSignup />
      </section>

      {/* ── STATUS CARDS ── */}
      <section style={{ background: BG, borderTop: `1px solid ${BD}`, padding: '64px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="hp-cards">{cards.map(c => <StatusCard key={c.label} {...c} />)}</div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ── */}
      <section style={{ background: BG, borderTop: `1px solid ${BD}`, padding: '64px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ ...TS.label, color: T3, textAlign: 'center', marginBottom: 36 }}>
            BUILT ON TRUSTED SOURCES
          </div>

          <div className="hp-trust">
            {/* Column 1 — Data Provenance */}
            <div style={{
              background: WHITE, border: `1px solid ${BD}`,
              borderRadius: 14, padding: '28px 24px',
            }}>
              <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 14 }}>
                DATA PROVENANCE
              </div>
              <div style={{ fontSize: 14, fontFamily: SYS, color: T1, fontWeight: 600, lineHeight: 1.7, marginBottom: 12 }}>
                Census Bureau · BLS · FRED · BEA
                <br />EIA · USASpending.gov · ESA Copernicus
              </div>
              <div style={{ fontSize: 13, fontFamily: SYS, color: T3, lineHeight: 1.6, marginBottom: 16 }}>
                38+ official U.S. government and recognized industry sources. No scraped, unverified, or synthetic data.
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: `${color.green}12`, border: `1px solid ${color.green}40`,
                borderRadius: 7, padding: '5px 12px',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.green, display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontFamily: MONO, color: color.green }}>
                  {stats ? `${stats.observations_label}+ observations indexed` : '38+ data sources'}
                </span>
              </div>
            </div>

            {/* Column 2 — Methodology */}
            <div style={{
              background: WHITE, border: `1px solid ${BD}`,
              borderRadius: 14, padding: '28px 24px',
            }}>
              <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 14 }}>
                METHODOLOGY
              </div>
              <div style={{ fontSize: 14, fontFamily: SYS, color: T1, fontWeight: 600, lineHeight: 1.7, marginBottom: 12 }}>
                Open methodology.
                <br />Every calculation documented.
                <br />Every source cited.
              </div>
              <div style={{ fontSize: 13, fontFamily: SYS, color: T3, lineHeight: 1.6, marginBottom: 16 }}>
                3-model ensemble: Holt-Winters + SARIMA + XGBoost. Accuracy-weighted. Published confidence intervals.
              </div>
              <Link href="/methodology" style={{
                fontSize: 13, fontFamily: SYS, fontWeight: 500,
                color: color.blue, textDecoration: 'none',
              }}>
                Read methodology →
              </Link>
            </div>

            {/* Column 3 — Free Forever */}
            <div style={{
              background: WHITE, border: `1px solid ${BD}`,
              borderRadius: 14, padding: '28px 24px',
            }}>
              <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 14 }}>
                FREE FOREVER
              </div>
              <div style={{ fontSize: 14, fontFamily: SYS, color: T1, fontWeight: 600, lineHeight: 1.7, marginBottom: 12 }}>
                No subscription.
                <br />No credit card.
                <br />No data sold. Open API.
              </div>
              <div style={{ fontSize: 13, fontFamily: SYS, color: T3, lineHeight: 1.6, marginBottom: 16 }}>
                Dashboard: free forever. API: 1,000 req/day free, 10,000/day for .edu researchers.
              </div>
              <Link href="/api-access" style={{
                fontSize: 13, fontFamily: SYS, fontWeight: 500,
                color: color.blue, textDecoration: 'none',
              }}>
                Get API access →
              </Link>
            </div>
          </div>

          {/* Live stats bar */}
          <div style={{
            marginTop: 28, borderTop: `1px solid ${BD}`, paddingTop: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 32, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Cities tracked',       value: stats ? String(stats.cities_tracked)  : '40'  },
              { label: 'Satellite MSAs',        value: stats ? String(stats.msas_tracked)    : '20'  },
              { label: 'Gov. data sources',     value: stats ? `${stats.data_sources}+`      : '38+' },
              { label: 'Observations indexed',  value: stats?.observations_label ? `${stats.observations_label}+` : '—' },
            ].map(({ label, value }, i) => (
              <Fragment key={label}>
                {i > 0 && <div style={{ width: 1, height: 18, background: BD }} />}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontFamily: MONO, fontWeight: 700, color: T1 }}>{value}</div>
                  <div style={{ fontSize: 12, fontFamily: SYS, color: T3, marginTop: 2 }}>{label}</div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE MAP ── */}
      <section style={{ background: WHITE, borderTop: `1px solid ${BD}` }}>
        <HomeMap states={mapStates} />
        <div style={{
          textAlign: 'center', padding: '14px 40px 20px',
          ...TS.caption, color: T3,
        }}>
          Hot markets as of {mapDate || '—'}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '80px 40px', textAlign: 'center', background: WHITE }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{
            fontSize: 18, fontFamily: SYS, fontWeight: 400,
            color:    T3, lineHeight: 1.7, marginBottom: 32,
          }}>
            Used by contractors, lenders, and suppliers across the US.
            Start with the dashboard.
          </p>
          <Link href="/dashboard" style={{
            display:        'inline-flex', alignItems: 'center', justifyContent: 'center',
            background:     color.blue, color: WHITE,
            fontSize:       16, fontWeight: 600,
            padding:        '14px 32px', borderRadius: 12, minHeight: 52,
            textDecoration: 'none', letterSpacing: '-0.01em',
            boxShadow:      '0 4px 20px rgba(10,132,255,0.28)',
          }}>
            Open Dashboard →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${BD}`,
        padding:   '24px 40px',
        display:   'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap:  'wrap', gap: 12,
        background: BG,
      }}>
        <Image src="/ConstructAIQBlackLogo.svg" width={100} height={18} alt="ConstructAIQ"
               style={{ height: 16, width: 'auto', display: 'block' }} />
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Dashboard',   href: '/dashboard'   },
            { label: 'Federal',     href: '/federal'     },
            { label: 'Methodology', href: '/methodology' },
            { label: 'API Access',  href: '/api-access'  },
            { label: 'About',       href: '/about'       },
          ].map(({ label, href }) => (
            <Link key={href} href={href}
                  style={{ fontSize: 13, color: T3, textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
        </div>
        <span style={{ fontSize: 12, color: T3, fontFamily: MONO }}>© 2026 ConstructAIQ</span>
      </footer>
    </div>
  )
}
