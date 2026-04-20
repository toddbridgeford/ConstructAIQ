"use client"
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

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  name: string
  price: string
  priceSub: string
  rpm: string
  rpd: string
  highlight: boolean
  badge?: string
  features: PlanFeature[]
  ctaLabel: string
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "$490",
    priceSub: "per month",
    rpm: "60 req/min",
    rpd: "1,000 req/day",
    highlight: false,
    features: [
      { text: "All API endpoints (census, bls, rates, signals, news, map, pricewatch, forecast)", included: true },
      { text: "12-month AI ensemble forecast (HW + SARIMA + XGBoost)", included: true },
      { text: "Real-time market signals", included: true },
      { text: "CSV data export", included: true },
      { text: "Dashboard access", included: true },
      { text: "Up to 60 req/min, 1,000 req/day", included: true },
      { text: "Priority support", included: false },
      { text: "Dedicated support + SLA", included: false },
      { text: "Custom rate limits", included: false },
    ],
    ctaLabel: "Get Starter Key",
  },
  {
    name: "Professional",
    price: "$1,490",
    priceSub: "per month",
    rpm: "300 req/min",
    rpd: "10,000 req/day",
    highlight: true,
    badge: "MOST POPULAR",
    features: [
      { text: "All API endpoints (census, bls, rates, signals, news, map, pricewatch, forecast)", included: true },
      { text: "12-month AI ensemble forecast (HW + SARIMA + XGBoost)", included: true },
      { text: "Real-time market signals", included: true },
      { text: "CSV data export", included: true },
      { text: "Dashboard access", included: true },
      { text: "Up to 300 req/min, 10,000 req/day", included: true },
      { text: "Priority support", included: true },
      { text: "Dedicated support + SLA", included: false },
      { text: "Custom rate limits", included: false },
    ],
    ctaLabel: "Get Pro Key",
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceSub: "contact us",
    rpm: "1,000+ req/min",
    rpd: "100,000+ req/day",
    highlight: false,
    features: [
      { text: "All API endpoints (census, bls, rates, signals, news, map, pricewatch, forecast)", included: true },
      { text: "12-month AI ensemble forecast (HW + SARIMA + XGBoost)", included: true },
      { text: "Real-time market signals", included: true },
      { text: "CSV data export", included: true },
      { text: "Dashboard access", included: true },
      { text: "Custom rate limits", included: true },
      { text: "Priority support", included: true },
      { text: "Dedicated support + SLA", included: true },
      { text: "Custom integrations", included: true },
    ],
    ctaLabel: "Contact Sales",
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
      gap: 0,
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

      {/* Plan name */}
      <div style={{ fontFamily: MONO, fontSize: 13, color: plan.highlight ? AMBER : T4, letterSpacing: "0.12em", marginBottom: 12 }}>
        {plan.name.toUpperCase()}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontFamily: SYS, fontSize: 48, fontWeight: 700, color: T1, letterSpacing: "-0.02em" }}>{plan.price}</span>
        {plan.price !== "Custom" && (
          <span style={{ fontFamily: SYS, fontSize: 16, color: T4, marginLeft: 6 }}>/mo</span>
        )}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 14, color: T4, marginBottom: 24 }}>{plan.priceSub}</div>

      {/* Rate limits */}
      <div style={{ background: BG1, borderRadius: 12, padding: "14px 16px", marginBottom: 28, border: `1px solid ${BD2}` }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 10 }}>RATE LIMITS</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: SYS, fontSize: 14, color: T3 }}>Per minute</span>
          <span style={{ fontFamily: MONO, fontSize: 14, color: AMBER, fontWeight: 700 }}>{plan.rpm}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: SYS, fontSize: 14, color: T3 }}>Per day</span>
          <span style={{ fontFamily: MONO, fontSize: 14, color: AMBER, fontWeight: 700 }}>{plan.rpd}</span>
        </div>
      </div>

      {/* Features */}
      <div style={{ flex: 1, marginBottom: 28 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <span style={{
              fontFamily: MONO,
              fontSize: 13,
              color: f.included ? GREEN : T4,
              flexShrink: 0,
              marginTop: 1,
            }}>
              {f.included ? "✓" : "✗"}
            </span>
            <span style={{ fontFamily: SYS, fontSize: 14, color: f.included ? T2 : T4, lineHeight: 1.5 }}>
              {f.text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <a href="/api/keys/issue" style={{ display: "block" }}>
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
          transition: "opacity 0.15s",
        }}>
          {plan.ctaLabel} →
        </button>
      </a>
    </div>
  )
}

export default function PricingPage() {
  const curlExample = `curl -X POST https://constructaiq.trade/api/keys/issue \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","plan":"starter"}'`

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
            <img
              src="https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg"
              style={{ height: 24 }} alt="ConstructAIQ"
            />
          </Link>
          <div style={{ width: 1, height: 24, background: BD1 }} />
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em" }}>PRICING</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard">
            <button style={{ background: "transparent", color: T3, fontFamily: MONO, fontSize: 13, padding: "8px 16px", borderRadius: 10, border: `1px solid ${BD1}`, minHeight: 44 }}>DASHBOARD</button>
          </Link>
          <a href="/api/keys/issue">
            <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 13, fontWeight: 700, padding: "8px 20px", borderRadius: 10, letterSpacing: "0.06em", minHeight: 44 }}>GET API KEY →</button>
          </a>
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
            Construction Intelligence,<br />
            <span style={{ color: AMBER }}>At Every Scale</span>
          </h1>

          <p style={{ fontFamily: SYS, fontSize: 18, color: T3, lineHeight: 1.6, maxWidth: 540, margin: "0 auto" }}>
            API access to real-time construction data, AI forecasts, and market signals. Choose the plan that fits your workflow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", marginBottom: 72, alignItems: "stretch" }}>
          {PLANS.map(plan => <PricingCard key={plan.name} plan={plan} />)}
        </div>

        {/* API Key CTA / curl example */}
        <div style={{ background: BG1, borderRadius: 24, padding: "48px 40px", border: `1px solid ${BD1}`, marginBottom: 48 }}>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.12em", marginBottom: 12 }}>GET YOUR API KEY</div>
              <div style={{ fontFamily: SYS, fontSize: 24, fontWeight: 700, color: T1, marginBottom: 10 }}>Start building in seconds</div>
              <div style={{ fontFamily: SYS, fontSize: 15, color: T3, lineHeight: 1.6, marginBottom: 24 }}>
                Issue an API key instantly. Keys are scoped to your plan&apos;s rate limits and activate immediately.
              </div>
              <a href="/api/keys/issue">
                <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 14, fontWeight: 700, padding: "14px 28px", borderRadius: 12, letterSpacing: "0.06em", minHeight: 50 }}>
                  Issue API Key →
                </button>
              </a>
            </div>
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 10 }}>EXAMPLE REQUEST</div>
              <div style={{ background: "#0a0a0a", borderRadius: 12, padding: "20px 24px", border: `1px solid ${BD2}`, overflowX: "auto" }}>
                <pre style={{ fontFamily: MONO, fontSize: 13, color: GREEN, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {curlExample}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Feature comparison note */}
        <div style={{ background: BG2, borderRadius: 16, padding: "28px 32px", border: `1px solid ${BD1}`, marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em", marginBottom: 20, textAlign: "center" }}>ALL PLANS INCLUDE</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              "Census Bureau data",
              "BLS employment data",
              "FRED rates & indicators",
              "Housing starts + permits",
              "AI ensemble forecasts",
              "Market signals",
              "State-level map data",
              "Materials pricewatch",
              "News intelligence",
              "CSV export",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: GREEN }}>✓</span>
                <span style={{ fontFamily: SYS, fontSize: 14, color: T3 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back to dashboard link */}
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
        <img
          src="https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg"
          style={{ height: 20, marginBottom: 12 }} alt="ConstructAIQ"
        />
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 6 }}>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
      </footer>
    </div>
  )
}
