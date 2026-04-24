"use client"
import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { font, color } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono
const REFRESH_MS = 4 * 60 * 60 * 1000

// ── Theme helpers ─────────────────────────────────────────────────────────────

function bg(dark: boolean, transparent: boolean) {
  if (transparent) return "transparent"
  return dark ? color.bg1 : "#fff"
}
function sub(dark: boolean) { return dark ? color.t4  : "#888" }

// ── Signal color scale ────────────────────────────────────────────────────────

function signalFill(signal: string, dark: boolean): string {
  switch (signal) {
    case "HOT":     return color.green
    case "GROWING": return "#1a7f37"   // greenMuted
    case "STABLE":  return dark ? color.bg4 : "#d4d4d4"
    case "COOLING": return color.red
    default:        return dark ? color.bg3 : "#ccc"
  }
}

// ── State lat/lng centroids (contiguous 48 + DC) ─────────────────────────────
// Projected onto a 540×290 SVG canvas at left=30, top=30

const LAT_MIN = 24.4, LAT_MAX = 49.5
const LNG_MIN = -124.8, LNG_MAX = -66.9
const MAP_W = 540, MAP_H = 280

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W + 30
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H + 44
  return [x, y]
}

// Approximate geographic centroids
const STATE_CENTERS: Array<{ code: string; lat: number; lng: number }> = [
  { code: "AL", lat: 32.8,  lng: -86.8  },
  { code: "AZ", lat: 34.3,  lng: -111.1 },
  { code: "AR", lat: 34.7,  lng: -92.4  },
  { code: "CA", lat: 36.8,  lng: -119.4 },
  { code: "CO", lat: 39.1,  lng: -105.4 },
  { code: "CT", lat: 41.6,  lng: -72.8  },
  { code: "DE", lat: 39.0,  lng: -75.5  },
  { code: "FL", lat: 27.8,  lng: -81.6  },
  { code: "GA", lat: 32.2,  lng: -82.9  },
  { code: "ID", lat: 44.4,  lng: -114.6 },
  { code: "IL", lat: 40.0,  lng: -89.2  },
  { code: "IN", lat: 40.3,  lng: -86.1  },
  { code: "IA", lat: 42.1,  lng: -93.5  },
  { code: "KS", lat: 38.5,  lng: -98.4  },
  { code: "KY", lat: 37.7,  lng: -84.3  },
  { code: "LA", lat: 31.1,  lng: -91.8  },
  { code: "ME", lat: 44.7,  lng: -69.3  },
  { code: "MD", lat: 39.1,  lng: -76.8  },
  { code: "MA", lat: 42.4,  lng: -71.6  },
  { code: "MI", lat: 44.4,  lng: -85.4  },
  { code: "MN", lat: 46.4,  lng: -93.2  },
  { code: "MS", lat: 32.7,  lng: -89.7  },
  { code: "MO", lat: 38.5,  lng: -92.5  },
  { code: "MT", lat: 47.0,  lng: -110.5 },
  { code: "NE", lat: 41.5,  lng: -99.8  },
  { code: "NV", lat: 38.5,  lng: -117.1 },
  { code: "NH", lat: 43.5,  lng: -71.6  },
  { code: "NJ", lat: 40.1,  lng: -74.4  },
  { code: "NM", lat: 34.5,  lng: -106.1 },
  { code: "NY", lat: 42.2,  lng: -75.4  },
  { code: "NC", lat: 35.5,  lng: -79.4  },
  { code: "ND", lat: 47.5,  lng: -100.5 },
  { code: "OH", lat: 40.4,  lng: -82.7  },
  { code: "OK", lat: 35.6,  lng: -96.9  },
  { code: "OR", lat: 44.1,  lng: -120.5 },
  { code: "PA", lat: 40.6,  lng: -77.2  },
  { code: "RI", lat: 41.5,  lng: -71.5  },
  { code: "SC", lat: 33.8,  lng: -80.9  },
  { code: "SD", lat: 44.4,  lng: -100.3 },
  { code: "TN", lat: 35.9,  lng: -86.7  },
  { code: "TX", lat: 31.5,  lng: -99.3  },
  { code: "UT", lat: 39.3,  lng: -111.1 },
  { code: "VT", lat: 44.1,  lng: -72.7  },
  { code: "VA", lat: 37.8,  lng: -78.5  },
  { code: "WA", lat: 47.4,  lng: -120.5 },
  { code: "WV", lat: 38.6,  lng: -80.6  },
  { code: "WI", lat: 44.2,  lng: -90.0  },
  { code: "WY", lat: 43.0,  lng: -107.5 },
]

// ── Map data type ─────────────────────────────────────────────────────────────

interface StateRow {
  code:      string
  name:      string
  yoyChange: number
  signal:    string
  intensity: number
}

// ── Watermark ─────────────────────────────────────────────────────────────────

function Watermark({ dark }: { dark: boolean }) {
  return (
    <a
      href="https://constructaiq.trade"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none" }}
    >
      <span style={{
        fontFamily: MONO, fontSize: 9, color: dark ? color.t4 : "#aaa",
        letterSpacing: "0.06em",
      }}>
        POWERED BY CONSTRUCTAIQ →
      </span>
    </a>
  )
}

// ── State bubble map SVG ──────────────────────────────────────────────────────

function StateBubbleMap({ states, dark }: { states: StateRow[]; dark: boolean }) {
  const stateMap = new Map(states.map(s => [s.code, s]))
  const R = 13  // bubble radius

  return (
    <svg
      viewBox={`0 0 600 370`}
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      {/* AK inset */}
      <circle cx={42} cy={330} r={R} fill={signalFill(stateMap.get("AK")?.signal ?? "", dark)} opacity={0.9} />
      <text x={42} y={334} textAnchor="middle" fontSize={7} fill="#fff" fontFamily={MONO} fontWeight="bold">AK</text>

      {/* HI inset */}
      <circle cx={94} cy={330} r={R} fill={signalFill(stateMap.get("HI")?.signal ?? "", dark)} opacity={0.9} />
      <text x={94} y={334} textAnchor="middle" fontSize={7} fill="#fff" fontFamily={MONO} fontWeight="bold">HI</text>

      {/* Contiguous states */}
      {STATE_CENTERS.map(({ code, lat, lng }) => {
        const [x, y] = project(lat, lng)
        const s = stateMap.get(code)
        const fill = signalFill(s?.signal ?? "", dark)
        return (
          <g key={code}>
            <circle cx={x} cy={y} r={R} fill={fill} opacity={0.9} />
            <text
              x={x} y={y + 3.5}
              textAnchor="middle"
              fontSize={7}
              fill="#fff"
              fontFamily={MONO}
              fontWeight="bold"
            >
              {code}
            </text>
          </g>
        )
      })}

      {/* AK/HI separator line */}
      <line x1={68} y1={312} x2={68} y2={348} stroke={dark ? color.bd2 : "#ccc"} strokeWidth={0.5} />
    </svg>
  )
}

// ── Map card ─────────────────────────────────────────────────────────────────

function MapCard({ dark, transparent }: { dark: boolean; transparent: boolean }) {
  const [states, setStates] = useState<StateRow[] | null>(null)
  const [err, setErr]       = useState(false)

  const load = useCallback(() => {
    fetch("/api/map")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setStates(d.states ?? []); setErr(false) })
      .catch(() => setErr(true))
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    const origin = (() => {
      if (!document.referrer) return "direct"
      try { return new URL(document.referrer).hostname } catch { return "direct" }
    })()
    fetch("/api/embed/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widget_type: "map", origin_domain: origin }),
    }).catch(() => {})
  }, [])

  return (
    <div style={{
      width: 600, height: 400,
      background: bg(dark, transparent),
      border: transparent ? "none" : `1px solid ${dark ? color.bd1 : color.lightBd}`,
      borderRadius: 12,
      padding: "14px 16px 12px",
      boxSizing: "border-box", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.amber, letterSpacing: "0.1em" }}>
          US STATE CONSTRUCTION ACTIVITY · PERMIT GROWTH YoY
        </span>
        {states && (
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "HOT", clr: color.green },
              { label: "GROWING", clr: "#1a7f37" },
              { label: "STABLE", clr: dark ? color.bg4 : "#bbb" },
              { label: "COOLING", clr: color.red },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.clr }} />
                <span style={{ fontFamily: MONO, fontSize: 7, color: sub(dark) }}>{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        {states ? (
          <StateBubbleMap states={states} dark={dark} />
        ) : err ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: MONO, fontSize: 10, color: color.red }}>
            Map data unavailable
          </div>
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: dark ? color.bg3 : color.lightBgSkel,
            borderRadius: 8, animation: "pulse 1.4s ease-in-out infinite",
          }} />
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontFamily: MONO, fontSize: 8, color: sub(dark) }}>
          Source: Census Bureau building permits · ConstructAIQ
        </span>
        <Watermark dark={dark} />
      </div>
    </div>
  )
}

// ── Inner ─────────────────────────────────────────────────────────────────────

function Inner() {
  const sp = useSearchParams()
  const dark        = sp.get("theme") !== "light"
  const transparent = sp.get("bg") === "transparent"

  return (
    <div style={{
      minHeight: "100vh", minWidth: "100vw",
      background: transparent ? "transparent" : bg(dark, false),
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <MapCard dark={dark} transparent={transparent} />
    </div>
  )
}

export default function MapEmbed() {
  return (
    <Suspense fallback={
      <div style={{ width: 600, height: 400, background: color.bg1, borderRadius: 12 }} />
    }>
      <Inner />
    </Suspense>
  )
}
