"use client"
import Image from "next/image"
import Link from "next/link"
import { font, color } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

const AMBER = color.amber
const GREEN = color.green
const BG0   = color.bg0
const BG1   = color.bg1
const BG2   = color.bg2
const BD1   = color.bd1
const BD2   = color.bd2
const T1    = color.t1
const T2    = color.t2
const T3    = color.t3
const T4    = color.t4

interface Plan {
  tier:      string
  tagline:   string
  price:     string
  priceSub:  string
  highlight: boolean
  badge?:    string
  outcomes:  string[]
  forWho:    string
  ctaLabel:  string
  ctaHref:   string
}

const PLANS: Plan[] = [
  {
    tier:     "INTELLIGENCE",
    tagline:  "Everything you need to get started",
    price:    "$490",
    priceSub: "per month",
    highlight: false,
    outcomes: [
      "12-month AI construction sector forecast — model-grade accuracy",
      "Daily signals across permits, spending, employment, and materials",
      "50-state construction activity map — HOT / GROWING / COOLING",
      "Materials BUY/SELL/HOLD signals: lumber, steel, concrete, copper, WTI, diesel",
      "Weekly Market Intelligence Brief — every Monday",
      "Full dashboard access — no technical setup required",
      "CSV export for internal reporting and analysis",
    ],
    forWho:   "For individual analysts, project developers, and portfolio managers who need a daily edge.",
    ctaLabel: "Get Started",
    ctaHref:  "/contact",
  },
  {
    tier:      "INSTITUTIONAL",
    tagline:   "For teams that move markets",
    price:     "$1,490",
    priceSub:  "per month",
    highlight: true,
    badge:     "MOST POPULAR",
    outcomes: [
      "Everything in Intelligence, plus:",
      "Quarterly construction sector outlook — full PDF report",
      "Historical data archive back to 2000",
      "Up to 5 named user seats for your team",
      "Priority analyst support — response within 4 business hours",
      "Scheduled data delivery for internal BI tools",
      "Suitable for embedding in proprietary dashboards",
    ],
    forWho:   "For banks, investment firms, government agencies, and developer groups that run on data.",
    ctaLabel: "Get Institutional Access",
    ctaHref:  "/contact",
  },
  {
    tier:     "ENTERPRISE",
    tagline:  "White-glove intelligence at scale",
    price:    "Custom",
    priceSub: "contact us",
    highlight: false,
    outcomes: [
      "Everything in Institutional, plus:",
      "Unlimited user seats",
      "Dedicated account manager",
      "99.9% uptime SLA with documentation for procurement",
      "Custom integrations — Bloomberg, Salesforce, or any BI platform",
      "Executive briefings and on-site presentations",
      "Co-branded research deliverables",
    ],
    forWho:   "For federal agencies, large banks, REITs, and enterprise construction groups.",
    ctaLabel: "Talk to Sales",
    ctaHref:  "/contact",
  },
]

function PricingCard({ plan }: { plan: Plan }) {
  const borderColor = plan.highlight ? AMBER : BD1
  const bg = plan.highlight ? "#1a1200" : BG2

  return (
    <div style={{
      background: bg,
      borderRadius: 20,
      border: `1px solid ${borderColor}`,
      padding: "36px 28px",
      flex: 1,
      minWidth: 280,
      maxWidth: 380,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      boxShadow: plan.highlight ? `0 0 40px ${AMBER}22` : "none",
    }}>
      {plan.badge && (
        <div style={{
          position: "absolute",
          top: -14,
          left: "50%",
          transform: "translateX(-50%)",
          background: AMBER,
          color: "#000",
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          padding: "4px 14px",
          borderRadius: 20,
          whiteSpace: "nowrap",
        }}>
          {plan.badge}
        </div>
      )}

      <div style={{ fontFamily: MONO, fontSize: 13, color: plan.highlight ? AMBER : T4, letterSpacing: "0.12em", marginBottom: 8 }}>
        {plan.tier}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 15, color: T3, marginBottom: 20, lineHeight: 1.5 }}>{plan.tagline}</div>

      <div style={{ marginBottom: 24 }}>
        <span style={{ fontFamily: SYS, fontSize: 48, fontWeight: 700, color: T1, letterSpacing: "-0.02em" }}>{plan.price}</span>
        {plan.price !== "Custom" && (
          <span style={{ fontFamily: SYS, fontSize: 16, color: T4, marginLeft: 6 }}>/mo</span>
        )}
        {plan.price === "Custom" && (
          <div style={{ fontFamily: SYS, fontSize: 14, color: T4, marginTop: 4 }}>Pricing based on your needs</div>
        )}
      </div>

      <div style={{ flex: 1, marginBottom: 24 }}>
        {plan.outcomes.map((o, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 13, color: GREEN, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ fontFamily: SYS, fontSize: 14, color: i === 0 && plan.tier !== "INTELLIGENCE" ? T4 : T2, lineHeight: 1.5, fontStyle: i === 0 && plan.tier !== "INTELLIGENCE" ? "italic" : "normal" }}>{o}</span>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: "12px 16px", background: BG1, borderRadius: 10, border: `1px solid ${BD2}` }}>
          <span style={{ fontFamily: SYS, fontSize: 13, color: T3 }}>{plan.forWho}</span>
        </div>
      </div>

      <Link href={plan.ctaHref} style={{ display: "block" }}>
        <button style={{
          width: "100%",
          background: plan.highlight ? AMBER : "transparent",
          color: plan.highlight ? "#000" : AMBER,
          fontFamily: MONO,
          fontSize: 14,
          fontWeight: 700,
          padding: "14px 24px",
          borderRadius: 12,
          letterSpacing: "0.06em",
          minHeight: 50,
          border: plan.highlight ? "none" : `1px solid ${AMBER}`,
          cursor: "pointer",
        }}>
          {plan.ctaLabel} →
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
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* NAV */}
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
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em" }}>PRICING</div>
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

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "72px 32px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: BG2, border: `1px solid ${AMBER}44`, borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: AMBER }}>▲ Simple Pricing</span>
            <span style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>No setup fees · Cancel anytime</span>
          </div>

          <h1 style={{ fontFamily: SYS, fontSize: 48, fontWeight: 700, lineHeight: 1.1, color: T1, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Intelligence that pays for itself<br />
            <span style={{ color: AMBER }}>on the first insight</span>
          </h1>

          <p style={{ fontFamily: SYS, fontSize: 18, color: T3, lineHeight: 1.6, maxWidth: 560, margin: "0 auto" }}>
            One missed market signal costs more than a year of ConstructAIQ. Choose the tier that fits your team.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", marginBottom: 72, alignItems: "stretch" }}>
          {PLANS.map(plan => <PricingCard key={plan.tier} plan={plan} />)}
        </div>

        {/* What every plan delivers */}
        <div style={{ background: BG2, borderRadius: 20, padding: "40px", border: `1px solid ${BD1}`, marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 24, textAlign: "center" }}>EVERY PLAN DELIVERS</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { icon: "📊", label: "Daily Sector Signals",  desc: "Know before the market moves" },
              { icon: "🤖", label: "AI 12-Month Forecasts", desc: "Ensemble of 3 proven models" },
              { icon: "🗺",  label: "All 50 States",        desc: "HOT / GROWING / COOLING map" },
              { icon: "💹", label: "Materials Intelligence", desc: "BUY / SELL / HOLD signals" },
              { icon: "📄", label: "Research Reports",       desc: "Monthly + quarterly outlooks" },
              { icon: "📥", label: "Export Your Data",       desc: "CSV for your own analysis" },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ textAlign: "center", minWidth: 140, flex: "1 1 140px" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontFamily: SYS, fontSize: 14, color: T1, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ background: BG1, borderRadius: 20, padding: "40px", border: `1px solid ${BD1}`, marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 28, textAlign: "center" }}>COMMON QUESTIONS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720, margin: "0 auto" }}>
            {[
              { q: "Do I need a technical background to use this?", a: "No. The dashboard requires no technical knowledge — it reads like a Bloomberg screen, not a developer tool. If you can read a market briefing, you can use ConstructAIQ." },
              { q: "Is there a free trial?", a: "Yes — the full live dashboard is accessible without any account or payment. See real signals and forecasts before you commit to a plan." },
              { q: "How quickly can we get access?", a: "Contact us and we typically activate accounts within one business day. Enterprise and government contracts can be structured for procurement within 2–5 business days." },
              { q: "How is this different from Bloomberg or FactSet?", a: "Bloomberg covers construction as a footnote. We cover it as the whole story — 16 government data sources, AI forecasting, and 50-state granularity that no terminal provides." },
            ].map(({ q, a }) => (
              <div key={q}>
                <div style={{ fontFamily: SYS, fontSize: 16, color: T1, fontWeight: 600, marginBottom: 8 }}>{q}</div>
                <div style={{ fontFamily: SYS, fontSize: 15, color: T3, lineHeight: 1.6 }}>{a}</div>
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

      <footer style={{ borderTop: `1px solid ${BD1}`, padding: "32px", textAlign: "center" }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ" style={{ height: 20, width: "auto", marginBottom: 12 }} />
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 6 }}>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
      </footer>
    </div>
  )
}
