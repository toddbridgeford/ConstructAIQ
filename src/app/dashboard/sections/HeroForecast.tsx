"use client"
import { useState } from "react"
import { ForecastChart }   from "../components/ForecastChart"
import { ScenarioBuilder } from "../components/ScenarioBuilder"
import { ModelAccuracy }   from "../components/ModelAccuracy"
import { ConfidenceRing }  from "../components/ConfidenceRing"
import { RecessionGauge }  from "../components/RecessionGauge"
import { CycleClock }      from "../components/CycleClock"
import { SectionHeader }   from "../components/SectionHeader"
import { color } from "@/lib/theme"
import type { ForecastData } from "../types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

interface HeroForecastProps {
  fore:         AnyData | null
  foreAccuracy: number
  foreMAPE:     number
}

export function HeroForecast({ fore, foreAccuracy, foreMAPE }: HeroForecastProps) {
  const [scenarioLine, setScenarioLine] = useState<number[] | null>(null)
  const SKEL: React.CSSProperties = { height:200, borderRadius:16, background:BG2, animation:"pulse 1.5s infinite" }

  const lastHistVal: number = fore?.history?.[fore.history.length - 1] ?? 2190

  return (
    <section id="forecast" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="02" title="Forecast Intelligence Panel" subtitle="12-month ensemble AI forecast with confidence intervals" />

      {/* Hero: ForecastChart + ScenarioBuilder side by side */}
      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
        <Card style={{ flex:"3 1 480px", minWidth:0 }}>
          <ForecastChart
            foreData={fore as ForecastData | null}
            scenarioLine={scenarioLine}
          />
        </Card>
        <Card style={{ flex:"1 1 280px" }}>
          <ScenarioBuilder
            spendVal={lastHistVal}
            foreData={fore as ForecastData | null}
            onScenarioChange={setScenarioLine}
          />
        </Card>
      </div>

      {/* Supporting metrics */}
      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
        <Card style={{ flex:"2 1 360px" }}>
          {fore ? <ModelAccuracy accuracy={foreAccuracy} mape={foreMAPE} /> : <div style={SKEL} />}
        </Card>
        <Card style={{ flex:"1 1 200px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:24 }}>
          <ConfidenceRing value={91} label="Model Agreement" />
          <RecessionGauge probability={18} />
        </Card>
        <Card style={{ flex:"1 1 220px" }}>
          <CycleClock position={45} history={[30,34,38,42,43,45]} />
        </Card>
      </div>
    </section>
  )
}
