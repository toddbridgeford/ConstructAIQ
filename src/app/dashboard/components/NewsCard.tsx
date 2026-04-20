"use client"
import { font, color, sentColor, sentBg } from "@/lib/theme"
import type { NewsItem } from "../types"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3, BG4 = color.bg4
const BD1       = color.bd1,      BD2 = color.bd2, BD3 = color.bd3
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

export function NewsCard({ item }: { item: NewsItem }) {
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
