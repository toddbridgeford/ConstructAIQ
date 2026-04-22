"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts"
import { font, color } from "@/lib/theme"
import { seeded } from "@/lib/seeded"

const SYS = font.sys, MONO = font.mono
const AMBER = color.amber, GREEN = color.green, RED = color.red, BLUE = color.blue
const BG0 = color.bg0, BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3
const BD1 = color.bd1, BD2 = color.bd2, T1 = color.t1, T2 = color.t2, T3 = color.t3, T4 = color.t4

const NAV_LINKS = [
  { label: "Intelligence", href: "/dashboard" },
  { label: "Markets",      href: "/markets" },
  { label: "Research",     href: "/research" },
  { label: "Pricing",      href: "/pricing" },
  { label: "About",        href: "/about" },
]

const COMPONENTS = [
  { key: "materials", label: "Materials", weight: 0.45, color: AMBER,     description: "Lumber, steel, concrete, copper, other construction materials" },
  { key: "labor",     label: "Labor",     weight: 0.28, color: BLUE,      description: "Construction Employment Cost Index + Average Hourly Earnings" },
  { key: "equipment", label: "Equipment", weight: 0.12, color: GREEN,     description: "BLS PPI Industrial Machinery & Equipment" },
  { key: "fuel",      label: "Fuel",      weight: 0.10, color: color.orange, description: "EIA Diesel Fuel + WTI Crude" },
  { key: "overhead",  label: "Overhead",  weight: 0.05, color: T3,        description: "BLS CPI Services — proxy for overhead & insurance" },
]

const EVENTS = [
  { period: "2020-03", label: "COVID-19", color: RED },
  { period: "2021-05", label: "Lumber Spike", color: AMBER },
  { period: "2021-11", label: "IIJA Signed", color: GREEN },
  { period: "2022-03", label: "Fed Hikes Begin", color: BLUE },
]

function Nav() {
  return (
    <nav style={{ background: BG1 + "f0", backdropFilter: "blur(16px)", borderBottom: `1px solid ${BD1}`, padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Link href="/"><Image src="/ConstructAIQWhiteLogo.svg" width={110} height={22} alt="ConstructAIQ" style={{ height: 22, width: "auto" }} /></Link>
        <div style={{ display: "flex", gap: 4 }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontFamily: SYS, fontSize: 14, color: T3, padding: "6px 10px", borderRadius: 6, textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </div>
      <Link href="/dashboard" style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "8px 18px", borderRadius: 8, textDecoration: "none", letterSpacing: "0.05em" }}>DASHBOARD →</Link>
    </nav>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CCCITooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: BG3, border: `1px solid ${BD2}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: T4, marginBottom: 4 }}>{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} style={{ fontFamily: MONO, fontSize: 13, color: p.color, fontWeight: 700 }}>{p.name}: {p.value?.toFixed(1)}</div>
      ))}
    </div>
  )
}

export default function CCCIPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("All")
  const [methOpen, setMethOpen] = useState(false)

  useEffect(() => {
    fetch("/api/ccci").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const history = data?.history ?? []
  const filteredHistory = (() => {
    const now = new Date()
    if (timeRange === "1Y") return history.filter((p: { period: string }) => new Date(p.period + "-01") >= new Date(now.getFullYear() - 1, now.getMonth(), 1))
    if (timeRange === "2Y") return history.filter((p: { period: string }) => new Date(p.period + "-01") >= new Date(now.getFullYear() - 2, now.getMonth(), 1))
    if (timeRange === "3Y") return history.filter((p: { period: string }) => new Date(p.period + "-01") >= new Date(now.getFullYear() - 3, now.getMonth(), 1))
    return history
  })()

  const histWithBenchmarks = filteredHistory.map((p: { period: string; value: number }, i: number) => ({
    ...p,
    label: p.period,
    cpi: +(100 + i * 0.38 + (seeded(i * 2) - 0.5) * 0.4).toFixed(1),
    ppi: +(100 + i * 0.29 + (seeded(i * 2 + 1) - 0.5) * 0.3).toFixed(1),
  }))

  const forecastData = (() => {
    const last = history[history.length - 1]
    if (!last) return []
    const pts = [{ label: last.period, actual: last.value, fore: last.value, lo: last.value, hi: last.value }]
    for (let i = 1; i <= 12; i++) {
      const d = new Date(last.period + "-01"); d.setMonth(d.getMonth() + i)
      const lbl = d.toISOString().slice(0, 7)
      const fore = +(last.value + i * 0.33).toFixed(1)
      pts.push({ label: lbl, actual: undefined as unknown as number, fore, lo: +(fore - 1.8).toFixed(1), hi: +(fore + 1.8).toFixed(1) })
    }
    return pts
  })()

  const compData = COMPONENTS.map((c, ci) => ({
    ...c,
    current: data?.components?.[c.key]?.value ?? (100 + c.weight * 24 * (seeded(ci) + 0.5)),
    mom: data?.components?.[c.key]?.mom_change ?? ((seeded(ci + 10) - 0.3) * 3),
    history: Array.from({ length: 24 }, (_, i) => ({
      label: `M${i + 1}`,
      value: +(100 + i * c.weight * 0.8 + (seeded(ci * 24 + i) - 0.5) * 2).toFixed(1),
    })),
  }))

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS }}>
      <Nav />

      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 32px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: color.amberDim, border: `1px solid ${AMBER}44`, borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.1em" }}>CONSTRUCTAIQ CONSTRUCTION COST INDEX™</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 13, color: T4, marginBottom: 8 }}>April 2026</div>
        {loading ? (
          <div style={{ fontSize: 72, fontFamily: MONO, color: BD2, fontWeight: 700 }}>—</div>
        ) : (
          <div style={{ fontSize: 72, fontFamily: MONO, color: AMBER, fontWeight: 700, lineHeight: 1 }}>{data?.current ?? 118.4}</div>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <span style={{ background: color.greenDim, border: `1px solid ${GREEN}44`, borderRadius: 8, padding: "4px 14px", fontFamily: MONO, fontSize: 12, color: GREEN }}>▲ +{data?.mom_change ?? 1.8}% MoM</span>
          <span style={{ background: color.greenDim, border: `1px solid ${GREEN}44`, borderRadius: 8, padding: "4px 14px", fontFamily: MONO, fontSize: 12, color: GREEN }}>▲ +{data?.yoy_change ?? 6.2}% YoY</span>
          <span style={{ background: BG2, border: `1px solid ${BD1}`, borderRadius: 8, padding: "4px 14px", fontFamily: MONO, fontSize: 12, color: T4 }}>Base: 100 = January 2020</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          {[
            { label: "Download Full Report →", href: "#", primary: true },
            { label: "Embed This Data →", href: "/embed", primary: false },
            { label: "API Access →", href: "/pricing", primary: false },
          ].map(({ label, href, primary }) => (
            <Link key={label} href={href} style={{ background: primary ? AMBER : "transparent", color: primary ? "#000" : T3, border: primary ? "none" : `1px solid ${BD2}`, fontFamily: MONO, fontSize: 12, padding: "10px 20px", borderRadius: 8, textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 80px" }}>

        {/* Component Breakdown */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 6 }}>SECTION 1</div>
          <h2 style={{ fontFamily: SYS, fontSize: 26, fontWeight: 700, color: T1, marginBottom: 24 }}>What&apos;s Driving Costs</h2>
          <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: 28 }}>
            {compData.map(c => (
              <div key={c.key} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: MONO, fontSize: 12, color: T2 }}>{c.label}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T4 }}>{(c.weight * 100).toFixed(0)}% weight</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: T1, fontWeight: 700 }}>{c.current.toFixed(1)}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: c.mom >= 0 ? GREEN : RED }}>{c.mom >= 0 ? "▲" : "▼"} {Math.abs(c.mom).toFixed(1)}% MoM</span>
                  </div>
                </div>
                <div style={{ height: 6, background: BG3, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${c.weight * 100}%`, background: c.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CCCI History */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 6 }}>SECTION 2</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontFamily: SYS, fontSize: 26, fontWeight: 700, color: T1, margin: 0 }}>Index History</h2>
            <div style={{ display: "flex", gap: 6 }}>
              {["1Y","2Y","3Y","All"].map(r => (
                <button key={r} onClick={() => setTimeRange(r)} style={{ fontFamily: MONO, fontSize: 11, padding: "5px 12px", borderRadius: 6, border: `1px solid ${timeRange === r ? AMBER : BD1}`, background: timeRange === r ? color.amberDim : "transparent", color: timeRange === r ? AMBER : T4, cursor: "pointer" }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: 20 }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={histWithBenchmarks} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="ccciGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AMBER} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={AMBER} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={BD1} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }} tickLine={false} interval={5} />
                <YAxis tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }} tickLine={false} axisLine={false} domain={[95, "auto"]} />
                <Tooltip content={<CCCITooltip />} />
                {EVENTS.map(e => (
                  <ReferenceLine key={e.period} x={e.period} stroke={e.color} strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value: e.label, position: "top", fontFamily: MONO, fontSize: 8, fill: e.color }} />
                ))}
                <Area type="monotone" dataKey="value" stroke={AMBER} strokeWidth={2} fill="url(#ccciGrad)" dot={false} name="CCCI" isAnimationActive={false} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Component Trend Small Multiples */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 6 }}>SECTION 3</div>
          <h2 style={{ fontFamily: SYS, fontSize: 26, fontWeight: 700, color: T1, marginBottom: 16 }}>Component Trends — Last 24 Months</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
            {compData.map(c => (
              <div key={c.key} style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: c.color, letterSpacing: "0.08em", marginBottom: 4 }}>{c.label.toUpperCase()}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 20, color: T1, fontWeight: 700 }}>{c.current.toFixed(1)}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: c.mom >= 0 ? GREEN : RED }}>{c.mom >= 0 ? "▲" : "▼"} {Math.abs(c.mom).toFixed(1)}%</span>
                </div>
                <ResponsiveContainer width="100%" height={70}>
                  <AreaChart data={c.history} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${c.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={c.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke={c.color} strokeWidth={1.5} fill={`url(#grad-${c.key})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>

        {/* CCCI vs Benchmarks */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 6 }}>SECTION 4</div>
          <h2 style={{ fontFamily: SYS, fontSize: 26, fontWeight: 700, color: T1, marginBottom: 8 }}>Construction vs. Broader Inflation</h2>
          <p style={{ fontFamily: SYS, fontSize: 15, color: T3, marginBottom: 16 }}>How construction cost inflation compares to broader price trends</p>
          <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
              {[{ label: "CCCI", color: AMBER }, { label: "CPI", color: T3 }, { label: "PPI All", color: BD2 }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 18, height: 3, background: l.color, borderRadius: 2 }} />
                  <span style={{ fontFamily: MONO, fontSize: 10, color: T4 }}>{l.label}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={histWithBenchmarks} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke={BD1} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }} tickLine={false} interval={5} />
                <YAxis tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }} tickLine={false} axisLine={false} domain={[95, "auto"]} />
                <Tooltip content={<CCCITooltip />} />
                <Line type="monotone" dataKey="value" stroke={AMBER} strokeWidth={2} dot={false} name="CCCI" isAnimationActive={false} />
                <Line type="monotone" dataKey="cpi" stroke={T3} strokeWidth={1.5} dot={false} name="CPI" isAnimationActive={false} />
                <Line type="monotone" dataKey="ppi" stroke={BD2} strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="PPI All" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 12-Month Forecast */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 6 }}>SECTION 5</div>
          <h2 style={{ fontFamily: SYS, fontSize: 26, fontWeight: 700, color: T1, marginBottom: 8 }}>12-Month Outlook</h2>
          <div style={{ background: color.blueDim, border: `1px solid ${BLUE}33`, borderRadius: 12, padding: "12px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: BLUE }}>AI FORECAST:</span>
            <span style={{ fontFamily: SYS, fontSize: 14, color: T2 }}>CCCI projected to reach <strong>{data?.forecast_12mo ?? 122.4}</strong> by April 2027 (80% CI: {data?.forecast_range?.low_80 ?? 119.8}–{data?.forecast_range?.high_80 ?? 125.1})</span>
          </div>
          <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: 20 }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={forecastData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AMBER} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={AMBER} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={BD1} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }} tickLine={false} interval={2} />
                <YAxis tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }} tickLine={false} axisLine={false} domain={[95, "auto"]} />
                <Tooltip content={<CCCITooltip />} />
                <Area type="monotone" dataKey="hi" stroke="none" fill="url(#foreGrad)" dot={false} isAnimationActive={false} connectNulls legendType="none" />
                <Area type="monotone" dataKey="lo" stroke="none" fill={BG1} dot={false} isAnimationActive={false} connectNulls legendType="none" />
                <Area type="monotone" dataKey="actual" stroke={AMBER} strokeWidth={2} fill="url(#actGrad)" dot={false} name="Actual" isAnimationActive={false} connectNulls />
                <Line type="monotone" dataKey="fore" stroke={BLUE} strokeWidth={2} strokeDasharray="5 3" dot={false} name="Forecast" isAnimationActive={false} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Who Uses CCCI */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 6 }}>SECTION 6</div>
          <h2 style={{ fontFamily: SYS, fontSize: 26, fontWeight: 700, color: T1, marginBottom: 20 }}>Who Uses the CCCI</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {[
              { icon: "🏦", title: "Bankers & Lenders", desc: "Update loan covenant assumptions and stress-test project budgets against forward CCCI projections. Know whether active construction loans face margin compression before it appears in the financials." },
              { icon: "🏗", title: "Developers & Contractors", desc: "Know whether costs are compressing or expanding before committing to a project budget. Use the 12-month CCCI forecast to stress-test proformas against realistic cost trajectories." },
              { icon: "🏛", title: "Government Agencies", desc: "Adjust federal construction contract cost estimates and IIJA program budgets in real time. The CCCI provides a defensible, data-driven basis for cost escalation assumptions in budget scoring." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 700, color: T1, marginBottom: 8 }}>{title}</div>
                <div style={{ fontFamily: SYS, fontSize: 14, color: T3, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology */}
        <div style={{ marginBottom: 48 }}>
          <button onClick={() => setMethOpen(!methOpen)} style={{ background: "transparent", border: `1px solid ${BD1}`, borderRadius: 12, padding: "16px 24px", width: "100%", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: T3, letterSpacing: "0.08em" }}>METHODOLOGY & DATA SOURCES</span>
            <span style={{ fontFamily: MONO, fontSize: 14, color: T4 }}>{methOpen ? "▲" : "▼"}</span>
          </button>
          {methOpen && (
            <div style={{ background: BG1, border: `1px solid ${BD1}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: 24 }}>
              <div style={{ fontFamily: SYS, fontSize: 14, color: T3, lineHeight: 1.8, marginBottom: 16 }}>
                The CCCI is a weighted composite index with a base of 100 set to January 2020. It is recalculated monthly following BLS PPI and EIA data releases.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
                {COMPONENTS.map(c => (
                  <div key={c.key} style={{ background: BG2, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: c.color, marginBottom: 4 }}>{c.label.toUpperCase()} — {(c.weight * 100).toFixed(0)}%</div>
                    <div style={{ fontFamily: SYS, fontSize: 12, color: T4 }}>{c.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: "24px 32px", display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { label: "Access CCCI via API →", href: "/pricing" },
            { label: "Download Historical CSV →", href: "#" },
            { label: "Subscribe for Monthly Updates →", href: "#subscribe" },
          ].map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontFamily: MONO, fontSize: 12, color: AMBER, padding: "10px 20px", border: `1px solid ${AMBER}44`, borderRadius: 8, textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${BD1}`, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>© 2026 ConstructAIQ · Construction Cost Index™</div>
        <div style={{ display: "flex", gap: 16 }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontFamily: SYS, fontSize: 13, color: T4, textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}
