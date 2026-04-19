"use client"
import { useState, useEffect, useRef } from "react"
import { font, color, TAP, sentColor, sentBg, fmtB, fmtN, fmtPct, fmtK } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3, BG4 = color.bg4
const BD1       = color.bd1,      BD2 = color.bd2, BD3 = color.bd3
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

// ── Domain types ─────────────────────────────────────────────────────────────
interface ForecastPoint { base: number; lo80: number; hi80: number; lo95: number; hi95: number }
interface ModelResult   { model: string; weight: number; mape: number; accuracy: number; forecast: ForecastPoint[] }
interface ForecastData  {
  ensemble:  ForecastPoint[]
  models:    ModelResult[]
  metrics:   { accuracy: number; mape: number; models: number }
  trainedOn: number
  runAt:     string
  history?:  number[]
}
interface Signal    { type: string; title: string; description?: string; confidence?: number }
interface NewsItem  { title: string; summary?: string; source: string; sentiment: string; tags?: string[] }
interface Commodity { name: string; value: number; mom: number; yoy: number; unit: string; signal: string; trend: string }
interface StateData { code: string; name: string; permits: number; yoyChange: number; signal?: string }
interface Tab       { id: string; icon: string; label: string; badge: number | null }

// ── FORECAST CHART ──────────────────────────────────────────────────────────
function ForecastChart({ foreData, width = 620, height = 220 }: {
  foreData: ForecastData | null; width?: number; height?: number
}) {
  if (!foreData) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: SYS, fontSize: 15, color: T4 }}>Loading forecast…</div>
    </div>
  )

  const PAD = { top: 16, right: 16, bottom: 40, left: 60 }
  const W = width - PAD.left - PAD.right
  const H = height - PAD.top - PAD.bottom

  // Use live history from API response; fall back to last forecast point repeated
  const hist = (foreData.history ?? []).slice(-12)
  const ensemble = foreData.ensemble ?? []
  const fcst = ensemble.slice(0, 12).map(p => ({ base: p.base, lo80: p.lo80, hi80: p.hi80, lo95: p.lo95, hi95: p.hi95 }))

  const allVals = [
    ...hist,
    ...fcst.map(p => p.hi95),
    ...fcst.map(p => p.lo95),
  ].filter(Number.isFinite)

  if (!allVals.length) return null

  const yMin   = Math.min(...allVals) * 0.995
  const yMax   = Math.max(...allVals) * 1.005
  const yRange = yMax - yMin

  const xPos = (i: number, total: number) => PAD.left + (i / (total - 1)) * W
  const yPos = (v: number)                => PAD.top + H - ((v - yMin) / yRange) * H

  const totalPoints = hist.length + fcst.length
  const histPts = hist.map((v, i) => ({ x: xPos(i, totalPoints), y: yPos(v) }))
  const fcstPts = fcst.map((p, i) => ({
    x:    xPos(hist.length + i, totalPoints),
    base: yPos(p.base),
    lo80: yPos(p.lo80),
    hi80: yPos(p.hi80),
    lo95: yPos(p.lo95),
    hi95: yPos(p.hi95),
  }))

  const bridge = { x: histPts[histPts.length - 1].x, y: histPts[histPts.length - 1].y }

  const histPath     = "M" + histPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")
  const allFcst      = [bridge, ...fcstPts]
  const fcstBasePath = "M" + allFcst.map(p => `${p.x.toFixed(1)},${ ('base' in p ? p.base : p.y).toFixed(1)}`).join("L")

  const band80Top  = allFcst.map(p => `${p.x.toFixed(1)},${ ('lo80' in p ? p.lo80 : p.y).toFixed(1)}`).join("L")
  const band80Bot  = [...allFcst].reverse().map(p => `${p.x.toFixed(1)},${ ('hi80' in p ? p.hi80 : p.y).toFixed(1)}`).join("L")
  const band80Path = `M${band80Top}L${band80Bot}Z`

  const band95Top  = allFcst.map(p => `${p.x.toFixed(1)},${ ('lo95' in p ? p.lo95 : p.y).toFixed(1)}`).join("L")
  const band95Bot  = [...allFcst].reverse().map(p => `${p.x.toFixed(1)},${ ('hi95' in p ? p.hi95 : p.y).toFixed(1)}`).join("L")
  const band95Path = `M${band95Top}L${band95Bot}Z`

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({ v: yMin + t * yRange, y: PAD.top + H - t * H }))

  const today   = new Date()
  const xLabels = Array.from({ length: totalPoints }, (_, i) => {
    if (i % 3 !== 0) return null
    const d = new Date(today.getFullYear(), today.getMonth() - hist.length + i + 1, 1)
    return { label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), x: xPos(i, totalPoints) }
  }).filter(Boolean) as { label: string; x: number }[]

  const lastHistX = histPts[histPts.length - 1].x
  const models    = foreData.models ?? []
  const hw        = models.find(m => m.model === "holt-winters")
  const sar       = models.find(m => m.model === "sarima")
  const xgb       = models.find(m => m.model === "xgboost")

  return (
    <div>
      <svg width="100%" viewBox={"0 0 " + width + " " + height} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={AMBER} stopOpacity="0.6" />
            <stop offset="100%" stopColor={AMBER} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map(function(t, i) {
          return <line key={i} x1={PAD.left} y1={t.y} x2={PAD.left + W} y2={t.y} stroke={BD1} strokeWidth={1} />
        })}

        {/* Forecast divider */}
        <line x1={lastHistX} y1={PAD.top} x2={lastHistX} y2={PAD.top + H}
          stroke={BD2} strokeWidth={1} strokeDasharray="4,3" />
        <text x={lastHistX + 4} y={PAD.top + 14} fill={T4} fontSize="11" fontFamily={MONO}>FORECAST</text>

        {/* 95% band */}
        <path d={band95Path} fill={AMBER} fillOpacity="0.06" />
        {/* 80% band */}
        <path d={band80Path} fill={AMBER} fillOpacity="0.12" />

        {/* Historical line */}
        <path d={histPath} fill="none" stroke="url(#histGrad)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Forecast base line */}
        <path d={fcstBasePath} fill="none" stroke={AMBER} strokeWidth={2} strokeDasharray="6,3" strokeLinejoin="round" />

        {/* Y-axis labels */}
        {yTicks.map(function(t, i) {
          return (
            <text key={i} x={PAD.left - 6} y={t.y + 4} fill={T4} fontSize="11" fontFamily={MONO} textAnchor="end">
              {(t.v / 1000).toFixed(1)}K
            </text>
          )
        })}

        {/* X-axis labels */}
        {xLabels.map(function(l, i) {
          return (
            <text key={i} x={l.x} y={height - 8} fill={T4} fontSize="11" fontFamily={MONO} textAnchor="middle">
              {l.label}
            </text>
          )
        })}

        {/* Last hist dot */}
        <circle cx={bridge.x} cy={bridge.y} r={4} fill={AMBER} />

        {/* Axis */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top+H} stroke={BD2} strokeWidth={1} />
        <line x1={PAD.left} y1={PAD.top+H} x2={PAD.left+W} y2={PAD.top+H} stroke={BD2} strokeWidth={1} />
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 2.5, background: AMBER, borderRadius: 2 }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>Historical</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 2, borderTop: "2px dashed " + AMBER }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>Ensemble Forecast</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 10, background: AMBER, opacity: 0.25, borderRadius: 2 }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>80% CI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 10, background: AMBER, opacity: 0.1, borderRadius: 2 }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>95% CI</span>
        </div>
      </div>

      {/* Model weights */}
      {(hw || sar || xgb) && (
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { label: "HW", model: hw, color: GREEN },
            { label: "XGB", model: xgb, color: BLUE },
            { label: "SARIMA", model: sar, color: AMBER },
          ].filter(function(m){ return m.model }).map(function(m, i) {
            return (
              <div key={i} style={{
                background: BG3, borderRadius: 8, padding: "6px 12px",
                border: "1px solid " + BD1, display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                <span style={{ fontFamily: MONO, fontSize: 12, color: T3 }}>
                  {m.label} {Math.round((m.model.weight || 0) * 100)}% · MAPE {m.model.mape}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── SMALLER COMPONENTS ───────────────────────────────────────────────────────
function SigCard({ sig, onTap, selected }: { sig: Signal; onTap: () => void; selected: boolean }) {
  const ICONS: Record<string, string> = { BULLISH: "▲", BEARISH: "▼", WARNING: "⚠", NEUTRAL: "◆" }
  const sc = sentColor(sig.type)
  const sb = sentBg(sig.type)
  return (
    <div onClick={onTap} style={{
      background: selected ? sb : BG2, border: `1px solid ${selected ? sc : sc + "55"}`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 10, cursor: "pointer",
      transition: "all 0.15s", WebkitTapHighlightColor: "transparent",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: sc, fontWeight: 700 }}>{ICONS[sig.type] ?? "◆"}</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: sc, letterSpacing: "0.08em", fontWeight: 700 }}>{sig.type}</span>
        </div>
        <div style={{ background: sc + "22", borderRadius: 20, padding: "3px 10px" }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: sc, fontWeight: 600 }}>{sig.confidence}%</span>
        </div>
      </div>
      <div style={{ fontFamily: SYS, fontSize: 15, color: T1, fontWeight: 600, lineHeight: 1.4, marginBottom: 5 }}>{sig.title}</div>
      <div style={{ fontFamily: SYS, fontSize: 14, color: T3, lineHeight: 1.5 }}>{sig.description}</div>
    </div>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  const dot = sentColor(item.sentiment)
  const bg  = sentBg(item.sentiment)
  const icon = item.sentiment === "BULLISH" ? "▲" : item.sentiment === "BEARISH" ? "▼" : item.sentiment === "WARNING" ? "⚠" : "◆"
  return (
    <div style={{ background: BG2, borderRadius: 12, padding: "14px 16px", marginBottom: 10, border: `1px solid ${BD1}` }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
          <span style={{ fontSize: 16, color: dot }}>{icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SYS, fontSize: 15, color: T1, fontWeight: 600, lineHeight: 1.4, marginBottom: 5 }}>{item.title}</div>
          <div style={{ fontFamily: SYS, fontSize: 14, color: T3, lineHeight: 1.5, marginBottom: 8 }}>
            {item.summary ? item.summary.slice(0, 180) + (item.summary.length > 180 ? "…" : "") : ""}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: SYS, fontSize: 13, color: T4, fontWeight: 500 }}>{item.source}</span>
            {(item.tags ?? []).map(t => <span key={t} style={{ fontFamily: MONO, fontSize: 11, color: BLUE, background: BLUE_DIM, padding: "2px 8px", borderRadius: 6 }}>{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function PriceCard({ item }: { item: Commodity }) {
  const sc    = sentColor(item.signal)
  const arrow = item.trend === "UP" ? "↑" : item.trend === "DOWN" ? "↓" : "→"
  return (
    <div style={{ background: BG2, borderRadius: 12, padding: "14px 16px", border: `1px solid ${BD1}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontFamily: SYS, fontSize: 14, color: T2, fontWeight: 500 }}>{item.name}</div>
        <div style={{ background: sentBg(item.signal), border: `1px solid ${sc}44`, borderRadius: 8, padding: "4px 10px" }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: sc, fontWeight: 700 }}>{item.signal}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 20, color: T1, fontWeight: 600 }}>{fmtN(item.value, 1)}</span>
        <span style={{ fontFamily: MONO, fontSize: 13, color: T4 }}>{item.unit}</span>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: item.mom >= 0 ? GREEN : RED, fontWeight: 500 }}>{arrow} {fmtPct(item.mom)} MoM</span>
        <span style={{ fontFamily: MONO, fontSize: 13, color: T4 }}>{fmtPct(item.yoy)} YoY</span>
      </div>
    </div>
  )
}

function StateRow({ s, selected, onTap }: { s: StateData; selected: boolean; onTap: () => void }) {
  const sig = s.signal ?? "STABLE"
  const sc  = sig === "HOT" ? GREEN : sig === "GROWING" ? BLUE : sig === "COOLING" ? RED : T4
  const bg  = sig === "HOT" ? GREEN_DIM : sig === "GROWING" ? BLUE_DIM : sig === "COOLING" ? RED_DIM : BG3
  return (
    <div onClick={onTap} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
      background: selected ? bg : BG2, borderRadius: 10, marginBottom: 6,
      border: `1px solid ${selected ? sc + "55" : BD1}`, cursor: "pointer", minHeight: TAP,
      transition: "background 0.15s", WebkitTapHighlightColor: "transparent",
    }}>
      <div style={{ width: 44, fontFamily: MONO, fontSize: 16, color: selected ? sc : T2, fontWeight: 700 }}>{s.code}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SYS, fontSize: 14, color: T2, fontWeight: 500, marginBottom: 2 }}>{s.name}</div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: T4 }}>{(s.permits / 1000).toFixed(1)}K permits</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: MONO, fontSize: 14, color: s.yoyChange > 0 ? GREEN : RED, fontWeight: 600 }}>{fmtPct(s.yoyChange)}</div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: sc, fontWeight: 500 }}>{sig}</div>
      </div>
      <div style={{ width: 28, textAlign: "center", color: sc, fontSize: 18 }}>›</div>
    </div>
  )
}

interface SliderRowProps {
  label: string; val: number; setter: (v: number) => void
  min: number; max: number; step: number; unit: string; positiveIsGood: boolean
}
function SliderRow({ label, val, setter, min, max, step, unit, positiveIsGood }: SliderRowProps) {
  const vc = positiveIsGood ? (val >= 0 ? GREEN : RED) : (val <= 0 ? GREEN : RED)
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: SYS, fontSize: 15, color: T2, fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 15, color: vc, fontWeight: 600 }}>{val > 0 ? "+" : ""}{val}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => setter(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: vc, cursor: "pointer", height: 4 }} />
    </div>
  )
}

function ScenarioBuilder() {
  const [rate,     setRate]     = useState(0)
  const [iija,     setIija]     = useState(100)
  const [labor,    setLabor]    = useState(0)
  const [material, setMaterial] = useState(0)
  const base  = 2190
  const delta = (-rate * 0.018) + ((iija - 100) * 0.003) + (labor * 0.008) + (-material * 0.012)
  const proj  = base * (1 + delta / 100)
  const diff  = proj - base
  const col   = proj >= base ? GREEN : RED
  return (
    <div>
      <SliderRow label="Rate Shock"           val={rate}     setter={setRate}     min={-200} max={200} step={25}  unit="bps" positiveIsGood={false} />
      <SliderRow label="IIJA Funding"         val={iija}     setter={setIija}     min={50}   max={150} step={5}   unit="%"   positiveIsGood={true}  />
      <SliderRow label="Labor Supply Change"  val={labor}    setter={setLabor}    min={-5}   max={5}   step={0.5} unit="%"   positiveIsGood={true}  />
      <SliderRow label="Material Cost Change" val={material} setter={setMaterial} min={-20}  max={20}  step={2}   unit="%"   positiveIsGood={false} />
      <div style={{ background: BG3, borderRadius: 16, padding: 20, border: `1px solid ${col}44`, marginTop: 8 }}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: T4, marginBottom: 8 }}>PROJECTED TOTAL CONSTRUCTION SPENDING</div>
        <div style={{ fontFamily: MONO, fontSize: 36, color: col, lineHeight: 1, fontWeight: 700, marginBottom: 6 }}>{fmtB(proj)}</div>
        <div style={{ fontFamily: MONO, fontSize: 15, color: col }}>{diff >= 0 ? "+" : ""}{fmtB(Math.abs(diff))} ({fmtPct((diff / base) * 100)}) vs baseline</div>
      </div>
    </div>
  )
}

function TabBar({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: "flex", background: BG2, borderRadius: 12, padding: 4, gap: 4, border: `1px solid ${BD1}` }}>
      {tabs.map(t => {
        const isActive = active === t.id
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, minHeight: TAP, padding: "0 8px",
            background: isActive ? BG4 : "transparent",
            border: `1px solid ${isActive ? BD3 : "transparent"}`,
            borderRadius: 10, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3, WebkitTapHighlightColor: "transparent", transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontFamily: SYS, fontSize: 12, color: isActive ? AMBER : T4, fontWeight: isActive ? 600 : 400 }}>{t.label}</span>
            {t.badge != null && t.badge > 0 && (
              <span style={{ fontFamily: MONO, fontSize: 10, color: isActive ? AMBER : T3, background: isActive ? AMBER_DIM : BG3, padding: "0 5px", borderRadius: 8 }}>{t.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

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
        <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          <div style={{ background: BG1, borderRadius: 14, padding: 14, border: `1px solid ${BD1}` }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T4, marginBottom: 8, letterSpacing: "0.08em" }}>TOTAL SPEND</div>
            <div style={{ fontFamily: MONO, fontSize: 26, color: AMBER, fontWeight: 700 }}>{fmtB(spendVal)}</div>
            <div style={{ fontFamily: MONO, fontSize: 13, color: spendMom >= 0 ? GREEN : RED, marginTop: 4 }}>{fmtPct(spendMom)} MoM</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: BG1, borderRadius: 14, padding: 14, border: `1px solid ${BD1}` }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T4, marginBottom: 6 }}>EMPLOY</div>
              <div style={{ fontFamily: MONO, fontSize: 18, color: GREEN, fontWeight: 700 }}>{fmtK(empVal)}K</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: empMom >= 0 ? GREEN : RED, marginTop: 3 }}>{fmtPct(empMom)}</div>
            </div>
            <div style={{ flex: 1, background: BG1, borderRadius: 14, padding: 14, border: `1px solid ${BD1}` }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T4, marginBottom: 6 }}>30YR MTG</div>
              <div style={{ fontFamily: MONO, fontSize: 16, color: AMBER, fontWeight: 700 }}>{fmtN(rate30)}%</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T3, marginTop: 3 }}>{fmtN(rate10)}% 10YR</div>
            </div>
          </div>
          {/* Data status */}
          <div style={{ background: BG1, borderRadius: 14, padding: 14, border: `1px solid ${BD1}` }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T4, marginBottom: 10, letterSpacing: "0.08em" }}>DATA FEEDS</div>
            {([
              { label: "Spending",   ok: !!spend },
              { label: "Employment", ok: !!employ },
              { label: "Rates",      ok: !!rates },
              { label: "PriceWatch", ok: commodities.length > 0 },
              { label: "Forecast",   ok: !!fore },
              { label: "Signals",    ok: signals.length > 0 },
              { label: "News",       ok: newsItems.length > 0 },
              { label: "State Map",  ok: states.length > 0 },
            ] as const).map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: SYS, fontSize: 13, color: row.ok ? T2 : T4 }}>{row.label}</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.ok ? GREEN : BD2, boxShadow: row.ok ? `0 0 6px ${GREEN}88` : "none" }} />
              </div>
            ))}
          </div>
        </div>

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
