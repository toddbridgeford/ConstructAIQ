"use client"
import { font, color } from "@/lib/theme"
import type { StateData } from "./StateMap"

const MONO = font.mono
const SYS = font.sys

interface StateDrillDownProps {
  stateCode: string
  states: StateData[]
  onClose: () => void
}

function signalColorFg(signal: string): string {
  if (signal === "HOT") return color.greenMuted
  if (signal === "GROWING") return color.green
  if (signal === "NEUTRAL") return color.amber
  if (signal === "COOLING") return color.orange
  if (signal === "DECLINING") return color.red
  return color.t4
}

export function StateDrillDown({ stateCode, states, onClose }: StateDrillDownProps) {
  const stateData = states.find(s => s.code === stateCode)

  const history: never[] = []

  if (!stateData) return null

  const sigFg = signalColorFg(stateData.signal)
  const permitValueEst = `$${(stateData.permits * 0.35).toFixed(1)}B`

  const kpis = [
    { label: "PERMIT UNITS",    value: stateData.permits.toLocaleString() },
    { label: "PERMIT VALUE EST", value: permitValueEst },
    { label: "EMPLOYMENT",      value: stateData.employment.toLocaleString() },
    { label: "SIGNAL",          value: stateData.signal, color: sigFg },
  ]

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: 360,
      height: "100vh",
      background: color.bg1,
      borderLeft: `1px solid ${color.bd1}`,
      padding: 24,
      overflowY: "auto",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: SYS, fontSize: 18, fontWeight: 700, color: color.t1 }}>{stateData.name}</div>
          <div style={{
            display: "inline-block",
            marginTop: 6,
            background: sigFg + "22",
            border: `1px solid ${sigFg}`,
            borderRadius: 6,
            padding: "2px 10px",
            fontFamily: MONO,
            fontSize: 11,
            color: sigFg,
          }}>{stateData.signal}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: color.bg3,
            border: `1px solid ${color.bd2}`,
            borderRadius: 8,
            color: color.t3,
            cursor: "pointer",
            fontFamily: MONO,
            fontSize: 14,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >✕</button>
      </div>

      {/* KPI mini-cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: color.bg2,
            border: `1px solid ${color.bd1}`,
            borderRadius: 10,
            padding: "10px 12px",
          }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.08em", marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: k.color ?? color.t1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* 24-month permit history */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.06em", marginBottom: 8 }}>24-MONTH PERMIT HISTORY</div>
        {history.length === 0 ? (
          <div style={{ fontFamily: font.sys, fontSize: 13, color: color.t4, padding: '12px 0' }}>
            View permit history at{' '}
            <a href={`/permits/${stateCode.toLowerCase()}`} style={{ color: color.amber }}>
              /permits/{stateCode.toLowerCase()}
            </a>
          </div>
        ) : null}
      </div>

      {/* Top 5 MSAs */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.06em", marginBottom: 8 }}>TOP 5 MSAS</div>
        <a href="/ground-signal" style={{ fontFamily: font.sys, fontSize: 13, color: color.amber }}>
          View satellite MSAs →
        </a>
      </div>

      {/* Top federal awards */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.06em", marginBottom: 8 }}>TOP FEDERAL AWARDS</div>
        <div style={{ fontFamily: font.sys, fontSize: 13, color: color.t4, padding: '12px 0' }}>
          Live federal award data at{' '}
          <a href="/federal" style={{ color: color.amber }}>
            Federal Pipeline →
          </a>
        </div>
      </div>
    </div>
  )
}
