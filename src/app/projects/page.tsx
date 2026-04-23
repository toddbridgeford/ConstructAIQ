"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Nav } from "@/app/components/Nav"
import { color, font, layout as L } from "@/lib/theme"
import type { Project } from "@/app/dashboard/components/ProjectFeed"

// ── Types ──────────────────────────────────────────────────────────────────

interface CityOption { code: string; name: string; state: string }

// ── Design tokens ──────────────────────────────────────────────────────────

const { bg0: BG0, bg1: BG1, bg2: BG2, bg3: BG3, bd1: BD1, bd2: BD2,
        t1: T1, t2: T2, t3: T3, t4: T4,
        amber: AMBER, blue: BLUE, green: GREEN, red: RED } = color
const SYS = font.sys, MONO = font.mono
const ROW = L.rowHeight

// ── Constants ──────────────────────────────────────────────────────────────

const MIN_VALUES = [
  { label: 'All',    value: 0           },
  { label: '$500K+', value: 500_000     },
  { label: '$5M+',   value: 5_000_000   },
  { label: '$10M+',  value: 10_000_000  },
  { label: '$50M+',  value: 50_000_000  },
]
const CLASSES  = ['All', 'Commercial', 'Residential', 'Industrial']
const STATUSES = ['Active', 'Applied', 'All']

// ── Formatting ─────────────────────────────────────────────────────────────

function fmtVal(v: number | null): string {
  if (v == null) return '—'
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)}M`
  return `$${(v / 1_000).toFixed(0)}K`
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}

// ── Semantic colors ────────────────────────────────────────────────────────

function statusColor(s: string | null): string {
  switch ((s ?? '').toLowerCase()) {
    case 'active':    return GREEN
    case 'applied':   return AMBER
    case 'completed': return T4
    case 'expired':   return RED
    default:          return T4
  }
}

function classColor(cls: string | null): string {
  switch ((cls ?? '').toLowerCase()) {
    case 'commercial':  return AMBER
    case 'residential': return BLUE
    case 'industrial':  return GREEN
    default:            return T4
  }
}

// ── Filter pill ────────────────────────────────────────────────────────────

function FilterPill({
  label, active, accent = AMBER, onClick,
}: {
  label: string; active: boolean; accent?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily:    SYS,
        fontSize:      13,
        fontWeight:    active ? 600 : 400,
        color:         active ? accent : T4,
        background:    active ? `${accent}18` : 'transparent',
        border:        `1px solid ${active ? `${accent}44` : 'transparent'}`,
        borderRadius:  7,
        padding:       '5px 12px',
        cursor:        'pointer',
        textAlign:     'left',
        minHeight:     32,
        transition:    'all 0.1s',
        width:         '100%',
      }}
    >
      {label}
    </button>
  )
}

// ── Filter section label ───────────────────────────────────────────────────

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily:    MONO,
      fontSize:      9,
      color:         T4,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom:  6,
      marginTop:     20,
      paddingLeft:   4,
    }}>
      {children}
    </div>
  )
}

// ── Sortable column header ─────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'

function ColTh({
  label, flex, sortKey, currentKey, currentDir, onSort, align = 'left',
}: {
  label: string; flex: number; sortKey: string
  currentKey: string; currentDir: SortDir
  onSort: (k: string) => void; align?: 'left' | 'right'
}) {
  const active = sortKey === currentKey
  return (
    <div
      onClick={() => onSort(sortKey)}
      style={{
        flex,
        fontFamily:    MONO,
        fontSize:      9,
        fontWeight:    600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         active ? T2 : T4,
        padding:       '0 14px',
        height:        40,
        display:       'flex',
        alignItems:    'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        cursor:        'pointer',
        userSelect:    'none',
        gap:           4,
        borderBottom:  `1px solid ${BD2}`,
      }}
    >
      {label}
      {active && (
        <span style={{ color: AMBER, fontSize: 9 }}>
          {currentDir === 'asc' ? '▲' : '▼'}
        </span>
      )}
    </div>
  )
}

// ── Status badge ───────────────────────────────────────────────────────────

function Badge({ label, col }: { label: string; col: string }) {
  return (
    <span style={{
      fontFamily:    MONO,
      fontSize:      9,
      fontWeight:    700,
      letterSpacing: '0.06em',
      color:         col,
      background:    `${col}22`,
      border:        `1px solid ${col}44`,
      borderRadius:  5,
      padding:       '3px 8px',
      whiteSpace:    'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects,     setProjects]     = useState<Project[]>([])
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [loadingMore,  setLoadingMore]  = useState(false)
  const [limit,        setLimit]        = useState(50)
  const [cities,       setCities]       = useState<CityOption[]>([])

  const [search,    setSearch]   = useState('')
  const [cls,       setCls]      = useState('All')
  const [status,    setStatus]   = useState('Active')
  const [minValue,  setMinValue] = useState(500_000)
  const [cityCode,  setCityCode] = useState('ALL')
  const [sortKey,   setSortKey]  = useState('value')
  const [sortDir,   setSortDir]  = useState<SortDir>('desc')

  // Fetch city list from permits API for dropdown
  useEffect(() => {
    fetch('/api/permits')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.cities) {
          setCities(
            (d.cities as Array<{ city_code: string; city_name: string; state_code: string }>)
              .map(c => ({ code: c.city_code, name: c.city_name, state: c.state_code }))
              .sort((a, b) => a.name.localeCompare(b.name))
          )
        }
      })
      .catch(() => {})
  }, [])

  const fetchProjects = useCallback(async (newLimit: number) => {
    const params = new URLSearchParams({ limit: String(newLimit), sort: 'valuation' })
    if (minValue > 0)      params.set('min_value', String(minValue))
    if (cls !== 'All')     params.set('class', cls.toLowerCase())
    if (status !== 'All')  params.set('status', status.toLowerCase())
    if (cityCode !== 'ALL') params.set('city', cityCode)

    newLimit > limit ? setLoadingMore(true) : setLoading(true)
    try {
      const r = await fetch(`/api/projects?${params}`)
      const d = await r.json()
      setProjects(d.projects ?? [])
      setTotal(d.total ?? 0)
      setLimit(newLimit)
    } finally {
      setLoadingMore(false)
      setLoading(false)
    }
  }, [cls, status, minValue, cityCode, limit])

  useEffect(() => {
    setLimit(50)
    fetchProjects(50)
  }, [cls, status, minValue, cityCode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side sort + search
  const sorted = [...projects].sort((a, b) => {
    let av: string | number = 0, bv: string | number = 0
    if      (sortKey === 'project') { av = a.project_name ?? ''; bv = b.project_name ?? '' }
    else if (sortKey === 'city')    { av = a.city ?? '';          bv = b.city ?? ''          }
    else if (sortKey === 'class')   { av = a.building_class ?? ''; bv = b.building_class ?? '' }
    else if (sortKey === 'value')   { av = a.valuation ?? 0;       bv = b.valuation ?? 0       }
    else if (sortKey === 'status')  { av = a.status ?? '';         bv = b.status ?? ''         }
    else if (sortKey === 'date')    { av = a.applied_date ?? '';   bv = b.applied_date ?? ''   }
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    return sortDir === 'asc'
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number)
  })

  const visible = search.trim()
    ? sorted.filter(p =>
        [p.project_name, p.address, p.city, p.zip_code, p.state_code]
          .some(f => f?.toLowerCase().includes(search.toLowerCase()))
      )
    : sorted

  const totalVal = projects.reduce((s, p) => s + (p.valuation ?? 0), 0)

  function handleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'value' || key === 'date' ? 'desc' : 'asc') }
  }

  function clearFilters() {
    setCls('All'); setStatus('Active'); setMinValue(500_000); setCityCode('ALL'); setSearch('')
  }

  const hasActiveFilters = cls !== 'All' || status !== 'Active' || minValue !== 500_000 || cityCode !== 'ALL'

  return (
    <div style={{ minHeight: '100vh', background: BG0, color: T1, fontFamily: SYS }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .proj-row:hover { background: ${BG2} !important; }
        .proj-row:hover .proj-name { color: ${BLUE} !important; }
        .proj-layout { display: flex; gap: 0; align-items: flex-start; }
        .proj-filter-panel { width: 220px; flex-shrink: 0; }
        .proj-main { flex: 1; min-width: 0; }
        @media (max-width: 860px) {
          .proj-layout { flex-direction: column; }
          .proj-filter-panel { width: 100%; }
          .proj-col-city, .proj-col-class, .proj-col-date { display: none !important; }
        }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 48, paddingBottom: 32 }}>
          <h1 style={{ fontFamily: SYS, fontSize: 36, fontWeight: 700, color: T1,
                       letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Active Construction Projects
          </h1>

          {/* Summary badges */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {loading ? (
              [0, 1].map(i => (
                <div key={i} style={{ height: 52, width: 160, borderRadius: 8, background: BG2, opacity: 0.7 }} />
              ))
            ) : (
              <>
                <div style={{
                  background: BG1, border: `1px solid ${BD1}`, borderRadius: 8,
                  padding: '8px 18px', display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: T4, letterSpacing: '0.1em' }}>TOTAL PROJECTS</div>
                  <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: T1 }}>
                    {total.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  background: BG1, border: `1px solid ${BD1}`, borderRadius: 8,
                  padding: '8px 18px', display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: T4, letterSpacing: '0.1em' }}>DECLARED VALUE</div>
                  <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: AMBER }}>
                    {totalVal >= 1e9
                      ? `$${(totalVal / 1e9).toFixed(1)}B`
                      : `$${(totalVal / 1e6).toFixed(0)}M`}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Two-column layout ───────────────────────────────────────────── */}
        <div className="proj-layout">

          {/* LEFT: Filter panel */}
          <div className="proj-filter-panel" style={{
            borderRight:   `1px solid ${BD1}`,
            paddingRight:  20,
            paddingBottom: 40,
            position:      'sticky',
            top:           20,
            maxHeight:     'calc(100vh - 100px)',
            overflowY:     'auto',
          }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width:        '100%',
                background:   BG2,
                border:       `1px solid ${BD2}`,
                borderRadius: 8,
                color:        T1,
                fontFamily:   SYS,
                fontSize:     13,
                padding:      '9px 12px',
                outline:      'none',
                marginTop:    4,
              }}
            />

            {/* Building Class */}
            <FilterLabel>Building Class</FilterLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {CLASSES.map(c => (
                <FilterPill
                  key={c} label={c} active={cls === c}
                  accent={AMBER} onClick={() => setCls(c)}
                />
              ))}
            </div>

            {/* Value Range */}
            <FilterLabel>Value Range</FilterLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {MIN_VALUES.map(v => (
                <FilterPill
                  key={v.label} label={v.label}
                  active={minValue === v.value}
                  accent={BLUE}
                  onClick={() => setMinValue(v.value)}
                />
              ))}
            </div>

            {/* Status */}
            <FilterLabel>Status</FilterLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {STATUSES.map(s => (
                <FilterPill
                  key={s} label={s} active={status === s}
                  accent={GREEN} onClick={() => setStatus(s)}
                />
              ))}
            </div>

            {/* City */}
            <FilterLabel>City</FilterLabel>
            <select
              value={cityCode}
              onChange={e => setCityCode(e.target.value)}
              style={{
                width:        '100%',
                background:   BG2,
                border:       `1px solid ${BD2}`,
                borderRadius: 8,
                padding:      '8px 10px',
                fontFamily:   SYS,
                fontSize:     13,
                color:        T2,
                cursor:       'pointer',
                outline:      'none',
                minHeight:    36,
              }}
            >
              <option value="ALL">All Cities</option>
              {cities.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name}, {c.state}
                </option>
              ))}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  display:       'block',
                  width:         '100%',
                  marginTop:     20,
                  fontFamily:    MONO,
                  fontSize:      10,
                  color:         T4,
                  background:    'transparent',
                  border:        'none',
                  cursor:        'pointer',
                  letterSpacing: '0.06em',
                  textAlign:     'left',
                  padding:       '4px 4px',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* RIGHT: Table */}
          <div className="proj-main" style={{ paddingLeft: 24 }}>

            {/* Table */}
            <div style={{
              border:       `1px solid ${BD1}`,
              borderRadius: L.cardRadius,
              overflow:     'hidden',
            }}>
              {/* Column headers */}
              <div style={{ display: 'flex', background: BG2 }}>
                <ColTh label="Project"  flex={3}   sortKey="project" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <div className="proj-col-city" style={{ flex: 1.2 }}>
                  <ColTh label="City"   flex={1}   sortKey="city"    currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="proj-col-class" style={{ flex: 0.9 }}>
                  <ColTh label="Class"  flex={1}   sortKey="class"   currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <ColTh label="Value"    flex={1}   sortKey="value"   currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                <ColTh label="Status"   flex={0.9} sortKey="status"  currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <div className="proj-col-date" style={{ flex: 1 }}>
                  <ColTh label="Applied" flex={1}  sortKey="date"    currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
              </div>

              {/* Rows */}
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderTop: `1px solid ${BD1}` }}>
                    <div style={{
                      height: ROW - 20, borderRadius: 6,
                      background: `linear-gradient(90deg,${BG2} 25%,${BG3} 50%,${BG2} 75%)`,
                      backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite',
                      opacity: 1 - i * 0.1,
                    }} />
                  </div>
                ))
              ) : visible.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', fontFamily: SYS, fontSize: 14, color: T4 }}>
                  No projects match these filters.
                </div>
              ) : (
                visible.map((p, i) => (
                  <Link key={p.id} href={`/projects/${p.id}`} style={{ display: 'block' }}>
                    <div
                      className="proj-row"
                      style={{
                        display:    'flex',
                        alignItems: 'center',
                        borderTop:  `1px solid ${BD1}`,
                        background: i % 2 === 0 ? BG0 : BG1,
                        minHeight:  ROW,
                        transition: 'background 0.1s',
                      }}
                    >
                      {/* Project */}
                      <div style={{ flex: 3, padding: '10px 14px', minWidth: 0 }}>
                        <div className="proj-name" style={{
                          fontFamily: SYS, fontSize: 13, fontWeight: 600, color: T1,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          transition: 'color 0.1s',
                        }}>
                          {p.project_name ?? 'Unnamed Project'}
                        </div>
                        {p.address && (
                          <div style={{ fontFamily: SYS, fontSize: 11, color: T4, marginTop: 2,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.address}
                          </div>
                        )}
                      </div>
                      {/* City */}
                      <div className="proj-col-city" style={{ flex: 1.2, padding: '10px 14px' }}>
                        <span style={{ fontFamily: SYS, fontSize: 13, color: T2 }}>
                          {p.city}{p.state_code ? `, ${p.state_code}` : ''}
                        </span>
                      </div>
                      {/* Class */}
                      <div className="proj-col-class" style={{ flex: 0.9, padding: '10px 14px' }}>
                        <Badge
                          label={(p.building_class ?? 'other').toUpperCase()}
                          col={classColor(p.building_class)}
                        />
                      </div>
                      {/* Value */}
                      <div style={{ flex: 1, padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: AMBER }}>
                          {fmtVal(p.valuation)}
                        </span>
                      </div>
                      {/* Status */}
                      <div style={{ flex: 0.9, padding: '10px 14px' }}>
                        <Badge
                          label={(p.status ?? 'unknown').toUpperCase()}
                          col={statusColor(p.status)}
                        />
                      </div>
                      {/* Date */}
                      <div className="proj-col-date" style={{ flex: 1, padding: '10px 14px' }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>
                          {fmtDate(p.applied_date)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Load more */}
            {!loading && projects.length < total && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  onClick={() => fetchProjects(limit + 50)}
                  disabled={loadingMore}
                  style={{
                    background:   BG1,
                    border:       `1px solid ${BD2}`,
                    color:        loadingMore ? T4 : T1,
                    fontFamily:   SYS,
                    fontSize:     13,
                    fontWeight:   600,
                    padding:      '11px 28px',
                    borderRadius: 8,
                    minHeight:    44,
                    cursor:       loadingMore ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadingMore
                    ? 'Loading…'
                    : `Load more · ${(total - projects.length).toLocaleString()} remaining`}
                </button>
              </div>
            )}

            {/* Source note */}
            <div style={{
              marginTop:     32,
              fontFamily:    MONO,
              fontSize:      10,
              color:         T4,
              letterSpacing: '0.04em',
              lineHeight:    1.7,
              paddingBottom: 20,
            }}>
              Source: 40 US city open data portals (Socrata API) · Projects are permits with declared
              valuation over selected threshold · Updated daily
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
