"use client"
import Image from "next/image"
import Link  from "next/link"
import { useState, useEffect } from "react"
import { font, color, fmtB } from "@/lib/theme"
import { obsSpark } from "@/lib/sparkline"
import { ErrorBoundary }    from "./components/ErrorBoundary"
import { SectionFallback }  from "./components/SectionFallback"
import { KpiRow }           from "./sections/KpiRow"
import { HeroForecast }     from "./sections/HeroForecast"
import { CommandSection }   from "./sections/CommandSection"
import { GeographicSection }from "./sections/GeographicSection"
import { MaterialsSection } from "./sections/MaterialsSection"
import { PipelineSection }  from "./sections/PipelineSection"
import { FederalSection }   from "./sections/FederalSection"
import { EquitiesSection }  from "./sections/EquitiesSection"
import { SignalsSection }   from "./sections/SignalsSection"

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
import { SignalsSection } from "./sections/SignalsSection"
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

const SYS = font.sys, MONO = font.mono
const BG0=color.bg0,BG1=color.bg1,BD1=color.bd1,BD2=color.bd2,T1=color.t1,T3=color.t3,T4=color.t4,GREEN=color.green,AMBER=color.amber

const NAV_SECTIONS = [
  {id:"forecast",label:"Forecast"},{id:"command",label:"Command"},{id:"map",label:"Map"},{id:"materials",label:"Materials"},
  {id:"pipeline",label:"Pipeline"},{id:"federal",label:"Federal"},{id:"equities",label:"Equities"},{id:"signals",label:"Signals"},
]
function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({behavior:"smooth"}) }

export default function Dashboard() {
  const [cshi,     setCshi]     = useState<AnyData>(null)
  const [spend,    setSpend]    = useState<AnyData>(null)
  const [employ,   setEmploy]   = useState<AnyData>(null)
  const [fore,     setFore]     = useState<AnyData>(null)
  const [mapD,     setMapD]     = useState<AnyData>(null)
  const [selState, setSelState] = useState<string|null>(null)
  const [mapToggle,setMapToggle]= useState<"permits"|"employment">("permits")
  const [prices,   setPrices]   = useState<AnyData>(null)
  const [pipeline, setPipeline] = useState<AnyData>(null)
  const [federal,  setFederal]  = useState<AnyData>(null)
  const [equities, setEquities] = useState<AnyData>(null)
  const [sectorRange, setSectorRange] = useState<"3M"|"6M"|"1Y"|"3Y">("1Y")
  const [signals,  setSignals]  = useState<AnyData>(null)
  const [brief,    setBrief]    = useState<AnyData>(null)
  const [obsMap,   setObsMap]   = useState<Record<string,{date:string;value:number}[]>>({})

  useEffect(() => {
    async function load() {
      async function safe(url: string) { try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null } }
      const [cshiD,spendD,employD,foreD,mapData,pricesD,pipeD,fedD,eqD,sigsD,briefD,
             ttl12,ces12,houst12,permit12,ttl24,wps24] =
        await Promise.all([
          safe("/api/cshi"),safe("/api/census"),safe("/api/bls"),safe("/api/forecast?series=TTLCONS"),
          safe("/api/map"),safe("/api/pricewatch"),safe("/api/pipeline"),safe("/api/federal"),
          safe("/api/equities"),safe("/api/signals"),safe("/api/weekly-brief"),
          safe("/api/obs?series=TTLCONS&n=12"),safe("/api/obs?series=CES2000000001&n=12"),
          safe("/api/obs?series=HOUST&n=12"),safe("/api/obs?series=PERMIT&n=12"),
          safe("/api/obs?series=TTLCONS&n=24"),safe("/api/obs?series=WPS081&n=24"),
        ])
      if (cshiD)   setCshi(cshiD);   if (spendD)  setSpend(spendD);   if (employD) setEmploy(employD)
      if (foreD)   setFore(foreD);   if (mapData) setMapD(mapData);   if (pricesD) setPrices(pricesD)
      if (pipeD)   setPipeline(pipeD); if (fedD)  setFederal(fedD);   if (eqD)     setEquities(eqD)
      if (sigsD)   setSignals(sigsD);  if (briefD) setBrief(briefD)
      setObsMap({
        TTLCONS_12:       ttl12?.obs    ?? [],
        CES2000000001_12: ces12?.obs    ?? [],
        HOUST_12:         houst12?.obs  ?? [],
        PERMIT_12:        permit12?.obs ?? [],
        TTLCONS_24:       ttl24?.obs    ?? [],
        WPS081_24:        wps24?.obs    ?? [],
      })
    }
    load()
  }, [])

  // Derived scalar values
  const spendVal  = spend?.value  ?? spend?.latest?.value  ?? 2190
  const spendMom  = spend?.mom    ?? spend?.latest?.mom    ?? 0.3
  const empVal    = employ?.value ?? employ?.latest?.value ?? 8330
  const empMom    = employ?.mom   ?? employ?.latest?.mom   ?? 0.31
  const commodities  = prices?.commodities ?? []
  const states       = mapD?.states        ?? []
  const sigList      = signals?.signals    ?? []
  const foreAccuracy = fore?.metrics?.accuracy ?? 87.3
  const foreMAPE     = fore?.metrics?.mape     ?? 4.2
  const procurementValue = commodities.length > 0 ? Math.round(commodities.reduce((sum: number, c: AnyData) => sum + (c.signal==="BUY"?72:c.signal==="SELL"?32:54), 0) / commodities.length) : 61

  const spendSpark  = obsSpark(obsMap['TTLCONS_12'],       12, spendVal)
  const empSpark    = obsSpark(obsMap['CES2000000001_12'], 12, empVal)
  const houstSpark  = obsSpark(obsMap['HOUST_12'],         12, 1394)
  const permitSpark = obsSpark(obsMap['PERMIT_12'],        12, 1482)
  const heatmapData = commodities.slice(0,6).map((c: AnyData) => ({
    commodity: c.name, months: Array.from({length:12},(_,i)=>({month:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],value:c.value,pctChange:c.mom||0})),
  }))
  const corrSpend: {date:string;value:number}[] = obsMap['TTLCONS_24']?.length ? obsMap['TTLCONS_24'] : Array.from({length:24},(_,i)=>({date:`2024-${String(i%12+1).padStart(2,"0")}-01`,value:2100+i*4}))
  const corrMaterials: {date:string;value:number}[] = obsMap['WPS081_24']?.length ? obsMap['WPS081_24'] : Array.from({length:24},(_,i)=>({date:`2024-${String(i%12+1).padStart(2,"0")}-01`,value:280+i*2}))
  const briefHeadline = typeof brief?.brief === "string" ? brief.brief.split("\n\n")[0].replace(/^HEADLINE SIGNAL:\s*/i, "").trim() : null

  return (
    <div style={{ minHeight:"100vh", background:BG0, color:T1, fontFamily:SYS }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:#333;border-radius:2px}button{cursor:pointer;font-family:inherit}a{color:inherit;text-decoration:none}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <ErrorBoundary>

      <nav style={{ position:"sticky",top:0,zIndex:200,background:BG1+"f0",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BD1}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,paddingTop:"env(safe-area-inset-top,0px)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:14,flexShrink:0 }}>
          <Link href="/"><Image src="/ConstructAIQWhiteLogo.svg" width={110} height={22} alt="ConstructAIQ" style={{height:22,width:"auto"}} /></Link>
          <div style={{ width:1,height:20,background:BD2 }} />
          <div style={{ display:"flex",alignItems:"center",gap:4,flexWrap:"wrap" }}>
            {NAV_SECTIONS.map(s=>(
              <button key={s.id} onClick={()=>scrollTo(s.id)} style={{ background:"transparent",border:"none",fontFamily:SYS,fontSize:13,color:T3,padding:"4px 8px",borderRadius:6,minHeight:44,minWidth:44 }} onMouseEnter={e=>(e.currentTarget.style.color=T1)} onMouseLeave={e=>(e.currentTarget.style.color=T3)}>{s.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
          <div style={{ width:7,height:7,borderRadius:"50%",background:GREEN,boxShadow:`0 0 6px ${GREEN}`,animation:"pulse 2s infinite" }} />
          <span style={{ fontFamily:MONO,fontSize:11,color:GREEN }}>LIVE</span>
          <div style={{ fontFamily:MONO,fontSize:12,color:AMBER }}>{fmtB(spendVal)}</div>
        </div>
      </nav>

      <div style={{ maxWidth:1400,margin:"0 auto",padding:"0 24px 80px" }}>

        {/* 1 — KPI row */}
        <ErrorBoundary fallback={<SectionFallback title="KPI Row" />}>
          <section style={{ paddingTop:32 }}>
            <KpiRow spendVal={spendVal} spendMom={spendMom} spendSpark={spendSpark} empVal={empVal} empMom={empMom} empSpark={empSpark} permitSpark={permitSpark} houstSpark={houstSpark} sigCount={sigList.length} loading={spend===null && employ===null} />
          </section>
        </ErrorBoundary>

        {/* 2 — Forecast hero */}
        <ErrorBoundary fallback={<SectionFallback title="Forecast" />}>
          <HeroForecast fore={fore} foreAccuracy={foreAccuracy} foreMAPE={foreMAPE} />
        </ErrorBoundary>

        {/* 3 — Weekly brief excerpt */}
        {briefHeadline && (
          <section style={{ paddingTop:24, paddingBottom:8 }}>
            <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"20px 28px", display:"flex", gap:16, alignItems:"flex-start" }}>
              <div style={{ fontFamily:MONO, fontSize:10, color:AMBER, letterSpacing:"0.1em", whiteSpace:"nowrap", paddingTop:2 }}>BRIEF</div>
              <div style={{ fontFamily:SYS, fontSize:15, color:T1, lineHeight:1.65 }}>{briefHeadline}</div>
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

          <SignalsSection signals={signals} brief={brief} />
        </Section>

      </div>{/* /main content */}

      <footer style={{ borderTop:`1px solid ${BD1}`,padding:"32px 24px",display:"flex",flexWrap:"wrap",gap:24,justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <Image src="/ConstructAIQWhiteLogo.svg" width={110} height={22} alt="ConstructAIQ" style={{ height:22,width:"auto",marginBottom:8 }} />
          <div style={{ fontFamily:SYS,fontSize:13,color:T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        </div>
        <div style={{ fontFamily:SYS,fontSize:12,color:T4,textAlign:"right" }}>
          <div>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
          <div style={{ marginTop:4 }}>Updates: 06:00 ET daily · Signals refresh every 15 min</div>
          <div style={{ marginTop:8,display:"flex",gap:16,justifyContent:"flex-end" }}>
            <Link href="/pricing" style={{ color:AMBER }}>Free Access</Link>
            <Link href="/contact" style={{ color:T4 }}>Contact</Link>
            <Link href="/" style={{ color:T4 }}>Home</Link>
          </div>
        </div>
      </footer>

      </ErrorBoundary>
    </div>
  )
}
