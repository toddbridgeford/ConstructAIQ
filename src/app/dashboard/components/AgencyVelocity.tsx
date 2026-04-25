"use client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

interface AgencyData {
  name: string
  obligatedPct: number
  color: string
}

interface AgencyVelocityProps {
  agencies: AgencyData[]
}

function barColor(pct: number): string {
  if (pct > 70) return color.green
  if (pct >= 40) return color.amber
  return color.red
}

interface TooltipPayloadItem {
  value: number
  name: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const val = payload[0].value
  return (
    <div
      style={{
        background: color.bg4,
        border: `1px solid ${color.bd2}`,
        borderRadius: 8,
        padding: "8px 12px",
        fontFamily: MONO,
        fontSize: 12,
        color: color.t1,
      }}
    >
      <div style={{ color: color.t3, marginBottom: 2 }}>{label}</div>
      <div style={{ color: barColor(val), fontWeight: 700 }}>{val.toFixed(0)} award share (top = 100)</div>
    </div>
  )
}

export function AgencyVelocity({ agencies }: AgencyVelocityProps) {
  if (!agencies || agencies.length === 0) {
    return (
      <div style={{ padding: 24, color: color.t4, fontFamily: SYS, fontSize: 14, textAlign: "center" }}>
        No agency data available.
      </div>
    )
  }

  const sorted = [...agencies].sort((a, b) => b.obligatedPct - a.obligatedPct)

  return (
    <div
      style={{
        background: color.bg2,
        border: `1px solid ${color.bd1}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
          Federal Award Share by Agency
        </div>
        <div style={{ fontFamily: SYS, fontSize: 14, color: color.t2, lineHeight: 1.4 }}>
          Relative share of recent construction contract awards. Top agency indexed to 100.
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {[
          { label: ">70 High", c: color.green },
          { label: "40–70 Moderate", c: color.amber },
          { label: "<40 Low", c: color.red },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.c }} />
            <span style={{ fontFamily: SYS, fontSize: 11, color: color.t4 }}>{item.label}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={sorted.length * 36 + 40}>
        <BarChart
          layout="vertical"
          data={sorted}
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke={color.bd1} strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
            axisLine={{ stroke: color.bd2 }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fontFamily: SYS, fontSize: 11, fill: color.t3 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: color.bg3 }} />
          <ReferenceLine x={40} stroke={color.amber} strokeDasharray="4 2" strokeOpacity={0.5} />
          <ReferenceLine x={70} stroke={color.green} strokeDasharray="4 2" strokeOpacity={0.5} />
          <Bar dataKey="obligatedPct" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.obligatedPct)} />
            ))}
            <LabelList
              dataKey="obligatedPct"
              position="right"
              formatter={(v: number) => `${v.toFixed(0)}%`}
              style={{ fontFamily: MONO, fontSize: 11, fill: color.t3 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
