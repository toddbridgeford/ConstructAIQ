"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts"
import { font, color } from "@/lib/theme"
import type { StateData } from "./StateMap"

const MONO = font.mono
const SYS = font.sys

interface TopStatesChartProps {
  states: StateData[]
  toggle: "permits" | "employment"
  onToggleChange: (t: "permits" | "employment") => void
}

function signalBarColor(signal: string, yoyChange: number): string {
  if (signal === "HOT" || yoyChange > 10) return color.green
  if (signal === "GROWING" || yoyChange >= 3) return color.greenLight
  if (signal === "NEUTRAL") return color.amber
  if (signal === "COOLING") return color.orange
  if (signal === "DECLINING" || yoyChange < -10) return color.red
  return color.t4
}

export function TopStatesChart({ states, toggle, onToggleChange }: TopStatesChartProps) {
  const sorted = [...states]
    .sort((a, b) => {
      const aVal = toggle === "permits" ? a.permits : a.employment
      const bVal = toggle === "permits" ? b.permits : b.employment
      return bVal - aVal
    })
    .slice(0, 10)
    .map(s => ({
      name: s.code,
      value: s.yoyChange,
      signal: s.signal,
      permits: s.permits,
      employment: s.employment,
    }))
    .reverse()

  const toggleBtnBase: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: 11,
    padding: "5px 14px",
    borderRadius: 8,
    cursor: "pointer",
    border: `1px solid ${color.bd2}`,
    transition: "all 0.15s",
  }

  return (
    <div style={{ background: color.bg2, border: `1px solid ${color.bd1}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.08em" }}>
          TOP 10 STATES — YOY CHANGE
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onToggleChange("permits")}
            style={{
              ...toggleBtnBase,
              background: toggle === "permits" ? color.amber : color.bg3,
              color: toggle === "permits" ? color.bg0 : color.t3,
            }}
          >Permit Growth</button>
          <button
            onClick={() => onToggleChange("employment")}
            style={{
              ...toggleBtnBase,
              background: toggle === "employment" ? color.amber : color.bg3,
              color: toggle === "employment" ? color.bg0 : color.t3,
            }}
          >Employment Growth</button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={color.bd1} horizontal={false} />
          <XAxis
            type="number"
            dataKey="value"
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
            tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
            axisLine={{ stroke: color.bd2 }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontFamily: MONO, fontSize: 11, fill: color.t3 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: color.bg4 }}
            contentStyle={{ background: color.bg3, border: `1px solid ${color.bd2}`, borderRadius: 8, fontFamily: MONO, fontSize: 11 }}
            labelStyle={{ color: color.t2, fontWeight: 700 }}
            formatter={(val: number) => [`${val > 0 ? "+" : ""}${val.toFixed(2)}%`, "YoY Change"]}
          />
          <ReferenceLine x={0} stroke={color.bd3} strokeWidth={1} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={signalBarColor(entry.signal, entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
        {[
          { label: "HOT", fill: color.green },
          { label: "GROWING", fill: color.greenLight },
          { label: "NEUTRAL", fill: color.amber },
          { label: "COOLING", fill: color.orange },
          { label: "DECLINING", fill: color.red },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.fill }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
