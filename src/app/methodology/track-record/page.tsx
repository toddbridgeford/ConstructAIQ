"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
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
interface ForecastMeta {
  metrics:   { mape: number; accuracy: number; n: number }
  bestModel: string
  trainedOn: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtMonth(iso: string): string {
  try { return new Date(iso + "-01").toLocaleDateString("en-US", { month:"short", year:"numeric" }) }
  catch { return iso }
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

// ── Shared components ──────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label:string; value:string; sub?:string }) {
  return (
    <div style={{ flex:"1 1 180px", background:BG1, borderRadius:16,
                  border:`1px solid ${BD1}`, padding:"20px 24px" }}>
      <div style={{ fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.1em",
                    textTransform:"uppercase", marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:MONO, fontSize:26, fontWeight:700, color:T1,
                    letterSpacing:"-0.02em", lineHeight:1.1 }}>{value}</div>
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
function ChartTooltip({ active, payload, label }: any) {
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

// ── Main page ──────────────────────────────────────────────────────────────

export default function TrackRecordPage() {
  const [track,    setTrack]    = useState<TrackData | null>(null)
  const [meta,     setMeta]     = useState<ForecastMeta | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      async function safe(url: string) {
        try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
      }
      const [trackD, foreD] = await Promise.all([
        safe("/api/forecast/track-record"),
        safe("/api/forecast?series=TTLCONS"),
      ])
      if (trackD) setTrack(trackD)
      if (foreD)  setMeta(foreD)
      setLoading(false)
    }
    load()
  }, [])

  // Chart data: merge forecast + actual by month
  const chartData = (track?.records ?? []).map(r => ({
    month:    r.month,
    Forecast: r.forecast,
    Actual:   r.actual,
  }))

  const mape         = track?.avgMape ?? meta?.metrics?.mape ?? null
  const dirAcc       = track?.directionAcc
  const bestModel    = meta?.bestModel ?? "—"
  const nObs         = track?.n ?? meta?.trainedOn ?? null

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
            Every forecast we published vs. what actually happened.
            No competitor publishes this. We do.
          </p>
        </div>

        {/* ── KPI row ──────────────────────────────────────────────── */}
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:32 }}>
          {loading ? (
            [0,1,2,3].map(i => <Skeleton key={i} height={96} borderRadius={16}
                                          style={{ flex:"1 1 180px" }} />)
          ) : (
            <>
              <KpiCard
                label="12-Month MAPE"
                value={mape != null ? `${mape.toFixed(1)}%` : "—"}
                sub="Mean absolute percentage error"
              />
              <KpiCard
                label="Best Model (last 12mo)"
                value={bestModel.replace("holt-winters","Holt-Winters").replace("sarima","SARIMA").replace("xgboost","Custom GBT")}
                sub="Lowest recent MAPE"
              />
              <KpiCard
                label="Direction Accuracy"
                value={dirAcc != null ? `${dirAcc}%` : "—"}
                sub="Monthly direction calls correct"
              />
              <KpiCard
                label="Observations"
                value={nObs != null ? `${nObs}mo` : "—"}
                sub="Training data depth"
              />
            </>
          )}
        </div>

        {/* ── Forecast vs Actual Chart ──────────────────────────────── */}
        <Card style={{ marginBottom:24 }}>
          <SLabel>Forecast vs Actual · TTLCONS · 12-Month-Ahead Predictions</SLabel>
          <h2 style={{ fontFamily:SYS, fontSize:20, fontWeight:700, color:T1,
                       letterSpacing:"-0.02em", marginBottom:24 }}>
            What We Forecast vs. What Happened
          </h2>
          {loading ? (
            <Skeleton height={280} borderRadius={12} />
          ) : chartData.length > 0 ? (
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
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontFamily:MONO, fontSize:11, color:T4, paddingTop:12 }}
                />
                <Line dataKey="Forecast" stroke={AMBER} strokeWidth={2}
                      dot={{ fill:AMBER, r:3 }} activeDot={{ r:5 }} />
                <Line dataKey="Actual"   stroke={T1}   strokeWidth={2.5}
                      dot={{ fill:T1, r:3 }} activeDot={{ r:5 }} strokeDasharray="none" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding:"48px 0", textAlign:"center",
                          fontFamily:SYS, fontSize:14, color:T4 }}>
              Track record data unavailable
            </div>
          )}
          <div style={{ marginTop:16, fontFamily:SYS, fontSize:12, color:T4, lineHeight:1.6 }}>
            Amber line: what the model forecast 12 months prior.
            White line: Census C30 actuals. Dollar values in $B SAAR.
          </div>
        </Card>

        {/* ── Monthly accuracy table ────────────────────────────────── */}
        <Card style={{ marginBottom:24, padding:0, overflow:"hidden" }}>
          <div style={{ padding:"24px 28px 0" }}>
            <SLabel>Monthly Breakdown · Last 12 Months</SLabel>
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
                          color:errColor(r.pctError),
                          background:errBg(r.pctError),
                          borderRadius:6, padding:"2px 8px",
                        }}>
                          {r.pctError.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(track?.records ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding:"32px", textAlign:"center",
                                               fontFamily:SYS, fontSize:14, color:T4 }}>
                        No track record data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Honest Assessment ────────────────────────────────────── */}
        <Card style={{ marginBottom:48, border:`1px solid ${BD2}` }}>
          <SLabel>Honest Assessment</SLabel>
          <p style={{ fontFamily:SYS, fontSize:15, color:T3, lineHeight:1.8, margin:0 }}>
            Construction forecasting is hard. Input revisions, policy shocks, and structural
            breaks create irreducible uncertainty. We publish this record because accountability
            builds trust. If our model underperforms, we say so and explain why.
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
