"use client"
import { Suspense, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Image from "next/image"
import { font, color } from "@/lib/theme"
import { ForecastChart } from "@/app/dashboard/components/ForecastChart"
import { FederalPrograms } from "@/app/dashboard/components/FederalPrograms"
import type { ForecastData } from "@/app/dashboard/types"

const MONO = font.mono
const SYS  = font.sys

// ── Types ─────────────────────────────────────────────────────────────────────

type ChartType = "forecast" | "federal-pipeline" | "signals" | "materials"

interface Commodity {
  id: string; name: string; value: number; mom: number
  unit: string; signal: "BUY" | "SELL" | "HOLD"; source: string
}

interface Signal {
  type: string; title: string; description: string
  confidence: number; is_active: boolean
}

interface Program {
  name: string; authorized: number; obligated: number
  spent: number; executionPct: number; agency: string; color: string
}

// ── Theme helpers ─────────────────────────────────────────────────────────────

function bg(dark: boolean)   { return dark ? color.bg0 : "#fff" }
function fg(dark: boolean)   { return dark ? color.t1  : "#111" }
function sub(dark: boolean)  { return dark ? color.t3  : "#555" }
function bd(dark: boolean)   { return dark ? color.bd1 : color.lightBd }

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ height, dark }: { height: number; dark: boolean }) {
  return (
    <div style={{
      width: "100%", height,
      background: dark ? color.bg2 : color.lightBgSkel,
      borderRadius: 8,
      animation: "pulse 1.4s ease-in-out infinite",
    }} />
  )
}

// ── Error state ───────────────────────────────────────────────────────────────

function EmbedError({ msg, dark }: { msg: string; dark: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", padding: 32,
      fontFamily: MONO, fontSize: 13,
      color: dark ? color.t4 : "#888",
      textAlign: "center",
    }}>
      {msg}
    </div>
  )
}

// ── Forecast embed ─────────────────────────────────────────────────────────────

function ForecastEmbed({ dark }: { dark: boolean }) {
  const [data, setData] = useState<ForecastData | null>(null)
  const [err, setErr]   = useState(false)

  useEffect(() => {
    fetch("/api/forecast?seriesId=TTLCONS&periods=12")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setData(d))
      .catch(() => setErr(true))
  }, [])

  if (err) return <EmbedError msg="Forecast data unavailable" dark={dark} />

  return (
    <div style={{ padding: "16px 20px 8px" }}>
      <div style={{
        fontFamily: MONO, fontSize: 10, color: color.amber,
        letterSpacing: "0.1em", marginBottom: 4,
      }}>
        TOTAL CONSTRUCTION SPENDING · 12-MONTH ENSEMBLE FORECAST
      </div>
      {data
        ? <ForecastChart foreData={data} />
        : <Skeleton height={340} dark={dark} />
      }
    </div>
  )
}

// ── Federal pipeline embed ─────────────────────────────────────────────────────

function FederalEmbed({ dark }: { dark: boolean }) {
  const [programs, setPrograms] = useState<Program[] | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    fetch("/api/federal")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setPrograms(d.programs ?? []))
      .catch(() => setErr(true))
  }, [])

  if (err) return <EmbedError msg="Federal data unavailable" dark={dark} />

  return (
    <div style={{ padding: "16px 20px 8px" }}>
      <div style={{
        fontFamily: MONO, fontSize: 10, color: color.amber,
        letterSpacing: "0.1em", marginBottom: 12,
      }}>
        IIJA · IRA PROGRAM EXECUTION
      </div>
      {programs
        ? <FederalPrograms programs={programs} />
        : <Skeleton height={300} dark={dark} />
      }
    </div>
  )
}

// ── Signals embed ──────────────────────────────────────────────────────────────

function SignalsEmbed({ dark }: { dark: boolean }) {
  const [signals, setSignals] = useState<Signal[] | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    fetch("/api/signals")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setSignals(d.signals ?? []))
      .catch(() => setErr(true))
  }, [])

  if (err) return <EmbedError msg="Signal data unavailable" dark={dark} />
  if (!signals) return <Skeleton height={220} dark={dark} />

  const active = signals.filter(s => s.is_active).slice(0, 5)

  return (
    <div style={{ padding: "16px 20px 8px" }}>
      <div style={{
        fontFamily: MONO, fontSize: 10, color: color.amber,
        letterSpacing: "0.1em", marginBottom: 12,
      }}>
        ACTIVE MARKET SIGNALS · AI DETECTION
      </div>
      {active.length === 0 ? (
        <div style={{
          fontFamily: SYS, fontSize: 13, color: sub(dark),
          padding: "24px 0", textAlign: "center",
        }}>
          No active signals detected
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {active.map((s, i) => {
            const isAnomaly  = s.type === "anomaly"
            const isReversal = s.type?.includes("reversal")
            const c = isAnomaly ? color.red : isReversal ? color.amber : color.blue
            const bgC = isAnomaly ? color.redDim : isReversal ? color.amberDim : color.blueDim
            return (
              <div key={i} style={{
                background: dark ? color.bg2 : color.lightBg,
                border: `1px solid ${dark ? color.bd1 : color.lightBd}`,
                borderRadius: 10, padding: "12px 16px",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <span style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 700,
                  color: c, background: bgC,
                  borderRadius: 4, padding: "2px 8px",
                  whiteSpace: "nowrap", flexShrink: 0, alignSelf: "center",
                }}>
                  {s.type?.toUpperCase() ?? "SIGNAL"}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: SYS, fontSize: 13, fontWeight: 600,
                    color: fg(dark), marginBottom: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {s.title}
                  </div>
                  <div style={{ fontFamily: SYS, fontSize: 12, color: sub(dark), lineHeight: 1.4 }}>
                    {(s.description ?? "").slice(0, 100)}{(s.description?.length ?? 0) > 100 ? "…" : ""}
                  </div>
                </div>
                {s.confidence != null && (
                  <span style={{
                    fontFamily: MONO, fontSize: 11, fontWeight: 700,
                    color: color.green, flexShrink: 0, alignSelf: "center", marginLeft: "auto",
                  }}>
                    {(s.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Materials embed ────────────────────────────────────────────────────────────

function MaterialsEmbed({ dark }: { dark: boolean }) {
  const [commodities, setCommodities] = useState<Commodity[] | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    fetch("/api/pricewatch")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setCommodities(d.commodities ?? []))
      .catch(() => setErr(true))
  }, [])

  if (err) return <EmbedError msg="Materials data unavailable" dark={dark} />
  if (!commodities) return <Skeleton height={280} dark={dark} />

  function sigColor(s: string) {
    if (s === "BUY")  return color.green
    if (s === "SELL") return color.red
    return color.amber
  }
  function sigBg(s: string) {
    if (s === "BUY")  return color.greenDim
    if (s === "SELL") return color.redDim
    return color.amberDim
  }
  function fmtMom(v: number) {
    return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
  }

  return (
    <div style={{ padding: "16px 20px 8px" }}>
      <div style={{
        fontFamily: MONO, fontSize: 10, color: color.amber,
        letterSpacing: "0.1em", marginBottom: 12,
      }}>
        CONSTRUCTION MATERIALS PRICES · BUY/SELL/HOLD
      </div>
      <div style={{
        border: `1px solid ${bd(dark)}`,
        borderRadius: 10, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: dark ? color.bg3 : color.lightBgSub }}>
              {["Material", "MoM", "Signal"].map(h => (
                <th key={h} style={{
                  fontFamily: MONO, fontSize: 10, color: dark ? color.t4 : "#888",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "8px 12px", textAlign: "left", fontWeight: 600,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commodities.slice(0, 7).map((c, i) => (
              <tr key={c.id} style={{
                background: i % 2 === 0
                  ? (dark ? color.bg2 : "#fff")
                  : (dark ? color.bg1 : color.lightBgAlt),
                borderTop: `1px solid ${bd(dark)}`,
              }}>
                <td style={{
                  padding: "9px 12px", fontFamily: SYS, fontSize: 13,
                  fontWeight: 500, color: fg(dark),
                }}>
                  {c.name}
                </td>
                <td style={{
                  padding: "9px 12px", fontFamily: MONO, fontSize: 12,
                  color: c.mom >= 0 ? color.red : color.green,
                }}>
                  {fmtMom(c.mom)}
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 10, fontWeight: 700,
                    color: sigColor(c.signal), background: sigBg(c.signal),
                    borderRadius: 4, padding: "2px 8px",
                  }}>
                    {c.signal}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Watermark ─────────────────────────────────────────────────────────────────

function Watermark() {
  return (
    <a
      href="https://constructaiq.trade"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "absolute", bottom: 10, right: 12,
        display: "flex", alignItems: "center", gap: 5,
        opacity: 0.5, textDecoration: "none",
      }}
    >
      <Image
        src="/ConstructAIQWhiteLogo.svg"
        alt="ConstructAIQ"
        width={80}
        height={16}
        style={{ height: 14, width: "auto" }}
      />
    </a>
  )
}

// ── Chart router ──────────────────────────────────────────────────────────────

function ChartSwitch({ chart, dark }: { chart: string; dark: boolean }) {
  switch (chart as ChartType) {
    case "forecast":          return <ForecastEmbed dark={dark} />
    case "federal-pipeline":  return <FederalEmbed dark={dark} />
    case "signals":           return <SignalsEmbed dark={dark} />
    case "materials":         return <MaterialsEmbed dark={dark} />
    default:
      return (
        <EmbedError
          msg={`Unknown chart type: "${chart}". Use forecast | federal-pipeline | signals | materials`}
          dark={dark}
        />
      )
  }
}

// ── Inner content (needs Suspense for useSearchParams) ────────────────────────

function EmbedInner() {
  const params       = useParams()
  const searchParams = useSearchParams()

  const chart = (params.chart as string) ?? "forecast"
  const theme = searchParams.get("theme") ?? "dark"
  const isDark = theme !== "light"

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      background: bg(isDark),
      overflow: "hidden",
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>
      <ChartSwitch chart={chart} dark={isDark} />
      <Watermark />
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function EmbedChartPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", background: color.bg0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: color.t4 }}>
          LOADING…
        </span>
      </div>
    }>
      <EmbedInner />
    </Suspense>
  )
}
