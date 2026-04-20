"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono

interface CycleClockProps {
  position: number    // 0-360 degrees
  history: number[]   // last 6 positions in degrees
}

const CX = 80, CY = 80, R = 60

function degToRad(d: number) { return (d - 90) * (Math.PI / 180) }

function polarToXY(angle: number, radius: number) {
  const rad = degToRad(angle)
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) }
}

function sectorPath(startDeg: number, endDeg: number, r: number): string {
  const s = polarToXY(startDeg, r)
  const e = polarToXY(endDeg, r)
  const large = (endDeg - startDeg) > 180 ? 1 : 0
  return [
    `M ${CX} ${CY}`,
    `L ${s.x.toFixed(2)} ${s.y.toFixed(2)}`,
    `A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`,
    "Z",
  ].join(" ")
}

// Label position: midpoint of sector arc
function labelPos(startDeg: number, endDeg: number, r: number) {
  const mid = (startDeg + endDeg) / 2
  return polarToXY(mid, r)
}

const QUADRANTS = [
  { start: 0,   end: 90,  label: "EARLY\nEXPANSION",   fill: color.green,  fillOpacity: 0.18, line1: "EARLY", line2: "EXPANSION"  },
  { start: 90,  end: 180, label: "FULL\nEXPANSION",    fill: color.green,  fillOpacity: 0.30, line1: "FULL",  line2: "EXPANSION"  },
  { start: 180, end: 270, label: "EARLY\nCONTRACTION", fill: color.amber,  fillOpacity: 0.22, line1: "EARLY", line2: "CONTRACTION"},
  { start: 270, end: 360, label: "FULL\nCONTRACTION",  fill: color.red,    fillOpacity: 0.22, line1: "FULL",  line2: "CONTRACTION"},
]

function quadrantAtDeg(deg: number) {
  const d = ((deg % 360) + 360) % 360
  if (d < 90)  return QUADRANTS[0]
  if (d < 180) return QUADRANTS[1]
  if (d < 270) return QUADRANTS[2]
  return QUADRANTS[3]
}

export function CycleClock({ position, history }: CycleClockProps) {
  if (position == null) {
    return (
      <div style={{ background: color.bg2, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}`, textAlign: "center", color: color.t4, fontFamily: MONO, fontSize: 13 }}>
        Loading cycle position…
      </div>
    )
  }

  const normPos  = ((position % 360) + 360) % 360
  const current  = quadrantAtDeg(normPos)
  const needle   = polarToXY(normPos, R - 4)
  const histDots = (history ?? []).slice(-6)

  return (
    <div style={{ background: color.bg2, borderRadius: 16, padding: 20, border: `1px solid ${color.bd1}` }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.amber, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 14 }}>
        SECTOR CYCLE CLOCK
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg viewBox="0 0 160 160" width={160} height={160} style={{ flexShrink: 0 }}>
          {/* Quadrant sectors */}
          {QUADRANTS.map(q => (
            <path
              key={q.start}
              d={sectorPath(q.start, q.end, R)}
              fill={q.fill}
              fillOpacity={q.fillOpacity}
              stroke={color.bd2}
              strokeWidth={0.5}
            />
          ))}

          {/* Outer ring */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={color.bd2} strokeWidth={1} />

          {/* Cross hairs */}
          <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke={color.bd2} strokeWidth={0.5} strokeDasharray="3 3" />
          <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke={color.bd2} strokeWidth={0.5} strokeDasharray="3 3" />

          {/* Quadrant text labels */}
          {QUADRANTS.map(q => {
            const pos = labelPos(q.start, q.end, R * 0.60)
            return (
              <g key={`lbl-${q.start}`}>
                <text x={pos.x} y={pos.y - 5} textAnchor="middle" fontFamily={MONO} fontSize={6} fill={q.fill} fontWeight={600} opacity={0.9}>
                  {q.line1}
                </text>
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontFamily={MONO} fontSize={6} fill={q.fill} fontWeight={600} opacity={0.9}>
                  {q.line2}
                </text>
              </g>
            )
          })}

          {/* History trail dots */}
          {histDots.map((deg, idx) => {
            const norm = ((deg % 360) + 360) % 360
            const p    = polarToXY(norm, R - 8)
            const opacity = 0.2 + (idx / histDots.length) * 0.5
            return (
              <circle key={`hist-${idx}`} cx={p.x} cy={p.y} r={3} fill={color.t3} opacity={opacity} />
            )
          })}

          {/* Trail line connecting history dots */}
          {histDots.length > 1 && (
            <polyline
              points={histDots.map(deg => {
                const norm = ((deg % 360) + 360) % 360
                const p    = polarToXY(norm, R - 8)
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
              }).join(" ")}
              fill="none"
              stroke={color.t4}
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={0.5}
            />
          )}

          {/* Needle line */}
          <line
            x1={CX} y1={CY}
            x2={needle.x} y2={needle.y}
            stroke={color.t1}
            strokeWidth={1.5}
            strokeLinecap="round"
          />

          {/* Current position dot */}
          <circle cx={needle.x} cy={needle.y} r={5} fill={color.amber} />
          <circle cx={needle.x} cy={needle.y} r={5} fill="none" stroke={color.t1} strokeWidth={1} />

          {/* Center hub */}
          <circle cx={CX} cy={CY} r={4} fill={color.bg4} stroke={color.bd3} strokeWidth={1} />
        </svg>

        {/* Right side info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.06em", marginBottom: 6 }}>
            CURRENT PHASE
          </div>
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: current.fill, marginBottom: 4 }}>
            {current.line1} {current.line2}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: color.t3, marginBottom: 14 }}>
            {normPos.toFixed(0)}° position
          </div>

          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.06em", marginBottom: 8 }}>
            PHASE GUIDE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {QUADRANTS.map(q => (
              <div key={q.start} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: q.fill, opacity: q.fillOpacity * 3 }} />
                <span style={{ fontFamily: MONO, fontSize: 9, color: q.start === Math.floor(normPos / 90) * 90 ? q.fill : color.t4 }}>
                  {q.start}–{q.end}° {q.line1} {q.line2}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
