"use client"
import { useState, useEffect, useRef } from "react"
import { font, color, sentColor, fmtB, fmtN, fmtK, fmtPct } from "@/lib/theme"
import type { ForecastData, Signal, NewsItem, Commodity, StateData, Tab } from "./types"
import { ForecastChart } from "./components/ForecastChart"
import { SigCard } from "./components/SigCard"
import { NewsCard } from "./components/NewsCard"
import { PriceCard } from "./components/PriceCard"
import { StateRow } from "./components/StateRow"
import { ScenarioBuilder } from "./components/ScenarioBuilder"
import { TabBar } from "./components/TabBar"
import { LeftPanel } from "./components/LeftPanel"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3, BG4 = color.bg4
const BD1       = color.bd1,      BD2 = color.bd2, BD3 = color.bd3
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

// ── MAIN DASHBOARD v7 ─────────────────────────────────────────────────────────
export default function Dashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [spend,  setSpend]    = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employ, setEmploy]   = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rates,  setRates]    = useState<any>(null)
  const [prices, setPrices]   = useState<{ commodities: Commodity[] } | null>(null)
  const [fore,   setFore]     = useState<ForecastData | null>(null)
  const [sigs,   setSigs]     = useState<{ signals: Signal[] } | null>(null)
  const [newsD,  setNewsD]    = useState<{ items: NewsItem[] } | null>(null)
  const [mapD,   setMapD]     = useState<{ states: StateData[] } | null>(null)
  const [tab,    setTab]       = useState("forecast")
  const [now,    setNow]       = useState("")
  const [selSig,   setSelSig]   = useState<number | null>(null)
  const [selState, setSelState] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartW, setChartW]  = useState(620)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000)
    setNow(new Date().toLocaleTimeString("en-US", { hour12: false }))
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    // Read initial width immediately — don't wait for first ResizeObserver callback
    setChartW(chartRef.current.getBoundingClientRect().width || 620)
    const ro = new ResizeObserver(entries => setChartW(entries[0].contentRect.width || 620))
    ro.observe(chartRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    async function safeFetch(url: string) {
      try { const r = await fetch(url); return r.ok ? r.json() : null } catch { return null }
    }
    async function load() {
      const [spendData, employData, ratesData, pricesData, foreData, sigsData, newsData, mapData] =
        await Promise.all([
          safeFetch('/api/census'),
          safeFetch('/api/bls'),
          safeFetch('/api/rates'),
          safeFetch('/api/pricewatch'),
          safeFetch('/api/forecast?series=TTLCONS'),
          safeFetch('/api/signals'),
          safeFetch('/api/news'),
          safeFetch('/api/map'),
        ])
      if (spendData)  setSpend(spendData)
      if (employData) setEmploy(employData)
      if (ratesData)  setRates(ratesData)
      if (pricesData) setPrices(pricesData)
      if (foreData)   setFore(foreData)
      if (sigsData)   setSigs(sigsData)
      if (newsData)   setNewsD(newsData)
      if (mapData)    setMapD(mapData)
    }
    load()
  }, [])

  const spendVal    = spend?.value  ?? spend?.latest?.value  ?? 2190
  const spendMom    = spend?.mom    ?? spend?.latest?.mom    ?? 0
  const empVal      = employ?.value ?? employ?.latest?.value ?? 8330
  const empMom      = employ?.mom   ?? employ?.latest?.mom   ?? 0
  const rate30      = rates?.mortgage30 ?? rates?.data?.MORTGAGE30US?.value ?? 6.85
  const rate10      = rates?.treasury10 ?? rates?.data?.DGS10?.value        ?? 4.28
  const spread      = Number(rate30) - Number(rate10)
  const signals     = sigs?.signals      ?? []
  const newsItems   = newsD?.items       ?? []
  const states      = mapD?.states       ?? []
  const commodities = prices?.commodities ?? []
  const metrics     = fore?.metrics      ?? { accuracy: 0, mape: 0, models: 0 }

  const bullN = signals.filter(s => s.type === "BULLISH").length
  const bearN = signals.filter(s => s.type === "BEARISH").length
  const warnN = signals.filter(s => s.type === "WARNING").length

  const TABS: Tab[] = [
    { id: "forecast", icon: "📈", label: "Forecast",  badge: null },
    { id: "signals",  icon: "📡", label: "Signals",   badge: signals.length },
    { id: "news",     icon: "📰", label: "Newswire",  badge: newsItems.length },
    { id: "map",      icon: "🗺",  label: "States",    badge: states.length },
    { id: "prices",   icon: "💹", label: "Prices",    badge: commodities.length },
    { id: "scenario", icon: "🎛",  label: "Scenario",  badge: null },
  ]

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS, paddingBottom: "env(safe-area-inset-bottom,20px)" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        button{outline:none;border:none;font-family:inherit}
        input[type=range]{appearance:auto}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      `}</style>

      {/* HEADER */}
      <div style={{
        background: BG1, borderBottom: `1px solid ${BD1}`,
        padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        minHeight: 60, position: "sticky", top: 0, zIndex: 100,
        paddingTop: "calc(env(safe-area-inset-top,0px) + 12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg"
            style={{ height: 24 }} alt="ConstructAIQ" />
          <div style={{ width: 1, height: 24, background: BD2 }} />
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.08em" }}>MARKET TERMINAL v7</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: T4 }}>HW · SARIMA · XGBOOST</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>TTLCONS</div>
            <div style={{ fontFamily: MONO, fontSize: 14, color: AMBER, fontWeight: 600 }}>{fmtB(spendVal)}</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: spendMom >= 0 ? GREEN : RED }}>{fmtPct(spendMom)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>EMPLOY</div>
            <div style={{ fontFamily: MONO, fontSize: 14, color: GREEN, fontWeight: 600 }}>{fmtK(empVal)}K</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: empMom >= 0 ? GREEN : RED }}>{fmtPct(empMom)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>30YR</div>
            <div style={{ fontFamily: MONO, fontSize: 14, color: spread > 2.5 ? RED : GREEN, fontWeight: 600 }}>{fmtN(rate30)}%</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>{now}</div>
        </div>
      </div>

      {/* TICKER */}
      <div style={{ background: BG2, borderBottom: `1px solid ${BD1}`, height: 34, overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, padding: "0 14px", borderRight: `1px solid ${BD2}`, whiteSpace: "nowrap", height: "100%", display: "flex", alignItems: "center", flexShrink: 0 }}>LIVE</div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{ display: "inline-flex", animation: "ticker 50s linear infinite", whiteSpace: "nowrap", alignItems: "center" }}>
            {(signals.length > 0 ? [...signals, ...signals] : [
              { type: "BULLISH", title: "Employment Cycle High — 8,330K" },
              { type: "WARNING", title: "Spend/Permit Divergence Detected" },
              { type: "BULLISH", title: "IIJA $890B Absorption Continues" },
              { type: "BEARISH", title: "Permits -12% from Feb 2024 Peak" },
            ]).map((s, i) => (
              <span key={i} style={{ fontFamily: SYS, fontSize: 14, color: sentColor(s.type), padding: "0 24px", borderRight: `1px solid ${BD2}` }}>{s.title}</span>
            ))}
          </div>
        </div>
      </div>

      {/* SIGNAL PILLS */}
      <div style={{ background: BG1, borderBottom: `1px solid ${BD1}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.08em" }}>SIGNALS</span>
        {([
          { label: `▲ ${bullN} BULLISH`, col: GREEN, bg: GREEN_DIM },
          { label: `▼ ${bearN} BEARISH`, col: RED,   bg: RED_DIM   },
          { label: `⚠ ${warnN} WARNING`, col: AMBER,  bg: AMBER_DIM },
        ] as const).map(p => (
          <div key={p.label} style={{ background: p.bg, borderRadius: 20, padding: "4px 12px", border: `1px solid ${p.col}44` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: p.col, fontWeight: 600 }}>{p.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {metrics.accuracy && (
          <div style={{ background: BG3, borderRadius: 20, padding: "4px 12px", border: `1px solid ${BD2}` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: GREEN }}>Ensemble {metrics.accuracy}% acc · {metrics.models ?? 2} models</span>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div style={{ display: "flex", gap: 10, padding: 12, height: "calc(100vh - 174px)", overflow: "hidden" }}>

        {/* LEFT PANEL */}
        <LeftPanel
          spendVal={spendVal}
          spendMom={spendMom}
          empVal={empVal}
          empMom={empMom}
          rate30={rate30}
          rate10={rate10}
          spend={spend}
          employ={employ}
          rates={rates}
          commodities={commodities}
          fore={fore}
          signals={signals}
          newsItems={newsItems}
          states={states}
        />

        {/* CENTER PANEL */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <TabBar tabs={TABS} active={tab} onChange={setTab} />

          <div style={{ flex: 1, overflowY: "auto", borderRadius: 14 }}>

            {/* FORECAST */}
            {tab === "forecast" && (
              <div style={{ background: BG1, borderRadius: 14, padding: 16, border: `1px solid ${BD1}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: AMBER, fontWeight: 600, letterSpacing: "0.06em" }}>TOTAL CONSTRUCTION SPENDING — 12-MONTH FORECAST</div>
                  {fore && <div style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>Trained on {fore.trainedOn} obs · {fore.runAt?.slice(0, 10)}</div>}
                </div>
                <div ref={chartRef} style={{ width: "100%" }}>
                  <ForecastChart foreData={fore} width={Math.max(chartW, 400)} height={240} />
                </div>
                {(fore?.models?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: T4, marginBottom: 10, letterSpacing: "0.08em" }}>MODEL BREAKDOWN</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {fore!.models.map((m, i) => {
                        const col      = m.model === "holt-winters" ? GREEN : m.model === "xgboost" ? BLUE : AMBER
                        const widthPct = Math.round((m.weight ?? 0) * 100)
                        return (
                          <div key={i} style={{ background: BG2, borderRadius: 10, padding: "12px 14px", border: `1px solid ${BD1}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: col }} />
                                <span style={{ fontFamily: MONO, fontSize: 13, color: T2, fontWeight: 600, textTransform: "uppercase" }}>{m.model}</span>
                              </div>
                              <div style={{ display: "flex", gap: 16 }}>
                                <span style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>MAPE {m.mape}%</span>
                                <span style={{ fontFamily: MONO, fontSize: 12, color: GREEN }}>Acc {m.accuracy}%</span>
                                <span style={{ fontFamily: MONO, fontSize: 12, color: col, fontWeight: 600 }}>Weight {widthPct}%</span>
                              </div>
                            </div>
                            <div style={{ background: BG3, borderRadius: 4, height: 6, overflow: "hidden" }}>
                              <div style={{ background: col, height: "100%", width: `${widthPct}%`, borderRadius: 4, transition: "width 0.5s ease" }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SIGNALS */}
            {tab === "signals" && (
              <div style={{ background: BG1, borderRadius: 14, padding: 14, border: `1px solid ${BD1}` }}>
                {signals.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {signals.map((s, i) => (
                      <SigCard key={i} sig={s} selected={selSig === i} onTap={() => setSelSig(selSig === i ? null : i)} />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
                    <div style={{ fontFamily: SYS, fontSize: 16, color: T2, fontWeight: 600 }}>Generating Signals</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: T4, marginTop: 8 }}>/api/signals?generate=1</div>
                  </div>
                )}
              </div>
            )}

            {/* NEWS */}
            {tab === "news" && (
              <div style={{ background: BG1, borderRadius: 14, padding: 14, border: `1px solid ${BD1}` }}>
                {newsItems.length > 0
                  ? newsItems.map((item, i) => <NewsCard key={i} item={item} />)
                  : <div style={{ padding: 40, textAlign: "center", fontFamily: SYS, fontSize: 15, color: T4 }}>Aggregating news feeds…</div>
                }
              </div>
            )}

            {/* MAP */}
            {tab === "map" && (
              <div style={{ background: BG1, borderRadius: 14, padding: 14, border: `1px solid ${BD1}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: AMBER, fontWeight: 600 }}>STATE CONSTRUCTION ACTIVITY</div>
                </div>
                <div style={{ maxHeight: 440, overflowY: "auto" }}>
                  {states.slice(0, 25).map(s => (
                    <StateRow key={s.code} s={s} selected={selState === s.code}
                      onTap={() => setSelState(selState === s.code ? null : s.code)} />
                  ))}
                </div>
              </div>
            )}

            {/* PRICES */}
            {tab === "prices" && (
              <div style={{ background: BG1, borderRadius: 14, padding: 14, border: `1px solid ${BD1}` }}>
                <div style={{ fontFamily: MONO, fontSize: 13, color: AMBER, fontWeight: 600, marginBottom: 12 }}>COMMODITY & MATERIALS WATCH</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {(commodities.length > 0 ? commodities : ([
                    { name: "Lumber",   value: 421.8, mom: -3.74, yoy: -15.2, unit: "PPI",  signal: "BUY",  trend: "DOWN" },
                    { name: "Steel",    value: 318.4, mom:  2.84, yoy:   8.4, unit: "PPI",  signal: "SELL", trend: "UP"   },
                    { name: "Concrete", value: 284.6, mom:  1.21, yoy:   4.8, unit: "PPI",  signal: "HOLD", trend: "UP"   },
                    { name: "Copper",   value: 9842,  mom:  4.48, yoy:  12.4, unit: "$/t",  signal: "SELL", trend: "UP"   },
                  ] as Commodity[])).map((item, i) => <PriceCard key={i} item={item} />)}
                </div>
              </div>
            )}

            {/* SCENARIO */}
            {tab === "scenario" && (
              <div style={{ background: BG1, borderRadius: 14, padding: 14, border: `1px solid ${BD1}` }}>
                <div style={{ fontFamily: MONO, fontSize: 13, color: AMBER, fontWeight: 600, marginBottom: 16 }}>SCENARIO BUILDER</div>
                <ScenarioBuilder />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
