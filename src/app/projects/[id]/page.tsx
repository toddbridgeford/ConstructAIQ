"use client"
import { use, useState, useEffect } from "react"
import Link from "next/link"
import { Nav } from "@/app/components/Nav"
import { color, font, radius } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

interface ProjectEvent {
  id:          number
  event_type:  string
  event_date:  string
  description: string | null
  value:       number | null
  source:      string | null
}

interface ProjectDetail {
  id:                   number
  project_name:         string | null
  project_type:         string | null
  building_class:       string | null
  status:               string | null
  address:              string | null
  city:                 string | null
  state_code:           string | null
  zip_code:             string | null
  latitude:             number | null
  longitude:            number | null
  valuation:            number | null
  sqft:                 number | null
  units:                number | null
  applied_date:         string | null
  approved_date:        string | null
  started_date:         string | null
  estimated_completion: string | null
  satellite_bsi_change: number | null
  federal_award_match:  boolean
  federal_award_id:     string | null
  ai_summary:           string | null
  ai_generated_at:      string | null
  first_seen_at:        string
  last_updated_at:      string
  events:               ProjectEvent[]
}

function fmtVal(v: number | null): string {
  if (v == null) return '—'
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(2)}M`
  return `$${v.toLocaleString()}`
}

function fmtSqft(v: number | null): string {
  if (v == null) return '—'
  return `${Number(v).toLocaleString()} sf`
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
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

function eventTypeLabel(t: string): string {
  switch (t) {
    case 'permit_issued':          return 'Permit Issued'
    case 'permit_finaled':         return 'Permit Finaled'
    case 'satellite_surge':        return 'Satellite Activity Detected'
    case 'federal_award_matched':  return 'Federal Award Matched'
    default:                       return t.replace(/_/g, ' ')
  }
}

function eventColor(t: string): string {
  switch (t) {
    case 'permit_issued':         return color.green
    case 'permit_finaled':        return color.t3
    case 'satellite_surge':       return color.cyan
    case 'federal_award_matched': return color.blue
    default:                      return color.t4
  }
}

function KeyFact({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div style={{
      background: color.bg1, border: `1px solid ${color.bd1}`,
      borderRadius: radius.lg, padding: '18px 20px',
    }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: '0.1em', marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: highlight ?? color.t1 }}>
        {value}
      </div>
    </div>
  )
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then(d => { if (d) setProject(d) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1, fontFamily: SYS }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{font-family:inherit;cursor:pointer;border:none;outline:none}
        @media(max-width:768px){
          .kpi-grid{grid-template-columns:1fr 1fr!important}
          .signal-row{flex-direction:column!important}
        }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 80px' }}>

        {/* Back link */}
        <div style={{ paddingTop: 32, marginBottom: 28 }}>
          <Link href="/projects" style={{
            fontFamily: MONO, fontSize: 11, color: color.t4,
            letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            ← All Projects
          </Link>
        </div>

        {loading && (
          <div>
            {[120, 80, 280, 200].map((h, i) => (
              <div key={i} style={{
                height: h, borderRadius: 12, marginBottom: 20,
                background: `linear-gradient(90deg, ${color.bg2} 25%, ${color.bg3} 50%, ${color.bg2} 75%)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.6s infinite',
              }} />
            ))}
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
          </div>
        )}

        {notFound && !loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontFamily: SYS, fontSize: 18, color: color.t3, marginBottom: 16 }}>
              Project not found
            </div>
            <Link href="/projects">
              <button style={{
                background: color.blue, color: color.t1,
                fontFamily: SYS, fontSize: 14, fontWeight: 600,
                padding: '10px 24px', borderRadius: radius.md, minHeight: 44,
              }}>
                Back to Projects
              </button>
            </Link>
          </div>
        )}

        {project && !loading && (
          <>
            {/* Header */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{
                  fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                  color: statusColor(project.status),
                  background: statusColor(project.status) + '22',
                  border: `1px solid ${statusColor(project.status)}44`,
                  borderRadius: radius.sm, padding: '3px 10px',
                }}>
                  {(project.status ?? 'unknown').toUpperCase()}
                </span>
                <span style={{
                  fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                  color: classBadgeColor(project.building_class),
                  background: classBadgeColor(project.building_class) + '22',
                  border: `1px solid ${classBadgeColor(project.building_class)}44`,
                  borderRadius: radius.sm, padding: '3px 10px',
                }}>
                  {(project.building_class ?? 'other').toUpperCase()}
                </span>
              </div>
              <h1 style={{
                fontFamily: SYS, fontSize: 26, fontWeight: 700,
                color: color.t1, letterSpacing: '-0.025em',
                lineHeight: 1.25, marginBottom: 8,
              }}>
                {project.project_name ?? 'Unnamed Project'}
              </h1>
              <div style={{ fontFamily: SYS, fontSize: 14, color: color.t3 }}>
                {[project.address, project.city && project.state_code
                  ? `${project.city}, ${project.state_code}`
                  : project.city].filter(Boolean).join(' · ')}
                {project.zip_code ? ` ${project.zip_code}` : ''}
              </div>
            </div>

            {/* Key facts */}
            <div
              className="kpi-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}
            >
              <KeyFact label="Valuation"     value={fmtVal(project.valuation)}    highlight={color.amber} />
              <KeyFact label="Square Footage" value={fmtSqft(project.sqft)} />
              <KeyFact label="Applied"        value={fmtDate(project.applied_date)} />
              <KeyFact label="Approved"       value={fmtDate(project.approved_date)} />
            </div>

            {/* Intelligence signals */}
            {(project.federal_award_match || (project.satellite_bsi_change != null && project.satellite_bsi_change > 15)) && (
              <div className="signal-row" style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
                {project.federal_award_match && (
                  <div style={{
                    flex: 1, minWidth: 240,
                    background: color.blueDim,
                    border: `1px solid ${color.blue}44`,
                    borderRadius: radius.lg, padding: '18px 20px',
                  }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: color.blue, letterSpacing: '0.1em', marginBottom: 10 }}>
                      FEDERAL AWARD MATCH
                    </div>
                    <div style={{ fontFamily: SYS, fontSize: 13, color: color.t2, lineHeight: 1.6 }}>
                      This project location coincides with a USASpending.gov federal construction award.
                      {project.federal_award_id && (
                        <> Award ID: <span style={{ fontFamily: MONO, color: color.t1 }}>{project.federal_award_id}</span></>
                      )}
                    </div>
                  </div>
                )}
                {project.satellite_bsi_change != null && project.satellite_bsi_change > 15 && (
                  <div style={{
                    flex: 1, minWidth: 240,
                    background: color.greenDim,
                    border: `1px solid ${color.cyan}44`,
                    borderRadius: radius.lg, padding: '18px 20px',
                  }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: color.cyan, letterSpacing: '0.1em', marginBottom: 10 }}>
                      SATELLITE GROUND SIGNAL
                    </div>
                    <div style={{ fontFamily: SYS, fontSize: 13, color: color.t2, lineHeight: 1.6 }}>
                      Sentinel-2 satellite imagery shows{' '}
                      <strong style={{ color: color.t1 }}>
                        {project.satellite_bsi_change.toFixed(1)}%
                      </strong>{' '}
                      increase in ground disturbance in this MSA. Consistent with active construction.
                      Source: ESA Copernicus.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Summary */}
            {project.ai_summary && (
              <div style={{
                background: color.bg1, border: `1px solid ${color.bd1}`,
                borderRadius: radius.lg, padding: '20px 22px',
                marginBottom: 32,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: '0.1em', marginBottom: 10 }}>
                  AI PROJECT BRIEF
                </div>
                <p style={{ fontFamily: SYS, fontSize: 14, color: color.t2, lineHeight: 1.65, margin: 0 }}>
                  {project.ai_summary}
                </p>
                {project.ai_generated_at && (
                  <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 10 }}>
                    Generated by Claude · {fmtDate(project.ai_generated_at)}
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: '0.1em', marginBottom: 16 }}>
                PROJECT TIMELINE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Always show applied + approved from project fields */}
                {[
                  { date: project.applied_date,  label: 'Applied',        color: color.amber },
                  { date: project.approved_date, label: 'Permit Issued',  color: color.green },
                  { date: project.started_date,  label: 'Construction Started', color: color.blue },
                ].filter(e => e.date).map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: e.color, marginTop: 3 }} />
                      <div style={{ width: 1, height: 28, background: color.bd1 }} />
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                      <div style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t1 }}>{e.label}</div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4 }}>{fmtDate(e.date)}</div>
                    </div>
                  </div>
                ))}
                {/* Additional events from project_events */}
                {project.events.map((ev, i) => (
                  <div key={ev.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: eventColor(ev.event_type), marginTop: 3 }} />
                      {i < project.events.length - 1 && (
                        <div style={{ width: 1, height: 28, background: color.bd1 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                      <div style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t1 }}>
                        {eventTypeLabel(ev.event_type)}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4 }}>{fmtDate(ev.event_date)}</div>
                      {ev.description && (
                        <div style={{ fontFamily: SYS, fontSize: 12, color: color.t3, marginTop: 3 }}>{ev.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data source note */}
            <div style={{
              background: color.bg1, border: `1px solid ${color.bd1}`,
              borderRadius: radius.md, padding: '12px 16px',
            }}>
              <p style={{ fontFamily: MONO, fontSize: 10, color: color.t4, margin: 0, lineHeight: 1.7 }}>
                Source: {project.city ?? 'City'} open data portal
                {project.ai_summary ? ' · Permit #' + id : ''}
                {project.applied_date ? ` · Applied ${fmtDate(project.applied_date)}` : ''}
                {' · Data as of '}
                {fmtDate(project.last_updated_at)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
