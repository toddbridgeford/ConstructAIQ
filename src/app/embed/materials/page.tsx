"use client"
import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { font, color, sentColor } from "@/lib/theme"

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

// ── Watermark ─────────────────────────────────────────────────────────────────

function Watermark({ dark }: { dark: boolean }) {
  return (
    <a
      href="https://constructaiq.trade"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none" }}
    >
      <span style={{
        fontFamily: MONO, fontSize: 9, color: dark ? color.t4 : "#aaa",
        letterSpacing: "0.06em", whiteSpace: "nowrap",
      }}>
        CONSTRUCTAIQ →
      </span>
    </a>
  )
}

// ── Data types ────────────────────────────────────────────────────────────────

interface Commodity {
  id:     string
  name:   string
  mom:    number
  signal: "BUY" | "SELL" | "HOLD"
}

// ── Ticker content ─────────────────────────────────────────────────────────────

function MaterialsTicker({ dark, transparent }: { dark: boolean; transparent: boolean }) {
  const [items, setItems] = useState<Commodity[] | null>(null)
  const [err, setErr]     = useState(false)

  const load = useCallback(() => {
    fetch("/api/pricewatch")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setItems((d.commodities ?? []).slice(0, 4)); setErr(false) })
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
      body: JSON.stringify({ widget_type: "materials", origin_domain: origin }),
    }).catch(() => {})
  }, [])

  const showItems = items ?? Array(4).fill(null)

  return (
    <div style={{
      width: 480, height: 120,
      background: bg(dark, transparent),
      border: transparent ? "none" : `1px solid ${bdr(dark)}`,
      borderRadius: 10,
      padding: "10px 16px",
      boxSizing: "border-box", overflow: "hidden",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.amber, letterSpacing: "0.1em" }}>
          MATERIAL COST SIGNALS · MoM
        </span>
        <Watermark dark={dark} />
      </div>

      {/* Commodity grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 6,
        flex: 1,
        alignItems: "center",
      }}>
        {showItems.map((c, i) => {
          if (!c) {
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ height: 10, background: dark ? color.bg3 : color.lightBgSkel, borderRadius: 3, animation: "pulse 1.4s ease-in-out infinite" }} />
                <div style={{ height: 14, width: "70%", background: dark ? color.bg3 : color.lightBgSkel, borderRadius: 3, animation: "pulse 1.4s ease-in-out infinite" }} />
                <div style={{ height: 10, width: "50%", background: dark ? color.bg3 : color.lightBgSkel, borderRadius: 3, animation: "pulse 1.4s ease-in-out infinite" }} />
              </div>
            )
          }
          const sigClr = sentColor(c.signal)
          const momClr = c.mom < 0 ? color.green : color.red  // price down = good for buyers
          return (
            <div key={c.id} style={{
              display: "flex", flexDirection: "column", gap: 2,
              padding: "4px 0",
            }}>
              <span style={{ fontFamily: SYS, fontSize: 10, color: sub(dark), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.name.replace(/ & Products| Fuel/, "")}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: momClr }}>
                {c.mom >= 0 ? "+" : ""}{c.mom.toFixed(1)}%
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 9, fontWeight: 700, color: sigClr,
                letterSpacing: "0.06em",
              }}>
                {c.signal}
              </span>
            </div>
          )
        })}
      </div>

      {err && (
        <div style={{ fontFamily: MONO, fontSize: 9, color: color.red }}>
          Data unavailable
        </div>
      )}
    </div>
  )
}

// ── Inner (needs Suspense) ────────────────────────────────────────────────────

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
      <MaterialsTicker dark={dark} transparent={transparent} />
    </div>
  )
}

export default function MaterialsEmbed() {
  return (
    <Suspense fallback={
      <div style={{ width: 480, height: 120, background: color.bg1, borderRadius: 10 }} />
    }>
      <Inner />
    </Suspense>
  )
}
