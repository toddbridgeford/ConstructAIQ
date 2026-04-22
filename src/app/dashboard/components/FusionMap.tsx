"use client"
import { useState } from "react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
import { font, color } from "@/lib/theme"
import { SatelliteBadge } from "./SatelliteBadge"
import type { SatelliteMsa } from "./SatelliteHeatmap"

const MONO = font.mono
const SYS  = font.sys
const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

export interface FusionMsa extends SatelliteMsa {
  bbox: { west: number; south: number; east: number; north: number } | null
  federal_awards_90d: number | null
  storm_events_90d: number | null
}

interface TooltipState {
  x: number; y: number
  msa: FusionMsa
}

interface Props {
  msas: FusionMsa[]
}

function markerColor(cls: string): string {
  switch (cls) {
    case "DEMAND_DRIVEN":      return color.green
    case "FEDERAL_INVESTMENT": return color.blue
    case "RECONSTRUCTION":     return color.amber
    case "ORGANIC_GROWTH":     return color.t2
    default:                   return color.t4
  }
}

function markerOpacity(conf: string | null): number {
  if (conf === "HIGH")   return 1.0
  if (conf === "MEDIUM") return 0.7
  return 0.4
}

function markerRadius(bsiChange: number | null): number {
  return Math.max(4, Math.min(16, Math.abs(bsiChange ?? 0) * 0.75 + 4))
}

function fmtChg(v: number | null): string {
  if (v === null) return "—"
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`
}

const LEGEND_ITEMS = [
  { cls: "DEMAND_DRIVEN",      label: "Demand Driven" },
  { cls: "FEDERAL_INVESTMENT", label: "Federal Investment" },
  { cls: "RECONSTRUCTION",     label: "Reconstruction" },
  { cls: "ORGANIC_GROWTH",     label: "Organic Growth" },
]

export function FusionMap({ msas }: Props) {
  const [tooltip,   setTooltip]   = useState<TooltipState | null>(null)
  const [geoLoaded, setGeoLoaded] = useState(false)

  const placeable = msas.filter(m => m.bbox !== null)

  return (
    <div>
      {/* Map */}
      <div style={{ position: "relative", background: color.bg0, borderRadius: 12, overflow: "hidden" }}>
        {!geoLoaded && (
          <div style={{
            height: 360, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: MONO, fontSize: 12, color: color.t4,
          }}>
            Loading map…
          </div>
        )}

        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: "100%", height: "auto", display: geoLoaded ? "block" : "none" }}
        >
          {/* State fills */}
          <Geographies geography={GEO_URL}>
            {({ geographies, loading }) => {
              if (!loading && !geoLoaded) setGeoLoaded(true)
              return geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: color.bg1, stroke: color.bd1, strokeWidth: 0.5, outline: "none" },
                    hover:   { fill: color.bg2, stroke: color.bd2, strokeWidth: 0.5, outline: "none" },
                    pressed: { fill: color.bg1, outline: "none" },
                  }}
                />
              ))
            }}
          </Geographies>

          {/* MSA markers */}
          {placeable.map(msa => {
            const b   = msa.bbox!
            const lon = (b.west + b.east) / 2
            const lat = (b.south + b.north) / 2
            const r   = markerRadius(msa.bsi_change_90d)
            const col = markerColor(msa.classification)
            const opa = markerOpacity(msa.confidence)

            return (
              <Marker key={msa.msa_code} coordinates={[lon, lat]}>
                <circle
                  r={r}
                  fill={col}
                  fillOpacity={opa}
                  stroke={color.bg0}
                  strokeWidth={1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, msa })}
                  onMouseMove={(e)  => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setTooltip(null)}
                />
              </Marker>
            )
          })}
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y - 12,
            zIndex: 1000,
            background: color.bg1,
            border: `1px solid ${color.bd2}`,
            borderRadius: 10,
            padding: "12px 14px",
            minWidth: 220,
            pointerEvents: "none",
            boxShadow: "0 8px 32px rgba(0,0,0,0.56)",
          }}>
            <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: color.t1, marginBottom: 6 }}>
              {tooltip.msa.msa_name}
            </div>
            <div style={{ marginBottom: 8 }}>
              <SatelliteBadge classification={tooltip.msa.classification} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: color.t3, marginBottom: 4 }}>
              BSI 90d: <span style={{ color: color.t1, fontWeight: 600 }}>{fmtChg(tooltip.msa.bsi_change_90d)}</span>
            </div>
            {tooltip.msa.interpretation && (
              <div style={{ fontFamily: SYS, fontSize: 11.5, color: color.t3, lineHeight: 1.5, marginTop: 6, maxWidth: 240 }}>
                {tooltip.msa.interpretation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", gap: 16, flexWrap: "wrap",
        padding: "12px 4px 0",
        alignItems: "center",
      }}>
        {LEGEND_ITEMS.map(({ cls, label }) => (
          <div key={cls} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: markerColor(cls) }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, color: color.t4 }}>
          Size = activity magnitude
        </div>
      </div>
    </div>
  )
}
