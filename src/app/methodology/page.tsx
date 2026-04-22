import Link from "next/link"
import { Nav } from "@/app/components/Nav"
import { color, font } from "@/lib/theme"

// ── Tokens ─────────────────────────────────────────────────────────────────

const { bg0:BG0, bg1:BG1, bg2:BG2, bd1:BD1, bd2:BD2,
        t1:T1, t2:T2, t3:T3, t4:T4,
        green:GREEN, amber:AMBER, blue:BLUE } = color
const MONO = font.mono, SYS = font.sys

// ── Model cards ────────────────────────────────────────────────────────────

const MODELS = [
  {
    name:   "Holt-Winters",
    full:   "Triple Exponential Smoothing",
    color:  AMBER,
    params: [
      "Captures level, trend, and seasonality",
      "Parameters: α=0.30, β=0.08",
      "Best for: stable seasonal patterns",
    ],
  },
  {
    name:   "SARIMA",
    full:   "(1,1,0)(0,1,0)[12]",
    color:  BLUE,
    params: [
      "Handles non-stationary seasonal time series",
      "Trained on last 60 monthly observations",
      "Best for: autocorrelated monthly data",
    ],
  },
  {
    name:   "XGBoost",
    full:   "Gradient Boosted Trees",
    color:  GREEN,
    params: [
      "Engineered features: lag 1/3/6/12, calendar month",
      "Requires minimum 20 observations to activate",
      "Best for: non-linear input relationships",
    ],
  },
]

// ── Data sources ───────────────────────────────────────────────────────────

const SOURCES = [
  { source:"Census Bureau",        series:"Construction Put-in-Place (C30)", freq:"Monthly",        coverage:"1993–present"  },
  { source:"Census Bureau",        series:"Building Permits (C40)",          freq:"Monthly",        coverage:"1960–present"  },
  { source:"BLS",                  series:"Construction Employment (CES)",   freq:"Monthly",        coverage:"1939–present"  },
  { source:"BLS",                  series:"Producer Price Index (PPI)",      freq:"Monthly",        coverage:"1947–present"  },
  { source:"BLS",                  series:"JOLTS (Job Openings)",            freq:"Monthly",        coverage:"2001–present"  },
  { source:"FRED / St. Louis Fed", series:"50+ macro series",               freq:"Daily–Monthly",  coverage:"Varies"        },
  { source:"BEA",                  series:"GDP by Industry",                 freq:"Quarterly",      coverage:"1947–present"  },
  { source:"EIA",                  series:"Energy Prices",                   freq:"Weekly–Monthly", coverage:"1978–present"  },
  { source:"USASpending.gov",      series:"Federal Contract Awards",         freq:"Daily",          coverage:"FY2008–present"},
]

// ── Revision policy ────────────────────────────────────────────────────────

const REVISION_POLICY = [
  "When source data is revised by the provider (e.g. Census benchmark revisions), both the original and revised values are stored. Index values are recomputed and the change is logged with a timestamp.",
  "Forecasts are immutable after publication. Last month's forecast is never retroactively changed when actual data is released. The accuracy record reflects true out-of-sample performance.",
  "All methodology changes are documented with the date of change and the reason. Previous methodology versions are archived.",
]

// ── Components ─────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`,
                  padding:"28px 32px", ...style }}>
      {children}
    </div>
  )
}

function SectionHeader({ label, title, subtitle }: { label:string; title:string; subtitle?:string }) {
  return (
    <div style={{ marginBottom:32 }}>
      <div style={{ fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.12em",
                    textTransform:"uppercase", marginBottom:10 }}>{label}</div>
      <h2 style={{ fontFamily:SYS, fontSize:28, fontWeight:700, color:T1,
                   letterSpacing:"-0.025em", marginBottom: subtitle ? 10 : 0 }}>{title}</h2>
      {subtitle && (
        <p style={{ fontFamily:SYS, fontSize:15, color:T3, lineHeight:1.65, margin:0 }}>{subtitle}</p>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function MethodologyPage() {
  return (
    <div style={{ minHeight:"100vh", background:BG0, color:T1, fontFamily:SYS,
                  paddingBottom:"env(safe-area-inset-bottom,24px)" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{color:inherit;text-decoration:none}button{font-family:inherit}`}</style>

      <Nav />

      <div style={{ maxWidth:1040, margin:"0 auto", padding:"64px 32px 80px" }}>

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom:72 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                        background:GREEN+"14", border:`1px solid ${GREEN}44`,
                        borderRadius:20, padding:"6px 18px", marginBottom:24 }}>
            <span style={{ fontFamily:MONO, fontSize:11, color:GREEN, letterSpacing:"0.1em" }}>
              OPEN METHODOLOGY
            </span>
          </div>
          <h1 style={{ fontFamily:SYS, fontSize:48, fontWeight:700,
                       letterSpacing:"-0.035em", lineHeight:1.06, color:T1, marginBottom:16 }}>
            Open Methodology
          </h1>
          <p style={{ fontFamily:SYS, fontSize:18, color:T3, lineHeight:1.65, maxWidth:640, marginBottom:28 }}>
            Every index formula, every model weight, every data source — published and peer-reviewable.
          </p>
          <Link href="/methodology/track-record"
                style={{ display:"inline-flex", alignItems:"center", gap:8,
                         fontFamily:MONO, fontSize:12, color:AMBER, fontWeight:600,
                         letterSpacing:"0.06em" }}>
            View Forecast Track Record →
          </Link>
        </div>

        {/* ── Section 1: Forecasting Model ─────────────────────────── */}
        <div style={{ marginBottom:64 }}>
          <SectionHeader label="01 — Forecasting" title="12-Month Ensemble Forecast" />

          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:28 }}>
            {MODELS.map(m => (
              <div key={m.name} style={{
                flex:"1 1 260px", background:BG2,
                border:`1px solid ${m.color}33`, borderRadius:16, padding:"24px 24px",
                boxShadow:`0 0 32px ${m.color}08`,
              }}>
                <div style={{ marginBottom:14 }}>
                  <div style={{
                    display:"inline-block",
                    fontFamily:MONO, fontSize:10, fontWeight:700, letterSpacing:"0.1em",
                    color:m.color, background:m.color+"18",
                    padding:"3px 10px", borderRadius:6, marginBottom:8,
                  }}>
                    {m.name}
                  </div>
                  <div style={{ fontFamily:SYS, fontSize:13, color:T4 }}>{m.full}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {m.params.map((p, i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ color:m.color, fontFamily:MONO, fontSize:12,
                                     flexShrink:0, marginTop:1 }}>—</span>
                      <span style={{ fontFamily:SYS, fontSize:13, color:T2, lineHeight:1.55 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Card>
            <div style={{ fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.1em",
                          marginBottom:12 }}>ENSEMBLE WEIGHTING</div>
            <p style={{ fontFamily:SYS, fontSize:15, color:T2, lineHeight:1.75, margin:0 }}>
              Ensemble weights are computed as inverse MAPE on in-sample holdout data. The model
              with the lowest recent error receives proportionally more weight. Weights are
              recomputed monthly when new Census data is released. All three models produce 80%
              and 95% prediction intervals which are combined via weighted average into the final
              confidence bands.
            </p>
          </Card>
        </div>

        {/* ── Section 2: Data Sources ──────────────────────────────── */}
        <div style={{ marginBottom:64 }}>
          <SectionHeader label="02 — Data Sources" title="Primary Data Sources" />
          <Card style={{ padding:0, overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    {["Source","Series","Update Frequency","Coverage"].map(h => (
                      <th key={h} style={{
                        fontFamily:MONO, fontSize:10, color:T4,
                        letterSpacing:"0.08em", textTransform:"uppercase",
                        padding:"14px 20px", textAlign:"left",
                        background:BG2, fontWeight:600, whiteSpace:"nowrap",
                        borderBottom:`1px solid ${BD1}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SOURCES.map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? BG2 : BG1 }}>
                      <td style={{ fontFamily:SYS, fontSize:13, fontWeight:600, color:T1,
                                   padding:"13px 20px", borderTop:`1px solid ${BD1}`,
                                   whiteSpace:"nowrap" }}>{s.source}</td>
                      <td style={{ fontFamily:SYS, fontSize:13, color:T2,
                                   padding:"13px 20px", borderTop:`1px solid ${BD1}` }}>{s.series}</td>
                      <td style={{ fontFamily:MONO, fontSize:11, color:AMBER,
                                   padding:"13px 20px", borderTop:`1px solid ${BD1}`,
                                   whiteSpace:"nowrap" }}>{s.freq}</td>
                      <td style={{ fontFamily:MONO, fontSize:11, color:T4,
                                   padding:"13px 20px", borderTop:`1px solid ${BD1}`,
                                   whiteSpace:"nowrap" }}>{s.coverage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ── Section 3: Revision Policy ───────────────────────────── */}
        <div style={{ marginBottom:64 }}>
          <SectionHeader label="03 — Revision Policy" title="Data Integrity Commitments" />
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {REVISION_POLICY.map((text, i) => (
              <div key={i} style={{
                display:"flex", gap:20, alignItems:"flex-start",
                background:BG1, borderRadius:14, border:`1px solid ${BD1}`,
                padding:"20px 24px",
              }}>
                <div style={{
                  flexShrink:0, width:28, height:28, borderRadius:"50%",
                  background:BG2, border:`1px solid ${BD2}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:MONO, fontSize:11, color:T4, fontWeight:700,
                }}>
                  {i + 1}
                </div>
                <p style={{ fontFamily:SYS, fontSize:14, color:T2,
                             lineHeight:1.75, margin:0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Track record callout ─────────────────────────────────── */}
        <div style={{
          background:BG1, borderRadius:20, border:`1px solid ${AMBER}33`,
          padding:"32px 36px", display:"flex",
          alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:24,
          boxShadow:`0 0 40px ${AMBER}08`,
        }}>
          <div>
            <div style={{ fontFamily:MONO, fontSize:10, color:AMBER,
                          letterSpacing:"0.1em", marginBottom:10 }}>TRANSPARENCY</div>
            <h3 style={{ fontFamily:SYS, fontSize:22, fontWeight:700, color:T1,
                         letterSpacing:"-0.02em", marginBottom:8 }}>
              Forecast Track Record
            </h3>
            <p style={{ fontFamily:SYS, fontSize:14, color:T3,
                        lineHeight:1.65, maxWidth:480, margin:0 }}>
              Every forecast we published vs. what actually happened.
              No competitor publishes this. We do.
            </p>
          </div>
          <Link href="/methodology/track-record"
                style={{
                  display:"inline-block",
                  background:AMBER, color:BG0,
                  fontFamily:MONO, fontSize:13, fontWeight:700,
                  letterSpacing:"0.06em", borderRadius:12,
                  padding:"14px 28px", whiteSpace:"nowrap",
                  minHeight:44,
                }}>
            View Track Record →
          </Link>
        </div>

        {/* ── Back links ───────────────────────────────────────────── */}
        <div style={{ marginTop:48, display:"flex", gap:24,
                      justifyContent:"center", flexWrap:"wrap" }}>
          <Link href="/dashboard" style={{ fontFamily:SYS, fontSize:14, color:T4,
                                           textDecoration:"underline" }}>
            ← Open Dashboard
          </Link>
          <Link href="/api-access" style={{ fontFamily:SYS, fontSize:14, color:T4,
                                            textDecoration:"underline" }}>
            API Access
          </Link>
          <Link href="/" style={{ fontFamily:SYS, fontSize:14, color:T4,
                                  textDecoration:"underline" }}>
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
