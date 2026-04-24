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

function scoreColor(score: number) {
  if (score >= 65) return color.green
  if (score <= 35) return color.red
  return color.amber
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skel({ w, h, dark }: { w: string; h: number; dark: boolean }) {
  return (
    <div style={{
      width: w, height: h,
      background: dark ? color.bg3 : color.lightBgSkel,
      borderRadius: 5, animation: "pulse 1.4s ease-in-out infinite",
    }} />
  )
}

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
        letterSpacing: "0.06em",
      }}>
        POWERED BY CONSTRUCTAIQ →
      </span>
    </a>
  )
}

// ── Data types ────────────────────────────────────────────────────────────────

interface Driver {
  id:     string
  label:  string
  score:  number
  detail: string
}

interface OpportunityData {
  metro_name:     string | null
  metro_code:     string
  state_code:     string | null
  score:          number
  classification: string
  top_drivers:    Driver[]
}

// ── Score card ─────────────────────────────────────────────────────────────────

function OpportunityCard({ metro, dark, transparent }: {
  metro: string
  dark: boolean
  transparent: boolean
}) {
  const [data, setData] = useState<OpportunityData | null>(null)
  const [err, setErr]   = useState(false)

  const load = useCallback(() => {
    if (!metro) { setErr(true); return }
    fetch(`/api/opportunity-score?metro=${encodeURIComponent(metro)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setData(d); setErr(false) })
      .catch(() => setErr(true))
  }, [metro])

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
      body: JSON.stringify({ widget_type: "opportunity", origin_domain: origin }),
    }).catch(() => {})
  }, [])

  const clr = data ? scoreColor(data.score) : color.amber
  const drivers = (data?.top_drivers ?? []).slice(0, 2)

  return (
    <div style={{
      width: 320, height: 200,
      background: bg(dark, transparent),
      border: transparent ? "none" : `1px solid ${bdr(dark)}`,
      borderRadius: 12,
      padding: "14px 16px 12px",
      boxSizing: "border-box", overflow: "hidden",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Top row: city + badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {data ? (
            <>
              <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 700, color: fg(dark), lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {data.metro_name ?? data.metro_code}
                {data.state_code ? `, ${data.state_code}` : ""}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 8, color: sub(dark), letterSpacing: "0.08em", marginTop: 2 }}>
                METRO OPPORTUNITY SCORE
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Skel w="140px" h={14} dark={dark} />
              <Skel w="90px"  h={8}  dark={dark} />
            </div>
          )}
        </div>
        {data && (
          <span style={{
            fontFamily: MONO, fontSize: 8, fontWeight: 700,
            color: clr,
            background: dark ? color.bg3 : color.lightBgSub,
            border: `1px solid ${clr}44`,
            borderRadius: 4, padding: "2px 8px", marginLeft: 8,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {data.classification.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 10 }}>
        {data ? (
          <>
            <span style={{ fontFamily: MONO, fontSize: 44, fontWeight: 700, color: clr, lineHeight: 1 }}>
              {Math.round(data.score)}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: sub(dark), lineHeight: 1 }}>
              /100
            </span>
          </>
        ) : (
          <Skel w="80px" h={44} dark={dark} />
        )}
      </div>

      {/* Top 2 signals */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        {data ? (
          drivers.length > 0 ? drivers.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 700,
                color: d.score >= 65 ? color.green : d.score <= 35 ? color.red : color.amber,
                flexShrink: 0, width: 22, textAlign: "right",
              }}>
                {Math.round(d.score)}
              </span>
              <span style={{
                fontFamily: SYS, fontSize: 11, color: sub(dark),
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {d.label}
              </span>
            </div>
          )) : null
        ) : (
          <>
            <Skel w="180px" h={12} dark={dark} />
            <Skel w="150px" h={12} dark={dark} />
          </>
        )}
      </div>

      {err && (
        <div style={{ fontFamily: MONO, fontSize: 9, color: color.red, marginTop: 4 }}>
          {!metro ? "Provide ?metro=PHX" : "Data unavailable"}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <Watermark dark={dark} />
      </div>
    </div>
  )
}

// ── Inner ─────────────────────────────────────────────────────────────────────

function Inner() {
  const sp = useSearchParams()
  const metro       = (sp.get("metro") ?? "PHX").toUpperCase()
  const dark        = sp.get("theme") !== "light"
  const transparent = sp.get("bg") === "transparent"

  return (
    <div style={{
      minHeight: "100vh", minWidth: "100vw",
      background: transparent ? "transparent" : bg(dark, false),
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <OpportunityCard metro={metro} dark={dark} transparent={transparent} />
    </div>
  )
}

export default function OpportunityEmbed() {
  return (
    <Suspense fallback={
      <div style={{ width: 320, height: 200, background: color.bg1, borderRadius: 12 }} />
    }>
      <Inner />
    </Suspense>
  )
}
