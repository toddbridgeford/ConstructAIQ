"use client"
import { font, color, TAP } from "@/lib/theme"
import type { Tab } from "../types"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3, BG4 = color.bg4
const BD1       = color.bd1,      BD2 = color.bd2, BD3 = color.bd3
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

export function TabBar({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${BD1}`, gap: 0, overflowX: "auto" }}>
      {tabs.map(t => {
        const on = active === t.id
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            style={{
              padding: "0 18px", minHeight: TAP, background: "transparent", border: "none",
              borderBottom: on ? `2px solid ${BLUE}` : "2px solid transparent",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "border-color 0.15s, color 0.15s", whiteSpace: "nowrap",
              WebkitTapHighlightColor: "transparent",
            }}>
            <span style={{ fontSize: 14, fontWeight: on ? 600 : 400,
                           color: on ? T1 : T4, letterSpacing: "-0.01em" }}>{t.label}</span>
            {t.badge != null && t.badge > 0 && (
              <span style={{ fontFamily: MONO, fontSize: 10, color: on ? BLUE : T4,
                             background: on ? BLUE_DIM : BG2, padding: "1px 6px", borderRadius: 8 }}>
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
