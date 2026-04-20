"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys

interface CSHIGaugeProps {
  score: number
  weeklyChange: number
  classification: string
  subScores: Record<string, { score: number; weight: number; label: string }>
}

function zoneColor(val: number): string {
  if (val < 30) return color.red
  if (val < 50) return "#ff9500"
  if (val < 70) return color.amber
  return color.green
}

function polarToXY(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const s = polarToXY(cx, cy, r, startAngle)
  const e = polarToXY(cx, cy, r, endAngle)
  const large = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

const CX = 100, CY = 100, R = 78, R_THIN = 72
const START = -Math.PI, END = 0

// Zone boundaries mapped to angles
const ZONES = [
  { from: 0,  to: 30,  fill: color.red },
  { from: 30, to: 50,  fill: "#ff9500" },
  { from: 50, to: 70,  fill: color.amber },
  { from: 70, to: 100, fill: color.green },
]

function scoreAngle(v: number) { return START + (v / 100) * Math.PI }

export function CSHIGauge({ score, weeklyChange, classification, subScores }: CSHIGaugeProps) {
  if (score == null) {
    return (
      <div style={{ background: color.bg2, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}`, textAlign: "center", color: color.t4, fontFamily: MONO, fontSize: 13 }}>
        Loading CSHI…
      </div>
    )
  }

  const needleAngle = scoreAngle(Math.min(100, Math.max(0, score)))
  const needleTip = polarToXY(CX, CY, R - 8, needleAngle)
  const scoreCol = zoneColor(score)
  const changePos = weeklyChange >= 0

  const subList = Object.values(subScores ?? {})

  return (
    <div style={{ background: color.bg2, borderRadius: 16, padding: 20, border: `1px solid ${color.bd1}` }}>
      {/* Weekly change badge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
        <div style={{
          background: changePos ? color.greenDim : color.redDim,
          border: `1px solid ${changePos ? color.green : color.red}44`,
          borderRadius: 20, padding: "3px 12px",
          fontFamily: MONO, fontSize: 11, color: changePos ? color.green : color.red,
        }}>
          {changePos ? "▲" : "▼"} {changePos ? "+" : ""}{weeklyChange.toFixed(1)} this week
        </div>
      </div>

      {/* SVG Gauge */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox="0 0 200 120" width="100%" style={{ maxWidth: 320 }}>
          {/* Background arc */}
          <path d={arcPath(CX, CY, R_THIN, START, END)} fill="none" stroke={color.bd2} strokeWidth={10} strokeLinecap="round" />

          {/* Colored zone arcs */}
          {ZONES.map(z => (
            <path
              key={z.from}
              d={arcPath(CX, CY, R_THIN, scoreAngle(z.from), scoreAngle(z.to))}
              fill="none"
              stroke={z.fill}
              strokeWidth={10}
              strokeLinecap="round"
              opacity={0.35}
            />
          ))}

          {/* Score arc overlay */}
          <path
            d={arcPath(CX, CY, R_THIN, START, needleAngle)}
            fill="none"
            stroke={scoreCol}
            strokeWidth={10}
            strokeLinecap="round"
          />

          {/* Needle */}
          <line
            x1={CX} y1={CY}
            x2={needleTip.x} y2={needleTip.y}
            stroke={color.t1}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle cx={CX} cy={CY} r={5} fill={scoreCol} />

          {/* Center text */}
          <text x={CX} y={92} textAnchor="middle" fontFamily={MONO} fontSize={22} fontWeight={700} fill={scoreCol}>
            {score.toFixed(1)}
          </text>
          <text x={CX} y={105} textAnchor="middle" fontFamily={MONO} fontSize={8} fill={color.t4} letterSpacing="0.08em">
            {classification}
          </text>

          {/* Min/Max labels */}
          <text x={18} y={108} fontFamily={MONO} fontSize={8} fill={color.t4}>0</text>
          <text x={178} y={108} fontFamily={MONO} fontSize={8} fill={color.t4}>100</text>
        </svg>
      </div>

      {/* Sub-score bars */}
      {subList.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {subList.map((sub) => (
            <div key={sub.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontFamily: SYS, fontSize: 11, color: color.t3 }}>{sub.label}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{sub.weight}%</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: zoneColor(sub.score), fontWeight: 600 }}>{sub.score.toFixed(0)}</span>
                </div>
              </div>
              <div style={{ background: color.bg4, borderRadius: 3, height: 4 }}>
                <div style={{ background: zoneColor(sub.score), height: "100%", width: `${sub.score}%`, borderRadius: 3, transition: "width 0.5s ease" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
