"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { font, color } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

const AMBER    = color.amber
const GREEN    = color.green
const RED      = color.red
const BG0      = color.bg0
const BG1      = color.bg1
const BG2      = color.bg2
const BD1      = color.bd1
const BD2      = color.bd2
const BD3      = color.bd3
const T1       = color.t1
const T3       = color.t3
const T4       = color.t4
const AMBER_DIM = color.amberDim
const GREEN_DIM = color.greenDim

type Variant = "compact" | "standard" | "full"
type Theme   = "dark" | "light"

// ─── Inline widget previews ───────────────────────────────────────────────────

function CompactPreview() {
  return (
    <div style={{
      background: BG2, border: "1px solid #383838", borderRadius: 8,
      padding: "12px 16px", fontFamily: MONO, width: 280,
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: AMBER }}>ConstructAIQ™</span>
        <span style={{ fontSize: 9, color: GREEN, marginLeft: "auto" }}>● LIVE</span>
      </div>
      <div style={{ fontSize: 12, color: "#fff", marginBottom: 5 }}>
        SECTOR HEALTH: 72.4 — EXPANDING
      </div>
      <div style={{ fontSize: 9, color: T4 }}>
        Updated 4hrs ago ·{" "}
        <span style={{ color: AMBER }}>constructaiq.trade →</span>
      </div>
    </div>
  )
}

function StandardPreview() {
  return (
    <div style={{
      background: BG2, border: "1px solid #383838", borderRadius: 8,
      padding: 16, fontFamily: MONO, width: 280,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: AMBER }}>ConstructAIQ™</span>
        <span style={{ fontSize: 9, color: GREEN }}>● LIVE</span>
      </div>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 24, color: AMBER, fontWeight: 700 }}>72.4</span>
        <span style={{ fontSize: 12, color: GREEN, marginLeft: 6 }}>▲ EXPANDING</span>
      </div>
      <div style={{ borderTop: "1px solid #383838", paddingTop: 8, marginBottom: 10 }}>
        {[
          { name: "Lumber", signal: "BUY",  color: GREEN },
          { name: "Steel",  signal: "HOLD", color: AMBER },
          { name: "Copper", signal: "SELL", color: RED },
        ].map(m => (
          <div key={m.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0" }}>
            <span style={{ color: "#fff" }}>{m.name}</span>
            <span style={{ color: m.color }}>{m.signal}</span>
          </div>
        ))}
      </div>
      <div style={{
        textAlign: "center", background: AMBER, color: "#000",
        borderRadius: 6, padding: "7px 0", fontSize: 11, fontWeight: 700, cursor: "pointer",
      }}>
        View Full Dashboard →
      </div>
    </div>
  )
}

function FullPreview() {
  return (
    <div style={{
      background: BG2, border: "1px solid #383838", borderRadius: 8,
      padding: 16, fontFamily: MONO, width: 280,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: AMBER }}>ConstructAIQ™</span>
        <span style={{ fontSize: 9, color: GREEN }}>● LIVE</span>
      </div>
      {/* Top states */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: T4, marginBottom: 4, letterSpacing: "0.08em" }}>TOP MARKETS</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["TX", "FL", "AZ"].map(s => (
            <span key={s} style={{
              fontSize: 9, color: AMBER, border: `1px solid ${AMBER}44`,
              borderRadius: 4, padding: "2px 6px",
            }}>{s}</span>
          ))}
        </div>
      </div>
      {/* CSHI */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: T4, marginBottom: 2, letterSpacing: "0.08em" }}>SECTOR HEALTH INDEX</div>
        <span style={{ fontSize: 24, color: AMBER, fontWeight: 700 }}>72.4</span>
        <span style={{ fontSize: 12, color: GREEN, marginLeft: 6 }}>▲ EXPANDING</span>
      </div>
      {/* Materials */}
      <div style={{ borderTop: "1px solid #383838", paddingTop: 8, marginBottom: 10 }}>
        {[
          { name: "Lumber", signal: "BUY",  clr: GREEN },
          { name: "Steel",  signal: "HOLD", clr: AMBER },
          { name: "Copper", signal: "SELL", clr: RED },
        ].map(m => (
          <div key={m.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0" }}>
            <span style={{ color: "#fff" }}>{m.name}</span>
            <span style={{ color: m.clr }}>{m.signal}</span>
          </div>
        ))}
      </div>
      {/* Forecast */}
      <div style={{ borderTop: "1px solid #383838", paddingTop: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: T4, marginBottom: 2, letterSpacing: "0.08em" }}>12-MO FORECAST</div>
        <div style={{ fontSize: 16, color: GREEN, fontWeight: 700 }}>+4.2% 12mo forecast</div>
      </div>
      <div style={{
        textAlign: "center", background: AMBER, color: "#000",
        borderRadius: 6, padding: "7px 0", fontSize: 11, fontWeight: 700, cursor: "pointer",
      }}>
        View Full Dashboard →
      </div>
    </div>
  )
}

// ─── Variant Card ─────────────────────────────────────────────────────────────

function VariantCard({
  id, label, size, selected, onClick, children,
}: {
  id: Variant; label: string; size: string; selected: boolean
  onClick: () => void; children: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: BG1,
        border: selected ? `2px solid ${AMBER}` : `1px solid ${BD1}`,
        borderRadius: 16,
        padding: 20,
        cursor: "pointer",
        flex: "1 1 260px",
        boxShadow: selected ? `0 0 24px ${AMBER}22` : "none",
        transition: "border 0.15s, box-shadow 0.15s",
      }}
    >
      <div style={{ marginBottom: 14 }}>{children}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: T4, marginTop: 8 }}>{size}</div>
      <div style={{
        marginTop: 8, fontFamily: MONO, fontSize: 11,
        color: selected ? AMBER : T4,
        letterSpacing: "0.06em",
      }}>
        {selected ? "✓ SELECTED" : label.toUpperCase()}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmbedPage() {
  const [variant, setVariant]     = useState<Variant>("compact")
  const [theme, setTheme]         = useState<Theme>("dark")
  const [focusState, setFocus]    = useState("")
  const [copied, setCopied]       = useState(false)

  const embedCode = `<div id="constructaiq-widget"></div>
<script>
  window.ConstructAIQConfig = {
    variant: "${variant}",
    theme: "${theme}",${focusState ? `\n    focusState: "${focusState}",` : ""}
  };
</script>
<script async src="https://constructaiq.trade/widget.js"></script>`

  function handleCopy() {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS, paddingBottom: "env(safe-area-inset-bottom,20px)" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit;cursor:pointer;border:none}
        button:hover{opacity:0.85}
        input:focus{outline:none}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: BG1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BD1}`,
        padding: "0 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60,
        paddingTop: "env(safe-area-inset-top,0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 24, background: BD1 }} />
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em" }}>EMBED</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard">
            <button style={{ background: "transparent", color: T3, fontFamily: MONO, fontSize: 13, padding: "8px 16px", borderRadius: 10, border: `1px solid ${BD1}`, minHeight: 44 }}>DASHBOARD</button>
          </Link>
          <Link href="/contact">
            <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 13, fontWeight: 700, padding: "8px 20px", borderRadius: 10, letterSpacing: "0.06em", minHeight: 44 }}>TALK TO US →</button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px 80px" }}>

        {/* ── HERO ── */}
        <div style={{ textAlign: "center", padding: "64px 32px 40px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: AMBER_DIM, border: `1px solid ${AMBER}44`,
            borderRadius: 20, padding: "6px 16px", marginBottom: 24,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.08em" }}>
              FREE EMBEDS · BRAND DISTRIBUTION
            </span>
          </div>
          <h1 style={{ fontFamily: SYS, fontSize: 40, fontWeight: 700, color: T1, marginBottom: 16, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Embed ConstructAIQ Intelligence
          </h1>
          <p style={{ fontFamily: SYS, fontSize: 17, color: T3, lineHeight: 1.6, maxWidth: 520, margin: "0 auto" }}>
            Add live construction intelligence to any website with one line of code. Free forever.
          </p>
        </div>

        {/* ── STEP 1 ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 18 }}>
            STEP 1 — CHOOSE YOUR WIDGET SIZE
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <VariantCard id="compact" label="Compact" size="300 × 120px" selected={variant === "compact"} onClick={() => setVariant("compact")}>
              <CompactPreview />
            </VariantCard>
            <VariantCard id="standard" label="Standard" size="300 × 280px" selected={variant === "standard"} onClick={() => setVariant("standard")}>
              <StandardPreview />
            </VariantCard>
            <VariantCard id="full" label="Full" size="300 × 480px" selected={variant === "full"} onClick={() => setVariant("full")}>
              <FullPreview />
            </VariantCard>
          </div>
        </div>

        {/* ── STEP 2 ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 18 }}>
            STEP 2 — CUSTOMIZE (OPTIONAL)
          </div>
          <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Theme toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: T4, width: 80 }}>THEME</span>
              <div style={{ display: "flex", gap: 8 }}>
                {(["dark", "light"] as Theme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      background: theme === t ? AMBER : "transparent",
                      color: theme === t ? "#000" : T3,
                      fontFamily: MONO, fontSize: 12, fontWeight: theme === t ? 700 : 400,
                      padding: "6px 18px", borderRadius: 20,
                      border: theme === t ? "none" : `1px solid ${BD2}`,
                      cursor: "pointer", letterSpacing: "0.06em",
                    }}
                  >
                    {t === "dark" ? "Dark" : "Light"}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus state */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: T4, width: 80 }}>FOCUS STATE</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>
                  Highlight a specific state (e.g. TX, CA)
                </span>
                <input
                  value={focusState}
                  onChange={e => setFocus(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="e.g. TX"
                  maxLength={2}
                  style={{
                    background: BG2, border: `1px solid ${BD1}`, borderRadius: 8,
                    padding: "8px 12px", fontFamily: MONO, fontSize: 13, color: T1,
                    width: 120, letterSpacing: "0.1em",
                  }}
                />
              </div>
            </div>

            {/* Data shown toggles */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: T4, width: 80, paddingTop: 2 }}>DATA SHOWN</span>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: "CSHI Score",        active: true  },
                  { label: "Materials Signals", active: true  },
                  { label: "State Rankings",    active: true  },
                  { label: "Forecast",          active: true  },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{
                      width: 32, height: 18, borderRadius: 9,
                      background: item.active ? GREEN_DIM : BG2,
                      border: `1px solid ${item.active ? GREEN : BD2}`,
                      position: "relative", cursor: "pointer",
                    }}>
                      <div style={{
                        position: "absolute", top: 2,
                        left: item.active ? 14 : 2,
                        width: 12, height: 12, borderRadius: "50%",
                        background: item.active ? GREEN : T4,
                        transition: "left 0.15s",
                      }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: item.active ? T1 : T4 }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 3 ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 18 }}>
            STEP 3 — COPY YOUR EMBED CODE
          </div>
          <div style={{
            background: BG0, borderRadius: 10, padding: 20,
            border: `1px solid ${BD1}`, position: "relative",
          }}>
            <pre style={{
              fontFamily: MONO, fontSize: 12, color: AMBER,
              whiteSpace: "pre", overflowX: "auto", margin: 0,
              lineHeight: 1.7,
            }}>
              {embedCode}
            </pre>
            <button
              onClick={handleCopy}
              style={{
                position: "absolute", top: 12, right: 12,
                background: BG2, border: `1px solid ${BD1}`,
                fontFamily: MONO, fontSize: 11, padding: "6px 12px",
                borderRadius: 6, cursor: "pointer",
                color: copied ? GREEN : T3,
              }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* ── DISTRIBUTION STATS ── */}
        <div style={{ background: BG1, border: `1px solid ${BD1}`, borderRadius: 16, padding: "28px 32px", marginBottom: 40 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 20 }}>
            DISTRIBUTION STATS
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { label: "Active Embeds",  value: "0 domains", note: "launch day" },
              { label: "Total Renders",  value: "—",         note: "" },
              { label: "Total Clicks",   value: "—",         note: "" },
            ].map(stat => (
              <div key={stat.label} style={{ flex: "1 1 140px" }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.08em", marginBottom: 6 }}>
                  {stat.label.toUpperCase()}
                </div>
                <div style={{ fontFamily: SYS, fontSize: 28, fontWeight: 700, color: T1, lineHeight: 1 }}>
                  {stat.value}
                </div>
                {stat.note && (
                  <div style={{ fontFamily: MONO, fontSize: 10, color: T4, marginTop: 4 }}>{stat.note}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: "10px 14px", background: BG2, borderRadius: 8, border: `1px solid ${BD2}` }}>
            <span style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>
              Analytics activate after your first embed is live
            </span>
          </div>
        </div>

        {/* ── USE CASES ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 20 }}>
            USE CASES
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              {
                icon: "🏦",
                title: "Banks",
                desc: "Add a live CSHI badge to your construction lending page",
              },
              {
                icon: "📰",
                title: "Media",
                desc: "Display live sector health data alongside construction industry coverage",
              },
              {
                icon: "🏗",
                title: "Associations",
                desc: "Show member-facing market intelligence on your organization website",
              },
            ].map(c => (
              <div key={c.title} style={{
                flex: "1 1 220px", background: BG1, border: `1px solid ${BD1}`,
                borderRadius: 16, padding: "24px 20px",
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: T1, marginBottom: 8 }}>
                  {c.title}
                </div>
                <div style={{ fontFamily: SYS, fontSize: 14, color: T3, lineHeight: 1.5 }}>
                  {c.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back links */}
        <div style={{ textAlign: "center" }}>
          <Link href="/dashboard" style={{ fontFamily: SYS, fontSize: 15, color: T4, textDecoration: "underline" }}>
            ← Back to Dashboard
          </Link>
          <span style={{ fontFamily: SYS, fontSize: 15, color: T4, margin: "0 16px" }}>·</span>
          <Link href="/" style={{ fontFamily: SYS, fontSize: 15, color: T4, textDecoration: "underline" }}>
            Back to Home
          </Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${BD1}`, padding: "32px", textAlign: "center" }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ" style={{ height: 20, width: "auto", marginBottom: 12 }} />
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 6 }}>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
      </footer>
    </div>
  )
}
