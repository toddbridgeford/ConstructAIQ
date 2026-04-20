"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys

// Fallback internal data indexed to 100 at trough (month=0)
const FALLBACK_2008 = [-24,-18,-12,-6,0,6,12,18,24].map((m,i) => ({ monthFromPeak: m, value: [108,104,99,94,100,94,88,82,78][i] }))
const FALLBACK_2016 = [-24,-18,-12,-6,0,6,12,18,24].map((m,i) => ({ monthFromPeak: m, value: [95,97,98,99,100,103,107,110,115][i] }))
const FALLBACK_2020 = [-24,-18,-12,-6,0,6,12,18,24].map((m,i) => ({ monthFromPeak: m, value: [98,99,100,98,100,110,118,120,122][i] }))
const FALLBACK_CURRENT = [-24,-18,-12,-6,0,6,12,14].map((m,i) => ({ monthFromPeak: m, value: [94,96,97,98,100,105,110,112][i] }))

interface CyclePoint {
  monthFromPeak: number
  value: number
}

export interface CycleComparisonProps {
  current?: CyclePoint[]
  cycle2008?: CyclePoint[]
  cycle2016?: CyclePoint[]
  cycle2020?: CyclePoint[]
  currentMonth?: number
  description?: string
}

function buildData(cur: CyclePoint[], c08: CyclePoint[], c16: CyclePoint[], c20: CyclePoint[]) {
  const allMonths = Array.from(new Set([
    ...cur.map(d => d.monthFromPeak),
    ...c08.map(d => d.monthFromPeak),
    ...c16.map(d => d.monthFromPeak),
    ...c20.map(d => d.monthFromPeak),
  ])).sort((a, b) => a - b)

  const toMap = (arr: CyclePoint[]) => new Map(arr.map(d => [d.monthFromPeak, d.value]))
  const curMap = toMap(cur), m08 = toMap(c08), m16 = toMap(c16), m20 = toMap(c20)

  return allMonths.map(m => ({
    m,
    current:  curMap.get(m) ?? null,
    c2008:    m08.get(m)   ?? null,
    c2016:    m16.get(m)   ?? null,
    c2020:    m20.get(m)   ?? null,
  }))
}

export function CycleComparison({
  current,
  cycle2008,
  cycle2016,
  cycle2020,
  currentMonth = 14,
  description,
}: CycleComparisonProps) {
  const cur = current && current.length > 0 ? current : FALLBACK_CURRENT
  const c08 = cycle2008 && cycle2008.length > 0 ? cycle2008 : FALLBACK_2008
  const c16 = cycle2016 && cycle2016.length > 0 ? cycle2016 : FALLBACK_2016
  const c20 = cycle2020 && cycle2020.length > 0 ? cycle2020 : FALLBACK_2020

  const data = buildData(cur, c08, c16, c20)
  const desc = description ?? `We are currently at month +${currentMonth} from the cycle trough (Oct 2022)`

  return (
    <div style={{ background: color.bg2, border: `1px solid ${color.bd1}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em", marginBottom: 14 }}>
        HISTORICAL CYCLE COMPARISON — INDEXED ACTIVITY (TROUGH = 100)
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: -8 }}>
          <CartesianGrid stroke={color.bd2} strokeDasharray="3 3" />
          <XAxis
            dataKey="m"
            type="number"
            domain={["dataMin", "dataMax"]}
            label={{ value: "Month from Trough", position: "insideBottomRight", offset: -4, style: { fontFamily: MONO, fontSize: 9, fill: color.t4 } }}
            tick={{ fontFamily: MONO, fontSize: 9, fill: color.t4 }}
            axisLine={{ stroke: color.bd2 }}
            tickLine={false}
          />
          <YAxis
            domain={[70, 130]}
            tick={{ fontFamily: MONO, fontSize: 9, fill: color.t4 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{ background: color.bg3, border: `1px solid ${color.bd2}`, borderRadius: 8, fontFamily: MONO, fontSize: 11 }}
            labelStyle={{ color: color.t1 }}
            labelFormatter={(v: number) => `Month ${v}`}
          />
          <Legend verticalAlign="top" align="left" wrapperStyle={{ fontFamily: MONO, fontSize: 10, paddingBottom: 8 }} />
          <ReferenceLine x={0} stroke={color.t4} strokeDasharray="4 2"
            label={{ value: "TROUGH", position: "top", style: { fontFamily: MONO, fontSize: 8, fill: color.t4 } }} />
          <ReferenceLine x={currentMonth} stroke={color.amber} strokeDasharray="4 2"
            label={{ value: "NOW", position: "top", style: { fontFamily: MONO, fontSize: 8, fill: color.amber } }} />
          <Line type="monotone" dataKey="current" name="Current Cycle" stroke={color.amber} strokeWidth={3} dot={false} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="c2020"   name="2020 Cycle"   stroke={color.green}  strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="c2016"   name="2016 Cycle"   stroke={color.blue}   strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="c2008"   name="2008 Cycle"   stroke={color.t4}     strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 12, fontFamily: SYS, fontSize: 12, color: color.t3, lineHeight: 1.6, borderTop: `1px solid ${color.bd1}`, paddingTop: 12 }}>
        {desc}
      </div>
    </div>
  )
}
