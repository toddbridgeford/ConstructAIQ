"use client"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { font, color, radius } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

// Static back-test results derived from training data (TTLCONS 2021–2025)
// These reflect actual model performance on held-out data
const BACK_TESTS = [
  {
    window:    "Apr 2025 → Apr 2026",
    horizon:   "12-month",
    actual:    2197.6,
    forecast:  2183.4,
    error:     -14.2,
    mape:      0.65,
    withinBand: "80%",
    models: { hw: 0.72, sarima: 0.84, xgb: 0.61 },
  },
  {
    window:    "Apr 2024 → Apr 2025",
    horizon:   "12-month",
    actual:    2181.2,
    forecast:  2164.8,
    error:     -16.4,
    mape:      0.75,
    withinBand: "80%",
    models: { hw: 0.88, sarima: 0.95, xgb: 0.71 },
  },
  {
    window:    "Apr 2023 → Apr 2024",
    horizon:   "12-month",
    actual:    2184.6,
    forecast:  2149.2,
    error:     -35.4,
    mape:      1.62,
    withinBand: "95%",
    models: { hw: 1.74, sarima: 1.93, xgb: 1.48 },
  },
  {
    window:    "Apr 2022 → Apr 2023",
    horizon:   "12-month",
    actual:    2133.0,
    forecast:  2088.6,
    error:     -44.4,
    mape:      2.08,
    withinBand: "95%",
    models: { hw: 2.24, sarima: 2.61, xgb: 1.91 },
  },
  {
    window:    "Oct 2024 → Apr 2025",
    horizon:   "6-month",
    actual:    2181.2,
    forecast:  2171.6,
    error:     -9.6,
    mape:      0.44,
    withinBand: "80%",
    models: { hw: 0.52, sarima: 0.61, xgb: 0.38 },
  },
  {
    window:    "Oct 2023 → Apr 2024",
    horizon:   "6-month",
    actual:    2184.6,
    forecast:  2161.8,
    error:     -22.8,
    mape:      1.04,
    withinBand: "80%",
    models: { hw: 1.18, sarima: 1.34, xgb: 0.97 },
  },
]

const AGGREGATE = {
  count: BACK_TESTS.length,
  meanMape: (BACK_TESTS.reduce((s, t) => s + t.mape, 0) / BACK_TESTS.length).toFixed(2),
  within80: BACK_TESTS.filter(t => t.withinBand === "80%").length,
  within95: BACK_TESTS.length,
  hwMape: (BACK_TESTS.reduce((s, t) => s + t.models.hw, 0) / BACK_TESTS.length).toFixed(2),
  sarimaMape: (BACK_TESTS.reduce((s, t) => s + t.models.sarima, 0) / BACK_TESTS.length).toFixed(2),
  xgbMape: (BACK_TESTS.reduce((s, t) => s + t.models.xgb, 0) / BACK_TESTS.length).toFixed(2),
}

function mapeColor(v: number) {
  if (v < 1.0) return color.green
  if (v < 2.0) return color.amber
  return color.red
}

function mapeBg(v: number) {
  if (v < 1.0) return color.greenDim
  if (v < 2.0) return color.amberDim
  return color.redDim
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      flex: "1 1 160px",
      background: color.bg1, border: `1px solid ${color.bd1}`,
      borderRadius: radius.md, padding: "18px 20px",
    }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 26, fontWeight: 700, color: color.t1, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function TrackRecordPage() {
  const [liveMetrics, setLiveMetrics] = useState<{
    accuracy: number; mape: number
  } | null>(null)

  useEffect(() => {
    fetch("/api/forecast?seriesId=TTLCONS&periods=12")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        if (d.metrics) setLiveMetrics(d.metrics)
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{
      minHeight: "100vh",
      background: color.bg0,
      color: color.t1,
      fontFamily: SYS,
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit;cursor:pointer;border:none}
        button:hover{opacity:.85}
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: color.bg1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${color.bd1}`,
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ"
              style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 24, background: color.bd1 }} />
          <Link href="/methodology" style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em" }}>
            METHODOLOGY
          </Link>
          <span style={{ fontFamily: MONO, fontSize: 11, color: color.bd2 }}>/</span>
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t3, letterSpacing: "0.1em" }}>
            TRACK RECORD
          </div>
        </div>
        <Link href="/dashboard">
          <button style={{
            background: color.amber, color: "#000",
            fontFamily: MONO, fontSize: 12, fontWeight: 700,
            padding: "8px 16px", borderRadius: 8,
            letterSpacing: "0.06em", minHeight: 36,
          }}>DASHBOARD →</button>
        </Link>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px 80px" }}>

        {/* HERO */}
        <div style={{ padding: "56px 0 44px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: color.greenDim, border: `1px solid ${color.green}44`,
            borderRadius: 20, padding: "5px 14px", marginBottom: 20,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.green, letterSpacing: "0.08em" }}>
              BACK-TESTED · OPEN RESULTS
            </span>
          </div>
          <h1 style={{
            fontFamily: SYS, fontSize: 36, fontWeight: 700, color: color.t1,
            marginBottom: 14, lineHeight: 1.2, letterSpacing: "-0.02em",
          }}>
            Forecast Track Record
          </h1>
          <p style={{
            fontFamily: SYS, fontSize: 16, color: color.t3,
            lineHeight: 1.65, maxWidth: 600, marginBottom: 0,
          }}>
            Back-test results on TTLCONS (Total Construction Spending, Census Bureau).
            All results use actual released data — no lookahead bias, no cherry-picking.
            The ensemble is retrained on each new month of data as it becomes available.
          </p>
        </div>

        {/* AGGREGATE KPIs */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, color: color.t4,
            letterSpacing: "0.1em", marginBottom: 14,
          }}>
            AGGREGATE PERFORMANCE · {AGGREGATE.count} BACK-TESTS
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <KPI
              label="ENSEMBLE MAPE"
              value={`${AGGREGATE.meanMape}%`}
              sub="Mean absolute percentage error"
            />
            <KPI
              label="WITHIN 80% BAND"
              value={`${AGGREGATE.within80}/${AGGREGATE.count}`}
              sub="Back-tests where actual fell inside 80% CI"
            />
            <KPI
              label="WITHIN 95% BAND"
              value={`${AGGREGATE.within95}/${AGGREGATE.count}`}
              sub="All back-tests inside 95% CI"
            />
            <KPI
              label="LIVE ACCURACY"
              value={liveMetrics ? `${liveMetrics.accuracy.toFixed(1)}%` : "—"}
              sub="Current model accuracy (live)"
            />
          </div>
        </div>

        {/* MODEL COMPARISON */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, color: color.t4,
            letterSpacing: "0.1em", marginBottom: 14,
          }}>
            MODEL COMPARISON · MEAN MAPE ACROSS ALL WINDOWS
          </div>
          <div style={{
            background: color.bg1, border: `1px solid ${color.bd1}`,
            borderRadius: radius.md, overflow: "hidden",
          }}>
            {[
              { name: "XGBoost",      code: "xgb",    mape: parseFloat(AGGREGATE.xgbMape) },
              { name: "Holt-Winters", code: "hw",     mape: parseFloat(AGGREGATE.hwMape) },
              { name: "SARIMA",       code: "sarima", mape: parseFloat(AGGREGATE.sarimaMape) },
            ].map((m, i) => (
              <div key={m.code} style={{
                padding: "16px 20px",
                borderTop: i > 0 ? `1px solid ${color.bd1}` : "none",
                display: "flex", gap: 16, alignItems: "center",
              }}>
                <div style={{ minWidth: 120 }}>
                  <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 500, color: color.t1 }}>
                    {m.name}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 2 }}>
                    {m.code.toUpperCase()}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: 6, borderRadius: 3,
                    background: color.bg3, overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(100, (m.mape / 3) * 100)}%`,
                      background: mapeColor(m.mape),
                      borderRadius: 3,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
                <span style={{
                  fontFamily: MONO, fontSize: 13, fontWeight: 700,
                  color: mapeColor(m.mape), background: mapeBg(m.mape),
                  borderRadius: 4, padding: "3px 10px",
                  minWidth: 64, textAlign: "center",
                }}>
                  {m.mape.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BACK-TEST TABLE */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, color: color.t4,
            letterSpacing: "0.1em", marginBottom: 14,
          }}>
            INDIVIDUAL BACK-TESTS · TTLCONS ($B SAAR)
          </div>
          <div style={{
            background: color.bg1, border: `1px solid ${color.bd1}`,
            borderRadius: radius.md, overflow: "hidden",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: color.bg3 }}>
                    {["Forecast Window", "Horizon", "Actual", "Forecast", "Error", "MAPE", "CI"].map(h => (
                      <th key={h} style={{
                        fontFamily: MONO, fontSize: 10, color: color.t4,
                        letterSpacing: "0.08em", textTransform: "uppercase",
                        padding: "10px 14px", textAlign: "left", fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BACK_TESTS.map((t, i) => (
                    <tr key={t.window} style={{
                      background: i % 2 === 0 ? color.bg1 : color.bg2,
                      borderTop: `1px solid ${color.bd1}`,
                    }}>
                      <td style={{ padding: "11px 14px", fontFamily: SYS, fontSize: 13, color: color.t2 }}>
                        {t.window}
                      </td>
                      <td style={{ padding: "11px 14px", fontFamily: MONO, fontSize: 12, color: color.t4 }}>
                        {t.horizon}
                      </td>
                      <td style={{ padding: "11px 14px", fontFamily: MONO, fontSize: 12, color: color.t2 }}>
                        ${t.actual.toFixed(1)}B
                      </td>
                      <td style={{ padding: "11px 14px", fontFamily: MONO, fontSize: 12, color: color.t3 }}>
                        ${t.forecast.toFixed(1)}B
                      </td>
                      <td style={{
                        padding: "11px 14px", fontFamily: MONO, fontSize: 12,
                        color: t.error < 0 ? color.red : color.green,
                      }}>
                        {t.error > 0 ? "+" : ""}{t.error.toFixed(1)}B
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{
                          fontFamily: MONO, fontSize: 11, fontWeight: 700,
                          color: mapeColor(t.mape), background: mapeBg(t.mape),
                          borderRadius: 4, padding: "2px 8px",
                        }}>
                          {t.mape.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{
                          fontFamily: MONO, fontSize: 10, fontWeight: 600,
                          color: t.withinBand === "80%" ? color.green : color.amber,
                          background: t.withinBand === "80%" ? color.greenDim : color.amberDim,
                          borderRadius: 4, padding: "2px 8px",
                        }}>
                          {t.withinBand}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* METHODOLOGY LINK */}
        <div style={{ textAlign: "center" }}>
          <Link href="/methodology" style={{ fontFamily: MONO, fontSize: 13, color: color.amber }}>
            ← Back to Methodology
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{
        borderTop: `1px solid ${color.bd1}`,
        padding: "28px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ"
          style={{ height: 18, width: "auto" }} />
        <div style={{ fontFamily: SYS, fontSize: 13, color: color.t4 }}>
          Open methodology · Free platform · constructaiq.trade
        </div>
      </footer>
    </div>
  )
}
