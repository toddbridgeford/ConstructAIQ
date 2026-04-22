"use client"
import { color, font } from "@/lib/theme"
import { CityPermitDetail, type CityPermitData } from "./CityPermitDetail"

interface NationalTotal {
  cities_covered: number; latest_month_count: number
  latest_month_valuation: number; yoy_change_pct: number | null
}

export interface PermitApiResponse {
  cities:         CityPermitData[]
  national_total: NationalTotal | null
  as_of:          string
}

interface Props {
  data:           PermitApiResponse | null
  selectedCity:   string | null
  onCitySelect:   (cityCode: string | null) => void
}

function fmtVal(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${Math.round(v / 1e6)}M`
  return `$${v.toLocaleString()}`
}

function YoYBadge({ pct }: { pct: number | null }) {
  if (pct == null) return null
  const up   = pct >= 0
  const high = pct >= 10
  const bg   = high ? color.greenDim : up ? color.amberDim : color.redDim
  const fg   = high ? color.green    : up ? color.amber    : color.red
  return (
    <span style={{ fontFamily: font.mono, fontSize: 10, color: fg, background: bg, borderRadius: 6, padding: '2px 6px', flexShrink: 0, letterSpacing: '0.02em' }}>
      {up ? '▲' : '▼'} {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

export function CityPermitMap({ data, selectedCity, onCitySelect }: Props) {
  const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1, BD2 = color.bd2
  const T1 = color.t1, T3 = color.t3, T4 = color.t4
  const MONO = font.mono, SYS = font.sys
  const BLUE = color.blue

  const cities   = data?.cities ?? []
  const sorted   = [...cities].sort((a, b) => (b.latest_month?.permit_count ?? 0) - (a.latest_month?.permit_count ?? 0))
  const maxCount = sorted[0]?.latest_month?.permit_count ?? 1

  const selCity = selectedCity ? cities.find(c => c.city_code === selectedCity) ?? null : null

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>

      {/* LEFT — City ranking (55% of width) */}
      <div style={{ flex: '11 1 320px', minWidth: 0, background: BG1, borderRadius: 20, border: `1px solid ${BD1}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px 12px', borderBottom: `1px solid ${BD2}` }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: '0.1em' }}>
            PERMIT ACTIVITY RANKING
          </span>
        </div>

        {sorted.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: SYS, fontSize: 14, color: T4 }}>
            No permit data yet — cron runs daily at 05:00 UTC
          </div>
        ) : (
          sorted.map((city, idx) => {
            const count   = city.latest_month?.permit_count ?? 0
            const val     = city.latest_month?.total_valuation ?? 0
            const barPct  = maxCount > 0 ? (count / maxCount) * 100 : 0
            const active  = city.city_code === selectedCity

            return (
              <button
                key={city.city_code}
                onClick={() => onCitySelect(active ? null : city.city_code)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: active ? BG2 : 'transparent',
                  border: 'none', borderBottom: `1px solid ${BD2}`,
                  padding: '10px 24px', cursor: 'pointer', minHeight: 52,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = BG2 }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Row top: rank + name + badge + value */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: T4, width: 16, flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: T1, flex: 1, minWidth: 0 }}>
                    {city.city_name}, {city.state_code}
                  </span>
                  <YoYBadge pct={city.yoy_change_pct} />
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T4, flexShrink: 0, minWidth: 44, textAlign: 'right' }}>
                    {val > 0 ? fmtVal(val) : '—'}
                  </span>
                </div>
                {/* Bar + count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
                  <div style={{ flex: 1, height: 4, background: BD1, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${barPct}%`, background: BLUE, borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T3, flexShrink: 0, minWidth: 44, textAlign: 'right' }}>
                    {count > 0 ? count.toLocaleString() : '—'}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* RIGHT — Detail panel (45% of width) */}
      <div style={{ flex: '9 1 280px', minWidth: 0, background: BG1, borderRadius: 20, border: `1px solid ${BD1}`, padding: 24 }}>
        {selCity ? (
          <CityPermitDetail cityCode={selectedCity!} cityData={selCity} />
        ) : (
          <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: SYS, fontSize: 15, color: T4, marginBottom: 6 }}>
                Select a city to see permit detail
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>
                {cities.length > 0 ? `${cities.length} cities tracked` : 'Awaiting first harvest'}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
