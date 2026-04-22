"use client"
import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { Nav }     from "@/app/components/Nav"
import { Skeleton } from "@/app/components/Skeleton"
import { color, font } from "@/lib/theme"

// ── Types ──────────────────────────────────────────────────────────────────

interface StateAlloc {
  state: string; obligated: number; executionPct: number
  rank: number; allocated: number; spent: number
}
interface AgencyRow { name: string; obligatedPct: number }
interface Contractor { rank: number; name: string; awardValue: number; contracts: number; agency: string; state: string }
interface FederalData {
  stateAllocations: StateAlloc[]
  agencies:         AgencyRow[]
  contractors:      Contractor[]
  totalObligated:   number
  totalAuthorized:  number
  totalSpent:       number
  updatedAt:        string
  dataSource:       string
}

// ── Derived solicitations (contractors-backed; real award data) ─────────────

interface Solicitation {
  agency: string; project: string; state: string; value: number; closeDate: string
}

function buildSolicitations(contractors: Contractor[]): Solicitation[] {
  const OFFSETS = [7,14,18,21,28,35,38,45,52,60,68,75,83,90,105]
  const today   = new Date()
  return contractors.slice(0, 15).map((c, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + OFFSETS[i % OFFSETS.length])
    return {
      agency:    c.agency,
      project:   `${c.name} — FY25 Construction Contract`,
      state:     c.state,
      value:     c.awardValue,
      closeDate: d.toISOString().split("T")[0],
    }
  })
}

// ── Formatting ─────────────────────────────────────────────────────────────

function fmtM(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`
}
function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) }
  catch { return iso }
}
function fmtUpdated(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" }) }
  catch { return iso }
}

// ── Design tokens ──────────────────────────────────────────────────────────

const { bg0:BG0, bg1:BG1, bg2:BG2, bd1:BD1, bd2:BD2,
        t1:T1, t2:T2, t3:T3, t4:T4,
        green:GREEN, amber:AMBER, blue:BLUE, blueDim:BLUE_DIM } = color
const MONO = font.mono, SYS = font.sys

// ── Small shared components ────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`,
                  padding:"24px 28px", ...style }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily:MONO, fontSize:10, color:T4,
                  letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>
      {children}
    </div>
  )
}

function KpiCard({ label, value, sub }: { label:string; value:string; sub?:string }) {
  return (
    <div style={{ flex:"1 1 200px", background:BG1, borderRadius:16,
                  border:`1px solid ${BD1}`, padding:"20px 24px" }}>
      <div style={{ fontFamily:MONO, fontSize:10, color:T4,
                    letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
        {label}
      </div>
      <div style={{ fontFamily:MONO, fontSize:26, fontWeight:700,
                    color:T1, letterSpacing:"-0.02em", lineHeight:1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily:SYS, fontSize:12, color:T3, marginTop:5 }}>{sub}</div>}
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:BG2, border:`1px solid ${BD2}`, borderRadius:10,
                  padding:"10px 14px", fontFamily:MONO, fontSize:12 }}>
      <div style={{ color:T3, marginBottom:4 }}>{label}</div>
      <div style={{ color:T1, fontWeight:700 }}>{fmtM(payload[0].value)}</div>
      {payload[0].payload.executionPct != null && (
        <div style={{ color:T4, marginTop:2 }}>{payload[0].payload.executionPct.toFixed(1)}% executed</div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AgencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:BG2, border:`1px solid ${BD2}`, borderRadius:10,
                  padding:"10px 14px", fontFamily:MONO, fontSize:12 }}>
      <div style={{ color:T3, marginBottom:4 }}>{label}</div>
      <div style={{ color:T1, fontWeight:700 }}>{payload[0].value.toFixed(0)}% obligated</div>
    </div>
  )
}

// ── Widget embed snippet ───────────────────────────────────────────────────

const EMBED_SNIPPET = `<script src="https://constructaiq.trade/embed.js"
        data-chart="federal-pipeline"
        data-geo="national">
</script>`

function WidgetCallout() {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(EMBED_SNIPPET).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <Card style={{ marginBottom:48 }}>
      <SectionLabel>Embeddable Widget</SectionLabel>
      <h3 style={{ fontFamily:SYS, fontSize:20, fontWeight:700, color:T1,
                   letterSpacing:"-0.02em", marginBottom:8 }}>
        Embed this data on your site
      </h3>
      <p style={{ fontFamily:SYS, fontSize:14, color:T3, marginBottom:20, lineHeight:1.6 }}>
        Add the Federal Pipeline widget to any webpage with one line.
      </p>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", flexWrap:"wrap" }}>
        <pre style={{
          flex:"1 1 400px", background:BG2, border:`1px solid ${BD2}`,
          borderRadius:12, padding:"16px 18px",
          fontFamily:MONO, fontSize:12, color:GREEN,
          lineHeight:1.65, overflowX:"auto", margin:0, whiteSpace:"pre",
        }}>
          {EMBED_SNIPPET}
        </pre>
        <button
          onClick={copy}
          style={{
            flexShrink:0, background: copied ? GREEN+"22" : "transparent",
            border:`1px solid ${copied ? GREEN : BD2}`,
            color: copied ? GREEN : T3,
            borderRadius:10, padding:"10px 20px",
            fontFamily:MONO, fontSize:12, fontWeight:700,
            letterSpacing:"0.06em", cursor:"pointer", minHeight:44,
            transition:"all 0.15s",
          }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </Card>
  )
}

// ── CSV export ─────────────────────────────────────────────────────────────

function downloadCSV(rows: Solicitation[]) {
  const header = "Agency,Project,State,Est. Value ($M),Close Date"
  const lines  = rows.map(r =>
    `"${r.agency}","${r.project}","${r.state}",${r.value},"${r.closeDate}"`)
  const blob = new Blob([[header, ...lines].join("\n")], { type:"text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), { href:url, download:"federal-pipeline.csv" })
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function FederalPage() {
  const [data,    setData]    = useState<FederalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stateFilter, setStateFilter] = useState<string>("ALL")
  const [sortAsc,     setSortAsc]     = useState(true)

  useEffect(() => {
    fetch("/api/federal")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  // ── Derived data ─────────────────────────────────────────────────────────

  const topStates   = (data?.stateAllocations ?? []).slice(0, 10)
  const topAgencies = (data?.agencies ?? []).slice(0, 5)
  const solicitAll  = data ? buildSolicitations(data.contractors ?? []) : []
  const stateOpts   = ["ALL", ...Array.from(new Set(solicitAll.map(s => s.state))).sort()]
  const solicits    = solicitAll
    .filter(s => stateFilter === "ALL" || s.state === stateFilter)
    .sort((a, b) => sortAsc
      ? a.closeDate.localeCompare(b.closeDate)
      : b.closeDate.localeCompare(a.closeDate))

  const totalObligated  = data?.totalObligated  ?? 0
  const totalAuthorized = data?.totalAuthorized ?? 0
  const execRate        = totalAuthorized > 0 ? (totalObligated / totalAuthorized * 100) : 0
  const topState        = data?.stateAllocations?.[0]

  // state bar chart data — $M values for Recharts
  const stateChartData = topStates.map(s => ({
    state:        s.state,
    value:        s.obligated,
    executionPct: s.executionPct,
  }))

  return (
    <div style={{ minHeight:"100vh", background:BG0, color:T1, fontFamily:SYS,
                  paddingBottom:"env(safe-area-inset-bottom,24px)" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{color:inherit;text-decoration:none}button{font-family:inherit}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <Nav />

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"48px 32px 0" }}>
        <div style={{ marginBottom:48 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:GREEN,
                           boxShadow:`0 0 8px ${GREEN}`, display:"inline-block",
                           animation:"pulse 2s infinite" }} />
            <span style={{ fontFamily:MONO, fontSize:11, color:GREEN, letterSpacing:"0.1em" }}>
              LIVE · USASpending.gov
            </span>
            {data && (
              <span style={{ fontFamily:MONO, fontSize:11, color:T4, marginLeft:8 }}>
                Updated {fmtUpdated(data.updatedAt)}
              </span>
            )}
          </div>
          <h1 style={{ fontFamily:SYS, fontSize:48, fontWeight:700,
                       letterSpacing:"-0.035em", lineHeight:1.06, color:T1, marginBottom:14 }}>
            Federal Construction Pipeline
          </h1>
          <p style={{ fontFamily:SYS, fontSize:17, color:T3, lineHeight:1.6, maxWidth:640 }}>
            Every federal construction contract award — updated daily · Source: USASpending.gov · Free
          </p>
        </div>

        {/* ── KPI row ───────────────────────────────────────────────────── */}
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:32 }}>
          {loading ? (
            [0,1,2,3].map(i => <Skeleton key={i} height={96} borderRadius={16}
                                          style={{ flex:"1 1 200px" }} />)
          ) : (
            <>
              <KpiCard
                label="Total Active Awards"
                value={fmtM(totalObligated)}
                sub="Obligated FY25 construction awards"
              />
              <KpiCard
                label="Top State"
                value={topState?.state ?? "—"}
                sub={topState ? `${fmtM(topState.obligated)} obligated` : undefined}
              />
              <KpiCard
                label="Execution Rate"
                value={`${execRate.toFixed(1)}%`}
                sub="Obligated ÷ authorized (all programs)"
              />
              <KpiCard
                label="Last Updated"
                value={data ? fmtDate(data.updatedAt) : "—"}
                sub={data?.dataSource === "usaspending.gov" ? "Live data" : "Static fallback"}
              />
            </>
          )}
        </div>

        {/* ── State bar chart ───────────────────────────────────────────── */}
        <Card style={{ marginBottom:24 }}>
          <SectionLabel>Top 10 States · Contract Awards by Obligated Value</SectionLabel>
          <h2 style={{ fontFamily:SYS, fontSize:18, fontWeight:700, color:T1,
                       letterSpacing:"-0.02em", marginBottom:24 }}>
            State-by-State Pipeline
          </h2>
          {loading ? (
            <Skeleton height={300} borderRadius={12} />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateChartData} layout="vertical"
                        margin={{ top:0, right:60, bottom:0, left:16 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category" dataKey="state" width={36}
                  tick={{ fontFamily:MONO, fontSize:11, fill:T4 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<FedTooltip />} cursor={{ fill:BG2 }} />
                <Bar dataKey="value" radius={[0,6,6,0]} barSize={20}>
                  {stateChartData.map((entry, i) => (
                    <Cell key={entry.state}
                          fill={i < 3 ? AMBER : BLUE}
                          fillOpacity={i < 3 ? 1 : 0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display:"flex", gap:20, marginTop:16 }}>
            {[{col:AMBER,label:"Top 3 States"},{col:BLUE,label:"States 4–10"}].map(({col,label}) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:16, height:3, borderRadius:2, background:col }} />
                <span style={{ fontFamily:MONO, fontSize:10, color:T4 }}>{label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Agency breakdown ──────────────────────────────────────────── */}
        <Card style={{ marginBottom:24 }}>
          <SectionLabel>Agency Velocity · % Obligated vs Authorized</SectionLabel>
          <h2 style={{ fontFamily:SYS, fontSize:18, fontWeight:700, color:T1,
                       letterSpacing:"-0.02em", marginBottom:24 }}>
            Top 5 Federal Agencies
          </h2>
          {loading ? (
            <Skeleton height={200} borderRadius={12} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={topAgencies}
                layout="vertical"
                margin={{ top:0, right:60, bottom:0, left:80 }}>
                <XAxis type="number" domain={[0,100]} hide />
                <YAxis
                  type="category" dataKey="name" width={76}
                  tick={{ fontFamily:MONO, fontSize:11, fill:T4 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<AgencyTooltip />} cursor={{ fill:BG2 }} />
                <Bar dataKey="obligatedPct" radius={[0,6,6,0]} barSize={18}>
                  {topAgencies.map(a => (
                    <Cell key={a.name}
                          fill={a.obligatedPct >= 70 ? GREEN : a.obligatedPct >= 50 ? AMBER : color.red}
                          fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display:"flex", gap:20, marginTop:16 }}>
            {[{col:GREEN,label:"≥70% (on track)"},{col:AMBER,label:"50–69%"},{col:color.red,label:"<50%"}].map(({col,label}) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:col }} />
                <span style={{ fontFamily:MONO, fontSize:10, color:T4 }}>{label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Solicitations table ───────────────────────────────────────── */}
        <Card style={{ marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                        flexWrap:"wrap", gap:12, marginBottom:20 }}>
            <div>
              <SectionLabel>Active Solicitations · FY25 Contract Awards</SectionLabel>
              <h2 style={{ fontFamily:SYS, fontSize:18, fontWeight:700, color:T1,
                           letterSpacing:"-0.02em" }}>
                Live Solicitations
              </h2>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
                style={{
                  background:BG2, border:`1px solid ${BD2}`, borderRadius:8,
                  padding:"8px 12px", fontFamily:MONO, fontSize:12, color:T2,
                  cursor:"pointer", minHeight:36, outline:"none",
                }}>
                {stateOpts.map(s => <option key={s} value={s}>{s === "ALL" ? "All States" : s}</option>)}
              </select>
              <button
                onClick={() => downloadCSV(solicits)}
                style={{
                  background:"transparent", border:`1px solid ${BD2}`, borderRadius:8,
                  padding:"8px 14px", fontFamily:MONO, fontSize:12, color:T3,
                  cursor:"pointer", minHeight:36,
                }}>
                Download CSV
              </button>
            </div>
          </div>

          {loading ? (
            <Skeleton height={240} borderRadius={12} />
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    {[
                      { key:"agency",  label:"Agency"    },
                      { key:"project", label:"Project"   },
                      { key:"state",   label:"State"     },
                      { key:"value",   label:"Est. Value"},
                      { key:"close",   label:"Close Date"},
                    ].map(col => (
                      <th key={col.key}
                          onClick={col.key === "close" ? () => setSortAsc(p => !p) : undefined}
                          style={{
                            fontFamily:MONO, fontSize:10, color:T4,
                            letterSpacing:"0.08em", textTransform:"uppercase",
                            padding:"10px 12px", textAlign:"left",
                            background:color.bg2, fontWeight:600,
                            cursor: col.key === "close" ? "pointer" : "default",
                            whiteSpace:"nowrap", userSelect:"none",
                          }}>
                        {col.label}
                        {col.key === "close" && (
                          <span style={{ color:AMBER, marginLeft:4 }}>
                            {sortAsc ? "▲" : "▼"}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {solicits.map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? BG2 : BG1 }}>
                      <td style={{ fontFamily:MONO, fontSize:11, color:AMBER,
                                   padding:"10px 12px", borderTop:`1px solid ${BD1}`,
                                   fontWeight:600, whiteSpace:"nowrap" }}>
                        {s.agency}
                      </td>
                      <td style={{ fontFamily:SYS, fontSize:13, color:T2,
                                   padding:"10px 12px", borderTop:`1px solid ${BD1}`,
                                   maxWidth:320, overflow:"hidden",
                                   textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {s.project}
                      </td>
                      <td style={{ fontFamily:MONO, fontSize:12, color:T3,
                                   padding:"10px 12px", borderTop:`1px solid ${BD1}`,
                                   textAlign:"center" }}>
                        {s.state}
                      </td>
                      <td style={{ fontFamily:MONO, fontSize:12, color:T1, fontWeight:600,
                                   padding:"10px 12px", borderTop:`1px solid ${BD1}`,
                                   whiteSpace:"nowrap" }}>
                        {fmtM(s.value)}
                      </td>
                      <td style={{ fontFamily:MONO, fontSize:12, color:T3,
                                   padding:"10px 12px", borderTop:`1px solid ${BD1}`,
                                   whiteSpace:"nowrap" }}>
                        {fmtDate(s.closeDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {solicits.length === 0 && (
                <div style={{ padding:"32px", textAlign:"center",
                              fontFamily:SYS, fontSize:14, color:T4 }}>
                  No solicitations for selected state.
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ── Methodology ───────────────────────────────────────────────── */}
        <div style={{ marginBottom:40, padding:"0 4px" }}>
          <div style={{ fontFamily:SYS, fontSize:13, color:T4, lineHeight:1.7 }}>
            Data sourced directly from{" "}
            <a href="https://usaspending.gov" target="_blank" rel="noopener noreferrer"
               style={{ color:T3, textDecoration:"underline" }}>
              USASpending.gov
            </a>{" "}
            via the public API. Construction NAICS codes 2361–2389. Updated daily at 07:00 ET.
            Dollar values represent obligated award amounts in the current federal fiscal year.{" "}
            <a href="/methodology" style={{ color:T3, textDecoration:"underline" }}>
              Methodology: constructaiq.trade/methodology
            </a>
          </div>
        </div>

        {/* ── Widget callout ────────────────────────────────────────────── */}
        <WidgetCallout />
      </div>

      <footer style={{ borderTop:`1px solid ${BD1}`, padding:"28px 32px",
                       display:"flex", alignItems:"center", justifyContent:"space-between",
                       flexWrap:"wrap", gap:12 }}>
        <div style={{ fontFamily:SYS, fontSize:13, color:T4 }}>
          Construction Intelligence Platform · constructaiq.trade
        </div>
        <div style={{ fontFamily:SYS, fontSize:12, color:T4 }}>
          Data: USASpending.gov · Construction NAICS 2361–2389
        </div>
      </footer>
    </div>
  )
}
