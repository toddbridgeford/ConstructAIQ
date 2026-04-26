"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link  from "next/link"
import { signal as SIG } from "@/lib/theme"
import {
  safeFetch, fmtMillions, verdictFor, blsSeries,
  WHITE, BG, BD, T1, T3, BLUE, MONO, SYS,
  type Card, type PlatformStats, type VerdictData,
} from "./home/home-utils"
import { HomeVerdictBanner } from "./home/HomeVerdictBanner"
import { HomeNav }           from "./home/HomeNav"
import { HomeHero }          from "./home/HomeHero"
import { HomeRoles }         from "./home/HomeRoles"
import { HomeNewsletter }    from "./home/HomeNewsletter"
import { HomeStatusCards }   from "./home/HomeStatusCards"
import { HomeLiveStats }     from "./home/HomeLiveStats"
import { HomeTrust }         from "./home/HomeTrust"
import { HomeMapSection }    from "./home/HomeMapSection"
import type { MapState } from "./components/HomeMap"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

export default function HomePage() {
  const [census,  setCensus]  = useState<AnyData>(null)
  const [bls,     setBls]     = useState<AnyData>(null)
  const [federal, setFederal] = useState<AnyData>(null)
  const [mapData, setMapData] = useState<AnyData>(null)
  const [mapDate, setMapDate] = useState('')
  const [stats,   setStats]   = useState<PlatformStats | null>(null)
  const [verdict,        setVerdict]        = useState<VerdictData | null>(null)
  const [verdictLoading, setVerdictLoading] = useState(true)

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
      if (s) setStats(s as PlatformStats)
    })
    safeFetch('/api/verdict')
      .then(d => {
        setVerdict(d)
        setVerdictLoading(false)
      })
      .catch(() => setVerdictLoading(false))
    setMapDate(new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }))
  }, [])

  // ── Census spending ──
  const obs0      = parseFloat(census?.observations?.[0]?.value ?? '0')
  const obs1      = parseFloat(census?.observations?.[1]?.value ?? '0')
  const spendMom  = obs0 > 0 && obs1 > 0 ? ((obs0 - obs1) / obs1) * 100 : 0
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

  const empDisp = empK >= 1000 ? `${(empK / 1000).toFixed(1)}M` : empK > 0 ? `${empK.toFixed(0)}K` : '—'
  const laborV  = verdictFor(empMom,  'EXPANDING', 'CONTRACTING')
  const matsV   = verdictFor(-ppiMom, 'EXPANDING', 'CONTRACTING')

  const fedObl  = federal?.totalObligated ?? 0
  const fedDisp = fedObl > 0 ? fmtMillions(fedObl) : '—'

  const spendVal  = census ? obs0 : null
  const empVal    = bls    ? empK : null
  const mapStates = (mapData?.states ?? []) as MapState[]

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
    <div id="main-content" style={{ background: WHITE, color: T1, fontFamily: SYS, minHeight: '100vh' }}>
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

      <HomeVerdictBanner verdict={verdict} loading={verdictLoading} />
      <HomeNav />
      <HomeHero spendDisp={spendDisp} spendMom={spendMom} />

      <HomeRoles />

      <section style={{ background: BG, borderTop: `1px solid ${BD}`, padding: '48px 40px' }}>
        <HomeNewsletter />
      </section>

      <section style={{ background: BG, borderTop: `1px solid ${BD}`, padding: '64px 40px' }}>
        <HomeStatusCards cards={cards} />
      </section>

      <HomeLiveStats spendVal={spendVal} empVal={empVal} spendMom={spendMom} empMom={empMom} />

      <HomeTrust stats={stats} />

      <HomeMapSection mapStates={mapStates} mapDate={mapDate} />

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '80px 40px', textAlign: 'center', background: WHITE }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{
            fontSize: 18, fontFamily: SYS, fontWeight: 400,
            color: T3, lineHeight: 1.7, marginBottom: 32,
          }}>
            All data sourced from US government agencies.
            All forecasts documented. All of it free.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: BLUE, color: WHITE,
              fontSize: 16, fontWeight: 600,
              padding: '14px 32px', borderRadius: 12, minHeight: 52,
              textDecoration: 'none', letterSpacing: '-0.01em',
              boxShadow: '0 4px 20px rgba(10,132,255,0.28)',
            }}>
              Open Dashboard →
            </Link>
            <Link href="/methodology" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', color: T1,
              fontSize: 15, fontWeight: 500,
              padding: '13px 24px', borderRadius: 12, minHeight: 48,
              border: `1px solid ${BD}`,
              letterSpacing: '-0.01em', textDecoration: 'none',
            }}>
              Read Methodology →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${BD}`,
        padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        background: BG,
      }}>
        <Image
          src="/ConstructAIQBlackLogo.svg"
          width={100} height={18}
          alt="ConstructAIQ"
          style={{ height: 16, width: 'auto', display: 'block' }}
        />
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Dashboard',   href: '/dashboard'   },
            { label: 'Federal',     href: '/federal'     },
            { label: 'Methodology', href: '/methodology' },
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
