"use client"
import { color, font } from "@/lib/theme"

const MONO = font.mono

const CFG: Record<string, { fg: string; bg: string; label: string }> = {
  DEMAND_DRIVEN:      { fg: color.green,  bg: color.greenDim,  label: "DEMAND DRIVEN" },
  FEDERAL_INVESTMENT: { fg: color.blue,   bg: color.blueDim,   label: "FEDERAL INVESTMENT" },
  RECONSTRUCTION:     { fg: color.amber,  bg: color.amberDim,  label: "RECONSTRUCTION" },
  ORGANIC_GROWTH:     { fg: color.t2,     bg: color.bg3,       label: "ORGANIC GROWTH" },
  LOW_ACTIVITY:       { fg: color.t4,     bg: color.bg2,       label: "LOW ACTIVITY" },
  INSUFFICIENT_DATA:  { fg: color.t4,     bg: color.bg2,       label: "INSUFFICIENT DATA" },
}

interface Props {
  classification: string
  large?: boolean
}

export function SatelliteBadge({ classification, large = false }: Props) {
  const cfg = CFG[classification] ?? CFG.INSUFFICIENT_DATA
  return (
    <span style={{
      fontFamily: MONO,
      fontSize: large ? 11 : 9,
      fontWeight: 600,
      letterSpacing: "0.1em",
      color: cfg.fg,
      background: cfg.bg,
      border: `1px solid ${cfg.fg}33`,
      borderRadius: 6,
      padding: large ? "4px 10px" : "2px 6px",
      whiteSpace: "nowrap",
      display: "inline-block",
    }}>
      {cfg.label}
    </span>
  )
}
