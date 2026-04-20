"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono, SYS = font.sys
const AMBER = color.amber, GREEN = color.green, RED = color.red, BLUE = color.blue
const BG2 = color.bg2, BG3 = color.bg3, BD1 = color.bd1
const T1 = color.t1, T2 = color.t2, T3 = color.t3, T4 = color.t4

export interface DivergencePair {
  seriesA: string
  seriesB: string
  description: string
  correlation: number
  currentDivergence: number
  severity: "LOW" | "MODERATE" | "HIGH"
  implication: string
}

const SEV_COLOR: Record<string, string> = { LOW: GREEN, MODERATE: AMBER, HIGH: RED }

const SYNTHETIC: DivergencePair[] = [
  { seriesA:"Permits", seriesB:"Employment", description:"Historically move together with ~10 week lag", correlation:0.87, currentDivergence:0.12, severity:"LOW", implication:"Currently aligned — permit surge expected to lift employment in 8–12 weeks" },
  { seriesA:"Spending", seriesB:"Employment", description:"Spending rising faster than employment adds", correlation:0.79, currentDivergence:0.34, severity:"MODERATE", implication:"Productivity or input cost squeeze — watch margin data from contractors" },
  { seriesA:"Federal Awards", seriesB:"Private Permits", description:"Policy vs. market activity — usually diverge at cycle turns", correlation:0.62, currentDivergence:0.18, severity:"LOW", implication:"Both rising — IIJA spending complementing private investment" },
]

interface DivergenceDetectorProps {
  pairs?: DivergencePair[]
}

export function DivergenceDetector({ pairs }: DivergenceDetectorProps) {
  const items = (pairs && pairs.length > 0) ? pairs : SYNTHETIC
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ fontFamily:MONO, fontSize:11, color:T4, letterSpacing:"0.1em" }}>DIVERGENCE DETECTOR — ACTIVE PAIRS</div>
      {items.map((p, i) => {
        const col = SEV_COLOR[p.severity] ?? GREEN
        const barW = Math.min(100, Math.round(p.currentDivergence * 200))
        return (
          <div key={i} style={{ background:BG2, border:`1px solid ${BD1}`, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontFamily:SYS, fontSize:15, color:T1, fontWeight:600 }}>
                {p.seriesA} <span style={{ color:T4 }}>vs.</span> {p.seriesB}
              </div>
              <span style={{ fontFamily:MONO, fontSize:11, color:col, background:col+"22", border:`1px solid ${col}44`, borderRadius:6, padding:"2px 8px" }}>{p.severity}</span>
            </div>
            <div style={{ fontFamily:SYS, fontSize:13, color:T3, marginBottom:10 }}>{p.description}</div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ fontFamily:MONO, fontSize:11, color:T4, flexShrink:0 }}>Divergence</div>
              <div style={{ flex:1, background:BG3, borderRadius:4, height:6, overflow:"hidden" }}>
                <div style={{ width:`${barW}%`, height:"100%", background:col, borderRadius:4, transition:"width 0.5s" }} />
              </div>
              <div style={{ fontFamily:MONO, fontSize:11, color:col, flexShrink:0 }}>{(p.currentDivergence*100).toFixed(0)}%</div>
              <div style={{ fontFamily:MONO, fontSize:11, color:T4, flexShrink:0 }}>R²={p.correlation.toFixed(2)}</div>
            </div>
            <div style={{ fontFamily:SYS, fontSize:13, color:T2, lineHeight:1.5 }}>
              <span style={{ fontFamily:MONO, fontSize:10, color:T4 }}>Signal: </span>{p.implication}
            </div>
          </div>
        )
      })}
    </div>
  )
}
