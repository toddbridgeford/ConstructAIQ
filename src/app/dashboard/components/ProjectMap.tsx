"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
import { color, font, radius } from "@/lib/theme"
import type { Project } from "./ProjectFeed"

const SYS  = font.sys
const MONO = font.mono
const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

interface TooltipState {
  x: number
  y: number
  project: Project
}

interface Props {
  projects: Project[] | null
}

function markerSize(valuation: number | null): number {
  if (!valuation) return 4
  return Math.max(4, Math.min(20, Math.sqrt(valuation / 500_000) * 3))
}

function markerColor(cls: string | null): string {
  switch ((cls ?? '').toLowerCase()) {
    case 'commercial':  return color.amber
    case 'residential': return color.blue
    case 'industrial':  return color.green
    default:            return color.t3
  }
}

function fmtVal(v: number | null): string {
  if (v == null) return '—'
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)}M`
  return `$${(v / 1_000).toFixed(0)}K`
}

export function ProjectMap({ projects }: Props) {
  const router = useRouter()
  const [tooltip,   setTooltip]   = useState<TooltipState | null>(null)
  const [geoLoaded, setGeoLoaded] = useState(false)

  const placeable = (projects ?? []).filter(
    p => p.latitude != null && p.longitude != null
  )

  const LEGEND = [
    { cls: 'commercial',  label: 'Commercial' },
    { cls: 'residential', label: 'Residential' },
    { cls: 'industrial',  label: 'Industrial' },
    { cls: 'other',       label: 'Other' },
  ]

  return (
    <div>
      <div style={{ position: 'relative', background: color.bg0, borderRadius: radius.lg, overflow: 'hidden' }}>
        {!geoLoaded && (
          <div style={{
            height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: MONO, fontSize: 12, color: color.t4,
          }}>
            Loading map…
          </div>
        )}

        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: '100%', height: 'auto', display: geoLoaded ? 'block' : 'none' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies, loading }) => {
              if (!loading && !geoLoaded) setGeoLoaded(true)
              return geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: color.bg1, stroke: color.bd1, strokeWidth: 0.5, outline: 'none' },
                    hover:   { fill: color.bg2, stroke: color.bd2, strokeWidth: 0.5, outline: 'none' },
                    pressed: { fill: color.bg1, outline: 'none' },
                  }}
                />
              ))
            }}
          </Geographies>

          {placeable.map(p => (
            <Marker key={p.id} coordinates={[p.longitude!, p.latitude!]}>
              <circle
                r={markerSize(p.valuation)}
                fill={markerColor(p.building_class)}
                fillOpacity={0.75}
                stroke={color.bg0}
                strokeWidth={0.8}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, project: p })}
                onMouseMove={e  => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => router.push(`/projects/${p.id}`)}
              />
            </Marker>
          ))}
        </ComposableMap>

        {tooltip && (
          <div style={{
            position: 'fixed',
            left: tooltip.x + 14,
            top:  tooltip.y - 14,
            zIndex: 1000,
            background: color.bg1,
            border: `1px solid ${color.bd2}`,
            borderRadius: radius.lg,
            padding: '12px 14px',
            minWidth: 220,
            pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.56)',
          }}>
            <div style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t1, marginBottom: 4 }}>
              {tooltip.project.project_name ?? 'Project'}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: color.amber, marginBottom: 4 }}>
              {fmtVal(tooltip.project.valuation)}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>
              {tooltip.project.city}{tooltip.project.state_code ? `, ${tooltip.project.state_code}` : ''}
            </div>
            <div style={{
              marginTop: 6,
              fontFamily: MONO, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.06em',
              color: markerColor(tooltip.project.building_class),
            }}>
              {(tooltip.project.building_class ?? 'OTHER').toUpperCase()}
              {' · '}
              {(tooltip.project.status ?? '—').toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 4px 0', alignItems: 'center' }}>
        {LEGEND.map(({ cls, label }) => (
          <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: markerColor(cls) }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, color: color.t4 }}>
          Size = valuation · Click to open project
        </div>
      </div>
    </div>
  )
}
