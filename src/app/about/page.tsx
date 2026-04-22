"use client"
import Image from "next/image"
import Link from "next/link"
import { Radio, Brain, Map, BarChart2, Building2, TrendingUp, type LucideIcon } from 'lucide-react'
import { font, color } from '@/lib/theme'
import { Nav } from '@/app/components/Nav'

const SYS  = font.sys
const MONO = font.mono
const AMBER = color.amber
const GREEN = color.green
const RED   = color.red
const BLUE  = color.blue
const BG0   = color.bg0
const BG1   = color.bg1
const BG2   = color.bg2
const BG3   = color.bg3
const BD1   = color.bd1
const BD2   = color.bd2
const T1    = color.t1
const T2    = color.t2
const T3    = color.t3
const T4    = color.t4

interface CapabilityCard {
  icon: LucideIcon
  title: string
  desc: string
}

interface DataSource {
  name: string
  desc: string
}

const CAPABILITIES: CapabilityCard[] = [
  {
    icon: Radio,
    title: "Signal Intelligence",
    desc: "Z-score anomaly detection, trend reversals, divergence signals across 38+ government data series.",
  },
  {
    icon: Brain,
    title: "3-Model AI Ensemble",
    desc: "Holt-Winters + SARIMA + XGBoost accuracy-weighted ensemble. 12-month forecasts with 80% and 95% confidence intervals.",
  },
  {
    icon: Map,
    title: "50-State Coverage",
    desc: "State-level construction activity, permit trends, and regional GDP. HOT / GROWING / COOLING classification by state.",
  },
  {
    icon: TrendingUp,
    title: "Materials Intelligence",
    desc: "Real-time BUY/SELL/HOLD signals for lumber, steel, concrete, copper, WTI crude, and diesel.",
  },
  {
    icon: Building2,
    title: "Proprietary GC Survey",
    desc: "Quarterly survey of general contractors across the US. Backlog, bid volume, subcontractor capacity, and labor availability — data you can't get from any government source.",
  },
  {
    icon: BarChart2,
    title: "Sentinel-2 Satellite Intelligence",
    desc: "Ground activity signals derived from Sentinel-2 satellite imagery. Construction site activity verification independent of self-reported data.",
  },
]

const DATA_SOURCES: DataSource[] = [
  {
    name: "Census Bureau",
    desc: "Monthly construction spending across residential, commercial, and public segments.",
  },
  {
    name: "Bureau of Labor Statistics",
    desc: "Construction employment, wages, and JOLTS job openings data.",
  },
  {
    name: "FRED / St. Louis Fed",
    desc: "30+ macroeconomic indicators: rates, housing starts, permits, PPI.",
  },
  {
    name: "Bureau of Economic Analysis",
    desc: "State-level GDP contributions from construction sector.",
  },
  {
    name: "EIA",
    desc: "Energy input costs directly impacting construction materials and operations.",
  },
  {
    name: "USASpending.gov",
    desc: "Federal contract award data — tracking IIJA and infrastructure spending.",
  },
  {
    name: "ENR",
    desc: "Engineering News-Record industry analysis and contract intelligence.",
  },
  {
    name: "Construction Dive",
    desc: "Real-time news and sentiment signals from the trades.",
  },
  {
    name: "NAHB",
    desc: "Housing market conditions, builder confidence, and residential pipeline.",
  },
  {
    name: "AGC",
    desc: "Associated General Contractors labor market data and industry trends.",
  },
]

function CapCard({ card }: { card: CapabilityCard }) {
  const Icon = card.icon
  return (
    <div style={{
      background: BG2,
      border: `1px solid ${BD1}`,
      borderRadius: 16,
      padding: "28px 24px",
      flex: "1 1 calc(50% - 12px)",
      minWidth: 260,
    }}>
      <div style={{ marginBottom: 14 }}>
        <Icon size={22} color={AMBER} />
      </div>
      <div style={{ fontFamily: SYS, fontSize: 17, fontWeight: 600, color: T1, marginBottom: 10 }}>
        {card.title}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 15, color: T3, lineHeight: 1.65 }}>
        {card.desc}
      </div>
    </div>
  )
}

function SourceCard({ source }: { source: DataSource }) {
  return (
    <div style={{
      background: BG1,
      border: `1px solid ${BD1}`,
      borderRadius: 10,
      padding: "14px 18px",
      flex: "1 1 calc(33.33% - 16px)",
      minWidth: 240,
    }}>
      <div style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: T2, marginBottom: 6 }}>
        {source.name}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 13, color: T3, lineHeight: 1.55 }}>
        {source.desc}
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: SYS, paddingBottom: "env(safe-area-inset-bottom,20px)" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit;cursor:pointer;border:none}
      `}</style>

      <Nav />

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "72px 32px 80px" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: BG2, border: `1px solid ${AMBER}44`,
            borderRadius: 20, padding: "6px 16px", marginBottom: 28,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: AMBER }}>▲ Our Mission</span>
          </div>

          <h1 style={{
            fontFamily: SYS, fontSize: 52, fontWeight: 700,
            lineHeight: 1.1, color: T1, marginBottom: 20,
            letterSpacing: "-0.02em",
          }}>
            Built for the People<br />
            <span style={{ color: AMBER }}>Who Move Capital</span>
          </h1>

          <p style={{
            fontFamily: SYS, fontSize: 18, color: T3,
            lineHeight: 1.7, maxWidth: 600, margin: "0 auto",
          }}>
            ConstructAIQ is the free construction intelligence platform. 38+ live data sources. 12-month AI ensemble forecast. Proprietary GC survey. Satellite ground signal intelligence. Given freely to the industry.
          </p>
        </div>

        {/* SECTION 1 — MISSION STATEMENT */}
        <div style={{
          background: BG1, border: `1px solid ${BD1}`,
          borderRadius: 20, padding: "40px",
          marginBottom: 56,
        }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.12em", marginBottom: 20 }}>
            MISSION STATEMENT
          </div>
          <p style={{
            fontFamily: SYS, fontSize: 17, color: T2,
            lineHeight: 1.8, maxWidth: 780,
          }}>
            ConstructAIQ is the free construction intelligence platform. 38+ live data sources. 12-month AI ensemble forecast. Proprietary GC survey. Satellite ground signal intelligence. Given freely to the industry.
          </p>
        </div>

        {/* SECTION 2 — THE PLATFORM */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.12em", marginBottom: 8 }}>
            THE PLATFORM
          </div>
          <h2 style={{ fontFamily: SYS, fontSize: 28, fontWeight: 700, color: T1, marginBottom: 28, letterSpacing: "-0.01em" }}>
            Six Pillars of Construction Intelligence
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            {CAPABILITIES.map((card) => (
              <CapCard key={card.title} card={card} />
            ))}
          </div>
        </div>

        {/* SECTION 3 — THE TEAM */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.12em", marginBottom: 8 }}>
            THE TEAM
          </div>
          <h2 style={{ fontFamily: SYS, fontSize: 28, fontWeight: 700, color: T1, marginBottom: 28, letterSpacing: "-0.01em" }}>
            Built by Industry Insiders
          </h2>
          <div style={{
            background: BG1, border: `1px solid ${BD1}`,
            borderRadius: 20, padding: "36px 40px",
            display: "flex", alignItems: "flex-start", gap: 28,
            flexWrap: "wrap",
          }}>
            {/* Avatar placeholder */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: BG2, border: `1px solid ${BD1}`,
              flexShrink: 0, display: "flex", alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontFamily: SYS, fontSize: 28, color: T4, userSelect: "none" }}>C</span>
            </div>

            {/* Bio */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ fontFamily: SYS, fontSize: 20, fontWeight: 700, color: T1 }}>
                  ConstructAIQ Team
                </div>
                <div style={{
                  fontFamily: MONO, fontSize: 11, color: AMBER,
                  background: "#3d280022", border: `1px solid ${AMBER}44`,
                  borderRadius: 6, padding: "3px 10px", letterSpacing: "0.08em",
                }}>
                  FOUNDER &amp; CEO
                </div>
              </div>
              <p style={{
                fontFamily: SYS, fontSize: 15, color: T3, lineHeight: 1.7,
                maxWidth: 640,
              }}>
                Construction industry veteran turned data entrepreneur. Built ConstructAIQ to bring institutional-grade intelligence to the sector that moves 13% of US GDP — and gave it away for free.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4 — DATA SOURCES */}
        <div style={{ marginBottom: 64 }}>
          <div style={{
            background: BG2, border: `1px solid ${BD1}`,
            borderRadius: 20, padding: "36px 36px 40px",
          }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.12em", marginBottom: 28, textAlign: "center" }}>
              OUR DATA SOURCES
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "flex-start" }}>
              {DATA_SOURCES.map((source) => (
                <SourceCard key={source.name} source={source} />
              ))}
            </div>
            <div style={{
              marginTop: 28, paddingTop: 24,
              borderTop: `1px solid ${BD1}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <span style={{ fontFamily: MONO, fontSize: 12, color: GREEN }}>✓</span>
              <span style={{ fontFamily: SYS, fontSize: 14, color: T3 }}>
                All sources are official government or recognised industry publishers. Data refreshed every 4 hours.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 5 — PLATFORM TRANSPARENCY */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T4, letterSpacing: "0.12em", marginBottom: 8 }}>
            PLATFORM TRANSPARENCY
          </div>
          <h2 style={{ fontFamily: SYS, fontSize: 28, fontWeight: 700, color: T1, marginBottom: 28, letterSpacing: "-0.01em" }}>
            What Procurement Teams Need to Know
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {[
              { label: "Data Refresh", value: "Every 4 hours", note: "Core series updated at 06:00, 10:00, 14:00, 18:00 ET daily" },
              { label: "Historical Depth", value: "Back to 2000", note: "Full 25-year archive available via the free API" },
              { label: "Data Sources", value: "38+ official sources", note: "All U.S. government and recognized industry publishers — no scraped or unverified data" },
              { label: "Forecast Model", value: "3-model ensemble", note: "Holt-Winters + SARIMA + XGBoost, accuracy-weighted, 12-month horizon" },
              { label: "Uptime SLA", value: "99.9% — Enterprise", note: "SLA documentation available for procurement review upon request" },
              { label: "Data Privacy", value: "No resale", note: "User data and usage patterns are never shared with or sold to third parties" },
            ].map(({ label, value, note }) => (
              <div key={label} style={{
                flex: "1 1 calc(33% - 12px)", minWidth: 240,
                background: BG1, border: `1px solid ${BD1}`,
                borderRadius: 12, padding: "20px 22px",
              }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: T4, letterSpacing: "0.08em", marginBottom: 6 }}>{label.toUpperCase()}</div>
                <div style={{ fontFamily: SYS, fontSize: 18, fontWeight: 700, color: T1, marginBottom: 6 }}>{value}</div>
                <div style={{ fontFamily: SYS, fontSize: 13, color: T3, lineHeight: 1.55 }}>{note}</div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 20, background: BG2, border: `1px solid ${BD1}`,
            borderRadius: 12, padding: "16px 22px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
          }}>
            <div style={{ fontFamily: SYS, fontSize: 15, color: T2 }}>
              Federal agencies and enterprise teams: procurement documentation, security questionnaires, and contract structures available on request.
            </div>
            <a href="mailto:procurement@constructaiq.trade" style={{
              fontFamily: MONO, fontSize: 13, color: AMBER,
              background: "#3d280022", border: `1px solid ${AMBER}44`,
              borderRadius: 10, padding: "10px 18px", whiteSpace: "nowrap",
              fontWeight: 700, letterSpacing: "0.04em",
            }}>
              procurement@constructaiq.trade →
            </a>
          </div>
        </div>

        {/* CTA SECTION */}
        <div style={{
          textAlign: "center", padding: "56px 40px",
          background: "linear-gradient(135deg,#1a1200 0%,#0d0d0d 100%)",
          borderRadius: 24, border: `1px solid ${AMBER}33`,
        }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: AMBER, letterSpacing: "0.12em", marginBottom: 16 }}>
            GET STARTED
          </div>
          <div style={{
            fontFamily: SYS, fontSize: 32, fontWeight: 700,
            color: T1, marginBottom: 14, letterSpacing: "-0.01em",
          }}>
            Ready to See the Intelligence?
          </div>
          <div style={{
            fontFamily: SYS, fontSize: 16, color: T3,
            lineHeight: 1.6, maxWidth: 480, margin: "0 auto 32px",
          }}>
            The dashboard is live now. No login required. Explore real-time construction signals, AI forecasts, and state-level market data.
          </div>
          <Link href="/dashboard">
            <button style={{
              background: AMBER, color: BG0,
              fontFamily: MONO, fontSize: 15, fontWeight: 700,
              padding: "16px 40px", borderRadius: 14,
              letterSpacing: "0.06em", minHeight: 52,
            }}>
              OPEN DASHBOARD →
            </button>
          </Link>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: SYS, fontSize: 14, color: T4 }}>
              Free forever. No credit card. Open API.
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${BD1}`, padding: "32px", textAlign: "center" }}>
        <Image
          src="/ConstructAIQWhiteLogo.svg"
          width={100} height={20}
          alt="ConstructAIQ"
          style={{ height: 20, width: "auto", marginBottom: 12 }}
        />
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>
          Construction Intelligence Platform · constructaiq.trade
        </div>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginTop: 6 }}>
          Data: Census Bureau · BLS · FRED · BEA · EIA · USASpending.gov
        </div>
      </footer>
    </div>
  )
}
