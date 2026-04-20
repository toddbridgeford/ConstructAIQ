import { NextResponse } from "next/server"

function buildHistory(base: number, months: number, trend: number, vol: number) {
  const now = new Date(2026, 3, 1)
  const pts = []
  let val = base
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    val = Math.max(0, val + trend + (Math.random() - 0.5) * vol)
    pts.push({ period, value: parseFloat(val.toFixed(1)) })
  }
  return pts
}

const SECTORS = [
  {
    id: "residential",
    label: "Residential",
    color: "#30d158",
    cshi: 72.4,
    classification: "EXPANDING",
    mom_change: 2.1,
    yoy_change: 8.4,
    permits_mom: 3.2,
    employment_k: 3_240,
    employment_mom: 1.4,
    backlog_months: 8.2,
    etf: "ITB",
    etf_ytd: 11.2,
    risk_score: 28,
    top_markets: ["Austin", "Phoenix", "Tampa"],
    history: buildHistory(65, 24, 0.35, 3.5),
  },
  {
    id: "commercial",
    label: "Commercial",
    color: "#0a84ff",
    cshi: 58.6,
    classification: "NEUTRAL",
    mom_change: 0.4,
    yoy_change: 2.1,
    permits_mom: -0.8,
    employment_k: 1_820,
    employment_mom: 0.2,
    backlog_months: 5.9,
    etf: "VNQ",
    etf_ytd: 3.4,
    risk_score: 44,
    top_markets: ["Dallas", "Atlanta", "Denver"],
    history: buildHistory(56, 24, 0.12, 2.8),
  },
  {
    id: "industrial",
    label: "Industrial",
    color: "#f5a623",
    cshi: 81.2,
    classification: "EXPANDING",
    mom_change: 3.4,
    yoy_change: 14.8,
    permits_mom: 5.6,
    employment_k: 980,
    employment_mom: 2.1,
    backlog_months: 11.4,
    etf: "PAVE",
    etf_ytd: 18.7,
    risk_score: 18,
    top_markets: ["Columbus", "Indianapolis", "Memphis"],
    history: buildHistory(60, 24, 0.9, 4.2),
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    color: "#5e5ce6",
    cshi: 76.8,
    classification: "EXPANDING",
    mom_change: 1.8,
    yoy_change: 9.2,
    permits_mom: 2.1,
    employment_k: 1_450,
    employment_mom: 0.9,
    backlog_months: 14.2,
    etf: "PAVE",
    etf_ytd: 18.7,
    risk_score: 22,
    top_markets: ["Houston", "Chicago", "Los Angeles"],
    history: buildHistory(63, 24, 0.55, 2.2),
  },
  {
    id: "healthcare",
    label: "Healthcare",
    color: "#ff375f",
    cshi: 64.1,
    classification: "NEUTRAL",
    mom_change: 0.9,
    yoy_change: 4.8,
    permits_mom: 1.2,
    employment_k: 620,
    employment_mom: 0.4,
    backlog_months: 9.8,
    etf: "VHT",
    etf_ytd: 6.1,
    risk_score: 35,
    top_markets: ["Nashville", "Raleigh", "Salt Lake City"],
    history: buildHistory(60, 24, 0.2, 2.0),
  },
  {
    id: "education",
    label: "Education",
    color: "#64d2ff",
    cshi: 61.4,
    classification: "NEUTRAL",
    mom_change: 0.6,
    yoy_change: 3.1,
    permits_mom: 0.4,
    employment_k: 480,
    employment_mom: 0.1,
    backlog_months: 7.2,
    etf: null,
    etf_ytd: null,
    risk_score: 38,
    top_markets: ["Boston", "Ann Arbor", "Seattle"],
    history: buildHistory(58, 24, 0.15, 1.8),
  },
  {
    id: "energy",
    label: "Energy / Utilities",
    color: "#ffd60a",
    cshi: 69.3,
    classification: "EXPANDING",
    mom_change: 2.8,
    yoy_change: 11.6,
    permits_mom: 3.8,
    employment_k: 760,
    employment_mom: 1.6,
    backlog_months: 12.1,
    etf: "XLE",
    etf_ytd: 14.3,
    risk_score: 25,
    top_markets: ["Houston", "Midland", "Pittsburgh"],
    history: buildHistory(58, 24, 0.6, 5.1),
  },
  {
    id: "multifamily",
    label: "Multifamily",
    color: "#ff9f0a",
    cshi: 54.8,
    classification: "SLOWING",
    mom_change: -1.2,
    yoy_change: -3.4,
    permits_mom: -4.1,
    employment_k: 890,
    employment_mom: -0.6,
    backlog_months: 4.1,
    etf: "REZ",
    etf_ytd: -2.8,
    risk_score: 58,
    top_markets: ["Nashville", "Austin", "Charlotte"],
    history: buildHistory(72, 24, -0.7, 4.8),
  },
  {
    id: "data_centers",
    label: "Data Centers",
    color: "#30d158",
    cshi: 88.4,
    classification: "EXPANDING",
    mom_change: 4.2,
    yoy_change: 22.1,
    permits_mom: 8.4,
    employment_k: 340,
    employment_mom: 3.4,
    backlog_months: 18.6,
    etf: "DCRB",
    etf_ytd: 28.4,
    risk_score: 12,
    top_markets: ["Northern Virginia", "Phoenix", "Dallas"],
    history: buildHistory(50, 24, 1.8, 6.2),
  },
]

const ROTATION_SIGNALS = [
  { from: "Multifamily", to: "Industrial", strength: "STRONG", rationale: "Oversupply in MF; logistics demand structural" },
  { from: "Commercial Office", to: "Data Centers", strength: "STRONG", rationale: "AI infrastructure capex displacing office construction" },
  { from: "Residential", to: "Infrastructure", strength: "MODERATE", rationale: "IIJA spending accelerating; residential peaking" },
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sectors = searchParams.get("sectors")?.split(",").filter(Boolean) ?? []

  const filtered = sectors.length > 0
    ? SECTORS.filter(s => sectors.includes(s.id))
    : SECTORS

  return NextResponse.json({
    sectors: filtered,
    rotation_signals: ROTATION_SIGNALS,
    period: "2026-04",
    generated_at: new Date().toISOString(),
  }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" }
  })
}
