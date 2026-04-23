"use client"
import { useState, useEffect, useCallback } from "react"
import { color, font, fmtB }   from "@/lib/theme"
import { obsSpark }             from "@/lib/sparkline"
import { getPrefs }             from "@/lib/preferences"
import { DashboardShell }       from "./DashboardShell"
import { OverviewSection }      from "./sections/OverviewSection"
import { HeroForecast }         from "./sections/HeroForecast"
import { MaterialsSection }     from "./sections/MaterialsSection"
import { SignalsSection }        from "./sections/SignalsSection"
import { ErrorBoundary }        from "./components/ErrorBoundary"
import { SectionFallback }      from "./components/SectionFallback"
import { RolePrompt }           from "@/app/components/RolePrompt"
import { VerdictBanner }        from "./components/VerdictBanner"
import Link                     from "next/link"

const SYS  = font.sys
const MONO = font.mono

function DashboardFooter() {
  return (
    <div style={{
      borderTop:   `1px solid ${color.bd1}`,
      marginTop:   48,
      paddingTop:  32,
      paddingBottom: 16,
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'space-between',
      flexWrap:    'wrap',
      gap:         16,
    }}>
      <div>
        <div style={{
          fontFamily:    MONO,
          fontSize:      10,
          color:         color.amber,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom:  6,
        }}>
          The Signal — Free Weekly
        </div>
        <p style={{ fontFamily: SYS, fontSize: 13, color: color.t3, margin: 0, lineHeight: 1.5 }}>
          Verdict, key numbers, and the week&apos;s top signal — every Monday morning.
        </p>
      </div>
      <Link href="/subscribe" style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            8,
        background:     color.amberDim,
        border:         `1px solid ${color.amber}44`,
        borderRadius:   10,
        padding:        '10px 18px',
        fontSize:       13,
        fontWeight:     600,
        color:          color.amber,
        textDecoration: 'none',
        fontFamily:     SYS,
        whiteSpace:     'nowrap',
      }}>
        Subscribe to The Signal
      </Link>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

export default function Dashboard() {
  const [activeSection,   setSection]        = useState('overview')
  const [showRolePrompt,  setShowRolePrompt]  = useState(false)

  useEffect(() => {
    if (!getPrefs().role) setShowRolePrompt(true)
  }, [])

  // ── Data state ──────────────────────────────────────────────────────────
  const [cshi,     setCshi]     = useState<AnyData>(null)
  const [spend,    setSpend]    = useState<AnyData>(null)
  const [employ,   setEmploy]   = useState<AnyData>(null)
  const [fore,     setFore]     = useState<AnyData>(null)
  const [prices,   setPrices]   = useState<AnyData>(null)
  const [signals,  setSignals]  = useState<AnyData>(null)
  const [brief,    setBrief]    = useState<AnyData>(null)
  const [warn,     setWarn]     = useState<AnyData>(null)
  const [obsMap,   setObsMap]   = useState<Record<string, { date: string; value: number }[]>>({})

  const load = useCallback(async () => {
    async function safe(url: string) {
      try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
    }
    const [
      cshiD, spendD, employD, foreD, pricesD, sigsD, briefD, warnD,
      ttl12, ces12, permit12, ttl24, wps24,
    ] = await Promise.all([
      safe("/api/cshi"),
      safe("/api/census"),
      safe("/api/bls"),
      safe("/api/forecast?series=TTLCONS"),
      safe("/api/pricewatch"),
      safe("/api/signals"),
      safe("/api/weekly-brief"),
      safe("/api/warn"),
      safe("/api/obs?series=TTLCONS&n=12"),
      safe("/api/obs?series=CES2000000001&n=12"),
      safe("/api/obs?series=PERMIT&n=12"),
      safe("/api/obs?series=TTLCONS&n=24"),
      safe("/api/obs?series=WPS081&n=24"),
    ])

    if (cshiD)   setCshi(cshiD)
    if (spendD)  setSpend(spendD)
    if (employD) setEmploy(employD)
    if (foreD)   setFore(foreD)
    if (pricesD) setPrices(pricesD)
    if (sigsD)   setSignals(sigsD)
    if (briefD)  setBrief(briefD)
    if (warnD)   setWarn(warnD)

    setObsMap({
      TTLCONS_12:       ttl12?.obs    ?? [],
      CES2000000001_12: ces12?.obs    ?? [],
      PERMIT_12:        permit12?.obs ?? [],
      TTLCONS_24:       ttl24?.obs    ?? [],
      WPS081_24:        wps24?.obs    ?? [],
    })
  }, [])

  useEffect(() => { load() }, [load])

  // ── Derived values ───────────────────────────────────────────────────────
  const spendVal  = parseFloat(String(obsMap["TTLCONS_12"]?.slice(-1)[0]?.value ?? spend?.latest?.value ?? 2190))
  const prevSpend = parseFloat(String(obsMap["TTLCONS_12"]?.slice(-2, -1)[0]?.value ?? spendVal))
  const spendMom  = prevSpend > 0 ? ((spendVal - prevSpend) / prevSpend) * 100 : 0

  const empVal    = spend?.value ?? employ?.value ?? employ?.latest?.value ?? 8330
  const empMom    = employ?.mom  ?? employ?.latest?.mom ?? 0.31

  const permitObs  = obsMap["PERMIT_12"] ?? []
  const permitVal  = permitObs.slice(-1)[0]?.value  ?? 1482
  const permitPrev = permitObs.slice(-2, -1)[0]?.value ?? permitVal
  const permitMom  = permitPrev > 0 ? ((permitVal - permitPrev) / permitPrev) * 100 : 0

  const cshiScore  = cshi?.score        ?? 72.4
  const cshiChange = cshi?.weeklyChange ?? 1.3
  const cshiSpark  = (cshi?.history ?? []).slice(-12).map((h: { score: number }) => h.score)

  const spendSpark  = obsSpark(obsMap["TTLCONS_12"],       12, spendVal)
  const empSpark    = obsSpark(obsMap["CES2000000001_12"], 12, empVal)
  const permitSpark = obsSpark(obsMap["PERMIT_12"],        12, permitVal)

  const sigList     = signals?.signals    ?? []
  const commodities = prices?.commodities ?? []

  const corrSpend: { date: string; value: number }[] =
    obsMap["TTLCONS_24"]?.length
      ? obsMap["TTLCONS_24"]
      : Array.from({ length: 24 }, (_, i) => ({ date: `2024-${String(i % 12 + 1).padStart(2, "0")}-01`, value: 2100 + i * 4 }))

  const corrMaterials: { date: string; value: number }[] =
    obsMap["WPS081_24"]?.length
      ? obsMap["WPS081_24"]
      : Array.from({ length: 24 }, (_, i) => ({ date: `2024-${String(i % 12 + 1).padStart(2, "0")}-01`, value: 280 + i * 2 }))

  const foreAccuracy  = fore?.metrics?.accuracy ?? 87.3
  const foreMAPE      = fore?.metrics?.mape     ?? 4.2
  const procurementValue = commodities.length > 0
    ? Math.round(commodities.reduce((s: number, c: AnyData) =>
        s + (c.signal === "BUY" ? 72 : c.signal === "SELL" ? 32 : 54), 0) / commodities.length)
    : 61

  // ── Section renderer ─────────────────────────────────────────────────────
  function renderSection() {
    switch (activeSection) {

      case 'forecast':
        return (
          <ErrorBoundary fallback={<SectionFallback title="Forecast" />}>
            <div style={{ padding: '32px 0' }}>
              <HeroForecast fore={fore} foreAccuracy={foreAccuracy} foreMAPE={foreMAPE} />
            </div>
          </ErrorBoundary>
        )

      case 'materials':
        return (
          <ErrorBoundary fallback={<SectionFallback title="Materials Intelligence" />}>
            <div style={{ padding: '32px 0' }}>
              <MaterialsSection
                commodities={commodities}
                procurementValue={procurementValue}
                heatmapData={commodities.slice(0, 6).map((c: AnyData) => ({
                  commodity: c.name,
                  months: Array.from({ length: 12 }, (_, i) => ({
                    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
                    value: c.value, pctChange: c.mom || 0,
                  })),
                }))}
                corrMaterials={corrMaterials}
                corrSpend={corrSpend}
                loading={prices === null}
              />
            </div>
          </ErrorBoundary>
        )

      case 'signals':
        return (
          <ErrorBoundary fallback={<SectionFallback title="Signals" />}>
            <div style={{ padding: '32px 0' }}>
              <SignalsSection signals={signals} brief={brief} warn={warn} />
            </div>
          </ErrorBoundary>
        )

      default:
        return (
          <ErrorBoundary fallback={<SectionFallback title="Overview" />}>
            <OverviewSection
              spendVal={spendVal}   spendMom={spendMom}   spendSpark={spendSpark}
              empVal={empVal}       empMom={empMom}        empSpark={empSpark}
              permitVal={permitVal} permitMom={permitMom}  permitSpark={permitSpark}
              cshiScore={cshiScore} cshiChange={cshiChange} cshiSpark={cshiSpark}
              spendObs={obsMap["TTLCONS_12"] ?? []}
              signals={sigList}
              loading={spend === null && employ === null}
            />
          </ErrorBoundary>
        )
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: color.bg0, color: color.t1, fontFamily: SYS }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        a { color: inherit; text-decoration: none; }
        button { cursor: pointer; font-family: inherit; }
      `}</style>

      <ErrorBoundary fallback={<div style={{ color: color.t1, padding: 40, fontFamily: SYS }}>Dashboard unavailable.</div>}>
        <DashboardShell activeSection={activeSection} onNavigate={setSection}>
          <div style={{ padding: '0 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ paddingTop: 24 }}>
              <VerdictBanner />
            </div>
            {renderSection()}
            <DashboardFooter />
          </div>
        </DashboardShell>
      </ErrorBoundary>

      {showRolePrompt && (
        <RolePrompt onSelect={() => setShowRolePrompt(false)} />
      )}
    </div>
  )
}
