"use client"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { font, color } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

// ── Widget catalogue ──────────────────────────────────────────────────────────

interface WidgetDef {
  id:      string
  name:    string
  desc:    string
  path:    string
  nativeW: number
  nativeH: number
  usedFor: string
  hasMetro?: boolean
}

const WIDGETS: WidgetDef[] = [
  {
    id:      "opportunity",
    name:    "Metro Opportunity Score",
    desc:    "City name, score (0–100), classification, and top 2 market signals.",
    path:    "/embed/opportunity",
    nativeW: 320,
    nativeH: 200,
    usedFor: "Lender dashboards, EDO websites, broker newsletters",
    hasMetro: true,
  },
  {
    id:      "verdict",
    name:    "National Market Verdict Banner",
    desc:    "EXPAND / HOLD / CONTRACT verdict with a one-line AI-generated headline.",
    path:    "/embed/verdict",
    nativeW: 600,
    nativeH: 80,
    usedFor: "Trade publication articles, industry newsletters, association pages",
  },
  {
    id:      "map",
    name:    "US State Heat Map",
    desc:    "Choropleth bubble map of permit growth YoY across all 50 states.",
    path:    "/embed/map",
    nativeW: 600,
    nativeH: 400,
    usedFor: "Research reports, supplier territory pages, economic development portals",
  },
  {
    id:      "materials",
    name:    "Material Cost Ticker",
    desc:    "4 commodity prices with month-over-month change and BUY/SELL/HOLD signal.",
    path:    "/embed/materials",
    nativeW: 480,
    nativeH: 120,
    usedFor: "Supplier sidebars, procurement newsletters, contractor intranets",
  },
  {
    id:      "leaderboard",
    name:    "Top 5 Metro Leaderboard",
    desc:    "Ranked list of the five highest-opportunity metros by composite score.",
    path:    "/embed/leaderboard",
    nativeW: 320,
    nativeH: 280,
    usedFor: "Real estate sidebars, regional development sites, bid-board platforms",
  },
]

// ── Scaled iframe preview ─────────────────────────────────────────────────────

const MAX_PREVIEW_W = 560

function ScaledIframe({
  src, nativeW, nativeH,
}: {
  src: string; nativeW: number; nativeH: number
}) {
  const scale    = Math.min(1, MAX_PREVIEW_W / nativeW)
  const displayW = Math.round(nativeW * scale)
  const displayH = Math.round(nativeH * scale)

  return (
    <div style={{
      width: displayW, height: displayH,
      overflow: "hidden", position: "relative",
      borderRadius: 10, flexShrink: 0,
    }}>
      <iframe
        src={src}
        width={nativeW}
        height={nativeH}
        frameBorder="0"
        scrolling="no"
        sandbox="allow-scripts allow-same-origin allow-popups"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          display: "block",
          border: "none",
        }}
      />
    </div>
  )
}

// ── Single widget card ────────────────────────────────────────────────────────

function WidgetCard({ widget }: { widget: WidgetDef }) {
  const [theme, setTheme]   = useState<"dark" | "light">("dark")
  const [metro, setMetro]   = useState("PHX")
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("https://constructaiq.trade")

  useEffect(() => { setOrigin(window.location.origin) }, [])

  const params = new URLSearchParams({ theme })
  if (widget.hasMetro) params.set("metro", metro)
  const previewPath = `${widget.path}?${params}`
  const embedSrc    = `${origin}${widget.path}?${params}`

  const iframeCode = [
    `<iframe`,
    `  src="${embedSrc}"`,
    `  width="${widget.nativeW}"`,
    `  height="${widget.nativeH}"`,
    `  frameborder="0"`,
    `  scrolling="no"`,
    `  style="border:none;overflow:hidden"`,
    `  loading="lazy"`,
    `></iframe>`,
  ].join("\n")

  function handleCopy() {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const isDark = theme === "dark"

  return (
    <div style={{
      background: color.bg1, border: `1px solid ${color.bd1}`,
      borderRadius: 16, overflow: "hidden",
      marginBottom: 32,
    }}>
      {/* Preview panel */}
      <div style={{
        background: isDark ? color.bg0 : "#f0f0f0",
        padding: "32px 24px",
        display: "flex", justifyContent: "center", alignItems: "center",
        minHeight: Math.min(widget.nativeH + 64, 300),
        borderBottom: `1px solid ${color.bd1}`,
      }}>
        <ScaledIframe src={previewPath} nativeW={widget.nativeW} nativeH={widget.nativeH} />
      </div>

      {/* Info + controls */}
      <div style={{ padding: "24px 28px 28px" }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontFamily: SYS, fontSize: 17, fontWeight: 700, color: color.t1 }}>
              {widget.name}
            </div>
            <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3, marginTop: 4, lineHeight: 1.5 }}>
              {widget.desc}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <span style={{
              fontFamily: MONO, fontSize: 10, color: color.t4,
              background: color.bg3, borderRadius: 6,
              padding: "4px 10px", whiteSpace: "nowrap",
            }}>
              {widget.nativeW} × {widget.nativeH}px
            </span>
          </div>
        </div>

        <div style={{ fontFamily: MONO, fontSize: 9, color: color.amber, letterSpacing: "0.08em", marginBottom: 18 }}>
          USED FOR: {widget.usedFor.toUpperCase()}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 20 }}>

          {/* Theme */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.08em", marginBottom: 8 }}>THEME</div>
            <div style={{ display: "flex", gap: 4 }}>
              {(["dark", "light"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  style={{
                    fontFamily: MONO, fontSize: 11,
                    background: theme === t ? color.amber : color.bg3,
                    color: theme === t ? "#000" : color.t3,
                    fontWeight: theme === t ? 700 : 400,
                    border: "none", borderRadius: 20,
                    padding: "5px 14px", cursor: "pointer",
                    letterSpacing: "0.06em",
                    minHeight: 34,
                  }}
                >
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>

          {/* Metro input (opportunity widget only) */}
          {widget.hasMetro && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.08em", marginBottom: 8 }}>METRO CODE</div>
              <input
                value={metro}
                onChange={e => setMetro(e.target.value.toUpperCase().slice(0, 5))}
                placeholder="PHX"
                maxLength={5}
                style={{
                  background: color.bg3, border: `1px solid ${color.bd2}`,
                  borderRadius: 8, padding: "5px 12px",
                  fontFamily: MONO, fontSize: 13, color: color.t1,
                  width: 90, letterSpacing: "0.1em",
                  minHeight: 34, boxSizing: "border-box",
                }}
              />
              <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, marginTop: 4 }}>
                e.g. PHX · AUS · MIA · DEN · SEA
              </div>
            </div>
          )}
        </div>

        {/* Code block */}
        <div style={{ position: "relative" }}>
          <pre style={{
            fontFamily: MONO, fontSize: 11, color: color.amber,
            background: color.bg0, borderRadius: 10,
            padding: "16px 20px", margin: 0,
            overflowX: "auto", lineHeight: 1.7,
            border: `1px solid ${color.bd1}`,
            whiteSpace: "pre",
          }}>
            {iframeCode}
          </pre>
          <button
            onClick={handleCopy}
            style={{
              position: "absolute", top: 10, right: 10,
              background: color.bg3, border: `1px solid ${color.bd2}`,
              fontFamily: MONO, fontSize: 11,
              color: copied ? color.green : color.t3,
              borderRadius: 6, padding: "5px 12px", cursor: "pointer",
              minHeight: 32,
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Embed stats ────────────────────────────────────────────────────────────────

interface PlatformStats {
  embed_impressions:       number
  embed_impressions_label: string
}

function EmbedStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    fetch("/api/platform-stats")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  return (
    <div style={{
      background: color.bg1, border: `1px solid ${color.bd1}`,
      borderRadius: 16, padding: "28px 32px", marginBottom: 40,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 20 }}>
        EMBED DISTRIBUTION
      </div>
      <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", marginBottom: 6 }}>
            TOTAL IMPRESSIONS
          </div>
          <div style={{ fontFamily: SYS, fontSize: 32, fontWeight: 700, color: color.t1, lineHeight: 1 }}>
            {stats ? (stats.embed_impressions === 0 ? "—" : stats.embed_impressions_label) : "…"}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 4 }}>
            across all embed types
          </div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", marginBottom: 6 }}>
            WIDGET TYPES
          </div>
          <div style={{ fontFamily: SYS, fontSize: 32, fontWeight: 700, color: color.t1, lineHeight: 1 }}>
            5
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 4 }}>
            opportunity · verdict · map · materials · leaderboard
          </div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", marginBottom: 6 }}>
            COST
          </div>
          <div style={{ fontFamily: SYS, fontSize: 32, fontWeight: 700, color: color.green, lineHeight: 1 }}>
            $0
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginTop: 4 }}>
            free forever · no attribution required
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Use case strip ────────────────────────────────────────────────────────────

const USE_CASES = [
  {
    title: "Construction Lenders",
    example: "Embed the Opportunity Score on your loan products page to show borrowers which markets ConstructAIQ rates as high-confidence.",
  },
  {
    title: "Trade Publications",
    example: "Drop the Verdict Banner into any article about housing starts or materials costs. It auto-refreshes — readers always see the current market call.",
  },
  {
    title: "Economic Development Organizations",
    example: "The Metro Leaderboard and State Map let EDOs show investors where construction activity is concentrating in real time.",
  },
  {
    title: "Material Suppliers",
    example: "The Materials Ticker gives procurement teams a live BUY/SELL/HOLD signal for lumber, steel, concrete, and copper in a sidebar-sized widget.",
  },
]

function UseCases() {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 20 }}>
        WHO EMBEDS CONSTRUCTAIQ
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {USE_CASES.map(uc => (
          <div key={uc.title} style={{
            background: color.bg1, border: `1px solid ${color.bd1}`,
            borderRadius: 14, padding: "20px 22px",
          }}>
            <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: color.t1, marginBottom: 8 }}>
              {uc.title}
            </div>
            <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.55 }}>
              {uc.example}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Notes ─────────────────────────────────────────────────────────────────────

function Notes() {
  return (
    <div style={{
      background: color.bg1, border: `1px solid ${color.bd1}`,
      borderRadius: 14, padding: "22px 26px", marginBottom: 48,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.amber, letterSpacing: "0.1em", marginBottom: 14 }}>
        USAGE NOTES
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          "All embeds work on any site without CORS restrictions — paste the iframe and it works.",
          "Add ?bg=transparent to remove the card background (useful for custom-styled containers).",
          "Add ?theme=light for a white background suitable for light-mode publications.",
          "Data refreshes every 4 hours client-side — no additional requests to your server.",
          "The \"Powered by ConstructAIQ →\" link is always present and opens constructaiq.trade.",
          "Opportunity widget requires a metro code (?metro=PHX). Supported codes match our permit-tracked markets.",
        ].map((note, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.amber, flexShrink: 0, marginTop: 2 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: SYS, fontSize: 13, color: color.t3, lineHeight: 1.55 }}>
              {note}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EmbedGalleryPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: color.bg0,
      color: color.t1,
      fontFamily: SYS,
      paddingBottom: "env(safe-area-inset-bottom, 24px)",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        button { outline: none; font-family: inherit; cursor: pointer; border: none; }
        button:hover { opacity: 0.85; }
        input { color-scheme: dark; }
        input:focus { outline: none; }
        pre { tab-size: 2; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: color.bg1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${color.bd1}`,
        padding: "0 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 24, background: color.bd1 }} />
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em" }}>EMBED WIDGETS</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard">
            <button style={{ background: "transparent", color: color.t3, fontFamily: MONO, fontSize: 12, padding: "8px 16px", borderRadius: 10, border: `1px solid ${color.bd1}`, minHeight: 40 }}>
              DASHBOARD
            </button>
          </Link>
          <Link href="/trust">
            <button style={{ background: color.amber, color: "#000", fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "8px 18px", borderRadius: 10, letterSpacing: "0.06em", minHeight: 40 }}>
              TRUST CENTER →
            </button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: "center", padding: "60px 24px 48px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: color.amberDim, border: `1px solid ${color.amber}44`,
            borderRadius: 20, padding: "5px 14px", marginBottom: 22,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.amber, letterSpacing: "0.08em" }}>
              FREE EMBEDS · WORKS ON ANY SITE
            </span>
          </div>
          <h1 style={{ fontFamily: SYS, fontSize: 38, fontWeight: 700, color: color.t1, marginBottom: 14, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Embed ConstructAIQ Intelligence
          </h1>
          <p style={{ fontFamily: SYS, fontSize: 16, color: color.t3, lineHeight: 1.6, maxWidth: 500, margin: "0 auto 0" }}>
            Live construction intelligence for lenders, suppliers, trade publications, and EDOs. Paste one iframe and it works — no API key, no setup.
          </p>
        </div>

        {/* ── Widget gallery ── */}
        <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 20 }}>
          AVAILABLE WIDGETS — LIVE PREVIEWS
        </div>

        {WIDGETS.map(w => <WidgetCard key={w.id} widget={w} />)}

        {/* ── Embed stats ── */}
        <EmbedStats />

        {/* ── Use cases ── */}
        <UseCases />

        {/* ── Notes ── */}
        <Notes />

        {/* ── Back links ── */}
        <div style={{ textAlign: "center" }}>
          <Link href="/trust" style={{ fontFamily: SYS, fontSize: 14, color: color.t4, textDecoration: "underline" }}>
            Trust Center
          </Link>
          <span style={{ fontFamily: SYS, fontSize: 14, color: color.t4, margin: "0 14px" }}>·</span>
          <Link href="/dashboard" style={{ fontFamily: SYS, fontSize: 14, color: color.t4, textDecoration: "underline" }}>
            Dashboard
          </Link>
          <span style={{ fontFamily: SYS, fontSize: 14, color: color.t4, margin: "0 14px" }}>·</span>
          <Link href="/" style={{ fontFamily: SYS, fontSize: 14, color: color.t4, textDecoration: "underline" }}>
            Home
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${color.bd1}`, padding: "28px 32px", textAlign: "center" }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ" style={{ height: 20, width: "auto", marginBottom: 10 }} />
        <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4 }}>
          Construction Intelligence Platform · constructaiq.trade
        </div>
        <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4, marginTop: 4 }}>
          Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov
        </div>
      </footer>
    </div>
  )
}
