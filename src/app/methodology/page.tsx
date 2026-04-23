"use client"
import Link from "next/link"
import Image from "next/image"
import { color, font, radius, type as typeScale } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

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

        {/* ── SECTION: Cost Benchmarking Methodology ── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel label="COST BENCHMARKING" />
          <h2 style={sectionH2}>Construction Cost Benchmarking Methodology</h2>
          <p style={bodyP}>
            Cost estimates are computed using BLS Producer Price Index readings for six input
            categories (lumber, steel, concrete, copper wire, diesel, and labor) weighted by their
            typical share of total project cost for each building type. The January 2020 baseline
            was calibrated against RSMeans published cost ranges for that period. Regional adjustments
            reflect BLS Occupational Employment and Wage Statistics (OEWS) for construction occupations
            by Census region.
          </p>
          <p style={{ ...bodyP, marginTop: 14 }}>
            These are market intelligence estimates, not project budgets. Always verify with a licensed
            estimator before committing capital.
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
                  {["Input", "BLS Series", "Weight Range", "Source"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", fontFamily: MONO, fontSize: 9,
                      color: color.t4, fontWeight: 600, letterSpacing: "0.1em",
                      textAlign: "left", background: color.bg1,
                    }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Lumber & Wood",      "WPU0811",  "3–20%",  "BLS PPI"],
                  ["Steel Mill Products","WPU101",   "10–35%", "BLS PPI"],
                  ["Ready-Mix Concrete", "WPU132",   "15–22%", "BLS PPI"],
                  ["Copper Wire",        "WPU1021",  "5–15%",  "BLS PPI"],
                  ["Diesel Fuel",        "WPU0561",  "5–10%",  "BLS PPI"],
                  ["Construction Labor", "OEWS 47-0000","30–44%","BLS OEWS"],
                ].map(([input, series, weight, src]) => (
                  <tr key={input} style={{ borderBottom: `1px solid ${color.bd1}` }}>
                    <td style={{ padding: "9px 14px", fontFamily: SYS, fontSize: 13, color: color.t2 }}>{input}</td>
                    <td style={{ padding: "9px 14px", fontFamily: MONO, fontSize: 12, color: color.t3 }}>{series}</td>
                    <td style={{ padding: "9px 14px", fontFamily: MONO, fontSize: 12, color: color.t3 }}>{weight}</td>
                    <td style={{ padding: "9px 14px", fontFamily: MONO, fontSize: 12, color: color.t4 }}>{src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/cost-estimate">
              <button style={{
                background: color.blue, color: color.t1,
                fontFamily: SYS, fontSize: 13, fontWeight: 600,
                padding: "9px 18px", borderRadius: radius.md, minHeight: 40, border: "none", cursor: "pointer",
              }}>
                Open Cost Calculator →
              </button>
            </Link>
          </div>
        </section>

        {/* ── SECTION: City Permit Intelligence ── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel label="CITY PERMIT INTELLIGENCE" />
          <h2 style={sectionH2}>Building Permit Data — 26 Cities</h2>
          <p style={bodyP}>
            ConstructAIQ ingests building permit data from 26 municipal open data portals via
            Socrata APIs. Permits are normalized to a unified schema, classified by type
            (new construction, alteration, addition, demolition) and class (residential,
            commercial, industrial), and aggregated into monthly counts and valuations per city.
            Each city&apos;s dataset is harvested daily with a 180-day lookback window.
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
                  {["Code", "City", "State", "MSA", "Portal"].map(h => (
                    <th key={h} style={{
                      fontFamily: MONO, fontSize: 10, color: color.t4,
                      letterSpacing: "0.08em", padding: "10px 14px",
                      textAlign: "left", fontWeight: 600,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["NYC", "New York City",  "NY", "NYC", "data.cityofnewyork.us"],
                  ["LAX", "Los Angeles",    "CA", "LAX", "data.lacity.org"],
                  ["CHI", "Chicago",        "IL", "CHI", "data.cityofchicago.org"],
                  ["HOU", "Houston",        "TX", "HOU", "opendata.houstontx.gov"],
                  ["PHX", "Phoenix",        "AZ", "PHX", "phoenixopendata.com"],
                  ["SAN", "San Antonio",    "TX", "SAN", "data.sanantonio.gov"],
                  ["DAL", "Dallas",         "TX", "DFW", "dallasopendata.com"],
                  ["JAX", "Jacksonville",   "FL", "JAX", "data.coj.net"],
                  ["AUS", "Austin",         "TX", "AUS", "data.austintexas.gov"],
                  ["COL", "Columbus",       "OH", "COL", "opendata.columbus.gov"],
                  ["IND", "Indianapolis",   "IN", "IND", "data.indy.gov"],
                  ["SJC", "San Jose",       "CA", "SJC", "data.sanjoseca.gov"],
                  ["SEA", "Seattle",        "WA", "SEA", "data.seattle.gov"],
                  ["DEN", "Denver",         "CO", "DEN", "denvergov.org"],
                  ["NSH", "Nashville",      "TN", "NSH", "data.nashville.gov"],
                  ["CLT", "Charlotte",      "NC", "CLT", "data.charlottenc.gov"],
                  ["TPA", "Tampa",          "FL", "TPA", "data.tampagov.net"],
                  ["ATL", "Atlanta",        "GA", "ATL", "opendata.atlantaga.gov"],
                  ["MIA", "Miami",          "FL", "MIA", "opendata.miamidade.gov"],
                  ["POR", "Portland",       "OR", "POR", "opendata.portland.gov"],
                  ["MIN", "Minneapolis",    "MN", "MSP", "opendata.minneapolismn.gov"],
                  ["STL", "St. Louis",      "MO", "STL", "stlouis-mo.gov"],
                  ["KCY", "Kansas City",    "MO", "KCY", "data.kcmo.org"],
                  ["ORL", "Orlando",        "FL", "ORL", "data.cityoforlando.net"],
                  ["LVG", "Las Vegas",      "NV", "LAS", "opendata.lasvegasnevada.gov"],
                  ["RAL", "Raleigh",        "NC", "RAL", "data.raleighnc.gov"],
                ].map(([code, city, state, msa, portal], i, arr) => (
                  <tr key={code} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${color.bd1}` : "none" }}>
                    <td style={{ fontFamily: MONO, fontSize: 12, color: color.amber, padding: "9px 14px" }}>{code}</td>
                    <td style={{ fontFamily: SYS, fontSize: 13, color: color.t2, padding: "9px 14px" }}>{city}</td>
                    <td style={{ fontFamily: MONO, fontSize: 12, color: color.t3, padding: "9px 14px" }}>{state}</td>
                    <td style={{ fontFamily: MONO, fontSize: 12, color: color.t3, padding: "9px 14px" }}>{msa}</td>
                    <td style={{ fontFamily: MONO, fontSize: 11, color: color.t4, padding: "9px 14px" }}>{portal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...bodyP, marginTop: 16, fontSize: 13, color: color.t4 }}>
            Cities with non-standard Socrata column names have explicit field maps in the
            normalization layer. Cities using the DEFAULT schema require no custom mapping.
            Failed harvests are logged as degraded — the city remains in the source table
            and retried on the next cron cycle.
          </p>
        </section>

        {/* ── SECTION: AI Query Methodology ── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel label="AI QUERY ENGINE" />
          <h2 style={sectionH2}>AI Query Methodology</h2>
          <p style={bodyP}>
            Questions submitted to the NLQ interface are answered by Claude (Anthropic claude-sonnet-4-6)
            using only data fetched from ConstructAIQ&apos;s internal API routes at query time.
            The model is instructed to cite every statistic and to decline answering questions
            where the data is insufficient.
          </p>
          <p style={{ ...bodyP, marginTop: 14 }}>
            The system does not have memory of prior questions. Each query is independent.
            Answers are not cached or stored — only the question text (truncated to 200 characters)
            and the source routes used are logged for platform improvement.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginTop: 24,
          }}>
            {[
              { label: "Rate limit",  value: "10 queries / hour / IP" },
              { label: "Model",       value: "claude-sonnet-4-6" },
              { label: "Max answer",  value: "200 words" },
              { label: "Max sources", value: "12 API routes / query" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background:   color.bg1,
                border:       `1px solid ${color.bd1}`,
                borderRadius: radius.md,
                padding:      "14px 16px",
              }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 6 }}>
                  {label.toUpperCase()}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: color.t1, fontWeight: 600 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 20,
            padding: "12px 16px",
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.md,
          }}>
            <p style={{ fontFamily: MONO, fontSize: 11.5, color: color.t4, margin: 0, lineHeight: 1.65 }}>
              Not financial advice. ConstructAIQ AI responses are generated from public US government
              data and are provided for informational purposes only.
            </p>
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
