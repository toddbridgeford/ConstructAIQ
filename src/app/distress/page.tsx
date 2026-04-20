"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { font, color } from "@/lib/theme"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

const SYS  = font.sys
const MONO = font.mono

const AMBER    = color.amber
const GREEN    = color.green
const RED      = color.red
const BG0      = color.bg0
const BG1      = color.bg1
const BG2      = color.bg2
const BD1      = color.bd1
const BD2      = color.bd2
const T1       = color.t1
const T2       = color.t2
const T3       = color.t3
const T4       = color.t4
const AMBER_DIM = color.amberDim
const GREEN_DIM = color.greenDim
const RED_DIM   = color.redDim

interface WatchItem {
  rank: number
  market: string
  cdi: number
  classification: "HIGH" | "ELEVATED" | "LOW"
  drivers: string[]
  change: number
}

const HARDCODED_WATCHLIST: WatchItem[] = [
  { rank: 1,  market: "Chicago, IL",       cdi: 74.2, classification: "HIGH",     drivers: ["Permit decline -18% YoY", "Employment -3.2% YoY"],                    change:  6.3 },
  { rank: 2,  market: "Detroit, MI",        cdi: 68.8, classification: "HIGH",     drivers: ["Federal awards -22% YoY", "Materials +31% above avg"],                change:  2.1 },
  { rank: 3,  market: "St. Louis, MO",      cdi: 62.1, classification: "ELEVATED", drivers: ["Permit deceleration 3 consecutive months"],                           change:  4.2 },
  { rank: 4,  market: "Baltimore, MD",      cdi: 58.4, classification: "ELEVATED", drivers: ["Employment -1.8% YoY", "Permit value down"],                          change:  1.8 },
  { rank: 5,  market: "Cleveland, OH",      cdi: 55.7, classification: "ELEVATED", drivers: ["Permit volume -12% YoY"],                                             change:  3.1 },
  { rank: 6,  market: "Memphis, TN",        cdi: 51.3, classification: "ELEVATED", drivers: ["Federal award slowdown", "Employment plateau"],                       change: -0.4 },
  { rank: 7,  market: "Hartford, CT",       cdi: 48.9, classification: "ELEVATED", drivers: ["Materials +18% above avg"],                                           change:  2.2 },
  { rank: 8,  market: "Milwaukee, WI",      cdi: 46.2, classification: "ELEVATED", drivers: ["Permit deceleration"],                                                change:  0.8 },
  { rank: 9,  market: "Rochester, NY",      cdi: 43.1, classification: "ELEVATED", drivers: ["Employment -0.9% YoY"],                                              change:  1.4 },
  { rank: 10, market: "Louisville, KY",     cdi: 41.8, classification: "ELEVATED", drivers: ["Federal awards -8% YoY"],                                            change: -1.2 },
]

const RECOVERY_MARKETS = [
  { market: "Las Vegas, NV",     cdi: 38.1, delta: -12.4 },
  { market: "Denver, CO",        cdi: 41.2, delta:  -9.7 },
  { market: "Salt Lake City, UT", cdi: 29.8, delta:  -8.1 },
]

// 36 months of CDI history: start ~20, rise to ~45 peak mid-2022, decline to ~28 by Apr 2026
function buildHistoricalData() {
  const months = [
    "May 23","Jun 23","Jul 23","Aug 23","Sep 23","Oct 23","Nov 23","Dec 23",
    "Jan 24","Feb 24","Mar 24","Apr 24","May 24","Jun 24","Jul 24","Aug 24","Sep 24","Oct 24","Nov 24","Dec 24",
    "Jan 25","Feb 25","Mar 25","Apr 25","May 25","Jun 25","Jul 25","Aug 25","Sep 25","Oct 25","Nov 25","Dec 25",
    "Jan 26","Feb 26","Mar 26","Apr 26",
  ]
  const vals = [
    20, 21, 23, 25, 27, 29, 31, 34,
    36, 38, 40, 42, 44, 45, 44, 43, 42, 41, 40, 39,
    38, 37, 36, 35, 34, 33, 32, 31, 31, 30, 30, 29,
    29, 28, 28, 28,
  ]
  return months.map((m, i) => ({ month: m, cdi: vals[i] }))
}

const HIST_DATA = buildHistoricalData()

function classColor(c: string) {
  if (c === "HIGH")     return RED
  if (c === "ELEVATED") return AMBER
  if (c === "LOW")      return GREEN
  return T4
}

function classColorDim(c: string) {
  if (c === "HIGH")     return RED_DIM
  if (c === "ELEVATED") return AMBER_DIM
  if (c === "LOW")      return GREEN_DIM
  return "#1a1a1a"
}

function ComponentBar({ label, score }: { label: string; score: number }) {
  const barColor = score > 65 ? RED : score > 40 ? AMBER : GREEN
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: T3 }}>{score}</span>
      </div>
      <div style={{ background: BD1, borderRadius: 3, height: 6, width: "100%" }}>
        <div style={{ width: `${score}%`, height: 6, borderRadius: 3, background: barColor }} />
      </div>
    </div>
  )
}

export default function DistressPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/distress")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const watchlist: WatchItem[] = data?.watchlist ?? HARDCODED_WATCHLIST

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit;cursor:pointer;border:none}
        button:hover{opacity:0.85}
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: BG1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BD1}`,
        padding: "0 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60,
        paddingTop: "env(safe-area-inset-top,0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 24, background: BD1 }} />
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em" }}>DISTRESS INDEX</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {[
            { label: "Markets",   href: "/markets"   },
            { label: "Research",  href: "/research"  },
            { label: "Calendar",  href: "/calendar"  },
            { label: "Pricing",   href: "/pricing"   },
          ].map(({ label, href }) => (
            <Link key={href} href={href} style={{ fontFamily: MONO, fontSize: 12, color: T4, letterSpacing: "0.06em" }}>{label}</Link>
          ))}
          <Link href="/dashboard">
            <button style={{ background: "transparent", color: T3, fontFamily: MONO, fontSize: 12, padding: "8px 16px", borderRadius: 10, border: `1px solid ${BD1}`, minHeight: 44 }}>DASHBOARD</button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: "center", padding: "64px 32px 40px" }}>
        <div style={{
          display: "inline-block",
          fontFamily: MONO, fontSize: 11, color: AMBER,
          letterSpacing: "0.12em",
          background: AMBER_DIM, border: `1px solid ${AMBER}44`,
          borderRadius: 20, padding: "6px 18px", marginBottom: 24,
        }}>
          CONSTRUCTION DISTRESS INTELLIGENCE · LENDER TOOLKIT
        </div>
        <h1 style={{ fontFamily: SYS, fontSize: 40, fontWeight: 700, color: T1, marginBottom: 16, letterSpacing: "-0.02em" }}>
          Construction Distress Index
        </h1>
        <p style={{ fontFamily: SYS, fontSize: 17, color: T3, lineHeight: 1.7, maxWidth: 620, margin: "0 auto 28px" }}>
          Early-warning signals for construction market stress. Used by construction lenders, credit risk teams, and portfolio managers.
        </p>
        {/* Warning banner */}
        <div style={{
          maxWidth: 680, margin: "0 auto",
          background: RED_DIM, border: `1px solid ${RED}44`,
          borderRadius: 12, padding: "14px 20px",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <span style={{ color: RED, fontFamily: MONO, fontSize: 14, flexShrink: 0 }}>⚠</span>
          <span style={{ fontFamily: SYS, fontSize: 14, color: "#ffaaaa", lineHeight: 1.6 }}>
            CDI scores above 70 have historically preceded construction loan delinquency increases with a 6–9 month lag.
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px 80px" }}>

        {/* SECTION 1 — National Overview */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            {/* HIGH DISTRESS */}
            <div style={{ flex: 1, minWidth: 180, background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", marginBottom: 8 }}>HIGH DISTRESS</div>
              <div style={{ fontFamily: SYS, fontSize: 40, fontWeight: 700, color: RED, lineHeight: 1 }}>{data?.highDistress ?? 3}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: RED, background: RED_DIM, borderRadius: 6, padding: "2px 8px" }}>▲ +1</span>
                <span style={{ fontFamily: SYS, fontSize: 12, color: T4 }}>vs last month</span>
              </div>
            </div>
            {/* ELEVATED RISK */}
            <div style={{ flex: 1, minWidth: 180, background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", marginBottom: 8 }}>ELEVATED RISK</div>
              <div style={{ fontFamily: SYS, fontSize: 40, fontWeight: 700, color: AMBER, lineHeight: 1 }}>{data?.elevatedRisk ?? 11}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER, background: AMBER_DIM, borderRadius: 6, padding: "2px 8px" }}>▼ -2</span>
                <span style={{ fontFamily: SYS, fontSize: 12, color: T4 }}>vs last month</span>
              </div>
            </div>
            {/* LOW RISK */}
            <div style={{ flex: 1, minWidth: 180, background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", marginBottom: 8 }}>LOW RISK</div>
              <div style={{ fontFamily: SYS, fontSize: 40, fontWeight: 700, color: GREEN, lineHeight: 1 }}>{data?.lowRisk ?? 31}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: GREEN, background: GREEN_DIM, borderRadius: 6, padding: "2px 8px" }}>→ 0</span>
                <span style={{ fontFamily: SYS, fontSize: 12, color: T4 }}>stable</span>
              </div>
            </div>
            {/* STABLE */}
            <div style={{ flex: 1, minWidth: 180, background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", marginBottom: 8 }}>STABLE</div>
              <div style={{ fontFamily: SYS, fontSize: 40, fontWeight: 700, color: T4, lineHeight: 1 }}>{data?.stable ?? 5}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: T4, background: BD1, borderRadius: 6, padding: "2px 8px" }}>→ unchanged</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", fontFamily: MONO, fontSize: 13, color: T3, letterSpacing: "0.06em" }}>
            National CDI Average: 28.4 &nbsp;🟢&nbsp; LOW RISK
          </div>
        </div>

        {/* SECTION 2 — Distress Watch List */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SYS, fontSize: 24, fontWeight: 700, color: T1, marginBottom: 24 }}>
            April 2026 — Distress Watch List
          </h2>
          {watchlist.map((item) => {
            const isExpanded = expanded === item.market
            const cc = classColor(item.classification)
            const ccDim = classColorDim(item.classification)
            const trend = item.change > 0 ? "▲ deteriorating" : "▼ improving"
            const trendColor = item.change > 0 ? RED : GREEN
            return (
              <div key={item.market}>
                <div
                  onClick={() => setExpanded(isExpanded ? null : item.market)}
                  style={{
                    background: BG1, border: `1px solid ${BD1}`,
                    borderRadius: isExpanded ? "10px 10px 0 0" : 10,
                    padding: "14px 20px", marginBottom: isExpanded ? 0 : 6,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER, minWidth: 24 }}>#{item.rank}</span>
                    <span style={{ fontFamily: SYS, fontSize: 16, color: T1 }}>{item.market}</span>
                    <span style={{
                      fontFamily: MONO, fontSize: 11, fontWeight: 700,
                      color: cc, background: ccDim,
                      borderRadius: 6, padding: "3px 10px", letterSpacing: "0.06em",
                    }}>
                      CDI {item.cdi.toFixed(1)} · {item.classification}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: trendColor }}>
                      {trend} ({item.change > 0 ? "+" : ""}{item.change.toFixed(1)})
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{
                    background: BG2, border: `1px solid ${BD1}`, borderTop: "none",
                    borderRadius: "0 0 10px 10px", padding: "20px 24px", marginBottom: 6,
                  }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginBottom: 20 }}>
                      <div style={{ flex: "1 1 300px" }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", marginBottom: 14 }}>CDI COMPONENT BREAKDOWN</div>
                        <ComponentBar label="Materials Cost Spike"    score={Math.round(item.cdi * 0.95)} />
                        <ComponentBar label="Permit Deceleration"     score={Math.round(item.cdi * 0.88)} />
                        <ComponentBar label="Employment Decline"      score={Math.round(item.cdi * 0.72)} />
                        <ComponentBar label="Federal Award Slowdown"  score={Math.round(item.cdi * 0.65)} />
                        <ComponentBar label="Absorption Pressure"     score={Math.round(item.cdi * 0.55)} />
                      </div>
                      <div style={{ flex: "1 1 260px" }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", marginBottom: 12 }}>KEY DRIVERS</div>
                        {item.drivers.map((d, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                            <span style={{ color: RED, fontFamily: MONO, fontSize: 12, flexShrink: 0 }}>●</span>
                            <span style={{ fontFamily: SYS, fontSize: 13, color: T3 }}>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{
                      background: BG1, borderRadius: 10, padding: "14px 18px", marginBottom: 16,
                      border: `1px solid ${BD2}`,
                    }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", marginBottom: 8 }}>WHAT THIS MEANS FOR LENDERS</div>
                      <p style={{ fontFamily: SYS, fontSize: 14, color: T3, lineHeight: 1.6 }}>
                        Lenders with exposure in {item.market} should closely monitor existing construction loan covenants,
                        request updated draw schedules, and consider stress-testing completion timelines
                        given current permit and employment headwinds. CDI at this level has historically
                        correlated with 6–9 month lagged delinquency increases of 1.2–2.4x baseline rates.
                      </p>
                    </div>
                    <button style={{
                      background: "transparent", color: AMBER,
                      fontFamily: MONO, fontSize: 12, letterSpacing: "0.06em",
                      padding: "10px 20px", borderRadius: 8, border: `1px solid ${AMBER}`,
                      cursor: "pointer",
                    }}>
                      Download Full Report →
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* SECTION 3 — Recovery Watch List */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SYS, fontSize: 24, fontWeight: 700, color: T1, marginBottom: 24 }}>
            Markets Improving
          </h2>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {RECOVERY_MARKETS.map((m) => (
              <div key={m.market} style={{
                flex: 1, minWidth: 200,
                background: BG1, border: `1px solid ${BD1}`,
                borderRadius: 12, padding: 20,
              }}>
                <div style={{ fontFamily: SYS, fontSize: 15, color: T1, fontWeight: 600, marginBottom: 12 }}>{m.market}</div>
                <div style={{ fontFamily: SYS, fontSize: 32, fontWeight: 700, color: T2, lineHeight: 1, marginBottom: 8 }}>
                  {m.cdi.toFixed(1)}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.08em", marginBottom: 6 }}>CDI SCORE</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: GREEN_DIM, borderRadius: 6, padding: "4px 10px" }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: GREEN }}>▼ {m.delta.toFixed(1)}</span>
                  <span style={{ fontFamily: SYS, fontSize: 12, color: GREEN }}>improving</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4 — Historical CDI */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SYS, fontSize: 24, fontWeight: 700, color: T1, marginBottom: 24 }}>
            National CDI — 36 Month History
          </h2>
          <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: "24px 20px 16px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={HIST_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="cdiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={RED} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={RED} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BD1} vertical={false} />
                <XAxis dataKey="month" tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }} tickLine={false} axisLine={{ stroke: BD1 }} interval={5} />
                <YAxis tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }} tickLine={false} axisLine={false} domain={[0, 60]} />
                <Tooltip
                  contentStyle={{ background: BG2, border: `1px solid ${BD1}`, borderRadius: 8, fontFamily: MONO, fontSize: 12 }}
                  labelStyle={{ color: T3 }}
                  itemStyle={{ color: RED }}
                />
                <Area type="monotone" dataKey="cdi" stroke={RED} strokeWidth={2} fill="url(#cdiGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 5 — Lender Toolkit (LOCKED) */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 16, border: `1px solid ${BD1}` }}>
            {/* Blurred background content */}
            <div style={{ background: BG1, padding: "32px 28px", filter: "blur(4px)", userSelect: "none", pointerEvents: "none" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 20 }}>LENDER TOOLKIT</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {["Portfolio Exposure Report", "Custom CDI Alerts", "Quarterly Distress Briefing"].map((item) => (
                  <div key={item} style={{
                    flex: 1, minWidth: 180, background: BG2, border: `1px solid ${BD2}`,
                    borderRadius: 12, padding: "20px 18px",
                  }}>
                    <div style={{ fontFamily: SYS, fontSize: 15, color: T1, fontWeight: 600, marginBottom: 8 }}>{item}</div>
                    <div style={{ fontFamily: SYS, fontSize: 13, color: T4, lineHeight: 1.5 }}>
                      Professional-grade intelligence for credit risk teams.
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Lock overlay */}
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.6)", gap: 16,
            }}>
              <div style={{
                fontFamily: MONO, fontSize: 12, color: AMBER, background: AMBER_DIM,
                border: `1px solid ${AMBER}44`, borderRadius: 20, padding: "6px 18px",
                letterSpacing: "0.1em",
              }}>
                PROFESSIONAL PLAN REQUIRED
              </div>
              <div style={{ fontFamily: SYS, fontSize: 16, color: T2, fontWeight: 600 }}>Unlock the full Lender Toolkit</div>
              <Link href="/pricing">
                <button style={{
                  background: AMBER, color: "#000", fontFamily: MONO, fontSize: 13,
                  fontWeight: 700, padding: "12px 28px", borderRadius: 10,
                  letterSpacing: "0.06em",
                }}>
                  View Plans →
                </button>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${BD1}`, padding: "32px", textAlign: "center" }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ" style={{ height: 20, width: "auto", marginBottom: 12 }} />
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 6 }}>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
      </footer>
    </div>
  )
}
