"use client"
import { font, color, sentColor, sentBg, fmtN, fmtPct } from "@/lib/theme"
import type { Commodity } from "../types"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3, BG4 = color.bg4
const BD1       = color.bd1,      BD2 = color.bd2, BD3 = color.bd3
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

export function PriceCard({ item }: { item: Commodity }) {
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
