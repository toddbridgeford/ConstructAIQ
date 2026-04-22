"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, CartesianGrid, Legend,
} from "recharts"
import { color, font, type as typeScale, radius, space } from "@/lib/theme"

// ─── types ────────────────────────────────────────────────────────────────────

type Dist5 = Record<string, number>
type MaterialDist = Record<string, number>
type CrossTabEntry = { backlog_net: number; margin_net: number; labor_net: number; market_net: number; n?: number }
type CrossTab = Record<string, CrossTabEntry>

interface SurveyResults {
  quarter: string
  respondent_count: number
  published_at: string | null
  closes_at: string
  collecting: boolean
  backlog_net: number | null
  margin_net: number | null
  labor_net: number | null
  market_net: number | null
  backlog_qoq: number | null
  margin_qoq: number | null
  labor_qoq: number | null
  market_qoq: number | null
  backlog_dist: Dist5
  margin_dist: Dist5
  labor_dist: Dist5
  market_dist: Dist5
  material_dist: MaterialDist
  by_region: CrossTab
  by_company_size: CrossTab
  by_work_type: CrossTab
}

interface TrendPoint {
  quarter: string
  backlog_net: number
  margin_net: number
  labor_net: number
  market_net: number
}

// ─── constants ────────────────────────────────────────────────────────────────

const SYS  = font.sys
const MONO = font.mono

const DIST_COLORS = [
  color.red,         // level 1 — most negative
  color.gradOrange,  // level 2
  color.t4,          // level 3 — neutral gray
  color.gradGreen,   // level 4
  color.green,       // level 5 — most positive
]

const MAT_LABELS: Record<string, string> = {
  lumber:   "Lumber",
  steel:    "Steel",
  concrete: "Concrete",
  copper:   "Copper/Wire",
  fuel:     "Fuel/Diesel",
  none:     "None",
  other:    "Other",
}

const REGION_ORDER = ["northeast", "southeast", "midwest", "southwest", "west", "national"]
const REGION_LABELS: Record<string, string> = {
  northeast: "Northeast", southeast: "Southeast", midwest: "Midwest",
  southwest: "Southwest", west: "West", national: "National",
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    })
  } catch { return iso }
}

function netColor(n: number | null): string {
  if (n === null) return color.t4
  if (n > 15)  return color.green
  if (n < -5)  return color.red
  return color.amber
}

function netBg(n: number | null): string {
  if (n === null) return color.bg3
  if (n > 15)  return color.greenDim
  if (n < -5)  return color.redDim
  return color.amberDim
}

function qoqStr(v: number | null): string {
  if (v === null) return "—"
  return `${v > 0 ? "+" : ""}${v}`
}

function dist5ToChartRow(label: string, dist: Dist5): Record<string, number | string> {
  return { name: label, "1": dist["1"] ?? 0, "2": dist["2"] ?? 0, "3": dist["3"] ?? 0, "4": dist["4"] ?? 0, "5": dist["5"] ?? 0 }
}

// ─── sub-components ───────────────────────────────────────────────────────────

function IndexCard({
  label, abbr, score, qoq,
}: { label: string; abbr: string; score: number | null; qoq: number | null }) {
  const col = netColor(score)
  const bg  = netBg(score)
  return (
    <div style={{
      flex: "1 1 140px",
      background: score !== null ? bg : color.bg2,
      border: `1px solid ${score !== null ? col + "44" : color.bd1}`,
      borderRadius: radius.lg,
      padding: "20px 18px",
      minWidth: 130,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 8 }}>
        {abbr}
      </div>
      {score !== null ? (
        <>
          <div style={{
            fontFamily: SYS,
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: col,
            marginBottom: 6,
          }}>
            {score > 0 ? "+" : ""}{score}
          </div>
          <div style={{ fontFamily: SYS, fontSize: 12, color: color.t3, marginBottom: 6 }}>{label}</div>
          {qoq !== null && (
            <div style={{
              fontFamily: MONO, fontSize: 11,
              color: qoq > 0 ? color.green : qoq < 0 ? color.red : color.t4,
            }}>
              vs Q1: {qoqStr(qoq)}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ fontFamily: SYS, fontSize: 30, fontWeight: 700, color: color.t4, marginBottom: 6 }}>—</div>
          <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4 }}>{label}</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 4 }}>collecting</div>
        </>
      )}
    </div>
  )
}

function cellColor(v: number | null | undefined): string {
  if (v == null) return color.t4
  if (v > 20)  return color.green
  if (v < 0)   return color.red
  return color.amber
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function SurveyResultsPage() {
  const [data, setData]   = useState<SurveyResults | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/survey/results").then(r => r.json()),
      fetch("/api/survey/trend").then(r => r.json()),
    ]).then(([results, trendData]) => {
      setData(results)
      setTrend(trendData?.trend ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleSubscribe() {
    if (!email.includes("@")) return
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "survey-results" }),
      })
      setSubscribed(true)
    } catch {/* ignore */}
  }

  const q = data?.quarter ?? "Q2 2025"
  const isCollecting = data?.collecting !== false
  const hasResults   = !isCollecting && data?.backlog_net !== null

  // Build distribution chart data — one row per question
  const distData = hasResults ? [
    dist5ToChartRow("Backlog", data!.backlog_dist),
    dist5ToChartRow("Margins", data!.margin_dist),
    dist5ToChartRow("Labor",   data!.labor_dist),
    dist5ToChartRow("Market",  data!.market_dist),
  ] : []

  // Material chart data sorted by value desc
  const matData = hasResults
    ? Object.entries(data!.material_dist)
        .filter(([k]) => k !== "none")
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => ({ name: MAT_LABELS[k] ?? k, pct: v }))
    : []

  return (
    <div style={{
      minHeight: "100vh",
      background: color.bg0,
      color: color.t1,
      fontFamily: SYS,
      paddingBottom: "env(safe-area-inset-bottom, 32px)",
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{font-family:inherit;cursor:pointer;border:none;outline:none}
        input::placeholder{color:${color.t4}}
        input:focus{border-color:${color.bd2}!important;outline:none}
        @media(max-width:640px){
          .index-cards{flex-wrap:wrap!important}
          .region-table{overflow-x:auto}
          .trend-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: color.bg1 + "ee",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${color.bd1}`,
        height: 60,
        paddingTop: "env(safe-area-inset-top, 0px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ"
              style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 20, background: color.bd1 }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em" }}>
            GC SURVEY RESULTS
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/survey">
            <button style={{
              background: color.blue,
              color: color.t1,
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 18px",
              borderRadius: radius.sm,
              minHeight: 44,
            }}>Take Survey</button>
          </Link>
          <Link href="/dashboard">
            <button style={{
              background: "transparent",
              color: color.t3,
              fontSize: 13,
              fontFamily: MONO,
              letterSpacing: "0.07em",
              padding: "8px 16px",
              border: `1px solid ${color.bd1}`,
              borderRadius: radius.sm,
              minHeight: 44,
            }}>DASHBOARD</button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>

        {/* ── SECTION 1: Header ── */}
        <div style={{ paddingTop: 52, paddingBottom: 40 }}>
          <div style={{ marginBottom: 20 }}>
            {/* Quarter badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: color.bg2,
              border: `1px solid ${color.bd2}`,
              borderRadius: radius.full,
              padding: "5px 14px",
              marginBottom: 18,
            }}>
              <div style={{
                width: 6, height: 6,
                borderRadius: radius.full,
                background: isCollecting ? color.amber : color.green,
              }} />
              <span style={{ fontFamily: MONO, fontSize: 11, color: isCollecting ? color.amber : color.green, letterSpacing: "0.1em" }}>
                {isCollecting ? `${q} · COLLECTING RESPONSES` : `${q} · PUBLISHED`}
              </span>
            </div>

            <h1 style={{ ...typeScale.h2, color: color.t1, marginBottom: 10 }}>
              {q} Construction Intelligence Survey
            </h1>

            <p style={{ ...typeScale.body, color: color.t3, lineHeight: 1.6 }}>
              {hasResults
                ? `${(data!.respondent_count).toLocaleString()} construction professionals · Published ${fmtDate(data!.published_at)}`
                : isCollecting
                ? `${(data?.respondent_count ?? 0).toLocaleString()} responses collected · Results publish ${fmtDate(data?.closes_at ?? null)}`
                : "Loading…"}
            </p>
          </div>

          {/* ── Collecting state ── */}
          {isCollecting && (
            <div style={{
              background: color.bg2,
              border: `1px solid ${color.bd1}`,
              borderRadius: radius.lg,
              padding: "28px 32px",
              marginTop: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 16,
            }}>
              <div style={{ ...typeScale.h4, color: color.t1 }}>
                Collecting responses for {q}
              </div>
              <div style={{ ...typeScale.body, color: color.t3, maxWidth: 480 }}>
                Results require at least 30 responses and publish when the survey closes on{" "}
                <strong style={{ color: color.t2 }}>{fmtDate(data?.closes_at ?? null)}</strong>.
                Currently{" "}
                <strong style={{ color: color.amber }}>{data?.respondent_count ?? 0}</strong>{" "}
                contractors have responded.
              </div>
              <Link href="/survey">
                <button style={{
                  background: color.blue,
                  color: color.t1,
                  fontSize: 15,
                  fontWeight: 600,
                  minHeight: 48,
                  padding: "0 28px",
                  borderRadius: radius.lg,
                }}>
                  Add Your Response →
                </button>
              </Link>
            </div>
          )}

          {/* ── Index score cards ── */}
          {hasResults && (
            <div className="index-cards" style={{
              display: "flex", gap: 12, marginTop: 32, flexWrap: "nowrap",
            }}>
              <IndexCard label="Backlog Outlook"    abbr="BOI" score={data!.backlog_net} qoq={data!.backlog_qoq} />
              <IndexCard label="Margin Expectation" abbr="MEI" score={data!.margin_net}  qoq={data!.margin_qoq} />
              <IndexCard label="Labor Availability" abbr="LAI" score={data!.labor_net}   qoq={data!.labor_qoq} />
              <IndexCard label="Market Outlook"     abbr="MOI" score={data!.market_net}  qoq={data!.market_qoq} />
            </div>
          )}
        </div>

        {/* Only show data sections if results are published */}
        {hasResults && (
          <>
            {/* ── SECTION 2: Response Distributions ── */}
            <section style={{ paddingBottom: 48 }}>
              <SectionDivider label="02" title="Response Distributions" />

              {/* Stacked bar — Q1, Q2, Q3, Q5 */}
              <div style={{ background: color.bg1, border: `1px solid ${color.bd1}`, borderRadius: radius.lg, padding: "24px 20px 16px", marginBottom: 20 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.08em", marginBottom: 16 }}>
                  SENTIMENT DISTRIBUTION — % OF RESPONDENTS AT EACH LEVEL
                </div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={distData}
                      layout="vertical"
                      margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                      barSize={26}
                    >
                      <XAxis
                        type="number" domain={[0, 100]} tickCount={6}
                        tickFormatter={v => `${v}%`}
                        tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        type="category" dataKey="name" width={54}
                        tick={{ fontFamily: SYS, fontSize: 13, fill: color.t2 }}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip
                        formatter={(v: number, name: string) => {
                          const labels = ["","Very Low/Difficult","Low/Decrease","Neutral","High/Increase","Very High/Easy"]
                          return [`${Number(v).toFixed(1)}%`, labels[Number(name)] ?? name]
                        }}
                        contentStyle={{ background: color.bg2, border: `1px solid ${color.bd1}`, borderRadius: 8, fontFamily: SYS }}
                        labelStyle={{ color: color.t2, fontWeight: 600 }}
                        itemStyle={{ color: color.t3 }}
                      />
                      {["1","2","3","4","5"].map((lvl, i) => (
                        <Bar key={lvl} dataKey={lvl} stackId="a" fill={DIST_COLORS[i]} radius={i === 0 ? [4,0,0,4] : i === 4 ? [0,4,4,0] : [0,0,0,0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
                  {[
                    { col: DIST_COLORS[0], label: "Very Negative" },
                    { col: DIST_COLORS[1], label: "Negative" },
                    { col: DIST_COLORS[2], label: "Neutral" },
                    { col: DIST_COLORS[3], label: "Positive" },
                    { col: DIST_COLORS[4], label: "Very Positive" },
                  ].map(({ col, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: col, flexShrink: 0 }} />
                      <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Material concern bar chart */}
              <div style={{ background: color.bg1, border: `1px solid ${color.bd1}`, borderRadius: radius.lg, padding: "24px 20px 16px" }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.08em", marginBottom: 16 }}>
                  Q4 — PRIMARY MATERIAL COST CONCERN
                </div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={matData}
                      layout="vertical"
                      margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                      barSize={20}
                    >
                      <XAxis
                        type="number" domain={[0, 100]}
                        tickFormatter={v => `${v}%`}
                        tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        type="category" dataKey="name" width={80}
                        tick={{ fontFamily: SYS, fontSize: 13, fill: color.t2 }}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip
                        formatter={(v: number) => [`${Number(v).toFixed(1)}%`, "Respondents"]}
                        contentStyle={{ background: color.bg2, border: `1px solid ${color.bd1}`, borderRadius: 8, fontFamily: SYS }}
                        labelStyle={{ color: color.t2, fontWeight: 600 }}
                        itemStyle={{ color: color.amber }}
                      />
                      <Bar dataKey="pct" fill={color.amber} radius={[0,4,4,0]}
                        label={{ position: "right", formatter: (v: number) => `${Number(v).toFixed(0)}%`, fontFamily: MONO, fontSize: 11, fill: color.t3 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* ── SECTION 3: Regional Breakdown ── */}
            <section style={{ paddingBottom: 48 }}>
              <SectionDivider label="03" title="Regional Breakdown" />
              <div className="region-table" style={{ background: color.bg1, border: `1px solid ${color.bd1}`, borderRadius: radius.lg, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${color.bd1}` }}>
                      {["Region", "BOI", "MEI", "LAI", "MOI", "n"].map(h => (
                        <th key={h} style={{
                          fontFamily: MONO, fontSize: 11, color: color.t4,
                          letterSpacing: "0.08em", padding: "12px 16px",
                          textAlign: h === "Region" ? "left" : "right",
                          fontWeight: 600,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REGION_ORDER.filter(r => data!.by_region[r]).map((r, i) => {
                      const row = data!.by_region[r]
                      return (
                        <tr key={r} style={{ borderBottom: i < REGION_ORDER.length - 1 ? `1px solid ${color.bd1}` : "none" }}>
                          <td style={{ fontFamily: SYS, fontSize: 14, color: color.t2, padding: "12px 16px" }}>
                            {REGION_LABELS[r] ?? r}
                          </td>
                          {([row.backlog_net, row.margin_net, row.labor_net, row.market_net] as (number | undefined)[]).map((val, ci) => (
                            <td key={ci} style={{
                              fontFamily: MONO, fontSize: 14, fontWeight: 600,
                              color: cellColor(val ?? null),
                              padding: "12px 16px", textAlign: "right",
                            }}>
                              {val != null ? (val > 0 ? "+" : "") + val : "—"}
                            </td>
                          ))}
                          <td style={{ fontFamily: MONO, fontSize: 12, color: color.t4, padding: "12px 16px", textAlign: "right" }}>
                            {row.n ?? "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── SECTION 4: Historical Trend ── */}
            <section style={{ paddingBottom: 48 }}>
              <SectionDivider label="04" title="Historical Trend" />
              <div style={{ background: color.bg1, border: `1px solid ${color.bd1}`, borderRadius: radius.lg, padding: "24px 20px 16px" }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.08em", marginBottom: 16 }}>
                  NET SCORES — LAST {trend.length} QUARTERS
                </div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke={color.bd1} strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="quarter"
                        tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        domain={[-80, 80]}
                        tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
                        axisLine={false} tickLine={false}
                      />
                      <ReferenceLine y={0} stroke={color.bd2} strokeDasharray="4 2" />
                      <Tooltip
                        contentStyle={{ background: color.bg2, border: `1px solid ${color.bd1}`, borderRadius: 8, fontFamily: SYS }}
                        labelStyle={{ color: color.t2, fontWeight: 600 }}
                        itemStyle={{ fontSize: 13 }}
                      />
                      <Legend
                        formatter={(v: string) => {
                          const map: Record<string, string> = { backlog_net: "BOI", margin_net: "MEI", labor_net: "LAI", market_net: "MOI" }
                          return <span style={{ fontFamily: MONO, fontSize: 11, color: color.t3 }}>{map[v] ?? v}</span>
                        }}
                      />
                      <Line type="monotone" dataKey="backlog_net" name="backlog_net" stroke={color.blue}  strokeWidth={2} dot={{ r: 3, fill: color.blue }}  />
                      <Line type="monotone" dataKey="margin_net"  name="margin_net"  stroke={color.amber} strokeWidth={2} dot={{ r: 3, fill: color.amber }} />
                      <Line type="monotone" dataKey="labor_net"   name="labor_net"   stroke={color.red}   strokeWidth={2} dot={{ r: 3, fill: color.red }}   />
                      <Line type="monotone" dataKey="market_net"  name="market_net"  stroke={color.green} strokeWidth={2} dot={{ r: 3, fill: color.green }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── SECTION 5: Methodology ── */}
        <section style={{ paddingBottom: 48 }}>
          {hasResults && <SectionDivider label="05" title="Methodology" />}
          <div style={{
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.lg,
            padding: "24px 28px",
          }}>
            <div style={{ ...typeScale.bodySm, color: color.t4, lineHeight: 1.75 }}>
              <p style={{ marginBottom: 12 }}>
                Net scores computed as <span style={{ fontFamily: MONO, color: color.t3 }}>(% positive − % negative) × 100</span> where
                positive = responses 4–5, negative = responses 1–2. Minimum 30 responses required to publish.
                Individual responses are never published. No PII is stored — only a one-way hash of email + quarter
                is retained to prevent duplicate submissions.
              </p>
              <p>
                Respondent panel: US-based GCs, subcontractors, and specialty contractors recruited via AGC, ABC,
                NRCA, NECA, and SMACNA chapter newsletters.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 6: CTA ── */}
        <section style={{ paddingBottom: 64 }}>
          <div style={{
            background: color.bg2,
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.xl,
            padding: "36px 32px",
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ ...typeScale.h4, color: color.t1, marginBottom: 8 }}>
                {isCollecting ? `Take the ${q} Survey` : "Stay informed — next survey opens soon"}
              </div>
              <div style={{ ...typeScale.bodySm, color: color.t3 }}>
                Subscribe to receive quarterly results the day they publish.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 280 }}>
              {isCollecting && (
                <Link href="/survey">
                  <button style={{
                    width: "100%",
                    minHeight: 48,
                    background: color.blue,
                    color: color.t1,
                    fontSize: 15,
                    fontWeight: 600,
                    borderRadius: radius.md,
                  }}>
                    Take the {q} Survey →
                  </button>
                </Link>
              )}

              {subscribed ? (
                <div style={{
                  ...typeScale.bodySm, color: color.green,
                  background: color.greenDim,
                  border: `1px solid ${color.green}33`,
                  borderRadius: radius.md,
                  padding: "12px 16px", textAlign: "center",
                }}>
                  Subscribed. We&apos;ll email you when Q3 results publish.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubscribe()}
                    style={{
                      flex: 1,
                      background: color.bg1,
                      border: `1px solid ${color.bd1}`,
                      borderRadius: radius.md,
                      padding: "10px 14px",
                      color: color.t1,
                      fontSize: 14,
                      fontFamily: SYS,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={!email.includes("@")}
                    style={{
                      background: color.bg3,
                      border: `1px solid ${color.bd1}`,
                      color: color.t2,
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "10px 16px",
                      borderRadius: radius.md,
                      flexShrink: 0,
                    }}
                  >
                    Subscribe
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

// ─── section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label, title }: { label: string; title: string }) {
  return (
    <div style={{
      borderBottom: `1px solid ${color.bd2}`,
      marginBottom: 24,
      paddingBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.12em" }}>{label}</span>
        <h2 style={{ fontFamily: SYS, fontSize: 22, fontWeight: 700, color: color.t1, letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
    </div>
  )
}
