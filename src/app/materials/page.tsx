"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import { color, font } from "@/lib/theme"

// ── Light-mode palette ────────────────────────────────────────────────────────
const BG   = "#ffffff"
const BGS  = "#f8f9fa"
const T1   = "#111827"
const T2   = "#374151"
const T3   = "#6b7280"
const BD   = "#e5e7eb"
const SYS  = font.sys
const MONO = font.mono

// ── Commodity definitions ─────────────────────────────────────────────────────

interface CommodityDef {
  id:        string   // pricewatch / obs series ID
  label:     string   // display name on page
  obsId:     string   // series ID for /api/obs
  baseLabel: string   // short name for export
}

const COMMODITIES: CommodityDef[] = [
  { id: "WPU0811",   label: "Lumber & Wood",            obsId: "WPU0811",   baseLabel: "Lumber"    },
  { id: "WPU101",    label: "Steel Mill Products",       obsId: "WPU101",    baseLabel: "Steel"     },
  { id: "WPU132",    label: "Ready-Mix Concrete",        obsId: "WPU132",    baseLabel: "Concrete"  },
  { id: "WPU1021",   label: "Copper Wire & Products",    obsId: "WPU1021",   baseLabel: "Copper"    },
  { id: "WPU0561",   label: "Diesel Fuel",               obsId: "WPU0561",   baseLabel: "Diesel"    },
  { id: "LABOR",     label: "Construction Wages",        obsId: "CES2000000003", baseLabel: "Wages" },
]

// ── Composite weights (cost-benchmark commercial office, material-only) ────────
const COMPOSITE_WEIGHTS = { lumber: 0.083, steel: 0.333, concrete: 0.333, copper: 0.167, diesel: 0.083 }
const BASE_2020         = { lumber: 310.0, steel: 278.0, concrete: 242.0, copper: 289.0, diesel: 200.0 }

// ── Seed fallbacks ────────────────────────────────────────────────────────────
const SEED_CURRENT: Record<string, number> = {
  WPU0811: 421.8, WPU101: 318.4, WPU132: 284.6, WPU1021: 342.1, WPU0561: 218.4, LABOR: 122.4,
}
const SEED_PREV: Record<string, number> = {
  WPU0811: 438.2, WPU101: 309.6, WPU132: 281.2, WPU1021: 328.4, WPU0561: 224.8, LABOR: 120.2,
}
const SEED_YOY: Record<string, number> = {
  WPU0811: -15.2, WPU101: 8.4, WPU132: 4.8, WPU1021: 18.2, WPU0561: -6.2, LABOR: 4.1,
}

// ── Impact table (static per spec) ────────────────────────────────────────────
const IMPACT_ROWS = [
  { type: "Commercial",  pct: 42, amount: 420_000 },
  { type: "Residential", pct: 31, amount: 310_000 },
  { type: "Industrial",  pct: 48, amount: 480_000 },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function pctColor(v: number): string {
  if (v >  0.3) return "#dc2626"
  if (v < -0.3) return "#16a34a"
  return T3
}

function signalLabel(mom: number): "RISING" | "STABLE" | "FALLING" {
  if (mom >  0.5) return "RISING"
  if (mom < -0.5) return "FALLING"
  return "STABLE"
}

function signalStyle(s: "RISING" | "STABLE" | "FALLING"): React.CSSProperties {
  const bg  = s === "RISING"  ? "#fef2f2" : s === "FALLING" ? "#f0fdf4" : "#f9fafb"
  const clr = s === "RISING"  ? "#dc2626" : s === "FALLING" ? "#16a34a" : T3
  return { background: bg, color: clr, border: `1px solid ${clr}22` }
}

function borderColor(mom: number): string {
  if (mom >  0.5) return "#dc2626"
  if (mom < -0.5) return "#16a34a"
  return "#d1d5db"
}

function fmt(n: number, decimals = 1): string {
  const s = n >= 0 ? "+" : ""
  return `${s}${n.toFixed(decimals)}`
}

function fmtDollar(n: number): string {
  return `$${(n / 1000).toFixed(0)}K`
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────

function Sparkline({ data, trend }: { data: number[]; trend: number }) {
  if (data.length < 2) {
    return <div style={{ height: 32, width: 120, background: "#f3f4f6", borderRadius: 4 }} />
  }
  const W = 120, H = 32
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts   = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - 4 - ((v - min) / range) * (H - 8)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  const lineColor = trend > 0.5 ? "#dc2626" : trend < -0.5 ? "#16a34a" : "#9ca3af"
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <polyline fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinejoin="round" points={pts} />
    </svg>
  )
}

// ── Commodity Card ─────────────────────────────────────────────────────────────

interface CardData {
  id:       string
  label:    string
  value:    number
  mom:      number
  yoy:      number
  spark:    number[]
}

function CommodityCard({ d }: { d: CardData }) {
  const sig    = signalLabel(d.mom)
  const lblClr = borderColor(d.mom)
  return (
    <div style={{
      background:   BG,
      border:       `1px solid ${BD}`,
      borderLeft:   `3px solid ${lblClr}`,
      borderRadius: 10,
      padding:      "20px 20px 16px",
      boxShadow:    "0 1px 3px rgba(0,0,0,0.08)",
      display:      "flex",
      flexDirection:"column",
      gap:          10,
    }}>
      <div style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: T2 }}>
        {d.label}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: T1, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {d.value.toFixed(1)}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* MoM */}
        <span style={{
          fontFamily:   MONO,
          fontSize:     11,
          fontWeight:   600,
          color:        pctColor(d.mom),
          background:   pctColor(d.mom) === "#dc2626" ? "#fef2f2" : pctColor(d.mom) === "#16a34a" ? "#f0fdf4" : "#f9fafb",
          padding:      "2px 8px",
          borderRadius: 4,
          border:       `1px solid ${pctColor(d.mom)}22`,
        }}>
          {fmt(d.mom)}% MoM
        </span>

        {/* YoY */}
        <span style={{
          fontFamily:   MONO,
          fontSize:     11,
          fontWeight:   600,
          color:        pctColor(d.yoy),
          background:   pctColor(d.yoy) === "#dc2626" ? "#fef2f2" : pctColor(d.yoy) === "#16a34a" ? "#f0fdf4" : "#f9fafb",
          padding:      "2px 8px",
          borderRadius: 4,
          border:       `1px solid ${pctColor(d.yoy)}22`,
        }}>
          {fmt(d.yoy)}% YoY
        </span>
      </div>

      <Sparkline data={d.spark} trend={d.mom} />

      <span style={{
        alignSelf:    "flex-start",
        fontFamily:   MONO,
        fontSize:     10,
        fontWeight:   700,
        letterSpacing:"0.08em",
        padding:      "3px 8px",
        borderRadius: 4,
        ...signalStyle(sig),
      }}>
        {sig}
      </span>
    </div>
  )
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background:   BG,
      border:       `1px solid ${BD}`,
      borderRadius: 8,
      padding:      "8px 12px",
      fontFamily:   MONO,
      fontSize:     12,
      color:        T1,
      boxShadow:    "0 2px 8px rgba(0,0,0,0.12)",
    }}>
      <div style={{ color: T3, marginBottom: 4 }}>{label}</div>
      <div><strong>{payload[0].value.toFixed(1)}</strong></div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MaterialsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pricewatch, setPricewatch] = useState<any>(null)
  const [obsHistory, setObsHistory] = useState<Record<string, { date: string; value: number }[]>>({})
  const [loading,    setLoading]    = useState(true)
  const [copied,     setCopied]     = useState(false)
  const [updatedAt,  setUpdatedAt]  = useState("")

  useEffect(() => {
    const obsIds = COMMODITIES.map(c => c.obsId)
    Promise.all([
      fetch("/api/pricewatch").then(r => r.ok ? r.json() : null),
      ...obsIds.map(id =>
        fetch(`/api/obs?series=${id}&n=24`)
          .then(r => r.ok ? r.json() : null)
          .then(d => ({ id, obs: d?.obs ?? [] }))
      ),
    ]).then(([pw, ...obsResults]) => {
      if (pw) setPricewatch(pw)
      const map: Record<string, { date: string; value: number }[]> = {}
      for (const r of obsResults as { id: string; obs: { date: string; value: number }[] }[]) {
        map[r.id] = r.obs
      }
      setObsHistory(map)
      setLoading(false)
    })
    setUpdatedAt(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))
  }, [])

  // ── Resolve per-commodity data ──────────────────────────────────────────────
  const cards: CardData[] = COMMODITIES.map(c => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const live = pricewatch?.commodities?.find((x: any) => x.id === c.id)
    const history = c.id === "LABOR"
      ? obsHistory[c.obsId] ?? []
      : obsHistory[c.obsId] ?? []

    const value = live?.value  ?? SEED_CURRENT[c.id]
    const prev  = live?.prevValue ?? SEED_PREV[c.id]
    const mom   = live?.mom ?? (prev > 0 ? ((value - prev) / prev) * 100 : 0)
    const yoy   = live?.yoy ?? SEED_YOY[c.id]
    const spark = history.length >= 4
      ? history.slice(-12).map(o => o.value)
      : Array.from({ length: 12 }, (_, i) => value * (1 + (i - 11) * mom / 1200))

    return { id: c.id, label: c.label, value, mom, yoy, spark }
  })

  // ── Composite index history ─────────────────────────────────────────────────
  const compositeHistory: { date: string; value: number }[] = (() => {
    const lumberObs = obsHistory["WPU0811"] ?? []
    if (lumberObs.length < 4) {
      // Seed composite at roughly 117.5 with gentle upward trend
      return Array.from({ length: 24 }, (_, i) => ({
        date:  `${i < 12 ? "2024" : "2025"}-${String((i % 12) + 1).padStart(2, "0")}`,
        value: +(115 + i * 0.15 + Math.sin(i * 0.5) * 0.8).toFixed(1),
      }))
    }
    return lumberObs.map(obs => {
      const d = obs.date
      const get = (key: string, obsId: string) => {
        const match = (obsHistory[obsId] ?? []).find(o => o.date === d)
        return match?.value ?? SEED_CURRENT[key]
      }
      const vals = {
        lumber:   get("WPU0811", "WPU0811"),
        steel:    get("WPU101",  "WPU101"),
        concrete: get("WPU132",  "WPU132"),
        copper:   get("WPU1021", "WPU1021"),
        diesel:   get("WPU0561", "WPU0561"),
      }
      const idx = (
        COMPOSITE_WEIGHTS.lumber   * (vals.lumber   / BASE_2020.lumber)   +
        COMPOSITE_WEIGHTS.steel    * (vals.steel    / BASE_2020.steel)    +
        COMPOSITE_WEIGHTS.concrete * (vals.concrete / BASE_2020.concrete) +
        COMPOSITE_WEIGHTS.copper   * (vals.copper   / BASE_2020.copper)   +
        COMPOSITE_WEIGHTS.diesel   * (vals.diesel   / BASE_2020.diesel)
      ) * 100
      return { date: d.slice(0, 7), value: +idx.toFixed(1) }
    })
  })()

  const currentComposite = compositeHistory.length > 0
    ? compositeHistory[compositeHistory.length - 1].value
    : 117.5

  const avgComposite = compositeHistory.length > 0
    ? compositeHistory.reduce((s, d) => s + d.value, 0) / compositeHistory.length
    : 115.0

  const vsAvgPct = ((currentComposite - avgComposite) / avgComposite) * 100
  const vsAvgDir = vsAvgPct > 0 ? "above" : "below"

  // ── Copy snapshot ───────────────────────────────────────────────────────────
  const copySnapshot = useCallback(() => {
    const lines = [
      `Construction Material Costs — ${updatedAt}`,
      `Composite Index: ${currentComposite.toFixed(1)}`,
      "",
      ...cards.map(c => `${c.label}: ${c.value.toFixed(1)} (${fmt(c.mom)}% MoM, ${fmt(c.yoy)}% YoY)`),
      "",
      "Source: BLS PPI via constructaiq.trade",
    ]
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [cards, updatedAt, currentComposite])

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const allDates = Array.from(new Set(
      Object.values(obsHistory).flat().map(o => o.date)
    )).sort()

    const header = ["date", ...COMMODITIES.map(c => c.baseLabel)].join(",")
    const rows = allDates.map(d => {
      const vals = COMMODITIES.map(c => {
        const obs = obsHistory[c.obsId] ?? []
        const match = obs.find(o => o.date === d)
        return match?.value?.toFixed(1) ?? ""
      })
      return [d, ...vals].join(",")
    })

    const csv  = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `constructaiq-material-costs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [obsHistory])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: BGS, minHeight: "100vh", fontFamily: SYS }}>
      {/* Light nav */}
      <nav style={{
        background:   BG,
        borderBottom: `1px solid ${BD}`,
        padding:      "0 28px",
        height:       60,
        display:      "flex",
        alignItems:   "center",
        justifyContent:"space-between",
        position:     "sticky",
        top:          0,
        zIndex:       100,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <Image src="/ConstructAIQBlackLogo.svg" alt="ConstructAIQ"
                 width={120} height={20} style={{ height: 18, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/dashboard" style={{ fontFamily: SYS, fontSize: 13, color: T3, textDecoration: "none" }}>
            Dashboard
          </Link>
          <Link href="/methodology" style={{ fontFamily: SYS, fontSize: 13, color: T3, textDecoration: "none" }}>
            Methodology
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Page header */}
        <div style={{
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          flexWrap:       "wrap",
          gap:            16,
          marginBottom:   36,
        }}>
          <div>
            <h1 style={{
              fontFamily:    SYS,
              fontSize:      "clamp(24px, 4vw, 32px)",
              fontWeight:    700,
              letterSpacing: "-0.02em",
              color:         T1,
              margin:        "0 0 8px",
            }}>
              Construction Material Cost Index
            </h1>
            <p style={{ fontFamily: SYS, fontSize: 14, color: T3, margin: "0 0 6px" }}>
              Live BLS Producer Price Index readings — updated monthly
            </p>
            {updatedAt && (
              <p style={{ fontFamily: MONO, fontSize: 11, color: T3, margin: 0, letterSpacing: "0.04em" }}>
                Last updated: {updatedAt}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button
              onClick={copySnapshot}
              style={{
                fontFamily:   SYS,
                fontSize:     13,
                fontWeight:   500,
                color:        T2,
                background:   BG,
                border:       `1px solid ${BD}`,
                borderRadius: 8,
                padding:      "9px 16px",
                cursor:       "pointer",
                whiteSpace:   "nowrap",
              }}
            >
              {copied ? "Copied ✓" : "Copy snapshot"}
            </button>
            <button
              onClick={exportCSV}
              style={{
                fontFamily:   SYS,
                fontSize:     13,
                fontWeight:   500,
                color:        T2,
                background:   BG,
                border:       `1px solid ${BD}`,
                borderRadius: 8,
                padding:      "9px 16px",
                cursor:       "pointer",
                whiteSpace:   "nowrap",
              }}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Six commodity cards */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 36 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                height: 186, borderRadius: 10, background: "#f3f4f6",
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        ) : (
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap:                 16,
            marginBottom:        36,
          }}>
            {cards.map(c => <CommodityCard key={c.id} d={c} />)}
          </div>
        )}

        {/* Composite index */}
        <div style={{
          background:   BG,
          border:       `1px solid ${BD}`,
          borderRadius: 12,
          padding:      "28px 32px",
          boxShadow:    "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: 24,
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: T3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Composite Construction Cost Index
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 48, fontWeight: 700, color: T1, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {currentComposite.toFixed(1)}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: T3 }}>
                Jan 2020 = 100
              </span>
            </div>

            <p style={{ fontFamily: SYS, fontSize: 14, color: T2, margin: 0, lineHeight: 1.6 }}>
              Current material costs are{" "}
              <strong style={{ color: vsAvgPct > 0 ? "#dc2626" : "#16a34a" }}>
                {Math.abs(vsAvgPct).toFixed(1)}% {vsAvgDir}
              </strong>{" "}
              the {compositeHistory.length}-month average.
              Weighted composite using commercial building input weights (steel 33%, concrete 33%, copper 17%, lumber 8%, diesel 8%).
            </p>
          </div>

          {/* 24-month trend chart */}
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compositeHistory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontFamily: MONO, fontSize: 10, fill: T3 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontFamily: MONO, fontSize: 10, fill: T3 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine
                  y={avgComposite}
                  stroke="#9ca3af"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#2563eb" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: T3, marginTop: 8, letterSpacing: "0.04em" }}>
            — — Dashed line = {compositeHistory.length}-month average ({avgComposite.toFixed(1)})
          </div>
        </div>

        {/* Impact table */}
        <div style={{
          background:   BG,
          border:       `1px solid ${BD}`,
          borderRadius: 12,
          padding:      "28px 32px",
          boxShadow:    "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: 24,
        }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: T3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            What This Means for Your Project
          </div>
          <p style={{ fontFamily: SYS, fontSize: 14, color: T2, margin: "0 0 20px", lineHeight: 1.5 }}>
            How a 10% increase in material costs affects a <strong>$10M project</strong>:
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BD}` }}>
                {["Building Type", "Material Share", "+10% Materials Impact"].map(h => (
                  <th key={h} style={{
                    fontFamily:  MONO,
                    fontSize:    10,
                    fontWeight:  600,
                    color:       T3,
                    textAlign:   "left",
                    padding:     "0 0 10px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IMPACT_ROWS.map((row, i) => (
                <tr key={row.type} style={{ borderBottom: i < IMPACT_ROWS.length - 1 ? `1px solid ${BD}` : "none" }}>
                  <td style={{ fontFamily: SYS, fontSize: 14, fontWeight: 500, color: T1, padding: "14px 0" }}>
                    {row.type}
                  </td>
                  <td style={{ fontFamily: MONO, fontSize: 13, color: T2, padding: "14px 0" }}>
                    {row.pct}%
                  </td>
                  <td style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: "#dc2626", padding: "14px 0" }}>
                    +{fmtDollar(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{
            fontFamily:   SYS,
            fontSize:     12,
            color:        T3,
            margin:       "16px 0 0",
            lineHeight:   1.5,
          }}>
            Based on ConstructAIQ cost benchmark methodology. Material share = (hard cost inputs excluding labor) / total project cost.{" "}
            <Link href="/methodology" style={{ color: "#2563eb", textDecoration: "none" }}>
              See /methodology for details.
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          flexWrap:       "wrap",
          gap:            12,
          paddingTop:     20,
          borderTop:      `1px solid ${BD}`,
        }}>
          <p style={{ fontFamily: MONO, fontSize: 11, color: T3, margin: 0 }}>
            Source: U.S. Bureau of Labor Statistics Producer Price Index · Updated monthly
          </p>
          <Link href="/dashboard" style={{
            fontFamily:     SYS,
            fontSize:       13,
            color:          "#2563eb",
            textDecoration: "none",
            fontWeight:     500,
          }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity: 1 }
          50%      { opacity: 0.5 }
        }
        @media print {
          nav { display: none }
          button { display: none }
        }
      `}</style>
    </div>
  )
}
