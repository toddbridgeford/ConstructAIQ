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

function verdictColor(v: string) {
  if (v === "EXPAND")   return color.green
  if (v === "CONTRACT") return color.red
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
        letterSpacing: "0.08em", whiteSpace: "nowrap",
      }}>
        POWERED BY CONSTRUCTAIQ →
      </span>
    </a>
  )
}

// ── Data types ────────────────────────────────────────────────────────────────

interface Verdict {
  overall:    "EXPAND" | "HOLD" | "CONTRACT"
  confidence: string
  headline:   string
  as_of:      string
}

// ── Banner content ─────────────────────────────────────────────────────────────

function VerdictBanner({ dark, transparent }: { dark: boolean; transparent: boolean }) {
  const [data, setData] = useState<Verdict | null>(null)
  const [err, setErr]   = useState(false)

  const load = useCallback(() => {
    fetch("/api/verdict")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setData(d); setErr(false) })
      .catch(() => setErr(true))
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  // Fire impression once
  useEffect(() => {
    const origin = (() => {
      if (!document.referrer) return "direct"
      try { return new URL(document.referrer).hostname } catch { return "direct" }
    })()
    fetch("/api/embed/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widget_type: "verdict", origin_domain: origin }),
    }).catch(() => {})
  }, [])

  const vc = data ? verdictColor(data.overall) : color.amber

  return (
    <div style={{
      width: 600, height: 80,
      background: bg(dark, transparent),
      border: transparent ? "none" : `1px solid ${dark ? color.bd1 : color.lightBd}`,
      borderRadius: 10,
      display: "flex", alignItems: "center",
      padding: "0 20px", gap: 16,
      boxSizing: "border-box", overflow: "hidden",
      position: "relative",
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Verdict badge */}
      {data ? (
        <span style={{
          fontFamily: MONO, fontSize: 13, fontWeight: 700,
          color: vc,
          background: dark ? color.bg3 : color.lightBgSub,
          border: `1px solid ${vc}44`,
          borderRadius: 6, padding: "4px 12px",
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {data.overall}
        </span>
      ) : (
        <div style={{
          width: 80, height: 28,
          background: dark ? color.bg3 : color.lightBgSkel,
          borderRadius: 6, animation: "pulse 1.4s ease-in-out infinite",
        }} />
      )}

      {/* Divider */}
      <div style={{ width: 1, height: 32, background: dark ? color.bd2 : color.lightBd, flexShrink: 0 }} />

      {/* Headline */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {data ? (
          <>
            <div style={{
              fontFamily: SYS, fontSize: 13, fontWeight: 500, color: fg(dark),
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.3,
            }}>
              {data.headline}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: sub(dark), marginTop: 3, letterSpacing: "0.06em" }}>
              NATIONAL MARKET VERDICT · UPDATED {new Date(data.as_of).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}
            </div>
          </>
        ) : (
          <>
            <div style={{ width: "85%", height: 13, background: dark ? color.bg3 : color.lightBgSkel, borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite", marginBottom: 5 }} />
            <div style={{ width: "40%", height: 9,  background: dark ? color.bg3 : color.lightBgSkel, borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
          </>
        )}
        {err && (
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.red }}>
            Data unavailable
          </div>
        )}
      </div>

      {/* Watermark */}
      <Watermark dark={dark} />
    </div>
  )
}

// ── Inner (needs Suspense for useSearchParams) ────────────────────────────────

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
      <VerdictBanner dark={dark} transparent={transparent} />
    </div>
  )
}

export default function VerdictEmbed() {
  return (
    <Suspense fallback={
      <div style={{ width: 600, height: 80, background: color.bg1, borderRadius: 10 }} />
    }>
      <Inner />
    </Suspense>
  )
}
