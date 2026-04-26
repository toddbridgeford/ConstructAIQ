"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from "recharts"
import { Nav }     from "@/app/components/Nav"
import { Skeleton } from "@/app/components/Skeleton"
import { color, font } from "@/lib/theme"

// ── Tokens ─────────────────────────────────────────────────────────────────

const { bg0:BG0, bg1:BG1, bg2:BG2, bd1:BD1, bd2:BD2,
        t1:T1, t2:T2, t3:T3, t4:T4,
        green:GREEN, amber:AMBER, blue:BLUE, red:RED } = color
const MONO = font.mono, SYS = font.sys

// ── Types ──────────────────────────────────────────────────────────────────

interface ParBreakdownItem { par: number; sample_size: number }

interface ParData {
  overall_par: number | null
  by_horizon:  Record<string, ParBreakdownItem>
  by_type:     Record<string, ParBreakdownItem>
  sample_size: number
  as_of:       string
  note:        string
}

interface WeeklyEntry {
  week_ending: string
  par:         number | null
  sample_size: number
}

interface TrackRecord {
  month:    string
  forecast: number
  actual:   number
  error:    number
  pctError: number
}
interface TrackData {
  records:      TrackRecord[]
  avgMape:      number | null
  directionAcc: number | null
  n:            number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtMonth(iso: string): string {
  try { return new Date(iso + "-01").toLocaleDateString("en-US", { month:"short", year:"numeric" }) }
  catch { return iso }
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric" }) }
  catch { return iso }
}

function horizonLabel(key: string): string {
  const map: Record<string, string> = { "30d":"1 month", "90d":"3 months", "180d":"6 months", "365d":"12 months" }
  return map[key] ?? key
}

function errColor(pct: number): string {
  if (pct < 2) return GREEN
  if (pct < 5) return AMBER
  return RED
}
function errBg(pct: number): string {
  if (pct < 2) return color.greenDim
  if (pct < 5) return color.amberDim
  return color.redDim
}

function parColor(par: number): string {
  if (par >= 90) return GREEN
  if (par >= 75) return AMBER
  return RED
}

// ── Shared components ──────────────────────────────────────────────────────

function KpiCard({ label, value, sub, valueColor }: {
  label: string; value: string; sub?: string; valueColor?: string
}) {
  return (
    <div style={{ flex:"1 1 180px", background:BG1, borderRadius:16,
                  border:`1px solid ${BD1}`, padding:"20px 24px" }}>
      <div style={{ fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.1em",
                    textTransform:"uppercase", marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:MONO, fontSize:26, fontWeight:700,
                    color:valueColor ?? T1, letterSpacing:"-0.02em", lineHeight:1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily:SYS, fontSize:12, color:T3, marginTop:5 }}>{sub}</div>}
    </div>
  )
}

function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return (
    <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`,
                  padding:"28px 32px", ...style }}>
      {children}
    </div>
  )
}

function SLabel({ children }: { children:React.ReactNode }) {
  return (
    <div style={{ fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.12em",
                  textTransform:"uppercase", marginBottom:14 }}>{children}</div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WeeklyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{ background:BG2, border:`1px solid ${BD2}`, borderRadius:10,
                  padding:"10px 14px", fontFamily:MONO, fontSize:12 }}>
      <div style={{ color:T4, marginBottom:4 }}>Week ending {fmtDate(label)}</div>
      <div style={{ color:p.value != null ? parColor(p.value) : T4 }}>
        PAR: {p.value != null ? `${p.value}%` : "no data"}
      </div>
      <div style={{ color:T4, fontSize:10, marginTop:2 }}>
        {payload[1]?.value ?? 0} resolved
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TrackTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:BG2, border:`1px solid ${BD2}`, borderRadius:10,
                  padding:"10px 14px", fontFamily:MONO, fontSize:12 }}>
      <div style={{ color:T4, marginBottom:6 }}>{fmtMonth(label)}</div>
      {payload.map((p: { name:string; value:number; color:string }) => (
        <div key={p.name} style={{ color:p.color, marginBottom:2 }}>
          {p.name}: ${p.value.toFixed(1)}B
        </div>
      ))}
    </div>
  )
}

function InsufficientData() {
  return (
    <div style={{ padding:"40px 32px", textAlign:"center" }}>
      <div style={{ fontFamily:SYS, fontSize:15, color:T3, lineHeight:1.7 }}>
        Insufficient resolved predictions — check back as the platform ages.
      </div>
      <div style={{ fontFamily:MONO, fontSize:11, color:T4, marginTop:8 }}>
        Predictions are resolved weekly after their horizon window elapses.
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function TrackRecordPage() {
  const [par,     setPar]     = useState<ParData | null>(null)
  const [weekly,  setWeekly]  = useState<WeeklyEntry[]>([])
  const [track,   setTrack]   = useState<TrackData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      async function safe(url: string) {
        try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
      }
      const [parD, weeklyD, trackD] = await Promise.all([
        safe("/api/par"),
        safe("/api/par/weekly"),
        safe("/api/forecast/track-record"),
      ])
      if (parD)    setPar(parD)
      if (weeklyD) setWeekly(weeklyD.weeks ?? [])
      if (trackD)  setTrack(trackD)
      setLoading(false)
    }
    load()
  }, [])

  const hasEnoughData    = (par?.sample_size ?? 0) > 0
  const overallPar       = par?.overall_par ?? null
  const sampleSize       = par?.sample_size ?? 0
  const byHorizon        = par?.by_horizon  ?? {}
  const byType           = par?.by_type     ?? {}
  const asOf             = par?.as_of       ?? ""

  // Chart data: forecast vs actual from track-record API
  const chartData = (track?.records ?? []).map(r => ({
    month: r.month, Forecast: r.forecast, Actual: r.actual,
  }))

  // Weekly PAR chart data — only weeks with data
  const weeklyChart = weekly.map(w => ({
    week_ending: w.week_ending,
    par:         w.par,
    sample_size: w.sample_size,
  }))

  // Horizon breakdown sorted: 30d, 90d, 180d, 365d
  const horizonOrder = ["30d", "90d", "180d", "365d"]
  const horizonRows = horizonOrder
    .filter(k => byHorizon[k])
    .map(k => ({ key: k, label: horizonLabel(k), ...byHorizon[k] }))

  // Also include any unlisted horizon keys not in the standard set
  Object.keys(byHorizon).filter(k => !horizonOrder.includes(k)).forEach(k => {
    horizonRows.push({ key: k, label: k, ...byHorizon[k] })
  })

  // Score-type rows (confidence levels if present)
  const typeRows = Object.entries(byType).map(([key, v]) => ({
    key,
    label: key.replace("80pct","80% interval").replace("95pct","95% interval"),
    ...v,
  }))

  const pendingNote = par?.note ?? ""

  return (
    <div style={{ minHeight:"100vh", background:BG0, color:T1, fontFamily:SYS,
                  paddingBottom:"env(safe-area-inset-bottom,24px)" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{color:inherit;text-decoration:none}button{font-family:inherit}`}</style>

      <Nav />

      <div style={{ maxWidth:1040, margin:"0 auto", padding:"64px 32px 80px" }}>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom:56 }}>
          <div style={{ fontFamily:MONO, fontSize:11, color:T4,
                        letterSpacing:"0.06em", marginBottom:12 }}>
            <Link href="/methodology" style={{ color:T4 }}>Methodology</Link>
            {" / Track Record"}
          </div>
          <h1 style={{ fontFamily:SYS, fontSize:44, fontWeight:700,
                       letterSpacing:"-0.035em", lineHeight:1.06, color:T1, marginBottom:14 }}>
            Forecast Track Record
          </h1>
          <p style={{ fontFamily:SYS, fontSize:17, color:T3, lineHeight:1.65, maxWidth:580 }}>
            Live prediction accuracy computed from resolved outcomes — no hardcoded figures.
            Predictions are checked against Census Bureau actuals as each horizon window elapses.
          </p>
          {asOf && (
            <div style={{ fontFamily:MONO, fontSize:11, color:T4,
                          marginTop:12, letterSpacing:"0.04em" }}>
              Figures as of {asOf}
            </div>
          )}
        </div>

        {/* ── PAR KPI row ──────────────────────────────────────────── */}
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:32 }}>
          {loading ? (
            [0,1,2,3].map(i => <Skeleton key={i} height={96} borderRadius={16}
                                          style={{ flex:"1 1 180px" }} />)
          ) : (
            <>
              <KpiCard
                label="Overall PAR"
                value={overallPar != null ? `${overallPar}%` : "—"}
                sub={sampleSize > 0
                  ? `computed from ${sampleSize} resolved prediction${sampleSize !== 1 ? "s" : ""}`
                  : "no resolved predictions yet"}
                valueColor={overallPar != null ? parColor(overallPar) : T4}
              />
              {horizonRows[0] && (
                <KpiCard
                  label={`PAR · ${horizonRows[0].label}`}
                  value={`${horizonRows[0].par}%`}
                  sub={`n = ${horizonRows[0].sample_size}`}
                  valueColor={parColor(horizonRows[0].par)}
                />
              )}
              {horizonRows[1] && (
                <KpiCard
                  label={`PAR · ${horizonRows[1].label}`}
                  value={`${horizonRows[1].par}%`}
                  sub={`n = ${horizonRows[1].sample_size}`}
                  valueColor={parColor(horizonRows[1].par)}
                />
              )}
              <KpiCard
                label="Resolved Predictions"
                value={sampleSize > 0 ? `${sampleSize}` : "0"}
                sub={pendingNote || "outcomes checked weekly"}
              />
            </>
          )}
        </div>

        {/* ── PAR by Horizon ───────────────────────────────────────── */}
        <Card style={{ marginBottom:24 }}>
          <SLabel>PAR by Forecast Horizon</SLabel>
          <h2 style={{ fontFamily:SYS, fontSize:20, fontWeight:700, color:T1,
                       letterSpacing:"-0.02em", marginBottom:20 }}>
            Accuracy by Horizon Window
          </h2>
          {loading ? (
            <Skeleton height={120} borderRadius={12} />
          ) : !hasEnoughData ? (
            <InsufficientData />
          ) : horizonRows.length > 0 ? (
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {horizonRows.map(row => (
                <div key={row.key} style={{
                  flex:"1 1 160px", background:BG2, borderRadius:14,
                  border:`1px solid ${BD1}`, padding:"18px 20px",
                }}>
                  <div style={{ fontFamily:MONO, fontSize:10, color:T4,
                                letterSpacing:"0.08em", textTransform:"uppercase",
                                marginBottom:8 }}>
                    {row.label}
                  </div>
                  <div style={{ fontFamily:MONO, fontSize:28, fontWeight:700,
                                color:parColor(row.par), lineHeight:1.1 }}>
                    {row.par}%
                  </div>
                  <div style={{ fontFamily:MONO, fontSize:11, color:T4, marginTop:6 }}>
                    n = {row.sample_size}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <InsufficientData />
          )}
          <div style={{ marginTop:18, fontFamily:SYS, fontSize:12, color:T4, lineHeight:1.6 }}>
            PAR (Prediction Accuracy Rate): fraction of resolved predictions where the Census Bureau
            actual fell within the stated confidence interval.
          </div>
        </Card>

        {/* ── PAR by Score Type ────────────────────────────────────── */}
        {typeRows.length > 0 && (
          <Card style={{ marginBottom:24 }}>
            <SLabel>PAR by Confidence Level</SLabel>
            <h2 style={{ fontFamily:SYS, fontSize:20, fontWeight:700, color:T1,
                         letterSpacing:"-0.02em", marginBottom:20 }}>
              Accuracy by Interval Width
            </h2>
            {loading ? (
              <Skeleton height={80} borderRadius={12} />
            ) : (
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                {typeRows.map(row => (
                  <div key={row.key} style={{
                    flex:"1 1 180px", background:BG2, borderRadius:14,
                    border:`1px solid ${BD1}`, padding:"18px 20px",
                  }}>
                    <div style={{ fontFamily:MONO, fontSize:10, color:T4,
                                  letterSpacing:"0.08em", textTransform:"uppercase",
                                  marginBottom:8 }}>
                      {row.label}
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:28, fontWeight:700,
                                  color:parColor(row.par), lineHeight:1.1 }}>
                      {row.par}%
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:11, color:T4, marginTop:6 }}>
                      n = {row.sample_size}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── Weekly PAR Trend ─────────────────────────────────────── */}
        <Card style={{ marginBottom:24 }}>
          <SLabel>PAR Trend · Last 12 Weeks</SLabel>
          <h2 style={{ fontFamily:SYS, fontSize:20, fontWeight:700, color:T1,
                       letterSpacing:"-0.02em", marginBottom:24 }}>
            Rolling Accuracy — Weekly View
          </h2>
          {loading ? (
            <Skeleton height={200} borderRadius={12} />
          ) : weeklyChart.some(w => w.par != null) ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyChart} margin={{ top:8, right:24, bottom:0, left:0 }}>
                <CartesianGrid stroke={BD1} strokeDasharray="3,3" />
                <XAxis
                  dataKey="week_ending"
                  tick={{ fontFamily:MONO, fontSize:10, fill:T4 }}
                  tickFormatter={fmtDate}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontFamily:MONO, fontSize:10, fill:T4 }}
                  tickFormatter={v => `${v}%`}
                  axisLine={false} tickLine={false}
                  domain={[0, 100]} width={40}
                />
                <Tooltip content={<WeeklyTooltip />} />
                <Line
                  dataKey="par" stroke={BLUE} strokeWidth={2}
                  dot={{ fill:BLUE, r:3 }} activeDot={{ r:5 }}
                  connectNulls={false}
                />
                <Line dataKey="sample_size" hide />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <InsufficientData />
          )}
          <div style={{ marginTop:14, fontFamily:SYS, fontSize:12, color:T4, lineHeight:1.6 }}>
            Each point shows PAR for predictions resolved in that week.
            Gaps indicate weeks with no resolved outcomes.
          </div>
        </Card>

        {/* ── Forecast vs Actual Chart ──────────────────────────────── */}
        {(loading || chartData.length > 0) && (
          <Card style={{ marginBottom:24 }}>
            <SLabel>Forecast vs Actual · TTLCONS · 12-Month-Ahead Predictions</SLabel>
            <h2 style={{ fontFamily:SYS, fontSize:20, fontWeight:700, color:T1,
                         letterSpacing:"-0.02em", marginBottom:24 }}>
              What We Forecast vs. What Happened
            </h2>
            {loading ? (
              <Skeleton height={280} borderRadius={12} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top:8, right:24, bottom:0, left:0 }}>
                  <CartesianGrid stroke={BD1} strokeDasharray="3,3" />
                  <XAxis
                    dataKey="month" tick={{ fontFamily:MONO, fontSize:10, fill:T4 }}
                    tickFormatter={fmtMonth} axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontFamily:MONO, fontSize:10, fill:T4 }}
                    tickFormatter={v => `$${(v/1000).toFixed(1)}T`}
                    axisLine={false} tickLine={false} width={56}
                  />
                  <Tooltip content={<TrackTooltip />} />
                  <Line dataKey="Forecast" stroke={AMBER} strokeWidth={2}
                        dot={{ fill:AMBER, r:3 }} activeDot={{ r:5 }} />
                  <Line dataKey="Actual"   stroke={T1}   strokeWidth={2.5}
                        dot={{ fill:T1, r:3 }} activeDot={{ r:5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div style={{ marginTop:16, fontFamily:SYS, fontSize:12, color:T4, lineHeight:1.6 }}>
              Amber: forecast published 12 months prior. White: Census C30 actuals (SAAR, $B).
            </div>
          </Card>
        )}

        {/* ── Monthly accuracy table ────────────────────────────────── */}
        {(loading || (track?.records ?? []).length > 0) && (
          <Card style={{ marginBottom:24, padding:0, overflow:"hidden" }}>
            <div style={{ padding:"24px 28px 0" }}>
              <SLabel>Monthly Breakdown · TTLCONS Historical Backtests</SLabel>
              <h2 style={{ fontFamily:SYS, fontSize:20, fontWeight:700, color:T1,
                           letterSpacing:"-0.02em", marginBottom:20 }}>
                Forecast vs Actual — Month by Month
              </h2>
            </div>
            {loading ? (
              <div style={{ padding:"0 28px 28px" }}>
                <Skeleton height={280} borderRadius={12} />
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["Month","Forecast ($B)","Actual ($B)","Error ($B)","% Error"].map(h => (
                        <th key={h} style={{
                          fontFamily:MONO, fontSize:10, color:T4,
                          letterSpacing:"0.08em", textTransform:"uppercase",
                          padding:"10px 20px", textAlign:"left",
                          background:BG2, fontWeight:600, whiteSpace:"nowrap",
                          borderBottom:`1px solid ${BD1}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(track?.records ?? []).map((r, i) => (
                      <tr key={r.month} style={{ background: i % 2 === 0 ? BG2 : BG1 }}>
                        <td style={{ fontFamily:MONO, fontSize:12, color:T2,
                                     padding:"11px 20px", borderTop:`1px solid ${BD1}`,
                                     whiteSpace:"nowrap" }}>
                          {fmtMonth(r.month)}
                        </td>
                        <td style={{ fontFamily:MONO, fontSize:12, color:AMBER,
                                     padding:"11px 20px", borderTop:`1px solid ${BD1}` }}>
                          {r.forecast.toFixed(1)}
                        </td>
                        <td style={{ fontFamily:MONO, fontSize:12, color:T1, fontWeight:600,
                                     padding:"11px 20px", borderTop:`1px solid ${BD1}` }}>
                          {r.actual.toFixed(1)}
                        </td>
                        <td style={{ fontFamily:MONO, fontSize:12,
                                     color: r.error >= 0 ? GREEN : RED,
                                     padding:"11px 20px", borderTop:`1px solid ${BD1}` }}>
                          {r.error >= 0 ? "+" : ""}{r.error.toFixed(1)}
                        </td>
                        <td style={{ padding:"11px 20px", borderTop:`1px solid ${BD1}` }}>
                          <span style={{
                            fontFamily:MONO, fontSize:11, fontWeight:700,
                            color:errColor(r.pctError), background:errBg(r.pctError),
                            borderRadius:6, padding:"2px 8px",
                          }}>
                            {r.pctError.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ── Honest Assessment ────────────────────────────────────── */}
        <Card style={{ marginBottom:48, border:`1px solid ${BD2}` }}>
          <SLabel>Honest Assessment</SLabel>
          <p style={{ fontFamily:SYS, fontSize:15, color:T3, lineHeight:1.8, margin:0 }}>
            Construction forecasting is hard. Input revisions, policy shocks, and structural
            breaks create irreducible uncertainty. All accuracy figures on this page are computed
            live from the <code style={{ fontFamily:MONO, fontSize:13, color:T2,
              background:BG2, padding:"1px 5px", borderRadius:4 }}>/api/par</code> endpoint —
            never hardcoded. If our models underperform, this page says so.
          </p>
        </Card>

        {/* ── Back links ───────────────────────────────────────────── */}
        <div style={{ display:"flex", gap:24, justifyContent:"center", flexWrap:"wrap" }}>
          <Link href="/methodology" style={{ fontFamily:SYS, fontSize:14, color:T4,
                                             textDecoration:"underline" }}>
            ← Methodology
          </Link>
          <Link href="/dashboard" style={{ fontFamily:SYS, fontSize:14, color:T4,
                                           textDecoration:"underline" }}>
            Open Dashboard
          </Link>
          <Link href="/trust" style={{ fontFamily:SYS, fontSize:14, color:T4,
                                       textDecoration:"underline" }}>
            Trust Center
          </Link>
        </div>
      </div>
    </div>
  )
}
