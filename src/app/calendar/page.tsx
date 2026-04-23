"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { font, color } from "@/lib/theme"
import { Nav } from "@/app/components/Nav"

const SYS  = font.sys
const MONO = font.mono

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CalEvent = any

interface WatchContent {
  measures:      string
  watch:         string
  forecast_note: string | null
}

function getWatchContent(id: string, consensus: string | null): WatchContent {
  if (id.startsWith('census-permits') || id.startsWith('census-new-residential')) {
    const isNewHomeSales = id.startsWith('census-new-residential')
    return {
      measures: isNewHomeSales
        ? "Sales of newly constructed single-family homes — direct measure of homebuilder demand and order backlog."
        : "Monthly count of new building permits and housing starts authorized — leading indicator of future construction pipeline.",
      watch: isNewHomeSales
        ? "New home sales have held up better than existing sales due to rate buydowns from builders. Watch months of supply: above 7 months signals builder oversupply and possible starts pullback."
        : "Watch whether the single-family component stabilizes after the rate-driven pullback. A rebound in single-family permits above 950K SAAR would signal H2 pipeline recovery.",
      forecast_note: consensus
        ? `Consensus is ${consensus}. A beat signals contractor workload expansion into Q3.`
        : null,
    }
  }

  if (id.startsWith('bls-employment')) {
    return {
      measures: "Monthly payroll employment, hours worked, and average hourly earnings for the construction sector.",
      watch: "Construction employment has grown for 8 consecutive months. A miss below +15K would be the first contraction signal in this cycle and a leading indicator of project deferrals.",
      forecast_note: consensus ? `Consensus is ${consensus}. Watch the average hourly earnings line — above +0.4% MoM signals accelerating wage pressure.` : null,
    }
  }

  if (id.startsWith('bls-jolts')) {
    return {
      measures: "Job openings, hires, and separations (quits + layoffs) in construction — measures labor market tightness.",
      watch: "The quit rate in construction is a leading indicator of wage pressure. Above 2.8% = tight labor market and rising wages. Watch openings-to-hires ratio: above 1.0 means demand exceeds available supply.",
      forecast_note: consensus ? `Consensus is ${consensus} openings. Rising openings with declining hires = contractors unable to fill roles.` : null,
    }
  }

  if (id.startsWith('bls-producer-prices') || id.startsWith('bls-ppi')) {
    return {
      measures: "Input cost inflation for construction materials and services — directly impacts bid prices, contract margins, and change order exposure.",
      watch: "PPI construction has been easing from its 2022–2023 peak. A reversal above +0.5% MoM would signal renewed margin pressure across all open-book contracts.",
      forecast_note: consensus ? `Consensus is ${consensus}. Any positive surprise widens the gap between awarded contract prices and actual material costs.` : null,
    }
  }

  if (id.startsWith('census-construction-spending')) {
    return {
      measures: "Total dollar value of construction put in place (private + public) — the broadest monthly measure of industry output.",
      watch: "Watch the public/private mix. Federal infrastructure spending has been offsetting residential softness. If public spending decelerates while residential remains weak, the aggregate picture deteriorates.",
      forecast_note: consensus ? `Consensus is ${consensus}. Watch the nonresidential private component as the indicator of commercial developer confidence.` : null,
    }
  }

  if (id.startsWith('fed-fomc')) {
    return {
      measures: "Federal Open Market Committee rate decision — sets the federal funds rate, which directly determines construction loan costs and mortgage rates.",
      watch: "A hold or cut reduces CRE financing costs and improves development feasibility. Watch the dot plot and forward guidance — a signal of cuts before year-end materially improves the residential pipeline outlook.",
      forecast_note: consensus ? `Current consensus: ${consensus}. Any dovish shift in language would immediately improve developer IRRs.` : null,
    }
  }

  if (id.startsWith('bea-gdp')) {
    return {
      measures: "Gross domestic product advance estimate — includes gross private domestic fixed investment in structures, construction's contribution to GDP.",
      watch: "Watch the structures sub-component specifically. It leads total construction spending by one quarter and provides the earliest read on whether the investment cycle is accelerating or decelerating.",
      forecast_note: consensus ? `Consensus is ${consensus} annualized. Below +2% would signal a broader slowdown in construction investment.` : null,
    }
  }

  if (id.startsWith('fred-senior-loan')) {
    return {
      measures: "Quarterly Federal Reserve survey of bank lending standards and demand for commercial real estate and construction loans.",
      watch: "Net tightening has been easing for three consecutive quarters. If lending standards ease further below net 10% tightening, expect construction loan availability to meaningfully improve in H2 2026.",
      forecast_note: consensus ? `Prior period: ${consensus}. A net easing reading would be the first since 2022.` : null,
    }
  }

  if (id.startsWith('bls-cpi')) {
    return {
      measures: "Consumer Price Index shelter component — owner-equivalent rent and primary rent inflation, which leads actual market rents by 12–18 months.",
      watch: "CPI shelter deceleration signals coming softness in rental market demand. Watch for monthly shelter CPI below +0.3% — that's the level that would trigger multifamily pipeline reassessment.",
      forecast_note: consensus ? `Consensus is ${consensus} MoM shelter. Persistent above +0.4% keeps multifamily development feasible.` : null,
    }
  }

  if (id.startsWith('eia-petroleum')) {
    return {
      measures: "Weekly crude oil and refined petroleum product inventory levels — diesel inventory directly tracks fuel costs for heavy equipment and asphalt paving operations.",
      watch: "Diesel is 8–12% of total heavy civil project costs. Watch distillate inventories vs. 5-year average: below average = price support = higher equipment operating costs for open projects.",
      forecast_note: consensus ? `Consensus: ${consensus}. A larger-than-expected draw tightens supply and pressures diesel prices.` : null,
    }
  }

  if (id.startsWith('eia-natural-gas')) {
    return {
      measures: "Weekly natural gas working gas in storage — tracks energy input costs for heating-intensive construction operations and prefabrication facilities.",
      watch: "Storage at or above the 5-year average limits price volatility. Below 10% of the 5-year average = elevated risk of a price spike affecting energy-intensive projects heading into winter.",
      forecast_note: consensus ? `Consensus injection: ${consensus}. Larger injections than expected = more supply comfort.` : null,
    }
  }

  return {
    measures:      "Monitor this release for construction market implications.",
    watch:         "Compare the actual result to consensus and prior period for signal direction.",
    forecast_note: null,
  }
}

const IMPORTANCE_COLOR: Record<string, string> = {
  high:   color.red,
  medium: color.amber,
  low:    color.t4,
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function daysFromToday(dateStr: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + "T00:00:00"); target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86400000)
}

function fmtDate(d: string) {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })
  } catch { return d }
}

function fmtMonthYear(d: string) {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })
  } catch { return d }
}

function DetailedReleaseCard({ event }: { event: CalEvent }) {
  const days    = daysFromToday(event.date)
  const watch   = getWatchContent(event.id, event.consensus)
  const impCol  = IMPORTANCE_COLOR[event.importance] ?? color.t4
  const isToday = days === 0

  return (
    <div style={{
      background:   color.bg1,
      border:       `1px solid ${isToday ? color.amber + '66' : color.bd1}`,
      borderLeft:   `3px solid ${isToday ? color.amber : impCol}`,
      borderRadius: 14,
      padding:      "24px 28px",
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

        {/* Left: date block */}
        <div style={{ minWidth: 88, flexShrink: 0, textAlign: "center", paddingTop: 4 }}>
          <div style={{
            fontFamily: MONO, fontSize: 22, fontWeight: 700,
            color: isToday ? color.amber : days <= 3 ? color.red : color.t1,
            lineHeight: 1,
          }}>
            {new Date(event.date + "T12:00:00").getDate()}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, marginTop: 2 }}>
            {new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", weekday: "short" }).toUpperCase()}
          </div>
          <div style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700,
            color: isToday ? color.amber : days <= 2 ? color.red : color.t4,
            marginTop: 6, letterSpacing: "0.06em",
          }}>
            {isToday ? "TODAY" : days === 1 ? "TOMORROW" : `IN ${days}D`}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 2 }}>
            {event.time} ET
          </div>
        </div>

        {/* Center: content */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontFamily: SYS, fontSize: 17, fontWeight: 700, color: color.t1, marginBottom: 6 }}>
            {event.name}
          </div>
          <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.6, marginBottom: 10 }}>
            {watch.measures}
          </div>
          <div style={{
            fontFamily:  SYS,
            fontSize:    13,
            color:       color.amber,
            lineHeight:  1.6,
            marginBottom: watch.forecast_note ? 8 : 0,
            background:  color.amberDim,
            border:      `1px solid ${color.amber}33`,
            borderRadius: 8,
            padding:     "8px 12px",
          }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", display: "block", marginBottom: 4, color: color.amber + "aa" }}>
              WHAT TO WATCH
            </span>
            {watch.watch}
          </div>
          {watch.forecast_note && (
            <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4, marginTop: 8, lineHeight: 1.5, paddingLeft: 2 }}>
              <span style={{ color: color.blue }}>Forecast: </span>{watch.forecast_note}
            </div>
          )}
        </div>

        {/* Right: importance + consensus */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
          <div style={{
            fontFamily:  MONO, fontSize: 10, fontWeight: 700,
            color:       impCol,
            background:  impCol + "22",
            border:      `1px solid ${impCol}44`,
            borderRadius: 6,
            padding:     "3px 10px",
            letterSpacing: "0.08em",
          }}>
            {event.importance.toUpperCase()}
          </div>
          {event.consensus && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.1em", marginBottom: 2 }}>CONSENSUS</div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: color.t2 }}>{event.consensus}</div>
            </div>
          )}
          {event.prior && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.1em", marginBottom: 2 }}>PRIOR</div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: color.t4 }}>{event.prior}</div>
            </div>
          )}
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{event.source}</div>
        </div>
      </div>
    </div>
  )
}

function SimpleReleaseRow({ event }: { event: CalEvent }) {
  const impCol = IMPORTANCE_COLOR[event.importance] ?? color.t4
  return (
    <div style={{
      display:     "flex",
      alignItems:  "center",
      gap:         16,
      padding:     "12px 16px",
      background:  color.bg2,
      border:      `1px solid ${color.bd1}`,
      borderRadius: 10,
      marginBottom: 8,
      flexWrap:    "wrap",
    }}>
      <div style={{ minWidth: 90, flexShrink: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: color.t2, fontWeight: 600 }}>{fmtDate(event.date)}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{event.time} ET</div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontFamily: SYS, fontSize: 14, color: color.t1, fontWeight: 500 }}>{event.name}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 2 }}>{event.source}</div>
      </div>
      {event.consensus && (
        <div style={{ fontFamily: MONO, fontSize: 12, color: color.t3, flexShrink: 0 }}>
          {event.consensus}
        </div>
      )}
      <div style={{
        fontFamily:  MONO, fontSize: 9, fontWeight: 700,
        color:       impCol,
        background:  impCol + "22",
        border:      `1px solid ${impCol}44`,
        borderRadius: 5,
        padding:     "2px 8px",
        letterSpacing: "0.08em",
        flexShrink:  0,
      }}>
        {event.importance.toUpperCase()}
      </div>
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      fontFamily:    MONO,
      fontSize:      10,
      color:         color.t4,
      letterSpacing: "0.14em",
      marginBottom:  16,
      paddingLeft:   2,
    }}>
      {label}
    </div>
  )
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/calendar")
      .then(r => r.json())
      .then(d => { setEvents(d.events ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const today = todayStr()
  const now   = new Date(); now.setHours(0, 0, 0, 0)

  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + 7)

  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  monthEnd.setHours(23, 59, 59, 999)

  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  nextMonthEnd.setHours(23, 59, 59, 999)

  const thisWeek   = events.filter(e => {
    const d = new Date(e.date + "T00:00:00")
    return d >= now && d < weekEnd
  })

  const thisMonth  = events.filter(e => {
    const d = new Date(e.date + "T00:00:00")
    return d >= weekEnd && d <= monthEnd
  })

  const nextMonth  = events.filter(e => {
    const d = new Date(e.date + "T00:00:00")
    return d >= nextMonthStart && d <= nextMonthEnd
  })

  const thisMonthLabel = new Date(today + "T12:00:00")
    .toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()

  const nextMonthLabel = nextMonthStart
    .toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()

  return (
    <div style={{ background: color.bg0, minHeight: "100vh", color: color.t1, fontFamily: SYS }}>
      <Nav />

      {/* Header */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 40px" }}>
        <div style={{
          fontFamily: MONO, fontSize: 11, color: color.t4,
          letterSpacing: "0.14em", marginBottom: 14,
        }}>
          DATA CALENDAR · CONSTRUCTION INTELLIGENCE
        </div>
        <h1 style={{
          fontFamily: SYS, fontSize: 38, fontWeight: 700,
          color: color.t1, margin: "0 0 12px", letterSpacing: "-0.02em",
        }}>
          What to Watch This Week
        </h1>
        <p style={{ fontFamily: SYS, fontSize: 16, color: color.t3, maxWidth: 540, lineHeight: 1.65, margin: 0 }}>
          Government data releases that move construction markets — with specific guidance on what the numbers mean for contractors, lenders, and suppliers.
        </p>

        <div style={{ display: "flex", gap: 20, marginTop: 28, flexWrap: "wrap" }}>
          {[
            { label: "HIGH IMPACT",   col: color.red   },
            { label: "MEDIUM IMPACT", col: color.amber },
            { label: "LOW IMPACT",    col: color.t4    },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.col, flexShrink: 0 }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: l.col }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, fontFamily: MONO, fontSize: 13, color: color.t4 }}>
            Loading calendar…
          </div>
        ) : (
          <>
            {/* ── THIS WEEK ─────────────────────────────────────────────── */}
            <div style={{ marginBottom: 48 }}>
              <SectionLabel label={`THIS WEEK — ${thisWeek.length} RELEASE${thisWeek.length !== 1 ? "S" : ""}`} />

              {thisWeek.length === 0 ? (
                <div style={{
                  background: color.bg1, border: `1px solid ${color.bd1}`,
                  borderRadius: 12, padding: "28px 24px", textAlign: "center",
                  fontFamily: SYS, fontSize: 14, color: color.t4,
                }}>
                  No high-impact releases in the next 7 days.
                  <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 12, color: color.t4 }}>
                    <Link href="/dashboard" style={{ color: color.blue, textDecoration: "none" }}>
                      Check the dashboard →
                    </Link>
                  </div>
                </div>
              ) : (
                thisWeek.map((e: CalEvent) => <DetailedReleaseCard key={e.id} event={e} />)
              )}
            </div>

            {/* ── THIS MONTH ────────────────────────────────────────────── */}
            {thisMonth.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <SectionLabel label={`LATER IN ${thisMonthLabel} — ${thisMonth.length} REMAINING`} />
                {thisMonth.map((e: CalEvent) => <SimpleReleaseRow key={e.id} event={e} />)}
              </div>
            )}

            {/* ── NEXT MONTH ────────────────────────────────────────────── */}
            {nextMonth.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={{
                  background:   color.bg1,
                  border:       `1px solid ${color.bd1}`,
                  borderRadius: 14,
                  padding:      "24px 28px",
                }}>
                  <SectionLabel label={`${nextMonthLabel} PREVIEW — MAJOR RELEASES`} />
                  {nextMonth.filter((e: CalEvent) => e.importance !== "low").map((e: CalEvent) => (
                    <SimpleReleaseRow key={e.id} event={e} />
                  ))}
                  {nextMonth.filter((e: CalEvent) => e.importance === "low").length > 0 && (
                    <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 8 }}>
                      + {nextMonth.filter((e: CalEvent) => e.importance === "low").length} low-impact release{nextMonth.filter((e: CalEvent) => e.importance === "low").length !== 1 ? "s" : ""} not shown
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PROPRIETARY: Satellite BSI ───────────────────────────── */}
            <div>
              <SectionLabel label="CONSTRUCTAIQ PROPRIETARY" />
              <div style={{
                background: color.bg1,
                border:     `1px solid ${color.blue}44`,
                borderLeft: `3px solid ${color.blue}`,
                borderRadius: 14,
                padding:    "20px 24px",
                display:    "flex",
                alignItems: "center",
                gap:        20,
                flexWrap:   "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: SYS, fontSize: 15, fontWeight: 600, color: color.t1, marginBottom: 4 }}>
                    Satellite BSI Update — Sentinel-2 / Copernicus
                  </div>
                  <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.5 }}>
                    Ground-level construction activity indices for 20 US MSAs derived from multispectral satellite imagery. Independent of self-reported data.
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: color.blue, marginBottom: 4 }}>EVERY SUNDAY</div>
                  <Link href="/ground-signal" style={{
                    fontFamily:    MONO, fontSize: 10, color: color.blue,
                    textDecoration: "none", letterSpacing: "0.06em",
                  }}>
                    View Ground Signal →
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
