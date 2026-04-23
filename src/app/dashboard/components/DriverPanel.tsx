"use client"
import { useState }          from "react"
import { color, font, type as TS } from "@/lib/theme"
import type { DriverAnalysis, DriverComponent } from "@/app/api/driver-analysis/route"

const SYS  = font.sys
const MONO = font.mono

interface Props {
  seriesId: string
}

export function DriverPanel({ seriesId }: Props) {
  const [open,    setOpen]    = useState(false)
  const [data,    setData]    = useState<DriverAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(false)

  async function expand() {
    setOpen(true)
    if (data || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/driver-analysis?series=${seriesId}`)
      if (!res.ok) throw new Error("non-2xx")
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 12, marginBottom: 4 }}>
      {!open ? (
        <button
          onClick={expand}
          style={{
            background:    "transparent",
            border:        `1px solid ${color.bd1}`,
            borderRadius:  8,
            padding:       "8px 16px",
            fontFamily:    SYS,
            fontSize:      13,
            color:         color.amber,
            cursor:        "pointer",
            display:       "flex",
            alignItems:    "center",
            gap:           6,
          }}
        >
          What&apos;s driving this? ▾
        </button>
      ) : (
        <div style={{
          background:   color.bg1,
          border:       `1px solid ${color.bd1}`,
          borderRadius: 12,
          padding:      "20px 24px",
        }}>
          {loading && (
            <p style={{ fontFamily: SYS, fontSize: 13, color: color.t3, margin: 0 }}>
              Analyzing drivers…
            </p>
          )}

          {error && (
            <p style={{ fontFamily: SYS, fontSize: 13, color: color.red, margin: 0 }}>
              Analysis unavailable — data pipeline may be loading.
            </p>
          )}

          {data && (
            <>
              {/* Summary */}
              <p style={{
                fontFamily:   SYS,
                fontSize:     14,
                fontWeight:   600,
                color:        color.t1,
                margin:       "0 0 18px",
                lineHeight:   1.5,
              }}>
                {data.driver_summary}
              </p>

              {/* Components */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                {data.components.map(c => (
                  <ComponentRow key={c.series_id} c={c} />
                ))}
              </div>

              {/* Macro context */}
              <div style={{
                borderTop:  `1px solid ${color.bd1}`,
                paddingTop: 14,
                display:    "flex",
                flexDirection: "column",
                gap:        6,
              }}>
                {data.macro_context.map((bullet, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{
                      fontFamily:    MONO,
                      fontSize:      10,
                      color:         color.t4,
                      marginTop:     2,
                      flexShrink:    0,
                    }}>
                      ·
                    </span>
                    <span style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.5 }}>
                      {bullet}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Collapse */}
          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop:   16,
              background:  "transparent",
              border:      "none",
              fontFamily:  SYS,
              fontSize:    12,
              color:       color.t4,
              cursor:      "pointer",
              padding:     0,
            }}
          >
            ▴ Hide analysis
          </button>
        </div>
      )}
    </div>
  )
}

function ComponentRow({ c }: { c: DriverComponent }) {
  const arrow    = c.direction === "GROWING" ? "↑" : c.direction === "DECLINING" ? "↓" : "→"
  const arrowClr = c.direction === "GROWING" ? color.green : c.direction === "DECLINING" ? color.red : color.t3
  const sign     = c.current_yoy >= 0 ? "+" : ""
  const pctLabel = `${sign}${c.current_yoy.toFixed(1)}% YoY`
  const barPct   = Math.round(c.share_of_total * 100)

  return (
    <div>
      {/* Name + direction */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t1 }}>
          {c.name}
        </span>
        <span style={{
          fontFamily:    MONO,
          fontSize:      12,
          color:         arrowClr,
          fontWeight:    600,
          letterSpacing: "0.02em",
        }}>
          {arrow} {c.direction}
        </span>
        <span style={{
          fontFamily:    MONO,
          fontSize:      11,
          color:         arrowClr,
          marginLeft:    "auto",
        }}>
          {pctLabel}
        </span>
      </div>

      {/* Share bar */}
      <div style={{ marginBottom: 6 }}>
        <div style={{
          height:       4,
          borderRadius: 2,
          background:   color.bg2,
          overflow:     "hidden",
        }}>
          <div style={{
            height:       "100%",
            width:        `${barPct}%`,
            background:   arrowClr,
            borderRadius: 2,
            opacity:      0.7,
          }} />
        </div>
        <span style={{
          fontFamily:    MONO,
          fontSize:      10,
          color:         color.t4,
          letterSpacing: "0.04em",
          display:       "block",
          marginTop:     3,
        }}>
          {barPct}% of total
        </span>
      </div>

      {/* Note */}
      <p style={{
        fontFamily: SYS,
        fontSize:   12,
        color:      color.t3,
        margin:     0,
        lineHeight: 1.55,
      }}>
        {c.note}
      </p>
    </div>
  )
}
