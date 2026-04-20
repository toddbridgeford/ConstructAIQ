"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys

interface RecessionGaugeProps {
  probability: number
}

function barColor(p: number): string {
  if (p < 30) return color.green
  if (p < 60) return color.amber
  return color.red
}

function riskLabel(p: number): string {
  if (p < 30) return "LOW RISK"
  if (p < 60) return "MODERATE RISK"
  return "HIGH RISK"
}

function riskDesc(p: number): string {
  if (p < 30) return "Expansion conditions prevail. Contraction unlikely in the near term."
  if (p < 60) return "Mixed signals. Monitor leading indicators closely."
  return "Elevated risk of sector contraction. Defensive positioning advised."
}

export function RecessionGauge({ probability }: RecessionGaugeProps) {
  if (probability == null) {
    return (
      <div style={{ background: color.bg2, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}`, textAlign: "center", color: color.t4, fontFamily: MONO, fontSize: 13 }}>
        Loading contraction risk…
      </div>
    )
  }

  const clamped = Math.min(100, Math.max(0, probability))
  const col     = barColor(clamped)
  const label   = riskLabel(clamped)
  const desc    = riskDesc(clamped)

  return (
    <div style={{ background: color.bg2, borderRadius: 16, padding: 20, border: `1px solid ${color.bd1}` }}>
      {/* Header */}
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.amber, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 14 }}>
        CONTRACTION RISK — NEXT 6 MONTHS
      </div>

      {/* Probability + risk badge */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
        <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 700, color: col }}>
          {clamped.toFixed(0)}%
        </span>
        <span style={{
          fontFamily: MONO, fontSize: 11, fontWeight: 600,
          color: col,
          background: col + "22",
          border: `1px solid ${col}44`,
          borderRadius: 20,
          padding: "3px 10px",
          letterSpacing: "0.06em",
        }}>
          {label}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        {/* Track */}
        <div style={{ background: color.bg4, borderRadius: 6, height: 12, overflow: "hidden" }}>
          <div style={{
            background: `linear-gradient(90deg, ${color.green} 0%, ${color.amber} 50%, ${color.red} 100%)`,
            height: "100%",
            width: "100%",
            opacity: 0.25,
            borderRadius: 6,
          }} />
        </div>
        {/* Fill */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 12,
          width: `${clamped}%`,
          background: col,
          borderRadius: 6,
          transition: "width 0.6s ease",
        }} />
        {/* Tick marks at 30 and 60 */}
        {[30, 60].map(tick => (
          <div
            key={tick}
            style={{
              position: "absolute",
              top: 0,
              left: `${tick}%`,
              width: 1.5,
              height: 12,
              background: color.bg2,
              opacity: 0.8,
            }}
          />
        ))}
      </div>

      {/* Scale labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.green }}>LOW</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.amber }}>MODERATE</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.red }}>HIGH</span>
      </div>

      {/* Description */}
      <div style={{ fontFamily: SYS, fontSize: 12, color: color.t3, lineHeight: 1.5, borderTop: `1px solid ${color.bd1}`, paddingTop: 12 }}>
        {desc}
      </div>

      {/* Zone thresholds */}
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        {[
          { range: "0–29%",  label: "Low",      col: color.green },
          { range: "30–59%", label: "Moderate", col: color.amber },
          { range: "60–100%",label: "High",     col: color.red   },
        ].map(z => (
          <div key={z.range} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: z.col }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>{z.range}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
