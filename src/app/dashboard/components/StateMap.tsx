"use client"
import { useState } from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

const FIPS_TO_CODE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY",
}

export interface StateData {
  code: string
  name: string
  permits: number
  yoyChange: number
  employment: number
  signal: string
}

interface StateMapProps {
  states: StateData[]
  onStateClick: (stateCode: string) => void
  selectedState: string | null
}

function signalColor(signal: string, yoyChange: number): string {
  if (signal === "HOT" || yoyChange > 10) return "#1a7f37"
  if (signal === "GROWING" || yoyChange >= 3) return color.green
  if (signal === "NEUTRAL" || (yoyChange >= -3 && yoyChange <= 3)) return color.amber
  if (signal === "COOLING" || yoyChange <= -3) return "#ff9500"
  if (signal === "DECLINING" || yoyChange < -10) return color.red
  return color.bd2
}

const LEGEND = [
  { label: "HOT (>10%)", fill: "#1a7f37" },
  { label: "GROWING (3–10%)", fill: color.green },
  { label: "NEUTRAL (±3%)", fill: color.amber },
  { label: "COOLING (−3–−10%)", fill: "#ff9500" },
  { label: "DECLINING (<−10%)", fill: color.red },
]

interface TooltipState {
  x: number
  y: number
  name: string
  signal: string
  yoy: number
  employment: number
  fill: string
}

export function StateMap({ states, onStateClick, selectedState }: StateMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [loaded, setLoaded] = useState(false)

  const stateMap = new Map(states.map(s => [s.code, s]))

  return (
    <div style={{ background: color.bg2, border: `1px solid ${color.bd1}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.08em", marginBottom: 12 }}>
        50-STATE CONSTRUCTION ACTIVITY
      </div>

      {!loaded && (
        <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: color.t4, fontFamily: MONO, fontSize: 13 }}>
          Loading map…
        </div>
      )}

      <div style={{ position: "relative" }}>
        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: "100%", height: "auto", display: loaded ? "block" : "none" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies, loading: geoLoading }) => {
              if (!geoLoading && !loaded) setLoaded(true)
              return geographies.map((geo) => {
                const fips = geo.id as string
                const code = FIPS_TO_CODE[fips] ?? ""
                const stateData = stateMap.get(code)
                const fill = stateData ? signalColor(stateData.signal, stateData.yoyChange) : color.bd2
                const isSelected = selectedState === code

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => code && onStateClick(code)}
                    onMouseEnter={(e) => {
                      if (!stateData) return
                      setTooltip({
                        x: e.clientX,
                        y: e.clientY,
                        name: stateData.name,
                        signal: stateData.signal,
                        yoy: stateData.yoyChange,
                        employment: stateData.employment,
                        fill,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: {
                        fill,
                        stroke: isSelected ? "#fff" : color.bg0,
                        strokeWidth: isSelected ? 1.5 : 0.5,
                        outline: "none",
                        cursor: code ? "pointer" : "default",
                        transition: "fill 0.15s",
                      },
                      hover: {
                        fill,
                        stroke: "#fff",
                        strokeWidth: 1.5,
                        outline: "none",
                        opacity: 0.85,
                        cursor: "pointer",
                      },
                      pressed: { fill, outline: "none" },
                    }}
                  />
                )
              })
            }}
          </Geographies>
        </ComposableMap>

        {tooltip && (
          <div style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: color.bg3,
            border: `1px solid ${color.bd2}`,
            borderRadius: 10,
            padding: "10px 14px",
            zIndex: 9999,
            pointerEvents: "none",
            minWidth: 160,
          }}>
            <div style={{ fontFamily: SYS, fontSize: 13, fontWeight: 700, color: color.t1, marginBottom: 6 }}>{tooltip.name}</div>
            <div style={{
              display: "inline-block",
              background: tooltip.fill + "33",
              border: `1px solid ${tooltip.fill}`,
              borderRadius: 6,
              padding: "2px 8px",
              fontFamily: MONO,
              fontSize: 10,
              color: tooltip.fill,
              marginBottom: 6,
            }}>{tooltip.signal}</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: color.t3 }}>
              YoY: <span style={{ color: tooltip.yoy >= 0 ? color.green : color.red }}>
                {tooltip.yoy >= 0 ? "+" : ""}{tooltip.yoy.toFixed(1)}%
              </span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: color.t3 }}>
              Employment: {tooltip.employment.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
        {LEGEND.map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.fill }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
