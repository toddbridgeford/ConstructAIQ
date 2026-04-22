"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link  from "next/link"
import { Nav }              from "./components/Nav"
import { HeroSection }      from "./components/HeroSection"
import { TrustStrip }       from "./components/TrustStrip"
import { OutcomeCards }     from "./components/OutcomeCards"
import { FreeModel }        from "./components/FreeModel"
import { PlatformShowcase } from "./components/PlatformShowcase"
import { ForecastDeepDive } from "./components/ForecastDeepDive"
import { UseCases }         from "./components/UseCases"
import { CtaSection }       from "./components/CtaSection"
import { color, font }      from "@/lib/theme"

const { bg0:BG0, bg1:BG1, bg2:BG2, bg3:BG3, bd1:BD1, bd2:BD2,
        t1:T1, t2:T2, t3:T3, t4:T4,
        amber:AMBER, green:GREEN, red:RED, blue:BLUE } = color
const SYS  = font.sys
const MONO = font.mono

type Signal = { type: string; title: string; description?: string; confidence?: number }

const SOURCES = [
  "Census Bureau", "BLS", "FRED", "BEA", "EIA",
  "USASpending.gov", "SAM.gov", "NOAA", "Copernicus",
]

function sentBg(signal: string): string {
  if (signal === "BUY")  return `${GREEN}18`
  if (signal === "SELL") return `${RED}18`
  return `${AMBER}18`
}

function ForecastPreview({ liveHist, liveFcast }: {
  currentValue: number
  liveHist?: number[]
  liveFcast?: number[]
  forecastPct: number | null
}) {
  const hist  = liveHist  ?? []
  const fcast = liveFcast ?? []
  const all   = [...hist, ...fcast]
  if (all.length === 0) return <div style={{ height: 140, background: BG2, borderRadius: 8 }} />
  const min = Math.min(...all), max = Math.max(...all)
  const range = max - min || 1
  const W = 560, H = 140, PAD = 8
  const toX = (i: number, len: number) => PAD + (i / (len - 1)) * (W - PAD * 2)
  const toY = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2)
  const pts = (arr: number[], offset = 0) =>
    arr.map((v, i) => `${toX(i + offset, all.length)},${toY(v)}`).join(" ")
  const histPts  = pts(hist)
  const fcastPts = pts(fcast, hist.length)
  const splitX   = hist.length > 0 ? toX(hist.length - 1, all.length) : 0
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }} preserveAspectRatio="none">
      {fcast.length > 0 && (
        <rect x={splitX} y={0} width={W - splitX} height={H}
              fill={`${BLUE}0c`} />
      )}
      {hist.length > 1 && (
        <polyline points={histPts} fill="none" stroke={AMBER} strokeWidth={1.8} strokeLinejoin="round" />
      )}
      {fcast.length > 1 && (
        <polyline points={fcastPts} fill="none" stroke={BLUE} strokeWidth={1.8}
                  strokeDasharray="5 3" strokeLinejoin="round" />
      )}
    </svg>
  )
}

function SignalPill({ type, text }: { type: string; text: string }) {
  const col = type === "BULLISH" ? GREEN : type === "BEARISH" ? RED : AMBER
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: `${col}18`, border: `1px solid ${col}44`,
      borderRadius: 99, padding: "4px 10px", margin: "0 4px 6px 0",
      fontFamily: MONO, fontSize: 11, color: col, letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: col, flexShrink: 0 }} />
      {text}
    </span>
  )
}

function EmailCaptureForm({ source, label }: { source: string; label: string }) {
  const [email,     setEmail]     = useState("")
  const [status,    setStatus]    = useState<"idle"|"loading"|"done"|"error">("idle")
  const [errMsg,    setErrMsg]    = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) { setErrMsg("Enter a valid email."); setStatus("error"); return }
    setStatus("loading")
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      })
      setStatus(r.ok ? "done" : "error")
      if (!r.ok) setErrMsg("Subscription failed. Please try again.")
    } catch {
      setStatus("error"); setErrMsg("Network error. Please try again.")
    }
  }

  if (status === "done") {
    return <p style={{ fontFamily: SYS, fontSize: 14, color: GREEN }}>You&apos;re subscribed. See you Monday.</p>
  }
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
      <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)}
        style={{ flex: "1 1 220px", maxWidth: 320, background: BG2, border: `1px solid ${BD2}`,
                 borderRadius: 10, padding: "12px 16px", color: T1, fontFamily: SYS, fontSize: 14, outline: "none" }} />
      <button type="submit" disabled={status === "loading"}
        style={{ background: BLUE, color: "#fff", fontFamily: SYS, fontSize: 14, fontWeight: 600,
                 padding: "12px 22px", borderRadius: 10, border: "none", cursor: "pointer",
                 minWidth: 140, opacity: status === "loading" ? 0.7 : 1 }}>
        {status === "loading" ? "Subscribing…" : label}
      </button>
      {status === "error" && <p style={{ width: "100%", textAlign: "center", fontFamily: SYS, fontSize: 13, color: RED, margin: 0 }}>{errMsg}</p>}
    </form>
  )
}

const NAV_LINKS = [
  { label:"Intelligence", href:"/dashboard"    },
  { label:"Globe",        href:"/globe"        },
  { label:"Markets",      href:"/markets"      },
  { label:"Tools",        href:"/market-check" },
  { label:"Pricing",      href:"/pricing"      },
  { label:"About",        href:"/about"        },
]

export default function HomePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [spend,    setSpend]    = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employ,   setEmploy]   = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [foreD,    setForeD]    = useState<any>(null)
  const [signals,  setSignals]  = useState<Signal[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [surveyOpen, setSurveyOpen]       = useState(true)
  const [surveyQuarter, setSurveyQuarter] = useState("Q2 2025")

  useEffect(() => {
    async function safeFetch(url: string) {
      try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
    }
    async function load() {
      const [sd, ed, sigd, fd, surveyD] = await Promise.all([
        safeFetch("/api/census"), safeFetch("/api/bls"),
        safeFetch("/api/signals"), safeFetch("/api/forecast?series=TTLCONS"),
        safeFetch("/api/survey/results"),
      ])
      if (sd)      setSpend(sd)
      if (ed)      setEmploy(ed)
      if (sigd)    setSignals(sigd.signals ?? [])
      if (fd)      setForeD(fd)
      if (surveyD) {
        setSurveyQuarter(surveyD.quarter ?? "Q2 2025")
        setSurveyOpen(surveyD.collecting !== false)
      }
    }
    load()
  }, [])

  const spendVal = spend?.value  ?? spend?.latest?.value  ?? 2190
  const spendMom = spend?.mom    ?? spend?.latest?.mom    ?? 0.3
  const empVal   = employ?.value ?? employ?.latest?.value ?? 8330
  const empMom   = employ?.mom   ?? employ?.latest?.mom   ?? 0.31

  const liveHist: number[] | undefined  = foreD?.history
  const liveFcast: number[] | undefined = foreD?.ensemble?.map((p: { base: number }) => p.base)
  const forecastPct: number | null = (() => {
    if (!liveHist?.length || !liveFcast?.length) return null
    const lastH = liveHist[liveHist.length - 1]
    const lastF = liveFcast[liveFcast.length - 1]
    return lastH > 0 ? ((lastF - lastH) / lastH) * 100 : null
  })()

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS,
                  paddingBottom: "env(safe-area-inset-bottom,20px)" }}>
      <style>{`
        .hp-links  { display: flex; align-items: center; gap: 2px; }
        .hp-ham    { display: none; min-width: 44px; min-height: 44px; align-items: center;
                     justify-content: center; cursor: pointer; background: none; border: none;
                     color: rgba(255,255,255,0.72); margin-left: 8px; }
        .hp-mob    { display: none; position: fixed; top: 60px; left: 0; right: 0; z-index: 99;
                     background: rgba(6,6,8,0.97); backdrop-filter: blur(24px);
                     -webkit-backdrop-filter: blur(24px); border-bottom: 1px solid #2a2a2a;
                     flex-direction: column; padding: 12px 16px 24px; gap: 2px; }
        .hp-mob.open { display: flex; }
        .hp-mob-a  { font-size: 17px; font-weight: 500; letter-spacing: -0.01em;
                     color: rgba(255,255,255,0.72); padding: 14px 12px; border-radius: 10px;
                     display: block; text-decoration: none; transition: background 0.15s, color 0.15s; }
        .hp-mob-a:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .hp-mob-ctas { display: flex; flex-direction: column; gap: 10px;
                       padding-top: 16px; border-top: 1px solid #2a2a2a; margin-top: 12px; }
        .hp-hero   { padding: 96px 40px 0; }
        .hp-3col   { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .hp-aud    { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        @media (max-width: 860px) {
          .hp-links { display: none; }
          .hp-ham   { display: flex; }
          .hp-hero  { padding: 88px 24px 0; }
          .hp-3col  { grid-template-columns: 1fr; }
          .hp-aud   { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 540px) {
          .hp-hero  { padding: 72px 20px 0; }
          .hp-aud   { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,6,8,0.88)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${BD1}`,
        padding: "0 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60,
        paddingTop: "env(safe-area-inset-top,0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ"
                   style={{ height: 22, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 24, background: BD1 }} />
          <div className="hp-links" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} style={{ fontFamily: SYS, fontSize: 14, color: T3, padding: "6px 10px", borderRadius: 8, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = T1)}
                onMouseLeave={e => (e.currentTarget.style.color = T3)}>
                {label}
              </Link>
            ))}
            <Link
              href={surveyOpen ? "/survey" : "/survey/results"}
              style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: SYS, fontSize: 14, color: surveyOpen ? AMBER : T3, padding: "6px 10px", borderRadius: 8, transition: "color 0.15s" }}
            >
              {surveyOpen && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: AMBER, boxShadow: `0 0 5px ${AMBER}`, flexShrink: 0 }} />
              )}
              {surveyOpen ? `Take ${surveyQuarter} Survey` : "Survey Results"}
            </Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN,
                          boxShadow: `0 0 6px ${GREEN}`, animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: GREEN, letterSpacing: "0.08em" }}>LIVE</span>
          </div>
          <Link href="/dashboard"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                     background: BLUE, color: "#fff", fontSize: 14, fontWeight: 600,
                     padding: "8px 20px", borderRadius: 10, minHeight: 40,
                     letterSpacing: "-0.01em", textDecoration: "none" }}>
            Open Dashboard
          </Link>
          <button className="hp-ham" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
              <line x1="0" y1="1"  x2="20" y2="1"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="0" y1="7"  x2="20" y2="7"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="0" y1="13" x2="20" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      <div className={`hp-mob${menuOpen ? " open" : ""}`}>
        {NAV_LINKS.map(({ label, href }) => (
          <Link key={label} href={href} className="hp-mob-a" onClick={() => setMenuOpen(false)}>
            {label}
          </Link>
        ))}
        <Link
          href={surveyOpen ? "/survey" : "/survey/results"}
          className="hp-mob-a"
          onClick={() => setMenuOpen(false)}
          style={{ display: "flex", alignItems: "center", gap: 8, color: surveyOpen ? AMBER : T3 }}
        >
          {surveyOpen && <span style={{ width: 6, height: 6, borderRadius: "50%", background: AMBER, flexShrink: 0 }} />}
          {surveyOpen ? `Take ${surveyQuarter} Survey` : "Survey Results"}
        </Link>
        <div className="hp-mob-ctas">
          <Link href="/dashboard" onClick={() => setMenuOpen(false)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center",
                     background: BLUE, color: "#fff", fontSize: 15, fontWeight: 600,
                     padding: "13px 24px", borderRadius: 12, minHeight: 48,
                     letterSpacing: "-0.01em", textDecoration: "none" }}>
            Open Dashboard →
          </Link>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="hp-hero" style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: BG2,
                      border: `1px solid ${BD2}`, borderRadius: 99, padding: "6px 16px", marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: AMBER,
                        animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.08em" }}>
            312 DATA SOURCES · 3-MODEL AI ENSEMBLE · LIVE
          </span>
        </div>

        <h1 style={{ fontSize: "clamp(44px,6vw,80px)", fontWeight: 700, lineHeight: 1.06,
                     color: T1, letterSpacing: "-0.04em", maxWidth: 800, margin: "0 auto 24px" }}>
          Forecast construction risk.<br />
          <span style={{ color: BLUE }}>Act before markets move.</span>
        </h1>

        <p style={{ fontSize: 18, color: T3, lineHeight: 1.65, maxWidth: 520,
                    margin: "0 auto 40px", fontWeight: 400, letterSpacing: "-0.01em" }}>
          ConstructAIQ unifies 312 federal and state data sources into a live intelligence
          system — so construction leaders can see market risk 12 months ahead.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <Link href="/dashboard"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                     background: BLUE, color: "#fff", fontSize: 15, fontWeight: 600,
                     padding: "13px 28px", borderRadius: 12, minHeight: 48,
                     letterSpacing: "-0.01em", textDecoration: "none",
                     boxShadow: "0 4px 20px rgba(10,132,255,0.36)" }}>
            See Live Intelligence →
          </Link>
          <Link href="/pricing"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                     background: "transparent", color: T2, fontSize: 15, fontWeight: 500,
                     padding: "13px 24px", borderRadius: 12, minHeight: 48,
                     border: `1px solid ${BD2}`, letterSpacing: "-0.01em", textDecoration: "none" }}>
            View Pricing
          </Link>
        </div>

        <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.06em", marginBottom: 60 }}>
          NO LOGIN REQUIRED · UPDATED EVERY 4 HOURS
        </div>

        {/* ── HERO PRODUCT VISUAL ── */}
        <div style={{ background: BG1, borderRadius: 24, border: `1px solid ${BD1}`,
                      overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.60)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "20px 24px 16px", borderBottom: `1px solid ${BD1}` }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T4,
                            letterSpacing: "0.1em", marginBottom: 4 }}>
                TOTAL CONSTRUCTION SPEND · TTLCONS
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: AMBER }}>
                  ${(spendVal / 1000).toFixed(1)}B
                </span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: spendMom >= 0 ? GREEN : RED }}>
                  {spendMom >= 0 ? "+" : ""}{spendMom?.toFixed(2)}% MoM
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {forecastPct != null && (
                <div>
                  <div style={{ fontFamily: SYS, fontSize: 11, color: T4, fontWeight: 500, marginBottom: 4 }}>12-mo forecast</div>
                  <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700,
                                color: forecastPct >= 0 ? BLUE : RED }}>
                    {forecastPct >= 0 ? "+" : ""}{forecastPct.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: "20px 24px 8px" }}>
            <ForecastPreview currentValue={spendVal}
              liveHist={liveHist} liveFcast={liveFcast} forecastPct={forecastPct} />
          </div>

          <div style={{ padding: "8px 24px 16px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            {[
              { col: AMBER, label: "Historical" },
              { col: BLUE,  label: "AI Forecast" },
            ].map(({ col, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 2, background: col, borderRadius: 1 }} />
                <span style={{ fontFamily: MONO, fontSize: 10, color: T4 }}>{label}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 14, height: 10, background: "rgba(10,132,255,0.12)", borderRadius: 2 }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: T4 }}>80% Confidence</span>
            </div>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.06em" }}>
              HOLT-WINTERS / SARIMA / XGBOOST
            </span>
          </div>
        </div>
      </section>
      {/* ── TRUST STRIP ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 40px 0" }}>
        <div style={{ borderTop: `1px solid ${BD1}`, borderBottom: `1px solid ${BD1}`,
                      padding: "18px 0", display: "flex", alignItems: "center",
                      justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontFamily: SYS, fontSize: 11, color: T4, fontWeight: 600,
                         letterSpacing: "0.04em", whiteSpace: "nowrap", textTransform: "uppercase" }}>
            Data from
          </span>
          {SOURCES.map((s, i) => (
            <span key={i} style={{ fontSize: 12, color: T4, fontWeight: 500,
                                   padding: "0 14px", borderLeft: i > 0 ? `1px solid ${BD1}` : "none",
                                   whiteSpace: "nowrap" }}>{s}</span>
          ))}
        </div>
      </div>

      {/* ── THREE OUTCOME CARDS ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: SYS, fontSize: 11, color: BLUE, fontWeight: 600,
                        letterSpacing: "0.06em", marginBottom: 14, textTransform: "uppercase" }}>What you get</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: T1,
                       letterSpacing: "-0.03em", lineHeight: 1.1 }}>One system. Every signal.</h2>
        </div>
        <div className="hp-3col">
          {[
            { n: "01", title: "See risk 12 months ahead",
              desc: "A 3-model AI ensemble — Holt-Winters, SARIMA, XGBoost — produces forecasts with 80% and 95% confidence intervals updated every 4 hours.",
              col: AMBER },
            { n: "02", title: "Know what changed and why",
              desc: "Z-score anomaly detection and driver annotations explain every signal so you can trust what you're seeing and act with clarity.",
              col: BLUE },
            { n: "03", title: "Decide with precision",
              desc: "Scenario controls, state-level activity maps, and materials signals give you decision-ready views at every level of your operation.",
              col: GREEN },
          ].map(({ n, title, desc, col }) => (
            <div key={n} style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 20,
                                  padding: "32px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontFamily: SYS, fontSize: 11, color: col, fontWeight: 700, opacity: 0.5 }}>{n}</div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: T1, letterSpacing: "-0.02em", lineHeight: 1.3 }}>{title}</h3>
              <p style={{ fontSize: 14, color: T3, lineHeight: 1.7, fontWeight: 400 }}>{desc}</p>
              <div style={{ height: 2, width: 32, background: col, borderRadius: 1, opacity: 0.5, marginTop: "auto" }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── PLATFORM SHOWCASE ── */}
      <section style={{ background: BG1, borderTop: `1px solid ${BD1}`, borderBottom: `1px solid ${BD1}`, padding: "80px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontFamily: SYS, fontSize: 11, color: T4, fontWeight: 600,
                          letterSpacing: "0.06em", marginBottom: 14, textTransform: "uppercase" }}>
              Platform Intelligence
            </div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: T1,
                         letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 12 }}>
              Everything in context. Nothing buried.
            </h2>
            <p style={{ fontSize: 16, color: T3, maxWidth: 440, margin: "0 auto", lineHeight: 1.65 }}>
              State-level activity, materials signals, and live market data — unified in one view.
            </p>
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {/* State activity */}
            <div style={{ flex: "1 1 240px", background: BG2, borderRadius: 18, border: `1px solid ${BD1}`,
                          padding: "22px", minHeight: 260, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: SYS, fontSize: 11, color: T4, fontWeight: 600,
                            letterSpacing: "0.04em", marginBottom: 18, textTransform: "uppercase" }}>
                State Activity
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {[
                  { state: "TX", label: "HOT",     pct: 92, col: RED   },
                  { state: "FL", label: "HOT",     pct: 89, col: RED   },
                  { state: "AZ", label: "GROWING", pct: 74, col: AMBER },
                  { state: "NC", label: "GROWING", pct: 71, col: AMBER },
                  { state: "OH", label: "COOLING", pct: 48, col: BLUE  },
                ].map(({ state, label, pct, col }) => (
                  <div key={state} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T3, width: 22 }}>{state}</span>
                    <div style={{ flex: 1, height: 5, background: BG3, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: col,
                                   width: 56, textAlign: "right", letterSpacing: "0.04em" }}>{label}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard" style={{ fontFamily: SYS, fontSize: 13, color: T4,
                                               marginTop: 18, display: "block", fontWeight: 500 }}>
                All 50 states →
              </Link>
            </div>

            {/* Materials signals */}
            <div style={{ flex: "1 1 240px", background: BG2, borderRadius: 18, border: `1px solid ${BD1}`,
                          padding: "22px", minHeight: 260, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: SYS, fontSize: 11, color: T4, fontWeight: 600,
                            letterSpacing: "0.04em", marginBottom: 18, textTransform: "uppercase" }}>
                Materials Signals
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {[
                  { mat: "Lumber",   signal: "BUY",  chg: "+2.1%", col: GREEN },
                  { mat: "Steel",    signal: "HOLD", chg: "+0.4%", col: AMBER },
                  { mat: "Concrete", signal: "BUY",  chg: "+1.8%", col: GREEN },
                  { mat: "Copper",   signal: "SELL", chg: "-3.2%", col: RED   },
                  { mat: "WTI",      signal: "HOLD", chg: "-0.9%", col: AMBER },
                ].map(({ mat, signal, chg, col }) => (
                  <div key={mat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: T2, fontWeight: 500 }}>{mat}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>{chg}</span>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: col,
                                     background: sentBg(signal), borderRadius: 6,
                                     padding: "3px 8px", letterSpacing: "0.04em" }}>{signal}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/dashboard" style={{ fontFamily: SYS, fontSize: 13, color: T4,
                                               marginTop: 18, display: "block", fontWeight: 500 }}>
                Full signals →
              </Link>
            </div>

            {/* Live market data */}
            <div style={{ flex: "1 1 240px", background: BG2, borderRadius: 18, border: `1px solid ${BD1}`,
                          padding: "22px", minHeight: 260, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: SYS, fontSize: 11, color: T4, fontWeight: 600,
                            letterSpacing: "0.04em", textTransform: "uppercase" }}>Live Market Data</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                {[
                  { lbl: "Total Construction Spend", val: `$${(spendVal / 1000).toFixed(1)}B`, mom: spendMom, col: AMBER },
                  { lbl: "Construction Employment",  val: empVal >= 1000 ? `${(empVal / 1000).toFixed(1)}M` : `${empVal}K`, mom: empMom, col: GREEN },
                ].map(({ lbl, val, mom, col }, idx) => (
                  <div key={idx} style={{ paddingBottom: 14, borderBottom: `1px solid ${BD1}` }}>
                    <div style={{ fontFamily: SYS, fontSize: 10, color: T4, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 5, textTransform: "uppercase" }}>{lbl}</div>
                    <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: col, lineHeight: 1 }}>{val}</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: mom >= 0 ? GREEN : RED, marginTop: 3 }}>
                      {mom >= 0 ? "+" : ""}{mom?.toFixed(2)}% MoM
                    </div>
                  </div>
                ))}
                <div>
                  <div style={{ fontFamily: SYS, fontSize: 10, color: T4, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 5, textTransform: "uppercase" }}>Active AI Signals</div>
                  <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: BLUE, lineHeight: 1 }}>
                    {signals.length || 6}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ── LIVE SIGNALS ── */}
      {signals.length > 0 && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 40px 0" }}>
          <div style={{ fontFamily: SYS, fontSize: 11, color: T4, fontWeight: 600,
                        letterSpacing: "0.04em", marginBottom: 12, textTransform: "uppercase" }}>
            Today&apos;s Signals
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {signals.slice(0, 8).map((s, i) => <SignalPill key={i} type={s.type} text={s.title} />)}
          </div>
        </div>
      )}

      {/* ── FORECASTING DEEP-DIVE ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: SYS, fontSize: 11, color: T4, fontWeight: 600,
                        letterSpacing: "0.06em", marginBottom: 14, textTransform: "uppercase" }}>
            How it works
          </div>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: T1,
                       letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Built on institutional-grade models
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {[
            { icon: "◎", tag: "AI ENGINE",   title: "3-Model Ensemble",
              desc: "Holt-Winters seasonality, SARIMA time-series, and XGBoost gradient boosting — accuracy-weighted and updated every 4 hours." },
            { icon: "◈", tag: "DETECTION",   title: "Anomaly Signals",
              desc: "Z-score detection across 12 federal data series. Trend reversals, divergence patterns, and acceleration signals — explained." },
            { icon: "◉", tag: "GEOGRAPHY",   title: "50-State Intelligence",
              desc: "BEA state-level GDP, permit trends, and regional spend classified HOT / GROWING / COOLING in real time." },
            { icon: "◇", tag: "PROCUREMENT", title: "Materials Intelligence",
              desc: "BUY / SELL / HOLD signals for lumber, steel, concrete, copper, WTI, and diesel. Composite index updated hourly." },
          ].map(({ icon, tag, title, desc }) => (
            <div key={title} style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 18, padding: "28px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <span style={{ fontFamily: MONO, fontSize: 18, color: BLUE, lineHeight: 1 }}>{icon}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em" }}>{tag}</span>
              </div>
              <h4 style={{ fontSize: 17, fontWeight: 700, color: T1, letterSpacing: "-0.02em",
                           lineHeight: 1.3, marginBottom: 10 }}>{title}</h4>
              <p style={{ fontSize: 13.5, color: T3, lineHeight: 1.72, fontWeight: 400 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section style={{ background: BG1, borderTop: `1px solid ${BD1}`, padding: "80px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontFamily: SYS, fontSize: 11, color: T4, fontWeight: 600,
                          letterSpacing: "0.06em", marginBottom: 14, textTransform: "uppercase" }}>
              Who it&apos;s for
            </div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: T1,
                         letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Built for professionals who move capital
            </h2>
          </div>
          <div className="hp-aud">
            {[
              { title: "Federal Government", desc: "Infrastructure spend oversight, economic forecasting, and policy impact analysis across all 50 states." },
              { title: "Bankers & Lenders",  desc: "Construction loan risk, market timing signals, and portfolio exposure by region and segment." },
              { title: "Venture Capital",    desc: "Pipeline intelligence and sector timing for construction tech investments and real estate funds." },
              { title: "Equity Analysts",    desc: "Sector rotation signals for construction and materials equities. Know when to move before consensus." },
              { title: "Developers",         desc: "Project timing, cost forecasting, and market entry signals to maximize returns and reduce risk." },
              { title: "Manufacturers",      desc: "Demand forecasting for construction materials and equipment, aligned with real pipeline data." },
            ].map(({ title, desc }) => (
              <div key={title} style={{ background: BG2, border: `1px solid ${BD1}`, borderRadius: 16, padding: "24px 22px" }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, letterSpacing: "-0.01em", marginBottom: 8 }}>{title}</h4>
                <p style={{ fontSize: 13.5, color: T3, lineHeight: 1.65, fontWeight: 400 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 40px" }}>
        <div style={{ background: "linear-gradient(135deg,rgba(10,132,255,0.08) 0%,rgba(6,6,8,0) 60%)",
                      border: "1px solid rgba(10,132,255,0.18)", borderRadius: 24,
                      padding: "60px 48px", textAlign: "center" }}>
          <div style={{ fontFamily: SYS, fontSize: 11, color: BLUE, fontWeight: 600,
                        letterSpacing: "0.06em", marginBottom: 20, textTransform: "uppercase" }}>
            Weekly Briefing
          </div>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: T1,
                       letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 14 }}>
            The construction market brief,<br />every Monday.
          </h2>
          <p style={{ fontSize: 16, color: T3, lineHeight: 1.65, maxWidth: 420, margin: "0 auto 32px" }}>
            Top 3 signals, a 30-day forecast snapshot, and the one data point every
            construction professional needs to know.
          </p>
          <EmailCaptureForm source="weekly-brief" label="Subscribe Free" />
          <div style={{ fontFamily: SYS, fontSize: 12, color: T4, marginTop: 14 }}>
            No spam. Unsubscribe anytime. 2,000+ subscribers.
          </div>
          <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${BD1}`,
                        display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                       background: BLUE, color: "#fff", fontSize: 15, fontWeight: 600,
                       padding: "13px 28px", borderRadius: 12, minHeight: 48,
                       letterSpacing: "-0.01em", textDecoration: "none",
                       boxShadow: "0 4px 20px rgba(10,132,255,0.36)" }}>
              Open Dashboard →
            </Link>
            <Link href="/pricing"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                       background: "transparent", color: T2, fontSize: 15, fontWeight: 500,
                       padding: "13px 24px", borderRadius: 12, minHeight: 48,
                       border: `1px solid ${BD2}`, letterSpacing: "-0.01em", textDecoration: "none" }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${BD1}`, padding: "28px 40px",
                       display: "flex", alignItems: "center", justifyContent: "space-between",
                       flexWrap: "wrap", gap: 12 }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ"
               style={{ height: 18, width: "auto" }} />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[...NAV_LINKS, { label: "Survey", href: "/survey/about" }, { label: "Contact", href: "/contact" }].map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontSize: 13, color: T4 }}>{label}</Link>
          ))}
        </div>
        <div style={{ fontFamily:SYS, fontSize:12, color:T4 }}>© 2026 ConstructAIQ</div>
      </footer>
    </div>
  )
}
