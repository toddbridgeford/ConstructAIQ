"use client"
import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { font, color } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono
const REFRESH_MS = 4 * 60 * 60 * 1000

// ── Theme helpers ─────────────────────────────────────────────────────────────

function bg(dark: boolean, transparent: boolean) {
  if (transparent) return "transparent"
  return dark ? color.bg1 : "#fff"
}
function fg(dark: boolean)  { return dark ? color.t1  : "#111" }
function sub(dark: boolean) { return dark ? color.t3  : "#555" }
function bdr(dark: boolean) { return dark ? color.bd1 : color.lightBd }
function rowBg(dark: boolean, i: number) {
  return i % 2 === 0
    ? (dark ? color.bg2 : color.lightBg)
    : (dark ? color.bg1 : "#fff")
}

function classColor(cls: string) {
  if (cls?.includes("BUY") || cls === "STRONG_OPPORTUNITY" || cls === "HIGH") return color.green
  if (cls?.includes("SELL") || cls === "LOW")  return color.red
  return color.amber
}

// ── Watermark ─────────────────────────────────────────────────────────────────

function Watermark({ dark }: { dark: boolean }) {
  return (
    <a
      href="https://constructaiq.trade"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
    >
      <span style={{
        fontFamily: MONO, fontSize: 9, color: dark ? color.t4 : "#aaa",
        letterSpacing: "0.06em",
      }}>
        POWERED BY CONSTRUCTAIQ →
      </span>
    </a>
  )
}

// ── Data types ────────────────────────────────────────────────────────────────

interface MetroRow {
  metro_code:     string
  metro_name:     string | null
  state_code:     string | null
  opportunity_score: number
  classification: string
}

// ── Leaderboard card ───────────────────────────────────────────────────────────

function Leaderboard({ dark, transparent }: { dark: boolean; transparent: boolean }) {
  const [metros, setMetros] = useState<MetroRow[] | null>(null)
  const [err, setErr]       = useState(false)

  const load = useCallback(() => {
    fetch("/api/opportunity-index")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const rows: MetroRow[] = (d.metros ?? [])
          .sort((a: MetroRow, b: MetroRow) => b.opportunity_score - a.opportunity_score)
          .slice(0, 5)
        setMetros(rows)
        setErr(false)
      })
      .catch(() => setErr(true))
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    const origin = (() => {
      if (!document.referrer) return "direct"
      try { return new URL(document.referrer).hostname } catch { return "direct" }
    })()
    fetch("/api/embed/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widget_type: "leaderboard", origin_domain: origin }),
    }).catch(() => {})
  }, [])

  const placeholder = Array(5).fill(null)
  const rows = metros ?? placeholder

  return (
    <div style={{
      width: 320, height: 280,
      background: bg(dark, transparent),
      border: transparent ? "none" : `1px solid ${bdr(dark)}`,
      borderRadius: 12,
      padding: "14px 0 12px",
      boxSizing: "border-box", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header */}
      <div style={{ padding: "0 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.amber, letterSpacing: "0.1em" }}>
          TOP 5 OPPORTUNITY METROS
        </span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {rows.map((m, i) => {
          if (!m) {
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 16px",
                background: rowBg(dark, i),
                borderTop: i > 0 ? `1px solid ${bdr(dark)}` : "none",
              }}>
                <div style={{ width: 16, height: 12, background: dark ? color.bg3 : color.lightBgSkel, borderRadius: 3, animation: "pulse 1.4s ease-in-out infinite" }} />
                <div style={{ flex: 1, height: 12, background: dark ? color.bg3 : color.lightBgSkel, borderRadius: 3, animation: "pulse 1.4s ease-in-out infinite" }} />
                <div style={{ width: 28, height: 12, background: dark ? color.bg3 : color.lightBgSkel, borderRadius: 3, animation: "pulse 1.4s ease-in-out infinite" }} />
              </div>
            )
          }
          const clr = classColor(m.classification)
          const name = m.metro_name ?? m.metro_code
          const displayName = name.length > 18 ? name.slice(0, 17) + "…" : name
          return (
            <div key={m.metro_code} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 16px",
              background: rowBg(dark, i),
              borderTop: i > 0 ? `1px solid ${bdr(dark)}` : "none",
            }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: sub(dark), width: 14, textAlign: "right", flexShrink: 0 }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SYS, fontSize: 12, fontWeight: 600, color: fg(dark), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </div>
                {m.state_code && (
                  <div style={{ fontFamily: MONO, fontSize: 9, color: sub(dark) }}>{m.state_code}</div>
                )}
              </div>
              <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: clr, flexShrink: 0 }}>
                {Math.round(m.opportunity_score)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {err && (
        <div style={{ fontFamily: MONO, fontSize: 9, color: color.red, padding: "4px 16px" }}>
          Data unavailable
        </div>
      )}
      <div style={{ padding: "8px 16px 0", borderTop: `1px solid ${bdr(dark)}`, marginTop: "auto" }}>
        <Watermark dark={dark} />
      </div>
    </div>
  )
}

// ── Inner ─────────────────────────────────────────────────────────────────────

function Inner() {
  const sp = useSearchParams()
  const dark        = sp.get("theme") !== "light"
  const transparent = sp.get("bg") === "transparent"

  return (
    <div style={{
      minHeight: "100vh", minWidth: "100vw",
      background: transparent ? "transparent" : bg(dark, false),
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Leaderboard dark={dark} transparent={transparent} />
    </div>
  )
}

export default function LeaderboardEmbed() {
  return (
    <Suspense fallback={
      <div style={{ width: 320, height: 280, background: color.bg1, borderRadius: 12 }} />
    }>
      <Inner />
    </Suspense>
  )
}
