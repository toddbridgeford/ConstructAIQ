"use client"
import { useEffect, useState } from "react"
import { font, color } from "@/lib/theme"
import { Nav } from "@/app/components/Nav"

const SYS = font.sys
const MONO = font.mono

const IMPORTANCE_COLOR: Record<string, string> = {
  high: color.red,
  medium: color.amber,
  low: color.t4,
}

const CATEGORY_COLOR: Record<string, string> = {
  permits: color.green,
  costs: color.amber,
  labor: color.blue,
  spending: color.purple,
  credit: color.red,
  energy: color.yellow,
}

function fmtDate(d: string) {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })
  } catch { return d }
}

function daysUntil(d: string) {
  const now = new Date(); now.setHours(0,0,0,0)
  const target = new Date(d + "T00:00:00"); target.setHours(0,0,0,0)
  return Math.round((target.getTime() - now.getTime()) / 86400000)
}

function nextSundayLabel() {
  const d = new Date()
  const day = d.getDay()
  const daysAhead = day === 0 ? 7 : 7 - day
  d.setDate(d.getDate() + daysAhead)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EventRow({ event, expanded, onToggle }: { event: any; expanded: boolean; onToggle: () => void }) {
  const days = daysUntil(event.date)
  const impColor = IMPORTANCE_COLOR[event.importance] ?? color.t4
  const catColor = CATEGORY_COLOR[event.category] ?? color.blue

  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? color.bg3 : color.bg2,
        border: `1px solid ${expanded ? color.bd2 : color.bd1}`,
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 8,
        cursor: "pointer",
        transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {/* Date block */}
        <div style={{ minWidth: 80, textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 13, color: color.t2, fontWeight: 600 }}>{fmtDate(event.date)}</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: days <= 3 ? color.red : days <= 7 ? color.amber : color.t4, marginTop: 2 }}>
            {days === 0 ? "TODAY" : days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d`}
          </div>
        </div>

        {/* Time */}
        <div style={{ fontFamily: MONO, fontSize: 12, color: color.t4, minWidth: 50 }}>{event.time} ET</div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: SYS, fontSize: 15, color: color.t1, fontWeight: 500 }}>{event.name}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: catColor, background: catColor + "22", border: `1px solid ${catColor}33`, borderRadius: 4, padding: "2px 7px" }}>
              {event.category.toUpperCase()}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{event.source}</span>
          </div>
        </div>

        {/* Importance dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: impColor }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: impColor }}>{event.importance.toUpperCase()}</span>
        </div>

        {/* Consensus */}
        <div style={{ textAlign: "right", minWidth: 120 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, marginBottom: 2 }}>CONSENSUS</div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: color.t2 }}>{event.consensus ?? "—"}</div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${color.bd2}` }}>
          <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, margin: "0 0 12px" }}>{event.description}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ background: color.bg4, borderRadius: 8, padding: "8px 14px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginBottom: 4 }}>PRIOR</div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: color.t2 }}>{event.prior ?? "—"}</div>
            </div>
            <div style={{ background: color.bg4, borderRadius: 8, padding: "8px 14px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginBottom: 4 }}>FORECAST</div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: color.t2 }}>{event.consensus ?? "—"}</div>
            </div>
          </div>
          {event.impact?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginBottom: 6 }}>MARKET IMPACT</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {event.impact.map((imp: string, i: number) => (
                  <span key={i} style={{ fontFamily: SYS, fontSize: 12, color: color.t3, background: color.bg4, border: `1px solid ${color.bd2}`, borderRadius: 6, padding: "3px 10px" }}>{imp}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const CATS = [
  { id: "all", label: "All" },
  { id: "permits", label: "Permits" },
  { id: "costs", label: "Costs" },
  { id: "labor", label: "Labor" },
  { id: "spending", label: "Spending" },
  { id: "credit", label: "Credit" },
  { id: "energy", label: "Energy" },
]

export default function CalendarPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [cat, setCat] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/calendar?category=${cat}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [cat])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: any[] = data?.events ?? []

  // Group by week
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped: Record<string, any[]> = {}
  for (const e of events) {
    const d = new Date(e.date + "T12:00:00")
    const mon = new Date(d); mon.setDate(d.getDate() - d.getDay() + 1)
    const key = mon.toLocaleDateString("en-US", { month: "long", day: "numeric" })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  }

  return (
    <div style={{ background: color.bg0, minHeight: "100vh", color: color.t1 }}>
      <Nav />

      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 32px", textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.12em", marginBottom: 16 }}>ECONOMIC CALENDAR · CONSTRUCTION INTELLIGENCE</div>
        <h1 style={{ fontFamily: SYS, fontSize: 42, fontWeight: 700, color: color.t1, margin: "0 0 16px" }}>Construction Economic Calendar</h1>
        <p style={{ fontFamily: SYS, fontSize: 18, color: color.t3, maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Track government data releases that move construction markets — permits, payrolls, cost indices, and financing rates.
        </p>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { label: "HIGH IMPACT", color: color.red },
            { label: "MEDIUM IMPACT", color: color.amber },
            { label: "LOW IMPACT", color: color.t4 },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: l.color }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 24px" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => { setCat(c.id); setExpandedId(null) }}
              style={{
                fontFamily: MONO, fontSize: 11, padding: "7px 16px", borderRadius: 8, cursor: "pointer", border: "none",
                background: cat === c.id ? color.amber : color.bg2,
                color: cat === c.id ? color.bg0 : color.t3,
                fontWeight: cat === c.id ? 700 : 400,
              }}
            >
              {c.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ConstructAIQ Proprietary Releases */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: MONO, fontSize: 11, color: color.amber,
            letterSpacing: "0.12em", marginBottom: 16, paddingLeft: 4,
          }}>
            ConstructAIQ Proprietary Releases
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Satellite BSI weekly */}
            <div style={{
              background: color.bg2, border: `1px solid ${color.blue}44`,
              borderRadius: 12, padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
            }}>
              <div style={{ minWidth: 80, textAlign: "center" }}>
                <div style={{ fontFamily: MONO, fontSize: 13, color: color.t2, fontWeight: 600 }}>Next: {nextSundayLabel()}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: color.blue, marginTop: 2 }}>WEEKLY</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: SYS, fontSize: 15, color: color.t1, fontWeight: 500 }}>Satellite BSI Update — Sentinel-2</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, marginTop: 4 }}>
                  Every Sunday · 20 US MSAs · Copernicus Data Space
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color.blue }} />
                <span style={{ fontFamily: MONO, fontSize: 10, color: color.blue }}>MEDIUM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Government data releases */}
        {!data ? (
          <div style={{ textAlign: "center", padding: 48, fontFamily: MONO, fontSize: 13, color: color.t4 }}>Loading calendar…</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, fontFamily: MONO, fontSize: 13, color: color.t4 }}>No events in this category</div>
        ) : (
          Object.entries(grouped).map(([week, wEvents]) => (
            <div key={week} style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em", marginBottom: 12, paddingLeft: 4 }}>
                WEEK OF {week.toUpperCase()}
              </div>
              {wEvents.map(e => (
                <EventRow
                  key={e.id}
                  event={e}
                  expanded={expandedId === e.id}
                  onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
