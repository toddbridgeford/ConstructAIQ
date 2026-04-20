"use client"
import { font, color, sentColor, sentBg } from "@/lib/theme"
import type { Signal } from "../types"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3, BG4 = color.bg4
const BD1       = color.bd1,      BD2 = color.bd2, BD3 = color.bd3
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

export function SigCard({ sig, onTap, selected }: { sig: Signal; onTap: () => void; selected: boolean }) {
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
