"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono, SYS = font.sys
const AMBER = color.amber, GREEN = color.green, RED = color.red, BLUE = color.blue
const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1
const T1 = color.t1, T3 = color.t3, T4 = color.t4

export interface AnomalyAlert {
  id: string
  severity: "INFO" | "WATCH" | "ANOMALY"
  seriesName: string
  zScore: number
  current: number
  mean90d: number
  deviation: number
  implication: string
  timestamp: string
  type: string
}

const SEV_COLOR: Record<string, string> = { INFO: BLUE, WATCH: AMBER, ANOMALY: RED }
const SEV_ICON:  Record<string, string> = { INFO: "🟢", WATCH: "🟡", ANOMALY: "🔴" }

const SYNTHETIC: AnomalyAlert[] = [
  { id:"1", severity:"ANOMALY", seriesName:"Residential Permit Value", zScore:2.3, current:48.2, mean90d:41.1, deviation:17.3, implication:"Possible demand surge — watch employment data in 8–10 weeks", timestamp:"2026-04-20T09:14:00Z", type:"Anomaly" },
  { id:"2", severity:"WATCH",   seriesName:"Construction Employment",   zScore:1.7, current:8330, mean90d:8180, deviation:1.8,  implication:"Employment at cycle high — monitor for deceleration signal", timestamp:"2026-04-18T14:00:00Z", type:"Acceleration" },
  { id:"3", severity:"WATCH",   seriesName:"PPI Steel Mill Products",   zScore:-1.6, current:318.4, mean90d:328.2, deviation:-3.0, implication:"Materials cost pressure easing — favorable procurement window", timestamp:"2026-04-16T11:00:00Z", type:"Trend Reversal" },
  { id:"4", severity:"INFO",    seriesName:"Federal Award Pace",        zScore:1.2, current:4820, mean90d:4280, deviation:12.6, implication:"Federal obligations above trend — infrastructure spending accelerating", timestamp:"2026-04-14T08:30:00Z", type:"Acceleration" },
]

function fmtTs(iso: string) {
  try { return new Date(iso).toLocaleString("en-US",{month:"long",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true,timeZoneName:"short"}) }
  catch { return iso }
}

interface AnomalyFeedProps {
  alerts?: AnomalyAlert[]
  maxVisible?: number
}

export function AnomalyFeed({ alerts, maxVisible = 10 }: AnomalyFeedProps) {
  const items = (alerts && alerts.length > 0 ? alerts : SYNTHETIC).slice(0, maxVisible)
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {items.map(a => {
        const col = SEV_COLOR[a.severity] ?? BLUE
        const icon = SEV_ICON[a.severity] ?? "🟢"
        const zDir = a.zScore >= 0 ? "above" : "below"
        return (
          <div key={a.id} style={{ background:BG2, border:`1px solid ${BD1}`, borderLeft:`4px solid ${col}`, borderRadius:"0 12px 12px 0", padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span>{icon}</span>
              <span style={{ fontFamily:MONO, fontSize:11, color:col, fontWeight:700 }}>{a.severity}</span>
              <span style={{ fontFamily:SYS, fontSize:15, color:T1, fontWeight:600 }}>{a.seriesName}</span>
            </div>
            <div style={{ fontFamily:MONO, fontSize:13, color:col, marginBottom:6 }}>
              Z-Score: {a.zScore > 0 ? "+" : ""}{a.zScore.toFixed(1)}σ — Significantly {zDir} trend
            </div>
            <div style={{ fontFamily:MONO, fontSize:12, color:T3, marginBottom:6 }}>
              Current: {a.current.toLocaleString()} | 90-day mean: {a.mean90d.toLocaleString()} | Deviation: {a.deviation > 0 ? "+" : ""}{a.deviation.toFixed(1)}%
            </div>
            <div style={{ fontFamily:SYS, fontSize:13, color:T3, marginBottom:8, lineHeight:1.5 }}>
              <span style={{ fontFamily:MONO, fontSize:11, color:T4 }}>Implication: </span>{a.implication}
            </div>
            <div style={{ fontFamily:MONO, fontSize:11, color:T4 }}>{fmtTs(a.timestamp)}</div>
          </div>
        )
      })}
      {items.length === 0 && (
        <div style={{ background:BG1, borderRadius:12, padding:"28px 24px", textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
          <div style={{ fontFamily:SYS, fontSize:15, color:T1 }}>No anomalies detected in last 30 days</div>
          <div style={{ fontFamily:MONO, fontSize:12, color:T4, marginTop:4 }}>All series within normal range</div>
        </div>
      )}
    </div>
  )
}
