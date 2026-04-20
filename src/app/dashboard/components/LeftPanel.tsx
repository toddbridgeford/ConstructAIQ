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
  const feeds = [
    { ok: !!spend }, { ok: !!employ }, { ok: !!rates }, { ok: commodities.length > 0 },
    { ok: !!fore }, { ok: signals.length > 0 }, { ok: newsItems.length > 0 }, { ok: states.length > 0 },
  ]
  const feedsOk = feeds.filter(f => f.ok).length

  return (
    <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>

      {/* Primary KPI */}
      <div style={{ background: BG1, borderRadius: 14, padding: "16px 14px", border: `1px solid ${BD1}` }}>
        <div style={{ fontFamily: SYS, fontSize: 10, color: T4, marginBottom: 8, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Total Spend</div>
        <div style={{ fontFamily: MONO, fontSize: 28, color: AMBER, fontWeight: 700, lineHeight: 1 }}>{fmtB(spendVal)}</div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: spendMom >= 0 ? GREEN : RED, marginTop: 6 }}>{fmtPct(spendMom)} MoM</div>
      </div>

      {/* Secondary KPIs */}
      <div style={{ background: BG1, borderRadius: 14, padding: "14px", border: `1px solid ${BD1}` }}>
        <div style={{ fontFamily: SYS, fontSize: 10, color: T4, marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Employment</div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: GREEN, fontWeight: 700, lineHeight: 1 }}>{fmtK(empVal)}K</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: empMom >= 0 ? GREEN : RED, marginTop: 4 }}>{fmtPct(empMom)} MoM</div>
      </div>

      <div style={{ background: BG1, borderRadius: 14, padding: "14px", border: `1px solid ${BD1}` }}>
        <div style={{ fontFamily: SYS, fontSize: 10, color: T4, marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>30yr Rate</div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: T2, fontWeight: 700, lineHeight: 1 }}>{fmtN(rate30)}%</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T4, marginTop: 4 }}>{fmtN(rate10)}% 10-yr</div>
      </div>

      {/* Feed status — minimal */}
      <div style={{ marginTop: "auto", padding: "10px 14px", background: BG1, borderRadius: 14,
                    border: `1px solid ${BD1}`, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {feeds.map((f, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%",
                                  background: f.ok ? GREEN : BD2,
                                  boxShadow: f.ok ? `0 0 4px ${GREEN}` : "none" }} />
          ))}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 10, color: T4 }}>
          {feedsOk}/8
        </span>
      </div>
    </div>
  )
}
