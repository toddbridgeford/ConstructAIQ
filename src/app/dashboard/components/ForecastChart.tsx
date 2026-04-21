"use client"
import { useState, useEffect } from "react"
import { font, color } from "@/lib/theme"
import type { ForecastData } from "../types"

const MONO  = font.mono
const SYS   = font.sys
const AMBER = color.amber
const GREEN = color.green
const BLUE  = color.blue
const BD1   = color.bd1, BD2 = color.bd2
const T1    = color.t1,  T3  = color.t3, T4 = color.t4

// Fixed viewBox dimensions — SVG scales via width="100%"
const VW = 620, VH = 480
const PAD = { top: 20, right: 24, bottom: 40, left: 60 }
const W = VW - PAD.left - PAD.right   // 536
const H = VH - PAD.top  - PAD.bottom  // 420

const SERIES_OPTIONS = [
  { id: "TTLCONS",       label: "Total Spending"  },
  { id: "HOUST",         label: "Housing Starts"  },
  { id: "PERMIT",        label: "Permits"         },
  { id: "CES2000000001", label: "Employment"      },
]

export function ForecastChart({ foreData, scenarioLine }: {
  foreData:     ForecastData | null
  scenarioLine?: number[] | null
}) {
  const [activeSeries, setActiveSeries] = useState("TTLCONS")
  const [localData,    setLocalData]    = useState<ForecastData | null>(foreData)
  const [fetching,     setFetching]     = useState(false)

  useEffect(() => { setLocalData(foreData) }, [foreData])

  async function switchSeries(id: string) {
    if (id === activeSeries && localData) return
    setActiveSeries(id)
    setFetching(true)
    try {
      const r = await fetch(`/api/forecast?series=${id}`)
      if (r.ok) setLocalData(await r.json())
    } finally {
      setFetching(false)
    }
  }

  // Series selector — always visible (even during load)
  const seriesBar = (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
      {SERIES_OPTIONS.map(s => {
        const on = activeSeries === s.id
        return (
          <button key={s.id} onClick={() => switchSeries(s.id)}
            style={{
              padding:"6px 18px", borderRadius:99,
              border:`1px solid ${on ? AMBER : BD1}`,
              background: on ? AMBER + "18" : "transparent",
              fontFamily:SYS, fontSize:13, letterSpacing:"-0.01em",
              fontWeight: on ? 600 : 400,
              color: on ? AMBER : T3,
              cursor:"pointer", transition:"all 0.15s",
            }}>
            {s.label}
          </button>
        )
      })}
      {fetching && (
        <span style={{ fontFamily:MONO, fontSize:11, color:T4, alignSelf:"center" }}>loading…</span>
      )}
    </div>
  )

  if (!localData) return (
    <div>
      {seriesBar}
      <div style={{ height:VH, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontFamily:MONO, fontSize:12, color:T4, letterSpacing:"0.08em" }}>
          LOADING FORECAST…
        </span>
      </div>
    </div>
  )

  const hist     = (localData.history ?? []).slice(-12)
  const ensemble = localData.ensemble ?? []
  const fcst     = ensemble.slice(0, 12).map(p => ({
    base: p.base, lo80: p.lo80, hi80: p.hi80, lo95: p.lo95, hi95: p.hi95,
  }))

  const allVals = [
    ...hist,
    ...fcst.map(p => p.hi95),
    ...fcst.map(p => p.lo95),
    ...(scenarioLine ?? []),
  ].filter(Number.isFinite)

  if (!allVals.length) return <div>{seriesBar}</div>

  const yMin   = Math.min(...allVals) * 0.995
  const yMax   = Math.max(...allVals) * 1.005
  const yRange = yMax - yMin

  const xPos = (i: number, total: number) => PAD.left + (i / (total - 1)) * W
  const yPos = (v: number)                => PAD.top  + H - ((v - yMin) / yRange) * H

  const totalPoints = hist.length + fcst.length
  const histPts = hist.map((v, i) => ({ x: xPos(i, totalPoints), y: yPos(v) }))
  const fcstPts = fcst.map((p, i) => ({
    x:    xPos(hist.length + i, totalPoints),
    base: yPos(p.base),
    lo80: yPos(p.lo80), hi80: yPos(p.hi80),
    lo95: yPos(p.lo95), hi95: yPos(p.hi95),
  }))

  const bridge  = histPts[histPts.length - 1]
  const allFcst = [bridge, ...fcstPts]

  const pt = (p: typeof allFcst[0], key: "x"|"y"|"base"|"lo80"|"hi80"|"lo95"|"hi95") =>
    key in p ? (p as Record<string, number>)[key].toFixed(1) : (p as {x:number;y:number}).y.toFixed(1)

  const histPath     = "M" + histPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")
  const fcstBasePath = "M" + allFcst.map(p => `${pt(p,"x")},${pt(p,"base")}`).join("L")
  const band80Path   = `M${allFcst.map(p => `${pt(p,"x")},${pt(p,"lo80")}`).join("L")}` +
                       `L${[...allFcst].reverse().map(p => `${pt(p,"x")},${pt(p,"hi80")}`).join("L")}Z`
  const band95Path   = `M${allFcst.map(p => `${pt(p,"x")},${pt(p,"lo95")}`).join("L")}` +
                       `L${[...allFcst].reverse().map(p => `${pt(p,"x")},${pt(p,"hi95")}`).join("L")}Z`

  // Scenario overlay — dashed amber line from bridge through adjusted forecast values
  const scenPts = scenarioLine && scenarioLine.length > 0 && bridge
    ? [{ x: bridge.x, y: bridge.y }, ...scenarioLine.slice(0, fcst.length).map((v, i) => ({
        x: xPos(hist.length + i, totalPoints), y: yPos(v),
      }))]
    : null
  const scenPath = scenPts
    ? "M" + scenPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")
    : null

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    v: yMin + t * yRange, y: PAD.top + H - t * H,
  }))

  const today   = new Date()
  const xLabels = Array.from({ length: totalPoints }, (_, i) => {
    if (i % 3 !== 0) return null
    const d = new Date(today.getFullYear(), today.getMonth() - hist.length + i + 1, 1)
    return { label: d.toLocaleDateString("en-US", { month:"short", year:"2-digit" }), x: xPos(i, totalPoints) }
  }).filter(Boolean) as { label: string; x: number }[]

  const lastHistX    = bridge.x
  const lastFcstBase = fcstPts.length > 0 ? fcstPts[fcstPts.length - 1].base : bridge.y
  const lastFcstX    = fcstPts.length > 0 ? fcstPts[fcstPts.length - 1].x    : bridge.x
  const deltaVal     = fcst.length > 0 && hist.length > 0
    ? ((fcst[fcst.length - 1].base - hist[hist.length - 1]) / hist[hist.length - 1]) * 100
    : null

  // Model weight strip values
  const metrics = localData.metrics
  const hwW    = Math.round((metrics?.hwWeight    ?? 0) * 100)
  const sarW   = Math.round((metrics?.sarimaWeight ?? 0) * 100)
  const xgbW   = Math.round((metrics?.xgboostWeight ?? 0) * 100)
  const mapeV  = (metrics?.mape ?? 0).toFixed(1)
  const nV     = localData.trainedOn ?? metrics?.n ?? 0

  const legendItems = [
    { col: AMBER, label: "Historical",    opacity: 1    },
    { col: BLUE,  label: "AI Forecast",   opacity: 1    },
    { col: BLUE,  label: "80% CI",        opacity: 0.5  },
    { col: BLUE,  label: "95% CI",        opacity: 0.25 },
    ...(scenPath ? [{ col: AMBER, label: "Scenario", opacity: 0.75 }] : []),
  ]

  return (
    <div style={{ opacity: fetching ? 0.65 : 1, transition: "opacity 0.2s" }}>
      {seriesBar}

      <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ overflow:"visible", display:"block" }}>
        <defs>
          <linearGradient id="fg-hist-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={AMBER} stopOpacity="0.5" />
            <stop offset="100%" stopColor={AMBER} stopOpacity="1"   />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTicks.map((t, i) => (
          <line key={i} x1={PAD.left} y1={t.y} x2={PAD.left + W} y2={t.y}
                stroke={BD1} strokeWidth={0.5} />
        ))}

        {/* Forecast region tint */}
        <rect x={lastHistX} y={PAD.top} width={PAD.left + W - lastHistX} height={H}
              fill={BLUE} fillOpacity={0.04} />

        {/* Forecast divider */}
        <line x1={lastHistX} y1={PAD.top} x2={lastHistX} y2={PAD.top + H}
              stroke={BD2} strokeWidth={1} strokeDasharray="4,3" />
        <text x={lastHistX + 6} y={PAD.top + 12} fill={T4} fontSize="9"
              fontFamily={MONO} letterSpacing="0.08em" fillOpacity="0.55">FORECAST</text>

        {/* Confidence bands */}
        <path d={band95Path} fill={BLUE} fillOpacity="0.08" />
        <path d={band80Path} fill={BLUE} fillOpacity="0.20" />

        {/* Historical line */}
        <path d={histPath} fill="none" stroke="url(#fg-hist-grad)"
              strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Forecast base line */}
        <path d={fcstBasePath} fill="none" stroke={BLUE}
              strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Scenario overlay — dashed amber */}
        {scenPath && (
          <path d={scenPath} fill="none" stroke={AMBER}
                strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
                strokeDasharray="6,3" opacity={0.9} />
        )}

        {/* Bridge dot */}
        <circle cx={bridge.x} cy={bridge.y} r={4.5} fill={AMBER} />

        {/* Forecast end dot */}
        {fcstPts.length > 0 && (
          <circle cx={lastFcstX} cy={lastFcstBase} r={4.5} fill={BLUE} />
        )}

        {/* Delta annotation */}
        {deltaVal !== null && fcstPts.length > 0 && (
          <text x={lastFcstX + 8} y={lastFcstBase - 6}
                fill={deltaVal >= 0 ? GREEN : color.red}
                fontSize="11" fontFamily={MONO} fontWeight="600">
            {deltaVal >= 0 ? "+" : ""}{deltaVal.toFixed(1)}%
          </text>
        )}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={PAD.left - 6} y={t.y + 4} fill={T4} fontSize="10"
                fontFamily={MONO} textAnchor="end">
            {(t.v / 1000).toFixed(1)}K
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={VH - 8} fill={T4} fontSize="10"
                fontFamily={MONO} textAnchor="middle">{l.label}</text>
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top}     x2={PAD.left}     y2={PAD.top + H} stroke={BD2} strokeWidth={1} />
        <line x1={PAD.left} y1={PAD.top + H} x2={PAD.left + W} y2={PAD.top + H} stroke={BD2} strokeWidth={1} />
      </svg>

      {/* Legend */}
      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginTop:10, paddingLeft:PAD.left }}>
        {legendItems.map(({ col, label, opacity }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:18, height:3, background:col, borderRadius:2, opacity }} />
            <span style={{ fontFamily:MONO, fontSize:10, color:T4 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Model weight strip */}
      {(hwW + sarW + xgbW > 0) && (
        <div style={{ marginTop:8, paddingLeft:PAD.left, fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.04em" }}>
          HW {hwW}% · SARIMA {sarW}% · XGB {xgbW}% · MAPE {mapeV}% · {nV} months trained
        </div>
      )}
    </div>
  )
}
