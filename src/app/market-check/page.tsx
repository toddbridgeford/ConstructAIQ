"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts"
import { font, color, fmtB, fmtPct, sentColor } from "@/lib/theme"
import { Nav } from "@/app/components/Nav"

const SYS  = font.sys
const MONO = font.mono

const AMBER    = color.amber
const GREEN    = color.green
const RED      = color.red
const BLUE     = color.blue
const BG0      = color.bg0
const BG1      = color.bg1
const BG2      = color.bg2
const BG3      = color.bg3
const BD1      = color.bd1
const BD2      = color.bd2
const T1       = color.t1
const T3       = color.t3
const T4       = color.t4
const AMBER_DIM = color.amberDim
const GREEN_DIM = color.greenDim
const RED_DIM   = color.redDim
const BLUE_DIM  = color.blueDim

function fmtK(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}` : String(Math.round(v))
}

const RECENT_SEARCHES = [
  "Dallas TX",
  "Chicago IL",
  "Phoenix AZ",
  "Denver CO",
  "Tampa FL",
  "Nashville TN",
]

const FACTOR_PILLS = [
  { label: "Permits",           weight: "30%" },
  { label: "Employment",        weight: "25%" },
  { label: "Federal Awards",    weight: "20%" },
  { label: "Materials Pressure",weight: "15%" },
  { label: "Momentum",          weight: "10%" },
]

function classificationStyle(cls: string): { bg: string; color: string } {
  switch (cls) {
    case "HOT":      return { bg: GREEN_DIM,  color: GREEN }
    case "GROWING":  return { bg: BLUE_DIM,   color: BLUE }
    case "NEUTRAL":  return { bg: AMBER_DIM,  color: AMBER }
    case "COOLING":  return { bg: color.amberDim, color: color.orange }
    case "DECLINING":return { bg: RED_DIM,    color: RED }
    default:         return { bg: BG3,         color: T3 }
  }
}

export default function MarketCheckPage() {
  const [query, setQuery]                   = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults]               = useState<any>(null)
  const [loading, setLoading]               = useState(false)
  const [suggestions, setSuggestions]       = useState<string[]>([])
  const [forecastUnlocked, setForecastUnlocked] = useState(false)
  const [emailInput, setEmailInput]         = useState("")
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const suggRef     = useRef<HTMLDivElement>(null)

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        suggRef.current &&
        !suggRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const fetchSuggestions = useCallback((val: string) => {
    if (!val.trim()) { setSuggestions([]); return }
    fetch(`/api/market-check?autocomplete=${encodeURIComponent(val)}`)
      .then(r => r.json())
      .then(data => {
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      })
      .catch(() => setSuggestions([]))
  }, [])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  async function runSearch(market: string) {
    if (!market.trim()) return
    setLoading(true)
    setError(null)
    setResults(null)
    setShowSuggestions(false)
    setSuggestions([])
    setForecastUnlocked(false)
    setEmailSubmitted(false)
    setEmailInput("")
    try {
      const res  = await fetch(`/api/market-check?market=${encodeURIComponent(market)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    runSearch(query)
  }

  function handleSuggestionClick(s: string) {
    setQuery(s)
    runSearch(s)
  }

  function handleChipClick(chip: string) {
    setQuery(chip)
    runSearch(chip)
  }

  function handleUnlockForecast() {
    if (!emailInput.trim()) return
    setForecastUnlocked(true)
    setEmailSubmitted(true)
  }

  // Forecast data derived from results
  const forecastData = results
    ? Array.from({ length: 12 }, (_, i) => ({
        label: `M+${i + 1}`,
        value: +(results.metrics.permitVolume.value * (1 + 0.004 * (i + 1))).toFixed(0),
      }))
    : []

  const clsStyle = results ? classificationStyle(results.classification) : { bg: BG3, color: T3 }

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS, paddingBottom: "env(safe-area-inset-bottom,20px)" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit;cursor:pointer;border:none}
        button:hover{opacity:0.85}
        input{outline:none}
        input::placeholder{color:${T4}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes skeleton{0%,100%{opacity:.3}50%{opacity:.6}}
        .skel{animation:skeleton 1.4s ease-in-out infinite}
        .chip:hover{background:${BG3}!important;border-color:${BD2}!important}
        .sugg-item:hover{background:${BG3}!important}
        .comp-card:hover{border-color:${AMBER}!important}
      `}</style>

      <Nav />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* SECTION 1 — Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: AMBER_DIM, border: `1px solid ${AMBER}44`, borderRadius: 20, padding: "5px 16px", marginBottom: 24 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.1em" }}>FREE · NO LOGIN REQUIRED · LIVE DATA</span>
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 700, color: T1, lineHeight: 1.15, marginBottom: 14, letterSpacing: "-0.02em" }}>
            Is My Market HOT or COOLING?
          </h1>
          <p style={{ fontFamily: SYS, fontSize: 17, color: T3, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 32px" }}>
            Instant data-driven intelligence on any U.S. construction market.
          </p>

          {/* Search row */}
          <div style={{ display: "flex", gap: 8, maxWidth: 640, margin: "0 auto", position: "relative" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Enter city, metro area, or state (e.g. Austin TX)"
                style={{
                  width: "100%", flex: 1, fontSize: 16, padding: "12px 18px",
                  background: BG1, border: `1px solid ${BD2}`, borderRadius: 10,
                  color: T1, fontFamily: SYS,
                }}
              />

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggRef}
                  style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0,
                    width: "100%", background: BG2, border: `1px solid ${BD1}`,
                    borderRadius: 8, zIndex: 20, overflow: "hidden",
                  }}
                >
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="sugg-item"
                      onClick={() => handleSuggestionClick(s)}
                      style={{ padding: "10px 14px", cursor: "pointer", fontFamily: SYS, fontSize: 14, color: T1, background: BG2 }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSearch}
              style={{
                background: AMBER, color: "#000", fontFamily: MONO, fontSize: 13,
                fontWeight: 700, padding: "12px 24px", borderRadius: 10,
                cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.04em",
              }}
            >
              Check My Market →
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 13, color: RED }}>
              {error}
            </div>
          )}
        </div>

        {/* SECTION 2 — How It Works (only when no results) */}
        {!results && !loading && (
          <div style={{ marginBottom: 40 }}>
            {/* Factor pills */}
            <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", textAlign: "center", marginBottom: 12 }}>
              SCORING METHODOLOGY — 5 FACTORS
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
              {FACTOR_PILLS.map(f => (
                <div key={f.label} style={{
                  background: BG1, border: `1px solid ${BD1}`, borderRadius: 8,
                  padding: "8px 14px", fontFamily: MONO, fontSize: 11, color: T3,
                  display: "flex", gap: 6, alignItems: "center",
                }}>
                  <span style={{ color: T1 }}>{f.label}</span>
                  <span style={{ color: AMBER }}>{f.weight}</span>
                </div>
              ))}
            </div>

            {/* Recent searches */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.08em", marginBottom: 12 }}>
                WHAT OTHERS ARE CHECKING:
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {RECENT_SEARCHES.map(chip => (
                  <button
                    key={chip}
                    className="chip"
                    onClick={() => handleChipClick(chip)}
                    style={{
                      background: BG2, border: `1px solid ${BD1}`, borderRadius: 20,
                      padding: "7px 16px", fontFamily: MONO, fontSize: 12, color: T3,
                      cursor: "pointer",
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3 — Loading skeleton */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="skel" style={{ background: BG2, borderRadius: 12, height: i < 2 ? 80 : 120 }} />
            ))}
          </div>
        )}

        {/* SECTION 4 — Results */}
        {results && !loading && (
          <div>
            {/* A) Header card */}
            <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: 28, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: T1, lineHeight: 1.1, marginBottom: 10 }}>
                    {results.market}
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center" }}>
                    <span style={{
                      background: clsStyle.bg, color: clsStyle.color,
                      fontFamily: MONO, fontSize: 14, fontWeight: 700,
                      padding: "6px 20px", borderRadius: 20, letterSpacing: "0.08em",
                    }}>
                      {results.classification}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.08em", marginBottom: 6 }}>MARKET SCORE</div>
                  <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: T1 }}>{results.score}<span style={{ fontSize: 14, color: T4 }}>/100</span></div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>RANK #{results.nationalRank} NATIONALLY</div>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ background: BG2, borderRadius: 6, height: 8, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(100, results.score)}%`, height: "100%",
                  background: clsStyle.color, borderRadius: 6, transition: "width 0.6s ease",
                }} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T4, marginTop: 6 }}>
                Score: {results.score}/100 | Rank: #{results.nationalRank} nationally
              </div>
            </div>

            {/* B) 5 metric cards */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              {[
                {
                  key: "permitVolume",
                  label: "PERMIT VOLUME",
                  value: results.metrics.permitVolume.value.toLocaleString(),
                  yoy: results.metrics.permitVolume.yoy,
                },
                {
                  key: "permitValue",
                  label: "PERMIT VALUE",
                  value: fmtB(results.metrics.permitValue.value),
                  yoy: results.metrics.permitValue.yoy,
                },
                {
                  key: "employment",
                  label: "EMPLOYMENT",
                  value: fmtK(results.metrics.employment.value) + "K",
                  yoy: results.metrics.employment.yoy,
                },
                {
                  key: "federalAwards",
                  label: "FEDERAL AWARDS",
                  value: fmtB(results.metrics.federalAwards.value),
                  yoy: results.metrics.federalAwards.yoy,
                },
                {
                  key: "materialsPressure",
                  label: "MATERIALS PRESSURE",
                  value: results.metrics.materialsPressure.value,
                  yoy: results.metrics.materialsPressure.yoy,
                },
              ].map(m => {
                const yoyNum = typeof m.yoy === "number" ? m.yoy : parseFloat(m.yoy)
                const yoyColor = yoyNum >= 0 ? GREEN : RED
                return (
                  <div key={m.key} style={{
                    background: BG1, border: `1px solid ${BD1}`, borderRadius: 12,
                    padding: 16, flex: "1 1 140px", minWidth: 130,
                  }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.08em", marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: T1, marginBottom: 4 }}>{m.value}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: yoyColor }}>{fmtPct(yoyNum)} YoY</div>
                  </div>
                )
              })}
            </div>

            {/* C) 24-month permit chart */}
            {results.history && results.history.length > 0 && (
              <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.08em", marginBottom: 12 }}>
                  24-MONTH PERMIT HISTORY
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={results.history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Bar dataKey="permits" fill={AMBER} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* D) Comparable markets */}
            {results.comparables && results.comparables.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.08em", marginBottom: 10 }}>
                  SIMILAR MARKETS
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {results.comparables.map((comp: any) => {
                    const cs = classificationStyle(comp.classification)
                    return (
                      <div
                        key={comp.market}
                        className="comp-card"
                        onClick={() => { setQuery(comp.market); runSearch(comp.market) }}
                        style={{
                          background: BG1, border: `1px solid ${BD1}`, borderRadius: 10,
                          padding: 14, cursor: "pointer", flex: "1 1 160px", minWidth: 150,
                        }}
                      >
                        <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: T1, marginBottom: 6 }}>{comp.market}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{
                            background: cs.bg, color: cs.color, fontFamily: MONO,
                            fontSize: 10, padding: "3px 10px", borderRadius: 12, fontWeight: 700,
                          }}>
                            {comp.classification}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>{comp.score}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* E) Gated forecast section */}
            <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 12, padding: 24 }}>
              {!forecastUnlocked ? (
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: T4, letterSpacing: "0.08em", marginBottom: 16 }}>
                    🔒 12-MONTH FORECAST — {results.market}
                  </div>
                  <div style={{ background: BG2, height: 120, borderRadius: 8, filter: "blur(4px)", marginBottom: 16 }} />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleUnlockForecast()}
                    placeholder="Enter your email to unlock"
                    style={{
                      fontFamily: SYS, fontSize: 14, background: BG2, border: `1px solid ${BD1}`,
                      borderRadius: 8, padding: "10px 14px", width: "100%",
                      color: T1, marginBottom: 8, display: "block",
                    }}
                  />
                  <button
                    onClick={handleUnlockForecast}
                    style={{
                      background: AMBER, color: "#000", fontFamily: MONO, fontSize: 12,
                      fontWeight: 700, padding: "10px", width: "100%", borderRadius: 8,
                      cursor: "pointer", letterSpacing: "0.06em",
                    }}
                  >
                    Unlock Free Forecast →
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: AMBER, letterSpacing: "0.08em", marginBottom: 16 }}>
                    AI FORECAST: {results.market} — next 12 months
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={forecastData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={BLUE}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5 — Upgrade CTA (always shown) */}
        <div style={{
          background: BG1, border: `1px solid ${BD1}`, borderRadius: 16,
          padding: 24, display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 16, marginTop: 40,
        }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: SYS, fontSize: 18, color: T1, fontWeight: 700, marginBottom: 12 }}>
              Want the full intelligence picture?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "50-state HOT / GROWING / COOLING map with daily updates",
                "AI 12-month sector forecasts — model-grade accuracy",
                "Materials BUY/SELL/HOLD signals: lumber, steel, copper, diesel",
                "Weekly Market Intelligence Brief every Monday morning",
              ].map((feat, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: GREEN, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: SYS, fontSize: 13, color: T3 }}>{feat}</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/pricing">
            <button style={{
              background: AMBER, color: "#000", fontFamily: MONO, fontSize: 13,
              fontWeight: 700, padding: "12px 28px", borderRadius: 12,
              cursor: "pointer", letterSpacing: "0.06em", whiteSpace: "nowrap",
            }}>
              View Plans →
            </button>
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{
        borderTop: `1px solid ${BD1}`,
        padding: "24px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        background: BG1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ" style={{ height: 20, width: "auto" }} />
          </Link>
          <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform</div>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Dashboard",    href: "/dashboard" },
            { label: "Markets",      href: "/markets" },
            { label: "Pricing",      href: "/pricing" },
            { label: "Research",     href: "/research" },
            { label: "Contact",      href: "/contact" },
          ].map(link => (
            <Link key={link.href} href={link.href} style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
