"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { font, color } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

const BASE = "https://constructaiq.trade"

type ChartKey = "forecast" | "federal-pipeline" | "signals" | "materials"

const CHARTS: { key: ChartKey; label: string; desc: string; height: number }[] = [
  {
    key:    "forecast",
    label:  "Forecast Chart",
    desc:   "12-month ensemble AI forecast with confidence bands",
    height: 420,
  },
  {
    key:    "federal-pipeline",
    label:  "Federal Pipeline",
    desc:   "IIJA & IRA program execution by agency",
    height: 380,
  },
  {
    key:    "signals",
    label:  "Market Signals",
    desc:   "Live anomaly and trend-reversal detection",
    height: 300,
  },
  {
    key:    "materials",
    label:  "Materials Prices",
    desc:   "BUY/SELL/HOLD signals for construction commodities",
    height: 360,
  },
]

function embedTag(chart: ChartKey) {
  return `<script src="${BASE}/embed.js"\n  data-chart="${chart}"\n  data-geo="national"\n  data-theme="dark"\n  data-period="12M">\n</script>`
}

export default function ApiAccessPage() {
  const [selectedChart, setSelectedChart] = useState<ChartKey>("forecast")
  const [copied, setCopied] = useState(false)

  const previewHeight = CHARTS.find(c => c.key === selectedChart)?.height ?? 420
  const previewSrc    = `/embed/${selectedChart}?geo=national&theme=dark&period=12M`
  const code          = embedTag(selectedChart)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: color.bg0,
      color: color.t1,
      fontFamily: SYS,
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit;cursor:pointer;border:none}
        button:hover{opacity:.85}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: color.bg1 + "ee",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${color.bd1}`,
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image
              src="/ConstructAIQWhiteLogo.svg"
              width={120} height={24} alt="ConstructAIQ"
              style={{ height: 24, width: "auto" }}
            />
          </Link>
          <div style={{ width: 1, height: 24, background: color.bd1 }} />
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em" }}>
            API ACCESS
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/dashboard">
            <button style={{
              background: "transparent", color: color.t3,
              fontFamily: MONO, fontSize: 13,
              padding: "8px 16px", borderRadius: 10,
              border: `1px solid ${color.bd1}`, minHeight: 44,
            }}>
              DASHBOARD
            </button>
          </Link>
          <Link href="/pricing">
            <button style={{
              background: color.amber, color: "#000",
              fontFamily: MONO, fontSize: 13, fontWeight: 700,
              padding: "8px 20px", borderRadius: 10,
              letterSpacing: "0.06em", minHeight: 44,
            }}>
              GET API KEY →
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{
        maxWidth: 860, margin: "0 auto",
        padding: "72px 32px 48px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: color.amberDim, border: `1px solid ${color.amber}44`,
          borderRadius: 20, padding: "6px 16px", marginBottom: 24,
        }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: color.amber, letterSpacing: "0.08em" }}>
            REST API · EMBEDS · WEBHOOKS
          </span>
        </div>
        <h1 style={{
          fontFamily: SYS, fontSize: 40, fontWeight: 700, color: color.t1,
          marginBottom: 16, lineHeight: 1.15, letterSpacing: "-0.02em",
        }}>
          Integrate ConstructAIQ
        </h1>
        <p style={{
          fontFamily: SYS, fontSize: 17, color: color.t3,
          lineHeight: 1.6, maxWidth: 500, margin: "0 auto",
        }}>
          REST API with tiered key access. Embeddable charts for any website.
          Free to embed — API access from $490/mo.
        </p>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px 80px" }}>

        {/* ── API TIERS ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{
            fontFamily: MONO, fontSize: 11, color: color.t4,
            letterSpacing: "0.1em", marginBottom: 20,
          }}>
            API TIERS
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              {
                name:    "Intelligence",
                price:   "$490",
                rpmLimit:  "60 RPM",
                includes:  ["Forecast endpoint", "Signals", "Materials", "Historical data"],
              },
              {
                name:    "Professional",
                price:   "$1,490",
                rpmLimit: "300 RPM",
                includes:  ["All Intelligence", "Federal pipeline", "Scenario builder", "Webhooks"],
                highlight: true,
              },
              {
                name:    "Enterprise",
                price:   "Custom",
                rpmLimit: "Unlimited",
                includes:  ["All Professional", "White-label embeds", "Dedicated SLA", "Data exports"],
              },
            ].map(tier => (
              <div key={tier.name} style={{
                flex: "1 1 220px",
                background: tier.highlight ? color.blueDim : color.bg1,
                border: `1px solid ${tier.highlight ? color.blue : color.bd1}`,
                borderRadius: 16, padding: "24px 24px",
              }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", marginBottom: 8 }}>
                  {tier.name.toUpperCase()}
                </div>
                <div style={{
                  fontFamily: SYS, fontSize: 28, fontWeight: 700, color: color.t1,
                  marginBottom: 4,
                }}>
                  {tier.price}
                  {tier.price !== "Custom" && (
                    <span style={{ fontSize: 14, fontWeight: 400, color: color.t4 }}>/mo</span>
                  )}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: color.amber, marginBottom: 16 }}>
                  {tier.rpmLimit}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {tier.includes.map(f => (
                    <div key={f} style={{ fontFamily: SYS, fontSize: 13, color: color.t3, display: "flex", gap: 6 }}>
                      <span style={{ color: color.green, flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <Link href="/pricing" style={{ fontFamily: SYS, fontSize: 14, color: color.amber }}>
              Full pricing details →
            </Link>
          </div>
        </div>

        {/* ── EMBED ON YOUR SITE ── */}
        <div id="embed">
          <div style={{
            fontFamily: MONO, fontSize: 11, color: color.t4,
            letterSpacing: "0.1em", marginBottom: 20,
          }}>
            EMBED ON YOUR SITE
          </div>
          <h2 style={{
            fontFamily: SYS, fontSize: 26, fontWeight: 700, color: color.t1,
            marginBottom: 8, letterSpacing: "-0.01em",
          }}>
            Live Charts — One Line of Code
          </h2>
          <p style={{
            fontFamily: SYS, fontSize: 15, color: color.t3,
            lineHeight: 1.6, marginBottom: 32,
          }}>
            Add any ConstructAIQ chart to your website for free. No account needed.
            Charts update automatically from live data.
          </p>

          {/* Chart option cards */}
          <div style={{
            fontFamily: MONO, fontSize: 10, color: color.t4,
            letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Select a chart
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
            {CHARTS.map(c => {
              const active = selectedChart === c.key
              return (
                <button
                  key={c.key}
                  onClick={() => setSelectedChart(c.key)}
                  style={{
                    flex: "1 1 160px",
                    background: active ? color.amberDim : color.bg1,
                    border: `1px solid ${active ? color.amber : color.bd1}`,
                    borderRadius: 12,
                    padding: "16px 18px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "border 0.15s, background 0.15s",
                    boxShadow: active ? `0 0 20px ${color.amber}1a` : "none",
                  }}
                >
                  <div style={{
                    fontFamily: SYS, fontSize: 14, fontWeight: 600,
                    color: active ? color.amber : color.t1,
                    marginBottom: 4,
                  }}>
                    {c.label}
                  </div>
                  <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4, lineHeight: 1.4 }}>
                    {c.desc}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Live preview */}
          <div style={{
            fontFamily: MONO, fontSize: 10, color: color.t4,
            letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: 10,
          }}>
            Live preview
          </div>
          <div style={{
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 24,
          }}>
            <iframe
              key={selectedChart}
              src={previewSrc}
              width="100%"
              height={previewHeight}
              style={{ display: "block", border: "none" }}
              title={`ConstructAIQ ${selectedChart} preview`}
            />
          </div>

          {/* Embed code */}
          <div style={{
            fontFamily: MONO, fontSize: 10, color: color.t4,
            letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: 10,
          }}>
            Embed code
          </div>
          <div style={{
            background: color.bg0,
            border: `1px solid ${color.bd1}`,
            borderRadius: 12,
            padding: "20px 20px",
            position: "relative",
          }}>
            <pre style={{
              fontFamily: MONO, fontSize: 12, color: color.amber,
              whiteSpace: "pre", overflowX: "auto", margin: 0,
              lineHeight: 1.7, paddingRight: 80,
            }}>
              {code}
            </pre>
            <button
              onClick={handleCopy}
              style={{
                position: "absolute", top: 12, right: 12,
                background: color.bg2,
                border: `1px solid ${color.bd2}`,
                fontFamily: MONO, fontSize: 11,
                padding: "6px 14px", borderRadius: 6,
                color: copied ? color.green : color.t3,
                cursor: "pointer",
                minWidth: 64,
              }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>

          {/* Supported attributes */}
          <div style={{
            marginTop: 20,
            background: color.bg1,
            border: `1px solid ${color.bd1}`,
            borderRadius: 12, padding: "16px 20px",
          }}>
            <div style={{
              fontFamily: MONO, fontSize: 10, color: color.t4,
              letterSpacing: "0.08em", marginBottom: 12,
            }}>
              SUPPORTED ATTRIBUTES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { attr: "data-chart",  vals: "forecast · federal-pipeline · signals · materials" },
                { attr: "data-geo",    vals: "national · TX · CA · FL · NY · … (two-letter state code)" },
                { attr: "data-theme",  vals: "dark · light" },
                { attr: "data-period", vals: "6M · 12M · 24M" },
              ].map(row => (
                <div key={row.attr} style={{
                  display: "flex", gap: 16, flexWrap: "wrap",
                  borderTop: `1px solid ${color.bd1}`, paddingTop: 8,
                }}>
                  <code style={{
                    fontFamily: MONO, fontSize: 12, color: color.blue,
                    flexShrink: 0, minWidth: 140,
                  }}>
                    {row.attr}
                  </code>
                  <span style={{ fontFamily: SYS, fontSize: 13, color: color.t3 }}>
                    {row.vals}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${color.bd1}`,
        padding: "32px",
        textAlign: "center",
      }}>
        <Image
          src="/ConstructAIQWhiteLogo.svg"
          width={100} height={20} alt="ConstructAIQ"
          style={{ height: 20, width: "auto", marginBottom: 12 }}
        />
        <div style={{ fontFamily: SYS, fontSize: 13, color: color.t4 }}>
          Construction Intelligence Platform · constructaiq.trade
        </div>
      </footer>
    </div>
  )
}
