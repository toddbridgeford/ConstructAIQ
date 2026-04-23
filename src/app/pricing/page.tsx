import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { font, color } from "@/lib/theme"

export const metadata: Metadata = {
  title: "ConstructAIQ is Free — Here's Why",
  description:
    "ConstructAIQ is free forever. No subscription. No credit card. Built on public data from the Census Bureau, BLS, FRED, and USASpending.gov — fully open methodology.",
}

const SYS  = font.sys
const MONO = font.mono

const SOURCES = [
  { name: "U.S. Census Bureau",         desc: "Total construction spending, housing starts, building permits" },
  { name: "Bureau of Labor Statistics", desc: "Construction employment, producer price indices, wages" },
  { name: "FRED (St. Louis Fed)",        desc: "Macroeconomic series — rates, GDP, leading indicators" },
  { name: "USASpending.gov",             desc: "Federal infrastructure awards and IIJA/IRA program execution" },
  { name: "SAM.gov",                     desc: "Active federal solicitations — NAICS 236/237/238" },
  { name: "U.S. DOL WARN Act",           desc: "Layoff notices as a leading contraction indicator" },
]

const ACCESS_TIERS = [
  {
    label:    "Dashboard",
    badge:    "FREE · NO ACCOUNT",
    badgeCol: color.green,
    desc:     "Full dashboard access. No login, no credit card, no expiry.",
    items: [
      "12-month ensemble AI forecast",
      "Anomaly and divergence signals",
      "Materials BUY/SELL/HOLD intelligence",
      "50-state construction activity map",
      "Federal infrastructure tracker",
      "Weekly AI brief",
    ],
    cta: { label: "Open Dashboard", href: "/dashboard" },
  },
  {
    label:    "API",
    badge:    "FREE · 1,000 req/day",
    badgeCol: color.blue,
    desc:     "Open REST API for developers and analysts. Register for a key instantly.",
    items: [
      "All endpoints: forecast, signals, pricewatch, federal",
      "1,000 requests per day",
      "Researcher tier: 10,000 req/day with .edu email",
      "Embeddable chart widgets",
    ],
    cta: { label: "Get API Key", href: "/api-access" },
  },
  {
    label:    "Enterprise",
    badge:    "CONTACT US",
    badgeCol: color.amber,
    desc:     "White-label, custom data feeds, and SLA support for large organizations.",
    items: [
      "White-label embed for your platform",
      "Custom data feeds and frequency",
      "Dedicated SLA and support",
      "Data licensing agreements",
    ],
    cta: { label: "Contact Us", href: "/contact" },
  },
]

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", background: color.bg0, color: color.t1, fontFamily: SYS }}>

      {/* Nav */}
      <nav style={{
        background: color.bg1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${color.bd1}`,
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <Link href="/">
          <Image src="/ConstructAIQWhiteLogo.svg" width={128} height={24} alt="ConstructAIQ"
            style={{ height: 24, width: "auto", display: "block" }} />
        </Link>
        <Link href="/dashboard" style={{
          background: color.blue, color: color.t1,
          fontFamily: SYS, fontSize: 14, fontWeight: 600,
          padding: "8px 18px", borderRadius: 8, textDecoration: "none",
        }}>
          Dashboard →
        </Link>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 96px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{
            display: "inline-block", fontFamily: MONO, fontSize: 11, fontWeight: 600,
            color: color.green, background: color.green + "18",
            border: `1px solid ${color.green}44`, borderRadius: 20,
            padding: "5px 16px", marginBottom: 28, letterSpacing: "0.1em",
          }}>
            FREE FOREVER · NO CREDIT CARD · NO ACCOUNT REQUIRED
          </div>

          <h1 style={{
            fontFamily: SYS, fontSize: 52, fontWeight: 700, color: color.t1,
            lineHeight: 1.1, marginBottom: 24, letterSpacing: "-0.03em",
          }}>
            ConstructAIQ is Free.<br />
            <span style={{ color: color.amber }}>Here&apos;s Why.</span>
          </h1>

          <p style={{
            fontFamily: SYS, fontSize: 18, color: color.t3,
            lineHeight: 1.7, maxWidth: 560, margin: "0 auto",
          }}>
            Every data source we use is public. Every model we run is open.
            There is no moat to protect, so there is no reason to charge.
            ConstructAIQ is the FRED for the American construction economy.
          </p>
        </div>

        {/* Data sources */}
        <div style={{
          background: color.bg1, border: `1px solid ${color.bd1}`,
          borderRadius: 20, padding: "36px 40px", marginBottom: 64,
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 11, color: color.amber,
            letterSpacing: "0.12em", marginBottom: 20,
          }}>
            THE DATA SOURCES
          </div>
          <p style={{ fontFamily: SYS, fontSize: 15, color: color.t3, lineHeight: 1.7, marginBottom: 28 }}>
            The Census Bureau, BLS, Federal Reserve, and USASpending.gov publish
            their data at public expense. We aggregate, normalize, and model it —
            then give the output back to the industry that needs it most.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {SOURCES.map(s => (
              <div key={s.name} style={{
                background: color.bg2, borderRadius: 12, padding: "16px 20px",
                border: `1px solid ${color.bd2}`,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: color.t1, fontWeight: 600, marginBottom: 6 }}>
                  {s.name}
                </div>
                <div style={{ fontFamily: SYS, fontSize: 13, color: color.t4, lineHeight: 1.5 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access tiers */}
        <div style={{ marginBottom: 64 }}>
          <div style={{
            fontFamily: MONO, fontSize: 11, color: color.t4,
            letterSpacing: "0.12em", marginBottom: 28, textAlign: "center",
          }}>
            ACCESS LEVELS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {ACCESS_TIERS.map(tier => (
              <div key={tier.label} style={{
                background: color.bg1, border: `1px solid ${color.bd1}`,
                borderRadius: 20, padding: "28px 28px 24px",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 10, fontWeight: 700,
                    color: tier.badgeCol, background: tier.badgeCol + "18",
                    border: `1px solid ${tier.badgeCol}44`,
                    borderRadius: 6, padding: "3px 8px", letterSpacing: "0.08em",
                  }}>
                    {tier.badge}
                  </span>
                </div>
                <div style={{ fontFamily: SYS, fontSize: 18, fontWeight: 700, color: color.t1, marginBottom: 8 }}>
                  {tier.label}
                </div>
                <div style={{ fontFamily: SYS, fontSize: 14, color: color.t3, marginBottom: 20, lineHeight: 1.5 }}>
                  {tier.desc}
                </div>
                <ul style={{ margin: "0 0 24px", padding: "0 0 0 18px", listStyle: "disc" }}>
                  {tier.items.map(item => (
                    <li key={item} style={{ fontFamily: SYS, fontSize: 13, color: color.t4, marginBottom: 6, lineHeight: 1.5 }}>
                      {item}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: "auto" }}>
                  <Link href={tier.cta.href} style={{
                    display: "block", textAlign: "center",
                    background: color.bg2, border: `1px solid ${color.bd1}`,
                    borderRadius: 10, padding: "10px 0",
                    fontFamily: SYS, fontSize: 14, fontWeight: 600,
                    color: color.t2, textDecoration: "none",
                  }}>
                    {tier.cta.label}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open methodology */}
        <div style={{
          background: color.bg1, border: `1px solid ${color.bd1}`,
          borderRadius: 20, padding: "36px 40px",
          display: "flex", gap: 40, flexWrap: "wrap", alignItems: "center",
        }}>
          <div style={{ flex: "1 1 300px" }}>
            <div style={{
              fontFamily: MONO, fontSize: 11, color: color.amber,
              letterSpacing: "0.12em", marginBottom: 16,
            }}>
              OPEN METHODOLOGY
            </div>
            <h2 style={{ fontFamily: SYS, fontSize: 24, fontWeight: 700, color: color.t1, marginBottom: 14 }}>
              Every model is documented.
            </h2>
            <p style={{ fontFamily: SYS, fontSize: 14, color: color.t3, lineHeight: 1.7, margin: 0 }}>
              Our 3-model ensemble (Holt-Winters, SARIMA, XGBoost) is fully described
              including weights, back-test results, and MAPE accuracy metrics.
              No black box. No proprietary edge. Just honest data analysis.
            </p>
          </div>
          <div style={{ flex: "0 0 auto" }}>
            <Link href="/methodology" style={{
              display: "inline-block",
              background: color.amber, color: "#000",
              fontFamily: MONO, fontSize: 12, fontWeight: 700,
              padding: "12px 24px", borderRadius: 10,
              textDecoration: "none", letterSpacing: "0.06em",
            }}>
              READ THE METHODOLOGY →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
