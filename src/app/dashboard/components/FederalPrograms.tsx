"use client"
import { useState } from "react"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

interface FederalProgram {
  name: string
  authorized: number
  obligated: number
  spent: number
  executionPct: number
  agency: string
  color: string
}

interface FederalProgramsProps {
  programs: FederalProgram[]
}

function execColor(pct: number): string {
  if (pct > 70) return color.green
  if (pct >= 40) return color.amber
  return color.red
}

function execBg(pct: number): string {
  if (pct > 70) return color.greenDim
  if (pct >= 40) return color.amberDim
  return color.redDim
}

function fmtM(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`
}

interface BarRowProps {
  program: FederalProgram
}

function BarRow({ program }: BarRowProps) {
  const [hovered, setHovered] = useState(false)
  const { name, authorized, obligated, spent, executionPct } = program

  const spentWidth = authorized > 0 ? (spent / authorized) * 100 : 0
  const obligatedWidth = authorized > 0 ? (obligated / authorized) * 100 : 0
  const unobligatedWidth = Math.max(0, 100 - spentWidth - obligatedWidth)
  const ec = execColor(executionPct)
  const eb = execBg(executionPct)

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <div
        style={{
          width: 180,
          fontFamily: SYS,
          fontSize: 12,
          color: color.t2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flexShrink: 0,
        }}
        title={name}
      >
        {name}
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <div
          style={{
            display: "flex",
            height: 28,
            borderRadius: 4,
            overflow: "hidden",
            cursor: "default",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            style={{
              width: `${spentWidth}%`,
              background: program.color,
              opacity: 1,
            }}
            title={`Spent: ${fmtM(spent)}`}
          />
          <div
            style={{
              width: `${obligatedWidth}%`,
              background: program.color,
              opacity: 0.5,
            }}
            title={`Obligated: ${fmtM(obligated)}`}
          />
          <div
            style={{
              width: `${unobligatedWidth}%`,
              background: program.color,
              opacity: 0.15,
            }}
            title={`Unobligated: ${fmtM(authorized - spent - obligated)}`}
          />
        </div>

        {hovered && (
          <div
            style={{
              position: "absolute",
              top: -48,
              left: "50%",
              transform: "translateX(-50%)",
              background: color.bg4,
              border: `1px solid ${color.bd2}`,
              borderRadius: 8,
              padding: "6px 10px",
              fontFamily: MONO,
              fontSize: 11,
              color: color.t1,
              whiteSpace: "nowrap",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <div>Authorized: {fmtM(authorized)}</div>
            <div>Obligated: {fmtM(obligated)}</div>
            <div>Spent: {fmtM(spent)}</div>
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 700,
          color: ec,
          background: eb,
          borderRadius: 6,
          padding: "2px 8px",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {executionPct.toFixed(0)}% Executed
      </div>
    </div>
  )
}

export function FederalPrograms({ programs }: FederalProgramsProps) {
  if (!programs || programs.length === 0) {
    return (
      <div style={{ padding: 24, color: color.t4, fontFamily: SYS, fontSize: 14, textAlign: "center" }}>
        No program data available.
      </div>
    )
  }

  return (
    <div
      style={{
        background: color.bg2,
        border: `1px solid ${color.bd1}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
          IIJA / IRA Program Tracker
        </div>
        <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1 }}>
          Federal Infrastructure Program Execution
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 14, paddingLeft: 192 }}>
        {[
          { label: "Spent", opacity: 1 },
          { label: "Obligated", opacity: 0.5 },
          { label: "Unobligated", opacity: 0.15 },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: color.amber, opacity: item.opacity }} />
            <span style={{ fontFamily: SYS, fontSize: 11, color: color.t4 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {programs.map((p) => (
        <BarRow key={p.name} program={p} />
      ))}
    </div>
  )
}
