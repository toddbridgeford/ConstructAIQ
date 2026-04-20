"use client"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

interface CommodityCardProps {
  name: string
  icon: string
  value: number
  unit: string
  signal: "BUY" | "SELL" | "HOLD"
  mom7d: number
  mom30d: number
  mom90d: number
  sparkData: number[]
}

function signalStyle(signal: "BUY" | "SELL" | "HOLD") {
  if (signal === "BUY") return { bg: color.greenDim, border: color.green, text: color.green }
  if (signal === "SELL") return { bg: color.redDim, border: color.red, text: color.red }
  return { bg: color.amberDim, border: color.amber, text: color.amber }
}

function changePillColor(val: number) {
  if (val > 0) return color.green
  if (val < 0) return color.red
  return color.t4
}

function fmtChange(val: number) {
  return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`
}

export function CommoditySignalCard({ name, icon, value, unit, signal, mom7d, mom30d, mom90d, sparkData }: CommodityCardProps) {
  const sig = signalStyle(signal)
  const sparkPoints = (sparkData ?? []).map((v, i) => ({ i, v }))
  const sparkColor = signal === "BUY" ? color.green : signal === "SELL" ? color.red : color.amber

  return (
    <div style={{
      background: color.bg2,
      border: `1px solid ${color.bd1}`,
      borderRadius: 16,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* Top row: name + icon + signal badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t2 }}>{name}</span>
        </div>
        <div style={{
          background: sig.bg,
          border: `1px solid ${sig.border}`,
          borderRadius: 8,
          padding: "3px 10px",
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 700,
          color: sig.text,
          letterSpacing: "0.06em",
        }}>{signal}</div>
      </div>

      {/* Large value + unit */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: color.t1 }}>
          {value.toFixed(1)}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: color.t4 }}>{unit}</span>
      </div>

      {/* Three change pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { label: "7D", val: mom7d },
          { label: "30D", val: mom30d },
          { label: "90D", val: mom90d },
        ].map(p => (
          <div key={p.label} style={{
            background: color.bg3,
            border: `1px solid ${color.bd1}`,
            borderRadius: 6,
            padding: "3px 8px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>{p.label}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: changePillColor(p.val) }}>
              {fmtChange(p.val)}
            </span>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      {sparkPoints.length > 0 && (
        <div style={{ height: 28, marginTop: 2 }}>
          <ResponsiveContainer width="100%" height={28}>
            <LineChart data={sparkPoints}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
