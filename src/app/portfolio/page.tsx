"use client"
import { useState, useEffect } from "react"
import { Nav } from "@/app/components/Nav"
import { BenchmarkBadge, type BenchmarkResult } from "@/app/components/ui/BenchmarkBadge"
import { color, font, radius } from "@/lib/theme"
import { getPrefs, removeMarket, PREF_EVENT, type UserPreferences } from "@/lib/preferences"
import type { SectorResponse, Verdict } from "@/app/api/sector/[sector]/route"
import type { SatelliteMsa } from "@/app/dashboard/components/SatelliteHeatmap"
import type { CityPermitData } from "@/app/dashboard/components/CityPermitDetail"
import type { Project } from "@/app/dashboard/components/ProjectFeed"

// ── Constants ──────────────────────────────────────────────────────────────

const CITY_LABELS: Record<string, string> = {
  PHX: 'Phoenix',      DFW: 'Dallas-Ft Worth', AUS: 'Austin',
  HOU: 'Houston',      CHI: 'Chicago',          NYC: 'New York',
  LAX: 'Los Angeles',  SEA: 'Seattle',          DEN: 'Denver',
  ATL: 'Atlanta',      MIA: 'Miami',            BOS: 'Boston',
  SFO: 'San Francisco',LAS: 'Las Vegas',         PDX: 'Portland',
  SAN: 'San Diego',    MCO: 'Orlando',          CLT: 'Charlotte',
  MSP: 'Minneapolis',  SLC: 'Salt Lake City',   SAC: 'Sacramento',
  SJC: 'San Jose',     TPA: 'Tampa',            IND: 'Indianapolis',
  CMH: 'Columbus',     JAX: 'Jacksonville',     ABQ: 'Albuquerque',
  OMA: 'Omaha',        TUL: 'Tulsa',            OKC: 'Oklahoma City',
}

const CITY_STATES: Record<string, string> = {
  PHX: 'AZ', DFW: 'TX', AUS: 'TX', HOU: 'TX', CHI: 'IL', NYC: 'NY',
  LAX: 'CA', SEA: 'WA', DEN: 'CO', ATL: 'GA', MIA: 'FL', BOS: 'MA',
  SFO: 'CA', LAS: 'NV', PDX: 'OR', SAN: 'CA', MCO: 'FL', CLT: 'NC',
  MSP: 'MN', SLC: 'UT', SAC: 'CA', SJC: 'CA', TPA: 'FL', IND: 'IN',
  CMH: 'OH', JAX: 'FL', ABQ: 'NM', OMA: 'NE', TUL: 'OK', OKC: 'OK',
}

// ── Types ──────────────────────────────────────────────────────────────────

interface CityRow {
  code:            string
  cityName:        string
  stateCode:       string
  permitCount:     number | null
  yoyChange:       number | null
  benchPct:        number | null
  benchClass:      BenchmarkResult['classification'] | null
  benchLabel:      string | null
  bsiChange90d:    number | null
  bsiClass:        string | null
  projectCount:    number
  topProjectName:  string | null
  topProjectValue: number | null
  warnCount:       number
  loading:         boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────

function findMsa(code: string, msas: SatelliteMsa[]): SatelliteMsa | null {
  const label = CITY_LABELS[code] ?? ''
  const state = CITY_STATES[code] ?? ''
  const first = label.split('-')[0].split(' ')[0].toLowerCase()
  if (!first) return null
  return msas.find(m =>
    m.msa_name.toLowerCase().includes(first) &&
    (state ? m.state_codes.includes(state) : true)
  ) ?? null
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(Math.round(n))
}

function fmtVal(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${Math.round(n / 1_000_000)}M`
  return `$${n.toLocaleString()}`
}

function yoyCol(v: number | null): string {
  if (v == null) return color.t4
  return v > 0 ? color.green : v < 0 ? color.red : color.t3
}

function bsiLabel(cls: string | null): string {
  if (!cls) return '—'
  const map: Record<string, string> = {
    DEMAND_DRIVEN: 'Demand Driven', FEDERAL_INVESTMENT: 'Federal',
    RECONSTRUCTION: 'Reconstruction', ORGANIC_GROWTH: 'Organic Growth',
    LOW_ACTIVITY: 'Low Activity', INSUFFICIENT_DATA: '—',
  }
  return map[cls] ?? cls.replace(/_/g, ' ')
}

function bsiCol(cls: string | null): string {
  if (!cls || cls === 'LOW_ACTIVITY' || cls === 'INSUFFICIENT_DATA') return color.t4
  if (cls === 'DEMAND_DRIVEN')      return color.green
  if (cls === 'FEDERAL_INVESTMENT') return color.blue
  if (cls === 'RECONSTRUCTION')     return color.amber
  return color.t3
}

// Return index of highest value (returns null if < 2 valid values)
function winnerHigh(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null)
  if (nums.length < 2) return null
  const max = Math.max(...nums)
  return vals.findIndex(v => v === max)
}

// Return index of lowest value (lower is better, e.g. WARN)
function winnerLow(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null)
  if (nums.length < 2) return null
  const min = Math.min(...nums)
  return vals.findIndex(v => v === min)
}

// ── Skeleton cell ──────────────────────────────────────────────────────────

function Skel({ w = 64, h = 16 }: { w?: number; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 4,
      background: `linear-gradient(90deg,${color.bg2} 25%,${color.bg3} 50%,${color.bg2} 75%)`,
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
      display: 'inline-block',
    }} />
  )
}

// ── Shared cell style ──────────────────────────────────────────────────────

const TD: React.CSSProperties = {
  padding:    '11px 16px',
  fontFamily: font.mono,
  fontSize:   13,
  color:      color.t2,
  borderBottom: `1px solid ${color.bd1}`,
  whiteSpace: 'nowrap',
  minWidth:   172,
  maxWidth:   220,
}

const LABEL_TD: React.CSSProperties = {
  ...TD,
  fontFamily:  font.sys,
  fontSize:    13,
  color:       color.t4,
  minWidth:    160,
  maxWidth:    160,
  width:       160,
  position:    'sticky',
  left:        0,
  background:  color.bg1,
  zIndex:      5,
  paddingLeft: 20,
}

const GROUP_TD: React.CSSProperties = {
  ...TD,
  fontFamily:    font.mono,
  fontSize:      9,
  fontWeight:    700,
  letterSpacing: '0.1em',
  color:         color.t4,
  background:    color.bg2,
  paddingTop:    10,
  paddingBottom: 10,
  position:      'sticky',
  left:          0,
  zIndex:        5,
}

// ── Main page ──────────────────────────────────────────────────────────────

const SYS  = font.sys
const MONO = font.mono

// ── Sector health row ──────────────────────────────────────────────────────

function sectorVerdictColor(v: Verdict | undefined): string {
  if (v === 'EXPANDING')   return color.green
  if (v === 'CONTRACTING') return color.red
  return color.amber
}

type SectorKey = 'residential' | 'commercial' | 'infrastructure' | 'industrial'

const SECTOR_LABELS: Record<SectorKey, string> = {
  residential:    'Residential',
  commercial:     'Commercial',
  infrastructure: 'Infrastructure',
  industrial:     'Industrial',
}

function SectorVerdictChip({ sector, data }: { sector: SectorKey; data: SectorResponse | null }) {
  const col = sectorVerdictColor(data?.verdict)
  return (
    <a href={`/sectors/${sector}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background:    color.bg2,
        border:        `1px solid ${data ? col + '44' : color.bd2}`,
        borderTop:     `2px solid ${data ? col : color.bd2}`,
        borderRadius:  10,
        padding:       '12px 16px',
        minWidth:      140,
        display:       'flex',
        flexDirection: 'column',
        gap:           6,
        cursor:        'pointer',
        transition:    'border-color 0.15s',
      }}>
        <div style={{ fontFamily: font.mono, fontSize: 10, color: color.t4, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          {SECTOR_LABELS[sector]}
        </div>
        {data ? (
          <>
            <div style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 700, color: col, letterSpacing: '0.06em' }}>
              {data.verdict}
            </div>
            <div style={{ fontFamily: font.sys, fontSize: 11, color: color.t4, lineHeight: 1.4 }}>
              {data.headline.split('—')[0].trim().slice(0, 48)}…
            </div>
          </>
        ) : (
          <div style={{
            height: 12, borderRadius: 4, background: color.bg3,
            animation: 'shimmer 1.5s infinite',
          }} />
        )}
      </div>
    </a>
  )
}

function SectorHealthRow({ role }: { role: string | null }) {
  type SectorData = Partial<Record<SectorKey, SectorResponse>>
  const [sectors, setSectors] = useState<SectorData>({})

  const toFetch: SectorKey[] = role === 'lender'
    ? ['residential', 'commercial', 'infrastructure', 'industrial']
    : ['residential', 'commercial']

  useEffect(() => {
    let mounted = true
    void Promise.all(
      toFetch.map(id =>
        fetch(`/api/sector/${id}`)
          .then(r => r.ok ? r.json() as Promise<SectorResponse> : null)
          .then(d => { if (mounted && d) setSectors(prev => ({ ...prev, [id]: d })) })
          .catch(() => null)
      )
    )
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const rowLabel = role === 'lender' ? 'Sector Risk Overview' : 'Your Sector Health'

  return (
    <div style={{
      background:    color.bg1,
      border:        `1px solid ${color.bd1}`,
      borderRadius:  12,
      padding:       '20px 24px',
      marginBottom:  24,
    }}>
      <div style={{
        fontFamily:    font.mono,
        fontSize:      10,
        color:         color.t4,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom:  14,
      }}>
        {rowLabel}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
        {toFetch.map(id => (
          <SectorVerdictChip key={id} sector={id} data={sectors[id] ?? null} />
        ))}
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  const [prefs,    setPrefsState] = useState<UserPreferences>({ markets: [], role: null, sectors: [], set_at: 0 })
  const [hydrated, setHydrated]   = useState(false)
  const [rows,     setRows]       = useState<CityRow[]>([])

  useEffect(() => {
    setPrefsState(getPrefs())
    setHydrated(true)
  }, [])

  useEffect(() => {
    const sync = () => setPrefsState(getPrefs())
    window.addEventListener(PREF_EVENT as keyof WindowEventMap, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PREF_EVENT as keyof WindowEventMap, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const marketsKey = prefs.markets.join(',')

  useEffect(() => {
    if (!hydrated) return
    const markets = prefs.markets.slice(0, 5)
    if (markets.length === 0) { setRows([]); return }

    setRows(markets.map(code => ({
      code, loading: true,
      cityName: CITY_LABELS[code] ?? code,
      stateCode: CITY_STATES[code] ?? '',
      permitCount: null, yoyChange: null,
      benchPct: null, benchClass: null, benchLabel: null,
      bsiChange90d: null, bsiClass: null,
      projectCount: 0, topProjectName: null, topProjectValue: null,
      warnCount: 0,
    })))

    async function safe<T>(url: string): Promise<T | null> {
      try { const r = await fetch(url); return r.ok ? (r.json() as Promise<T>) : null }
      catch { return null }
    }

    void (async () => {
      const [permitsRes, satRes, warnRes, projRes, ...benches] = await Promise.all([
        safe<{ cities: CityPermitData[] }>('/api/permits'),
        safe<{ msas: SatelliteMsa[] }>('/api/satellite'),
        safe<{ by_state: Record<string, { count: number; employees: number }> }>('/api/warn'),
        safe<{ projects: Project[] }>('/api/projects?limit=100&sort=valuation&min_value=5000000'),
        ...markets.map(code =>
          safe<BenchmarkResult>(`/api/benchmark/permits?city=${code}`)
        ),
      ])

      const allCities = permitsRes?.cities  ?? []
      const msas      = satRes?.msas        ?? []
      const projects  = projRes?.projects   ?? []

      setRows(markets.map((code, i) => {
        const pc    = allCities.find(c => c.city_code === code)
        const bench = benches[i] as BenchmarkResult | null
        const msa   = findMsa(code, msas)
        const state = CITY_STATES[code] ?? ''

        const first = (CITY_LABELS[code] ?? code).split('-')[0].split(',')[0].split(' ')[0].toLowerCase()
        const cityProjs = projects.filter(p =>
          (p.city ?? '').toLowerCase().includes(first) &&
          (!state || p.state_code === state)
        )
        const top = cityProjs[0] ?? null

        return {
          code,
          cityName:        pc?.city_name ?? CITY_LABELS[code] ?? code,
          stateCode:       pc?.state_code ?? state,
          permitCount:     pc?.latest_month?.permit_count ?? null,
          yoyChange:       pc?.yoy_change_pct ?? null,
          benchPct:        bench?.percentile  ?? null,
          benchClass:      bench?.classification ?? null,
          benchLabel:      bench?.label ?? null,
          bsiChange90d:    msa?.bsi_change_90d ?? null,
          bsiClass:        msa?.classification ?? null,
          projectCount:    cityProjs.length,
          topProjectName:  top?.project_name ?? top?.address ?? null,
          topProjectValue: top?.valuation ?? null,
          warnCount:       warnRes?.by_state?.[state]?.count ?? 0,
          loading:         false,
        }
      }))
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, marketsKey])

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!hydrated || prefs.markets.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1, fontFamily: SYS }}>
        <Nav />
        <div style={{
          maxWidth: 480, margin: '0 auto', padding: '120px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: 20,
        }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: '0.1em' }}>
            MY PORTFOLIO
          </div>
          <div style={{
            fontFamily: SYS, fontSize: 28, fontWeight: 700,
            color: color.t1, lineHeight: 1.2, letterSpacing: '-0.02em',
          }}>
            You haven't added any markets yet.
          </div>
          <div style={{ fontFamily: SYS, fontSize: 15, color: color.t3, lineHeight: 1.6 }}>
            Browse city permits and click <strong>+ Follow</strong> to add a market.
          </div>
          <a href="/permits" style={{
            display: 'inline-flex', alignItems: 'center',
            background: color.blue, color: color.t1,
            fontFamily: SYS, fontSize: 15, fontWeight: 600,
            padding: '12px 28px', borderRadius: radius.md,
            textDecoration: 'none', marginTop: 8,
          }}>
            Browse Cities →
          </a>
        </div>
      </div>
    )
  }

  // ── Comparison table ───────────────────────────────────────────────────────

  const wPermit  = winnerHigh(rows.map(r => r.permitCount))
  const wYoy     = winnerHigh(rows.map(r => r.yoyChange))
  const wBench   = winnerHigh(rows.map(r => r.benchPct))
  const wBsi     = winnerHigh(rows.map(r => r.bsiChange90d))
  const wProj    = winnerHigh(rows.map(r => r.projectCount))
  const wWarn    = winnerLow(rows.map(r => r.warnCount))

  function winCell(winIdx: number | null, colIdx: number): React.CSSProperties {
    return winIdx === colIdx ? { background: color.green + '0e' } : {}
  }

  // Group header row spanning all data columns
  function GroupRow({ label }: { label: string }) {
    return (
      <tr>
        <td style={GROUP_TD}>{label}</td>
        {rows.map((_, i) => (
          <td key={i} style={{
            ...TD, background: color.bg2, padding: '10px 16px',
            fontFamily: MONO, fontSize: 9,
          }} />
        ))}
      </tr>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1, fontFamily: SYS }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 28px 80px' }}>

        {/* Page header */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: '0.1em', marginBottom: 8 }}>
              MY PORTFOLIO · {rows.length} MARKET{rows.length !== 1 ? 'S' : ''} TRACKED
            </div>
            <h1 style={{
              fontFamily: SYS, fontSize: 32, fontWeight: 700,
              color: color.t1, letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0,
            }}>
              Market Comparison
            </h1>
          </div>
          <a href="/permits" style={{
            fontFamily: MONO, fontSize: 11, color: color.blue,
            letterSpacing: '0.06em', padding: '8px 16px',
            border: `1px solid ${color.blue}44`, borderRadius: radius.sm,
          }}>
            + ADD MARKET
          </a>
        </div>

        {/* Sector health row — contractor or lender roles */}
        {(prefs.role === 'contractor' || prefs.role === 'lender') && (
          <SectorHealthRow role={prefs.role} />
        )}

        {/* Scrollable table container */}
        <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${color.bd1}` }}>
          <table style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            width: '100%',
            background: color.bg1,
          }}>

            {/* ── Column headers ────────────────────────────────────────── */}
            <thead>
              <tr>
                {/* Top-left corner cell */}
                <th style={{
                  ...LABEL_TD,
                  fontFamily:  MONO,
                  fontSize:    9,
                  fontWeight:  700,
                  letterSpacing: '0.1em',
                  color:       color.t4,
                  borderBottom: `1px solid ${color.bd1}`,
                  position:    'sticky',
                  top:         0,
                  left:        0,
                  zIndex:      20,
                  background:  color.bg2,
                  paddingTop:  20,
                  paddingBottom: 20,
                  textAlign:   'left',
                }}>
                  METRIC
                </th>

                {rows.map((row, i) => (
                  <th key={i} style={{
                    ...TD,
                    verticalAlign: 'top',
                    paddingTop:    16,
                    paddingBottom: 16,
                    borderBottom:  `1px solid ${color.bd1}`,
                    background:    color.bg2,
                    position:      'sticky',
                    top:           0,
                    zIndex:        15,
                    textAlign:     'left',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {/* City name */}
                      {row.loading ? <Skel w={100} h={18} /> : (
                        <span style={{
                          fontFamily:    SYS,
                          fontSize:      16,
                          fontWeight:    700,
                          color:         color.t1,
                          letterSpacing: '-0.01em',
                        }}>
                          {row.cityName}
                        </span>
                      )}
                      {/* State badge */}
                      {!row.loading && row.stateCode && (
                        <span style={{
                          display:       'inline-block',
                          fontFamily:    MONO,
                          fontSize:      9,
                          fontWeight:    700,
                          letterSpacing: '0.06em',
                          color:         color.t3,
                          background:    color.bg3,
                          border:        `1px solid ${color.bd2}`,
                          borderRadius:  4,
                          padding:       '2px 6px',
                          alignSelf:     'flex-start',
                        }}>
                          {row.stateCode}
                        </span>
                      )}
                      {/* Remove link */}
                      <button
                        onClick={() => { removeMarket(row.code); setPrefsState(getPrefs()) }}
                        style={{
                          fontFamily:    MONO,
                          fontSize:      9,
                          color:         color.t4,
                          background:    'none',
                          border:        'none',
                          cursor:        'pointer',
                          letterSpacing: '0.06em',
                          padding:       0,
                          textAlign:     'left',
                          alignSelf:     'flex-start',
                        }}
                      >
                        × Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* ── GROUP 1: Permit Activity ──────────────────────────── */}
              <GroupRow label="PERMIT ACTIVITY" />

              <tr>
                <td style={LABEL_TD}>This Month</td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...TD, ...winCell(wPermit, i), fontFamily: MONO, fontWeight: 600 }}>
                    {r.loading ? <Skel /> : r.permitCount != null ? fmtCount(r.permitCount) : '—'}
                  </td>
                ))}
              </tr>

              <tr>
                <td style={LABEL_TD}>YoY Change</td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...TD, ...winCell(wYoy, i) }}>
                    {r.loading ? <Skel /> : r.yoyChange != null ? (
                      <span style={{ fontFamily: MONO, fontWeight: 600, color: yoyCol(r.yoyChange) }}>
                        {r.yoyChange > 0 ? '+' : ''}{r.yoyChange.toFixed(1)}%
                      </span>
                    ) : '—'}
                  </td>
                ))}
              </tr>

              <tr>
                <td style={LABEL_TD}>Benchmark</td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...TD, ...winCell(wBench, i) }}>
                    {r.loading ? <Skel w={80} /> : r.benchClass && r.benchPct != null ? (
                      <BenchmarkBadge
                        classification={r.benchClass}
                        percentile={r.benchPct}
                        label={r.benchLabel ?? ''}
                      />
                    ) : <span style={{ color: color.t4 }}>—</span>}
                  </td>
                ))}
              </tr>

              {/* ── GROUP 2: Satellite Signal ─────────────────────────── */}
              <GroupRow label="SATELLITE SIGNAL" />

              <tr>
                <td style={LABEL_TD}>BSI Change 90d</td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...TD, ...winCell(wBsi, i) }}>
                    {r.loading ? <Skel /> : r.bsiChange90d != null ? (
                      <span style={{
                        fontFamily: MONO, fontWeight: 600,
                        color: r.bsiChange90d > 0 ? color.green : r.bsiChange90d < 0 ? color.red : color.t3,
                      }}>
                        {r.bsiChange90d > 0 ? '+' : ''}{r.bsiChange90d.toFixed(3)}
                      </span>
                    ) : <span style={{ color: color.t4 }}>No satellite data</span>}
                  </td>
                ))}
              </tr>

              <tr>
                <td style={LABEL_TD}>Classification</td>
                {rows.map((r, i) => (
                  <td key={i} style={TD}>
                    {r.loading ? <Skel w={96} /> : (
                      <span style={{
                        fontFamily: MONO, fontSize: 11,
                        fontWeight: 600, color: bsiCol(r.bsiClass),
                      }}>
                        {bsiLabel(r.bsiClass)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* ── GROUP 3: Recent Projects ──────────────────────────── */}
              <GroupRow label="RECENT PROJECTS" />

              <tr>
                <td style={{ ...LABEL_TD, color: color.t4 }}>
                  <div>Projects &gt;$5M</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 2 }}>last 90 days</div>
                </td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...TD, ...winCell(wProj, i), fontFamily: MONO, fontWeight: 600 }}>
                    {r.loading ? <Skel w={32} /> : r.projectCount > 0
                      ? r.projectCount
                      : <span style={{ color: color.t4 }}>—</span>}
                  </td>
                ))}
              </tr>

              <tr>
                <td style={LABEL_TD}>Top Project</td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...TD, maxWidth: 220, overflow: 'hidden' }}>
                    {r.loading ? <Skel w={120} /> : r.topProjectName ? (
                      <div>
                        <div style={{
                          fontFamily: SYS, fontSize: 12, color: color.t2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: 188,
                        }}>
                          {r.topProjectName}
                        </div>
                        {r.topProjectValue != null && (
                          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, marginTop: 2 }}>
                            {fmtVal(r.topProjectValue)}
                          </div>
                        )}
                      </div>
                    ) : <span style={{ color: color.t4 }}>—</span>}
                  </td>
                ))}
              </tr>

              {/* ── GROUP 4: Labor Signals ────────────────────────────── */}
              <GroupRow label="LABOR SIGNALS" />

              <tr>
                <td style={{ ...LABEL_TD, borderBottom: 'none' }}>
                  <div>WARN Notices</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 2 }}>last 30 days</div>
                </td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...TD, borderBottom: 'none', ...winCell(wWarn, i) }}>
                    {r.loading ? <Skel w={32} /> : (
                      <span style={{
                        fontFamily: MONO,
                        fontWeight: 600,
                        color: r.warnCount > 10 ? color.red : r.warnCount > 3 ? color.amber : color.t3,
                      }}>
                        {r.warnCount > 0 ? r.warnCount : (
                          <span style={{ color: color.green, fontWeight: 600 }}>None</span>
                        )}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Source line */}
        <div style={{
          fontFamily: MONO, fontSize: 11, color: color.t4,
          letterSpacing: '0.06em', marginTop: 20,
        }}>
          Sources: City permit APIs · Sentinel-2 satellite · US DOL WARN Act · Federal awards · Updated daily
        </div>
      </div>
    </div>
  )
}
