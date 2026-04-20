"use client"
import { useState } from "react"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

type RevenueSignal = "BEAT_LIKELY" | "IN_LINE" | "MISS_RISK"
type MarginSignal = "STABLE" | "MODERATE" | "PRESSURE_HIGH"
type BacklogSignal = "GROWING" | "STABLE" | "SHRINKING"
type SectorFilter = "All" | "Homebuilders" | "Contractors" | "Materials" | "Equipment" | "Distribution"

interface EarningsCompany {
  ticker: string
  name: string
  sector: string
  nextEarningsDate: string
  revenueSignal: RevenueSignal
  marginSignal: MarginSignal
  backlogSignal: BacklogSignal
  regionalExposure: string[]
  revenueSignalColor: string
  marginSignalColor: string
  backlogSignalColor: string
}

interface EarningsCardsProps {
  companies: EarningsCompany[]
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function revenueLabel(s: RevenueSignal): string {
  return s === "BEAT_LIKELY" ? "BEAT LIKELY" : s === "IN_LINE" ? "IN LINE" : "MISS RISK"
}

function marginLabel(s: MarginSignal): string {
  return s === "PRESSURE_HIGH" ? "PRESSURE HIGH" : s
}

function signalBg(c: string): string {
  if (c === color.green) return color.greenDim
  if (c === color.red) return color.redDim
  return color.amberDim
}

const FILTERS: SectorFilter[] = ["All", "Homebuilders", "Contractors", "Materials", "Equipment", "Distribution"]

export function EarningsCards({ companies }: EarningsCardsProps) {
  const [activeFilter, setActiveFilter] = useState<SectorFilter>("All")

  if (!companies || companies.length === 0) {
    return (
      <div style={{ padding: 24, color: color.t4, fontFamily: SYS, fontSize: 14, textAlign: "center" }}>
        No earnings data available.
      </div>
    )
  }

  const filtered = activeFilter === "All"
    ? companies
    : companies.filter((c) => c.sector === activeFilter)

  return (
    <div
      style={{
        background: color.bg2,
        border: `1px solid ${color.bd1}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
          Pre-Earnings Signal Cards
        </div>
        <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1, marginBottom: 12 }}>
          Construction Equity Signals
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: activeFilter === f ? color.amber : "transparent",
                border: `1px solid ${activeFilter === f ? color.amber : color.bd2}`,
                borderRadius: 20,
                padding: "4px 12px",
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 600,
                color: activeFilter === f ? color.bg0 : color.t3,
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: color.t4, fontFamily: SYS, fontSize: 14, textAlign: "center", padding: 24 }}>
          No companies in this sector.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((company) => (
            <div
              key={company.ticker}
              style={{
                background: color.bg3,
                border: `1px solid ${color.bd1}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: color.amber, lineHeight: 1 }}>
                    {company.ticker}
                  </div>
                  <div style={{ fontFamily: SYS, fontSize: 12, color: color.t3, marginTop: 2 }}>{company.name}</div>
                </div>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 600,
                    color: color.blue,
                    background: color.blueDim,
                    borderRadius: 6,
                    padding: "2px 8px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {company.sector}
                </span>
              </div>

              <div style={{ fontFamily: SYS, fontSize: 11, color: color.t4, marginBottom: 10 }}>
                Next Earnings:{" "}
                <span style={{ color: color.t2, fontWeight: 500 }}>{formatDate(company.nextEarningsDate)}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {[
                  { label: "Revenue", signal: revenueLabel(company.revenueSignal), c: company.revenueSignalColor },
                  { label: "Margin", signal: marginLabel(company.marginSignal), c: company.marginSignalColor },
                  { label: "Backlog", signal: company.backlogSignal, c: company.backlogSignalColor },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: SYS, fontSize: 12, color: color.t3 }}>{row.label}</span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        fontWeight: 700,
                        color: row.c,
                        background: signalBg(row.c),
                        borderRadius: 6,
                        padding: "2px 8px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {row.signal}
                    </span>
                  </div>
                ))}
              </div>

              {company.regionalExposure && company.regionalExposure.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {company.regionalExposure.map((state) => (
                    <span
                      key={state}
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        color: color.t4,
                        background: color.bg4,
                        borderRadius: 4,
                        padding: "2px 6px",
                      }}
                    >
                      {state}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
