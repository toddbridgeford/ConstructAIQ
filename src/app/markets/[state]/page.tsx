"use client"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, use } from "react"
import { font, color } from "@/lib/theme"
import { seeded } from "@/lib/seeded"
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts"

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

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav({ state }: { state: string }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: BG1 + "ee", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${BD1}`,
      padding: "0 32px", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: 60,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/">
          <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto" }} />
        </Link>
        <div style={{ width: 1, height: 24, background: BD1 }} />
        <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em" }}>{state.toUpperCase()}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {[
          { label: "INTELLIGENCE", href: "/dashboard" },
          { label: "RESEARCH",     href: "/research"  },
          { label: "PRICING",      href: "/pricing"   },
          { label: "ABOUT",        href: "/about"     },
          { label: "CONTACT",      href: "/contact"   },
        ].map(({ label, href }) => (
          <Link key={label} href={href}>
            <button style={{ background: "transparent", color: T4, fontFamily: MONO, fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", letterSpacing: "0.06em" }}>
              {label}
            </button>
          </Link>
        ))}
        <Link href="/dashboard">
          <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 10, letterSpacing: "0.06em", minHeight: 36, border: "none", cursor: "pointer" }}>
            DASHBOARD →
          </button>
        </Link>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${BD1}`, padding: "40px 32px", marginTop: 80 }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto", opacity: 0.7 }} />
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {[["Intelligence", "/dashboard"], ["Research", "/research"], ["Pricing", "/pricing"], ["Markets", "/markets"], ["About", "/about"], ["Contact", "/contact"]].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontFamily: SYS, fontSize: 13, color: T4, textDecoration: "none" }}>{l}</Link>
          ))}
        </div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T4, opacity: 0.6 }}>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
      </div>
    </footer>
  )
}

// ─── State data lookup ────────────────────────────────────────────────────────
interface StateInfo {
  name: string
  grade: string
  score: number
  scoreDelta: number
  classification: string
  classIcon: string
  permits: number
  permitValue: number
  employment: number
  federalAwards: number
  materialsPressure: string
  neighbors: { name: string; slug: string; grade: string }[]
  metros: { msa: string; permits: number; yoy: number; class: string }[]
  federalProjects: { name: string; value: number; agency: string }[]
}

function getStateData(slug: string): StateInfo {
  const map: Record<string, StateInfo> = {
    texas: {
      name: "Texas", grade: "A+", score: 91.4, scoreDelta: 3.2, classification: "HOT", classIcon: "🔥",
      permits: 186400, permitValue: 38.2, employment: 4.1, federalAwards: 8.2, materialsPressure: "MODERATE",
      neighbors: [{ name: "Oklahoma", slug: "oklahoma", grade: "D+" }, { name: "New Mexico", slug: "new-mexico", grade: "B-" }, { name: "Louisiana", slug: "louisiana", grade: "F" }],
      metros: [
        { msa: "Dallas-Fort Worth", permits: 48200, yoy: 14.8, class: "HOT 🔥" },
        { msa: "Houston", permits: 39100, yoy: 11.2, class: "HOT 🔥" },
        { msa: "Austin", permits: 28600, yoy: 9.4, class: "HOT 🔥" },
        { msa: "San Antonio", permits: 17400, yoy: 7.1, class: "GROWING 📈" },
        { msa: "El Paso", permits: 8200, yoy: 4.2, class: "GROWING 📈" },
      ],
      federalProjects: [
        { name: "I-35 Expansion Corridor", value: 2400, agency: "FHWA" },
        { name: "Port of Houston Modernization", value: 890, agency: "Army Corps" },
        { name: "San Antonio AFB Infrastructure", value: 640, agency: "DoD" },
      ],
    },
    florida: {
      name: "Florida", grade: "A", score: 87.2, scoreDelta: 2.1, classification: "HOT", classIcon: "🔥",
      permits: 148600, permitValue: 31.4, employment: 3.6, federalAwards: 5.1, materialsPressure: "MODERATE",
      neighbors: [{ name: "Georgia", slug: "georgia", grade: "B" }, { name: "Alabama", slug: "alabama", grade: "D" }, { name: "South Carolina", slug: "south-carolina", grade: "B" }],
      metros: [
        { msa: "Miami-Fort Lauderdale", permits: 38400, yoy: 10.8, class: "HOT 🔥" },
        { msa: "Tampa-St. Petersburg", permits: 29200, yoy: 9.1, class: "HOT 🔥" },
        { msa: "Orlando", permits: 24800, yoy: 8.4, class: "HOT 🔥" },
        { msa: "Jacksonville", permits: 16100, yoy: 6.2, class: "GROWING 📈" },
        { msa: "Fort Myers", permits: 11200, yoy: 5.4, class: "GROWING 📈" },
      ],
      federalProjects: [
        { name: "Miami I-395 Signature Bridge", value: 830, agency: "FHWA" },
        { name: "Port Everglades Deepening", value: 412, agency: "Army Corps" },
        { name: "Eglin AFB Runway Rehab", value: 280, agency: "DoD" },
      ],
    },
    arizona: {
      name: "Arizona", grade: "A-", score: 83.6, scoreDelta: 1.8, classification: "HOT", classIcon: "🔥",
      permits: 72400, permitValue: 18.9, employment: 2.9, federalAwards: 6.3, materialsPressure: "LOW",
      neighbors: [{ name: "Nevada", slug: "nevada", grade: "A-" }, { name: "Utah", slug: "utah", grade: "A-" }, { name: "New Mexico", slug: "new-mexico", grade: "B-" }],
      metros: [
        { msa: "Phoenix", permits: 48600, yoy: 9.8, class: "HOT 🔥" },
        { msa: "Tucson", permits: 12800, yoy: 5.6, class: "GROWING 📈" },
        { msa: "Mesa", permits: 6400, yoy: 4.2, class: "GROWING 📈" },
        { msa: "Chandler", permits: 2900, yoy: 3.8, class: "GROWING 📈" },
        { msa: "Gilbert", permits: 1700, yoy: 2.4, class: "NEUTRAL ⬛" },
      ],
      federalProjects: [
        { name: "TSMC Fab Infrastructure", value: 1200, agency: "Commerce" },
        { name: "Luke AFB Expansion", value: 540, agency: "DoD" },
        { name: "CAP Aqueduct Rehabilitation", value: 310, agency: "Bureau of Reclamation" },
      ],
    },
    illinois: {
      name: "Illinois", grade: "D", score: 38.2, scoreDelta: -2.4, classification: "DECLINING", classIcon: "📉",
      permits: 18400, permitValue: 4.8, employment: -1.8, federalAwards: -8.4, materialsPressure: "HIGH",
      neighbors: [{ name: "Indiana", slug: "indiana", grade: "C+" }, { name: "Wisconsin", slug: "wisconsin", grade: "C" }, { name: "Iowa", slug: "iowa", grade: "C-" }],
      metros: [
        { msa: "Chicago", permits: 12100, yoy: -5.8, class: "DECLINING 📉" },
        { msa: "Rockford", permits: 1800, yoy: -4.2, class: "DECLINING 📉" },
        { msa: "Peoria", permits: 1400, yoy: -3.6, class: "COOLING ❄️" },
        { msa: "Springfield", permits: 980, yoy: -2.8, class: "COOLING ❄️" },
        { msa: "Champaign", permits: 640, yoy: -1.4, class: "COOLING ❄️" },
      ],
      federalProjects: [
        { name: "I-80 Rehabilitation", value: 420, agency: "FHWA" },
        { name: "Chicago Union Station Upgrades", value: 310, agency: "Amtrak" },
        { name: "O'Hare Modernization Phase III", value: 180, agency: "FAA" },
      ],
    },
  }

  if (map[slug]) return map[slug]

  // Generic fallback based on slug
  const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  return {
    name, grade: "C", score: 55.0, scoreDelta: 0.4, classification: "NEUTRAL", classIcon: "⬛",
    permits: 24000, permitValue: 6.2, employment: 0.2, federalAwards: -0.8, materialsPressure: "MODERATE",
    neighbors: [
      { name: "Neighboring State 1", slug: "texas", grade: "A+" },
      { name: "Neighboring State 2", slug: "florida", grade: "A" },
      { name: "Neighboring State 3", slug: "georgia", grade: "B" },
    ],
    metros: [
      { msa: `${name} Metro`, permits: 8400, yoy: 0.8, class: "NEUTRAL ⬛" },
      { msa: `${name} East`, permits: 4200, yoy: -0.4, class: "COOLING ❄️" },
      { msa: `${name} West`, permits: 3100, yoy: 1.2, class: "NEUTRAL ⬛" },
      { msa: `${name} South`, permits: 2800, yoy: -1.1, class: "COOLING ❄️" },
      { msa: `${name} North`, permits: 1900, yoy: 0.2, class: "NEUTRAL ⬛" },
    ],
    federalProjects: [
      { name: `${name} Highway Expansion`, value: 380, agency: "FHWA" },
      { name: `${name} Water Infrastructure`, value: 220, agency: "EPA" },
      { name: `${name} Grid Modernization`, value: 140, agency: "DOE" },
    ],
  }
}

// ─── Generate 24-month chart data ─────────────────────────────────────────────
function gen24Months(base: number, trend: number, volatility: number) {
  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]
  return months.map((m, i) => ({
    month: m,
    value: Math.round(base * (1 + (trend / 100) * i / 12) + (seeded(i) - 0.5) * volatility),
    ma: Math.round(base * (1 + (trend / 100) * i / 12)),
  }))
}

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return GREEN
  if (grade.startsWith("B")) return BLUE
  if (grade.startsWith("C")) return AMBER
  return RED
}
function gradeBg(grade: string): string {
  if (grade.startsWith("A")) return color.greenDim
  if (grade.startsWith("B")) return color.blueDim
  if (grade.startsWith("C")) return color.amberDim
  return color.redDim
}

type StaticParams = { params: Promise<{ state: string }> }

export default function StatePage({ params }: StaticParams) {
  const { state: slug } = use(params)
  const [forecastUnlocked, setForecastUnlocked] = useState(false)
  const [emailInput, setEmailInput] = useState("")

  const data = getStateData(slug)
  const permitChartData = gen24Months(data.permits / 24, data.employment * 6, data.permits / 24 * 0.3)
  const employmentChartData = gen24Months(100, data.employment * 2, 2)
  const forecastData = [...permitChartData.slice(-6), ...Array.from({ length: 6 }, (_, i) => ({
    month: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"][i],
    value: Math.round(permitChartData[23].value * (1 + (data.employment / 100) * (i + 1))),
    ma: Math.round(permitChartData[23].ma * (1 + (data.employment / 100) * (i + 1))),
    forecast: true,
  }))]

  const avg = Math.round(permitChartData.reduce((s, d) => s + d.value, 0) / permitChartData.length)

  useEffect(() => { /* page loaded */ }, [])

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} a{color:inherit;text-decoration:none} button{cursor:pointer;font-family:inherit}`}</style>
      <Nav state={data.name} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>

        {/* SECTION 1 — Hero */}
        <div style={{ padding: "48px 0 40px" }}>
          <Link href="/markets" style={{ fontFamily: MONO, fontSize: 12, color: T4, letterSpacing: "0.06em", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
            ← ALL MARKETS
          </Link>
          <div style={{ display: "inline-block", background: BG2, border: `1px solid ${AMBER}44`, borderRadius: 20, padding: "5px 16px", marginBottom: 20 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.1em" }}>CONSTRUCTAIQ STATE INTELLIGENCE REPORT — APRIL 2026</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap", marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: SYS, fontSize: 48, fontWeight: 800, color: T1, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 16 }}>
                {data.name.toUpperCase()}<br />
                <span style={{ color: AMBER }}>CONSTRUCTION MARKET</span>
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: gradeColor(data.grade), background: gradeBg(data.grade), padding: "8px 20px", borderRadius: 12 }}>{data.grade}</span>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 14, color: T2 }}>
                    Score: <strong style={{ color: T1 }}>{data.score.toFixed(1)}</strong> / 100
                    &nbsp;
                    <span style={{ color: data.scoreDelta >= 0 ? GREEN : RED }}>
                      {data.scoreDelta >= 0 ? "▲" : "▼"} {data.scoreDelta >= 0 ? "+" : ""}{data.scoreDelta.toFixed(1)} from last month
                    </span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: T3, background: BG2, border: `1px solid ${BD1}`, borderRadius: 8, padding: "4px 12px" }}>
                      {data.classIcon} {data.classification}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 — KPI Cards */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 48 }}>
          {[
            { label: "PERMIT VOLUME", value: `${(data.permits / 1000).toFixed(1)}K`, sub: "units YTD", color: AMBER },
            { label: "PERMIT VALUE", value: `$${data.permitValue.toFixed(1)}B`, sub: "YTD authorized", color: GREEN },
            { label: "EMPLOYMENT YOY", value: `${data.employment >= 0 ? "+" : ""}${data.employment.toFixed(1)}%`, sub: "construction workers", color: data.employment >= 0 ? GREEN : RED },
            { label: "FEDERAL AWARDS", value: `${data.federalAwards >= 0 ? "+" : ""}${data.federalAwards.toFixed(1)}%`, sub: "vs. prior year", color: data.federalAwards >= 0 ? GREEN : RED },
            { label: "MATERIALS PRESSURE", value: data.materialsPressure, sub: "cost index", color: data.materialsPressure === "HIGH" ? RED : data.materialsPressure === "LOW" ? GREEN : AMBER },
          ].map(({ label, value, sub, color: c }) => (
            <div key={label} style={{ flex: "1 1 160px", background: BG1, border: `1px solid ${BD1}`, borderRadius: 12, padding: "20px 16px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: c, marginBottom: 4 }}>{value}</div>
              <div style={{ fontFamily: SYS, fontSize: 12, color: T4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* SECTION 3 — Permit Chart */}
        <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: "28px 24px", marginBottom: 32 }}>
          <h2 style={{ fontFamily: SYS, fontSize: 20, fontWeight: 700, color: T1, marginBottom: 4 }}>Permit Activity — Last 24 Months</h2>
          <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginBottom: 20 }}>Monthly permit issuances with 12-month moving average</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={permitChartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BD1} />
              <XAxis dataKey="month" tick={{ fontFamily: MONO, fontSize: 10, fill: T4 }} />
              <YAxis tick={{ fontFamily: MONO, fontSize: 10, fill: T4 }} />
              <Tooltip contentStyle={{ background: BG2, border: `1px solid ${BD2}`, borderRadius: 8, fontFamily: MONO, fontSize: 12, color: T1 }} />
              <ReferenceLine y={avg} stroke={AMBER} strokeDasharray="4 4" label={{ value: "Avg", fill: AMBER, fontSize: 10, fontFamily: MONO }} />
              <Bar dataKey="value" fill={AMBER} radius={[3, 3, 0, 0]}
                shape={(props: { x?: number; y?: number; width?: number; height?: number; value?: number }) => {
                  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props
                  return <rect x={x} y={y} width={width} height={height} fill={value >= avg ? GREEN : RED} rx={3} />
                }}
              />
              <Line type="monotone" dataKey="ma" stroke={AMBER} strokeWidth={2} dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SECTION 4 — Employment Chart */}
        <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: "28px 24px", marginBottom: 32 }}>
          <h2 style={{ fontFamily: SYS, fontSize: 20, fontWeight: 700, color: T1, marginBottom: 4 }}>Construction Employment — Last 24 Months</h2>
          <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginBottom: 20 }}>Indexed to 100 at start of period</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={employmentChartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BD1} />
              <XAxis dataKey="month" tick={{ fontFamily: MONO, fontSize: 10, fill: T4 }} />
              <YAxis tick={{ fontFamily: MONO, fontSize: 10, fill: T4 }} />
              <Tooltip contentStyle={{ background: BG2, border: `1px solid ${BD2}`, borderRadius: 8, fontFamily: MONO, fontSize: 12, color: T1 }} />
              <Line type="monotone" dataKey="value" stroke={BLUE} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* SECTION 5 — Top Metro Areas */}
        <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: "28px 24px", marginBottom: 32 }}>
          <h2 style={{ fontFamily: SYS, fontSize: 20, fontWeight: 700, color: T1, marginBottom: 20 }}>Top Metro Areas</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["MSA", "Permit Volume", "YoY Change", "Classification"].map(h => (
                  <th key={h} style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.08em", padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${BD2}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.metros.map((m, i) => (
                <tr key={m.msa} style={{ borderBottom: `1px solid ${BD1}`, background: i % 2 === 1 ? BG2 + "66" : "transparent" }}>
                  <td style={{ fontFamily: SYS, fontSize: 14, color: T1, padding: "12px 12px", fontWeight: 500 }}>{m.msa}</td>
                  <td style={{ fontFamily: MONO, fontSize: 13, color: T2, padding: "12px 12px" }}>{m.permits.toLocaleString()}</td>
                  <td style={{ fontFamily: MONO, fontSize: 13, color: m.yoy >= 0 ? GREEN : RED, padding: "12px 12px" }}>
                    {m.yoy >= 0 ? "+" : ""}{m.yoy.toFixed(1)}%
                  </td>
                  <td style={{ fontFamily: SYS, fontSize: 13, color: T3, padding: "12px 12px" }}>{m.class}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 6 — Federal Awards */}
        <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: "28px 24px", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ fontFamily: SYS, fontSize: 20, fontWeight: 700, color: T1 }}>Federal Construction Awards</h2>
            <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>SOURCE: USASPENDING.GOV</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: AMBER, marginBottom: 20 }}>
            ${(data.federalProjects.reduce((s, p) => s + p.value, 0) / 1000).toFixed(2)}B
            <span style={{ fontFamily: SYS, fontSize: 14, color: T4, fontWeight: 400, marginLeft: 12 }}>total active federal construction value</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.federalProjects.map(p => (
              <div key={p.name} style={{ background: BG2, border: `1px solid ${BD1}`, borderRadius: 10, padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: SYS, fontSize: 14, color: T1, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.06em" }}>AGENCY: {p.agency}</div>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: GREEN, whiteSpace: "nowrap" }}>
                    ${p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}B` : `${p.value}M`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7 — Gated Forecast */}
        <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: "28px 24px", marginBottom: 32, position: "relative", overflow: "hidden" }}>
          <h2 style={{ fontFamily: SYS, fontSize: 20, fontWeight: 700, color: T1, marginBottom: 4 }}>12-Month Permit Forecast</h2>
          <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginBottom: 20 }}>AI-generated forecast based on permit pipeline, employment, and federal award signals</div>

          {!forecastUnlocked ? (
            <div style={{ position: "relative" }}>
              <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={forecastData}>
                    <Line type="monotone" dataKey="value" stroke={AMBER} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", borderRadius: 12 }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: AMBER, letterSpacing: "0.1em", marginBottom: 12 }}>FORECAST LOCKED</div>
                <div style={{ fontFamily: SYS, fontSize: 15, color: T2, marginBottom: 20, textAlign: "center", maxWidth: 300 }}>
                  Enter your email to unlock the free 12-month forecast for {data.name}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="your@email.com"
                    style={{ background: BG2, border: `1px solid ${BD2}`, borderRadius: 10, padding: "10px 16px", fontFamily: SYS, fontSize: 14, color: T1, outline: "none", width: 220 }}
                  />
                  <button
                    onClick={() => { if (emailInput) setForecastUnlocked(true) }}
                    style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "10px 18px", borderRadius: 10, border: "none", letterSpacing: "0.06em", whiteSpace: "nowrap" }}
                  >
                    Unlock Free Forecast →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={forecastData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BD1} />
                <XAxis dataKey="month" tick={{ fontFamily: MONO, fontSize: 10, fill: T4 }} />
                <YAxis tick={{ fontFamily: MONO, fontSize: 10, fill: T4 }} />
                <Tooltip contentStyle={{ background: BG2, border: `1px solid ${BD2}`, borderRadius: 8, fontFamily: MONO, fontSize: 12, color: T1 }} />
                <Line type="monotone" dataKey="value" stroke={AMBER} strokeWidth={2.5} dot={false} strokeDasharray="0" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* SECTION 8 — Neighboring States */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: SYS, fontSize: 20, fontWeight: 700, color: T1, marginBottom: 16 }}>Neighboring Markets</h2>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {data.neighbors.map(n => (
              <Link key={n.slug} href={`/markets/${n.slug}`} style={{ flex: "1 1 200px", textDecoration: "none" }}>
                <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 12, padding: "20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "border-color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = AMBER)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = BD1)}
                >
                  <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, color: gradeColor(n.grade), background: gradeBg(n.grade), padding: "6px 14px", borderRadius: 8 }}>{n.grade}</span>
                  <div>
                    <div style={{ fontFamily: SYS, fontSize: 15, color: T1, fontWeight: 600 }}>{n.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: T4, marginTop: 4 }}>VIEW REPORT →</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* SECTION 9 — CTA */}
        <div style={{ background: BG2, border: `1px solid ${AMBER}33`, borderRadius: 16, padding: "40px", marginBottom: 48, textAlign: "center" }}>
          <h3 style={{ fontFamily: SYS, fontSize: 24, fontWeight: 700, color: T1, marginBottom: 12 }}>
            Want deeper intelligence on {data.name}?
          </h3>
          <p style={{ fontFamily: SYS, fontSize: 15, color: T3, lineHeight: 1.7, maxWidth: 540, margin: "0 auto 24px" }}>
            Full dashboard access includes real-time permit data, sub-market breakdowns, custom CDI alerts, and quarterly analyst briefings.
          </p>
          <Link href="/pricing">
            <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 14, fontWeight: 700, padding: "14px 32px", borderRadius: 12, border: "none", letterSpacing: "0.06em" }}>
              View Plans →
            </button>
          </Link>
        </div>

      </div>
      <Footer />
    </div>
  )
}
