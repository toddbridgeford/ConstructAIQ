"use client"
import { color, font } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys

// Colors mapped to scale positions 1–5
const SEG_COLORS = [
  color.red,          // 1 — very negative
  color.amber,        // 2 — negative
  color.t3,           // 3 — neutral
  color.green + "99", // 4 — positive (60% opacity)
  color.green,        // 5 — very positive
]

interface Props {
  question: string
  distribution: Record<string, number>  // keys "1"–"5", values are percentages
  labels: string[]                       // 5 labels for the legend
}

export function SurveyDistribution({ question, distribution, labels }: Props) {
  // Normalise: pull values in order 1→5
  const raw = [1, 2, 3, 4, 5].map(k => distribution[String(k)] ?? 0)
  const total = raw.reduce((a, b) => a + b, 0) || 100
  const pcts  = raw.map(v => (v / total) * 100)

  // SVG coordinate space
  const W = 1000
  const H = 40

  // Compute x positions
  const widths = pcts.map(p => (p / 100) * W)
  const xs: number[] = []
  let cursor = 0
  for (const w of widths) { xs.push(cursor); cursor += w }

  return (
    <div>
      <div style={{ fontFamily: SYS, fontSize: 12, color: color.t3, marginBottom: 8 }}>
        {question}
      </div>

      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: "block", borderRadius: 6, overflow: "hidden" }}
      >
        {widths.map((w, i) => {
          if (w < 1) return null
          const pct = pcts[i]
          return (
            <g key={i}>
              <rect
                x={xs[i]}
                y={0}
                width={w}
                height={H}
                fill={SEG_COLORS[i]}
              />
              {pct >= 10 && (
                <text
                  x={xs[i] + w / 2}
                  y={H / 2 + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily={MONO}
                  fill={i === 2 ? color.bg1 : "#fff"}
                  fillOpacity={0.9}
                >
                  {Math.round(pct)}%
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
        {labels.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: 2, flexShrink: 0,
              background: SEG_COLORS[i],
            }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.06em" }}>
              {label} ({Math.round(pcts[i])}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
