"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { color, font, radius, TAP } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

// ── Types ─────────────────────────────────────────────────────────────────────

interface CostResult {
  building_type: string
  sqft:          number
  region:        string
  cost_per_sqft: { low: number; mid: number; high: number }
  total_cost:    { low: number; mid: number; high: number }
  cost_drivers: {
    material_inflation: string
    labor_adjustment:   string
    dominant_driver:    string
    inputs: { name: string; pct_since_2020: number }[]
  }
  inflation_vs_2020: { materials_pct: number; labor_pct: number }
  as_of: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BUILDING_TYPES = [
  { id: "office",      label: "Office"        },
  { id: "warehouse",   label: "Warehouse"     },
  { id: "multifamily", label: "Multifamily"   },
  { id: "industrial",  label: "Industrial"    },
  { id: "healthcare",  label: "Healthcare"    },
  { id: "retail",      label: "Retail"        },
  { id: "education",   label: "Education"     },
  { id: "hotel",       label: "Hotel"         },
]

const SQFT_PRESETS = [
  { label: "10K",  value: 10_000  },
  { label: "50K",  value: 50_000  },
  { label: "100K", value: 100_000 },
  { label: "250K", value: 250_000 },
  { label: "500K", value: 500_000 },
]

const REGIONS = [
  { value: "northeast", label: "Northeast  (+15%)"  },
  { value: "west",      label: "West  (+12%)"       },
  { value: "midwest",   label: "Midwest  (baseline)" },
  { value: "south",     label: "South  (−8%)"        },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtM(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

function pctColor(pct: number): string {
  if (pct > 15)  return color.red
  if (pct > 5)   return color.amber
  if (pct < -5)  return color.green
  return color.t3
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CostCard({ label, psf, total, accent }: { label: string; psf: number; total: number; accent: string }) {
  return (
    <div style={{
      flex:          "1 1 180px",
      background:    color.bg1,
      border:        `1px solid ${color.bd1}`,
      borderRadius:  radius.xl,
      padding:       "20px 20px 16px",
      display:       "flex",
      flexDirection: "column",
      gap:           6,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.12em" }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 38, fontWeight: 700, color: accent, letterSpacing: "-0.04em", lineHeight: 1 }}>
        ${psf}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4 }}>per sq ft</div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${color.bd1}` }}>
        <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1 }}>
          {fmtM(total)}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>total project</div>
      </div>
    </div>
  )
}

function DriverBar({ name, pct }: { name: string; pct: number }) {
  const barW = Math.min(100, Math.abs(pct) * 2)
  const col  = pctColor(pct)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 140, fontFamily: SYS, fontSize: 12, color: color.t3, flexShrink: 0 }}>
        {name}
      </div>
      <div style={{ flex: 1, height: 4, background: color.bg3, borderRadius: 2, position: "relative" }}>
        <div style={{
          position:     "absolute",
          left:         0,
          top:          0,
          height:       "100%",
          width:        `${barW}%`,
          background:   col,
          borderRadius: 2,
        }} />
      </div>
      <div style={{
        width:      56,
        fontFamily: MONO,
        fontSize:   12,
        color:      col,
        fontWeight: 600,
        textAlign:  "right",
        flexShrink: 0,
      }}>
        {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CostEstimatePage() {
  const [buildingType, setBuildingType] = useState("office")
  const [sqft,         setSqft]         = useState(100_000)
  const [sqftInput,    setSqftInput]    = useState("100000")
  const [region,       setRegion]       = useState("midwest")
  const [result,       setResult]       = useState<CostResult | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  async function calculate() {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/cost-benchmark?type=${buildingType}&sqft=${sqft}&region=${region}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Calculation failed")
      setResult(await res.json())
    } catch {
      setError("Could not calculate — try again.")
    } finally {
      setLoading(false)
    }
  }

  function onSqftChange(val: string) {
    setSqftInput(val)
    const n = parseInt(val.replace(/,/g, ""))
    if (!isNaN(n) && n > 0) setSqft(n)
  }

  return (
    <div style={{ background: color.bg0, minHeight: "100vh", fontFamily: SYS }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: color.bg1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${color.bd1}`,
        height: 60, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ"
              style={{ height: 22, width: "auto", display: "block" }} />
          </Link>
          <div style={{ width: 1, height: 18, background: color.bd2 }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em" }}>
            COST BENCHMARKING
          </span>
        </div>
        <Link href="/dashboard">
          <button style={{
            background: color.blue, color: color.t1,
            fontFamily: SYS, fontSize: 13, fontWeight: 600,
            padding: "7px 16px", borderRadius: radius.sm, minHeight: 36, border: "none", cursor: "pointer",
          }}>
            Dashboard →
          </button>
        </Link>
      </nav>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.12em", marginBottom: 12 }}>
            FREE TOOL
          </div>
          <h1 style={{ fontFamily: SYS, fontSize: 36, fontWeight: 700, color: color.t1,
            letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 12 }}>
            Construction Cost Benchmarking
          </h1>
          <p style={{ fontFamily: SYS, fontSize: 15, color: color.t3, lineHeight: 1.65, maxWidth: 560 }}>
            Free cost estimates powered by BLS PPI data.
            Updated monthly when government data releases.
          </p>
        </div>

        {/* Form */}
        <div style={{
          background:   color.bg1,
          border:       `1px solid ${color.bd1}`,
          borderRadius: radius.xl2,
          padding:      "28px 28px 24px",
          marginBottom: 28,
        }}>

          {/* Building type */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>
              BUILDING TYPE
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BUILDING_TYPES.map(bt => {
                const active = bt.id === buildingType
                return (
                  <button
                    key={bt.id}
                    onClick={() => setBuildingType(bt.id)}
                    style={{
                      padding:      "8px 16px",
                      borderRadius: radius.full,
                      border:       `1px solid ${active ? color.blue : color.bd2}`,
                      background:   active ? color.blueDim : color.bg2,
                      color:        active ? color.blue : color.t3,
                      fontFamily:   SYS,
                      fontSize:     13,
                      fontWeight:   active ? 600 : 400,
                      cursor:       "pointer",
                      minHeight:    TAP,
                      transition:   "all 0.15s",
                    }}
                  >
                    {bt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Square footage */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>
              SQUARE FOOTAGE
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                inputMode="numeric"
                value={sqftInput}
                onChange={e => onSqftChange(e.target.value)}
                style={{
                  background:   color.bg2,
                  border:       `1px solid ${color.bd2}`,
                  borderRadius: radius.md,
                  color:        color.t1,
                  fontFamily:   MONO,
                  fontSize:     15,
                  padding:      "9px 14px",
                  minHeight:    TAP,
                  width:        120,
                  outline:      "none",
                }}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SQFT_PRESETS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setSqft(p.value); setSqftInput(String(p.value)) }}
                    style={{
                      padding:      "7px 12px",
                      borderRadius: radius.sm,
                      border:       `1px solid ${sqft === p.value ? color.blue : color.bd2}`,
                      background:   sqft === p.value ? color.blueDim : color.bg2,
                      color:        sqft === p.value ? color.blue : color.t4,
                      fontFamily:   MONO,
                      fontSize:     12,
                      cursor:       "pointer",
                      minHeight:    TAP,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Region */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>
              REGION
            </label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              style={{
                background:   color.bg2,
                border:       `1px solid ${color.bd2}`,
                borderRadius: radius.md,
                color:        color.t1,
                fontFamily:   SYS,
                fontSize:     14,
                padding:      "9px 14px",
                minHeight:    TAP,
                minWidth:     220,
                outline:      "none",
                cursor:       "pointer",
              }}
            >
              {REGIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Calculate button */}
          <button
            onClick={calculate}
            disabled={loading}
            style={{
              background:   loading ? color.bg3 : color.blue,
              color:        color.t1,
              fontFamily:   SYS,
              fontSize:     15,
              fontWeight:   600,
              padding:      "0 32px",
              borderRadius: radius.md,
              minHeight:    TAP + 4,
              border:       "none",
              cursor:       loading ? "default" : "pointer",
              opacity:      loading ? 0.6 : 1,
              transition:   "opacity 0.15s",
            }}
          >
            {loading ? "Calculating…" : "Calculate"}
          </button>
          {error && (
            <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 12, color: color.red }}>
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Cost cards */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <CostCard label="Conservative"  psf={result.cost_per_sqft.low}  total={result.total_cost.low}  accent={color.green} />
              <CostCard label="Midpoint"      psf={result.cost_per_sqft.mid}  total={result.total_cost.mid}  accent={color.blue}  />
              <CostCard label="Premium"       psf={result.cost_per_sqft.high} total={result.total_cost.high} accent={color.amber} />
            </div>

            {/* Comparison note */}
            <div style={{
              background:   color.bg1,
              border:       `1px solid ${color.bd1}`,
              borderRadius: radius.xl,
              padding:      "18px 20px",
              marginBottom: 16,
            }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 10 }}>
                TODAY VS JAN 2020
              </div>
              <p style={{ fontFamily: SYS, fontSize: 14, color: color.t2, lineHeight: 1.65, margin: 0 }}>
                Materials are{" "}
                <span style={{ color: pctColor(result.inflation_vs_2020.materials_pct), fontWeight: 600 }}>
                  {result.inflation_vs_2020.materials_pct >= 0 ? "+" : ""}{result.inflation_vs_2020.materials_pct.toFixed(1)}%
                </span>{" "}
                more expensive, labor is{" "}
                <span style={{ color: pctColor(result.inflation_vs_2020.labor_pct), fontWeight: 600 }}>
                  {result.inflation_vs_2020.labor_pct >= 0 ? "+" : ""}{result.inflation_vs_2020.labor_pct.toFixed(1)}%
                </span>{" "}
                more expensive in the {result.region} region. Dominant input:{" "}
                <span style={{ color: color.t1, fontWeight: 600 }}>{result.cost_drivers.dominant_driver}</span>.
              </p>
            </div>

            {/* Input driver breakdown */}
            <div style={{
              background:   color.bg1,
              border:       `1px solid ${color.bd1}`,
              borderRadius: radius.xl,
              padding:      "18px 20px",
              marginBottom: 20,
            }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 14 }}>
                INPUT COST DRIVERS — % CHANGE SINCE JAN 2020
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.cost_drivers.inputs.map(inp => (
                  <DriverBar key={inp.name} name={inp.name} pct={inp.pct_since_2020} />
                ))}
              </div>
            </div>

            {/* Data sources */}
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: color.t4, lineHeight: 1.7 }}>
              BLS PPI (lumber, steel, concrete, copper, diesel) · BLS OEWS (labor by region) ·
              Updated monthly on Census C30 and BLS release calendar · Data as of {result.as_of}
            </div>
          </>
        )}

        {/* Disclaimer — always visible */}
        <div style={{
          marginTop:    result ? 20 : 0,
          padding:      "14px 18px",
          background:   color.bg1,
          border:       `1px solid ${color.bd1}`,
          borderRadius: radius.lg,
          marginBottom: 0,
        }}>
          <p style={{ fontFamily: MONO, fontSize: 11, color: color.t4, margin: 0, lineHeight: 1.7 }}>
            These are order-of-magnitude estimates for market intelligence purposes, using BLS Producer
            Price Indices as the input basis. Always verify with a licensed construction estimator
            before committing capital.
          </p>
        </div>

      </main>
    </div>
  )
}
