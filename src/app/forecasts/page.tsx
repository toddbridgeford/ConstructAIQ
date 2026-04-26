"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Nav }     from "@/app/components/Nav"
import { color, font, space } from "@/lib/theme"

// ── Tokens ────────────────────────────────────────────────────────────────────

const {
  bg0: BG0, bg1: BG1, bg3: BG3,
  bd1: BD1, bd2: BD2,
  t1: T1, t2: T2, t3: T3, t4: T4,
  green: GREEN, amber: AMBER, blue: BLUE, red: RED,
} = color
const MONO = font.mono, SYS = font.sys

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParData {
  overall_par: number | null
  by_horizon:  Record<string, { par: number; sample_size: number }>
  sample_size: number
  as_of:       string
  note:        string
}
interface WeeklyEntry { week_ending: string; par: number | null; sample_size: number }
interface PredActivity {
  made_last_7d:      number
  due_unresolved:    number
  evaluated_last_7d: number
  correct_last_7d:   number
  par_last_7d:       number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parColor(v: number) { return v >= 70 ? GREEN : v >= 50 ? AMBER : RED }

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }
  catch { return iso }
}

function horizonLabel(key: string) {
  const m: Record<string, string> = { "30d": "30 days", "90d": "3 months", "180d": "6 months", "365d": "12 months" }
  return m[key] ?? key
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ flex: "1 1 180px", background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: "20px 20px 16px" }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 700, color: accent ?? T1, lineHeight: 1.1, marginBottom: 6 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: SYS, fontSize: 12, color: T4 }}>{sub}</div>}
    </div>
  )
}

function KPIShimmer() {
  return (
    <div style={{ flex: "1 1 180px", background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: "20px 20px 16px" }}>
      <div style={{ width: 80, height: 10, background: BG3, borderRadius: 3, marginBottom: 12 }} />
      <div style={{ width: 64, height: 32, background: BG3, borderRadius: 4, marginBottom: 8 }} />
      <div style={{ width: 110, height: 10, background: BG3, borderRadius: 3 }} />
    </div>
  )
}

function WeeklyBars({ weeks }: { weeks: WeeklyEntry[] }) {
  const W = 620, H = 128, PL = 0, PR = 0, PT = 8, PB = 28
  const iw = W - PL - PR, ih = H - PT - PB
  const bw = Math.max(4, Math.floor(iw / weeks.length) - 3)
  const target = 70

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible", display: "block" }}>
      {/* 70% target line */}
      <line
        x1={PL} y1={PT + ih * (1 - target / 100)}
        x2={W - PR} y2={PT + ih * (1 - target / 100)}
        stroke={GREEN} strokeWidth={1} strokeDasharray="5 4" opacity={0.45}
      />
      {weeks.map((w, i) => {
        const x  = PL + (i / weeks.length) * iw + 2
        const ok = w.par !== null
        const bh = ok ? Math.max(4, (w.par! / 100) * ih) : 4
        const y  = PT + ih - bh
        return (
          <g key={w.week_ending}>
            <rect x={x} y={y} width={bw} height={bh}
              fill={ok ? parColor(w.par!) : BD2}
              opacity={ok ? 0.82 : 0.25} rx={2} />
            {i % 3 === 0 && (
              <text x={x + bw / 2} y={H - 2} textAnchor="middle"
                fontSize={9} fill={T4} fontFamily={MONO}>
                {fmtDate(w.week_ending)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Explanation items ─────────────────────────────────────────────────────────

const EXPLAINERS = [
  {
    title: "What PAR means",
    body:  "PAR (Prediction Accuracy Rate) is the percentage of resolved predictions whose directional outcome matched the actual data. A PAR of 70% means 7 in 10 directional calls were correct once official data arrived. Target is ≥ 70%.",
  },
  {
    title: "Evaluations happen after the fact",
    body:  "A prediction is not evaluated while it is pending — only after the relevant official data publication arrives for the target period. The pending count reflects forecasts still inside their horizon window. Do not interpret pending predictions as wrong.",
  },
  {
    title: "Accuracy varies by horizon and source",
    body:  "Short-horizon predictions (30 days) against high-frequency series tend to be more accurate than 12-month macroeconomic calls. The by-horizon table shows this breakdown when enough resolved samples exist.",
  },
  {
    title: "What PAR does not measure",
    body:  "PAR measures directional accuracy — whether a metric moved up or down as predicted. It does not measure magnitude of error. It is not financial advice. Past accuracy does not guarantee future performance. Construction data is noisy and subject to official revision.",
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ForecastsPage() {
  const [par,     setPar]     = useState<ParData | null>(null)
  const [weekly,  setWeekly]  = useState<WeeklyEntry[] | null>(null)
  const [pred,    setPred]    = useState<PredActivity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch("/api/par").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/par/weekly").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/status").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([parRes, weeklyRes, statusRes]) => {
      if (!alive) return
      if (parRes && !parRes.error)       setPar(parRes)
      if (weeklyRes?.weeks)              setWeekly(weeklyRes.weeks)
      if (statusRes?.predictions)        setPred(statusRes.predictions)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const hasWeekly   = weekly && weekly.some(w => w.par !== null)
  const horizonKeys = par ? Object.keys(par.by_horizon).sort() : []

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1 }}>
      <Nav />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @media(max-width:680px){
          .fc-kpi{flex-wrap:wrap!important}
          .fc-kpi>*{min-width:calc(50% - 8px)!important}
          .fc-two{flex-direction:column!important}
        }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: `${space.xxl}px ${space.lg}px` }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: space.xl }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            PLATFORM TRANSPARENCY
          </div>
          <h1 style={{ fontFamily: SYS, fontSize: 30, fontWeight: 700, color: T1, marginBottom: 12 }}>
            Forecast Accuracy Center
          </h1>
          <p style={{ fontFamily: SYS, fontSize: 15, color: T3, lineHeight: 1.7, maxWidth: 560 }}>
            Forecasts are evaluated only after actual data arrives — and tracked publicly.
            This page shows current accuracy, pending evaluations, and how the process works.
            Nothing here is investment advice.
          </p>
        </div>

        {/* ── KPI row ── */}
        <div className="fc-kpi" style={{ display: "flex", gap: space.sm, marginBottom: space.xl }}>
          {loading ? (
            [1, 2, 3].map(i => <KPIShimmer key={i} />)
          ) : (
            <>
              <KPICard
                label="Overall PAR"
                value={par?.overall_par != null ? `${par.overall_par}%` : "—"}
                sub={par?.sample_size ? `${par.sample_size.toLocaleString()} resolved predictions` : "No resolved predictions yet"}
                accent={par?.overall_par != null ? parColor(par.overall_par) : undefined}
              />
              <KPICard
                label="PAR — 7 days"
                value={pred?.par_last_7d != null ? `${pred.par_last_7d}%` : "—"}
                sub={pred && pred.evaluated_last_7d > 0 ? `${pred.evaluated_last_7d} evaluated this week` : "No recent evaluations"}
                accent={pred?.par_last_7d != null ? parColor(pred.par_last_7d) : undefined}
              />
              <KPICard
                label="Pending evaluation"
                value={pred?.due_unresolved != null ? String(pred.due_unresolved) : "—"}
                sub="predictions inside horizon window"
              />
            </>
          )}
        </div>

        {/* ── 12-week trend ── */}
        <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: `${space.md}px ${space.lg}px`, marginBottom: space.xl }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: space.sm }}>
            <div>
              <div style={{ fontFamily: SYS, fontSize: 15, fontWeight: 600, color: T1, marginBottom: 4 }}>
                12-Week PAR Trend
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Weekly accuracy rate · dashed line = 70% target
              </div>
            </div>
            {par?.as_of && (
              <div style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>as of {par.as_of}</div>
            )}
          </div>
          {loading ? (
            <div style={{ height: 128, background: BG3, borderRadius: 8 }} />
          ) : hasWeekly ? (
            <WeeklyBars weeks={weekly!} />
          ) : (
            <div style={{ height: 128, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>
                Trend appears after predictions are evaluated — no data yet
              </p>
            </div>
          )}
        </div>

        {/* ── Two columns: breakdown + activity ── */}
        <div className="fc-two" style={{ display: "flex", gap: space.md, marginBottom: space.xl }}>

          {/* Accuracy by horizon */}
          <div style={{ flex: "1 1 0", background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: `${space.md}px ${space.lg}px` }}>
            <div style={{ fontFamily: SYS, fontSize: 15, fontWeight: 600, color: T1, marginBottom: 16 }}>
              Accuracy by Horizon
            </div>
            {loading ? (
              <div style={{ height: 80, background: BG3, borderRadius: 8 }} />
            ) : horizonKeys.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 220 }}>
                  <thead>
                    <tr>
                      {["Horizon", "PAR", "n"].map(h => (
                        <th key={h} style={{
                          textAlign: "left", padding: "6px 0",
                          fontFamily: MONO, fontSize: 10, color: T4,
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          borderBottom: `1px solid ${BD2}`,
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {horizonKeys.map(k => {
                      const item = par!.by_horizon[k]
                      return (
                        <tr key={k}>
                          <td style={{ padding: "8px 0", borderBottom: `1px solid ${BD1}`, fontFamily: SYS, fontSize: 13, color: T2 }}>
                            {horizonLabel(k)}
                          </td>
                          <td style={{ padding: "8px 0", borderBottom: `1px solid ${BD1}`, fontFamily: MONO, fontSize: 13, fontWeight: 600, color: parColor(item.par) }}>
                            {item.par}%
                          </td>
                          <td style={{ padding: "8px 0", borderBottom: `1px solid ${BD1}`, fontFamily: MONO, fontSize: 12, color: T4 }}>
                            {item.sample_size}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>No evaluated predictions by horizon yet</p>
            )}
          </div>

          {/* Prediction activity */}
          <div style={{ flex: "1 1 0", background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: `${space.md}px ${space.lg}px` }}>
            <div style={{ fontFamily: SYS, fontSize: 15, fontWeight: 600, color: T1, marginBottom: 16 }}>
              Prediction Activity — 7 days
            </div>
            {loading ? (
              <div style={{ height: 80, background: BG3, borderRadius: 8 }} />
            ) : pred ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {([
                  { label: "Predictions made",  value: pred.made_last_7d },
                  { label: "Evaluated",          value: pred.evaluated_last_7d },
                  { label: "Correct",            value: pred.correct_last_7d },
                  { label: "Pending evaluation", value: pred.due_unresolved },
                ] as { label: string; value: number }[]).map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderBottom: `1px solid ${BD1}`, padding: "10px 0",
                  }}>
                    <span style={{ fontFamily: SYS, fontSize: 13, color: T2 }}>{label}</span>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: T1 }}>
                      {value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>Activity data unavailable</p>
            )}
          </div>
        </div>

        {/* ── Explainers ── */}
        <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 14, padding: `${space.md}px ${space.lg}px`, marginBottom: space.xl }}>
          <h2 style={{ fontFamily: SYS, fontSize: 18, fontWeight: 700, color: T1, marginBottom: 20 }}>
            How Forecast Validation Works
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {EXPLAINERS.map(({ title, body }) => (
              <div key={title} style={{ borderLeft: `3px solid ${BD2}`, paddingLeft: 16 }}>
                <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: T1, marginBottom: 6 }}>
                  {title}
                </div>
                <p style={{ fontFamily: SYS, fontSize: 14, color: T3, lineHeight: 1.72, margin: 0 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer links ── */}
        <div style={{ borderTop: `1px solid ${BD1}`, paddingTop: space.md, display: "flex", gap: space.lg, flexWrap: "wrap" }}>
          <Link href="/trust" style={{ fontFamily: SYS, fontSize: 14, color: BLUE, textDecoration: "none" }}>
            Trust Center →
          </Link>
          <Link href="/methodology" style={{ fontFamily: SYS, fontSize: 14, color: BLUE, textDecoration: "none" }}>
            Full Methodology →
          </Link>
          <Link href="/methodology/track-record" style={{ fontFamily: SYS, fontSize: 14, color: BLUE, textDecoration: "none" }}>
            MAPE Track Record →
          </Link>
        </div>

      </div>
    </div>
  )
}
