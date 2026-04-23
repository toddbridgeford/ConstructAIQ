"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Nav } from "@/app/components/Nav"
import { color, font, radius } from "@/lib/theme"
import type { Project } from "@/app/dashboard/components/ProjectFeed"

const SYS  = font.sys
const MONO = font.mono

const MIN_VALUES = [
  { label: '$500K+', value: 500_000   },
  { label: '$5M+',   value: 5_000_000 },
  { label: '$10M+',  value: 10_000_000},
  { label: '$50M+',  value: 50_000_000},
]
const CLASSES  = ['All', 'Commercial', 'Residential', 'Industrial']
const STATUSES = ['All', 'Active', 'Applied']

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

function statusColor(s: string | null): string {
  switch ((s ?? '').toLowerCase()) {
    case 'active':    return color.green
    case 'applied':   return color.amber
    case 'completed': return color.t4
    case 'expired':   return color.red
    default:          return color.t4
  }
}

function classBadgeColor(cls: string | null): string {
  switch ((cls ?? '').toLowerCase()) {
    case 'commercial':  return color.amber
    case 'residential': return color.blue
    case 'industrial':  return color.green
    default:            return color.t4
  }
}

export default function ProjectsPage() {
  const [projects,   setProjects]   = useState<Project[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset,     setOffset]     = useState(0)

  const [search,    setSearch]    = useState('')
  const [cls,       setCls]       = useState('All')
  const [status,    setStatus]    = useState('All')
  const [minValue,  setMinValue]  = useState(500_000)

  const fetchProjects = useCallback(async (reset: boolean) => {
    const params = new URLSearchParams({
      limit:     '50',
      sort:      'valuation',
      min_value: String(minValue),
    })
    if (cls !== 'All')    params.set('class', cls.toLowerCase())
    if (status !== 'All') params.set('status', status.toLowerCase())
    const newOffset = reset ? 0 : offset + 50
    if (!reset) params.set('offset', String(newOffset))

    reset ? setLoading(true) : setLoadingMore(true)
    try {
      const r = await fetch(`/api/projects?${params}`)
      const d = await r.json()
      if (reset) {
        setProjects(d.projects ?? [])
        setOffset(0)
      } else {
        setProjects(prev => [...prev, ...(d.projects ?? [])])
        setOffset(newOffset)
      }
      setTotal(d.total ?? 0)
    } finally {
      reset ? setLoading(false) : setLoadingMore(false)
    }
  }, [cls, status, minValue, offset])

  useEffect(() => { fetchProjects(true) }, [cls, status, minValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const visible = search.trim()
    ? projects.filter(p =>
        [p.project_name, p.address, p.city, p.zip_code, p.state_code]
          .some(f => f?.toLowerCase().includes(search.toLowerCase()))
      )
    : projects

  const totalVal = projects.reduce((s, p) => s + (p.valuation ?? 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1, fontFamily: SYS }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{font-family:inherit;cursor:pointer;border:none;outline:none}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:768px){
          .proj-table-header{display:none!important}
          .proj-table-row{flex-direction:column!important;align-items:flex-start!important;gap:6px!important}
          .proj-col-val{justify-content:flex-start!important}
          .filter-row{flex-wrap:wrap!important}
        }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 80px' }}>

        {/* Page header */}
        <div style={{ paddingTop: 48, paddingBottom: 36 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.12em', marginBottom: 10 }}>
            ACTIVE PROJECTS
          </div>
          <h1 style={{ fontFamily: SYS, fontSize: 32, fontWeight: 700, color: color.t1, letterSpacing: '-0.03em', marginBottom: 10 }}>
            Active Construction Projects
          </h1>
          <p style={{ fontFamily: SYS, fontSize: 15, color: color.t3, maxWidth: 560, lineHeight: 1.6 }}>
            High-value construction projects from 26 US city permit databases.
            Free. Updated daily.
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search by city, zip code, or address…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', maxWidth: 480,
              background: color.bg1,
              border: `1px solid ${color.bd2}`,
              borderRadius: radius.md,
              color: color.t1,
              fontFamily: SYS, fontSize: 14,
              padding: '10px 16px',
              outline: 'none',
            }}
          />
        </div>

        {/* Filter pills */}
        <div className="filter-row" style={{ display: 'flex', gap: 20, marginBottom: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Class */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: '0.1em', marginBottom: 8 }}>TYPE</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {CLASSES.map(c => (
                <button key={c} onClick={() => setCls(c)} style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  padding: '4px 12px', borderRadius: radius.full, minHeight: 30,
                  border: `1px solid ${cls === c ? color.amber : color.bd2}`,
                  background: cls === c ? color.amber + '22' : 'transparent',
                  color: cls === c ? color.amber : color.t4,
                }}>{c}</button>
              ))}
            </div>
          </div>
          {/* Value */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: '0.1em', marginBottom: 8 }}>MIN VALUE</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {MIN_VALUES.map(v => (
                <button key={v.label} onClick={() => setMinValue(v.value)} style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  padding: '4px 12px', borderRadius: radius.full, minHeight: 30,
                  border: `1px solid ${minValue === v.value ? color.blue : color.bd2}`,
                  background: minValue === v.value ? color.blueDim : 'transparent',
                  color: minValue === v.value ? color.blue : color.t4,
                }}>{v.label}</button>
              ))}
            </div>
          </div>
          {/* Status */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: '0.1em', marginBottom: 8 }}>STATUS</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  padding: '4px 12px', borderRadius: radius.full, minHeight: 30,
                  border: `1px solid ${status === s ? color.green : color.bd2}`,
                  background: status === s ? color.greenDim : 'transparent',
                  color: status === s ? color.green : color.t4,
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Count summary */}
        {!loading && (
          <div style={{
            background: color.bg1, border: `1px solid ${color.bd1}`,
            borderRadius: radius.lg, padding: '16px 20px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.1em', marginBottom: 4 }}>TRACKING</div>
              <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: color.t1 }}>
                {total.toLocaleString()}
              </div>
              <div style={{ fontFamily: SYS, fontSize: 12, color: color.t3 }}>active projects · 26 cities</div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.1em', marginBottom: 4 }}>DECLARED VALUE</div>
              <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: color.amber }}>
                {totalVal >= 1e9
                  ? `$${(totalVal / 1e9).toFixed(1)}B`
                  : `$${(totalVal / 1e6).toFixed(0)}M`}
              </div>
              <div style={{ fontFamily: SYS, fontSize: 12, color: color.t3 }}>in construction value (shown)</div>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ border: `1px solid ${color.bd1}`, borderRadius: radius.lg, overflow: 'hidden' }}>
          {/* Header */}
          <div
            className="proj-table-header"
            style={{
              display: 'flex', gap: 0,
              background: color.bg1,
              borderBottom: `1px solid ${color.bd1}`,
            }}
          >
            {[
              { label: 'Project',    flex: 3 },
              { label: 'City',       flex: 1.2 },
              { label: 'Class',      flex: 0.9 },
              { label: 'Valuation',  flex: 1 },
              { label: 'Status',     flex: 0.9 },
              { label: 'Applied',    flex: 1 },
            ].map(col => (
              <div key={col.label} style={{
                flex:          col.flex,
                fontFamily:    MONO,
                fontSize:      9,
                fontWeight:    600,
                letterSpacing: '0.1em',
                color:         color.t4,
                padding:       '10px 14px',
              }}>
                {col.label.toUpperCase()}
              </div>
            ))}
          </div>

          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ padding: '10px 14px', borderBottom: `1px solid ${color.bd1}` }}>
                <div style={{
                  height: 32, borderRadius: 6,
                  background: `linear-gradient(90deg, ${color.bg2} 25%, ${color.bg3} 50%, ${color.bg2} 75%)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.6s infinite',
                }} />
              </div>
            ))
          ) : visible.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: SYS, fontSize: 14, color: color.t4 }}>
              No projects found
            </div>
          ) : (
            visible.map((p, i) => (
              <Link key={p.id} href={`/projects/${p.id}`} style={{ display: 'block' }}>
                <div
                  className="proj-table-row"
                  style={{
                    display: 'flex', alignItems: 'center',
                    borderBottom: i < visible.length - 1 ? `1px solid ${color.bd1}` : 'none',
                    background: color.bg0,
                    transition: 'background 0.12s',
                    minHeight: 52,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = color.bg1)}
                  onMouseLeave={e => (e.currentTarget.style.background = color.bg0)}
                >
                  {/* Project name */}
                  <div style={{ flex: 3, padding: '10px 14px' }}>
                    <div style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t1 }}>
                      {p.project_name ?? 'Unnamed Project'}
                    </div>
                    {p.address && (
                      <div style={{ fontFamily: SYS, fontSize: 11, color: color.t4, marginTop: 2 }}>
                        {p.address}
                      </div>
                    )}
                  </div>
                  {/* City */}
                  <div style={{ flex: 1.2, padding: '10px 14px' }}>
                    <span style={{ fontFamily: SYS, fontSize: 13, color: color.t2 }}>
                      {p.city}{p.state_code ? `, ${p.state_code}` : ''}
                    </span>
                  </div>
                  {/* Class */}
                  <div className="proj-col-val" style={{ flex: 0.9, padding: '10px 14px' }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.06em',
                      color:       classBadgeColor(p.building_class),
                      background:  classBadgeColor(p.building_class) + '22',
                      border:      `1px solid ${classBadgeColor(p.building_class)}44`,
                      borderRadius: radius.sm, padding: '3px 8px',
                    }}>
                      {(p.building_class ?? 'other').toUpperCase()}
                    </span>
                  </div>
                  {/* Valuation */}
                  <div style={{ flex: 1, padding: '10px 14px' }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: color.amber }}>
                      {fmtVal(p.valuation)}
                    </span>
                  </div>
                  {/* Status */}
                  <div style={{ flex: 0.9, padding: '10px 14px' }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: statusColor(p.status),
                      background: statusColor(p.status) + '22',
                      border: `1px solid ${statusColor(p.status)}44`,
                      borderRadius: radius.sm, padding: '3px 8px',
                    }}>
                      {(p.status ?? 'unknown').toUpperCase()}
                    </span>
                  </div>
                  {/* Applied date */}
                  <div style={{ flex: 1, padding: '10px 14px' }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: color.t4 }}>
                      {fmtDate(p.applied_date)}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && projects.length < total && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={() => fetchProjects(false)}
              disabled={loadingMore}
              style={{
                background: color.bg1,
                border: `1px solid ${color.bd2}`,
                color: loadingMore ? color.t4 : color.t1,
                fontFamily: SYS, fontSize: 14, fontWeight: 600,
                padding: '12px 32px', borderRadius: radius.md,
                minHeight: 48, cursor: loadingMore ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingMore ? 'Loading…' : `Load more · ${(total - projects.length).toLocaleString()} remaining`}
            </button>
          </div>
        )}

        {/* Data note */}
        <div style={{
          marginTop: 40, padding: '14px 18px',
          background: color.bg1, border: `1px solid ${color.bd1}`,
          borderRadius: radius.md,
          fontFamily: MONO, fontSize: 10, color: color.t4, lineHeight: 1.7,
        }}>
          Source: City of New York, Los Angeles, Chicago, Houston, Phoenix, and 21 other municipal open data portals
          (Socrata API) · Projects are building permits with declared valuation over the selected threshold
          · Data updated daily via permit harvest cron
        </div>
      </div>
    </div>
  )
}
