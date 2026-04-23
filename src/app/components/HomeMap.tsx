"use client"
import { useState } from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { color, font } from "@/lib/theme"

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

const FIPS: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
  "10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL",
  "18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD",
  "25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE",
  "32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND",
  "39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD",
  "47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV",
  "55":"WI","56":"WY",
}

export interface MapState {
  code:      string
  name:      string
  signal:    string
  yoyChange: number
}

function stateFill(signal: string | undefined): string {
  switch (signal) {
    case 'HOT':       return color.greenMuted
    case 'GROWING':   return color.green
    case 'STABLE':    return color.amber
    case 'COOLING':   return color.orange
    case 'DECLINING': return color.red
    default:          return color.lightBgSkel
  }
}

interface Tip { x: number; y: number; name: string; signal: string; yoyChange: number }

export function HomeMap({ states }: { states: MapState[] }) {
  const [tip, setTip] = useState<Tip | null>(null)
  const byCode = new Map(states.map(s => [s.code, s]))

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <ComposableMap projection="geoAlbersUsa" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const code = FIPS[geo.id?.toString().padStart(2, '0') ?? '']
              const st   = code ? byCode.get(code) : undefined
              const fill = stateFill(st?.signal)
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={color.t1}
                  strokeWidth={0.8}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', opacity: 0.8, cursor: st ? 'pointer' : 'default' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={e => {
                    if (st) setTip({ x: e.clientX + 14, y: e.clientY - 10, name: st.name, signal: st.signal, yoyChange: st.yoyChange })
                  }}
                  onMouseMove={e => {
                    if (st) setTip({ x: e.clientX + 14, y: e.clientY - 10, name: st.name, signal: st.signal, yoyChange: st.yoyChange })
                  }}
                  onMouseLeave={() => setTip(null)}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {tip && (
        <div style={{
          position:     'fixed',
          left:         tip.x,
          top:          tip.y,
          background:   color.bg1,
          color:        color.t1,
          borderRadius: 8,
          padding:      '8px 12px',
          pointerEvents: 'none',
          zIndex:       500,
          boxShadow:    '0 4px 16px rgba(0,0,0,0.24)',
          fontFamily:   font.mono,
          fontSize:     12,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{tip.name}</div>
          <div style={{ color: color.t3 }}>
            {tip.signal} · {tip.yoyChange > 0 ? '+' : ''}{tip.yoyChange.toFixed(1)}% YoY
          </div>
        </div>
      )}
    </div>
  )
}
