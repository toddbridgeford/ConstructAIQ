"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { BottomSheet } from "@/app/components/BottomSheet"
import { ForecastChart } from "./ForecastChart"
import { Skeleton } from "@/app/components/Skeleton"
import { color, font, radius } from "@/lib/theme"
import type { ForecastData } from "../types"

const SYS  = font.sys
const MONO = font.mono

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

interface MobileDashboardProps {
  fore:          AnyData
  brief:         AnyData
  signals:       AnyData
  federal:       AnyData
  satellite:     AnyData
  prices:        AnyData
  briefHeadline: string | null
  spendVal:      number
  spendMom:      number
  empVal:        number
  empMom:        number
}

function fmtMom(v: number): string {
  return `${v > 0 ? "+" : ""}${Number(v).toFixed(1)}%`
}

function fmtVal(v: number | null): string {
  if (v == null) return "—"
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toLocaleString()}`
}

function fmtDate(d: string | null): string {
  if (!d) return "—"
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }
  catch { return d }
}

function signalColor(type: string): string {
  switch ((type ?? "").toUpperCase()) {
    case "BULLISH": case "BUY":  return color.green
    case "BEARISH": case "SELL": return color.red
    case "WARNING":              return color.amber
    default:                     return color.blue
  }
}

function statusColor(s: string | null): string {
  switch ((s ?? "").toLowerCase()) {
    case "active":  return color.green
    case "applied": return color.amber
    default:        return color.t4
  }
}

function bsiColor(v: number): string {
  if (v > 25)  return color.green
  if (v > 10)  return color.amber
  if (v < -10) return color.red
  return color.t3
}

interface MiniProject {
  id:             number
  project_name:   string | null
  city:           string | null
  state_code:     string | null
  valuation:      number | null
  status:         string | null
}

export function MobileDashboard({
  fore, brief, signals, federal, satellite,
  prices, briefHeadline,
  spendVal, spendMom, empVal, empMom,
}: MobileDashboardProps) {
  const [briefOpen,   setBriefOpen]   = useState(false)
  const [projects,    setProjects]    = useState<MiniProject[]>([])

  useEffect(() => {
    fetch("/api/projects?limit=5&sort=valuation&min_value=1000000")
      .then(r => r.json())
      .then(d => setProjects(d.projects ?? []))
      .catch(() => {})
  }, [])

  const sigList   = signals?.signals ?? []
  const topSignal = sigList[0] ?? null

  const satMsas   = (satellite?.msas ?? [])
    .slice(0, 3) as AnyData[]

  const federalTotal = federal?.totalObligated ?? 0

  const kpis = [
    { label: "Construction Spend", value: `$${(spendVal / 1000).toFixed(1)}T`, mom: spendMom, color: color.amber },
    { label: "Construction Jobs",  value: `${(empVal / 1000).toFixed(1)}M`,    mom: empMom,   color: color.green },
    { label: "Permits (yr)",        value: "1,482K",    mom: 2.8,  color: color.blue },
    { label: "Permit Value",        value: "$48.2B",    mom: 3.1,  color: color.blue },
    { label: "Materials Index",     value: "318.4",     mom: 1.2,  color: color.red  },
    { label: "AI Signals",          value: String(sigList.length || 6), mom: 0, color: color.t2 },
  ]

  return (
    <div style={{ padding: "0 16px 16px" }}>

      {/* Brief headline card */}
      {briefHeadline && (
        <div
          onClick={() => setBriefOpen(true)}
          style={{
            background:   color.bg1,
            border:       `1px solid ${color.bd1}`,
            borderRadius: radius.lg,
            padding:      "14px 16px",
            marginBottom: 16,
            cursor:       "pointer",
            display:      "flex",
            gap:          12,
            alignItems:   "flex-start",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 9, color: color.amber, letterSpacing: "0.1em", paddingTop: 2, flexShrink: 0 }}>
            BRIEF
          </div>
          <div style={{
            fontFamily: SYS, fontSize: 14, color: color.t1, lineHeight: 1.6,
            display:    "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow:   "hidden",
          }}>
            {briefHeadline}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, flexShrink: 0, paddingTop: 3 }}>›</div>
        </div>
      )}

      {/* Brief full — BottomSheet */}
      <BottomSheet open={briefOpen} onClose={() => setBriefOpen(false)} title="Weekly Intelligence Brief">
        <div style={{ padding: "0 4px 16px", fontFamily: SYS, fontSize: 14, color: color.t2, lineHeight: 1.7 }}>
          {typeof brief?.brief === "string" ? brief.brief : briefHeadline}
        </div>
      </BottomSheet>

      {/* KPI 2×3 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{
            background:   color.bg1,
            border:       `1px solid ${color.bd1}`,
            borderRadius: radius.md,
            padding:      "12px 14px",
            minHeight:    80,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.08em", marginBottom: 6 }}>
              {kpi.label.toUpperCase()}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: kpi.color, lineHeight: 1.1, marginBottom: 4 }}>
              {kpi.value}
            </div>
            {kpi.mom !== 0 && (
              <div style={{ fontFamily: MONO, fontSize: 10, color: kpi.mom > 0 ? color.green : color.red }}>
                {fmtMom(kpi.mom)} MoM
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Forecast chart */}
      <div style={{
        background:   color.bg1,
        border:       `1px solid ${color.bd1}`,
        borderRadius: radius.lg,
        padding:      "16px 12px",
        marginBottom: 16,
      }}>
        <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.1em", marginBottom: 10 }}>
          12-MONTH ENSEMBLE FORECAST
        </div>
        {fore ? (
          <ForecastChart foreData={fore as ForecastData} />
        ) : (
          <Skeleton height={300} borderRadius={8} />
        )}
      </div>

      {/* Top signal */}
      {topSignal && (
        <div style={{
          background:   color.bg1,
          border:       `1px solid ${color.bd1}`,
          borderRadius: radius.lg,
          padding:      "14px 16px",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.1em" }}>
              TOP SIGNAL
            </div>
            <span style={{
              fontFamily:   MONO, fontSize: 9, fontWeight: 700,
              letterSpacing:"0.08em",
              color:        signalColor(topSignal.type),
              background:   signalColor(topSignal.type) + "22",
              border:       `1px solid ${signalColor(topSignal.type)}44`,
              borderRadius: radius.sm, padding: "2px 8px",
            }}>
              {topSignal.type}
            </span>
          </div>
          <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: color.t1, marginBottom: 4 }}>
            {topSignal.title}
          </div>
          {topSignal.description && (
            <div style={{ fontFamily: SYS, fontSize: 12, color: color.t3, lineHeight: 1.55 }}>
              {String(topSignal.description).slice(0, 120)}{String(topSignal.description).length > 120 ? "…" : ""}
            </div>
          )}
          <Link href="/dashboard#signals" style={{ fontFamily: MONO, fontSize: 10, color: color.blue, display: "block", marginTop: 8 }}>
            See all signals →
          </Link>
        </div>
      )}

      {/* Federal quick stats */}
      <div style={{
        background:   color.bg1,
        border:       `1px solid ${color.bd1}`,
        borderRadius: radius.lg,
        padding:      "14px 16px",
        marginBottom: 16,
      }}>
        <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.1em", marginBottom: 12 }}>
          FEDERAL INFRASTRUCTURE
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: color.blue }}>
              {federalTotal > 0 ? `$${(federalTotal / 1000).toFixed(0)}B` : "—"}
            </div>
            <div style={{ fontFamily: SYS, fontSize: 11, color: color.t4 }}>Obligated</div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: color.amber }}>
              {federal?.stateAllocations?.[0]?.state ?? "TX"}
            </div>
            <div style={{ fontFamily: SYS, fontSize: 11, color: color.t4 }}>Top State</div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: color.green }}>+12%</div>
            <div style={{ fontFamily: SYS, fontSize: 11, color: color.t4 }}>YoY</div>
          </div>
        </div>
        <Link href="/federal" style={{ fontFamily: MONO, fontSize: 10, color: color.blue, display: "block", marginTop: 10 }}>
          View Federal Pipeline →
        </Link>
      </div>

      {/* Recent projects */}
      <div style={{
        background:   color.bg1,
        border:       `1px solid ${color.bd1}`,
        borderRadius: radius.lg,
        overflow:     "hidden",
        marginBottom: 16,
      }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${color.bd1}` }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.1em" }}>
            RECENT PROJECTS
          </div>
        </div>
        {projects.length === 0 ? (
          <div style={{ padding: "12px 16px" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={40} borderRadius={6} style={{ marginBottom: 8 }} />
            ))}
          </div>
        ) : (
          projects.map((p, i) => (
            <Link key={p.id} href={`/projects/${p.id}`} style={{ display: "block", textDecoration: "none" }}>
              <div style={{
                display:      "flex",
                alignItems:   "center",
                justifyContent: "space-between",
                padding:      "10px 16px",
                borderBottom: i < projects.length - 1 ? `1px solid ${color.bd1}` : "none",
                gap:          12,
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontFamily:    SYS, fontSize: 13, fontWeight: 600, color: color.t1,
                    whiteSpace:    "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {p.project_name ?? "Project"}
                  </div>
                  <div style={{ fontFamily: SYS, fontSize: 11, color: color.t4 }}>
                    {p.city}{p.state_code ? `, ${p.state_code}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: color.amber }}>
                    {fmtVal(p.valuation)}
                  </div>
                  <span style={{
                    fontFamily:   MONO, fontSize: 9, fontWeight: 600,
                    color:        statusColor(p.status),
                    background:   statusColor(p.status) + "22",
                    border:       `1px solid ${statusColor(p.status)}44`,
                    borderRadius: radius.sm, padding: "1px 6px",
                  }}>
                    {(p.status ?? "?").toUpperCase()}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${color.bd1}` }}>
          <Link href="/projects" style={{ fontFamily: MONO, fontSize: 10, color: color.blue }}>
            View all projects →
          </Link>
        </div>
      </div>

      {/* Satellite top 3 */}
      {satMsas.length > 0 && (
        <div style={{
          background:   color.bg1,
          border:       `1px solid ${color.bd1}`,
          borderRadius: radius.lg,
          padding:      "14px 16px",
          marginBottom: 16,
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.1em", marginBottom: 12 }}>
            SATELLITE GROUND ACTIVITY
          </div>
          {satMsas.map((msa: AnyData) => (
            <div key={msa.msa_code} style={{
              display:      "flex",
              alignItems:   "center",
              justifyContent: "space-between",
              paddingBottom: 10,
              marginBottom: 10,
              borderBottom: `1px solid ${color.bd1}`,
            }}>
              <div style={{ fontFamily: SYS, fontSize: 13, color: color.t2 }}>
                {msa.msa_name?.split("–")[0]?.split("-")[0]?.trim() ?? msa.msa_code}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontFamily: MONO, fontSize: 12, fontWeight: 700,
                  color: bsiColor(msa.bsi_change_90d ?? 0),
                }}>
                  {msa.bsi_change_90d > 0 ? "+" : ""}{Number(msa.bsi_change_90d ?? 0).toFixed(1)}%
                </span>
                <span style={{
                  fontFamily:   MONO, fontSize: 9,
                  color:        color.t4,
                  background:   color.bg2,
                  borderRadius: radius.sm, padding: "2px 6px",
                }}>
                  {(msa.classification ?? "").replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))}
          <Link href="/ground-signal" style={{ fontFamily: MONO, fontSize: 10, color: color.blue }}>
            Ground Signal Map →
          </Link>
        </div>
      )}

      {/* Materials quick prices */}
      {(prices?.commodities?.length ?? 0) > 0 && (
        <div style={{
          background:   color.bg1,
          border:       `1px solid ${color.bd1}`,
          borderRadius: radius.lg,
          padding:      "14px 16px",
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.1em", marginBottom: 12 }}>
            MATERIALS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(prices.commodities as AnyData[]).slice(0, 4).map((c: AnyData) => (
              <div key={c.name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ fontFamily: SYS, fontSize: 13, color: color.t2 }}>{c.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: color.amber }}>
                    {c.value != null ? `$${Number(c.value).toFixed(0)}` : "—"}
                  </span>
                  <span style={{
                    fontFamily:   MONO, fontSize: 9, fontWeight: 700,
                    color:        c.signal === "BUY" ? color.green : c.signal === "SELL" ? color.red : color.amber,
                    background:  (c.signal === "BUY" ? color.green : c.signal === "SELL" ? color.red : color.amber) + "22",
                    border:      `1px solid ${(c.signal === "BUY" ? color.green : c.signal === "SELL" ? color.red : color.amber)}44`,
                    borderRadius: radius.sm, padding: "2px 6px",
                  }}>
                    {c.signal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
