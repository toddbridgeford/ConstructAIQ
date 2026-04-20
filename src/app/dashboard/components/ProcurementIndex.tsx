"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

interface ProcurementIndexProps {
  value: number // 0-100
}

function scoreColor(v: number): string {
  if (v >= 70) return color.green
  if (v >= 40) return color.amber
  return color.red
}

function scoreLabel(v: number): string {
  if (v >= 70) return "FAVORABLE PROCUREMENT CONDITIONS"
  if (v >= 40) return "MIXED — SELECTIVE PURCHASING"
  return "HIGH COST PRESSURE — DELAY WHERE POSSIBLE"
}

export function ProcurementIndex({ value }: ProcurementIndexProps) {
  const clamped = Math.min(100, Math.max(0, value ?? 0))
  const col = scoreColor(clamped)
  const label = scoreLabel(clamped)

  return (
    <div style={{
      background: color.bg2,
      border: `1px solid ${color.bd1}`,
      borderRadius: 16,
      padding: 24,
    }}>
      {/* Header */}
      <div style={{
        fontFamily: MONO,
        fontSize: 11,
        color: color.t4,
        letterSpacing: "0.08em",
        marginBottom: 16,
      }}>
        COMPOSITE PROCUREMENT CONDITIONS INDEX
      </div>

      {/* Large score */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 48, fontWeight: 700, color: col, lineHeight: 1 }}>
          {clamped.toFixed(0)}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 16, color: color.t4 }}>/100</span>
      </div>

      {/* Label */}
      <div style={{
        display: "inline-block",
        background: col + "22",
        border: `1px solid ${col}55`,
        borderRadius: 8,
        padding: "4px 12px",
        fontFamily: MONO,
        fontSize: 12,
        fontWeight: 700,
        color: col,
        letterSpacing: "0.06em",
        marginBottom: 18,
      }}>
        {label}
      </div>

      {/* Progress bar */}
      <div style={{ position: "relative", marginBottom: 6 }}>
        <div style={{ background: color.bg4, borderRadius: 6, height: 14, overflow: "hidden" }}>
          <div style={{
            background: `linear-gradient(90deg, ${color.red} 0%, ${color.amber} 40%, ${color.green} 70%, ${color.green} 100%)`,
            height: "100%",
            width: "100%",
            opacity: 0.2,
            borderRadius: 6,
          }} />
        </div>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 14,
          width: `${clamped}%`,
          background: col,
          borderRadius: 6,
          transition: "width 0.6s ease",
        }} />
        {[40, 70].map(tick => (
          <div key={tick} style={{
            position: "absolute",
            top: 0,
            left: `${tick}%`,
            width: 2,
            height: 14,
            background: color.bg2,
            opacity: 0.9,
          }} />
        ))}
      </div>

      {/* Scale labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.red }}>HIGH PRESSURE</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.amber }}>MIXED</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.green }}>FAVORABLE</span>
      </div>

      {/* Zone thresholds */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", borderTop: `1px solid ${color.bd1}`, paddingTop: 12 }}>
        {[
          { range: "0–39", label: "High Pressure", col: color.red },
          { range: "40–69", label: "Mixed", col: color.amber },
          { range: "70–100", label: "Favorable", col: color.green },
        ].map(z => (
          <div key={z.range} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: z.col }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>{z.range} — {z.label}</span>
          </div>
        ))}
      </div>

      {/* Updated note */}
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 10 }}>
        Updated: hourly
      </div>
    </div>
  )
}
