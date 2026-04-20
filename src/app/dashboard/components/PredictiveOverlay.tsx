"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys
const AMBER = color.amber, BLUE = color.blue
const BG2 = color.bg2, BD1 = color.bd1, BD2 = color.bd2
const T1 = color.t1, T3 = color.t3, T4 = color.t4

const BASE = [94,91,88,86,89,92,95,98,97,99,101,103,100,98,101,104,107,106,108,110,112,109,112,115]
const MONTHS = ["May'24","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan'25","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan'26","Feb","Mar","Apr"]

function buildData() {
  return MONTHS.map((date,i) => ({
    date,
    permitIndex: BASE[i] ?? null,
    employmentShifted: i >= 2 ? (BASE[i-2] ?? 0)*0.96+4 : null,
  }))
}

interface PredictiveOverlayProps {
  prediction?: string
}

export function PredictiveOverlay({ prediction }: PredictiveOverlayProps) {
  const data = buildData()
  const pred = prediction ?? "Based on current permit readings (+2.8% MoM), employment is projected to increase 0.4–0.6% in 8–12 weeks."
  return (
    <div>
      <div style={{ fontFamily:MONO, fontSize:11, color:T4, letterSpacing:"0.1em", marginBottom:4 }}>PREDICTIVE LEAD/LAG OVERLAY</div>
      <div style={{ fontFamily:SYS, fontSize:14, color:T3, marginBottom:16, fontStyle:"italic" }}>Permit activity predicts employment changes ~10 weeks in advance</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top:4, right:16, bottom:4, left:-8 }}>
          <CartesianGrid stroke={BD2} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontFamily:MONO, fontSize:10, fill:T4 }} interval={3} />
          <YAxis domain={[80,125]} tick={{ fontFamily:MONO, fontSize:10, fill:T4 }} />
          <Tooltip contentStyle={{ background:BG2, border:`1px solid ${BD1}`, borderRadius:8, fontFamily:MONO, fontSize:12 }} labelStyle={{ color:T1 }} />
          <Legend wrapperStyle={{ fontFamily:MONO, fontSize:11 }} />
          <Line type="monotone" dataKey="permitIndex" name="Permit Index" stroke={BLUE} strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="employmentShifted" name="Employment (shifted +10wk)" stroke={AMBER} strokeWidth={2} dot={false} strokeDasharray="6 3" connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ marginTop:14, background:BG2, border:`1px solid ${BD1}`, borderLeft:`4px solid ${BLUE}`, borderRadius:"0 10px 10px 0", padding:"12px 16px" }}>
        <div style={{ fontFamily:MONO, fontSize:11, color:BLUE, marginBottom:4 }}>CURRENT PREDICTION</div>
        <div style={{ fontFamily:SYS, fontSize:14, color:T1 }}>{pred}</div>
      </div>
    </div>
  )
}
