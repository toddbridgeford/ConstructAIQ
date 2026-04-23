'use client'
import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { color, font } from '@/lib/theme'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

interface MsaRow {
  msa_code:       string
  msa_name:       string
  bsi_change_90d: number | null
  classification: string
  confidence:     string
}

interface Props {
  msas:        MsaRow[]
  selectedMsa: string | null
  onMsaClick:  (code: string) => void
}

const MSA_CENTERS: Record<string, [number, number]> = {
  NYC: [-74.00,  40.71],
  LAX: [-118.24, 34.05],
  CHI: [-87.63,  41.88],
  DFW: [-97.03,  32.78],
  HOU: [-95.37,  29.76],
  PHX: [-112.07, 33.45],
  PHL: [-75.16,  39.95],
  ATL: [-84.39,  33.75],
  MIA: [-80.19,  25.77],
  SEA: [-122.33, 47.61],
  DEN: [-104.99, 39.74],
  BOS: [-71.06,  42.36],
  TPA: [-82.46,  27.95],
  SAN: [-117.16, 32.72],
  LAS: [-115.14, 36.17],
  MSP: [-93.27,  44.98],
  ORL: [-81.38,  28.54],
  STL: [-90.20,  38.63],
  CLT: [-80.84,  35.23],
  AUS: [-97.74,  30.27],
}

function classColor(c: string): string {
  if (c === 'DEMAND_DRIVEN')      return color.green
  if (c === 'FEDERAL_INVESTMENT') return '#0066CC'
  if (c === 'RECONSTRUCTION')     return color.amber
  if (c === 'ORGANIC_GROWTH')     return color.t2
  return color.t4
}

function markerRadius(change: number | null): number {
  if (change === null) return 5
  const abs = Math.abs(change)
  if (abs > 40) return 16
  if (abs > 25) return 12
  if (abs > 10) return 9
  return 6
}

export function SatelliteMap({ msas, selectedMsa, onMsaClick }: Props) {
  const [tooltip, setTooltip] = useState<{
    name: string; classification: string; change: string;
    x: number; y: number
  } | null>(null)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ComposableMap
        projection="geoAlbersUsa"
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={color.bg2}
                  stroke={color.bd1}
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', fill: color.bg3 },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {msas.map(msa => {
            const center = MSA_CENTERS[msa.msa_code]
            if (!center) return null
            const r   = markerRadius(msa.bsi_change_90d)
            const col = classColor(msa.classification)
            const isSelected = selectedMsa === msa.msa_code
            return (
              <Marker
                key={msa.msa_code}
                coordinates={center}
                onClick={() => onMsaClick(msa.msa_code)}
                onMouseEnter={e => setTooltip({
                  name: msa.msa_name,
                  classification: msa.classification.replace(/_/g, ' '),
                  change: msa.bsi_change_90d !== null
                    ? (msa.bsi_change_90d > 0 ? '+' : '') +
                      msa.bsi_change_90d.toFixed(1) + '%'
                    : 'No data',
                  x: (e as unknown as MouseEvent).clientX,
                  y: (e as unknown as MouseEvent).clientY,
                })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={isSelected ? r + 3 : r}
                  fill={col + (isSelected ? 'ff' : 'cc')}
                  stroke={isSelected ? color.t1 : col}
                  strokeWidth={isSelected ? 2 : 1}
                />
              </Marker>
            )
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top:  tooltip.y - 8,
          background: color.bg1,
          border: '1px solid ' + color.bd1,
          borderRadius: 8,
          padding: '8px 12px',
          pointerEvents: 'none',
          zIndex: 999,
        }}>
          <div style={{ fontFamily: font.sys, fontSize: 13, color: color.t1, fontWeight: 600 }}>
            {tooltip.name}
          </div>
          <div style={{ fontFamily: font.mono, fontSize: 11, color: color.t3, marginTop: 2 }}>
            {tooltip.classification} · {tooltip.change}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        display: 'flex', gap: 12, alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Demand Driven',      col: color.green },
          { label: 'Federal Investment', col: '#0066CC'   },
          { label: 'Reconstruction',     col: color.amber },
          { label: 'Organic Growth',     col: color.t2    },
        ].map(({ label, col }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col }} />
            <span style={{ fontFamily: font.mono, fontSize: 10, color: color.t4, letterSpacing: '0.05em' }}>
              {label}
            </span>
          </div>
        ))}
        <span style={{ fontFamily: font.mono, fontSize: 10, color: color.t4, marginLeft: 4 }}>
          Circle size = activity magnitude
        </span>
      </div>
    </div>
  )
}
