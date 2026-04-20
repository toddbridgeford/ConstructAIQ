"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts"
import { font, color } from "@/lib/theme"

const SYS = font.sys
const MONO = font.mono

const ALL_SECTORS = [
  { id: "residential",   label: "Residential" },
  { id: "commercial",    label: "Commercial" },
  { id: "industrial",    label: "Industrial" },
  { id: "infrastructure",label: "Infrastructure" },
  { id: "healthcare",    label: "Healthcare" },
  { id: "education",     label: "Education" },
  { id: "energy",        label: "Energy / Utilities" },
  { id: "multifamily",   label: "Multifamily" },
  { id: "data_centers",  label: "Data Centers" },
]

const SECTOR_COLORS = [
  color.green, color.blue, color.amber, "#5e5ce6", color.red,
  "#64d2ff", "#ffd60a", "#ff9f0a", "#30d158",
]

function classColor(c: string) {
  if (c === "EXPANDING")   return color.green
  if (c === "CONTRACTING") return color.red
  if (c === "SLOWING")     return color.amber
  return color.blue
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RadarCard({ sectors }: { sectors: any[] }) {
  const metrics = ["cshi", "mom_change", "yoy_change", "backlog_months", "employment_mom"]
  const labels: Record<string, string> = {
    cshi: "Momentum",
    mom_change: "MoM Growth",
    yoy_change: "YoY Growth",
    backlog_months: "Backlog",
    employment_mom: "Employment",
  }

  // Normalize all metrics 0-100
  const maxes: Record<string, number> = {
    cshi: 100, mom_change: 8, yoy_change: 25, backlog_months: 20, employment_mom: 4,
  }

  const radarData = metrics.map(m => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry: Record<string, any> = { metric: labels[m] }
    for (const s of sectors) {
      entry[s.label] = Math.max(0, Math.min(100, ((s[m] ?? 0) / maxes[m]) * 100))
    }
    return entry
  })

  return (
    <div style={{ background: color.bg2, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}` }}>
      <div style={{ fontFamily: MONO, fontSize: 12, color: color.amber, letterSpacing: "0.08em", marginBottom: 16 }}>RADAR COMPARISON</div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={radarData}>
          <PolarGrid stroke={color.bd2} />
          <PolarAngleAxis dataKey="metric" tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }} />
          {sectors.map((s, i) => (
            <Radar key={s.id} name={s.label} dataKey={s.label} stroke={SECTOR_COLORS[i]} fill={SECTOR_COLORS[i]} fillOpacity={0.15} />
          ))}
          <Legend iconType="circle" wrapperStyle={{ fontFamily: MONO, fontSize: 10 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TrendCard({ sectors }: { sectors: any[] }) {
  // Build combined history data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPeriods: string[] = sectors[0]?.history?.map((h: any) => h.period) ?? []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData = allPeriods.map(p => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = { period: p.slice(5) } // "MM"
    for (const s of sectors) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const point = s.history?.find((h: any) => h.period === p)
      row[s.label] = point?.value
    }
    return row
  })

  // Show only last 12 months
  const recent = chartData.slice(-12)

  return (
    <div style={{ background: color.bg2, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}` }}>
      <div style={{ fontFamily: MONO, fontSize: 12, color: color.amber, letterSpacing: "0.08em", marginBottom: 16 }}>12-MONTH MOMENTUM TREND</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={recent}>
          <CartesianGrid stroke={color.bd1} strokeDasharray="3 3" />
          <XAxis dataKey="period" tick={{ fontFamily: MONO, fontSize: 9, fill: color.t4 }} tickLine={false} />
          <YAxis tick={{ fontFamily: MONO, fontSize: 9, fill: color.t4 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: color.bg3, border: `1px solid ${color.bd2}`, borderRadius: 8, fontFamily: MONO, fontSize: 11 }} />
          <Legend iconType="circle" wrapperStyle={{ fontFamily: MONO, fontSize: 10 }} />
          {sectors.map((s, i) => (
            <Line key={s.id} type="monotone" dataKey={s.label} stroke={SECTOR_COLORS[i]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function ComparePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [selected, setSelected] = useState<string[]>(["residential", "industrial", "multifamily"])

  useEffect(() => {
    fetch("/api/compare")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : prev.length < 4 ? [...prev, id] : prev
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allSectors: any[] = data?.sectors ?? []
  const activeSectors = allSectors.filter(s => selected.includes(s.id))

  return (
    <div style={{ background: color.bg0, minHeight: "100vh", color: color.t1 }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: color.bg0 + "ee", borderBottom: `1px solid ${color.bd1}`, backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/logo.png" alt="ConstructAIQ" width={28} height={28} style={{ borderRadius: 6 }} />
            <span style={{ fontFamily: MONO, fontSize: 14, color: color.amber, fontWeight: 700, letterSpacing: "0.05em" }}>ConstructAIQ</span>
          </Link>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Markets", href: "/markets" },
              { label: "CCCI", href: "/ccci" },
              { label: "Compare", href: "/compare" },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontFamily: SYS, fontSize: 14, color: l.href === "/compare" ? color.amber : color.t3, textDecoration: "none" }}>{l.label}</Link>
            ))}
            <Link href="/dashboard" style={{ fontFamily: MONO, fontSize: 12, color: color.bg0, background: color.amber, borderRadius: 8, padding: "7px 16px", textDecoration: "none", fontWeight: 700 }}>DASHBOARD</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 32px", textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.12em", marginBottom: 16 }}>SECTOR COMPARISON · ROTATION INTELLIGENCE</div>
        <h1 style={{ fontFamily: SYS, fontSize: 42, fontWeight: 700, color: color.t1, margin: "0 0 16px" }}>Sector Comparison Tool</h1>
        <p style={{ fontFamily: SYS, fontSize: 18, color: color.t3, maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
          Compare momentum, growth, and risk across construction sectors. Identify rotation opportunities before they move.
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        {/* Sector selector */}
        <div style={{ background: color.bg1, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}`, marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em", marginBottom: 14 }}>SELECT UP TO 4 SECTORS TO COMPARE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {ALL_SECTORS.map(s => {
              const isActive = selected.includes(s.id)
              const idx = selected.indexOf(s.id)
              const col = isActive ? SECTOR_COLORS[idx] : color.t4
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  style={{
                    fontFamily: SYS, fontSize: 13, padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${isActive ? col : color.bd2}`,
                    background: isActive ? col + "22" : color.bg2,
                    color: isActive ? col : color.t3,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {!data ? (
          <div style={{ textAlign: "center", padding: 64, fontFamily: MONO, fontSize: 13, color: color.t4 }}>Loading sector data…</div>
        ) : activeSectors.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, fontFamily: MONO, fontSize: 13, color: color.t4 }}>Select at least one sector above</div>
        ) : (
          <>
            {/* Metric cards row */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${activeSectors.length}, 1fr)`, gap: 16, marginBottom: 28 }}>
              {activeSectors.map((s, i) => (
                <div key={s.id} style={{ background: color.bg2, borderRadius: 16, padding: 20, border: `1px solid ${SECTOR_COLORS[i]}44` }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: SECTOR_COLORS[i], letterSpacing: "0.08em", marginBottom: 8 }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontFamily: MONO, fontSize: 28, color: color.t1, fontWeight: 700 }}>{s.cshi?.toFixed(1)}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: classColor(s.classification), marginBottom: 12 }}>{s.classification}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "MoM", value: `${s.mom_change > 0 ? "+" : ""}${s.mom_change?.toFixed(1)}%` },
                      { label: "YoY", value: `${s.yoy_change > 0 ? "+" : ""}${s.yoy_change?.toFixed(1)}%` },
                      { label: "Backlog", value: `${s.backlog_months?.toFixed(1)}mo` },
                      { label: "Risk", value: s.risk_score },
                    ].map(m => (
                      <div key={m.label} style={{ background: color.bg3, borderRadius: 6, padding: "6px 10px" }}>
                        <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>{m.label}</div>
                        <div style={{ fontFamily: MONO, fontSize: 13, color: color.t2 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {s.etf && (
                    <div style={{ marginTop: 10, background: color.bg3, borderRadius: 6, padding: "6px 10px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>ETF: {s.etf}</span>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: s.etf_ytd >= 0 ? color.green : color.red }}>{s.etf_ytd > 0 ? "+" : ""}{s.etf_ytd?.toFixed(1)}% YTD</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              <TrendCard sectors={activeSectors} />
              <RadarCard sectors={activeSectors} />
            </div>

            {/* Rotation Signals */}
            {data.rotation_signals?.length > 0 && (
              <div style={{ background: color.bg1, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}` }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: color.amber, letterSpacing: "0.08em", marginBottom: 16 }}>ROTATION SIGNALS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.rotation_signals.map((sig: any, i: number) => (
                    <div key={i} style={{ background: color.bg2, borderRadius: 10, padding: "14px 18px", border: `1px solid ${color.bd1}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: MONO, fontSize: 12, color: color.red }}>{sig.from}</span>
                        <span style={{ fontFamily: MONO, fontSize: 16, color: color.t4 }}>→</span>
                        <span style={{ fontFamily: MONO, fontSize: 12, color: color.green }}>{sig.to}</span>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: sig.strength === "STRONG" ? color.green : color.amber, background: (sig.strength === "STRONG" ? color.green : color.amber) + "22", borderRadius: 4, padding: "2px 8px" }}>{sig.strength}</span>
                      <span style={{ fontFamily: SYS, fontSize: 13, color: color.t3, flex: 1 }}>{sig.rationale}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
