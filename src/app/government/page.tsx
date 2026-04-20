"use client"
import Image from "next/image"
import Link from "next/link"
import { font, color } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

const AMBER    = color.amber
const GREEN    = color.green
const BG0      = color.bg0
const BG1      = color.bg1
const BG2      = color.bg2
const BD1      = color.bd1
const BD2      = color.bd2
const T1       = color.t1
const T2       = color.t2
const T3       = color.t3
const T4       = color.t4

const USE_CASES = [
  {
    icon: "🛣",
    title: "DOT / FHWA",
    desc: "Track highway and transit construction spending velocity across all 50 states",
  },
  {
    icon: "⚒",
    title: "Army Corps of Engineers",
    desc: "Monitor construction labor and materials markets for cost estimation",
  },
  {
    icon: "🏠",
    title: "HUD",
    desc: "State-level residential construction and permit trend analysis",
  },
  {
    icon: "📊",
    title: "OMB",
    desc: "Construction sector contribution to GDP forecasting",
  },
  {
    icon: "📋",
    title: "CBO",
    desc: "Sector outlook for budget scoring and economic projection",
  },
  {
    icon: "🗺",
    title: "State DOTs",
    desc: "Regional construction market intelligence for project planning",
  },
]

const TRANSPARENCY_FACTS = [
  { label: "Data Sources",      value: "All U.S. government open data" },
  { label: "Hosting",           value: "Vercel Edge Network (US)" },
  { label: "Data Refresh",      value: "Every 4 hours" },
  { label: "PII Policy",        value: "No PII collected beyond account email" },
  { label: "Historical Depth",  value: "Back to 2000" },
  { label: "Uptime SLA",        value: "99.9% (Enterprise)" },
]

const STATE_PROCUREMENT = [
  { state: "Texas",      system: "SmartBuy" },
  { state: "Florida",    system: "MyFloridaMarketPlace" },
  { state: "California", system: "Cal eProcure" },
  { state: "New York",   system: "NY Contract Reporter" },
  { state: "Arizona",    system: "ProcureAZ" },
]

export default function GovernmentPage() {
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
        justifyContent: "space-between", height: 60,
        paddingTop: "env(safe-area-inset-top,0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 24, background: BD1 }} />
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.1em" }}>GOVERNMENT</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[
            { label: "Intelligence", href: "/dashboard" },
            { label: "Research",     href: "/research" },
            { label: "Pricing",      href: "/pricing" },
            { label: "About",        href: "/about" },
            { label: "Contact",      href: "/contact" },
          ].map(({ label, href }) => (
            <Link key={label} href={href}>
              <button style={{ background: "transparent", color: T3, fontFamily: SYS, fontSize: 14, padding: "8px 12px", borderRadius: 8, border: "none", minHeight: 44 }}>
                {label}
              </button>
            </Link>
          ))}
          <Link href="/dashboard">
            <button style={{ background: AMBER, color: "#000", fontFamily: MONO, fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 10, letterSpacing: "0.06em", minHeight: 44 }}>
              DASHBOARD →
            </button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 32px 80px" }}>

        {/* ── HERO ── */}
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: BG2, border: `1px solid ${AMBER}44`,
            borderRadius: 20, padding: "6px 18px", marginBottom: 28,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: AMBER, letterSpacing: "0.08em" }}>
              🏛 FEDERAL &amp; STATE PROCUREMENT
            </span>
          </div>

          <h1 style={{
            fontFamily: SYS, fontSize: 52, fontWeight: 700,
            lineHeight: 1.1, color: T1, marginBottom: 20,
            letterSpacing: "-0.02em",
          }}>
            ConstructAIQ for<br />
            <span style={{ color: AMBER }}>Federal Government</span>
          </h1>

          <p style={{
            fontFamily: SYS, fontSize: 18, color: T3,
            lineHeight: 1.7, maxWidth: 680, margin: "0 auto 40px",
          }}>
            Federal economists, infrastructure analysts, and policy researchers use ConstructAIQ to track IIJA execution, monitor construction sector health, and forecast spending trends across all 50 states.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/api/capabilities-statement.pdf" download>
              <button style={{
                background: AMBER, color: "#000",
                fontFamily: MONO, fontSize: 14, fontWeight: 700,
                padding: "14px 28px", borderRadius: 12,
                letterSpacing: "0.06em", minHeight: 50,
              }}>
                Download Capabilities Statement →
              </button>
            </a>
            <Link href="/contact">
              <button style={{
                background: "transparent", color: AMBER,
                fontFamily: MONO, fontSize: 14, fontWeight: 700,
                padding: "14px 28px", borderRadius: 12,
                letterSpacing: "0.06em", minHeight: 50,
                border: `1px solid ${AMBER}`,
              }}>
                Contact Government Sales →
              </button>
            </Link>
          </div>
        </div>

        {/* ── USE CASES ── */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.12em", marginBottom: 8 }}>
            USE CASES
          </div>
          <h2 style={{ fontFamily: SYS, fontSize: 32, fontWeight: 700, color: T1, marginBottom: 32, letterSpacing: "-0.01em" }}>
            Built for Federal Agencies
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
            {USE_CASES.map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: BG1, border: `1px solid ${BD1}`,
                borderRadius: 16, padding: "24px",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: AMBER, letterSpacing: "0.1em", marginBottom: 8 }}>
                  {title.toUpperCase()}
                </div>
                <div style={{ fontFamily: SYS, fontSize: 15, color: T3, lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PROCUREMENT INFORMATION ── */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.12em", marginBottom: 8 }}>
            PROCUREMENT
          </div>
          <h2 style={{ fontFamily: SYS, fontSize: 32, fontWeight: 700, color: T1, marginBottom: 28, letterSpacing: "-0.01em" }}>
            Procurement Information
          </h2>
          <div style={{
            background: BG1, border: `1px solid ${BD1}`,
            borderRadius: 20, padding: "40px",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 36 }}>
              {[
                { label: "SAM.gov UEI",    value: "[Registration in progress — Q2 2026]" },
                { label: "NAICS Code",     value: "518210 (Primary) | 541511 | 541690" },
                { label: "GSA Schedule",   value: "MAS IT Category — Application in progress" },
              ].map(({ label, value }, i) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center",
                  padding: "18px 0",
                  borderBottom: i < 2 ? `1px solid ${BD1}` : "none",
                  gap: 16, flexWrap: "wrap",
                }}>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: T4, letterSpacing: "0.08em", minWidth: 160 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: SYS, fontSize: 15, color: T2 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a href="/api/capabilities-statement.pdf" download>
                <button style={{
                  background: AMBER, color: "#000",
                  fontFamily: MONO, fontSize: 13, fontWeight: 700,
                  padding: "12px 22px", borderRadius: 10,
                  letterSpacing: "0.05em", minHeight: 46,
                }}>
                  Download Capabilities Statement PDF →
                </button>
              </a>
              <Link href="/contact">
                <button style={{
                  background: "transparent", color: AMBER,
                  fontFamily: MONO, fontSize: 13, fontWeight: 700,
                  padding: "12px 22px", borderRadius: 10,
                  letterSpacing: "0.05em", minHeight: 46,
                  border: `1px solid ${AMBER}`,
                }}>
                  Contact Government Sales →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── SECURITY & COMPLIANCE ── */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.12em", marginBottom: 8 }}>
            PLATFORM TRANSPARENCY
          </div>
          <h2 style={{ fontFamily: SYS, fontSize: 32, fontWeight: 700, color: T1, marginBottom: 28, letterSpacing: "-0.01em" }}>
            Security &amp; Compliance
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {TRANSPARENCY_FACTS.map(({ label, value }) => (
              <div key={label} style={{
                background: BG1, border: `1px solid ${BD1}`,
                borderRadius: 12, padding: "22px",
              }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.1em", marginBottom: 8 }}>
                  {label.toUpperCase()}
                </div>
                <div style={{ fontFamily: SYS, fontSize: 17, fontWeight: 600, color: T1 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STATE PROCUREMENT ── */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.12em", marginBottom: 8 }}>
            STATE ACCESS
          </div>
          <h2 style={{ fontFamily: SYS, fontSize: 32, fontWeight: 700, color: T1, marginBottom: 28, letterSpacing: "-0.01em" }}>
            State Government Access
          </h2>
          <div style={{
            background: BG1, border: `1px solid ${BD1}`,
            borderRadius: 20, overflow: "hidden",
          }}>
            {STATE_PROCUREMENT.map(({ state, system }, i) => (
              <div key={state} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 28px",
                borderBottom: i < STATE_PROCUREMENT.length - 1 ? `1px solid ${BD1}` : "none",
                flexWrap: "wrap", gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: T1 }}>{state}</div>
                  <div style={{
                    fontFamily: MONO, fontSize: 11, color: T4,
                    background: BG2, border: `1px solid ${BD2}`,
                    borderRadius: 6, padding: "3px 10px", letterSpacing: "0.06em",
                  }}>
                    {system}
                  </div>
                </div>
                <div style={{
                  fontFamily: MONO, fontSize: 11, color: color.blue,
                  background: color.blueDim, border: `1px solid ${color.blue}44`,
                  borderRadius: 6, padding: "4px 12px", letterSpacing: "0.06em",
                }}>
                  Vendor registration in progress
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER CTA ── */}
        <div style={{
          textAlign: "center", padding: "56px 40px",
          background: "linear-gradient(135deg,#1a1200 0%,#0d0d0d 100%)",
          borderRadius: 24, border: `1px solid ${AMBER}33`,
          marginBottom: 24,
        }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.12em", marginBottom: 16 }}>
            GET IN TOUCH
          </div>
          <div style={{ fontFamily: SYS, fontSize: 24, fontWeight: 700, color: T1, marginBottom: 12 }}>
            Questions about government procurement?
          </div>
          <a href="mailto:procurement@constructaiq.trade" style={{
            fontFamily: MONO, fontSize: 15, color: AMBER,
            letterSpacing: "0.04em", fontWeight: 700,
          }}>
            procurement@constructaiq.trade →
          </a>
        </div>

        {/* Back links */}
        <div style={{ textAlign: "center" }}>
          <Link href="/dashboard" style={{ fontFamily: SYS, fontSize: 15, color: T4, textDecoration: "underline" }}>
            ← Back to Dashboard
          </Link>
          <span style={{ fontFamily: SYS, fontSize: 15, color: T4, margin: "0 16px" }}>·</span>
          <Link href="/pricing" style={{ fontFamily: SYS, fontSize: 15, color: T4, textDecoration: "underline" }}>
            View Pricing
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${BD1}`, padding: "32px", textAlign: "center" }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ" style={{ height: 20, width: "auto", marginBottom: 16 }} />
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: "Intelligence", href: "/dashboard" },
            { label: "Research",     href: "/research" },
            { label: "Pricing",      href: "/pricing" },
            { label: "About",        href: "/about" },
            { label: "Contact",      href: "/contact" },
          ].map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>{label}</Link>
          ))}
        </div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>Construction Intelligence Platform · constructaiq.trade</div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 6 }}>Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov</div>
      </footer>
    </div>
  )
}
