"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys
const AMBER = color.amber, GREEN = color.green, RED = color.red, BLUE = color.blue
const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1
const T1 = color.t1, T3 = color.t3, T4 = color.t4

export interface CascadeAlert {
  id: string
  severity: "INFO" | "WATCH" | "ANOMALY"
  icon: string
  title: string
  message: string
  type: string
  timestamp: string
  seriesId: string
}

const SEVERITY_COLOR: Record<string, string> = { INFO: BLUE, WATCH: AMBER, ANOMALY: RED }

const SYNTHETIC: CascadeAlert[] = [
  { id:"1", severity:"WATCH",   icon:"⚠️", title:"Permit volume accelerated +2.1σ",       message:"Construction employment likely to rise in 8–12 weeks based on historical patterns.", type:"Acceleration",   timestamp:"2026-04-18T14:23:00Z", seriesId:"PERMIT" },
  { id:"2", severity:"ANOMALY", icon:"🔴", title:"Steel PPI reversed -1.8σ from trend",   message:"Materials cost pressure easing — favorable procurement window opening.",             type:"Trend Reversal",  timestamp:"2026-04-16T11:42:00Z", seriesId:"PPI_STEEL" },
  { id:"3", severity:"INFO",    icon:"🟢", title:"Southeast permit surge detected",        message:"Capital flow into region expected to accelerate in Q3. TX, FL, NC above threshold.", type:"Regional Spike",  timestamp:"2026-04-15T09:15:00Z", seriesId:"PERMIT_SE" },
  { id:"4", severity:"WATCH",   icon:"⚠️", title:"Spend/Employment divergence narrowing",  message:"Employment catching up to spending growth — divergence resolving positively.",       type:"Divergence",      timestamp:"2026-04-12T16:30:00Z", seriesId:"TTLCONS" },
  { id:"5", severity:"INFO",    icon:"🟢", title:"Federal highway obligations accelerating", message:"IIJA highway funds at 67% obligation — pace faster than 12-month average.",        type:"Acceleration",    timestamp:"2026-04-10T08:00:00Z", seriesId:"FEDERAL" },
]

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:true}) }
  catch { return iso }
}

interface CascadeAlertsProps { alerts?: CascadeAlert[] }

export function CascadeAlerts({ alerts }: CascadeAlertsProps) {
  const items = (alerts && alerts.length > 0) ? alerts : SYNTHETIC
  return (
    <div>
      <div style={{ fontFamily:MONO, fontSize:11, color:T4, letterSpacing:"0.1em", marginBottom:14 }}>SIGNAL CASCADE ALERTS — LAST 30 DAYS</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {items.map(a => {
          const col = SEVERITY_COLOR[a.severity] ?? BLUE
          return (
            <div key={a.id} style={{ background:BG2, border:`1px solid ${BD1}`, borderLeft:`4px solid ${col}`, borderRadius:"0 10px 10px 0", padding:"12px 16px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>{a.icon}</span>
                  <span style={{ fontFamily:MONO, fontSize:11, color:col, background:col+"22", border:`1px solid ${col}44`, borderRadius:6, padding:"2px 7px" }}>{a.severity}</span>
                  <span style={{ fontFamily:SYS, fontSize:14, color:T1, fontWeight:600 }}>{a.title}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                  <span style={{ fontFamily:MONO, fontSize:11, color:T4, background:BG1, border:`1px solid ${BD1}`, borderRadius:6, padding:"2px 8px" }}>{a.type}</span>
                  <span style={{ fontFamily:MONO, fontSize:11, color:T4 }}>{fmtTime(a.timestamp)}</span>
                </div>
              </div>
              <div style={{ fontFamily:SYS, fontSize:14, color:T3, lineHeight:1.5, paddingLeft:22 }}>{a.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
