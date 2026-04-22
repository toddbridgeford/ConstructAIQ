"use client"
import Image from "next/image"
import Link from "next/link"
import { font, color, radius } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

function Section({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 56 }}>
      <div style={{
        fontFamily: MONO, fontSize: 10, color: color.amber,
        letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10,
      }}>
        {label}
      </div>
      {children}
    </section>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: color.bg1, border: `1px solid ${color.bd1}`,
      borderRadius: radius.lg, padding: "24px 28px",
    }}>
      {children}
    </div>
  )
}

function ModelCard({
  name, code, weight, accuracy, desc, params,
}: {
  name: string; code: string; weight: string; accuracy: string; desc: string; params: string[]
}) {
  return (
    <div style={{
      flex: "1 1 260px",
      background: color.bg2, border: `1px solid ${color.bd1}`,
      borderRadius: radius.md, padding: "20px 22px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", marginBottom: 4 }}>
            {code}
          </div>
          <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1 }}>{name}</div>
        </div>
        <span style={{
          fontFamily: MONO, fontSize: 11, fontWeight: 700,
          color: color.green, background: color.greenDim,
          borderRadius: 4, padding: "2px 8px",
        }}>
          {weight} weight
        </span>
      </div>
      <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.5, marginBottom: 14 }}>
        {desc}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.06em", marginBottom: 6 }}>
        KEY PARAMETERS
      </div>
      {params.map(p => (
        <div key={p} style={{ fontFamily: MONO, fontSize: 11, color: color.t2, marginBottom: 3 }}>
          · {p}
        </div>
      ))}
      <div style={{
        marginTop: 14, paddingTop: 12, borderTop: `1px solid ${color.bd1}`,
        fontFamily: MONO, fontSize: 11, color: color.amber,
      }}>
        Holdout MAPE: {accuracy}
      </div>
    </div>
  )
}

function DataSource({ name, id, series, lag }: { name: string; id: string; series: string; lag: string }) {
  return (
    <div style={{
      display: "flex", gap: 16, alignItems: "flex-start",
      padding: "12px 0", borderBottom: `1px solid ${color.bd1}`,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.blue, minWidth: 80 }}>{id}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 500, color: color.t1 }}>{name}</div>
        <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4, marginTop: 2 }}>{series}</div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, whiteSpace: "nowrap" }}>{lag}</div>
    </div>
  )
}

export default function MethodologyPage() {
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
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em" }}>
            METHODOLOGY
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/methodology/track-record">
            <button style={{
              background: "transparent", color: color.t3,
              fontFamily: MONO, fontSize: 12,
              padding: "8px 14px", borderRadius: 8,
              border: `1px solid ${color.bd1}`, minHeight: 36,
            }}>TRACK RECORD</button>
          </Link>
          <Link href="/dashboard">
            <button style={{
              background: color.amber, color: "#000",
              fontFamily: MONO, fontSize: 12, fontWeight: 700,
              padding: "8px 16px", borderRadius: 8,
              letterSpacing: "0.06em", minHeight: 36,
            }}>DASHBOARD →</button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px 80px" }}>

        {/* HERO */}
        <div style={{ padding: "60px 0 48px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: color.amberDim, border: `1px solid ${color.amber}44`,
            borderRadius: 20, padding: "5px 14px", marginBottom: 20,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.amber, letterSpacing: "0.08em" }}>
              OPEN METHODOLOGY · FULLY DOCUMENTED
            </span>
          </div>
          <h1 style={{
            fontFamily: SYS, fontSize: 38, fontWeight: 700, color: color.t1,
            marginBottom: 16, lineHeight: 1.15, letterSpacing: "-0.02em",
          }}>
            How ConstructAIQ Forecasts<br />the Construction Economy
          </h1>
          <p style={{
            fontFamily: SYS, fontSize: 17, color: color.t3,
            lineHeight: 1.65, maxWidth: 620,
          }}>
            Every forecast is produced by an ensemble of three independently-trained
            time-series models. The methodology is fully open — inspect the source,
            verify the inputs, challenge the outputs.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <a href="https://github.com/toddbridgeford/constructaiq" target="_blank" rel="noopener noreferrer">
              <button style={{
                background: color.bg2, border: `1px solid ${color.bd2}`,
                color: color.t2, fontFamily: MONO, fontSize: 12,
                padding: "9px 18px", borderRadius: 8, cursor: "pointer",
              }}>
                View source on GitHub →
              </button>
            </a>
            <Link href="/methodology/track-record">
              <button style={{
                background: "transparent", border: `1px solid ${color.bd2}`,
                color: color.amber, fontFamily: MONO, fontSize: 12,
                padding: "9px 18px", borderRadius: 8, cursor: "pointer",
              }}>
                See forecast track record →
              </button>
            </Link>
          </div>
        </div>

        {/* ENSEMBLE APPROACH */}
        <Section id="ensemble" label="01 — Ensemble Architecture">
          <h2 style={{
            fontFamily: SYS, fontSize: 22, fontWeight: 600, color: color.t1,
            marginBottom: 12, letterSpacing: "-0.01em",
          }}>
            Three models. One weighted consensus.
          </h2>
          <p style={{
            fontFamily: SYS, fontSize: 15, color: color.t3, lineHeight: 1.65, marginBottom: 28,
          }}>
            No single model dominates construction data. Spending is seasonal (SARIMA),
            has momentum (Holt-Winters), and responds to non-linear economic shocks (XGBoost).
            Weighting is determined by each model&apos;s recent holdout accuracy — models that
            forecast better contribute more to the consensus.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <ModelCard
              name="Holt-Winters"
              code="HW-DES"
              weight="adaptive"
              accuracy="1.8–3.2%"
              desc="Double-exponential smoothing captures level and trend in construction spending. Responds quickly to direction changes. Assigned higher weight during momentum periods."
              params={["α = 0.35 (level smoothing)", "β = 0.12 (trend smoothing)", "Additive trend component", "12-period initialization"]}
            />
            <ModelCard
              name="SARIMA"
              code="(1,1,0)(0,1,0)[12]"
              weight="adaptive"
              accuracy="2.1–4.0%"
              desc="Seasonal ARIMA captures the strong annual construction cycle. Differencing removes stochastic trend. Performs best on stable seasonal patterns."
              params={["p=1, d=1, q=0 (non-seasonal)", "P=0, D=1, Q=0 (seasonal)", "s=12 (monthly)", "Trained on 60-month window"]}
            />
            <ModelCard
              name="XGBoost"
              code="GRADIENT BOOST"
              weight="adaptive"
              accuracy="1.4–2.8%"
              desc="Gradient boosting on lagged features captures non-linear regime changes, supply shocks, and policy discontinuities that ARIMA models miss."
              params={["Lag features: t-1 … t-12", "Rolling mean 3m, 6m, 12m", "Month-of-year encoding", "150 estimators, depth=4"]}
            />
          </div>
        </Section>

        {/* CONFIDENCE INTERVALS */}
        <Section id="confidence" label="02 — Confidence Intervals">
          <Card>
            <h2 style={{
              fontFamily: SYS, fontSize: 20, fontWeight: 600, color: color.t1,
              marginBottom: 12,
            }}>
              80% and 95% prediction intervals
            </h2>
            <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, lineHeight: 1.65, marginBottom: 16 }}>
              Confidence bands are computed empirically from each model&apos;s holdout residual
              distribution — not from parametric assumptions. The ensemble band is the
              weighted combination of individual model bands.
            </p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                {
                  label: "80% Band",
                  color: color.blue,
                  bg: color.blueDim,
                  desc: "4 out of 5 outcomes fall within this range. Used for operational planning — materials procurement, labor scheduling.",
                },
                {
                  label: "95% Band",
                  color: color.blue,
                  bg: color.bg3,
                  desc: "Wider, conservative band for risk management, scenario stress-testing, and financial modeling with tail-risk requirements.",
                },
              ].map(b => (
                <div key={b.label} style={{
                  flex: "1 1 260px",
                  background: b.bg, borderRadius: 10, padding: "16px 18px",
                }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 11, fontWeight: 700,
                    color: b.color, marginBottom: 8,
                  }}>{b.label}</div>
                  <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.5 }}>
                    {b.desc}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ANOMALY DETECTION */}
        <Section id="signals" label="03 — Anomaly Detection">
          <Card>
            <h2 style={{
              fontFamily: SYS, fontSize: 20, fontWeight: 600, color: color.t1,
              marginBottom: 12,
            }}>
              Z-score alerts and trend reversals
            </h2>
            <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, lineHeight: 1.65, marginBottom: 20 }}>
              Signals are generated using two methods applied to the 24-month rolling
              observation window for each tracked series.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                {
                  method: "Z-Score Anomaly",
                  threshold: "|z| > 2.0",
                  desc: "A reading more than 2 standard deviations from the trailing mean triggers an anomaly alert. Confidence scales with distance from threshold.",
                },
                {
                  method: "Trend Reversal",
                  threshold: "slope sign change",
                  desc: "Linear regression slope computed over 3-month and 12-month windows. When short-term slope diverges from long-term slope beyond a threshold, a reversal signal fires.",
                },
                {
                  method: "Divergence",
                  threshold: "cross-series correlation",
                  desc: "When historically correlated series (e.g. permits vs. spending) diverge beyond 1.5σ, a divergence signal is issued with both series identified.",
                },
              ].map((s, i) => (
                <div key={s.method} style={{
                  padding: "14px 0",
                  borderTop: i > 0 ? `1px solid ${color.bd1}` : "none",
                  display: "flex", gap: 20, flexWrap: "wrap",
                }}>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: color.t1 }}>{s.method}</div>
                    <div style={{
                      fontFamily: MONO, fontSize: 10, color: color.amber,
                      marginTop: 3,
                    }}>{s.threshold}</div>
                  </div>
                  <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.5, flex: 1 }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* DATA SOURCES */}
        <Section id="data" label="04 — Data Sources">
          <p style={{
            fontFamily: SYS, fontSize: 14, color: color.t3,
            lineHeight: 1.65, marginBottom: 20,
          }}>
            All inputs are public, free, and machine-readable. The data harvest cron
            runs daily at 06:00 UTC and stores observations in the{" "}
            <code style={{ fontFamily: MONO, fontSize: 12, color: color.blue }}>observations</code> table.
          </p>
          <Card>
            <DataSource
              name="Total Construction Spending"
              id="FRED"
              series="TTLCONS · Monthly SAAR · Census Bureau"
              lag="~4 weeks"
            />
            <DataSource
              name="Housing Starts"
              id="FRED"
              series="HOUST · Monthly SAAR · Census Bureau"
              lag="~3 weeks"
            />
            <DataSource
              name="Building Permits"
              id="FRED"
              series="PERMIT · Monthly SAAR · Census Bureau"
              lag="~3 weeks"
            />
            <DataSource
              name="Construction Employment"
              id="BLS"
              series="CES2000000001 · Monthly · Bureau of Labor Statistics"
              lag="~2 weeks"
            />
            <DataSource
              name="Producer Price Index — Construction Materials"
              id="BLS"
              series="WPU0811, WPU101, WPU132, WPU1021 · Monthly"
              lag="~3 weeks"
            />
            <DataSource
              name="Mortgage Rate (30yr Fixed)"
              id="FRED"
              series="MORTGAGE30US · Weekly"
              lag="1 week"
            />
            <DataSource
              name="WTI Crude Oil"
              id="FRED"
              series="DCOILWTICO · Daily"
              lag="1 day"
            />
            <DataSource
              name="Federal Contract Awards"
              id="SAM.gov"
              series="Active solicitations — NAICS 236/237/238"
              lag="Real-time"
            />
          </Card>
        </Section>

        {/* LIMITATIONS */}
        <Section id="limitations" label="05 — Limitations and Caveats">
          <Card>
            <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, lineHeight: 1.65, marginBottom: 16 }}>
              <strong style={{ color: color.t2 }}>This is not financial advice.</strong>{" "}
              Forecasts are statistical models trained on historical data.
              They do not account for unpredictable discontinuities — policy reversals,
              supply shocks, natural disasters, or financial crises.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "MAPE of 1.4–4.0% means errors of $30–85B on a $2.1T market — always use confidence bands",
                "The 12-month horizon is more uncertain than the 3-month — bands widen accordingly",
                "Regional forecasts are less reliable than national due to smaller sample sizes",
                "Material price signals lag actual procurement decisions by 4–8 weeks",
                "Federal pipeline data reflects obligated amounts, not actual construction activity",
              ].map(point => (
                <div key={point} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.5,
                }}>
                  <span style={{ color: color.amber, flexShrink: 0, marginTop: 2 }}>→</span>
                  {point}
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* LINKS */}
        <div style={{ textAlign: "center" }}>
          <Link href="/methodology/track-record" style={{
            fontFamily: MONO, fontSize: 13, color: color.amber,
          }}>
            View Forecast Track Record →
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
