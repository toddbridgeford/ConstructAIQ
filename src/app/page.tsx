"use client"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { font, color, sentColor, sentBg, fmtPct } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

const AMBER = color.amber
const GREEN = color.green
const RED   = color.red
const BLUE  = color.blue
const BG0   = color.bg0,  BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3
const BD1   = color.bd1,  BD2 = color.bd2
const T1    = color.t1,   T2  = color.t2,  T3  = color.t3,  T4  = color.t4

interface Signal { type: string; title: string }

function LiveStat({ label, value, change, clr }: { label: string; value: string | number; change?: string | null; clr?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 24px", background: BG2, borderRadius: 16, border: `1px solid ${BD1}`, flex: 1, minWidth: 140 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 26, color: clr ?? AMBER, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {change && <div style={{ fontFamily: MONO, fontSize: 13, color: parseFloat(change) >= 0 ? GREEN : RED, marginTop: 6 }}>{parseFloat(change) >= 0 ? "+" : ""}{change}% MoM</div>}
    </div>
  )
}

function FeatureCard({ icon, title, desc, tag }: { icon: string; title: string; desc: string; tag?: string }) {
  return (
    <div style={{ background: BG2, borderRadius: 16, padding: "28px 24px", border: `1px solid ${BD1}`, flex: 1, minWidth: 260 }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: SYS, fontSize: 17, color: T1, fontWeight: 600 }}>{title}</div>
        {tag && <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, background: "#3d280022", border: `1px solid ${AMBER}44`, borderRadius: 6, padding: "2px 8px" }}>{tag}</div>}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 15, color: T3, lineHeight: 1.6 }}>{desc}</div>
    </div>
  )
}

function SignalPill({ type, text }: { type: string; text: string }) {
  const col  = sentColor(type)
  const bg   = sentBg(type)
  const icon = type === "BULLISH" ? "▲" : type === "BEARISH" ? "▼" : "⚠"
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: bg, border: `1px solid ${col}44`, borderRadius: 20, padding: "6px 14px", margin: "4px" }}>
      <span style={{ fontFamily: MONO, fontSize: 12, color: col }}>{icon}</span>
      <span style={{ fontFamily: SYS, fontSize: 14, color: col, fontWeight: 500 }}>{text}</span>
    </div>
  )
}

function AudienceCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ background: BG2, borderRadius: 16, padding: "28px 24px", border: `1px solid ${BD1}`, flex: "1 1 calc(33% - 12px)", minWidth: 220 }}>
      <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontFamily: SYS, fontSize: 16, color: T1, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ fontFamily: SYS, fontSize: 14, color: T3, lineHeight: 1.6 }}>{desc}</div>
    </div>
  )
}


function EmailCaptureForm({ source, label }: { source: string; label: string }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || submitting) return
    setSubmitting(true)
    try {
      const r = await fetch("/api/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, source }),
      })
      if (r.ok) { setStatus("success"); setEmail("") }
      else        setStatus("error")
    } catch {
      setStatus("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, maxWidth: 480, margin: "0 auto", justifyContent: "center" }}>
        <input
          type="email" placeholder="your@email.com" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ flex: 1, background: BG3, border: `1px solid ${BD2}`, borderRadius: 12, padding: "13px 18px", color: T1, fontSize: 15, minHeight: 50 }}
        />
        <button type="submit" disabled={submitting} style={{ background: AMBER, color: "#000", fontWeight: 700, fontSize: 15, padding: "0 24px", borderRadius: 12, minHeight: 50, minWidth: 120, opacity: submitting ? 0.7 : 1, cursor: "pointer", border: "none", fontFamily: SYS }}>
          {submitting ? "..." : label}
        </button>
      </form>
      {status === "success" && <div style={{ fontFamily: SYS, fontSize: 14, color: GREEN, marginTop: 12, textAlign: "center" }}>✓ You&apos;re on the list.</div>}
      {status === "error"   && <div style={{ fontFamily: SYS, fontSize: 14, color: RED,   marginTop: 12, textAlign: "center" }}>Something went wrong. Try again.</div>}
    </div>
  )
}

export default function HomePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [spend,  setSpend]  = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employ, setEmploy] = useState<any>(null)
  const [signals, setSignals] = useState<Signal[]>([])

  useEffect(() => {
    async function safeFetch(url: string) {
      try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
    }
    async function load() {
      const [spendData, employData, sigsData] = await Promise.all([
        safeFetch('/api/census'),
        safeFetch('/api/bls'),
        safeFetch('/api/signals'),
      ])
      if (spendData)  setSpend(spendData)
      if (employData) setEmploy(employData)
      if (sigsData)   setSignals(sigsData.signals ?? [])
    }
    load()
  }, [])

  const spendVal = spend?.value  ?? spend?.latest?.value  ?? 2190
  const spendMom = spend?.mom    ?? spend?.latest?.mom    ?? 0.3
  const empVal   = employ?.value ?? employ?.latest?.value ?? 8330
  const empMom   = employ?.mom   ?? employ?.latest?.mom   ?? 0.31

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS, paddingBottom: "env(safe-area-inset-bottom,20px)" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit;cursor:pointer;border:none}
        input{outline:none;font-family:inherit}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: BG1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BD1}`,
        padding: "0 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60,
        paddingTop: "env(safe-area-inset-top,0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 24, background: BD1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[
              { label: "Intelligence", href: "/dashboard" },
              { label: "Markets",      href: "/markets" },
              { label: "Tools",        href: "/market-check" },
              { label: "Who It's For", href: "#audience" },
              { label: "Pricing",      href: "/pricing" },
              { label: "About",        href: "/about" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} style={{ fontFamily: SYS, fontSize: 14, color: T3, padding: "6px 10px", borderRadius: 8, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = T1)}
                onMouseLeave={e => (e.currentTarget.style.color = T3)}
              >{label}</Link>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}88`, animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: MONO, fontSize: 12, color: GREEN }}>LIVE</span>
          </div>
          <Link href="/dashboard">
            <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 13, fontWeight: 700, padding: "8px 20px", borderRadius: 10, letterSpacing: "0.06em", minHeight: 44 }}>DASHBOARD →</button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 32px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: BG2, border: `1px solid ${AMBER}44`, borderRadius: 20, padding: "6px 16px", marginBottom: 28 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: AMBER }}>▲ Phase 3 Live</span>
            <span style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>3-Model AI Ensemble · 16 APIs · Real-Time Intelligence</span>
          </div>

          <h1 style={{ fontFamily: SYS, fontSize: 52, fontWeight: 700, lineHeight: 1.1, color: T1, marginBottom: 20, letterSpacing: "-0.02em" }}>
            The Intelligence Platform<br />
            <span style={{ color: AMBER }}>for Construction</span>
          </h1>

          <p style={{ fontFamily: SYS, fontSize: 19, color: T3, lineHeight: 1.6, maxWidth: 620, margin: "0 auto 40px" }}>
            Stop guessing. Start knowing. ConstructAIQ gives you the same macro-economic intelligence as Wall Street firms — built for construction executives, lenders, and government analysts.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard">
              <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 12, letterSpacing: "0.06em", minHeight: 52 }}>
                SEE LIVE INTELLIGENCE →
              </button>
            </Link>
            <Link href="/pricing">
              <button style={{ background: "transparent", color: T2, fontFamily: SYS, fontSize: 15, fontWeight: 500, padding: "14px 28px", borderRadius: 12, minHeight: 52, border: `1px solid ${BD2}` }}>
                View Pricing
              </button>
            </Link>
          </div>
          <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 16 }}>No login required. Data refreshes every 4 hours.</div>
        </div>

        {/* LIVE STATS */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 16, textAlign: "center" }}>LIVE DATA — UPDATED EVERY 4 HOURS</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <LiveStat label="TOTAL CONSTRUCTION SPEND"  value={`$${(spendVal / 1000).toFixed(1)}B`} change={spendMom?.toFixed(2)} clr={AMBER} />
            <LiveStat label="CONSTRUCTION EMPLOYMENT"   value={`${empVal >= 1000 ? (empVal / 1000).toFixed(1) + "M" : empVal + "K"}`} change={empMom?.toFixed(2)} clr={GREEN} />
            <LiveStat label="ACTIVE AI SIGNALS"         value={signals.length || "6"} clr={BLUE} />
            <LiveStat label="API ENDPOINTS"             value="14" clr={T2} />
          </div>
        </div>

        {signals.length > 0 && (
          <div style={{ marginBottom: 64, background: BG1, borderRadius: 20, padding: "28px 24px", border: `1px solid ${BD1}` }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 16 }}>TODAY&apos;S MARKET INTELLIGENCE</div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {signals.map((s, i) => <SignalPill key={i} type={s.type} text={s.title} />)}
            </div>
          </div>
        )}

        {/* DASHBOARD PREVIEW */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 8, textAlign: "center" }}>PLATFORM PREVIEW</div>
          <div style={{ fontFamily: SYS, fontSize: 28, fontWeight: 700, color: T1, textAlign: "center", marginBottom: 8 }}>Everything in one view</div>
          <div style={{ fontFamily: SYS, fontSize: 16, color: T3, textAlign: "center", marginBottom: 32, maxWidth: 520, margin: "0 auto 32px" }}>
            Forecasts, signals, and state-level data — all updated continuously.
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {/* Panel 1: SVG area chart — CSHI + forecast */}
            <div style={{ flex: "2 1 320px", background: BG1, borderRadius: 20, border: `1px solid ${BD1}`, padding: "24px", minHeight: 240, overflow: "hidden" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 4 }}>SECTOR HEALTH INDEX · 12-MONTH FORECAST</div>
              <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: T4 }}>CSHI SCORE</div>
                  <div style={{ fontFamily: MONO, fontSize: 22, color: AMBER, fontWeight: 700, lineHeight: 1 }}>72.4</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: GREEN }}>▲ EXPANDING</div>
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: T4 }}>SPEND</div>
                  <div style={{ fontFamily: MONO, fontSize: 22, color: T1, fontWeight: 700, lineHeight: 1 }}>${(spendVal / 1000).toFixed(1)}B</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: GREEN }}>+{spendMom?.toFixed(1)}% MoM</div>
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: T4 }}>12MO FCST</div>
                  <div style={{ fontFamily: MONO, fontSize: 22, color: BLUE, fontWeight: 700, lineHeight: 1 }}>+4.2%</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: T4 }}>87% confidence</div>
                </div>
              </div>
              {/* SVG area + line chart */}
              <svg width="100%" height="100" viewBox="0 0 360 100" preserveAspectRatio="none" style={{ display: "block" }}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AMBER} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={AMBER} stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="fcastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={BLUE} stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[25, 50, 75].map(y => (
                  <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="#2a2a2a" strokeWidth="1" />
                ))}
                {/* Historical area */}
                <path d="M0,72 L30,68 L60,65 L90,60 L120,58 L150,54 L180,50 L210,46 L240,42 L240,100 L0,100 Z" fill="url(#histGrad)" />
                <path d="M0,72 L30,68 L60,65 L90,60 L120,58 L150,54 L180,50 L210,46 L240,42" fill="none" stroke={AMBER} strokeWidth="2" />
                {/* Forecast area */}
                <path d="M240,42 L270,38 L300,33 L330,29 L360,24 L360,100 L240,100 Z" fill="url(#fcastGrad)" />
                <path d="M240,42 L270,38 L300,33 L330,29 L360,24" fill="none" stroke={BLUE} strokeWidth="2" strokeDasharray="5 3" />
                {/* TODAY marker */}
                <line x1="240" y1="0" x2="240" y2="100" stroke={AMBER} strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
                <text x="244" y="12" fill={AMBER} fontSize="8" fontFamily="monospace">TODAY</text>
              </svg>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 16, height: 2, background: AMBER }} />
                  <span style={{ fontFamily: MONO, fontSize: 9, color: T4 }}>Historical</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 16, height: 2, background: BLUE, borderTop: "2px dashed " + BLUE }} />
                  <span style={{ fontFamily: MONO, fontSize: 9, color: T4 }}>AI Forecast (80% CI)</span>
                </div>
              </div>
            </div>
            {/* Panel 2: State activity with signal badges */}
            <div style={{ flex: "1 1 220px", background: BG1, borderRadius: 20, border: `1px solid ${BD1}`, padding: "24px", minHeight: 240, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 16 }}>50-STATE ACTIVITY</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { state: "TX", yoy: "+14.2%", col: "#1a7f37", label: "HOT" },
                  { state: "FL", yoy: "+11.8%", col: "#1a7f37", label: "HOT" },
                  { state: "AZ", yoy: "+6.4%",  col: GREEN,     label: "GROWING" },
                  { state: "NC", yoy: "+4.1%",  col: GREEN,     label: "GROWING" },
                  { state: "OH", yoy: "-1.2%",  col: AMBER,     label: "NEUTRAL" },
                ].map(({ state, yoy, col, label }) => (
                  <div key={state} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: T1, width: 28 }}>{state}</div>
                    <div style={{ flex: 1, height: 5, background: BG3, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: label === "HOT" ? "90%" : label === "GROWING" ? "65%" : "40%", height: "100%", background: col, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: yoy.startsWith("+") ? GREEN : AMBER }}>{yoy}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: col, background: col + "22", border: `1px solid ${col}44`, borderRadius: 5, padding: "2px 6px", flexShrink: 0 }}>{label}</div>
                  </div>
                ))}
              </div>
              <Link href="/dashboard" style={{ fontFamily: MONO, fontSize: 12, color: AMBER, marginTop: 16, display: "block" }}>All 50 states →</Link>
            </div>
            {/* Panel 3: Materials signals */}
            <div style={{ flex: "1 1 220px", background: BG1, borderRadius: 20, border: `1px solid ${BD1}`, padding: "24px", minHeight: 240, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 16 }}>MATERIALS SIGNALS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {[
                  { mat: "Lumber",   signal: "BUY",  chg: "+2.1%", col: GREEN },
                  { mat: "Steel",    signal: "HOLD", chg: "+0.4%", col: AMBER },
                  { mat: "Concrete", signal: "BUY",  chg: "+1.8%", col: GREEN },
                  { mat: "Copper",   signal: "SELL", chg: "-3.2%", col: RED },
                  { mat: "WTI",      signal: "HOLD", chg: "-0.9%", col: AMBER },
                ].map(({ mat, signal, chg, col }) => (
                  <div key={mat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: SYS, fontSize: 14, color: T2 }}>{mat}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>{chg}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: col, background: col + "22", border: `1px solid ${col}44`, borderRadius: 6, padding: "2px 8px" }}>{signal}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/dashboard" style={{ fontFamily: MONO, fontSize: 12, color: AMBER, marginTop: 16, display: "block" }}>Full signals →</Link>
            </div>
          </div>
        </div>

        {/* WHO IT'S FOR */}
        <div id="audience" style={{ marginBottom: 64 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 8, textAlign: "center" }}>WHO IT&apos;S FOR</div>
          <div style={{ fontFamily: SYS, fontSize: 28, fontWeight: 700, color: T1, textAlign: "center", marginBottom: 32 }}>
            Built for professionals who move markets
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <AudienceCard icon="🏛️" title="Federal Government" desc="Infrastructure spend oversight, economic forecasting, and policy impact analysis across all 50 states." />
            <AudienceCard icon="🏦" title="Bankers & Lenders"   desc="Construction loan risk assessment, market timing signals, and portfolio exposure by region and segment." />
            <AudienceCard icon="📈" title="Venture Capital"     desc="Pipeline intelligence and sector timing for construction tech investments and real estate development funds." />
            <AudienceCard icon="💼" title="Stock Brokers"       desc="Sector rotation signals for construction and materials equities. Know when to move before the market does." />
            <AudienceCard icon="🏗️" title="Developers"          desc="Project timing, cost forecasting, and market entry signals to maximize returns and reduce risk." />
            <AudienceCard icon="🏭" title="Manufacturers"       desc="Demand forecasting for construction materials and equipment. Align production with real pipeline data." />
          </div>
        </div>

        {/* FEATURES */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 24, textAlign: "center" }}>PLATFORM CAPABILITIES</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <FeatureCard icon="📡" title="Signal Intelligence" tag="AI-POWERED" desc="Z-score anomaly detection, trend reversals, divergence signals, and acceleration patterns across 12 government data series." />
            <FeatureCard icon="🤖" title="3-Model Ensemble"   tag="XGBOOST"   desc="Holt-Winters, SARIMA, and XGBoost gradient boosting combined with accuracy weighting. 12-month forecasts with 80% and 95% confidence intervals." />
            <FeatureCard icon="🗺" title="50-State Coverage"  tag="BEA + FRED" desc="State-level construction activity, permit trends, and regional GDP contributions. HOT / GROWING / COOLING classification by state." />
            <FeatureCard icon="💹" title="Materials Intelligence" tag="BLS + EIA" desc="Real-time BUY/SELL/HOLD signals for lumber, steel, concrete, copper, WTI crude, and diesel. Composite procurement index updated hourly." />
          </div>
        </div>


        {/* DATA SOURCES */}
        <div style={{ marginBottom: 64, background: BG1, borderRadius: 20, padding: "32px 24px", border: `1px solid ${BD1}` }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 24, textAlign: "center" }}>DATA SOURCES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {["Census Bureau", "Bureau of Labor Statistics", "FRED / St. Louis Fed", "Bureau of Economic Analysis", "EIA", "USASpending.gov", "ENR", "Construction Dive", "NAHB", "AGC"].map((s, i) => (
              <div key={i} style={{ background: BG2, border: `1px solid ${BD1}`, borderRadius: 10, padding: "8px 16px" }}>
                <span style={{ fontFamily: SYS, fontSize: 14, color: T3 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "48px 32px", background: "linear-gradient(135deg,#1a1200 0%,#0d0d0d 100%)", borderRadius: 24, border: `1px solid ${AMBER}33` }}>
          <div style={{ fontFamily: SYS, fontSize: 28, fontWeight: 700, color: T1, marginBottom: 12 }}>Ready to see the intelligence?</div>
          <div style={{ fontFamily: SYS, fontSize: 16, color: T3, marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>The dashboard is live now. No login required.</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard">
              <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 15, fontWeight: 700, padding: "16px 40px", borderRadius: 14, letterSpacing: "0.06em", minHeight: 52 }}>OPEN DASHBOARD →</button>
            </Link>
            <Link href="/pricing">
              <button style={{ background: "transparent", color: T2, fontFamily: SYS, fontSize: 15, fontWeight: 500, padding: "16px 28px", borderRadius: 14, minHeight: 52, border: `1px solid ${BD2}` }}>View pricing plans</button>
            </Link>
          </div>
        </div>
      </div>

      {/* EMAIL CAPTURE */}
      <div style={{ background: BG1, borderTop: `1px solid ${BD1}`, borderBottom: `1px solid ${BD1}`, padding: "64px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.1em", marginBottom: 12 }}>WEEKLY BRIEFING</div>
          <div style={{ fontFamily: SYS, fontSize: 28, fontWeight: 700, color: T1, marginBottom: 12 }}>
            Get the Weekly Construction Market Brief
          </div>
          <div style={{ fontFamily: SYS, fontSize: 16, color: T3, marginBottom: 32, lineHeight: 1.6 }}>
            Every Monday: the top 3 signals, a 30-day forecast snapshot, and the one data point every construction professional needs to know.
          </div>
          <EmailCaptureForm source="weekly-brief" label="Subscribe Free" />
          <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 14 }}>No spam. Unsubscribe anytime. Join economists, developers, and capital allocators.</div>
        </div>
      </div>

      <footer style={{ borderTop: `1px solid ${BD1}`, padding: "32px", textAlign: "center", marginTop: 0 }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ" style={{ height: 20, width: "auto", marginBottom: 12 }} />
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 6 }}>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
      </footer>
    </div>
  )
}
