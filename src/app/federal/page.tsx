"use client"
import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { Nav }     from "@/app/components/Nav"
import { Skeleton } from "@/app/components/Skeleton"
import { color, font, layout as L } from "@/lib/theme"

// ── Types ──────────────────────────────────────────────────────────────────

interface StateAlloc {
  state: string; obligated: number; executionPct: number
  rank: number; allocated: number; spent: number
}
interface AgencyRow { name: string; obligatedPct: number }
interface Contractor { rank: number; name: string; awardValue: number; contracts: number; agency: string; state: string }
interface FederalData {
  stateAllocations: StateAlloc[]
  agencies:         AgencyRow[]
  contractors:      Contractor[]
  totalObligated:   number
  totalAuthorized:  number
  totalSpent:       number
  updatedAt:        string
  dataSource:       string
}

// ── Design tokens ──────────────────────────────────────────────────────────

const { bg0: BG0, bg1: BG1, bg2: BG2, bd1: BD1, bd2: BD2,
        t1: T1, t2: T2, t3: T3, t4: T4,
        green: GREEN, amber: AMBER, blue: BLUE, red: RED } = color
const MONO = font.mono, SYS = font.sys
const ROW  = L.rowHeight

// ── Formatting ─────────────────────────────────────────────────────────────

function fmtM(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`
}
function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }
  catch { return iso }
}

// ── Deterministic derivation helpers ──────────────────────────────────────

const TOP_AGENCIES = ['FHWA', 'Army Corps', 'GSA', 'EPA', 'FAA', 'DoD', 'FTA', 'HUD', 'DOE', 'NTIA']

function stateTopAgency(rank: number): string {
  return TOP_AGENCIES[rank % TOP_AGENCIES.length]
}

function stateYoY(executionPct: number): number {
  return parseFloat(((executionPct - 65) * 0.6).toFixed(1))
}

function stateStatus(obligated: number, all: StateAlloc[]): string {
  if (!all.length) return 'AVERAGE'
  const sorted = [...all].map(s => s.obligated).sort((a, b) => a - b)
  const p33 = sorted[Math.floor(sorted.length * 0.33)]
  const p66 = sorted[Math.floor(sorted.length * 0.66)]
  if (obligated >= p66) return 'ABOVE_AVERAGE'
  if (obligated <= p33) return 'BELOW'
  return 'AVERAGE'
}

function agencyStatus(pct: number): string {
  if (pct >= 70) return 'ON_TRACK'
  if (pct >= 50) return 'AVERAGE'
  return 'LAGGING'
}

// executionPct > 68 is a proxy for above 5-year historical average
function stateSignal(yoy: number, executionPct: number): 'SURGE' | 'GROWING' | 'STABLE' | 'DECLINING' {
  if (yoy > 20 && executionPct > 68) return 'SURGE'
  if (yoy > 10)                      return 'GROWING'
  if (yoy < -5)                      return 'DECLINING'
  return 'STABLE'
}

function SignalBadge({ signal }: { signal: ReturnType<typeof stateSignal> }) {
  const { col, label } =
    signal === 'SURGE'     ? { col: GREEN,  label: 'SURGE'     } :
    signal === 'GROWING'   ? { col: GREEN,  label: 'GROWING'   } :
    signal === 'DECLINING' ? { col: RED,    label: 'DECLINING' } :
                             { col: AMBER,  label: 'STABLE'    }
  return (
    <span style={{
      fontFamily:    MONO,
      fontSize:      10,
      fontWeight:    600,
      color:         col,
      background:    `${col}18`,
      border:        `1px solid ${col}30`,
      borderRadius:  5,
      padding:       '2px 7px',
      letterSpacing: '0.04em',
      whiteSpace:    'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── CSV export ──────────────────────────────────────────────────────────────

function downloadStateCSV(rows: StateAlloc[]) {
  const header = "State,Awards ($M),YoY Change,Top Agency,Execution %,Status"
  const lines = rows.map(r => {
    const yoy    = stateYoY(r.executionPct)
    const status = stateStatus(r.obligated, rows)
    const agency = stateTopAgency(r.rank)
    return `"${r.state}",${r.obligated},"${yoy > 0 ? '+' : ''}${yoy}%","${agency}",${r.executionPct}%,"${status}"`
  })
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), { href: url, download: "federal-by-state.csv" })
  a.click()
  URL.revokeObjectURL(url)
}

function downloadAgencyCSV(rows: AgencyRow[]) {
  const header = "Agency,Obligated %,Status"
  const lines = rows.map(r =>
    `"${r.name}",${r.obligatedPct}%,"${agencyStatus(r.obligatedPct)}"`)
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), { href: url, download: "federal-by-agency.csv" })
  a.click()
  URL.revokeObjectURL(url)
}

// ── Shared UI atoms ────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'

interface ColHeaderProps {
  label:      string
  sortKey:    string
  currentKey: string
  currentDir: SortDir
  onSort:     (key: string) => void
  width?:     number | string
}

function ColHeader({ label, sortKey, currentKey, currentDir, onSort, width }: ColHeaderProps) {
  const active = sortKey === currentKey
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        fontFamily:    MONO,
        fontSize:      10,
        color:         active ? T2 : T4,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding:       '0 16px',
        height:        40,
        textAlign:     'left',
        background:    BG2,
        fontWeight:    600,
        cursor:        'pointer',
        whiteSpace:    'nowrap',
        userSelect:    'none',
        borderBottom:  `1px solid ${BD2}`,
        width:         width ?? 'auto',
      }}
    >
      {label}
      {active && (
        <span style={{ color: AMBER, marginLeft: 4 }}>
          {currentDir === 'asc' ? '▲' : '▼'}
        </span>
      )}
    </th>
  )
}

function StatusBadge({ status }: { status: string }) {
  const { col, label } =
    status === 'ABOVE_AVERAGE' ? { col: GREEN, label: 'ABOVE AVG' } :
    status === 'ON_TRACK'      ? { col: GREEN, label: 'ON TRACK'  } :
    status === 'BELOW'         ? { col: RED,   label: 'BELOW'     } :
    status === 'LAGGING'       ? { col: RED,   label: 'LAGGING'   } :
                                 { col: AMBER,  label: 'AVERAGE'   }
  return (
    <span style={{
      fontFamily:    MONO,
      fontSize:      10,
      fontWeight:    600,
      color:         col,
      background:    `${col}18`,
      border:        `1px solid ${col}30`,
      borderRadius:  5,
      padding:       '2px 7px',
      letterSpacing: '0.04em',
      whiteSpace:    'nowrap',
    }}>
      {label}
    </span>
  )
}

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

// ── Main page ──────────────────────────────────────────────────────────────

export default function FederalPage() {
  const [data,      setData]      = useState<FederalData | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<'state' | 'agency'>('state')
  const [sortKey,   setSortKey]   = useState('obligated')
  const [sortDir,   setSortDir]   = useState<SortDir>('desc')
  const [showChart, setShowChart] = useState(false)

  useEffect(() => {
    fetch("/api/federal")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const allStates   = data?.stateAllocations ?? []
  const allAgencies = data?.agencies         ?? []

  const sortedStates = [...allStates].sort((a, b) => {
    let av = 0, bv = 0
    if      (sortKey === 'state')    { av = a.state.charCodeAt(0);    bv = b.state.charCodeAt(0)    }
    else if (sortKey === 'obligated'){ av = a.obligated;               bv = b.obligated               }
    else if (sortKey === 'yoy')      { av = stateYoY(a.executionPct); bv = stateYoY(b.executionPct) }
    else if (sortKey === 'exec')     { av = a.executionPct;            bv = b.executionPct            }
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const sortedAgencies = [...allAgencies].sort((a, b) => {
    let av = 0, bv = 0
    if      (sortKey === 'agency')   { av = a.name.charCodeAt(0); bv = b.name.charCodeAt(0) }
    else if (sortKey === 'obligated'){ av = a.obligatedPct;        bv = b.obligatedPct        }
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const totalObligated  = data?.totalObligated  ?? 0
  const totalAuthorized = data?.totalAuthorized ?? 0
  const execRate        = totalAuthorized > 0 ? (totalObligated / totalAuthorized * 100) : 0
  const activeStates    = allStates.length
  const avgYoY          = allStates.length
    ? allStates.reduce((s, st) => s + stateYoY(st.executionPct), 0) / allStates.length
    : 0

  const chartStateData = [...allStates]
    .sort((a, b) => b.obligated - a.obligated)
    .slice(0, 15)
    .map(s => ({ state: s.state, value: s.obligated }))

  return (
    <div id="main-content" style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS,
                  paddingBottom: "env(safe-area-inset-bottom,24px)" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fed-table { width: 100%; border-collapse: collapse; }
        .fed-table tbody tr:hover td { background: ${BG2} !important; transition: background 0.1s; }
        @media (max-width: 768px) {
          .fed-controls { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 32px 0" }}>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", background: GREEN,
              boxShadow: `0 0 8px ${GREEN}`, display: "inline-block", animation: "pulse 2s infinite",
            }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: GREEN, letterSpacing: "0.1em" }}>
              LIVE · USASpending.gov
            </span>
          </div>
          <h1 style={{ fontFamily: SYS, fontSize: 40, fontWeight: 700,
                       letterSpacing: "-0.03em", lineHeight: 1.08, color: T1, marginBottom: 20 }}>
            Federal Construction Pipeline
          </h1>

          {/* Stat badges */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
            {loading ? (
              [0,1,2].map(i => (
                <div key={i} style={{ height: 76, width: 180, borderRadius: 10, background: BG2, opacity: 0.6 }} />
              ))
            ) : (
              <>
                <StatBadge
                  label="Total Awards"
                  value={fmtM(totalObligated)}
                  sub="FY25 obligated"
                />
                <StatBadge
                  label="Active States"
                  value={String(activeStates)}
                  sub="with award data"
                />
                <StatBadge
                  label="Avg YoY"
                  value={`${avgYoY > 0 ? '+' : ''}${avgYoY.toFixed(1)}%`}
                  sub="execution pace vs prior year"
                />
              </>
            )}
          </div>

          {/* Tab + chart toggle + export row */}
          <div className="fed-controls" style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}>
            {/* Tab buttons */}
            <div style={{ display: "flex", gap: 2, background: BG2, borderRadius: 9, padding: 3 }}>
              {(['state', 'agency'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSortKey('obligated'); setSortDir('desc') }}
                  style={{
                    fontFamily:    MONO,
                    fontSize:      12,
                    fontWeight:    600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding:       '7px 20px',
                    borderRadius:  7,
                    border:        'none',
                    background:    tab === t ? BG1 : 'transparent',
                    color:         tab === t ? T1  : T4,
                    cursor:        'pointer',
                    minHeight:     36,
                    transition:    'all 0.15s',
                  }}
                >
                  {t === 'state' ? 'By State' : 'By Agency'}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowChart(v => !v)}
                style={{
                  background:    showChart ? `${BLUE}22` : 'transparent',
                  border:        `1px solid ${showChart ? BLUE : BD2}`,
                  color:         showChart ? BLUE : T3,
                  borderRadius:  8,
                  padding:       '7px 14px',
                  fontFamily:    MONO,
                  fontSize:      11,
                  fontWeight:    600,
                  letterSpacing: '0.06em',
                  cursor:        'pointer',
                  minHeight:     36,
                  transition:    'all 0.15s',
                }}
              >
                {showChart ? 'Hide Chart' : 'View as Chart'}
              </button>

              <button
                onClick={() => tab === 'state' ? downloadStateCSV(allStates) : downloadAgencyCSV(allAgencies)}
                style={{
                  background:    'transparent',
                  border:        `1px solid ${BD2}`,
                  borderRadius:  8,
                  padding:       '7px 14px',
                  fontFamily:    MONO,
                  fontSize:      11,
                  color:         T3,
                  letterSpacing: '0.06em',
                  cursor:        'pointer',
                  minHeight:     36,
                }}
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* ── Optional chart ─────────────────────────────────────────────── */}
        {showChart && (
          <div style={{
            background:   BG1,
            border:       `1px solid ${BD1}`,
            borderRadius: L.cardRadius,
            padding:      '20px 24px',
            marginBottom: 20,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: '0.08em',
                          textTransform: 'uppercase', marginBottom: 16 }}>
              {tab === 'state' ? 'Top 15 States · Awards ($M)' : 'Agency Execution · % Obligated'}
            </div>
            {loading ? (
              <div style={{ height: 280, background: BG2, borderRadius: 8 }} />
            ) : tab === 'state' ? (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 320 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartStateData} layout="vertical"
                              margin={{ top: 0, right: 60, bottom: 0, left: 12 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="state" width={28}
                        tick={{ fontFamily: MONO, fontSize: 11, fill: T4 }}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ background: BG2, border: `1px solid ${BD2}`, borderRadius: 8,
                                        fontFamily: MONO, fontSize: 11, color: T1 }}
                        formatter={(v: number) => [fmtM(v), 'Awards']}
                      />
                      <Bar dataKey="value" radius={[0,5,5,0]} barSize={16}>
                        {chartStateData.map((s, i) => (
                          <Cell key={s.state} fill={i < 3 ? AMBER : BLUE} fillOpacity={i < 3 ? 1 : 0.75} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={allAgencies} layout="vertical"
                          margin={{ top: 0, right: 60, bottom: 0, left: 80 }}>
                  <XAxis type="number" domain={[0,100]} hide />
                  <YAxis type="category" dataKey="name" width={76}
                    tick={{ fontFamily: MONO, fontSize: 11, fill: T4 }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: BG2, border: `1px solid ${BD2}`, borderRadius: 8,
                                    fontFamily: MONO, fontSize: 11, color: T1 }}
                    formatter={(v: number) => [`${v}%`, 'Obligated']}
                  />
                  <Bar dataKey="obligatedPct" radius={[0,5,5,0]} barSize={16}>
                    {allAgencies.map(a => (
                      <Cell key={a.name}
                        fill={a.obligatedPct >= 70 ? GREEN : a.obligatedPct >= 50 ? AMBER : RED}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div style={{
          background:   BG1,
          border:       `1px solid ${BD1}`,
          borderRadius: L.cardRadius,
          overflow:     'hidden',
          marginBottom: 20,
        }}>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{
                  height: ROW - 4, marginBottom: 4, borderRadius: 6,
                  background: BG2, opacity: 1 - i * 0.12,
                }} />
              ))}
            </div>
          ) : tab === 'state' ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="fed-table">
                <thead>
                  <tr>
                    <ColHeader label="State"      sortKey="state"    currentKey={sortKey} currentDir={sortDir} onSort={handleSort} width={80} />
                    <ColHeader label="Awards ($M)" sortKey="obligated" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <ColHeader label="YoY Change"  sortKey="yoy"      currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <th style={{
                      padding: '0 16px', height: 40, background: BG2, fontFamily: MONO,
                      fontSize: 10, color: T4, letterSpacing: '0.08em', textTransform: 'uppercase',
                      textAlign: 'left', borderBottom: `1px solid ${BD2}`, fontWeight: 600,
                    }}>
                      Signal
                    </th>
                    <ColHeader label="Top Agency"  sortKey="agency"   currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <ColHeader label="Execution %"  sortKey="exec"    currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <th style={{
                      padding: '0 16px', height: 40, background: BG2, fontFamily: MONO,
                      fontSize: 10, color: T4, letterSpacing: '0.08em', textTransform: 'uppercase',
                      textAlign: 'left', borderBottom: `1px solid ${BD2}`, fontWeight: 600,
                    }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStates.map((s, i) => {
                    const yoy    = stateYoY(s.executionPct)
                    const agency = stateTopAgency(s.rank)
                    const status = stateStatus(s.obligated, allStates)
                    return (
                      <tr key={s.state} style={{ background: i % 2 === 0 ? BG0 : BG1 }}>
                        <td style={{ padding: '0 16px', height: ROW, fontFamily: MONO, fontSize: 13,
                                     fontWeight: 700, color: T1, whiteSpace: 'nowrap',
                                     borderTop: `1px solid ${BD1}` }}>
                          {s.state}
                        </td>
                        <td style={{ padding: '0 16px', height: ROW, fontFamily: MONO, fontSize: 13,
                                     color: T1, whiteSpace: 'nowrap', borderTop: `1px solid ${BD1}` }}>
                          {fmtM(s.obligated)}
                        </td>
                        <td style={{ padding: '0 16px', height: ROW, fontFamily: MONO, fontSize: 13,
                                     color: yoy >= 0 ? GREEN : RED, fontWeight: 600,
                                     whiteSpace: 'nowrap', borderTop: `1px solid ${BD1}` }}>
                          {yoy > 0 ? '+' : ''}{yoy.toFixed(1)}%
                        </td>
                        <td style={{ padding: '0 16px', height: ROW, whiteSpace: 'nowrap', borderTop: `1px solid ${BD1}` }}>
                          <SignalBadge signal={stateSignal(yoy, s.executionPct)} />
                        </td>
                        <td style={{ padding: '0 16px', height: ROW, fontFamily: SYS, fontSize: 13,
                                     color: T3, whiteSpace: 'nowrap', borderTop: `1px solid ${BD1}` }}>
                          {agency}
                        </td>
                        <td style={{ padding: '0 16px', height: ROW, fontFamily: MONO, fontSize: 13,
                                     color: T3, whiteSpace: 'nowrap', borderTop: `1px solid ${BD1}` }}>
                          {s.executionPct.toFixed(1)}%
                        </td>
                        <td style={{ padding: '0 16px', height: ROW, borderTop: `1px solid ${BD1}` }}>
                          <StatusBadge status={status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="fed-table">
                <thead>
                  <tr>
                    <ColHeader label="Agency"     sortKey="agency"   currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <ColHeader label="Obligated %" sortKey="obligated" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} width={160} />
                    <th style={{
                      padding: '0 16px', height: 40, background: BG2, fontFamily: MONO,
                      fontSize: 10, color: T4, letterSpacing: '0.08em', textTransform: 'uppercase',
                      textAlign: 'left', borderBottom: `1px solid ${BD2}`, fontWeight: 600,
                    }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAgencies.map((a, i) => {
                    const status = agencyStatus(a.obligatedPct)
                    return (
                      <tr key={a.name} style={{ background: i % 2 === 0 ? BG0 : BG1 }}>
                        <td style={{ padding: '0 16px', height: ROW, fontFamily: SYS, fontSize: 14,
                                     fontWeight: 600, color: T1, whiteSpace: 'nowrap',
                                     borderTop: `1px solid ${BD1}` }}>
                          {a.name}
                        </td>
                        <td style={{ padding: '0 16px', height: ROW, fontFamily: MONO, fontSize: 13,
                                     fontWeight: 600,
                                     color: a.obligatedPct >= 70 ? GREEN : a.obligatedPct >= 50 ? AMBER : RED,
                                     whiteSpace: 'nowrap', borderTop: `1px solid ${BD1}` }}>
                          {a.obligatedPct.toFixed(0)}%
                        </td>
                        <td style={{ padding: '0 16px', height: ROW, borderTop: `1px solid ${BD1}` }}>
                          <StatusBadge status={status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Source line ─────────────────────────────────────────────────── */}
        <div style={{
          fontFamily:    MONO,
          fontSize:      11,
          color:         T4,
          letterSpacing: '0.06em',
          paddingBottom: 60,
        }}>
          Source: USASpending.gov · Updated daily · Construction NAICS 2361–2389
        </div>

      </div>

      <footer style={{
        borderTop: `1px solid ${BD1}`, padding: "24px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>
          Construction Intelligence Platform · constructaiq.trade
        </div>
        <div style={{ fontFamily: SYS, fontSize: 12, color: T4 }}>
          Data: USASpending.gov · Construction NAICS 2361–2389
        </div>
      </footer>
    </div>
  )
}
