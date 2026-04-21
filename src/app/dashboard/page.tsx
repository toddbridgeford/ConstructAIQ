"use client"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { font, color, sentColor, fmtB, fmtK } from "@/lib/theme"

// ── Section 1 + 2
import { CSHIGauge }       from "./components/CSHIGauge"
import { CSHIHistory }     from "./components/CSHIHistory"
import { KPICard }         from "./components/KPICard"
import { ForecastBanner }  from "./components/ForecastBanner"
import { ModelAccuracy }   from "./components/ModelAccuracy"
import { ConfidenceRing }  from "./components/ConfidenceRing"
import { RecessionGauge }  from "./components/RecessionGauge"
import { CycleClock }      from "./components/CycleClock"
// ── Section 3
import { StateDrillDown }  from "./components/StateDrillDown"
import { TopStatesChart }  from "./components/TopStatesChart"
// ── Section 4
import { CommoditySignalCard } from "./components/CommoditySignalCard"
import { ProcurementIndex }    from "./components/ProcurementIndex"
import { MaterialsHeatmap }    from "./components/MaterialsHeatmap"
import { MaterialsCorrelation } from "./components/MaterialsCorrelation"
// ── Section 5
import { PipelineTimeline }   from "./components/PipelineTimeline"
import { CascadeAlerts }      from "./components/CascadeAlerts"
import { PredictiveOverlay }  from "./components/PredictiveOverlay"
import { CycleComparison }    from "./components/CycleComparison"
// ── Section 6
import { FederalPrograms }    from "./components/FederalPrograms"
import { AgencyVelocity }     from "./components/AgencyVelocity"
import { FederalLeaderboard } from "./components/FederalLeaderboard"
import { FederalStateTable }  from "./components/FederalStateTable"
// ── Section 7
import { SectorChart }    from "./components/SectorChart"
import { EarningsCards }  from "./components/EarningsCards"
import { SectorRotation } from "./components/SectorRotation"
import { ETFMonitor }     from "./components/ETFMonitor"
// ── Section 8
import { AnomalyFeed }        from "./components/AnomalyFeed"
import { DivergenceDetector } from "./components/DivergenceDetector"
import { WeeklyBrief }        from "./components/WeeklyBrief"
// ── Shared
import { GateLock }      from "./components/GateLock"
import { SectionHeader } from "./components/SectionHeader"
import { ErrorBoundary } from "./components/ErrorBoundary"

// StateMap must be client-only (react-simple-maps uses browser APIs)
const StateMap = dynamic(
  () => import("./components/StateMap").then(m => ({ default: m.StateMap })),
  { ssr: false, loading: () => <div style={{ height: 380, display:"flex", alignItems:"center", justifyContent:"center", color: color.t4, fontFamily: font.mono, fontSize: 12 }}>Loading map…</div> }
)

const SYS  = font.sys
const MONO = font.mono
const AMBER = color.amber, GREEN = color.green, RED = color.red, BLUE = color.blue
const BG0 = color.bg0, BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3
const BD1 = color.bd1, BD2 = color.bd2
const T1 = color.t1, T2 = color.t2, T3 = color.t3, T4 = color.t4

// ── Types ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const NAV_SECTIONS = [
  { id: "command",   label: "Command Center" },
  { id: "forecast",  label: "Forecast" },
  { id: "map",       label: "Map" },
  { id: "materials", label: "Materials" },
  { id: "pipeline",  label: "Pipeline" },
  { id: "federal",   label: "Federal" },
  { id: "equities",  label: "Equities" },
  { id: "signals",   label: "Signals" },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

// Deterministic sparklines from real observations.
// FRED obs have {date, value} sorted asc by date after .sort(); BLS obs have {year, period, value}.
function fredSpark(obs: AnyData[] | undefined, n = 12, fallback = 0): number[] {
  const vals = (obs ?? [])
    .slice()
    .sort((a: AnyData, b: AnyData) => (a.date as string).localeCompare(b.date as string))
    .slice(-n)
    .map((o: AnyData) => parseFloat(o.value))
    .filter((v: number) => !isNaN(v))
  if (vals.length === 0) return Array(n).fill(fallback)
  while (vals.length < n) vals.unshift(vals[0])
  return vals
}
function blsSpark(data: AnyData[] | undefined, n = 12, fallback = 0): number[] {
  const vals = (data ?? [])
    .slice()
    .sort((a: AnyData, b: AnyData) => `${a.year}${a.period}`.localeCompare(`${b.year}${b.period}`))
    .slice(-n)
    .map((o: AnyData) => parseFloat(o.value))
    .filter((v: number) => !isNaN(v))
  if (vals.length === 0) return Array(n).fill(fallback)
  while (vals.length < n) vals.unshift(vals[0])
  return vals
}

// ── CARD: section wrapper ──────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: BG1, borderRadius: 20, border: `1px solid ${BD1}`, padding: "24px 28px", ...style }}>
      {children}
    </div>
  )
}

// ── SECTION SHELL ──────────────────────────────────────────────────────────
function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ paddingTop: 48, paddingBottom: 8 }}>
      {children}
    </section>
  )
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [now, setNow] = useState("")
  // Section 1 + 2
  const [cshi,    setCshi]    = useState<AnyData>(null)
  const [spend,   setSpend]   = useState<AnyData>(null)
  const [employ,  setEmploy]  = useState<AnyData>(null)
  const [fore,    setFore]    = useState<AnyData>(null)
  // Section 3
  const [mapD,    setMapD]    = useState<AnyData>(null)
  const [selState, setSelState] = useState<string | null>(null)
  const [mapToggle, setMapToggle] = useState<"permits" | "employment">("permits")
  // Section 4
  const [prices,  setPrices]  = useState<AnyData>(null)
  const [rates,   setRates]   = useState<AnyData>(null)
  // Section 5
  const [pipeline, setPipeline] = useState<AnyData>(null)
  // Section 6
  const [federal, setFederal] = useState<AnyData>(null)
  // Section 7
  const [equities, setEquities] = useState<AnyData>(null)
  const [sectorRange, setSectorRange] = useState<"3M"|"6M"|"1Y"|"3Y">("1Y")
  // Section 8
  const [signals, setSignals]  = useState<AnyData>(null)
  const [brief,   setBrief]    = useState<AnyData>(null)
  const [fredD,   setFredD]    = useState<AnyData>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString("en-US",{hour12:false})), 1000)
    setNow(new Date().toLocaleTimeString("en-US",{hour12:false}))
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    async function load() {
      async function safe(url: string) {
        try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
      }
      const [cshiD, spendD, employD, foreD, mapData, pricesD, ratesD, pipeD, fedD, eqD, sigsD, briefD, fredData] =
        await Promise.all([
          safe("/api/cshi"),
          safe("/api/census"),
          safe("/api/bls"),
          safe("/api/forecast?series=TTLCONS"),
          safe("/api/map"),
          safe("/api/pricewatch"),
          safe("/api/rates"),
          safe("/api/pipeline"),
          safe("/api/federal"),
          safe("/api/equities"),
          safe("/api/signals"),
          safe("/api/weekly-brief"),
          safe("/api/fred"),
        ])
      if (cshiD)    setCshi(cshiD)
      if (spendD)   setSpend(spendD)
      if (employD)  setEmploy(employD)
      if (foreD)    setFore(foreD)
      if (mapData)  setMapD(mapData)
      if (pricesD)  setPrices(pricesD)
      if (ratesD)   setRates(ratesD)
      if (pipeD)    setPipeline(pipeD)
      if (fedD)     setFederal(fedD)
      if (eqD)      setEquities(eqD)
      if (sigsD)    setSignals(sigsD)
      if (briefD)   setBrief(briefD)
      if (fredData) setFredD(fredData)
    }
    load()
  }, [])

  // Derived values
  const cshiScore        = cshi?.score        ?? 72.4
  const cshiClass        = cshi?.classification ?? "EXPANDING"
  const cshiChange       = cshi?.weeklyChange  ?? 1.3
  const cshiSubScores    = cshi?.subScores     ?? {}
  const cshiHistory      = cshi?.history       ?? []

  const spendVal  = spend?.value  ?? spend?.latest?.value  ?? 2190
  const spendMom  = spend?.mom    ?? spend?.latest?.mom    ?? 0.3
  const empVal    = employ?.value ?? employ?.latest?.value ?? 8330
  const empMom    = employ?.mom   ?? employ?.latest?.mom   ?? 0.31

  const commodities = prices?.commodities ?? []
  const states      = mapD?.states        ?? []
  const sigList     = signals?.signals    ?? []

  const foreAccuracy = fore?.metrics?.accuracy ?? 87.3
  const foreMAPE     = fore?.metrics?.mape     ?? 4.2

  // Commodity → procurement index (average of inverted sell signals)
  const procurementValue = commodities.length > 0
    ? Math.round(commodities.reduce((sum: number, c: AnyData) => sum + (c.signal === "BUY" ? 72 : c.signal === "SELL" ? 32 : 54), 0) / commodities.length)
    : 61

  const rate30 = rates?.mortgage30 ?? rates?.data?.MORTGAGE30US?.value ?? 6.85

  // Sparklines from real observations — flat-line fallback when no data, never random
  const spendSpark  = fredSpark(spend?.observations, 12, spendVal / 1000)
  const permitSpark = fredSpark(fredD?.series?.PERMIT?.observations, 12, 1482)
  const houstSpark  = fredSpark(fredD?.series?.HOUST?.observations, 12, 1394)
  const empSpark    = blsSpark(employ?.data?.Results?.series?.[0]?.data, 12, empVal / 1000)

  // Heatmap: real latest value + real MoM from pricewatch — never random
  const heatmapData = commodities.slice(0,6).map((c: AnyData) => ({
    commodity: c.name,
    months: Array.from({length:12},(_,i) => ({
      month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
      value: c.value,
      pctChange: c.mom || 0,
    })),
  }))

  // corrSpend: real TTLCONS observations (census API, 24 months chronological)
  const corrSpend: {date: string; value: number}[] = spend?.observations
    ? spend.observations
        .slice()
        .sort((a: AnyData, b: AnyData) => (a.date as string).localeCompare(b.date as string))
        .slice(-24)
        .map((o: AnyData, i: number) => ({
          date: (o.date as string) || `2024-${String(i % 12 + 1).padStart(2, "0")}-01`,
          value: parseFloat(o.value) || 2100 + i * 4,
        }))
    : Array.from({length:24}, (_,i) => ({
        date: `2024-${String(i % 12 + 1).padStart(2, "0")}-01`,
        value: 2100 + i * 4,
      }))

  // corrMaterials: WPS081 not in current routes — deterministic static fallback
  const corrMaterials: {date: string; value: number}[] =
    Array.from({length:24}, (_,i) => ({
      date: `2024-${String(i % 12 + 1).padStart(2, "0")}-01`,
      value: 280 + i * 2,
    }))

  return (
    <div style={{ minHeight:"100vh", background:BG0, color:T1, fontFamily:SYS }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        button{cursor:pointer;font-family:inherit}
        a{color:inherit;text-decoration:none}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>
      <ErrorBoundary>

      {/* ── STICKY NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position:"sticky", top:0, zIndex:200,
        background:BG1+"f0", backdropFilter:"blur(16px)",
        borderBottom:`1px solid ${BD1}`,
        padding:"0 24px", height:56, display:"flex", alignItems:"center",
        justifyContent:"space-between", gap:8,
        paddingTop:"env(safe-area-inset-top,0px)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
          <Link href="/"><Image src="/ConstructAIQWhiteLogo.svg" width={110} height={22} alt="ConstructAIQ" style={{height:22,width:"auto"}} /></Link>
          <div style={{ width:1, height:20, background:BD2 }} />
          <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
            {NAV_SECTIONS.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                style={{ background:"transparent", border:"none", fontFamily:SYS, fontSize:13, color:T3, padding:"4px 8px", borderRadius:6 }}
                onMouseEnter={e=>(e.currentTarget.style.color=T1)}
                onMouseLeave={e=>(e.currentTarget.style.color=T3)}
              >{s.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <Link href="/globe" style={{ fontFamily:MONO, fontSize:11, color:AMBER, border:`1px solid ${AMBER}44`, padding:"4px 10px", borderRadius:7 }}>◉ GLOBE</Link>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:GREEN, boxShadow:`0 0 6px ${GREEN}`, animation:"pulse 2s infinite" }} />
            <span style={{ fontFamily:MONO, fontSize:11, color:GREEN }}>LIVE</span>
          </div>
          <span style={{ fontFamily:MONO, fontSize:11, color:T4 }}>{now}</span>
          <div style={{ fontFamily:MONO, fontSize:12, color:AMBER }}>{fmtB(spendVal)}</div>
          <div style={{ fontFamily:MONO, fontSize:12, color:GREEN }}>{fmtK(empVal)}M</div>
          <div style={{ fontFamily:MONO, fontSize:12, color:rate30>7?RED:T3 }}>{Number(rate30).toFixed(2)}% 30yr</div>
        </div>
      </nav>

      {/* ── LIVE TICKER ──────────────────────────────────────────────── */}
      <div style={{ background:BG2, borderBottom:`1px solid ${BD1}`, height:32, overflow:"hidden", display:"flex", alignItems:"center" }}>
        <div style={{ fontFamily:MONO, fontSize:10, color:AMBER, padding:"0 12px", borderRight:`1px solid ${BD2}`, whiteSpace:"nowrap", height:"100%", display:"flex", alignItems:"center", flexShrink:0 }}>LIVE</div>
        <div style={{ overflow:"hidden", flex:1 }}>
          <div style={{ display:"inline-flex", animation:"ticker 60s linear infinite", whiteSpace:"nowrap", alignItems:"center" }}>
            {(sigList.length > 0 ? [...sigList,...sigList] : [
              {type:"BULLISH",title:"CSHI 72.4 — Sector Expanding"},
              {type:"WARNING",title:"Spend/Permit Divergence Detected"},
              {type:"BULLISH",title:"IIJA $584B Deployed — Highway Pace Accelerating"},
              {type:"BEARISH",title:"Copper -3.2% — Monitor Input Costs"},
            ]).map((s: AnyData, i: number) => (
              <span key={i} style={{ fontFamily:SYS, fontSize:13, color:sentColor(s.type), padding:"0 20px", borderRight:`1px solid ${BD2}` }}>{s.title}</span>
            ))}
          </div>
        </div>
        <div style={{ fontFamily:MONO, fontSize:10, color:T4, padding:"0 12px", flexShrink:0 }}>
          CSHI <span style={{ color:cshiScore>=70?GREEN:cshiScore>=50?AMBER:RED }}>{cshiScore.toFixed(1)}</span>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 24px 80px" }}>

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — SECTOR COMMAND CENTER
        ══════════════════════════════════════════════════════════ */}
        <Section id="command">
          <SectionHeader sectionId="01" title="Sector Command Center" subtitle="The pulse of the entire US construction sector" live />

          {/* CSHI Gauge + History */}
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
            <Card style={{ flex:"0 0 auto", minWidth:300 }}>
              <CSHIGauge score={cshiScore} weeklyChange={cshiChange} classification={cshiClass} subScores={cshiSubScores} />
            </Card>
            <Card style={{ flex:1, minWidth:320 }}>
              <CSHIHistory data={cshiHistory} />
            </Card>
          </div>

          {/* KPI Cards Row */}
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:20 }}>
            <KPICard label="Total Construction Spend" value={fmtB(spendVal)}   mom={spendMom} yoy={3.4}  sparkData={spendSpark}  color={AMBER} icon="🏗️" />
            <KPICard label="Permit Volume (units)"    value="1,482K/yr"        mom={2.8}      yoy={-4.2} sparkData={permitSpark} color={BLUE}  icon="📋" />
            <KPICard label="Permit Value ($)"          value="$48.2B"          mom={3.1}      yoy={1.8}  sparkData={houstSpark}  color={BLUE}  icon="💰" />
            <KPICard label="Construction Employment"   value={`${fmtK(empVal)}M`} mom={empMom} yoy={2.1} sparkData={empSpark}    color={GREEN} icon="👷" />
            <KPICard label="Materials Cost Index"      value="318.4"           mom={1.2}      yoy={6.8}  sparkData={Array(12).fill(318)}                    color={RED}   icon="💹" />
            <KPICard label="Active AI Signals"         value={String(sigList.length || 6)} mom={0} sparkData={Array(12).fill(sigList.length || 6)} color={T2} icon="📡" />
          </div>

          {/* Forecast Banner */}
          <Card>
            <ForecastBanner foreData={fore} spendHistory={corrSpend.slice(0,24)} />
          </Card>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — FORECAST INTELLIGENCE
        ══════════════════════════════════════════════════════════ */}
        <Section id="forecast">
          <SectionHeader sectionId="02" title="Forecast Intelligence Panel" subtitle="Model accuracy, confidence, and cycle positioning" />

          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
            <Card style={{ flex:"2 1 360px" }}>
              <ModelAccuracy accuracy={foreAccuracy} mape={foreMAPE} />
            </Card>
            <Card style={{ flex:"1 1 200px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:24 }}>
              <ConfidenceRing value={91} label="Model Agreement" />
              <RecessionGauge probability={18} />
            </Card>
            <Card style={{ flex:"1 1 220px" }}>
              <CycleClock position={45} history={[30,34,38,42,43,45]} />
            </Card>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3 — GEOGRAPHIC INTELLIGENCE
        ══════════════════════════════════════════════════════════ */}
        <Section id="map">
          <SectionHeader sectionId="03" title="Geographic Intelligence" subtitle="50-state construction activity, capital flows, and regional momentum" />

          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
            <Card style={{ flex:"2 1 480px" }}>
              <div style={{ fontFamily:MONO, fontSize:11, color:T4, letterSpacing:"0.1em", marginBottom:14 }}>50-STATE CONSTRUCTION ACTIVITY</div>
              <StateMap states={states} onStateClick={setSelState} selectedState={selState} />
            </Card>
            {selState && (
              <div style={{ flex:"0 0 360px" }}>
                <StateDrillDown stateCode={selState} states={states} onClose={() => setSelState(null)} />
              </div>
            )}
          </div>

          <GateLock locked={false} requiredPlan="Starter" featureName="State Drill-Down">
            <Card>
              <TopStatesChart states={states} toggle={mapToggle} onToggleChange={setMapToggle} />
            </Card>
          </GateLock>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4 — MATERIALS INTELLIGENCE
        ══════════════════════════════════════════════════════════ */}
        <Section id="materials">
          <SectionHeader sectionId="04" title="Materials Intelligence" subtitle="BUY/SELL/HOLD signals for lumber, steel, concrete, copper, WTI, and diesel" />

          {/* Commodity Signal Cards */}
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:20 }}>
            {(commodities.length > 0 ? commodities : [
              { name:"Lumber",   icon:"🌲", value:421.8, unit:"PPI", signal:"BUY",  mom7d:-1.2, mom30d:-3.7, mom90d:-8.4, sparkData:Array(12).fill(421.8) },
              { name:"Steel",    icon:"🔩", value:318.4, unit:"PPI", signal:"SELL", mom7d:2.8,  mom30d:4.1,  mom90d:8.4,  sparkData:Array(12).fill(318.4) },
              { name:"Concrete", icon:"🧱", value:284.6, unit:"PPI", signal:"HOLD", mom7d:0.4,  mom30d:1.2,  mom90d:4.8,  sparkData:Array(12).fill(284.6) },
              { name:"Copper",   icon:"🔶", value:9842,  unit:"$/t", signal:"SELL", mom7d:4.5,  mom30d:7.2,  mom90d:12.4, sparkData:Array(12).fill(9842)  },
              { name:"WTI Crude",icon:"🛢️", value:74.8,  unit:"$/bbl",signal:"HOLD",mom7d:-1.8,mom30d:-3.2, mom90d:-6.4, sparkData:Array(12).fill(74.8)  },
              { name:"Diesel",   icon:"⛽", value:3.84,  unit:"$/gal",signal:"HOLD",mom7d:-0.6,mom30d:-1.4, mom90d:2.8,  sparkData:Array(12).fill(3.84)  },
            ]).slice(0,6).map((c: AnyData, i: number) => (
              <div key={i} style={{ flex:"1 1 160px", minWidth:150 }}>
                <CommoditySignalCard
                  name={c.name} icon={c.icon||"📦"} value={c.value} unit={c.unit||"PPI"}
                  signal={c.signal||"HOLD"} mom7d={c.mom7d||c.mom||0} mom30d={c.mom30d||0} mom90d={c.mom90d||c.yoy||0}
                  sparkData={c.sparkData || Array(12).fill(c.value)}
                />
              </div>
            ))}
          </div>

          {/* Procurement Index */}
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
            <Card style={{ flex:"0 0 auto", minWidth:280 }}>
              <ProcurementIndex value={procurementValue} />
            </Card>
            <GateLock locked={false} requiredPlan="Starter" featureName="Materials Heatmap">
              <Card style={{ flex:"2 1 400px" }}>
                <MaterialsHeatmap data={heatmapData} />
              </Card>
            </GateLock>
          </div>

          <GateLock locked={false} requiredPlan="Starter" featureName="Materials Correlation Chart">
            <Card>
              <MaterialsCorrelation materialsCostData={corrMaterials} constructionSpendData={corrSpend} />
            </Card>
          </GateLock>
        </Section>


        {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — LEAD / LAG PIPELINE
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="pipeline">
          <SectionHeader
            sectionId="05"
            title="Lead / Lag Pipeline"
            badge="PREDICTIVE"
            live
            onExportCSV={() => {}}
          />

          {/* Pipeline stages */}
          <Card style={{ marginBottom:20 }}>
            <PipelineTimeline
              stages={pipeline?.stages ?? [
                { id:"permits",    label:"BUILDING PERMITS",    value:"1,482", unit:"K/mo", mom:2.1,  trend:"UP",   trendColor:GREEN, lagToNext:6 },
                { id:"starts",     label:"HOUSING STARTS",      value:"1,394", unit:"K/mo", mom:1.4,  trend:"UP",   trendColor:GREEN, lagToNext:4 },
                { id:"employment", label:"CONSTRUCTION EMPLOY", value:"8,330", unit:"K",    mom:0.3,  trend:"UP",   trendColor:GREEN, lagToNext:8 },
                { id:"spending",   label:"CONSTR. SPENDING",    value:"$2.19", unit:"T",    mom:0.31, trend:"UP",   trendColor:GREEN, lagToNext:12 },
                { id:"gdp",        label:"GDP CONTRIBUTION",    value:"4.8",   unit:"%",    mom:-0.1, trend:"FLAT", trendColor:AMBER, lagToNext:null },
              ]}
              onStageClick={(id) => {}}
              activeStage={null}
            />
          </Card>

          {/* Cascade alerts + predictive overlay */}
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
            <div style={{ flex:"1 1 300px", minWidth:280 }}>
              <CascadeAlerts
                alerts={pipeline?.alerts ?? [
                  { id:"a1", severity:"WATCH",  title:"Permit-to-Start Gap Widening", description:"Permits outpacing starts by 6.2% — labor capacity constraint signal", timestamp:"2h ago" },
                  { id:"a2", severity:"INFO",   title:"Employment Momentum Positive", description:"3-month employment trend: +0.9% — above 5yr average of +0.4%", timestamp:"4h ago" },
                  { id:"a3", severity:"ANOMALY",title:"Lumber Futures Spike +8.4%", description:"Price breakout above 2σ band — cost pressure building", timestamp:"1d ago" },
                ]}
              />
            </div>
            <GateLock locked={false} requiredPlan="Starter" featureName="Predictive Overlay">
              <Card style={{ flex:"2 1 400px", height:"100%" }}>
                <PredictiveOverlay />
              </Card>
            </GateLock>
          </div>

          {/* Historical cycle comparison */}
          <GateLock locked={false} requiredPlan="Starter" featureName="Historical Cycle Comparison">
            <Card>
              <CycleComparison
                current={pipeline?.cycleComparison?.current}
                cycle2008={pipeline?.cycleComparison?.cycle2008}
                cycle2016={pipeline?.cycleComparison?.cycle2016}
                cycle2020={pipeline?.cycleComparison?.cycle2020}
                currentMonth={pipeline?.cycleComparison?.currentMonth ?? 14}
                description={pipeline?.cycleComparison?.description}
              />
            </Card>
          </GateLock>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6 — FEDERAL INFRASTRUCTURE TRACKER
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="federal">
          <SectionHeader
            sectionId="06"
            title="Federal Infrastructure Tracker"
            badge="IIJA · IRA"
            live
            onExportCSV={() => {}}
          />

          {/* Program execution bars */}
          <Card style={{ marginBottom:20 }}>
            <FederalPrograms programs={federal?.programs ?? []} />
          </Card>

          {/* Agency velocity + leaderboard */}
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
            <Card style={{ flex:"1 1 340px" }}>
              <AgencyVelocity agencies={federal?.agencies ?? []} />
            </Card>
            <GateLock locked={false} requiredPlan="Institutional" featureName="Contractor Leaderboard">
              <Card style={{ flex:"2 1 440px" }}>
                <FederalLeaderboard contractors={federal?.contractors ?? []} />
              </Card>
            </GateLock>
          </div>

          {/* 50-state allocation table */}
          <GateLock locked={false} requiredPlan="Institutional" featureName="State Allocation Table">
            <Card>
              <FederalStateTable stateAllocations={federal?.stateAllocations ?? []} />
            </Card>
          </GateLock>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 7 — MARKET SIGNALS & EQUITIES
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="equities">
          <SectionHeader
            sectionId="07"
            title="Market Signals & Equities"
            badge="EQUITIES"
            live
            onExportCSV={() => {}}
          />

          {/* Sector chart + ETF monitor */}
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
            <Card style={{ flex:"3 1 500px" }}>
              <SectorChart
                data={equities?.sectorHistory ?? []}
                timeRange={sectorRange}
                onTimeRangeChange={setSectorRange}
              />
            </Card>
            <Card style={{ flex:"1 1 260px" }}>
              <ETFMonitor etfs={equities?.etfs ?? []} />
            </Card>
          </div>

          {/* Earnings cards */}
          <GateLock locked={false} requiredPlan="Institutional" featureName="Earnings Signal Cards">
            <Card style={{ marginBottom:20 }}>
              <EarningsCards companies={equities?.companies ?? []} />
            </Card>
          </GateLock>

          {/* Sector rotation quadrant */}
          <GateLock locked={false} requiredPlan="Institutional" featureName="Sector Rotation Quadrant">
            <Card>
              <SectorRotation data={equities?.sectorRotation ?? []} />
            </Card>
          </GateLock>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 8 — SIGNAL INTELLIGENCE FEED
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="signals">
          <SectionHeader
            sectionId="08"
            title="Signal Intelligence Feed"
            badge="AI-POWERED"
            live
            onExportCSV={() => {}}
          />

          {/* Anomaly feed + divergence detector */}
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
            <div style={{ flex:"1 1 320px" }}>
              <AnomalyFeed alerts={signals?.anomalies ?? []} />
            </div>
            <GateLock locked={false} requiredPlan="Starter" featureName="Divergence Detector">
              <div style={{ flex:"1 1 320px" }}>
                <DivergenceDetector pairs={signals?.divergences ?? []} />
              </div>
            </GateLock>
          </div>

          {/* AI Weekly Brief */}
          <GateLock locked={false} requiredPlan="Starter" featureName="AI Weekly Intelligence Brief">
            <Card>
              <WeeklyBrief {...(brief ?? {})} />
            </Card>
          </GateLock>
        </Section>

      </div>{/* /main content */}

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{ borderTop:`1px solid ${BD1}`, padding:"32px 24px", display:"flex", flexWrap:"wrap", gap:24, justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <Image src="/ConstructAIQWhiteLogo.svg" width={110} height={22} alt="ConstructAIQ" style={{ height:22, width:"auto", marginBottom:8 }} />
          <div style={{ fontFamily:SYS, fontSize:13, color:T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        </div>
        <div style={{ fontFamily:SYS, fontSize:12, color:T4, textAlign:"right" }}>
          <div>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
          <div style={{ marginTop:4 }}>Updates: 06:00 ET daily · Signals refresh every 15 min</div>
          <div style={{ marginTop:8, display:"flex", gap:16, justifyContent:"flex-end" }}>
            <Link href="/pricing" style={{ color:AMBER }}>Pricing</Link>
            <Link href="/contact" style={{ color:T4 }}>Contact</Link>
            <Link href="/" style={{ color:T4 }}>Home</Link>
          </div>
        </div>
      </footer>

      </ErrorBoundary>
    </div>
  )
}
