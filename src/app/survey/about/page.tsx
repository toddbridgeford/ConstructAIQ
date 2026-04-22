"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { color, font, radius, type as typeScale } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

// ── Questions (exact wording from survey form) ──────────────────────────────

const QUESTIONS = [
  {
    number: "Q1",
    label:  "Backlog Outlook",
    text:   "Compared to 6 months ago, my company's backlog is:",
    options: ["Much Lower", "Lower", "About the Same", "Higher", "Much Higher"],
  },
  {
    number: "Q2",
    label:  "Margin Outlook",
    text:   "Over the next 6 months, I expect project margins to:",
    options: ["Decrease Significantly", "Decrease", "Stay Flat", "Increase", "Increase Significantly"],
  },
  {
    number: "Q3",
    label:  "Labor Availability",
    text:   "Currently, finding qualified construction labor in my area is:",
    options: ["Very Difficult", "Difficult", "Neutral", "Easy", "Very Easy"],
  },
  {
    number: "Q4",
    label:  "Material Cost Concern",
    text:   "My biggest material cost concern right now is:",
    options: ["None", "Lumber", "Steel", "Concrete", "Copper/Wire", "Fuel/Diesel", "Other"],
  },
  {
    number: "Q5",
    label:  "Market Outlook",
    text:   "Overall, I expect construction activity in my market to:",
    options: ["Decrease Significantly", "Decrease", "Stay the Same", "Increase", "Increase Significantly"],
  },
]

const ASSOCIATIONS = [
  "Associated General Contractors (AGC) chapter newsletters",
  "Associated Builders and Contractors (ABC)",
  "National Roofing Contractors Association (NRCA)",
  "National Electrical Contractors Association (NECA)",
  "Sheet Metal and Air Conditioning Contractors (SMACNA)",
  "ConstructAIQ registered users who opt in",
]

interface TrendPoint {
  quarter: string
  backlog_net: number
  margin_net: number
  labor_net: number
  market_net: number
}

function netColor(n: number | null): string {
  if (n === null) return color.t4
  if (n > 15)  return color.green
  if (n < -5)  return color.red
  return color.amber
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const col = netColor(value)
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{
        fontFamily: SYS, fontSize: 16, fontWeight: 700,
        color: col, letterSpacing: "-0.02em",
      }}>
        {value > 0 ? "+" : ""}{value}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.08em" }}>
        {label}
      </span>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SurveyAboutPage() {
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [quarter, setQuarter] = useState("Q2 2025")
  const [surveyOpen, setSurveyOpen] = useState(true)

  useEffect(() => {
    fetch("/api/survey/results")
      .then(r => r.json())
      .then(d => {
        setQuarter(d.quarter ?? "Q2 2025")
        setSurveyOpen(d.collecting !== false)
      })
      .catch(() => {})

    fetch("/api/survey/trend")
      .then(r => r.json())
      .then(d => setTrend(Array.isArray(d) ? d : d.data ?? d.trend ?? []))
      .catch(() => {})
  }, [])

  // Published quarters = trend points that have results (use trend as proxy)
  const published = trend.filter(t =>
    t.backlog_net !== null && t.margin_net !== null
  )

  return (
    <div style={{
      minHeight: "100vh",
      background: color.bg0,
      color: color.t1,
      fontFamily: SYS,
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{font-family:inherit;cursor:pointer;border:none;outline:none}
        @media(max-width:768px){
          .three-col{flex-direction:column!important}
          .q-grid{grid-template-columns:1fr!important}
          .hist-grid{grid-template-columns:1fr!important}
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
            GC SURVEY
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/survey/results">
            <button style={{
              background: "transparent",
              border: `1px solid ${color.bd1}`,
              borderRadius: radius.sm,
              color: color.t3,
              fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em",
              padding: "6px 12px", minHeight: 36,
            }}>
              VIEW RESULTS →
            </button>
          </Link>
          <Link href="/survey">
            <button style={{
              background: color.amber,
              color: color.bg0,
              fontFamily: SYS, fontSize: 13, fontWeight: 700,
              padding: "8px 18px", borderRadius: radius.sm, minHeight: 36,
            }}>
              Take Survey
            </button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ── SECTION 1: Hero ── */}
        <section style={{ paddingTop: 80, paddingBottom: 64, textAlign: "center" }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, color: color.amber,
            letterSpacing: "0.14em", marginBottom: 20,
          }}>
            CONSTRUCTAIQ PROPRIETARY DATA
          </div>
          <h1 style={{
            ...typeScale.h2,
            fontFamily: SYS,
            color: color.t1,
            marginBottom: 20,
          }}>
            The Construction Intelligence Survey
          </h1>
          <p style={{
            ...typeScale.body,
            fontFamily: SYS,
            color: color.t3,
            maxWidth: 620,
            margin: "0 auto 40px",
          }}>
            The only quarterly signal not available from any public API. Built with the industry,
            for the industry. Free.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/survey">
              <button style={{
                background: color.amber,
                color: color.bg0,
                fontFamily: SYS, fontSize: 15, fontWeight: 700,
                padding: "14px 32px", borderRadius: radius.md, minHeight: 52,
                letterSpacing: "-0.01em",
              }}>
                Take {quarter} Survey
              </button>
            </Link>
            <Link href="/survey/results">
              <button style={{
                background: "transparent",
                border: `1px solid ${color.bd2}`,
                color: color.t2,
                fontFamily: SYS, fontSize: 15, fontWeight: 600,
                padding: "14px 32px", borderRadius: radius.md, minHeight: 52,
              }}>
                View Results
              </button>
            </Link>
          </div>
        </section>

        {/* ── SECTION 2: Why This Matters ── */}
        <section style={{ paddingBottom: 64 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.12em", marginBottom: 32, textAlign: "center" }}>
            WHY THIS MATTERS
          </div>
          <div
            className="three-col"
            style={{ display: "flex", gap: 24 }}
          >
            {[
              {
                badge: "FORWARD-LOOKING",
                title: "No Public API Has This",
                body: "Census, BLS, and FRED measure what already happened. This survey measures what contractors expect to happen — 6 months before it shows up in government data.",
              },
              {
                badge: "INDUSTRY-BUILT",
                title: "Built With Real Industry Input",
                body: "Quarterly responses from GCs, subcontractors, and specialty contractors across all 6 US regions and all company sizes. Weighted for representativeness.",
              },
              {
                badge: "ALWAYS FREE",
                title: "Free. Always.",
                body: "Results publish free to everyone — not locked behind a subscription. We make money from data licensing, not from charging you for information your peers created.",
              },
            ].map(({ badge, title, body }) => (
              <div key={title} style={{
                flex: "1 1 0",
                background: color.bg1,
                border: `1px solid ${color.bd1}`,
                borderRadius: radius.xl,
                padding: "28px 24px",
              }}>
                <div style={{
                  fontFamily: MONO, fontSize: 9, color: color.amber,
                  letterSpacing: "0.12em", marginBottom: 14,
                }}>
                  {badge}
                </div>
                <h3 style={{
                  fontFamily: SYS, fontSize: 17, fontWeight: 700,
                  color: color.t1, marginBottom: 12,
                  letterSpacing: "-0.02em",
                }}>
                  {title}
                </h3>
                <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, lineHeight: 1.65 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3: The Questions ── */}
        <section style={{ paddingBottom: 64 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.12em", marginBottom: 8, textAlign: "center" }}>
            THE SURVEY
          </div>
          <h2 style={{
            ...typeScale.h3,
            fontFamily: SYS,
            color: color.t1,
            marginBottom: 32,
            textAlign: "center",
          }}>
            5 Questions. 90 Seconds.
          </h2>
          <div
            className="q-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {QUESTIONS.map(q => (
              <div key={q.number} style={{
                background: color.bg1,
                border: `1px solid ${color.bd1}`,
                borderRadius: radius.xl,
                padding: "24px 22px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 10, color: color.amber,
                    background: color.amber + "22",
                    border: `1px solid ${color.amber}44`,
                    borderRadius: radius.sm, padding: "2px 8px",
                    letterSpacing: "0.1em", flexShrink: 0,
                  }}>
                    {q.number}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em" }}>
                    {q.label.toUpperCase()}
                  </span>
                </div>
                <p style={{
                  fontFamily: SYS, fontSize: 14, fontWeight: 600,
                  color: color.t1, marginBottom: 16, lineHeight: 1.5,
                }}>
                  {q.text}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {q.options.map((opt, i) => (
                    <span key={opt} style={{
                      fontFamily: SYS, fontSize: 12, fontWeight: 500,
                      color: i === 0
                        ? color.red
                        : i === q.options.length - 1
                          ? color.green
                          : color.t3,
                      background: i === 0
                        ? color.redDim
                        : i === q.options.length - 1
                          ? color.greenDim
                          : color.bg3,
                      border: `1px solid ${
                        i === 0 ? color.red + "33"
                        : i === q.options.length - 1 ? color.green + "33"
                        : color.bd1
                      }`,
                      borderRadius: radius.full,
                      padding: "5px 12px",
                    }}>
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: Who Responds ── */}
        <section style={{ paddingBottom: 64 }}>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 320px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.12em", marginBottom: 16 }}>
                RESPONDENT PANEL
              </div>
              <h2 style={{
                fontFamily: SYS, fontSize: 24, fontWeight: 700,
                color: color.t1, marginBottom: 16, letterSpacing: "-0.025em",
              }}>
                Who Responds
              </h2>
              <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, lineHeight: 1.7, marginBottom: 24 }}>
                We recruit respondents through:
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {ASSOCIATIONS.map(a => (
                  <li key={a} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: color.amber, flexShrink: 0, marginTop: 6,
                    }} />
                    <span style={{ fontFamily: SYS, fontSize: 14, color: color.t2, lineHeight: 1.5 }}>
                      {a}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Side stats */}
            <div style={{
              flex: "0 0 auto",
              display: "flex", flexDirection: "column", gap: 16,
              alignSelf: "flex-start",
            }}>
              {[
                { value: "6",       label: "US Regions" },
                { value: "Qtrly",   label: "Cadence" },
                { value: "90 sec",  label: "Avg. completion" },
                { value: "Free",    label: "Results access" },
              ].map(({ value, label }) => (
                <div key={label} style={{
                  background: color.bg1,
                  border: `1px solid ${color.bd1}`,
                  borderRadius: radius.lg,
                  padding: "16px 24px",
                  minWidth: 140, textAlign: "center",
                }}>
                  <div style={{
                    fontFamily: SYS, fontSize: 28, fontWeight: 700,
                    color: color.amber, letterSpacing: "-0.03em", lineHeight: 1,
                  }}>
                    {value}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.1em", marginTop: 6 }}>
                    {label.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: Privacy ── */}
        <section style={{ paddingBottom: 64 }}>
          <div style={{
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.xl,
            padding: "32px 36px",
          }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.12em", marginBottom: 16 }}>
              PRIVACY
            </div>
            <h2 style={{
              fontFamily: SYS, fontSize: 22, fontWeight: 700,
              color: color.t1, marginBottom: 24, letterSpacing: "-0.025em",
            }}>
              How We Protect Your Data
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                "Your individual responses are never published.",
                "Only aggregate results are shared.",
                "We store a one-way hash of your email — not your email itself.",
                "This hash is used only to prevent duplicate responses.",
                "It cannot be reversed to identify you.",
              ].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: color.greenDim,
                    border: `1px solid ${color.green}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <polyline points="2,5 4,7.5 8,2.5" stroke={color.green} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ fontFamily: SYS, fontSize: 15, color: color.t2, lineHeight: 1.5 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 6: Historical Results ── */}
        {published.length > 0 && (
          <section style={{ paddingBottom: 64 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.12em", marginBottom: 8, textAlign: "center" }}>
              PUBLISHED QUARTERS
            </div>
            <h2 style={{
              fontFamily: SYS, fontSize: 22, fontWeight: 700,
              color: color.t1, marginBottom: 28, textAlign: "center",
              letterSpacing: "-0.025em",
            }}>
              Historical Results
            </h2>
            <div
              className="hist-grid"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}
            >
              {[...published].reverse().map(q => (
                <Link key={q.quarter} href={`/survey/results?quarter=${encodeURIComponent(q.quarter)}`}>
                  <div style={{
                    background: color.bg1,
                    border: `1px solid ${color.bd1}`,
                    borderRadius: radius.xl,
                    padding: "20px 20px",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = color.bd2)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = color.bd1)}
                  >
                    <div style={{
                      fontFamily: SYS, fontSize: 15, fontWeight: 700,
                      color: color.t1, marginBottom: 16,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      {q.quarter}
                      <span style={{ fontFamily: MONO, fontSize: 10, color: color.blue }}>RESULTS →</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <ScorePill label="BOI" value={q.backlog_net} />
                      <ScorePill label="MEI" value={q.margin_net} />
                      <ScorePill label="LAI" value={q.labor_net} />
                      <ScorePill label="MOI" value={q.market_net} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Final CTA ── */}
        <section style={{
          textAlign: "center",
          padding: "48px 24px",
          background: color.bg1,
          border: `1px solid ${color.bd1}`,
          borderRadius: radius.xl2,
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, color: color.amber,
            letterSpacing: "0.12em", marginBottom: 16,
          }}>
            {surveyOpen ? "SURVEY OPEN NOW" : "RESULTS PUBLISHED"}
          </div>
          <h2 style={{
            fontFamily: SYS, fontSize: 26, fontWeight: 700,
            color: color.t1, marginBottom: 12, letterSpacing: "-0.03em",
          }}>
            {surveyOpen
              ? `${quarter} is open. Your input shapes the index.`
              : "View the published results."}
          </h2>
          <p style={{ fontFamily: SYS, fontSize: 14, color: color.t4, marginBottom: 28 }}>
            90 seconds. Anonymous. Free results for everyone.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {surveyOpen && (
              <Link href="/survey">
                <button style={{
                  background: color.amber,
                  color: color.bg0,
                  fontFamily: SYS, fontSize: 14, fontWeight: 700,
                  padding: "12px 28px", borderRadius: radius.md, minHeight: 48,
                }}>
                  Take {quarter} Survey
                </button>
              </Link>
            )}
            <Link href="/survey/results">
              <button style={{
                background: "transparent",
                border: `1px solid ${color.bd2}`,
                color: color.t2,
                fontFamily: SYS, fontSize: 14, fontWeight: 600,
                padding: "12px 28px", borderRadius: radius.md, minHeight: 48,
              }}>
                View Results
              </button>
            </Link>
            <Link href="/methodology">
              <button style={{
                background: "transparent",
                border: `1px solid ${color.bd1}`,
                color: color.t3,
                fontFamily: SYS, fontSize: 14,
                padding: "12px 28px", borderRadius: radius.md, minHeight: 48,
              }}>
                Read Methodology
              </button>
            </Link>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: `1px solid ${color.bd1}`,
        padding: "24px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ"
          style={{ height: 18, width: "auto" }} />
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Dashboard",   href: "/dashboard"     },
            { label: "Survey",      href: "/survey"        },
            { label: "Results",     href: "/survey/results"},
            { label: "Methodology", href: "/methodology"   },
            { label: "Pricing",     href: "/pricing"       },
            { label: "About",       href: "/about"         },
          ].map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontFamily: SYS, fontSize: 13, color: color.t4 }}>
              {label}
            </Link>
          ))}
        </div>
        <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4 }}>© 2026 ConstructAIQ</div>
      </footer>
    </div>
  )
}
