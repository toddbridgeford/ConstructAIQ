"use client"
import Image from "next/image"
import Link from "next/link"
import { font, color } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono
const AMBER = color.amber
const GREEN = color.green
const BLUE  = color.blue
const BG0   = color.bg0
const BG1   = color.bg1
const BG2   = color.bg2
const BD1   = color.bd1
const BD2   = color.bd2
const T1    = color.t1
const T2    = color.t2
const T3    = color.t3
const T4    = color.t4

interface Tier {
  label:    string
  badge:    string
  badgeCol: string
  tagline:  string
  features: string[]
  ctaLabel: string
  ctaHref:  string
  highlight: boolean
}

const TIERS: Tier[] = [
  {
    label:    "INDIVIDUAL",
    badge:    "FREE",
    badgeCol: GREEN,
    tagline:  "Full access. No credit card. No expiry.",
    features: [
      "Full dashboard access",
      "12-month AI ensemble forecast",
      "All signals and anomaly detection",
      "1,000 API requests / day",
      "CSV export",
    ],
    ctaLabel:  "Get Free Access",
    ctaHref:   "/api/keys/issue",
    highlight: false,
  },
  {
    label:    "RESEARCHER",
    badge:    "FREE — .edu verified",
    badgeCol: BLUE,
    tagline:  "For academic and policy research.",
    features: [
      "Everything in Individual",
      "10,000 API requests / day",
      "Bulk historical data download",
      "Priority data freshness",
    ],
    ctaLabel:  "Apply for Research Access",
    ctaHref:   "mailto:research@constructaiq.trade?subject=Research Access Request",
    highlight: true,
  },
  {
    label:    "ENTERPRISE",
    badge:    "CONTACT US",
    badgeCol: AMBER,
    tagline:  "White-label, custom feeds, SLA.",
    features: [
      "White-label embed",
      "Custom data feeds",
      "SLA and dedicated support",
      "Data licensing",
    ],
    ctaLabel:  "Contact Us",
    ctaHref:   "/contact",
    highlight: false,
  },
]

function TierCard({ tier }: { tier: Tier }) {
  return (
    <div style={{
      flex: "1 1 280px",
      maxWidth: 380,
      background: tier.highlight ? BG2 : BG1,
      border: `1px solid ${tier.highlight ? tier.badgeCol + "55" : BD1}`,
      borderRadius: 20,
      padding: "32px 28px",
      display: "flex",
      flexDirection: "column",
      boxShadow: tier.highlight ? `0 0 48px ${tier.badgeCol}18` : "none",
    }}>
      {/* Badge */}
      <div style={{ marginBottom: 16 }}>
        <span style={{
          fontFamily: MONO, fontSize: 11, fontWeight: 700,
          letterSpacing: "0.12em", color: tier.badgeCol,
          background: tier.badgeCol + "18",
          padding: "4px 10px", borderRadius: 6,
        }}>
          {tier.badge}
        </span>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 13, color: T4, letterSpacing: "0.1em", marginBottom: 8 }}>
        {tier.label}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 15, color: T3, marginBottom: 28, lineHeight: 1.5 }}>
        {tier.tagline}
      </div>

      <div style={{ flex: 1, marginBottom: 28 }}>
        {tier.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
            <span style={{ color: tier.badgeCol, fontFamily: MONO, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ fontFamily: SYS, fontSize: 14, color: T2, lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>

      <Link href={tier.ctaHref} style={{ display: "block" }}>
        <button style={{
          width: "100%", minHeight: 48,
          background: tier.highlight ? tier.badgeCol : "transparent",
          color: tier.highlight ? BG0 : tier.badgeCol,
          border: `1px solid ${tier.badgeCol}`,
          borderRadius: 12, fontFamily: MONO,
          fontSize: 13, fontWeight: 700,
          letterSpacing: "0.06em", cursor: "pointer",
        }}>
          {tier.ctaLabel} →
        </button>
      </Link>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS, paddingBottom: "env(safe-area-inset-bottom,20px)" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit;cursor:pointer;border:none}
        button:hover{opacity:0.85}
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: BG1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BD1}`,
        padding: "0 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", minHeight: 60,
        paddingTop: "env(safe-area-inset-top,0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 24, background: BD1 }} />
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em" }}>FREE ACCESS</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard">
            <button style={{ background: "transparent", color: T3, fontFamily: MONO, fontSize: 13, padding: "8px 16px", borderRadius: 10, border: `1px solid ${BD1}`, minHeight: 44 }}>DASHBOARD</button>
          </Link>
          <Link href="/contact">
            <button style={{ background: AMBER, color: BG0, fontFamily: MONO, fontSize: 13, fontWeight: 700, padding: "8px 20px", borderRadius: 10, letterSpacing: "0.06em", minHeight: 44 }}>ENTERPRISE →</button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 32px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GREEN + "18", border: `1px solid ${GREEN}44`, borderRadius: 20, padding: "6px 18px", marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: GREEN, letterSpacing: "0.08em" }}>FREE FOREVER</span>
          </div>

          <h1 style={{ fontFamily: SYS, fontSize: 56, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, color: T1, marginBottom: 20 }}>
            Free. Forever.<br />No credit card.
          </h1>

          <p style={{ fontFamily: SYS, fontSize: 19, color: T3, lineHeight: 1.65, maxWidth: 600, margin: "0 auto 0" }}>
            The FRED for the American construction economy. Every data point, every forecast,
            every signal — free.
          </p>
        </div>

        {/* Tier cards */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", marginBottom: 80 }}>
          {TIERS.map(t => <TierCard key={t.label} tier={t} />)}
        </div>

        {/* What's always included */}
        <div style={{ background: BG2, borderRadius: 20, padding: "44px 40px", border: `1px solid ${BD1}`, marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 28, textAlign: "center" }}>
            ALWAYS INCLUDED — NO PAYWALL
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: "AI Ensemble Forecast",  desc: "Holt-Winters + SARIMA + XGBoost" },
              { label: "50-State Activity Map",  desc: "HOT / GROWING / COOLING by state" },
              { label: "Materials Signals",      desc: "BUY / SELL / HOLD for 6 commodities" },
              { label: "Anomaly Detection",      desc: "Z-score alerts across 10+ series" },
              { label: "Weekly Intelligence Brief", desc: "AI-generated every Monday" },
              { label: "Federal Pipeline",       desc: "IIJA/IRA program execution tracker" },
            ].map(({ label, desc }) => (
              <div key={label} style={{ textAlign: "center", minWidth: 160, flex: "1 1 160px" }}>
                <div style={{ fontFamily: SYS, fontSize: 14, color: T1, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* API key section */}
        <div style={{ background: BG1, borderRadius: 20, padding: "40px", border: `1px solid ${BD1}`, marginBottom: 48 }}>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: "1 1 320px" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.1em", marginBottom: 12 }}>REST API</div>
              <h2 style={{ fontFamily: SYS, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: T1, marginBottom: 12 }}>
                Free API access.<br />1,000 requests/day.
              </h2>
              <p style={{ fontFamily: SYS, fontSize: 15, color: T3, lineHeight: 1.6 }}>
                Every data endpoint — forecasts, signals, observations, state maps — accessible
                via API key. Build your own tools on public construction data.
              </p>
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <div style={{ fontFamily: MONO, fontSize: 12, color: T4, marginBottom: 8 }}>EXAMPLE</div>
              <div style={{ background: BG0, borderRadius: 10, padding: "16px 20px", border: `1px solid ${BD2}`, fontFamily: MONO, fontSize: 13, color: GREEN, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                curl constructaiq.trade/api/forecast<br />
                <span style={{ color: T4 }}>  -H "X-API-Key: caiq_..."</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back links */}
        <div style={{ textAlign: "center", display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard" style={{ fontFamily: SYS, fontSize: 15, color: T4, textDecoration: "underline" }}>
            ← Open Dashboard
          </Link>
          <Link href="/" style={{ fontFamily: SYS, fontSize: 15, color: T4, textDecoration: "underline" }}>
            Back to Home
          </Link>
        </div>
      </div>

      <footer style={{ borderTop: `1px solid ${BD1}`, padding: "32px", textAlign: "center" }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ" style={{ height: 20, width: "auto", marginBottom: 12 }} />
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 6 }}>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
      </footer>
    </div>
  )
}
