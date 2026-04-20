"use client"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { font, color, fmtB, fmtN, fmtK, fmtPct } from "@/lib/theme"
import type { ForecastData, Signal, NewsItem, Commodity, StateData, Tab } from "./types"
import { ForecastChart } from "./components/ForecastChart"
import { SigCard } from "./components/SigCard"
import { NewsCard } from "./components/NewsCard"
import { PriceCard } from "./components/PriceCard"
import { StateRow } from "./components/StateRow"
import { ScenarioBuilder } from "./components/ScenarioBuilder"
import { TabBar } from "./components/TabBar"
import { LeftPanel } from "./components/LeftPanel"
import { ErrorBoundary } from "./components/ErrorBoundary"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3
const BD1       = color.bd1,      BD2 = color.bd2
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

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
  const [tab,    setTab]       = useState("signals")
  const [selSig,   setSelSig]   = useState<number | null>(null)
  const [selState, setSelState] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartW, setChartW]  = useState(620)

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
  const signals     = sigs?.signals      ?? []
  const newsItems   = newsD?.items       ?? []
  const states      = mapD?.states       ?? []
  const commodities = prices?.commodities ?? []
  const metrics     = fore?.metrics      ?? { accuracy: 0, mape: 0, models: 0 }

  const bullN = signals.filter(s => s.type === "BULLISH").length
  const bearN = signals.filter(s => s.type === "BEARISH").length
  const warnN = signals.filter(s => s.type === "WARNING").length

  const TABS: Tab[] = [
    { id: "signals",  icon: "", label: "Signals",  badge: signals.length },
    { id: "news",     icon: "", label: "News",     badge: newsItems.length },
    { id: "map",      icon: "", label: "States",   badge: states.length },
    { id: "prices",   icon: "", label: "Prices",   badge: commodities.length },
    { id: "scenario", icon: "", label: "Scenario", badge: null },
    { id: "model",    icon: "", label: "Model",    badge: null },
  ]

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS, paddingBottom: "env(safe-area-inset-bottom,20px)" }}>
      <style>{`input[type=range]{appearance:auto}`}</style>
      <ErrorBoundary>

      {/* HEADER */}
      <div style={{
        background: BG1, borderBottom: `1px solid ${BD1}`,
        padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56, position: "sticky", top: 0, zIndex: 100,
        paddingTop: "env(safe-area-inset-top,0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ"
                 style={{ height: 22, width: "auto" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {sigs && ([
            { label: `▲ ${bullN}`, col: GREEN, bg: GREEN_DIM },
            { label: `▼ ${bearN}`, col: RED,   bg: RED_DIM  },
            { label: `⚠ ${warnN}`, col: AMBER,  bg: AMBER_DIM },
          ] as const).map(p => (
            <div key={p.label} style={{ background: p.bg, borderRadius: 8, padding: "3px 8px" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: p.col }}>{p.label}</span>
            </div>
          ))}
          {sigs && <div style={{ width: 1, height: 16, background: BD1 }} />}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN,
                          boxShadow: `0 0 5px ${GREEN}`, animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: GREEN, letterSpacing: "0.06em" }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ display: "flex", gap: 10, padding: "12px 16px",
                    minHeight: "calc(100vh - 56px)" }}>

        {/* LEFT PANEL */}
        <LeftPanel
          spendVal={spendVal} spendMom={spendMom}
          empVal={empVal}     empMom={empMom}
          rate30={rate30}     rate10={rate10}
          spend={spend}       employ={employ}  rates={rates}
          commodities={commodities} fore={fore}
          signals={signals}   newsItems={newsItems} states={states}
        />

        {/* CENTER PANEL */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>

          {/* ── FORECAST HERO (always visible) ── */}
          <div style={{ background: BG1, borderRadius: 14, padding: 16, border: `1px solid ${BD1}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: T4,
                              letterSpacing: "0.1em", marginBottom: 6 }}>
                  TOTAL CONSTRUCTION SPEND · 12-MONTH FORECAST
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontFamily: MONO, fontSize: 26, color: AMBER, fontWeight: 700 }}>
                    {fmtB(spendVal)}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 13,
                                 color: spendMom >= 0 ? GREEN : RED }}>
                    {fmtPct(spendMom)} MoM
                  </span>
                </div>
              </div>
              {fore && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.06em" }}>
                    {fore.runAt?.slice(0, 10)}
                  </div>
                  {metrics.accuracy > 0 && (
                    <div style={{ fontFamily: MONO, fontSize: 12, color: GREEN, marginTop: 4 }}>
                      {metrics.accuracy}% accuracy
                    </div>
                  )}
                </div>
              )}
            </div>

            <div ref={chartRef} style={{ width: "100%" }}>
              <ForecastChart foreData={fore} width={Math.max(chartW, 400)} height={360} />
            </div>

          </div>

          {/* ── SUPPORTING TABS ── */}
          <TabBar tabs={TABS} active={tab} onChange={setTab} />

          <div style={{ flex: 1, overflowY: "auto", borderRadius: 14 }}>

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
                    <div style={{ fontFamily: SYS, fontSize: 16, color: T2, fontWeight: 600, marginBottom: 8 }}>Signals generating</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>Connecting to data feeds…</div>
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
                  <div style={{ fontFamily: SYS, fontSize: 13, color: T2, fontWeight: 700, letterSpacing: "-0.01em" }}>State Construction Activity</div>
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
                <div style={{ fontFamily: SYS, fontSize: 13, color: T2, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 12 }}>Commodity & Materials Watch</div>
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
                <div style={{ fontFamily: SYS, fontSize: 13, color: T2, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 16 }}>Scenario Builder</div>
                <ScenarioBuilder />
              </div>
            )}

            {/* MODEL */}
            {tab === "model" && (
              <div style={{ background: BG1, borderRadius: 14, padding: 14, border: `1px solid ${BD1}` }}>
                <div style={{ fontFamily: SYS, fontSize: 13, color: T2, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 16 }}>Forecast Model</div>
                {(fore?.models?.length ?? 0) > 0 ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {fore!.models.map((m, i) => {
                      const col = m.model === "holt-winters" ? GREEN : m.model === "xgboost" ? BLUE : AMBER
                      const pct = Math.round((m.weight ?? 0) * 100)
                      return (
                        <div key={i} style={{ flex: "1 1 180px", background: BG2, borderRadius: 10,
                                              padding: "10px 12px", border: `1px solid ${BD1}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between",
                                        alignItems: "center", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
                              <span style={{ fontFamily: SYS, fontSize: 12, color: T2,
                                             fontWeight: 600, textTransform: "capitalize" }}>{m.model}</span>
                            </div>
                            <span style={{ fontFamily: MONO, fontSize: 11, color: col }}>{pct}%</span>
                          </div>
                          <div style={{ background: BG3, borderRadius: 3, height: 4, overflow: "hidden" }}>
                            <div style={{ background: col, height: "100%", width: `${pct}%`,
                                          borderRadius: 3, transition: "width 0.5s ease" }} />
                          </div>
                          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, color: T4 }}>MAPE {m.mape}%</span>
                            <span style={{ fontFamily: MONO, fontSize: 10, color: GREEN }}>Acc {m.accuracy}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <div style={{ fontFamily: SYS, fontSize: 15, color: T4 }}>Model data unavailable</div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      </ErrorBoundary>
    </div>
  )
}
