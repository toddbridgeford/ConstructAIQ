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
