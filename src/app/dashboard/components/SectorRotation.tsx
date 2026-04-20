"use client"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
  Cell,
} from "recharts"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

interface SubsectorPoint {
  subsector: string
  momentum: number
  level: number
}

interface SectorRotationProps {
  data: SubsectorPoint[]
}

function quadrantColor(momentum: number, level: number): string {
  if (momentum >= 0 && level >= 0) return color.green
  if (momentum < 0 && level >= 0) return color.amber
  if (momentum >= 0 && level < 0) return color.blue
  return color.red
}

interface TooltipPayloadItem {
  payload: SubsectorPoint & { z: number }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const d = payload[0].payload
  const qLabel =
    d.momentum >= 0 && d.level >= 0
      ? "OVERWEIGHT"
      : d.momentum < 0 && d.level >= 0
      ? "WATCH"
      : d.momentum >= 0 && d.level < 0
      ? "EMERGING"
      : "UNDERWEIGHT"

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
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.subsector}</div>
      <div style={{ color: color.t3 }}>Momentum: {d.momentum.toFixed(2)}</div>
      <div style={{ color: color.t3 }}>Level: {d.level.toFixed(2)}</div>
      <div style={{ color: quadrantColor(d.momentum, d.level), marginTop: 4, fontWeight: 700 }}>{qLabel}</div>
    </div>
  )
}

const QUADRANTS = [
  { x: 1, y: 1, label: "OVERWEIGHT", bg: color.greenDim, textColor: color.green, xOffset: "51%", yOffset: "2%" },
  { x: -1, y: 1, label: "WATCH", bg: color.amberDim, textColor: color.amber, xOffset: "2%", yOffset: "2%" },
  { x: 1, y: -1, label: "EMERGING", bg: color.blueDim, textColor: color.blue, xOffset: "51%", yOffset: "51%" },
  { x: -1, y: -1, label: "UNDERWEIGHT", bg: color.redDim, textColor: color.red, xOffset: "2%", yOffset: "51%" },
]

export function SectorRotation({ data }: SectorRotationProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 24, color: color.t4, fontFamily: SYS, fontSize: 14, textAlign: "center" }}>
        No sector rotation data available.
      </div>
    )
  }

  return (
    <div
      style={{
        background: color.bg2,
        border: `1px solid ${color.bd1}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
          Sector Rotation Matrix
        </div>
        <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1 }}>
          Momentum × Level Quadrant Analysis
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {QUADRANTS.map((q) => (
          <div key={q.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: q.bg, border: `1px solid ${q.textColor}` }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: q.textColor }}>{q.label}</span>
          </div>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid stroke={color.bd1} strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="momentum"
              domain={[-2.5, 2.5]}
              label={{ value: "Momentum →", position: "insideBottom", offset: -4, style: { fontFamily: MONO, fontSize: 10, fill: color.t4 } }}
              tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
              axisLine={{ stroke: color.bd2 }}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="level"
              domain={[-2.5, 2.5]}
              label={{ value: "Level", angle: -90, position: "insideLeft", style: { fontFamily: MONO, fontSize: 10, fill: color.t4 } }}
              tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
              axisLine={false}
              tickLine={false}
            />
            <ZAxis range={[80, 80]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <ReferenceLine x={0} stroke={color.bd3} strokeWidth={1.5} />
            <ReferenceLine y={0} stroke={color.bd3} strokeWidth={1.5} />
            <Scatter data={data} isAnimationActive={false}>
              {data.map((entry, i) => (
                <Cell key={i} fill={quadrantColor(entry.momentum, entry.level)} fillOpacity={0.85} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {QUADRANTS.map((q) => (
          <div
            key={q.label}
            style={{
              position: "absolute",
              top: q.yOffset,
              left: q.xOffset,
              background: q.bg,
              borderRadius: 6,
              padding: "3px 8px",
              fontFamily: MONO,
              fontSize: 9,
              fontWeight: 700,
              color: q.textColor,
              letterSpacing: "0.06em",
              pointerEvents: "none",
              opacity: 0.85,
            }}
          >
            {q.label}
          </div>
        ))}
      </div>
    </div>
  )
}
