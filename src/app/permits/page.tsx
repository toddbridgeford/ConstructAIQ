"use client"
import { useState, useEffect } from "react"
import { Nav } from "@/app/components/Nav"
import { color, font, layout as L } from "@/lib/theme"
import { CityPermitDetail, type CityPermitData } from "@/app/dashboard/components/CityPermitDetail"

// ── Types ──────────────────────────────────────────────────────────────────

interface NationalTotal {
  cities_covered:         number
  latest_month_count:     number
  latest_month_valuation: number
  yoy_change_pct:         number | null
}

interface PermitsApiResponse {
  cities:         CityPermitData[]
  national_total: NationalTotal | null
}

// ── Design tokens ──────────────────────────────────────────────────────────

const { bg0: BG0, bg1: BG1, bg2: BG2, bd1: BD1, bd2: BD2,
        t1: T1, t2: T2, t3: T3, t4: T4,
        green: GREEN, blue: BLUE, red: RED } = color
const MONO = font.mono, SYS = font.sys

// ── Region map ─────────────────────────────────────────────────────────────

const REGIONS: Record<string, string[]> = {
  Northeast: ['CT', 'MA', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
  Southeast: ['AL', 'DC', 'DE', 'FL', 'GA', 'KY', 'LA', 'MD', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
  Midwest:   ['IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'],
  South:     ['AR', 'OK', 'TX'],
  West:      ['AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NM', 'NV', 'OR', 'UT', 'WA', 'WY'],
}

function regionFor(stateCode: string): string {
  for (const [region, states] of Object.entries(REGIONS)) {
    if (states.includes(stateCode)) return region
  }
  return 'Other'
}

// ── Formatting ─────────────────────────────────────────────────────────────

function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

// ── Stat badge ─────────────────────────────────────────────────────────────

function StatBadge({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background:    BG1,
      border:        `1px solid ${BD1}`,
      borderRadius:  10,
      padding:       '12px 20px',
      display:       'flex',
      flexDirection: 'column',
      gap:           4,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: T1, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: SYS, fontSize: 11, color: T3 }}>{sub}</div>}
    </div>
  )
}

// ── 6-bar mini sparkline ───────────────────────────────────────────────────

function MiniBar({ data }: { data: number[] }) {
  const vals = data.slice(-6)
  if (vals.length === 0) return <div style={{ width: 60, height: 20 }} />
  const max = Math.max(...vals, 1)
  return (
    <svg width={60} height={20} viewBox="0 0 60 20" style={{ display: 'block', flexShrink: 0 }}>
      {vals.map((v, i) => {
        const h = Math.max(2, (v / max) * 16)
        return (
          <rect
            key={i}
            x={i * 10 + 1}
            y={20 - h}
            width={7}
            height={h}
            rx={1.5}
            fill={BLUE}
            fillOpacity={0.35 + (i / Math.max(vals.length - 1, 1)) * 0.65}
          />
        )
      })}
    </svg>
  )
}

// ── City card ──────────────────────────────────────────────────────────────

function momChange(monthly: { permit_count: number }[]): { pct: number; pos: boolean } | null {
  const last = monthly.slice(-2)
  if (last.length < 2 || last[0].permit_count === 0) return null
  const pct = ((last[1].permit_count - last[0].permit_count) / last[0].permit_count) * 100
  return { pct, pos: pct >= 0 }
}

function CityCard({
  city, selected, onClick,
}: {
  city: CityPermitData
  selected: boolean
  onClick: () => void
}) {
  const yoy   = city.yoy_change_pct
  const count = city.latest_month?.permit_count ?? 0
  const spark = city.monthly.slice(-6).map(m => m.permit_count)
  const yoyCol = yoy == null ? T4 : yoy >= 0 ? GREEN : RED
  const yoyStr = yoy == null ? '—' : `${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}%`
  const mom    = momChange(city.monthly)

  return (
    <button
      onClick={onClick}
      style={{
        background:    selected ? `${BLUE}12` : BG1,
        border:        `1px solid ${selected ? BLUE : BD1}`,
        borderRadius:  L.cardRadius,
        padding:       '14px 16px',
        textAlign:     'left',
        cursor:        'pointer',
        display:       'flex',
        flexDirection: 'column',
        gap:           6,
        transition:    'border-color 0.15s, background 0.15s',
        width:         '100%',
      }}
    >
      {/* City name + state */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{
          fontFamily:   SYS, fontSize: 13, fontWeight: 700, color: T1,
          lineHeight:   1.25, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace:   'nowrap', minWidth: 0,
        }}>
          {city.city_name}
        </div>
        <span style={{
          fontFamily:    MONO, fontSize: 9, fontWeight: 700,
          color:         T3, background: BG2, border: `1px solid ${BD2}`,
          borderRadius:  4, padding: '2px 5px', flexShrink: 0,
          letterSpacing: '0.04em',
        }}>
          {city.state_code}
        </span>
      </div>

      {/* Permit count */}
      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: T1,
                    letterSpacing: '-0.02em', lineHeight: 1 }}>
        {count > 0 ? fmtCount(count) : '—'}
      </div>

      {/* YoY + sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: yoyCol }}>
            {yoyStr} YoY
          </span>
          {mom && (
            <span style={{ fontFamily: MONO, fontSize: 10, color: mom.pos ? GREEN : RED }}>
              MoM: {mom.pos ? '▲' : '▼'} {mom.pos ? '+' : ''}{mom.pct.toFixed(1)}%
            </span>
          )}
        </div>
        <MiniBar data={spark} />
      </div>
    </button>
  )
}

// ── Categories ─────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Residential', 'Commercial', 'New Construction'] as const
type Category = typeof CATEGORIES[number]

// ── Main page ──────────────────────────────────────────────────────────────

export default function PermitsPage() {
  const [data,     setData]     = useState<PermitsApiResponse | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [category, setCategory] = useState<Category>('All')
  const [region,   setRegion]   = useState('All Regions')
  const [selected, setSelected] = useState<CityPermitData | null>(null)

  useEffect(() => {
    fetch('/api/permits')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  const allCities = data?.cities ?? []
  const national  = data?.national_total

  const displayCities = allCities.filter(c =>
    region === 'All Regions' || regionFor(c.state_code) === region
  )

  const regionOptions = ['All Regions', 'Northeast', 'Southeast', 'Midwest', 'South', 'West']

  return (
    <div style={{ minHeight: '100vh', background: BG0, color: T1, fontFamily: SYS,
                  paddingBottom: 'env(safe-area-inset-bottom,24px)' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .city-grid { display: grid; gap: 10px; grid-template-columns: repeat(5,1fr); }
        @media (max-width: 1200px) { .city-grid { grid-template-columns: repeat(4,1fr); } }
        @media (max-width: 940px)  { .city-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 640px)  { .city-grid { grid-template-columns: repeat(2,1fr); } }
        .permits-layout { display: flex; gap: 20px; align-items: flex-start; }
        .permits-panel  { width: 400px; flex-shrink: 0; }
        @media (max-width: 1000px) {
          .city-grid { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 900px) {
          .permits-layout { flex-direction: column; }
          .permits-panel  { width: 100% !important; }
        }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 32px 0' }}>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: GREEN,
              boxShadow: `0 0 8px ${GREEN}`, display: 'inline-block', animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: GREEN, letterSpacing: '0.1em' }}>
              LIVE · {loading ? '...' : `${allCities.length || 40} CITIES`}
            </span>
          </div>

          <h1 style={{ fontFamily: SYS, fontSize: 40, fontWeight: 700,
                       letterSpacing: '-0.03em', lineHeight: 1.08, color: T1, marginBottom: 20 }}>
            City Building Permits
          </h1>

          {/* Stat badges */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {loading ? (
              [0,1,2].map(i => (
                <div key={i} style={{ height: 76, width: 180, borderRadius: 10, background: BG2, opacity: 0.6 }} />
              ))
            ) : (
              <>
                <StatBadge
                  label="Cities Tracked"
                  value={String(national?.cities_covered ?? allCities.length)}
                  sub="Major US metros"
                />
                <StatBadge
                  label="This Month"
                  value={national?.latest_month_count ? fmtCount(national.latest_month_count) : '—'}
                  sub="Total permits issued"
                />
                <StatBadge
                  label="YoY Change"
                  value={national?.yoy_change_pct != null
                    ? `${national.yoy_change_pct > 0 ? '+' : ''}${national.yoy_change_pct.toFixed(1)}%`
                    : '—'}
                  sub="vs same month prior year"
                />
              </>
            )}
          </div>

          {/* Coverage note */}
          {!loading && (
            <div style={{ fontFamily: SYS, fontSize: 13, color: T3, marginBottom: 16 }}>
              Coverage expanding to 75+ markets.{' '}
              <a href="/methodology#city-permits" style={{ color: BLUE, textDecoration: 'underline' }}>
                View coverage map →
              </a>
            </div>
          )}

          {/* Filter row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    fontFamily:  SYS,
                    fontSize:    13,
                    fontWeight:  category === cat ? 600 : 400,
                    color:       category === cat ? T1 : T4,
                    background:  category === cat ? BG2 : 'transparent',
                    border:      `1px solid ${category === cat ? BD2 : 'transparent'}`,
                    borderRadius: 7,
                    padding:     '6px 14px',
                    cursor:      'pointer',
                    minHeight:   34,
                    transition:  'all 0.12s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Region dropdown */}
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              style={{
                background:  BG2,
                border:      `1px solid ${BD2}`,
                borderRadius: 8,
                padding:     '7px 12px',
                fontFamily:  SYS,
                fontSize:    13,
                color:       T2,
                cursor:      'pointer',
                minHeight:   36,
                outline:     'none',
                marginLeft:  'auto',
              }}
            >
              {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* ── Main layout ─────────────────────────────────────────────────── */}
        <div className="permits-layout">

          {/* Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="city-grid">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} style={{
                    height: 118, borderRadius: L.cardRadius,
                    background: BG1, opacity: 1 - (i % 10) * 0.04,
                  }} />
                ))}
              </div>
            ) : displayCities.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center',
                            fontFamily: SYS, fontSize: 14, color: T4 }}>
                No cities for selected region.
              </div>
            ) : (
              <div className="city-grid">
                {displayCities.map(city => (
                  <CityCard
                    key={city.city_code}
                    city={city}
                    selected={selected?.city_code === city.city_code}
                    onClick={() => setSelected(
                      selected?.city_code === city.city_code ? null : city
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Side panel */}
          {selected && (
            <div className="permits-panel">
              <div style={{
                background:   BG1,
                border:       `1px solid ${BD1}`,
                borderRadius: L.cardRadius,
                padding:      '20px',
                position:     'sticky',
                top:          20,
                maxHeight:    'calc(100vh - 40px)',
                overflowY:    'auto',
              }}>
                {/* Panel header */}
                <div style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  marginBottom:   16,
                }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: T4,
                                letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {category !== 'All' ? category + ' · ' : ''}City Detail
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      background:    BG2,
                      border:        `1px solid ${BD2}`,
                      borderRadius:  7,
                      width:         30,
                      height:        30,
                      display:       'flex',
                      alignItems:    'center',
                      justifyContent: 'center',
                      cursor:        'pointer',
                      color:         T3,
                      fontSize:      14,
                      flexShrink:    0,
                    }}
                  >
                    ✕
                  </button>
                </div>

                <CityPermitDetail
                  cityCode={selected.city_code}
                  cityData={selected}
                />

                <a
                  href={`/permits/${selected.city_code.toLowerCase()}`}
                  style={{
                    display:       'block',
                    marginTop:     16,
                    paddingTop:    12,
                    borderTop:     `1px solid ${BD1}`,
                    fontFamily:    MONO,
                    fontSize:      11,
                    color:         BLUE,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Full city page →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── Source line ─────────────────────────────────────────────────── */}
        <div style={{
          fontFamily:    MONO,
          fontSize:      11,
          color:         T4,
          letterSpacing: '0.06em',
          marginTop:     32,
          paddingBottom: 60,
        }}>
          Source: City permit APIs · Updated daily · {allCities.length || 40} cities tracked
        </div>

      </div>

      <footer style={{
        borderTop: `1px solid ${BD1}`, padding: '24px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>
          Construction Intelligence Platform · constructaiq.trade
        </div>
        <div style={{ fontFamily: SYS, fontSize: 12, color: T4 }}>
          Data: {allCities.length > 0 ? allCities.length : '75'}+ US city permit APIs · Updated daily
        </div>
      </footer>
    </div>
  )
}
