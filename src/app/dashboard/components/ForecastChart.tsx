"use client"
import { font, color } from "@/lib/theme"
import type { ForecastData } from "../types"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3, BG4 = color.bg4
const BD1       = color.bd1,      BD2 = color.bd2, BD3 = color.bd3
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

export function ForecastChart({ foreData, width = 620, height = 220 }: {
  foreData: ForecastData | null; width?: number; height?: number
}) {
  if (!foreData) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: SYS, fontSize: 15, color: T4 }}>Loading forecast…</div>
    </div>
  )

  const PAD = { top: 16, right: 16, bottom: 40, left: 60 }
  const W = width - PAD.left - PAD.right
  const H = height - PAD.top - PAD.bottom

  // Use live history from API response; fall back to last forecast point repeated
  const hist = (foreData.history ?? []).slice(-12)
  const ensemble = foreData.ensemble ?? []
  const fcst = ensemble.slice(0, 12).map(p => ({ base: p.base, lo80: p.lo80, hi80: p.hi80, lo95: p.lo95, hi95: p.hi95 }))

  const allVals = [
    ...hist,
    ...fcst.map(p => p.hi95),
    ...fcst.map(p => p.lo95),
  ].filter(Number.isFinite)

  if (!allVals.length) return null

  const yMin   = Math.min(...allVals) * 0.995
  const yMax   = Math.max(...allVals) * 1.005
  const yRange = yMax - yMin

  const xPos = (i: number, total: number) => PAD.left + (i / (total - 1)) * W
  const yPos = (v: number)                => PAD.top + H - ((v - yMin) / yRange) * H

  const totalPoints = hist.length + fcst.length
  const histPts = hist.map((v, i) => ({ x: xPos(i, totalPoints), y: yPos(v) }))
  const fcstPts = fcst.map((p, i) => ({
    x:    xPos(hist.length + i, totalPoints),
    base: yPos(p.base),
    lo80: yPos(p.lo80),
    hi80: yPos(p.hi80),
    lo95: yPos(p.lo95),
    hi95: yPos(p.hi95),
  }))

  const bridge = { x: histPts[histPts.length - 1].x, y: histPts[histPts.length - 1].y }

  const histPath     = "M" + histPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")
  const allFcst      = [bridge, ...fcstPts]
  const fcstBasePath = "M" + allFcst.map(p => `${p.x.toFixed(1)},${ ('base' in p ? p.base : p.y).toFixed(1)}`).join("L")

  const band80Top  = allFcst.map(p => `${p.x.toFixed(1)},${ ('lo80' in p ? p.lo80 : p.y).toFixed(1)}`).join("L")
  const band80Bot  = [...allFcst].reverse().map(p => `${p.x.toFixed(1)},${ ('hi80' in p ? p.hi80 : p.y).toFixed(1)}`).join("L")
  const band80Path = `M${band80Top}L${band80Bot}Z`

  const band95Top  = allFcst.map(p => `${p.x.toFixed(1)},${ ('lo95' in p ? p.lo95 : p.y).toFixed(1)}`).join("L")
  const band95Bot  = [...allFcst].reverse().map(p => `${p.x.toFixed(1)},${ ('hi95' in p ? p.hi95 : p.y).toFixed(1)}`).join("L")
  const band95Path = `M${band95Top}L${band95Bot}Z`

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({ v: yMin + t * yRange, y: PAD.top + H - t * H }))

  const today   = new Date()
  const xLabels = Array.from({ length: totalPoints }, (_, i) => {
    if (i % 3 !== 0) return null
    const d = new Date(today.getFullYear(), today.getMonth() - hist.length + i + 1, 1)
    return { label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), x: xPos(i, totalPoints) }
  }).filter(Boolean) as { label: string; x: number }[]

  const lastHistX = histPts[histPts.length - 1].x
  const models    = foreData.models ?? []
  const hw        = models.find(m => m.model === "holt-winters")
  const sar       = models.find(m => m.model === "sarima")
  const xgb       = models.find(m => m.model === "xgboost")

  return (
    <div>
      <svg width="100%" viewBox={"0 0 " + width + " " + height} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={AMBER} stopOpacity="0.6" />
            <stop offset="100%" stopColor={AMBER} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map(function(t, i) {
          return <line key={i} x1={PAD.left} y1={t.y} x2={PAD.left + W} y2={t.y} stroke={BD1} strokeWidth={1} />
        })}

        {/* Forecast divider */}
        <line x1={lastHistX} y1={PAD.top} x2={lastHistX} y2={PAD.top + H}
          stroke={BD2} strokeWidth={1} strokeDasharray="4,3" />
        <text x={lastHistX + 4} y={PAD.top + 14} fill={T4} fontSize="11" fontFamily={MONO}>FORECAST</text>

        {/* 95% band */}
        <path d={band95Path} fill={AMBER} fillOpacity="0.06" />
        {/* 80% band */}
        <path d={band80Path} fill={AMBER} fillOpacity="0.12" />

        {/* Historical line */}
        <path d={histPath} fill="none" stroke="url(#histGrad)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Forecast base line */}
        <path d={fcstBasePath} fill="none" stroke={AMBER} strokeWidth={2} strokeDasharray="6,3" strokeLinejoin="round" />

        {/* Y-axis labels */}
        {yTicks.map(function(t, i) {
          return (
            <text key={i} x={PAD.left - 6} y={t.y + 4} fill={T4} fontSize="11" fontFamily={MONO} textAnchor="end">
              {(t.v / 1000).toFixed(1)}K
            </text>
          )
        })}

        {/* X-axis labels */}
        {xLabels.map(function(l, i) {
          return (
            <text key={i} x={l.x} y={height - 8} fill={T4} fontSize="11" fontFamily={MONO} textAnchor="middle">
              {l.label}
            </text>
          )
        })}

        {/* Last hist dot */}
        <circle cx={bridge.x} cy={bridge.y} r={4} fill={AMBER} />

        {/* Axis */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top+H} stroke={BD2} strokeWidth={1} />
        <line x1={PAD.left} y1={PAD.top+H} x2={PAD.left+W} y2={PAD.top+H} stroke={BD2} strokeWidth={1} />
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 2.5, background: AMBER, borderRadius: 2 }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>Historical</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 2, borderTop: "2px dashed " + AMBER }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>Ensemble Forecast</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 10, background: AMBER, opacity: 0.25, borderRadius: 2 }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>80% CI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 10, background: AMBER, opacity: 0.1, borderRadius: 2 }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>95% CI</span>
        </div>
      </div>

      {/* Model weights */}
      {(hw || sar || xgb) && (
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { label: "HW", model: hw, color: GREEN },
            { label: "XGB", model: xgb, color: BLUE },
            { label: "SARIMA", model: sar, color: AMBER },
          ].filter(function(m){ return m.model }).map(function(m, i) {
            return (
              <div key={i} style={{
                background: BG3, borderRadius: 8, padding: "6px 12px",
                border: "1px solid " + BD1, display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                <span style={{ fontFamily: MONO, fontSize: 12, color: T3 }}>
                  {m.label} {Math.round((m.model.weight || 0) * 100)}% · MAPE {m.model.mape}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
