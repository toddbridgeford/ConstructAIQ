"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle } from "lucide-react"
import { color, font, type as typeScale, radius, space } from "@/lib/theme"

// ─── constants ────────────────────────────────────────────────────────────────

const STEPS = [
  "intro", "profile",
  "q1", "q2", "q3", "q4", "q5",
  "email", "confirm",
] as const
type Step = typeof STEPS[number]

const Q_STEPS: Step[] = ["q1", "q2", "q3", "q4", "q5"]

const QUESTIONS = [
  {
    id: "q1",
    label: "Backlog Outlook",
    text: "Compared to 6 months ago, my company's backlog is:",
    options: [
      { label: "Much Lower",    value: 1 },
      { label: "Lower",         value: 2 },
      { label: "About the Same",value: 3 },
      { label: "Higher",        value: 4 },
      { label: "Much Higher",   value: 5 },
    ],
  },
  {
    id: "q2",
    label: "Margin Outlook",
    text: "Over the next 6 months, I expect project margins to:",
    options: [
      { label: "Decrease Significantly", value: 1 },
      { label: "Decrease",               value: 2 },
      { label: "Stay Flat",              value: 3 },
      { label: "Increase",               value: 4 },
      { label: "Increase Significantly", value: 5 },
    ],
  },
  {
    id: "q3",
    label: "Labor Availability",
    text: "Currently, finding qualified construction labor in my area is:",
    options: [
      { label: "Very Difficult", value: 1 },
      { label: "Difficult",      value: 2 },
      { label: "Neutral",        value: 3 },
      { label: "Easy",           value: 4 },
      { label: "Very Easy",      value: 5 },
    ],
  },
  {
    id: "q4",
    label: "Material Cost Concern",
    text: "My biggest material cost concern right now is:",
    options: [
      { label: "None",        value: "none" },
      { label: "Lumber",      value: "lumber" },
      { label: "Steel",       value: "steel" },
      { label: "Concrete",    value: "concrete" },
      { label: "Copper/Wire", value: "copper" },
      { label: "Fuel/Diesel", value: "fuel" },
      { label: "Other",       value: "other" },
    ],
  },
  {
    id: "q5",
    label: "Market Outlook",
    text: "Overall, I expect construction activity in my market to:",
    options: [
      { label: "Decrease Significantly", value: 1 },
      { label: "Decrease",               value: 2 },
      { label: "Stay the Same",          value: 3 },
      { label: "Increase",               value: 4 },
      { label: "Increase Significantly", value: 5 },
    ],
  },
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function qIndex(step: Step): number {
  return Q_STEPS.indexOf(step) // 0-based; -1 if not a question step
}

function progressPct(step: Step): number {
  const idx = Q_STEPS.indexOf(step)
  if (idx < 0) return 0
  return Math.round(((idx + 1) / Q_STEPS.length) * 100)
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    })
  } catch {
    return iso
  }
}

// ─── shared style fragments ───────────────────────────────────────────────────

const SYS = font.sys

const inputBase: React.CSSProperties = {
  width: "100%",
  background: color.bg2,
  border: `1px solid ${color.bd1}`,
  borderRadius: radius.md,
  padding: "13px 18px",
  color: color.t1,
  fontSize: 15,
  fontFamily: SYS,
  outline: "none",
  boxSizing: "border-box",
  appearance: "none",
  WebkitAppearance: "none",
}

const selectBase: React.CSSProperties = {
  ...inputBase,
  minHeight: 52,
  cursor: "pointer",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236e6e73' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
  paddingRight: 40,
}

// ─── component ────────────────────────────────────────────────────────────────

export default function SurveyPage() {
  const [step, setStep] = useState<Step>("intro")
  const [periodId, setPeriodId]           = useState<number | null>(null)
  const [quarter, setQuarter]             = useState("Q2 2025")
  const [closesAt, setClosesAt]           = useState("")
  const [responseCount, setResponseCount] = useState(0)
  const [finalCount, setFinalCount]       = useState(0)

  // Profile
  const [revenueBand, setRevenueBand] = useState("")
  const [workType, setWorkType]       = useState("")
  const [region, setRegion]           = useState("")
  const [yearsBand, setYearsBand]     = useState("")

  // Q1–Q5 answers keyed by question id
  const [answers, setAnswers] = useState<Record<string, number | string>>({})

  // Email step
  const [email, setEmail]       = useState("")
  const [comments, setComments] = useState("")

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [alreadyResponded, setAlreadyResponded] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // Auto-advance timer
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch("/api/survey/current")
      .then(r => r.json())
      .then(d => {
        if (d.period_id)    setPeriodId(d.period_id)
        if (d.quarter)      setQuarter(d.quarter)
        if (d.closes_at)    setClosesAt(d.closes_at)
        if (d.response_count != null) setResponseCount(d.response_count)
      })
      .catch(() => {/* fallback values already set */})
  }, [])

  function goTo(next: Step) {
    setStep(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleAnswer(qId: string, val: number | string) {
    setAnswers(prev => ({ ...prev, [qId]: val }))
    // Auto-advance after 300ms
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => {
      const idx = Q_STEPS.indexOf(qId as Step)
      if (idx < Q_STEPS.length - 1) {
        goTo(Q_STEPS[idx + 1])
      } else {
        goTo("email")
      }
    }, 300)
  }

  function profileComplete() {
    return revenueBand && workType && region && yearsBand
  }

  async function handleSubmit() {
    if (!email.includes("@")) {
      setSubmitError("Please enter a valid email address.")
      return
    }
    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_id:           periodId,
          email,
          revenue_band:        revenueBand,
          work_type:           workType,
          region,
          years_band:          yearsBand,
          backlog_outlook:     answers.q1,
          margin_outlook:      answers.q2,
          labor_availability:  answers.q3,
          material_concern:    answers.q4,
          market_outlook:      answers.q5,
          comments,
        }),
      })
      const data = await res.json()
      if (res.status === 409) {
        setAlreadyResponded(true)
        goTo("confirm")
        return
      }
      if (!res.ok) {
        setSubmitError(data.error || "Submission failed. Please try again.")
        return
      }
      setFinalCount(data.response_count ?? responseCount + 1)
      goTo("confirm")
    } catch {
      setSubmitError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {/* ignore */}
  }

  const isQStep = Q_STEPS.includes(step as Step)
  const qIdx    = isQStep ? qIndex(step) : -1
  const pct     = isQStep ? progressPct(step) : 0

  return (
    <div style={{
      minHeight: "100vh",
      background: color.bg0,
      color: color.t1,
      fontFamily: SYS,
      paddingBottom: "env(safe-area-inset-bottom, 24px)",
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{font-family:inherit;cursor:pointer;border:none;outline:none}
        button:disabled{cursor:not-allowed;opacity:0.45}
        input::placeholder,textarea::placeholder{color:${color.t4}}
        input:focus,textarea:focus,select:focus{
          border-color:${color.bd2}!important;outline:none
        }
        option{background:${color.bg2}}
        @media(max-width:600px){
          .profile-grid{grid-template-columns:1fr!important}
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
        <Link href="/">
          <Image
            src="/ConstructAIQWhiteLogo.svg"
            width={120} height={24} alt="ConstructAIQ"
            style={{ height: 24, width: "auto" }}
          />
        </Link>

        {/* Progress indicator — visible during Q1–Q5 */}
        {isQStep && (
          <div style={{
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          }}>
            <div style={{ ...typeScale.caption, color: color.t3, letterSpacing: "0.08em" }}>
              Question {qIdx + 1} of {Q_STEPS.length}
            </div>
            <div style={{
              width: 120, height: 3,
              background: color.bg3,
              borderRadius: radius.full,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                background: color.blue,
                borderRadius: radius.full,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        )}

        <Link href="/dashboard">
          <button style={{
            background: "transparent",
            color: color.t3,
            fontSize: 13,
            fontFamily: font.mono,
            letterSpacing: "0.07em",
            padding: "8px 16px",
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.sm,
            minHeight: 44,
          }}>
            DASHBOARD
          </button>
        </Link>
      </nav>

      {/* ── Content area ── */}
      <div style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "0 20px",
      }}>

        {/* ─── INTRO ─────────────────────────────────────────────────────── */}
        {step === "intro" && (
          <div style={{ paddingTop: 56, paddingBottom: 80 }}>
            {/* Quarter badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: color.bg2,
              border: `1px solid ${color.bd2}`,
              borderRadius: radius.full,
              padding: "5px 14px",
              marginBottom: 28,
            }}>
              <div style={{
                width: 6, height: 6,
                borderRadius: radius.full,
                background: color.amber,
              }} />
              <span style={{
                fontFamily: font.mono,
                fontSize: 11,
                color: color.amber,
                letterSpacing: "0.1em",
              }}>
                {quarter} · Open through {fmtDate(closesAt) || "May 21"}
              </span>
            </div>

            <h1 style={{
              ...typeScale.h2,
              color: color.t1,
              marginBottom: space[4],
            }}>
              ConstructAIQ Quarterly GC Survey
            </h1>

            <p style={{
              ...typeScale.body,
              color: color.t2,
              marginBottom: space[4],
              lineHeight: 1.65,
            }}>
              5 questions. 90 seconds. Your responses are aggregated and published free —
              never sold, never shared individually.
            </p>

            <p style={{
              ...typeScale.body,
              color: color.t3,
              marginBottom: 40,
              lineHeight: 1.65,
            }}>
              Results from this survey are the only construction intelligence signal not
              available from any public API. Your input makes the platform better for everyone.
            </p>

            {/* Respondent count */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: color.bg2,
              border: `1px solid ${color.bd1}`,
              borderRadius: radius.lg,
              padding: "14px 20px",
              marginBottom: 32,
            }}>
              <div style={{
                width: 8, height: 8,
                borderRadius: radius.full,
                background: color.green,
                flexShrink: 0,
              }} />
              <span style={{ ...typeScale.bodySm, color: color.t2 }}>
                Join{" "}
                <strong style={{ color: color.t1 }}>{responseCount.toLocaleString()}</strong>{" "}
                contractors who have already responded
              </span>
            </div>

            <button
              onClick={() => goTo("profile")}
              style={{
                width: "100%",
                minHeight: 56,
                background: color.blue,
                color: color.t1,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: radius.lg,
                letterSpacing: "-0.01em",
                transition: "opacity 0.15s",
              }}
            >
              Start Survey →
            </button>
          </div>
        )}

        {/* ─── PROFILE ───────────────────────────────────────────────────── */}
        {step === "profile" && (
          <div style={{ paddingTop: 48, paddingBottom: 80 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ ...typeScale.caption, color: color.t4, marginBottom: 10 }}>
                ABOUT YOUR COMPANY
              </div>
              <h2 style={{ ...typeScale.h4, color: color.t1 }}>
                Before we start — tell us a bit about your firm.
              </h2>
            </div>

            <div
              className="profile-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 32,
              }}
            >
              {/* Revenue band */}
              <div>
                <label style={{ ...typeScale.caption, color: color.t4, display: "block", marginBottom: 8 }}>
                  ANNUAL REVENUE
                </label>
                <select
                  value={revenueBand}
                  onChange={e => setRevenueBand(e.target.value)}
                  style={selectBase}
                >
                  <option value="" disabled>Select range</option>
                  <option value="under_5m">Under $5M</option>
                  <option value="5_25m">$5M – $25M</option>
                  <option value="25_100m">$25M – $100M</option>
                  <option value="100_500m">$100M – $500M</option>
                  <option value="over_500m">Over $500M</option>
                </select>
              </div>

              {/* Work type */}
              <div>
                <label style={{ ...typeScale.caption, color: color.t4, display: "block", marginBottom: 8 }}>
                  PRIMARY WORK TYPE
                </label>
                <select
                  value={workType}
                  onChange={e => setWorkType(e.target.value)}
                  style={selectBase}
                >
                  <option value="" disabled>Select type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="specialty">Specialty Trade</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              {/* Region */}
              <div>
                <label style={{ ...typeScale.caption, color: color.t4, display: "block", marginBottom: 8 }}>
                  PRIMARY REGION
                </label>
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  style={selectBase}
                >
                  <option value="" disabled>Select region</option>
                  <option value="northeast">Northeast</option>
                  <option value="southeast">Southeast</option>
                  <option value="midwest">Midwest</option>
                  <option value="southwest">Southwest</option>
                  <option value="west">West</option>
                  <option value="national">National</option>
                </select>
              </div>

              {/* Years in business */}
              <div>
                <label style={{ ...typeScale.caption, color: color.t4, display: "block", marginBottom: 8 }}>
                  YEARS IN BUSINESS
                </label>
                <select
                  value={yearsBand}
                  onChange={e => setYearsBand(e.target.value)}
                  style={selectBase}
                >
                  <option value="" disabled>Select range</option>
                  <option value="under_5">Under 5</option>
                  <option value="5_15">5 – 15</option>
                  <option value="15_30">15 – 30</option>
                  <option value="over_30">Over 30</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => goTo("q1")}
              disabled={!profileComplete()}
              style={{
                width: "100%",
                minHeight: 56,
                background: profileComplete() ? color.blue : color.bg3,
                color: profileComplete() ? color.t1 : color.t4,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: radius.lg,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              Continue to Questions →
            </button>
          </div>
        )}

        {/* ─── QUESTIONS Q1–Q5 ───────────────────────────────────────────── */}
        {isQStep && (() => {
          const q = QUESTIONS[qIdx]
          const selected = answers[q.id]
          const prevStep = qIdx === 0 ? "profile" : Q_STEPS[qIdx - 1]
          const nextStep = qIdx < Q_STEPS.length - 1 ? Q_STEPS[qIdx + 1] : "email"
          return (
            <div style={{ paddingTop: 48, paddingBottom: 80 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ ...typeScale.caption, color: color.t4, marginBottom: 10 }}>
                  {q.label.toUpperCase()}
                </div>
                <h2 style={{
                  ...typeScale.h4,
                  color: color.t1,
                  lineHeight: 1.35,
                }}>
                  {q.text}
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
                {q.options.map(opt => {
                  const isSelected = selected === opt.value
                  return (
                    <button
                      key={String(opt.value)}
                      onClick={() => handleAnswer(q.id, opt.value)}
                      style={{
                        width: "100%",
                        minHeight: 56,
                        background: isSelected ? color.blue + "22" : color.bg2,
                        border: `1px solid ${isSelected ? color.blue : color.bd1}`,
                        borderRadius: radius.lg,
                        color: isSelected ? color.t1 : color.t2,
                        fontSize: 16,
                        fontWeight: isSelected ? 600 : 400,
                        textAlign: "left",
                        padding: "0 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        transition: "border-color 0.15s, background 0.15s",
                        cursor: "pointer",
                      }}
                    >
                      {/* Selection indicator */}
                      <div style={{
                        width: 18, height: 18,
                        borderRadius: radius.full,
                        border: `2px solid ${isSelected ? color.blue : color.bd2}`,
                        background: isSelected ? color.blue : "transparent",
                        flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "border-color 0.15s, background 0.15s",
                      }}>
                        {isSelected && (
                          <div style={{
                            width: 7, height: 7,
                            borderRadius: radius.full,
                            background: color.t1,
                          }} />
                        )}
                      </div>
                      {opt.label}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => goTo(prevStep as Step)}
                  style={{
                    flex: "0 0 auto",
                    minHeight: 52,
                    background: color.bg2,
                    border: `1px solid ${color.bd1}`,
                    color: color.t3,
                    fontSize: 15,
                    borderRadius: radius.lg,
                    padding: "0 24px",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (advanceTimer.current) clearTimeout(advanceTimer.current)
                    goTo(nextStep as Step)
                  }}
                  disabled={selected === undefined}
                  style={{
                    flex: 1,
                    minHeight: 52,
                    background: selected !== undefined ? color.bg3 : color.bg2,
                    border: `1px solid ${selected !== undefined ? color.bd2 : color.bd1}`,
                    color: selected !== undefined ? color.t2 : color.t4,
                    fontSize: 15,
                    borderRadius: radius.lg,
                  }}
                >
                  {qIdx < Q_STEPS.length - 1 ? "Next →" : "Continue →"}
                </button>
              </div>
            </div>
          )
        })()}

        {/* ─── EMAIL CAPTURE ─────────────────────────────────────────────── */}
        {step === "email" && (
          <div style={{ paddingTop: 48, paddingBottom: 80 }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ ...typeScale.h4, color: color.t1, marginBottom: 10 }}>
                Where should we send your results?
              </h2>
              <p style={{ ...typeScale.bodySm, color: color.t3, lineHeight: 1.65 }}>
                We email you when {quarter} results publish.
                Your email is never stored — only a one-way hash is used to prevent duplicate responses.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ ...inputBase, minHeight: 52 }}
              />

              <textarea
                placeholder="e.g. Tariff uncertainty on steel, labor shortage in our market, strong federal pipeline..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={4}
                style={{
                  ...inputBase,
                  resize: "vertical",
                  minHeight: 110,
                  lineHeight: 1.6,
                }}
              />
              <div style={{ ...typeScale.caption, color: color.t4, marginTop: -6 }}>
                ANYTHING ELSE DRIVING YOUR OUTLOOK? (OPTIONAL)
              </div>
            </div>

            {submitError && (
              <div style={{
                ...typeScale.bodySm,
                color: color.red,
                background: color.redDim,
                border: `1px solid ${color.red}33`,
                borderRadius: radius.md,
                padding: "12px 16px",
                marginBottom: 16,
              }}>
                {submitError}
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => goTo("q5")}
                style={{
                  flex: "0 0 auto",
                  minHeight: 52,
                  background: color.bg2,
                  border: `1px solid ${color.bd1}`,
                  color: color.t3,
                  fontSize: 15,
                  borderRadius: radius.lg,
                  padding: "0 24px",
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !email.includes("@")}
                style={{
                  flex: 1,
                  minHeight: 52,
                  background: email.includes("@") ? color.blue : color.bg3,
                  border: `1px solid ${email.includes("@") ? color.blue : color.bd1}`,
                  color: color.t1,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: radius.lg,
                  transition: "background 0.2s, border-color 0.2s",
                }}
              >
                {submitting ? "Submitting…" : "Submit My Response →"}
              </button>
            </div>
          </div>
        )}

        {/* ─── CONFIRMATION ──────────────────────────────────────────────── */}
        {step === "confirm" && !alreadyResponded && (
          <div style={{ paddingTop: 72, paddingBottom: 80, textAlign: "center" }}>
            <div style={{
              display: "flex", justifyContent: "center",
              marginBottom: 28,
            }}>
              <CheckCircle size={52} color={color.green} strokeWidth={1.5} />
            </div>

            <h1 style={{
              ...typeScale.h3,
              color: color.t1,
              marginBottom: 12,
            }}>
              Response received. Thank you.
            </h1>
            <p style={{ ...typeScale.bodySm, color: color.t3, marginBottom: 48 }}>
              Your input is part of the {quarter} construction sentiment index.
            </p>

            {/* Stats */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 12,
              marginBottom: 48,
            }}>
              {[
                [`Respondent #${finalCount.toLocaleString()} this quarter`, color.amber],
                [`Results publish: ${fmtDate(closesAt) || "May 21, 2025"}`, color.blue],
                ["Next survey: Q3 2025 opens July 2025", color.t3],
              ].map(([text, col]) => (
                <div key={String(text)} style={{
                  background: color.bg2,
                  border: `1px solid ${color.bd1}`,
                  borderRadius: radius.md,
                  padding: "14px 20px",
                  color: String(col),
                  ...typeScale.bodySm,
                }}>
                  {text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/dashboard" style={{ flex: 1 }}>
                <button style={{
                  width: "100%",
                  minHeight: 52,
                  background: color.blue,
                  color: color.t1,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: radius.lg,
                }}>
                  View Current Dashboard
                </button>
              </Link>
              <button
                onClick={copyLink}
                style={{
                  flex: 1,
                  minHeight: 52,
                  background: color.bg2,
                  border: `1px solid ${color.bd1}`,
                  color: color.t2,
                  fontSize: 15,
                  borderRadius: radius.lg,
                }}
              >
                Share This Survey
              </button>
            </div>
          </div>
        )}

        {/* ─── ALREADY RESPONDED ─────────────────────────────────────────── */}
        {step === "confirm" && alreadyResponded && (
          <div style={{ paddingTop: 72, paddingBottom: 80, textAlign: "center" }}>
            <div style={{
              display: "flex", justifyContent: "center",
              marginBottom: 28,
            }}>
              <CheckCircle size={52} color={color.amber} strokeWidth={1.5} />
            </div>

            <h1 style={{ ...typeScale.h3, color: color.t1, marginBottom: 12 }}>
              Already submitted.
            </h1>
            <p style={{ ...typeScale.body, color: color.t3, marginBottom: 8, lineHeight: 1.65 }}>
              You have already submitted a response for {quarter}.
            </p>
            <p style={{ ...typeScale.bodySm, color: color.t4, marginBottom: 40 }}>
              Results will be available after {fmtDate(closesAt) || "May 21, 2025"}.
            </p>

            <Link href="/survey/results">
              <button style={{
                minHeight: 52,
                padding: "0 32px",
                background: color.bg2,
                border: `1px solid ${color.bd1}`,
                color: color.t2,
                fontSize: 15,
                borderRadius: radius.lg,
              }}>
                View Survey Results
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
