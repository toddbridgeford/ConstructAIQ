"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { font, color } from '@/lib/theme'
import { Nav } from '@/app/components/Nav'

const SYS  = font.sys
const MONO = font.mono
const AMBER = color.amber
const GREEN = color.green
const RED   = color.red
const BLUE  = color.blue
const BG0   = color.bg0
const BG1   = color.bg1
const BG2   = color.bg2
const BG3   = color.bg3
const BD1   = color.bd1
const BD2   = color.bd2
const T1    = color.t1
const T2    = color.t2
const T3    = color.t3
const T4    = color.t4

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${BD1}`,
      padding: "40px 32px",
      marginTop: 80,
    }}>
      <div style={{
        maxWidth: 1140, margin: "0 auto",
        display: "flex", flexDirection: "column", gap: 16,
        alignItems: "center", textAlign: "center",
      }}>
        <Image
          src="/ConstructAIQWhiteLogo.svg"
          width={120}
          height={24}
          alt="ConstructAIQ"
          style={{ height: 24, width: "auto", opacity: 0.7 }}
        />
        <div style={{ fontFamily: SYS, fontSize: 14, color: T4 }}>
          Construction Intelligence Platform · constructaiq.trade
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: T4, opacity: 0.6 }}>
          Data sources: U.S. Census Bureau · Bureau of Labor Statistics · Federal Reserve · IIJA Public Records
        </div>
      </div>
    </footer>
  )
}

// ─── Topic Chip ───────────────────────────────────────────────────────────────

function TopicChip({ label }: { label: string }) {
  return (
    <div style={{
      display: "inline-block",
      background: BG2,
      border: `1px solid ${BD1}`,
      borderRadius: 20,
      padding: "4px 12px",
      fontFamily: MONO,
      fontSize: 12,
      color: T3,
      whiteSpace: "nowrap",
    }}>
      {label}
    </div>
  )
}

// ─── Section 1: Report Email Gate Form ───────────────────────────────────────

interface ReportFormState {
  name: string
  email: string
  org: string
}

function ReportGateForm() {
  const [form, setForm] = useState<ReportFormState>({ name: "", email: "", org: "" })
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email.trim()) return
    setSubmitting(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "research" }),
      })
      if (!res.ok) throw new Error("Failed")
      setStatus("success")
    } catch {
      setStatus("error")
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: BG1,
    border: `1px solid ${BD2}`,
    borderRadius: 10,
    padding: "12px 14px",
    fontFamily: SYS,
    fontSize: 15,
    color: T1,
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <div style={{
      background: BG2,
      border: `1px solid ${BD1}`,
      borderRadius: 16,
      padding: 28,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.12em" }}>
        GET THE FULL REPORT
      </div>
      <div style={{ fontFamily: SYS, fontSize: 14, color: T3, lineHeight: 1.6 }}>
        Enter your details to receive the April 2026 report as a PDF.
      </div>

      {status === "success" ? (
        <div style={{
          background: color.greenDim,
          border: `1px solid ${GREEN}44`,
          borderRadius: 10,
          padding: "16px 18px",
          fontFamily: SYS,
          fontSize: 15,
          color: GREEN,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          ✓ Check your inbox. Report on its way.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Organization"
            value={form.org}
            onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
            style={inputStyle}
          />

          {status === "error" && (
            <div style={{ fontFamily: SYS, fontSize: 13, color: RED }}>
              Something went wrong. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              background: AMBER,
              color: BG0,
              fontFamily: MONO,
              fontSize: 14,
              fontWeight: 700,
              padding: "14px 24px",
              borderRadius: 10,
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              letterSpacing: "0.06em",
              opacity: submitting ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {submitting ? "Sending…" : "Send Me the Report →"}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Section 3: Quarterly Notify Form ────────────────────────────────────────

function QuarterlyNotifyForm() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "quarterly-outlook" }),
      })
      if (!res.ok) throw new Error("Failed")
      setStatus("success")
    } catch {
      setStatus("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {status === "success" ? (
        <div style={{ fontFamily: SYS, fontSize: 15, color: GREEN }}>
          ✓ You&apos;re on the list. We&apos;ll notify you when the Q2 outlook is published.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              flex: 1,
              minWidth: 220,
              background: BG2,
              border: `1px solid ${BD2}`,
              borderRadius: 10,
              padding: "12px 14px",
              fontFamily: SYS,
              fontSize: 15,
              color: T1,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: "transparent",
              color: AMBER,
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 700,
              padding: "12px 20px",
              borderRadius: 10,
              border: `1px solid ${AMBER}`,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
              whiteSpace: "nowrap",
              transition: "opacity 0.15s",
            }}
          >
            {submitting ? "Submitting…" : "Notify me when published →"}
          </button>
          {status === "error" && (
            <div style={{ width: "100%", fontFamily: SYS, fontSize: 13, color: RED }}>
              Something went wrong. Please try again.
            </div>
          )}
        </form>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const topics = [
    "TTLCONS Spending",
    "Permit Trends",
    "Employment Surge",
    "Material Cost Outlook",
    "AI Forecast Update",
  ]

  const freeBriefings = [
    {
      date: "Apr 14, 2026",
      title: "Week 15: IIJA Spend Hits 73% Execution Rate",
      summary: "Federal construction contracts accelerating. State-level variance analysis inside.",
    },
    {
      date: "Apr 7, 2026",
      title: "Week 14: Permit Divergence Warning Activated",
      summary: "Spending up 0.8% while permits fall 1.2%. Historical pattern signals margin compression.",
    },
    {
      date: "Mar 31, 2026",
      title: "Week 13: Employment Hits Cycle High — 8.33M Workers",
      summary: "Construction employment highest on record. Labor cost implications for H1 2026.",
    },
  ]

  const lockedBriefings = [
    {
      date: "Mar 24, 2026",
      title: "Week 12: Steel Futures Break 3-Month High — Input Cost Watch",
      summary: "Hot-rolled coil surged 8.4% in 10 days. Analysis of what this means for commercial project margins heading into Q2.",
    },
    {
      date: "Mar 17, 2026",
      title: "Week 11: Fed Holds — What Flat Rates Mean for Construction Finance",
      summary: "No cut, no hike. We model three rate scenarios through December 2026 and their effect on residential starts and CRE pipeline.",
    },
  ]

  const mediaMentions = [
    "Media mention coming soon",
    "Press inquiries welcome",
    "Partnership citations available",
  ]

  return (
    <div style={{
      minHeight: "100vh",
      background: BG0,
      color: T1,
      fontFamily: SYS,
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit}
        button:hover{opacity:0.85}
        input::placeholder{color:${T4}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <Nav />

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "72px 32px 0" }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 56, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: BG2, border: `1px solid ${AMBER}44`,
            borderRadius: 20, padding: "6px 18px", marginBottom: 24,
          }}>
            <span style={{ fontFamily: SYS, fontSize: 14, color: T2 }}>📊 Research &amp; Intelligence</span>
          </div>

          <h1 style={{
            fontFamily: SYS, fontSize: 52, fontWeight: 700,
            lineHeight: 1.08, color: T1, letterSpacing: "-0.03em",
            marginBottom: 20,
          }}>
            Construction Intelligence Research
          </h1>

          <p style={{
            fontFamily: SYS, fontSize: 18, color: T3, lineHeight: 1.7,
            maxWidth: 660, margin: "0 auto",
          }}>
            Monthly reports, weekly briefings, and sector outlooks from the ConstructAIQ Intelligence team.
            Used by economists, capital allocators, and government analysts.
          </p>
        </div>

        {/* ── SECTION 1 — Monthly Construction Intelligence Report ── */}
        <div style={{
          background: BG1,
          border: `1px solid ${AMBER}33`,
          borderRadius: 20,
          padding: 40,
          boxShadow: `0 0 40px ${AMBER}11`,
          marginBottom: 32,
        }}>
          <div style={{
            display: "flex",
            gap: 40,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}>
            {/* Left: content ~55% */}
            <div style={{ flex: "1 1 55%", minWidth: 280 }}>
              <div style={{
                fontFamily: MONO, fontSize: 11, color: AMBER,
                letterSpacing: "0.12em", marginBottom: 16,
              }}>
                LATEST REPORT
              </div>

              <h2 style={{
                fontFamily: SYS, fontSize: 28, fontWeight: 700,
                color: T1, lineHeight: 1.25, marginBottom: 10,
                letterSpacing: "-0.015em",
              }}>
                April 2026 — Construction Market Intelligence Report
              </h2>

              <div style={{
                fontFamily: MONO, fontSize: 12, color: T4, marginBottom: 18,
              }}>
                Published April 20, 2026
              </div>

              <p style={{
                fontFamily: SYS, fontSize: 16, color: T3,
                lineHeight: 1.7, marginBottom: 28,
              }}>
                This month&apos;s report covers the IIJA spending acceleration, the permit velocity divergence
                from spending trends, and what the Q1 2026 employment surge means for material costs in H2 2026.
                Includes 12-month AI ensemble forecasts for all major series.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {topics.map(t => <TopicChip key={t} label={t} />)}
              </div>
            </div>

            {/* Right: email gate form ~40% */}
            <div style={{ flex: "1 1 38%", minWidth: 280 }}>
              <ReportGateForm />
            </div>
          </div>
        </div>

        {/* ── SECTION 2 — Weekly Briefing Archive ── */}
        <div style={{
          background: BG2,
          border: `1px solid ${BD1}`,
          borderRadius: 20,
          padding: 32,
          marginBottom: 32,
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 11, color: T4,
            letterSpacing: "0.12em", marginBottom: 24,
          }}>
            WEEKLY BRIEFING ARCHIVE
          </div>

          {/* Free briefings */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {freeBriefings.map((b, i) => (
              <div key={i} style={{
                padding: "18px 0",
                borderBottom: `1px solid ${BD1}`,
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}>
                <div style={{
                  fontFamily: MONO, fontSize: 12, color: T4,
                  minWidth: 100, flexShrink: 0, paddingTop: 2,
                }}>
                  {b.date}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{
                    fontFamily: SYS, fontSize: 16, color: T1,
                    fontWeight: 500, marginBottom: 4,
                  }}>
                    {b.title}
                  </div>
                  <div style={{ fontFamily: SYS, fontSize: 14, color: T3 }}>
                    {b.summary}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Locked section */}
          <div style={{
            background: BG1,
            border: `1px solid ${BD1}`,
            borderRadius: 12,
            padding: 20,
            marginTop: 16,
          }}>
            {/* Blurred/dimmed locked rows */}
            <div style={{ opacity: 0.3, pointerEvents: "none" }}>
              {lockedBriefings.map((b, i) => (
                <div key={i} style={{
                  padding: "14px 0",
                  borderBottom: i < lockedBriefings.length - 1 ? `1px solid ${BD1}` : "none",
                  display: "flex",
                  gap: 20,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 12, color: T4,
                    minWidth: 100, flexShrink: 0,
                  }}>
                    {b.date}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: SYS, fontSize: 16, color: T1,
                      fontWeight: 500, marginBottom: 4,
                    }}>
                      {b.title}
                    </div>
                    <div style={{ fontFamily: SYS, fontSize: 14, color: T3 }}>
                      {b.summary}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Lock badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginTop: 16, paddingTop: 16,
              borderTop: `1px solid ${BD1}`,
            }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ fontFamily: SYS, fontSize: 15, color: T3 }}>
                Subscribe to unlock full archive —{" "}
                <Link href="/pricing" style={{ color: AMBER }}>
                  View plans →
                </Link>
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 3 — Quarterly Outlook ── */}
        <div style={{
          background: BG1,
          border: `1px solid ${BD1}`,
          borderRadius: 20,
          padding: 32,
          marginBottom: 32,
        }}>
          <div style={{
            display: "inline-block",
            fontFamily: MONO, fontSize: 11, color: BD2,
            letterSpacing: "0.12em", marginBottom: 20,
            background: BG3, border: `1px solid ${BD2}`,
            borderRadius: 8, padding: "4px 12px",
          }}>
            COMING SOON
          </div>

          <h2 style={{
            fontFamily: SYS, fontSize: 26, fontWeight: 700,
            color: T1, lineHeight: 1.25, marginBottom: 12,
            letterSpacing: "-0.015em",
          }}>
            Q2 2026 Construction Sector Outlook
          </h2>

          <p style={{
            fontFamily: SYS, fontSize: 16, color: T3, lineHeight: 1.7,
            marginBottom: 28, maxWidth: 640,
          }}>
            Our Q2 2026 outlook covers residential recovery prospects, federal infrastructure pipeline,
            materials cycle analysis, and employment forecasts through December 2026.
          </p>

          <QuarterlyNotifyForm />
        </div>

        {/* ── SECTION 4 — Press & Media ── */}
        <div style={{
          background: BG2,
          border: `1px solid ${BD1}`,
          borderRadius: 20,
          padding: 32,
          marginBottom: 32,
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 11, color: T4,
            letterSpacing: "0.12em", marginBottom: 20,
          }}>
            IN THE PRESS
          </div>

          <p style={{
            fontFamily: SYS, fontSize: 16, color: T3, lineHeight: 1.7,
            marginBottom: 10, maxWidth: 660,
          }}>
            ConstructAIQ is building the construction sector&apos;s premier intelligence platform.
            For press inquiries, data licensing, or research collaborations:
          </p>

          <a
            href="mailto:press@constructaiq.trade"
            style={{
              fontFamily: SYS, fontSize: 17, color: AMBER,
              display: "inline-block", marginBottom: 28,
            }}
          >
            press@constructaiq.trade
          </a>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {mediaMentions.map((text, i) => (
              <div key={i} style={{
                flex: "1 1 200px",
                background: BG1,
                border: `1px solid ${BD1}`,
                borderRadius: 12,
                padding: 20,
                opacity: 0.6,
                fontFamily: SYS,
                fontSize: 14,
                color: T4,
                fontStyle: "italic",
              }}>
                {text}
              </div>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  )
}
