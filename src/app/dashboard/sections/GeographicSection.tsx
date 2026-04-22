"use client"
import dynamic from "next/dynamic"
import { StateDrillDown } from "../components/StateDrillDown"
import { TopStatesChart } from "../components/TopStatesChart"
import { SectionHeader }  from "../components/SectionHeader"
import { Skeleton }       from "@/app/components/Skeleton"
import { color, font } from "@/lib/theme"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1
const MONO = font.mono, T4 = color.t4

const StateMap = dynamic(
  () => import("../components/StateMap").then(m => ({ default: m.StateMap })),
  { ssr: false, loading: () => <Skeleton height={380} borderRadius={16} /> }
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
        <Skeleton height={440} borderRadius={16} style={{ marginBottom:20 }} />
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

      <Card>
        <TopStatesChart states={states} toggle={mapToggle} onToggleChange={onToggleChange} />
      </Card>
    </section>
  )
}
