"use client"
import { font, color, fmtB, fmtN, fmtK, fmtPct } from "@/lib/theme"
import type { ForecastData, Signal, NewsItem, Commodity, StateData } from "../types"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3, BG4 = color.bg4
const BD1       = color.bd1,      BD2 = color.bd2, BD3 = color.bd3
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

interface LeftPanelProps {
  spendVal: number
  spendMom: number
  empVal: number
  empMom: number
  rate30: number
  rate10: number
  spend: unknown
  employ: unknown
  rates: unknown
  commodities: Commodity[]
  fore: ForecastData | null
  signals: Signal[]
  newsItems: NewsItem[]
  states: StateData[]
}

export function LeftPanel({
  spendVal, spendMom, empVal, empMom, rate30, rate10,
  spend, employ, rates, commodities, fore, signals, newsItems, states,
}: LeftPanelProps) {
  return (
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
  )
}
