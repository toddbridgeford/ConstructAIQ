"use client"
import dynamic from "next/dynamic"
import { StateDrillDown } from "../components/StateDrillDown"
import { TopStatesChart } from "../components/TopStatesChart"
import { GateLock }       from "../components/GateLock"
import { SectionHeader }  from "../components/SectionHeader"
import { color, font } from "@/lib/theme"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1
const MONO = font.mono, T4 = color.t4

const StateMap = dynamic(
  () => import("../components/StateMap").then(m => ({ default: m.StateMap })),
  { ssr: false, loading: () => <div style={{ height:380, display:"flex", alignItems:"center", justifyContent:"center", color:T4, fontFamily:MONO, fontSize:12 }}>Loading map…</div> }
)

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

interface GeographicSectionProps {
  states:          AnyData[]
  selState:        string | null
  onSelState:      (code: string | null) => void
  mapToggle:       "permits" | "employment"
  onToggleChange:  (v: "permits" | "employment") => void
  loading:         boolean
}

export function GeographicSection({ states, selState, onSelState, mapToggle, onToggleChange, loading }: GeographicSectionProps) {
  return (
    <section id="map" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="03" title="Geographic Intelligence" subtitle="50-state construction activity, capital flows, and regional momentum" />

      {loading ? (
        <div style={{ height:440, borderRadius:16, background:BG2, animation:"pulse 1.5s infinite", marginBottom:20 }} />
      ) : (
        <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
          <Card style={{ flex:"2 1 480px", minWidth:0 }}>
            <div style={{ fontFamily:MONO, fontSize:11, color:T4, letterSpacing:"0.1em", marginBottom:14 }}>50-STATE CONSTRUCTION ACTIVITY</div>
            <StateMap states={states} onStateClick={onSelState} selectedState={selState} />
          </Card>
          {selState && (
            <div style={{ flex:"1 1 300px", minWidth:0, maxWidth:360 }}>
              <StateDrillDown stateCode={selState} states={states} onClose={() => onSelState(null)} />
            </div>
          )}
        </div>
      )}

      <GateLock locked={false} requiredPlan="Starter" featureName="State Drill-Down">
        <Card>
          <TopStatesChart states={states} toggle={mapToggle} onToggleChange={onToggleChange} />
        </Card>
      </GateLock>
    </section>
  )
}
