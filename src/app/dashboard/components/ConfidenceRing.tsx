"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono

interface ConfidenceRingProps {
  value: number
  label: string
}

function ringColor(v: number): string {
  if (v > 80) return color.green
  if (v > 60) return color.amber
  return color.red
}

export function ConfidenceRing({ value, label }: ConfidenceRingProps) {
  if (value == null) {
    return (
      <div style={{ background: color.bg2, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}`, textAlign: "center", color: color.t4, fontFamily: MONO, fontSize: 13 }}>
        Loading…
      </div>
    )
  }

  const radius        = 45
  const circumference = 2 * Math.PI * radius
  const clamped       = Math.min(100, Math.max(0, value))
  const dashoffset    = circumference - (clamped / 100) * circumference
  const stroke        = ringColor(clamped)

  return (
    <div style={{
      background: color.bg2,
      borderRadius: 16,
      padding: 20,
      border: `1px solid ${color.bd1}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.amber, fontWeight: 600, letterSpacing: "0.08em", alignSelf: "flex-start" }}>
        MODEL CONFIDENCE
      </div>

      <svg viewBox="0 0 120 120" width={120} height={120} style={{ overflow: "visible" }}>
        {/* Background ring */}
        <circle
          cx={60}
          cy={60}
          r={radius}
          fill="none"
          stroke={color.bd2}
          strokeWidth={10}
        />
        {/* Value arc — rotated so it starts at top (-90°) */}
        <circle
          cx={60}
          cy={60}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />

        {/* Center value */}
        <text
          x={60}
          y={55}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={22}
          fontWeight={700}
          fill={stroke}
        >
          {clamped.toFixed(0)}%
        </text>
        <text
          x={60}
          y={70}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={9}
          fill={color.t4}
          letterSpacing="0.06em"
        >
          {label.toUpperCase()}
        </text>
      </svg>

      {/* Color key */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { label: ">80% HIGH",    col: color.green },
          { label: "60-80% MED",  col: color.amber },
          { label: "<60% LOW",    col: color.red   },
        ].map(({ label: l, col }) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: col }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
