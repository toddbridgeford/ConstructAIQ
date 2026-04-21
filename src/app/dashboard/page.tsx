"use client"
import Image from "next/image"
import Link  from "next/link"
import { useState, useEffect } from "react"
import { font, color, fmtB } from "@/lib/theme"
import { ErrorBoundary }    from "./components/ErrorBoundary"
import { KpiRow }           from "./sections/KpiRow"
import { HeroForecast }     from "./sections/HeroForecast"
import { CommandSection }   from "./sections/CommandSection"
import { GeographicSection }from "./sections/GeographicSection"
import { MaterialsSection } from "./sections/MaterialsSection"
import { PipelineSection }  from "./sections/PipelineSection"
import { FederalSection }   from "./sections/FederalSection"
import { EquitiesSection }  from "./sections/EquitiesSection"
import { SignalsSection }   from "./sections/SignalsSection"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const SYS = font.sys, MONO = font.mono
const BG0 = color.bg0, BG1 = color.bg1
const BD1 = color.bd1, BD2 = color.bd2
const T1 = color.t1, T3 = color.t3, T4 = color.t4
const GREEN = color.green, AMBER = color.amber

const NAV_SECTIONS = [
  {id:"forecast",label:"Forecast"},{id:"command",label:"Command"},
  {id:"map",label:"Map"},{id:"materials",label:"Materials"},
  {id:"pipeline",label:"Pipeline"},{id:"federal",label:"Federal"},
  {id:"equities",label:"Equities"},{id:"signals",label:"Signals"},
]
function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({behavior:"smooth"}) }

function fredSpark(obs: AnyData[] | undefined, n = 12, fallback = 0): number[] {
  const vals = (obs ?? []).slice().sort((a: AnyData, b: AnyData) => (a.date as string).localeCompare(b.date as string)).slice(-n).map((o: AnyData) => parseFloat(o.value)).filter((v: number) => !isNaN(v))
  if (vals.length === 0) return Array(n).fill(fallback)
  while (vals.length < n) vals.unshift(vals[0])
  return vals
}
function blsSpark(data: AnyData[] | undefined, n = 12, fallback = 0): number[] {
  const vals = (data ?? []).slice().sort((a: AnyData, b: AnyData) => `${a.year}${a.period}`.localeCompare(`${b.year}${b.period}`)).slice(-n).map((o: AnyData) => parseFloat(o.value)).filter((v: number) => !isNaN(v))
  if (vals.length === 0) return Array(n).fill(fallback)
  while (vals.length < n) vals.unshift(vals[0])
  return vals
}

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
  const [fredD,    setFredD]    = useState<AnyData>(null)

  useEffect(() => {
    async function load() {
      async function safe(url: string) { try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null } }
      const [cshiD,spendD,employD,foreD,mapData,pricesD,pipeD,fedD,eqD,sigsD,briefD,fredData] =
        await Promise.all([safe("/api/cshi"),safe("/api/census"),safe("/api/bls"),safe("/api/forecast?series=TTLCONS"),safe("/api/map"),safe("/api/pricewatch"),safe("/api/pipeline"),safe("/api/federal"),safe("/api/equities"),safe("/api/signals"),safe("/api/weekly-brief"),safe("/api/fred")])
      if (cshiD)   setCshi(cshiD);   if (spendD)  setSpend(spendD);   if (employD) setEmploy(employD)
      if (foreD)   setFore(foreD);   if (mapData) setMapD(mapData);   if (pricesD) setPrices(pricesD)
      if (pipeD)   setPipeline(pipeD); if (fedD)  setFederal(fedD);   if (eqD)     setEquities(eqD)
      if (sigsD)   setSignals(sigsD);  if (briefD) setBrief(briefD);  if (fredData) setFredD(fredData)
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
  const procurementValue = commodities.length > 0
    ? Math.round(commodities.reduce((sum: number, c: AnyData) => sum + (c.signal==="BUY"?72:c.signal==="SELL"?32:54), 0) / commodities.length)
    : 61

  // Sparklines — deterministic, never random
  const spendSpark  = fredSpark(spend?.observations, 12, spendVal / 1000)
  const permitSpark = fredSpark(fredD?.series?.PERMIT?.observations, 12, 1482)
  const houstSpark  = fredSpark(fredD?.series?.HOUST?.observations, 12, 1394)
  const empSpark    = blsSpark(employ?.data?.Results?.series?.[0]?.data, 12, empVal / 1000)

  const heatmapData = commodities.slice(0,6).map((c: AnyData) => ({
    commodity: c.name,
    months: Array.from({length:12},(_,i) => ({month:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],value:c.value,pctChange:c.mom||0})),
  }))
  const corrSpend: {date:string;value:number}[] = spend?.observations
    ? spend.observations.slice().sort((a: AnyData,b: AnyData)=>(a.date as string).localeCompare(b.date as string)).slice(-24).map((o: AnyData,i: number)=>({date:(o.date as string)||`2024-${String(i%12+1).padStart(2,"0")}-01`,value:parseFloat(o.value)||2100+i*4}))
    : Array.from({length:24},(_,i)=>({date:`2024-${String(i%12+1).padStart(2,"0")}-01`,value:2100+i*4}))
  const corrMaterials: {date:string;value:number}[] = Array.from({length:24},(_,i)=>({date:`2024-${String(i%12+1).padStart(2,"0")}-01`,value:280+i*2}))

  // Extract headline sentence from brief for excerpt card
  const briefHeadline = typeof brief?.brief === "string"
    ? brief.brief.split("\n\n")[0].replace(/^HEADLINE SIGNAL:\s*/i, "").trim()
    : null

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
              <button key={s.id} onClick={()=>scrollTo(s.id)} style={{ background:"transparent",border:"none",fontFamily:SYS,fontSize:13,color:T3,padding:"4px 8px",borderRadius:6 }} onMouseEnter={e=>(e.currentTarget.style.color=T1)} onMouseLeave={e=>(e.currentTarget.style.color=T3)}>{s.label}</button>
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
        <section style={{ paddingTop:32 }}>
          <KpiRow spendVal={spendVal} spendMom={spendMom} spendSpark={spendSpark} empVal={empVal} empMom={empMom} empSpark={empSpark} permitSpark={permitSpark} houstSpark={houstSpark} sigCount={sigList.length} loading={spend===null && employ===null} />
        </section>

        {/* 2 — Forecast hero */}
        <HeroForecast fore={fore} foreAccuracy={foreAccuracy} foreMAPE={foreMAPE} />

        {/* 3 — Weekly brief excerpt */}
        {briefHeadline && (
          <section style={{ paddingTop:24, paddingBottom:8 }}>
            <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"20px 28px", display:"flex", gap:16, alignItems:"flex-start" }}>
              <div style={{ fontFamily:MONO, fontSize:10, color:AMBER, letterSpacing:"0.1em", whiteSpace:"nowrap", paddingTop:2 }}>BRIEF</div>
              <div style={{ fontFamily:SYS, fontSize:15, color:T1, lineHeight:1.65 }}>{briefHeadline}</div>
            </div>
          </section>
        )}

        {/* 4 — Command / CSHI */}
        <CommandSection cshi={cshi} foreData={fore} corrSpend={corrSpend} />

        {/* 5+ — Supporting sections */}
        <GeographicSection states={states} selState={selState} onSelState={setSelState} mapToggle={mapToggle} onToggleChange={setMapToggle} loading={mapD===null} />
        <MaterialsSection commodities={commodities} procurementValue={procurementValue} heatmapData={heatmapData} corrMaterials={corrMaterials} corrSpend={corrSpend} loading={prices===null} />
        <PipelineSection pipeline={pipeline} />
        <FederalSection federal={federal} />
        <EquitiesSection equities={equities} sectorRange={sectorRange} onSectorRangeChange={setSectorRange} />
        <SignalsSection signals={signals} brief={brief} />
      </div>

      <footer style={{ borderTop:`1px solid ${BD1}`,padding:"32px 24px",display:"flex",flexWrap:"wrap",gap:24,justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <Image src="/ConstructAIQWhiteLogo.svg" width={110} height={22} alt="ConstructAIQ" style={{ height:22,width:"auto",marginBottom:8 }} />
          <div style={{ fontFamily:SYS,fontSize:13,color:T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        </div>
        <div style={{ fontFamily:SYS,fontSize:12,color:T4,textAlign:"right" }}>
          <div>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
          <div style={{ marginTop:4 }}>Updates: 06:00 ET daily · Signals refresh every 15 min</div>
          <div style={{ marginTop:8,display:"flex",gap:16,justifyContent:"flex-end" }}>
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
