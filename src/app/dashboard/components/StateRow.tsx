"use client"
import { font, color, TAP, fmtPct } from "@/lib/theme"
import type { StateData } from "../types"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3, BG4 = color.bg4
const BD1       = color.bd1,      BD2 = color.bd2, BD3 = color.bd3
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

export function StateRow({ s, selected, onTap }: { s: StateData; selected: boolean; onTap: () => void }) {
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
