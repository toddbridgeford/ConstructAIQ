"use client"
import { useMemo } from "react"
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts"
import { font, color } from "@/lib/theme"
import { seeded } from "@/lib/seeded"
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

const TOP_MSAS: Record<string, string[]> = {
  TX: ["Dallas–Fort Worth", "Houston Metro", "Austin–Round Rock", "San Antonio", "El Paso"],
  CA: ["Los Angeles", "San Francisco Bay Area", "San Diego", "Sacramento", "Riverside–San Bernardino"],
  FL: ["Miami–Fort Lauderdale", "Tampa Bay", "Orlando", "Jacksonville", "Naples–Fort Myers"],
  NY: ["New York City", "Buffalo", "Albany", "Rochester", "Syracuse"],
  GA: ["Atlanta Metro", "Savannah", "Augusta", "Columbus", "Macon"],
  AZ: ["Phoenix–Mesa", "Tucson", "Scottsdale", "Chandler", "Tempe"],
  NC: ["Charlotte Metro", "Raleigh–Durham", "Greensboro", "Winston-Salem", "Asheville"],
  TN: ["Nashville–Davidson", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Dayton", "Akron"],
  WA: ["Seattle–Tacoma", "Spokane", "Bellevue", "Tacoma", "Vancouver"],
}

function syntheticHistory(basePermits: number) {
  const months = []
  let val = basePermits
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    val = val * (1 + (seeded(23 - i) * 0.10 - 0.05))
    months.push({
      month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      value: Math.round(val),
    })
  }
  return months
}

function syntheticAwards(stateName: string) {
  return [
    { label: `${stateName} Highway Expansion`, value: "$2.4B" },
    { label: `${stateName} Transit Corridor`, value: "$890M" },
    { label: `${stateName} Bridge Rehabilitation`, value: "$340M" },
  ]
}

export function StateDrillDown({ stateCode, states, onClose }: StateDrillDownProps) {
  const stateData = states.find(s => s.code === stateCode)

  const historyData = useMemo(() => {
    if (!stateData) return []
    return syntheticHistory(stateData.permits)
  }, [stateData])

  if (!stateData) return null

  const sigFg = signalColorFg(stateData.signal)
  const msas = TOP_MSAS[stateCode] ?? [
    `${stateData.name} Metro North`, `${stateData.name} Metro South`,
    `${stateData.name} Central`, `${stateData.name} East`, `${stateData.name} West`,
  ]
  const awards = syntheticAwards(stateData.name)
  const permitValueEst = `$${(stateData.permits * 0.35).toFixed(1)}B`

  const kpis = [
    { label: "PERMIT UNITS", value: stateData.permits.toLocaleString() },
    { label: "PERMIT VALUE EST", value: permitValueEst },
    { label: "EMPLOYMENT", value: stateData.employment.toLocaleString() },
    { label: "SIGNAL", value: stateData.signal, color: sigFg },
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
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={historyData}>
              <XAxis dataKey="month" hide />
              <Tooltip
                contentStyle={{ background: color.bg3, border: `1px solid ${color.bd2}`, borderRadius: 8, fontFamily: MONO, fontSize: 11 }}
                labelStyle={{ color: color.t3 }}
                itemStyle={{ color: color.amber }}
              />
              <Line type="monotone" dataKey="value" stroke={color.amber} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 MSAs */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.06em", marginBottom: 8 }}>TOP 5 MSAS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {msas.slice(0, 5).map((msa, i) => (
            <div key={msa} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: color.bg2,
              borderRadius: 8,
              padding: "8px 12px",
            }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4, minWidth: 16 }}>#{i + 1}</span>
              <span style={{ fontFamily: SYS, fontSize: 12, color: color.t2 }}>{msa}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 3 federal awards */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.06em", marginBottom: 8 }}>TOP FEDERAL AWARDS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {awards.map(a => (
            <div key={a.label} style={{
              background: color.bg2,
              border: `1px solid ${color.bd1}`,
              borderRadius: 8,
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontFamily: SYS, fontSize: 11, color: color.t2, flex: 1, marginRight: 8 }}>{a.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: color.amber, whiteSpace: "nowrap" }}>{a.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
