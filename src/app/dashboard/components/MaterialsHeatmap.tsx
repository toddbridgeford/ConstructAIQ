"use client"
import { useState } from "react"
import { font, color, heatmap } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

interface MonthCell {
  month: string
  value: number
  pctChange: number
}

interface CommodityRow {
  commodity: string
  months: MonthCell[]
}

interface MaterialsHeatmapProps {
  data?: CommodityRow[]
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function cellColor(pct: number): string {
  if (pct > 5) return heatmap.veryHighBg
  if (pct > 2) return heatmap.highBg
  if (pct >= -2) return heatmap.neutralBg
  if (pct >= -5) return heatmap.lowBg
  return heatmap.veryLowBg
}

function cellTextColor(pct: number): string {
  if (pct > 5) return heatmap.veryHighTc
  if (pct > 2) return heatmap.highTc
  if (pct >= -2) return color.t3
  if (pct >= -5) return heatmap.lowTc
  return heatmap.veryLowTc
}

interface TooltipInfo {
  x: number
  y: number
  commodity: string
  month: string
  value: number
  pctChange: number
}

export function MaterialsHeatmap({ data }: MaterialsHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const rows = (data && data.length > 0) ? data : []

  const CELL_W = 44
  const CELL_H = 32
  const LABEL_W = 76

  if (rows.length === 0) {
    return (
      <div style={{
        background: color.bg1,
        borderRadius: 12,
        border: `1px solid ${color.bd1}`,
        padding: '32px',
        textAlign: 'center',
        fontFamily: font.sys,
        fontSize: 14,
        color: color.t4,
        lineHeight: 1.6,
      }}>
        <div style={{ marginBottom: 8, fontFamily: font.mono, fontSize: 11, letterSpacing: '0.08em' }}>
          MATERIALS DATA
        </div>
        Material price data unavailable.
        Configure BLS_API_KEY in Vercel to enable
        live commodity price tracking.
        <div style={{ marginTop: 12 }}>
          <a href="/materials" style={{ color: color.amber, textDecoration: 'none', fontSize: 13 }}>
            View materials page →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: color.bg2,
      border: `1px solid ${color.bd1}`,
      borderRadius: 16,
      padding: 20,
      position: "relative",
    }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.08em", marginBottom: 16 }}>
        MATERIALS COST HEATMAP — 12-MONTH VIEW
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: LABEL_W + CELL_W * 12 }}>
          {/* Column headers */}
          <div style={{ display: "flex", marginLeft: LABEL_W, marginBottom: 4 }}>
            {MONTH_LABELS.map(m => (
              <div key={m} style={{
                width: CELL_W,
                textAlign: "center",
                fontFamily: MONO,
                fontSize: 9,
                color: color.t4,
                flexShrink: 0,
              }}>{m}</div>
            ))}
          </div>

          {/* Rows */}
          {rows.map(row => (
            <div key={row.commodity} style={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
              {/* Row label */}
              <div style={{
                width: LABEL_W,
                fontFamily: MONO,
                fontSize: 10,
                color: color.t3,
                flexShrink: 0,
                paddingRight: 8,
                textAlign: "right",
              }}>
                {row.commodity}
              </div>
              {/* Cells */}
              {row.months.map((cell, i) => {
                const bg = cellColor(cell.pctChange)
                const tc = cellTextColor(cell.pctChange)
                return (
                  <div
                    key={i}
                    style={{
                      width: CELL_W,
                      height: CELL_H,
                      background: bg,
                      borderRadius: 4,
                      marginRight: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "default",
                      flexShrink: 0,
                      border: `1px solid ${color.bd1}`,
                    }}
                    onMouseEnter={e => setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      commodity: row.commodity,
                      month: cell.month,
                      value: cell.value,
                      pctChange: cell.pctChange,
                    })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 9, color: tc }}>
                      {cell.pctChange > 0 ? "+" : ""}{cell.pctChange.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 14,
          top: tooltip.y - 12,
          background: color.bg3,
          border: `1px solid ${color.bd2}`,
          borderRadius: 10,
          padding: "10px 14px",
          zIndex: 9999,
          pointerEvents: "none",
          minWidth: 150,
        }}>
          <div style={{ fontFamily: SYS, fontSize: 12, fontWeight: 700, color: color.t1, marginBottom: 4 }}>
            {tooltip.commodity} — {tooltip.month}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t3 }}>
            Value: <span style={{ color: color.t1 }}>{tooltip.value.toFixed(2)}</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t3 }}>
            Change:{" "}
            <span style={{ color: tooltip.pctChange > 0 ? color.red : color.green }}>
              {tooltip.pctChange > 0 ? "+" : ""}{tooltip.pctChange.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>COST PRESSURE:</span>
        {[
          { label: "Very High (>5%)", bg: heatmap.veryHighBg, tc: heatmap.veryHighTc },
          { label: "High (2–5%)",     bg: heatmap.highBg,    tc: heatmap.highTc    },
          { label: "Stable (±2%)",    bg: heatmap.neutralBg, tc: color.t3          },
          { label: "Low (−2–−5%)",    bg: heatmap.lowBg,     tc: heatmap.lowTc     },
          { label: "Very Low (<−5%)", bg: heatmap.veryLowBg, tc: heatmap.veryLowTc },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.bg }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
