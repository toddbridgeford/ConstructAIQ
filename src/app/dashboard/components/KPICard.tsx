"use client"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys

interface KPICardProps {
  label: string
  value: string
  mom: number
  yoy?: number
  sparkData?: number[]
  color?: string
  icon?: string
}

export function KPICard({ label, value, mom, yoy, sparkData, color: accentColor, icon }: KPICardProps) {
  const accent   = accentColor ?? color.amber
  const momPos   = mom >= 0
  const yoyPos   = (yoy ?? 0) >= 0

  const sparkPoints = sparkData && sparkData.length > 0
    ? sparkData.map((v, i) => ({ i, v }))
    : null

  return (
    <div style={{
      background: color.bg2,
      border:     `1px solid ${color.bd1}`,
      borderRadius: 16,
      padding:    16,
      display:    "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{
          fontFamily:    MONO,
          fontSize:      10,
          color:         color.t4,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1.1 }}>
        {value}
      </div>

      {/* MoM + YoY */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: SYS,
          fontSize:   12,
          fontWeight: 600,
          color:      momPos ? color.green : color.red,
        }}>
          {momPos ? "▲" : "▼"} {momPos ? "+" : ""}{mom.toFixed(2)}% MoM
        </span>
        {yoy != null && (
          <span style={{ fontFamily: SYS, fontSize: 11, color: color.t3 }}>
            {yoyPos ? "+" : ""}{yoy.toFixed(2)}% YoY
          </span>
        )}
      </div>

      {/* Sparkline */}
      {sparkPoints && (
        <div style={{ marginTop: 6, height: 24 }}>
          <ResponsiveContainer width="100%" height={24}>
            <LineChart data={sparkPoints}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={accent}
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
