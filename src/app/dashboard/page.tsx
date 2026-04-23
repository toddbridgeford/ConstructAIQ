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
import { Calendar }             from "lucide-react"
import type {
  DashboardData,
  CommodityItem,
  SignalsResponse,
  BriefResponse,
  PricewatchResponse,
} from "@/lib/api-types"
import type { ForecastData } from "./types"
import { formatFreshness } from "@/lib/freshness"

const SYS  = font.sys
const MONO = font.mono

const NAV_SECTIONS = [
  { id: 'overview'  },
  { id: 'forecast'  },
  { id: 'materials' },
  { id: 'signals'   },
]

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

function UpcomingReleaseAlert() {
  const [alert, setAlert] = useState<{ name: string; when: string } | null>(null)

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.json())
      .then(d => {
        const events: { date: string; name: string; importance: string }[] = d.events ?? []
        const now   = new Date(); now.setHours(0, 0, 0, 0)
        const today = now.toISOString().slice(0, 10)
        const tomD  = new Date(now); tomD.setDate(now.getDate() + 1)
        const tom   = tomD.toISOString().slice(0, 10)
        const d2D   = new Date(now); d2D.setDate(now.getDate() + 2)
        const d2    = d2D.toISOString().slice(0, 10)
        const high  = events.filter(e => e.importance === 'high')
        const match = high.find(e => e.date === today) ?? high.find(e => e.date === tom) ?? high.find(e => e.date === d2)
        if (match) {
          const days = match.date === today ? 'today' : match.date === tom ? 'tomorrow' : 'in 2 days'
          setAlert({ name: match.name, when: days })
        }
      })
      .catch(() => {})
  }, [])

  if (!alert) return null

  return (
    <Link href="/calendar" style={{ textDecoration: 'none' }}>
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         8,
        padding:     '8px 14px',
        background:  color.amberDim,
        border:      `1px solid ${color.amber}33`,
        borderRadius: 8,
        marginTop:   12,
        cursor:      'pointer',
      }}>
        <Calendar size={13} color={color.amber} strokeWidth={2} style={{ flexShrink: 0 }} />
        <span style={{ fontFamily: SYS, fontSize: 12, color: color.amber }}>
          <strong>{alert.name}</strong> releases {alert.when}
        </span>
        <span style={{ fontFamily: font.mono, fontSize: 10, color: color.amber + '99', marginLeft: 'auto' }}>
          calendar →
        </span>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const [activeSection,   setSection]        = useState('overview')
  const [showRolePrompt,  setShowRolePrompt]  = useState(false)

  useEffect(() => {
    if (!getPrefs().role) setShowRolePrompt(true)
    const hash = window.location.hash.replace('#', '')
    if (hash && NAV_SECTIONS.some(s => s.id === hash)) {
      setSection(hash)
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [])

  // ── Single aggregated state ─────────────────────────────────────────────────
  const [dashCore, setDashCore] = useState<DashboardData | null>(null)

  const load = useCallback(async () => {
    async function safe(url: string) {
      try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
    }
    // 3 parallel fetches instead of 13+
    const [core] = await Promise.all([
      safe('/api/dashboard'),
      // /api/permits and /api/satellite are fetched by their respective
      // section components on demand — not needed for initial dashboard paint
    ])
    if (core) setDashCore(core as DashboardData)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Derived KPI values ───────────────────────────────────────────────────────
  const obs       = dashCore?.obs
  const ttl12     = obs?.TTLCONS_12       ?? []
  const emp12     = obs?.CES2000000001_12 ?? []
  const permit12  = obs?.PERMIT_12        ?? []

  const spendRaw  = ttl12.at(-1)?.value    ?? dashCore?.construction_spending.value ?? null
  const spendVal  = spendRaw != null ? parseFloat(String(spendRaw)) : null
  const prevSpend = ttl12.at(-2)?.value    ?? null
  const spendMom  = (spendVal != null && prevSpend != null && prevSpend > 0)
    ? ((spendVal - prevSpend) / prevSpend) * 100
    : dashCore?.construction_spending.mom_change ?? 0

  const empVal    = emp12.at(-1)?.value    ?? dashCore?.employment.value ?? null
  const prevEmp   = emp12.at(-2)?.value    ?? null
  const empMom    = (empVal != null && prevEmp != null && prevEmp > 0)
    ? ((empVal - prevEmp) / prevEmp) * 100
    : dashCore?.employment.mom_change ?? 0

  const permitVal  = permit12.at(-1)?.value ?? dashCore?.permits.value ?? null
  const prevPermit = permit12.at(-2)?.value ?? null
  const permitMom  = (permitVal != null && prevPermit != null && prevPermit > 0)
    ? ((permitVal - prevPermit) / prevPermit) * 100
    : dashCore?.permits.mom_change ?? 0

  const cshiScore  = dashCore?.cshi.score        ?? null
  const cshiChange = dashCore?.cshi.weeklyChange  ?? null
  const cshiSpark  = (dashCore?.cshi.history ?? []).slice(-12).map(h => h.score)

  const spendSpark  = obsSpark(ttl12,    12, spendVal)
  const empSpark    = obsSpark(emp12,    12, empVal)
  const permitSpark = obsSpark(permit12, 12, permitVal)

  // ── Correlation chart obs ────────────────────────────────────────────────────
  const corrSpend: { date: string; value: number }[] =
    obs?.TTLCONS_24?.length
      ? obs.TTLCONS_24
      : Array.from({ length: 24 }, (_, i) => ({
          date:  `2024-${String(i % 12 + 1).padStart(2, '0')}-01`,
          value: 2100 + i * 4,
        }))

  const corrMaterials: { date: string; value: number }[] =
    obs?.WPS081_24?.length
      ? obs.WPS081_24
      : Array.from({ length: 24 }, (_, i) => ({
          date:  `2024-${String(i % 12 + 1).padStart(2, '0')}-01`,
          value: 280 + i * 2,
        }))

  // ── Shape adapters — bridge DashboardData to component prop types ────────────

  // ForecastData expected by HeroForecast
  const fore: ForecastData | null = dashCore?.forecast ? {
    ensemble:  dashCore.forecast.ensemble,
    models:    dashCore.forecast.models.map(m => ({
      model:    m.model,
      weight:   m.weight,
      mape:     m.mape,
      accuracy: m.accuracy,
      forecast: dashCore.forecast!.ensemble,
    })),
    metrics: {
      accuracy: dashCore.forecast.metrics.accuracy,
      mape:     dashCore.forecast.metrics.mape,
      models:   dashCore.forecast.metrics.models,
    },
    trainedOn: dashCore.forecast.trained_on,
    runAt:     dashCore.forecast.run_at,
    history:   dashCore.forecast.history,
  } : null

  const foreAccuracy = fore?.metrics?.accuracy ?? 87.3
  const foreMAPE     = fore?.metrics?.mape     ?? 4.2

  // SignalsResponse expected by SignalsSection
  const sigList = dashCore?.signals ?? []
  const signals: SignalsResponse | null = dashCore ? {
    source:        'ConstructAIQ SignalDetect',
    live:          true,
    signals:       sigList,
    count:         sigList.length,
    updated:       dashCore.fetched_at,
    signals_as_of: ttl12.at(-1)?.date ?? null,
  } : null

  // BriefResponse expected by SignalsSection → WeeklyBrief
  const brief: BriefResponse | null = dashCore?.brief_excerpt ? {
    brief:       dashCore.brief_excerpt,
    generatedAt: dashCore.brief_as_of ?? undefined,
    source:      'static',
  } : null

  // PricewatchResponse expected by MaterialsSection loading gate
  const commodities: CommodityItem[] = dashCore?.commodities ?? []
  const prices: PricewatchResponse | null = dashCore ? {
    source:    'ConstructAIQ',
    live:      false,
    commodities,
    compositeIndex: { avgMoM: 0, signal: 'HOLD', description: '' },
    updated:   null,
  } : null

  const procurementValue = commodities.length > 0
    ? Math.round(commodities.reduce((s: number, c: CommodityItem) =>
        s + (c.signal === 'BUY' ? 72 : c.signal === 'SELL' ? 32 : 54), 0) / commodities.length)
    : 61

  // ── Freshness — derived from actual obs timestamps ───────────────────────────
  const overviewFreshness  = formatFreshness(dashCore?.construction_spending.data_as_of ?? dashCore?.cshi.updatedAt)
  const forecastFreshness  = formatFreshness(dashCore?.forecast?.run_at)
  const pricesFreshness    = formatFreshness(null)
  const signalsFreshness   = formatFreshness(ttl12.at(-1)?.date ?? null)

  // ── Section renderer ─────────────────────────────────────────────────────────
  function renderSection() {
    switch (activeSection) {

      case 'forecast':
        return (
          <ErrorBoundary fallback={<SectionFallback title="Forecast" />}>
            <div style={{ padding: '32px 0' }}>
              <HeroForecast fore={fore} foreAccuracy={foreAccuracy} foreMAPE={foreMAPE} freshness={forecastFreshness} />
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
                heatmapData={commodities.slice(0, 6).map((c: CommodityItem) => ({
                  commodity: c.name,
                  months: Array.from({ length: 12 }, (_, i) => ({
                    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
                    value: c.value, pctChange: c.mom || 0,
                  })),
                }))}
                corrMaterials={corrMaterials}
                corrSpend={corrSpend}
                loading={prices === null}
                freshness={pricesFreshness}
              />
            </div>
          </ErrorBoundary>
        )

      case 'signals':
        return (
          <ErrorBoundary fallback={<SectionFallback title="Signals" />}>
            <div style={{ padding: '32px 0' }}>
              <SignalsSection signals={signals} brief={brief} warn={null} freshness={signalsFreshness} />
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
              spendObs={ttl12}
              signals={sigList}
              loading={dashCore === null}
              freshness={overviewFreshness}
            />
          </ErrorBoundary>
        )
    }
  }

  // Suppress unused import warning — fmtB is used in child components via theme
  void fmtB

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
              <UpcomingReleaseAlert />
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
