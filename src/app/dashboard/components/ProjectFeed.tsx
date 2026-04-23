"use client"
import { useState } from "react"
import Link from "next/link"
import { color, font, radius } from "@/lib/theme"
import { Skeleton } from "@/app/components/Skeleton"

const SYS  = font.sys
const MONO = font.mono

export interface Project {
  id:                  number
  project_name:        string | null
  project_type:        string | null
  building_class:      string | null
  status:              string | null
  address:             string | null
  city:                string | null
  state_code:          string | null
  zip_code:            string | null
  valuation:           number | null
  sqft:                number | null
  units:               number | null
  applied_date:        string | null
  approved_date:       string | null
  latitude:            number | null
  longitude:           number | null
  satellite_signal:    boolean
  federal_award_match: boolean
  ai_summary:          string | null
}

interface Props {
  projects: Project[] | null
  total?:   number
  loading:  boolean
}

type FilterKey = 'all' | 'commercial' | 'residential' | '10m' | '50m'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'commercial',  label: 'Commercial' },
  { key: 'residential', label: 'Residential' },
  { key: '10m',         label: '$10M+' },
  { key: '50m',         label: '$50M+' },
]

function applyFilter(projects: Project[], filter: FilterKey): Project[] {
  if (filter === 'commercial')  return projects.filter(p => p.building_class === 'commercial')
  if (filter === 'residential') return projects.filter(p => p.building_class === 'residential')
  if (filter === '10m')         return projects.filter(p => (p.valuation ?? 0) >= 10_000_000)
  if (filter === '50m')         return projects.filter(p => (p.valuation ?? 0) >= 50_000_000)
  return projects
}

function fmtVal(v: number | null): string {
  if (v == null) return '—'
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toLocaleString()}`
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}

function statusDot(status: string | null): string {
  switch ((status ?? '').toLowerCase()) {
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

export function ProjectFeed({ projects, total, loading }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all')

  const visible = projects ? applyFilter(projects, filter) : []

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              fontFamily:  MONO,
              fontSize:    11,
              fontWeight:  600,
              letterSpacing: '0.06em',
              padding:     '5px 14px',
              borderRadius: radius.full,
              border:      `1px solid ${filter === f.key ? color.amber : color.bd2}`,
              background:  filter === f.key ? color.amber + '22' : 'transparent',
              color:       filter === f.key ? color.amber : color.t4,
              cursor:      'pointer',
              transition:  'all 0.15s',
              minHeight:   34,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{
        border: `1px solid ${color.bd1}`,
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              borderBottom: i < 4 ? `1px solid ${color.bd1}` : 'none',
            }}>
              <Skeleton height={40} borderRadius={6} />
            </div>
          ))
        ) : visible.length === 0 ? (
          <div style={{
            padding: '40px 24px',
            textAlign: 'center',
            fontFamily: SYS,
            fontSize: 14,
            color: color.t4,
          }}>
            No projects match the current filter
          </div>
        ) : (
          visible.map((p, i) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  minHeight: 64,
                  borderBottom: i < visible.length - 1 ? `1px solid ${color.bd1}` : 'none',
                  background: color.bg1,
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = color.bg2)}
                onMouseLeave={e => (e.currentTarget.style.background = color.bg1)}
              >
                {/* Status dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: statusDot(p.status),
                  flexShrink: 0,
                  boxShadow: p.status === 'active' ? `0 0 6px ${color.green}` : undefined,
                }} />

                {/* Project info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: SYS, fontSize: 14, fontWeight: 600,
                      color: color.t1, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: 320,
                    }}>
                      {p.project_name ?? 'Unnamed Project'}
                    </span>
                    {p.federal_award_match && (
                      <span style={{
                        fontFamily: MONO, fontSize: 9, fontWeight: 700,
                        letterSpacing: '0.08em',
                        background: color.blueDim,
                        border: `1px solid ${color.blue}55`,
                        color: color.blue,
                        borderRadius: radius.sm,
                        padding: '2px 6px',
                        flexShrink: 0,
                      }}>
                        FEDERAL
                      </span>
                    )}
                    {p.satellite_signal && (
                      <span style={{
                        fontFamily: MONO, fontSize: 9, fontWeight: 700,
                        letterSpacing: '0.08em',
                        background: color.greenDim,
                        border: `1px solid ${color.cyan}44`,
                        color: color.cyan,
                        borderRadius: radius.sm,
                        padding: '2px 6px',
                        flexShrink: 0,
                      }}>
                        SATELLITE ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: SYS, fontSize: 12, color: color.t3, marginTop: 2 }}>
                    {[p.address, p.city && p.state_code ? `${p.city}, ${p.state_code}` : p.city ?? p.state_code].filter(Boolean).join(' · ')}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 2 }}>
                    Applied: {fmtDate(p.applied_date)}
                    {p.approved_date ? ` · Approved: ${fmtDate(p.approved_date)}` : ''}
                  </div>
                </div>

                {/* Right column */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 15, fontWeight: 700,
                    color: color.amber, lineHeight: 1.2,
                  }}>
                    {fmtVal(p.valuation)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 9, fontWeight: 600,
                      letterSpacing: '0.06em',
                      color: classBadgeColor(p.building_class),
                      background: classBadgeColor(p.building_class) + '22',
                      border: `1px solid ${classBadgeColor(p.building_class)}44`,
                      borderRadius: radius.sm, padding: '2px 6px',
                    }}>
                      {(p.building_class ?? 'other').toUpperCase()}
                    </span>
                  </div>
                  {p.sqft != null && (
                    <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 3 }}>
                      {Number(p.sqft).toLocaleString()} sf
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      {!loading && (
        <div style={{
          fontFamily: MONO, fontSize: 10, color: color.t4,
          marginTop: 12, textAlign: 'center',
        }}>
          Showing {visible.length} of {total ?? (projects?.length ?? 0)} projects
          {' · '}Source: 26 city open data portals · Updated daily
        </div>
      )}
    </div>
  )
}
