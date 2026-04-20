"use client"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys

interface HistoryPoint {
  week: string
  score: number
  classification: string
}

interface CSHIHistoryProps {
  data: HistoryPoint[]
}

function fmtWeek(w: string): string {
  try {
    const d = new Date(w)
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
  } catch { return w }
}

function classColor(c: string): string {
  if (c === "EXPANDING")   return color.green
  if (c === "CONTRACTING") return color.red
  if (c === "SLOWING")     return color.amber
  return color.blue
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as HistoryPoint
  return (
    <div style={{ background: color.bg3, border: `1px solid ${color.bd2}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, marginBottom: 4 }}>{fmtWeek(label)}</div>
      <div style={{ fontFamily: MONO, fontSize: 16, color: classColor(d.classification), fontWeight: 700 }}>{d.score.toFixed(1)}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: classColor(d.classification), marginTop: 2 }}>{d.classification}</div>
    </div>
  )
}

export function CSHIHistory({ data }: CSHIHistoryProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ background: color.bg2, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}`, textAlign: "center", color: color.t4, fontFamily: MONO, fontSize: 13 }}>
        No history data
      </div>
    )
  }

  const formatted = data.map(d => ({ ...d, weekFmt: fmtWeek(d.week) }))

  return (
    <div style={{ background: color.bg2, borderRadius: 16, padding: 20, border: `1px solid ${color.bd1}` }}>
      <div style={{ fontFamily: MONO, fontSize: 12, color: color.amber, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 16 }}>
        CSHI 24-WEEK HISTORY
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="cshiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color.green} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color.green} stopOpacity={0} />
            </linearGradient>
            {/* Shaded bands as reference areas via gradient stops */}
          </defs>

          <CartesianGrid vertical={false} stroke={color.bd1} strokeDasharray="3 3" />

          {/* Background zone bands */}
          <defs>
            <linearGradient id="zoneBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color.green} stopOpacity={0.06} />
              <stop offset="30%"  stopColor={color.green} stopOpacity={0.06} />
              <stop offset="30%"  stopColor={color.amber} stopOpacity={0.06} />
              <stop offset="50%"  stopColor={color.amber} stopOpacity={0.06} />
              <stop offset="50%"  stopColor={color.red}   stopOpacity={0.06} />
              <stop offset="100%" stopColor={color.red}   stopOpacity={0.06} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="weekFmt"
            tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
            tickLine={false}
            axisLine={{ stroke: color.bd2 }}
            interval={3}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
            tickLine={false}
            axisLine={false}
            ticks={[0, 25, 50, 70, 100]}
          />

          <ReferenceLine y={70} stroke={color.green} strokeDasharray="4 4" strokeWidth={1.5}
            label={{ value: "EXPAND", position: "right", fontSize: 9, fontFamily: MONO, fill: color.green }} />
          <ReferenceLine y={50} stroke={color.amber} strokeDasharray="4 4" strokeWidth={1.5}
            label={{ value: "NEUTRAL", position: "right", fontSize: 9, fontFamily: MONO, fill: color.amber }} />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="score"
            stroke={color.green}
            strokeWidth={2}
            fill="url(#cshiGrad)"
            dot={false}
            activeDot={{ r: 4, fill: color.green, stroke: color.bg3, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        {[
          { label: "EXPANDING", col: color.green },
          { label: "NEUTRAL",   col: color.amber },
          { label: "SLOWING",   col: "#ff9500" },
          { label: "CONTRACTING", col: color.red },
        ].map(z => (
          <div key={z.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: z.col }} />
            <span style={{ fontFamily: SYS, fontSize: 10, color: color.t4 }}>{z.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
