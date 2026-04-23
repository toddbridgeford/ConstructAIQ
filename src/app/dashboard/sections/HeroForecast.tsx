"use client"
import { useState, useEffect } from "react"
import { ForecastChart }   from "../components/ForecastChart"
import { ScenarioBuilder } from "../components/ScenarioBuilder"
import { ModelAccuracy }   from "../components/ModelAccuracy"
import { ConfidenceRing }  from "../components/ConfidenceRing"
import { RecessionGauge }        from "../components/RecessionGauge"
import { LeadingIndicatorCard }   from "../components/LeadingIndicatorCard"
import { CycleClock }             from "../components/CycleClock"
import { SectionHeader }   from "../components/SectionHeader"
import { SectionVerdict }  from "../components/SectionVerdict"
import { DriverPanel }     from "../components/DriverPanel"
import { BottomSheet }     from "@/app/components/BottomSheet"
import { Skeleton }       from "@/app/components/Skeleton"
import { color, font } from "@/lib/theme"
import type { ForecastData } from "../types"

function forecastContext(fore: ForecastData): string | null {
  const yoy  = fore?.metrics?.yoy_implied ?? 0
  const mape = fore?.metrics?.mape ?? 0
  if (yoy < -3) return `Forecast implies contraction — the last period of comparable decline was 2020.`
  if (mape > 6) return `Elevated forecast uncertainty (MAPE ${mape.toFixed(1)}%) — wider confidence bands apply.`
  if (yoy > 5)  return `Above-trend growth forecast — tracking federal infrastructure cycle.`
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1
const AMBER = color.amber

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

interface HeroForecastProps {
  fore:         AnyData | null
  foreAccuracy: number
  foreMAPE:     number
}

export function HeroForecast({ fore, foreAccuracy, foreMAPE }: HeroForecastProps) {
  const [activeSeries, setActiveSeries] = useState("TTLCONS")
  const [scenarioLine, setScenarioLine] = useState<number[] | null>(null)
  const [sheetOpen,    setSheetOpen]    = useState(false)
  const [isMobile,     setIsMobile]     = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 479px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const lastHistVal: number = fore?.history?.[fore.history.length - 1] ?? 2190

  // Compute forecast verdict sentence
  const forecastVerdictText = (() => {
    const hist  = fore?.history ?? []
    const ens   = fore?.ensemble ?? []
    const acc   = fore?.metrics?.accuracy ?? foreAccuracy
    const mape  = fore?.metrics?.mape ?? foreMAPE
    const last  = hist[hist.length - 1] ?? 2190
    const end   = ens.length > 0 ? ens[ens.length - 1]?.base ?? last : last
    const pct   = last > 0 ? ((end - last) / last) * 100 : 0
    const dir   = pct > 0.5 ? 'growth' : pct < -0.5 ? 'decline' : 'flat movement'
    const vsMedian = pct > 2.1 ? 'above' : pct < 0 ? 'below' : 'near'
    return `Forecast shows ${Math.abs(pct).toFixed(1)}% ${dir} over 12 months with ${acc.toFixed(0)}% model accuracy (MAPE ${mape.toFixed(1)}%). ${pct > 2.1 ? 'Above' : pct < 0 ? 'Below' : 'Near'} the platform's long-run median growth rate.`
  })()

  return (
    <section id="forecast" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="02" title="Forecast Intelligence Panel" subtitle="12-month ensemble AI forecast with confidence intervals" />

      {/* Hero: ForecastChart + ScenarioBuilder */}
      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
        <Card style={{ flex:"3 1 480px", minWidth:0 }}>
          <ForecastChart
            foreData={fore as ForecastData | null}
            scenarioLine={scenarioLine}
            onSeriesChange={setActiveSeries}
          />
          {/* Contextual footnote */}
          {fore && (() => {
            const ctx = forecastContext(fore as ForecastData)
            return ctx ? (
              <p style={{
                marginTop:  14,
                fontSize:   12,
                fontFamily: font.sys,
                color:      color.t3,
                lineHeight: 1.55,
                borderTop:  `1px solid ${color.bd1}`,
                paddingTop: 10,
              }}>
                {ctx}
              </p>
            ) : null
          })()}

          {/* Scenario trigger — mobile only */}
          {isMobile && (
            <button
              onClick={() => setSheetOpen(true)}
              style={{
                marginTop:16, width:"100%", minHeight:44,
                background:AMBER+"18", border:`1px solid ${AMBER}44`,
                borderRadius:12, color:AMBER, fontFamily:font.sys,
                fontSize:14, fontWeight:600, cursor:"pointer",
              }}
            >
              Run Scenario
            </button>
          )}
        </Card>

        {/* ScenarioBuilder — desktop only (hidden on mobile via BottomSheet) */}
        {!isMobile && (
          <Card style={{ flex:"1 1 280px", minWidth:0 }}>
            <ScenarioBuilder
              spendVal={lastHistVal}
              foreData={fore as ForecastData | null}
              onScenarioChange={setScenarioLine}
            />
          </Card>
        )}
      </div>

      {/* ScenarioBuilder bottom sheet — mobile */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Scenario Builder">
        <ScenarioBuilder
          spendVal={lastHistVal}
          foreData={fore as ForecastData | null}
          onScenarioChange={(line) => { setScenarioLine(line); setSheetOpen(false) }}
        />
      </BottomSheet>

      <DriverPanel seriesId="TTLCONS" />

      {/* Supporting metrics */}
      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
        <Card style={{ flex:"2 1 360px", minWidth:0 }}>
          {fore ? <ModelAccuracy accuracy={foreAccuracy} mape={foreMAPE} /> : <Skeleton height={200} />}
        </Card>
        <Card style={{ flex:"1 1 200px", minWidth:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:24 }}>
          <ConfidenceRing value={91} label="Model Agreement" />
          <RecessionGauge />
        </Card>
        <Card style={{ flex:"1 1 220px", minWidth:0 }}>
          <CycleClock position={45} history={[30,34,38,42,43,45]} />
        </Card>
        <Card style={{ flex:"1 1 240px", minWidth:0 }}>
          <LeadingIndicatorCard />
        </Card>
      </div>

      {fore && <SectionVerdict text={forecastVerdictText} />}
    </section>
  )
}
