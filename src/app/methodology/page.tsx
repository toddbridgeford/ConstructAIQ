"use client"
import Link from "next/link"
import Image from "next/image"
import { color, font, radius, type as typeScale } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

// ── Index definitions ────────────────────────────────────────────────────────

const INDICES = [
  {
    abbr: "BOI",
    name: "Backlog Outlook Index",
    question: "Q1: Backlog vs 6 months ago",
    desc: "Measures contractor pipeline health — a leading indicator for near-term construction volume.",
  },
  {
    abbr: "MEI",
    name: "Margin Expectation Index",
    question: "Q2: Margin expectations next 6 months",
    desc: "Tracks profitability pressure across the sector, often reflecting labor and material cost dynamics.",
  },
  {
    abbr: "LAI",
    name: "Labor Availability Index",
    question: "Q3: Labor availability in respondent's market",
    desc: "Captures skilled labor constraints — historically the tightest bottleneck in US construction.",
  },
  {
    abbr: "MOI",
    name: "Market Outlook Index",
    question: "Q5: Overall construction activity outlook",
    desc: "Composite sentiment on near-term construction market direction in the respondent's geography.",
  },
]

// ── Data sources table ───────────────────────────────────────────────────────

const PUBLIC_SERIES = [
  { id: "TTLCONS",       source: "Census Bureau",  desc: "Total Construction Spending (monthly, $B)" },
  { id: "HOUST",         source: "Census Bureau",  desc: "Housing Starts (monthly, 000s units)" },
  { id: "PERMIT",        source: "Census Bureau",  desc: "Building Permits (monthly, 000s units)" },
  { id: "CES2000000001", source: "BLS",            desc: "Construction Employment (monthly, 000s)" },
  { id: "MORTGAGE30US",  source: "Freddie Mac/FRED", desc: "30-Year Fixed Mortgage Rate (%)" },
  { id: "DGS10",         source: "Treasury/FRED",  desc: "10-Year Treasury Yield (%)" },
  { id: "PPI_LUMBER",    source: "BLS PPI",        desc: "Lumber & Wood Products Producer Price Index" },
  { id: "PPI_STEEL",     source: "BLS PPI",        desc: "Steel Mill Products Producer Price Index" },
]

// ── Signal detection ─────────────────────────────────────────────────────────

const SIGNAL_METHODS = [
  {
    method: "Z-Score Anomaly",
    formula: "z = (x − μ₁₂) / σ₁₂",
    threshold: "|z| > 2.0",
    desc: "Flags readings that deviate more than 2 standard deviations from the rolling 12-month mean. Triggers BULLISH or BEARISH depending on direction.",
  },
  {
    method: "Trend Reversal",
    formula: "sign(slope₃) ≠ sign(slope₁₂)",
    threshold: "|slope₃| > 0.25/month",
    desc: "Detects when the 3-month slope reverses the 12-month slope. Requires a minimum slope magnitude to filter noise.",
  },
  {
    method: "Spend/Permit Divergence",
    formula: "ΔSpend(3m) > 0 and ΔPermits(3m) < −8%",
    threshold: "Gap > 8 percentage points",
    desc: "Rising dollar spend with falling permits signals work is more expensive, not more voluminous — a margin compression precursor.",
  },
]

export default function MethodologyPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: color.bg0,
      color: color.t1,
      fontFamily: SYS,
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{font-family:inherit;cursor:pointer;border:none;outline:none}
        @media(max-width:768px){
          .signal-grid{grid-template-columns:1fr!important}
          .index-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: color.bg1 + "ee",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${color.bd1}`,
        height: 60,
        paddingTop: "env(safe-area-inset-top, 0px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ"
              style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 20, background: color.bd1 }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em" }}>
            METHODOLOGY
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard">
            <button style={{
              background: color.blue,
              color: color.t1,
              fontFamily: SYS, fontSize: 13, fontWeight: 600,
              padding: "8px 18px", borderRadius: radius.sm, minHeight: 36,
            }}>
              Dashboard →
            </button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ── Page header ── */}
        <div style={{ paddingTop: 56, paddingBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.12em", marginBottom: 12 }}>
            PLATFORM DOCUMENTATION
          </div>
          <h1 style={{
            ...typeScale.h2,
            fontFamily: SYS,
            color: color.t1,
            marginBottom: 16,
          }}>
            Methodology
          </h1>
          <p style={{
            fontFamily: SYS, fontSize: 16, color: color.t3, lineHeight: 1.65, maxWidth: 640,
          }}>
            How ConstructAIQ collects data, detects signals, computes forecasts, and publishes
            the industry&apos;s only contractor-sourced quarterly intelligence index.
          </p>
        </div>

        {/* ── SECTION: Public Data Sources ── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel label="PUBLIC DATA SOURCES" />
          <h2 style={sectionH2}>Data Harvest Pipeline</h2>
          <p style={bodyP}>
            ConstructAIQ ingests eight government time-series daily via a serverless harvest cron.
            All series are stored in Supabase as monthly observations and used as inputs to the
            forecasting engine, signal detection, and dashboard visualizations.
          </p>
          <div style={{
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.lg,
            overflow: "hidden",
            marginTop: 24,
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${color.bd1}` }}>
                  {["Series ID", "Source", "Description"].map(h => (
                    <th key={h} style={{
                      fontFamily: MONO, fontSize: 10, color: color.t4,
                      letterSpacing: "0.08em", padding: "10px 16px",
                      textAlign: "left", fontWeight: 600,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PUBLIC_SERIES.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < PUBLIC_SERIES.length - 1 ? `1px solid ${color.bd1}` : "none" }}>
                    <td style={{ fontFamily: MONO, fontSize: 12, color: color.amber, padding: "11px 16px" }}>{s.id}</td>
                    <td style={{ fontFamily: SYS, fontSize: 13, color: color.t3, padding: "11px 16px" }}>{s.source}</td>
                    <td style={{ fontFamily: SYS, fontSize: 13, color: color.t2, padding: "11px 16px" }}>{s.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...bodyP, marginTop: 16, fontSize: 13, color: color.t4 }}>
            Harvest runs at 06:00 ET daily. Forecasts recompute after each harvest.
            Series are sourced from the FRED API (Federal Reserve Bank of St. Louis).
          </p>
        </section>

        {/* ── SECTION: Forecasting Engine ── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel label="FORECASTING ENGINE" />
          <h2 style={sectionH2}>Ensemble Forecast Model</h2>
          <p style={bodyP}>
            ConstructAIQ publishes a 12-month ensemble forecast for Total Construction Spending
            (TTLCONS) with 80% and 95% confidence intervals. Three models are combined using
            weighted averaging calibrated on out-of-sample accuracy.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
            {[
              {
                name: "Holt-Winters DES",
                weight: "34%",
                desc: "Double exponential smoothing with trend damping. Optimized α and β parameters. Excels at capturing secular construction cycles.",
              },
              {
                name: "SARIMA(1,1,0)(0,1,0)[12]",
                weight: "33%",
                desc: "Seasonal ARIMA with monthly differencing. Captures 12-month seasonal construction patterns from permit cycles to fiscal year spend.",
              },
              {
                name: "XGBoost Gradient Boosting",
                weight: "33%",
                desc: "Gradient boosting on 14 engineered features: lagged values, rolling statistics, mortgage rates, employment, and seasonal indicators.",
              },
            ].map(m => (
              <div key={m.name} style={{
                background: color.bg1,
                border: `1px solid ${color.bd1}`,
                borderRadius: radius.lg,
                padding: "20px 22px",
                display: "flex", gap: 20, alignItems: "flex-start",
              }}>
                <div style={{
                  fontFamily: MONO, fontSize: 22, fontWeight: 700,
                  color: color.blue, letterSpacing: "-0.02em",
                  minWidth: 52, textAlign: "right", lineHeight: 1,
                  paddingTop: 2,
                }}>
                  {m.weight}
                </div>
                <div>
                  <div style={{ fontFamily: SYS, fontSize: 15, fontWeight: 700, color: color.t1, marginBottom: 6 }}>
                    {m.name}
                  </div>
                  <p style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.6 }}>
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            background: color.blueDim,
            border: `1px solid ${color.blue}33`,
            borderRadius: radius.lg,
            padding: "16px 20px",
            marginTop: 16,
            fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.65,
          }}>
            Confidence intervals are computed via bootstrapped residuals over 1,000 resampled
            forecast paths. The 80% CI represents 1.28σ; the 95% CI represents 1.96σ.
            Model accuracy (MAPE) is recalculated each week against the latest Census release.
          </div>
        </section>

        {/* ── SECTION: Signal Detection ── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel label="SIGNAL DETECTION" />
          <h2 style={sectionH2}>SignalDetect Engine</h2>
          <p style={bodyP}>
            Three rule-based algorithms run over the stored observation series to generate
            BULLISH, BEARISH, and WARNING signals. Signals are ranked by confidence score
            and stored in Supabase with a 1-hour cache.
          </p>
          <div
            className="signal-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}
          >
            {SIGNAL_METHODS.map(m => (
              <div key={m.method} style={{
                background: color.bg1,
                border: `1px solid ${color.bd1}`,
                borderRadius: radius.lg,
                padding: "20px 20px",
              }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: color.amber, letterSpacing: "0.1em", marginBottom: 10 }}>
                  {m.method.toUpperCase()}
                </div>
                <div style={{
                  fontFamily: MONO, fontSize: 13, color: color.green,
                  background: color.greenDim,
                  border: `1px solid ${color.green}33`,
                  borderRadius: radius.sm,
                  padding: "6px 12px",
                  marginBottom: 10,
                  letterSpacing: "0.02em",
                }}>
                  {m.formula}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, marginBottom: 10 }}>
                  Threshold: {m.threshold}
                </div>
                <p style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.6 }}>
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION: Proprietary GC Survey ── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel label="PROPRIETARY SURVEY" />
          <h2 style={sectionH2}>Proprietary GC Survey Methodology</h2>
          <p style={bodyP}>
            The ConstructAIQ Quarterly Survey produces four net score indices sourced directly
            from general contractors, subcontractors, and specialty contractors.
            These indices are not available from any public API.
          </p>

          {/* Net Score Formula */}
          <div style={{
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.xl,
            padding: "28px 28px",
            marginTop: 28,
            marginBottom: 28,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 16 }}>
              NET SCORE COMPUTATION
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 18, color: color.green,
              background: color.greenDim,
              border: `1px solid ${color.green}33`,
              borderRadius: radius.md,
              padding: "14px 20px",
              marginBottom: 16,
              letterSpacing: "0.02em",
            }}>
              Net Score = (% of 4+5 responses − % of 1+2 responses) × 100
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, lineHeight: 1.6 }}>
                <strong style={{ color: color.t2 }}>Scale:</strong>{" "}
                −100 (unanimous negative) to +100 (unanimous positive)
              </p>
              <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, lineHeight: 1.6 }}>
                <strong style={{ color: color.t2 }}>Neutral responses (3)</strong>{" "}
                are excluded from the net calculation. They contribute to the distribution chart
                but do not affect the index score.
              </p>
            </div>
          </div>

          {/* Index definitions table */}
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 16 }}>
            INDEX DEFINITIONS
          </div>
          <div
            className="index-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}
          >
            {INDICES.map(idx => (
              <div key={idx.abbr} style={{
                background: color.bg1,
                border: `1px solid ${color.bd1}`,
                borderRadius: radius.lg,
                padding: "18px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 13, fontWeight: 700,
                    color: color.amber,
                  }}>
                    {idx.abbr}
                  </span>
                  <span style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t1 }}>
                    {idx.name}
                  </span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, marginBottom: 8 }}>
                  {idx.question}
                </div>
                <p style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.55 }}>
                  {idx.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Weighting */}
          <div style={{
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.lg,
            padding: "22px 24px",
            marginBottom: 16,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 12 }}>
              WEIGHTING
            </div>
            <p style={{ fontFamily: SYS, fontSize: 14, color: color.t2, lineHeight: 1.65 }}>
              Responses are weighted by company size and primary work type to correct for
              over-representation of any single segment. Minimum 30 responses required for publication.
            </p>
          </div>

          {/* Timing */}
          <div style={{
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.lg,
            padding: "22px 24px",
            marginBottom: 16,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 12 }}>
              TIMING
            </div>
            <p style={{ fontFamily: SYS, fontSize: 14, color: color.t2, lineHeight: 1.65 }}>
              Survey opens on the 1st of the first month of each quarter
              (January, April, July, October) and closes after 21 days.
              Results publish within 24 hours of the survey closing.
            </p>
          </div>

          {/* Panel composition */}
          <div style={{
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.lg,
            padding: "22px 24px",
          }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 12 }}>
              PANEL COMPOSITION
            </div>
            <p style={{ fontFamily: SYS, fontSize: 14, color: color.t2, lineHeight: 1.65 }}>
              The respondent panel is recruited through contractor association partnerships,
              including AGC, ABC, NRCA, NECA, and SMACNA chapter newsletters. Panel composition
              by work type and region is reported with each quarter&apos;s results.
            </p>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/survey/about">
              <button style={{
                background: "transparent",
                border: `1px solid ${color.bd1}`,
                color: color.t3,
                fontFamily: SYS, fontSize: 13,
                padding: "10px 20px", borderRadius: radius.md, minHeight: 40,
              }}>
                About the Survey →
              </button>
            </Link>
            <Link href="/survey">
              <button style={{
                background: color.amber + "22",
                border: `1px solid ${color.amber}44`,
                color: color.amber,
                fontFamily: SYS, fontSize: 13, fontWeight: 600,
                padding: "10px 20px", borderRadius: radius.md, minHeight: 40,
              }}>
                Take the Survey →
              </button>
            </Link>
          </div>
        </section>

      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: `1px solid ${color.bd1}`,
        padding: "24px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ"
          style={{ height: 18, width: "auto" }} />
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Dashboard",    href: "/dashboard"     },
            { label: "Survey",       href: "/survey/about"  },
            { label: "Results",      href: "/survey/results"},
            { label: "Pricing",      href: "/pricing"       },
            { label: "About",        href: "/about"         },
          ].map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontFamily: SYS, fontSize: 13, color: color.t4 }}>
              {label}
            </Link>
          ))}
        </div>
        <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4 }}>© 2026 ConstructAIQ</div>
      </footer>
    </div>
  )
}

// ── shared micro-components ──────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, color: color.t4,
      letterSpacing: "0.12em", marginBottom: 12,
    }}>
      {label}
    </div>
  )
}

const sectionH2: React.CSSProperties = {
  fontFamily: font.sys,
  fontSize: 22, fontWeight: 700,
  color: color.t1, marginBottom: 14,
  letterSpacing: "-0.025em",
}

const bodyP: React.CSSProperties = {
  fontFamily: font.sys,
  fontSize: 14, color: color.t3, lineHeight: 1.68,
}
