// @ts-nocheck
"use client"
import { useState, useEffect } from "react"

var SYS = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
var MONO = "ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, monospace"
var AMBER = "#f5a623"
var GREEN = "#30d158"
var RED = "#ff453a"
var BLUE = "#0a84ff"
var BG0 = "#000"
var BG1 = "#0d0d0d"
var BG2 = "#1a1a1a"
var BG3 = "#222"
var BD1 = "#2a2a2a"
var T1 = "#ffffff"
var T2 = "#ebebf0"
var T3 = "#a0a0ab"
var T4 = "#6e6e73"

function LiveStat({ label, value, change, color }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 24px", background: BG2, borderRadius: 16, border: "1px solid " + BD1, flex: 1, minWidth: 140 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 26, color: color || AMBER, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {change && <div style={{ fontFamily: MONO, fontSize: 13, color: parseFloat(change) >= 0 ? GREEN : RED, marginTop: 6 }}>{parseFloat(change) >= 0 ? "+" : ""}{change}% MoM</div>}
    </div>
  )
}

function FeatureCard({ icon, title, desc, tag }) {
  return (
    <div style={{ background: BG2, borderRadius: 16, padding: "28px 24px", border: "1px solid " + BD1, flex: 1, minWidth: 260 }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: SYS, fontSize: 17, color: T1, fontWeight: 600 }}>{title}</div>
        {tag && <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, background: "#3d280022", border: "1px solid " + AMBER + "44", borderRadius: 6, padding: "2px 8px" }}>{tag}</div>}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 15, color: T3, lineHeight: 1.6 }}>{desc}</div>
    </div>
  )
}

function SignalPill({ type, text }) {
  var col = type === "BULLISH" ? GREEN : type === "BEARISH" ? RED : AMBER
  var bg = type === "BULLISH" ? "#0a2e14" : type === "BEARISH" ? "#2e0a0a" : "#3d2800"
  var icon = type === "BULLISH" ? "▲" : type === "BEARISH" ? "▼" : "⚠"
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: bg, border: "1px solid " + col + "44", borderRadius: 20, padding: "6px 14px", margin: "4px" }}>
      <span style={{ fontFamily: MONO, fontSize: 12, color: col }}>{icon}</span>
      <span style={{ fontFamily: SYS, fontSize: 14, color: col, fontWeight: 500 }}>{text}</span>
    </div>
  )
}

export default function HomePage() {
  var [email, setEmail] = useState("")
  var [status, setStatus] = useState("")
  var [submitting, setSubmitting] = useState(false)
  var [spend, setSpend] = useState(null)
  var [employ, setEmploy] = useState(null)
  var [signals, setSignals] = useState([])

  useEffect(function () {
    async function load() {
      try { var r = await fetch("/api/census"); if (r.ok) setSpend(await r.json()) } catch (e) {}
      try { var r = await fetch("/api/bls");    if (r.ok) setEmploy(await r.json()) } catch (e) {}
      try { var r = await fetch("/api/signals"); if (r.ok) { var d = await r.json(); setSignals(d.signals || []) } } catch (e) {}
    }
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || submitting) return
    setSubmitting(true)
    try {
      var r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" })
      })
      if (r.ok) {
        setStatus("success")
        setEmail("")
      } else {
        setStatus("error")
      }
    } catch (e) {
      setStatus("error")
    } finally {
      setSubmitting(false)
    }
  }

  var spendVal = spend?.value ?? spend?.latest?.value ?? 2190
  var spendMom = spend?.mom ?? spend?.latest?.mom ?? 0.3
  var empVal   = employ?.value ?? employ?.latest?.value ?? 8330
  var empMom   = employ?.mom ?? employ?.latest?.mom ?? 0.31

  var bullish = signals.filter(function(s) { return s.type === "BULLISH" })
  var bearish = signals.filter(function(s) { return s.type === "BEARISH" })
  var warning = signals.filter(function(s) { return s.type === "WARNING" })

  return (
    <div style={{
      minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS,
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        button { outline: none; font-family: inherit; cursor: pointer; border: none; }
        input { outline: none; font-family: inherit; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: BG1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: "1px solid " + BD1,
        padding: "0 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg"
            style={{ height: 24 }} alt="ConstructAIQ" />
          <div style={{ width: 1, height: 24, background: BD1 }} />
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em" }}>CONSTRUCTION INTELLIGENCE</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: "0 0 8px " + GREEN + "88", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: MONO, fontSize: 12, color: GREEN }}>LIVE</span>
          </div>
          <a href="/dashboard">
            <button style={{
              background: AMBER, color: "#000", fontFamily: MONO, fontSize: 13, fontWeight: 700,
              padding: "8px 20px", borderRadius: 10, letterSpacing: "0.06em",
              minHeight: 44,
            }}>DASHBOARD →</button>
          </a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 32px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: BG2, border: "1px solid " + AMBER + "44", borderRadius: 20,
            padding: "6px 16px", marginBottom: 28,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: AMBER }}>▲ Phase 3 Live</span>
            <span style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>3-Model AI Ensemble · 16 APIs · Real-Time Intelligence</span>
          </div>

          <h1 style={{
            fontFamily: SYS, fontSize: 52, fontWeight: 700, lineHeight: 1.1,
            color: T1, marginBottom: 20, letterSpacing: "-0.02em",
          }}>
            The Bloomberg Terminal<br />
            <span style={{ color: AMBER }}>for Construction</span>
          </h1>

          <p style={{
            fontFamily: SYS, fontSize: 19, color: T3, lineHeight: 1.6,
            maxWidth: 580, margin: "0 auto 40px",
          }}>
            Real-time construction spending, permits, employment, and AI-powered 12-month forecasts. Built for economists, developers, and construction executives.
          </p>

          {/* Email capture */}
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, maxWidth: 460, margin: "0 auto 16px", justifyContent: "center" }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={function(e) { setEmail(e.target.value) }}
              style={{
                flex: 1, background: BG2, border: "1px solid " + BD1, borderRadius: 12,
                padding: "13px 18px", color: T1, fontSize: 15, minHeight: 50,
              }}
            />
            <button type="submit" disabled={submitting} style={{
              background: AMBER, color: "#000", fontWeight: 700, fontSize: 15,
              padding: "0 24px", borderRadius: 12, minHeight: 50, minWidth: 120,
              opacity: submitting ? 0.7 : 1,
            }}>
              {submitting ? "..." : "Get Access"}
            </button>
          </form>
          {status === "success" && <div style={{ fontFamily: SYS, fontSize: 14, color: GREEN }}>✓ You're on the list. We'll be in touch.</div>}
          {status === "error"   && <div style={{ fontFamily: SYS, fontSize: 14, color: RED }}>Something went wrong. Try again.</div>}
          <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 10 }}>
            No spam. Used by construction economists and project developers.
          </div>
        </div>

        {/* LIVE STATS */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 16, textAlign: "center" }}>LIVE DATA — UPDATED EVERY 4 HOURS</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <LiveStat label="TOTAL CONSTRUCTION SPEND" value={"$" + (spendVal / 1000).toFixed(1) + "B"} change={spendMom?.toFixed(2)} color={AMBER} />
            <LiveStat label="CONSTRUCTION EMPLOYMENT" value={(empVal >= 1000 ? (empVal / 1000).toFixed(1) + "K" : empVal) + "K"} change={empMom?.toFixed(2)} color={GREEN} />
            <LiveStat label="ACTIVE AI SIGNALS" value={signals.length || "6"} color={BLUE} />
            <LiveStat label="API ENDPOINTS" value="16" color={T2} />
          </div>
        </div>

        {/* LIVE SIGNALS */}
        {signals.length > 0 && (
          <div style={{ marginBottom: 64, background: BG1, borderRadius: 20, padding: "28px 24px", border: "1px solid " + BD1 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 16 }}>TODAY'S MARKET INTELLIGENCE</div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {signals.map(function(s, i) {
                return <SignalPill key={i} type={s.type} text={s.title} />
              })}
            </div>
          </div>
        )}

        {/* FEATURES */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 24, textAlign: "center" }}>PLATFORM CAPABILITIES</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <FeatureCard
              icon="📡"
              title="Signal Intelligence"
              tag="AI-POWERED"
              desc="Z-score anomaly detection, trend reversals, divergence signals, and acceleration patterns across 12 government data series."
            />
            <FeatureCard
              icon="🤖"
              title="3-Model Ensemble"
              tag="XGBOOST"
              desc="Holt-Winters, SARIMA, and XGBoost gradient boosting combined with accuracy weighting. 12-month forecasts with 80% and 95% confidence intervals."
            />
            <FeatureCard
              icon="🗺"
              title="50-State Coverage"
              tag="BEA + FRED"
              desc="State-level construction activity, permit trends, and regional GDP contributions. HOT / GROWING / COOLING classification by state."
            />
            <FeatureCard
              icon="💹"
              title="Materials Intelligence"
              tag="BLS + EIA"
              desc="Real-time BUY/SELL/HOLD signals for lumber, steel, concrete, copper, WTI crude, and diesel. Composite procurement index updated hourly."
            />
          </div>
        </div>

        {/* DATA SOURCES */}
        <div style={{ marginBottom: 64, background: BG1, borderRadius: 20, padding: "32px 24px", border: "1px solid " + BD1 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 24, textAlign: "center" }}>DATA SOURCES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {["Census Bureau", "Bureau of Labor Statistics", "FRED / St. Louis Fed", "Bureau of Economic Analysis", "EIA", "USASpending.gov", "ENR", "Construction Dive", "NAHB", "AGC"].map(function(s, i) {
              return (
                <div key={i} style={{ background: BG2, border: "1px solid " + BD1, borderRadius: 10, padding: "8px 16px" }}>
                  <span style={{ fontFamily: SYS, fontSize: 14, color: T3 }}>{s}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "48px 32px", background: "linear-gradient(135deg, #1a1200 0%, #0d0d0d 100%)", borderRadius: 24, border: "1px solid " + AMBER + "33" }}>
          <div style={{ fontFamily: SYS, fontSize: 28, fontWeight: 700, color: T1, marginBottom: 12 }}>Ready to see the intelligence?</div>
          <div style={{ fontFamily: SYS, fontSize: 16, color: T3, marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
            The dashboard is live now. No login required.
          </div>
          <a href="/dashboard">
            <button style={{
              background: AMBER, color: "#000", fontFamily: MONO, fontSize: 15, fontWeight: 700,
              padding: "16px 40px", borderRadius: 14, letterSpacing: "0.06em", minHeight: 52,
            }}>OPEN DASHBOARD →</button>
          </a>
          <div style={{ marginTop: 16 }}>
            <a href="/pricing" style={{ fontFamily: SYS, fontSize: 14, color: T4, textDecoration: "underline" }}>View pricing plans</a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid " + BD1, padding: "32px", textAlign: "center", marginTop: 64 }}>
        <img src="https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg"
          style={{ height: 20, marginBottom: 12 }} alt="ConstructAIQ" />
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>
          Construction Intelligence Platform · constructaiq.trade
        </div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 6 }}>
          Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov
        </div>
      </footer>
    </div>
  )
}
