"use client";
import { useState } from "react";
 
const C = {
  bg: "#0D0F0E",
  bgCard: "#111310",
  bgCardHover: "#161815",
  surface: "#131510",
  border: "#1E201C",
  borderLight: "#252820",
  gold: "#C8A96E",
  goldDim: "#A88A52",
  cream: "#E8E4DC",
  muted: "#6A6660",
  faint: "#3A3830",
  white: "#F5F2EC",
};
 
const bebas: React.CSSProperties = { fontFamily: "'Bebas Neue', sans-serif" };
const dm: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
 
export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
 
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }
 
  return (
    <div style={{ background: C.bg, color: C.cream, minHeight: "100vh", ...dm }}>
      {/* ── NAV ────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(13,15,14,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "64px",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span style={{ ...bebas, fontSize: "26px", letterSpacing: "0.06em", color: C.white, fontWeight: 300 }}>CONSTRUCT</span>
          <span style={{ ...bebas, fontSize: "26px", letterSpacing: "0.01em", color: C.gold }}>AIQ</span>
        </div>
 
        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "36px" }}>
          {["Features", "Pricing", "Data Sources", "About"].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`} style={{
              ...dm, fontSize: "13px", color: C.muted, textDecoration: "none",
              letterSpacing: "0.02em", transition: "color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = C.cream)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
            >{link}</a>
          ))}
          <a href="#early-access" style={{
            ...dm, fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", textDecoration: "none",
            padding: "9px 20px", background: C.gold, color: C.bg,
            borderRadius: "2px", transition: "background 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = C.goldDim)}
            onMouseLeave={e => (e.currentTarget.style.background = C.gold)}
          >Get Access</a>
        </div>
      </nav>
 
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section style={{
        minHeight: "92vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "80px 24px 100px",
        background: `radial-gradient(ellipse 70% 60% at 50% 0%, rgba(200,169,110,0.06) 0%, transparent 70%)`,
        textAlign: "center", position: "relative",
      }}>
        {/* Eyebrow */}
        <div style={{
          ...mono, fontSize: "11px", letterSpacing: "0.22em", color: C.gold,
          textTransform: "uppercase", marginBottom: "28px",
          padding: "6px 16px", border: `1px solid ${C.border}`,
          borderRadius: "2px", display: "inline-block",
        }}>
          Construction Intelligence Platform
        </div>
 
        {/* Headline */}
        <h1 style={{
          ...bebas, fontSize: "clamp(64px, 14vw, 148px)",
          letterSpacing: "0.04em", lineHeight: 0.9,
          color: C.white, margin: "0 0 12px",
          textTransform: "uppercase",
        }}>
          Build Smarter.<br />
          <span style={{ color: C.gold }}>Bid Sharper.</span>
        </h1>
 
        {/* Sub-headline */}
        <p style={{
          ...dm, fontSize: "clamp(16px, 2vw, 20px)", color: C.muted,
          maxWidth: "580px", lineHeight: 1.7, margin: "28px auto 48px",
          fontWeight: 300,
        }}>
          ConstructAIQ unifies <span style={{ color: C.cream }}>312 federal and state data sources</span> into
          AI-powered construction market forecasts economists and general contractors can act on — before the competition does.
        </p>
 
        {/* Email form */}
        <div id="early-access">
          {submitted ? (
            <div style={{
              ...mono, fontSize: "13px", color: C.gold, letterSpacing: "0.1em",
              padding: "20px 40px", border: `1px solid ${C.border}`, borderRadius: "2px",
            }}>
              ✓ YOU'RE ON THE LIST — WE'LL BE IN TOUCH
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  ...dm, padding: "14px 22px", fontSize: "14px",
                  background: C.surface, border: `1px solid ${C.border}`,
                  color: C.cream, borderRadius: "2px", width: "300px",
                  outline: "none",
                }}
              />
              <button type="submit" style={{
                ...dm, padding: "14px 32px", background: C.gold, color: C.bg,
                border: "none", fontWeight: 700, fontSize: "12px",
                letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", borderRadius: "2px",
              }}>
                Request Early Access
              </button>
            </form>
          )}
          <div style={{ ...mono, fontSize: "11px", color: C.faint, marginTop: "16px", letterSpacing: "0.1em" }}>
            NO SPAM — LAUNCH UPDATES ONLY
          </div>
        </div>
 
        {/* Trust logos row */}
        <div style={{
          display: "flex", gap: "32px", alignItems: "center",
          marginTop: "72px", opacity: 0.4,
        }}>
          {["CENSUS BUREAU", "BLS", "FED RESERVE", "HUD", "DOT", "AGC"].map(src => (
            <span key={src} style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", color: C.muted }}>
              {src}
            </span>
          ))}
        </div>
      </section>
 
      {/* ── STATS ──────────────────────────────────────────────── */}
      <section style={{
        borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
        background: C.surface,
      }}>
        <div style={{
          maxWidth: "1100px", margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {[
            { num: "312", label: "Data Sources", sub: "Federal + state" },
            { num: "98.4%", label: "Forecast Accuracy", sub: "12-month horizon" },
            { num: "4 hrs", label: "Data Freshness", sub: "Rolling updates" },
            { num: "50+", label: "Metro Markets", sub: "US coverage" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "48px 36px",
              borderRight: i < 3 ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{ ...bebas, fontSize: "56px", color: C.gold, letterSpacing: "0.02em", lineHeight: 1 }}>
                {s.num}
              </div>
              <div style={{ ...dm, fontSize: "15px", color: C.cream, fontWeight: 500, margin: "8px 0 4px" }}>
                {s.label}
              </div>
              <div style={{ ...mono, fontSize: "11px", color: C.muted, letterSpacing: "0.08em" }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </section>
 
      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section id="features" style={{ padding: "100px 48px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "64px" }}>
          <div style={{ ...mono, fontSize: "11px", letterSpacing: "0.2em", color: C.gold, textTransform: "uppercase", marginBottom: "16px" }}>
            Platform Capabilities
          </div>
          <h2 style={{ ...bebas, fontSize: "clamp(44px, 6vw, 72px)", color: C.white, letterSpacing: "0.04em", margin: 0 }}>
            Intelligence That Moves<br />At Construction Speed
          </h2>
        </div>
 
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: C.border }}>
          {[
            {
              icon: "◈",
              title: "Market Forecast Engine",
              desc: "Proprietary ML models trained on 20 years of construction cycles. Predict permit velocity, labor cost shifts, and material price trends by metro, sector, and quarter.",
            },
            {
              icon: "⬡",
              title: "Bid Intelligence",
              desc: "Win-rate analytics tied to regional market heat maps. Know when to push margin and when to sharpen pencils — by project type and geography.",
            },
            {
              icon: "◎",
              title: "Federal Pipeline Monitor",
              desc: "Track $890B+ in active federal construction appropriations from planning through award. Never miss an IFB, RFP, or IDIQ opportunity.",
            },
            {
              icon: "△",
              title: "Labor Market Signals",
              desc: "Real-time craft labor availability, wage pressure indexes, and union rate forecasts across 200+ MSAs — sourced directly from BLS, AGC, and state workforce agencies.",
            },
            {
              icon: "◻",
              title: "Materials Cost Index",
              desc: "Daily lumber, steel, concrete, and MEP pricing aggregated from 14 commodity exchanges. Build escalation clauses backed by data, not guesswork.",
            },
            {
              icon: "⬤",
              title: "Scenario Modeling",
              desc: "Run rate scenarios against your project portfolio. Stress-test backlog assumptions against GDP, interest rate, and infrastructure spend projections.",
            },
          ].map((f, i) => (
            <div key={i} style={{
              background: C.bgCard, padding: "40px 36px",
              transition: "background 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bgCardHover)}
              onMouseLeave={e => (e.currentTarget.style.background = C.bgCard)}
            >
              <div style={{ fontSize: "22px", color: C.gold, marginBottom: "20px" }}>{f.icon}</div>
              <h3 style={{ ...dm, fontSize: "16px", fontWeight: 600, color: C.white, margin: "0 0 12px", letterSpacing: "0.01em" }}>
                {f.title}
              </h3>
              <p style={{ ...dm, fontSize: "14px", color: C.muted, lineHeight: 1.75, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
 
      {/* ── DATA SOURCES BANNER ────────────────────────────────── */}
      <section id="data-sources" style={{
        background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
        padding: "64px 48px",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
          <div>
            <div style={{ ...mono, fontSize: "11px", letterSpacing: "0.2em", color: C.gold, textTransform: "uppercase", marginBottom: "16px" }}>
              Data Infrastructure
            </div>
            <h2 style={{ ...bebas, fontSize: "clamp(36px, 5vw, 56px)", color: C.white, letterSpacing: "0.04em", margin: "0 0 20px" }}>
              312 Sources.<br />One Signal.
            </h2>
            <p style={{ ...dm, fontSize: "15px", color: C.muted, lineHeight: 1.75, maxWidth: "420px" }}>
              We ingest, clean, normalize, and weight data from every major federal agency,
              all 50 state building departments, regional permit offices, commodity exchanges,
              and industry associations — updated every four hours.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              "Census Bureau ACS", "BLS QCEW", "Federal Reserve H.8", "HUD SOCDS",
              "DOT FHWA", "AGC Data Digest", "Dodge Construction", "RSMeans Cost Index",
              "State DOT Portals", "FEMA Flood Maps", "EPA Air Quality", "50 State Permit APIs",
            ].map(src => (
              <div key={src} style={{
                ...mono, fontSize: "10px", letterSpacing: "0.1em", color: C.muted,
                padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: "2px",
              }}>
                {src}
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ── PRICING ────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "100px 48px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "64px", textAlign: "center" }}>
          <div style={{ ...mono, fontSize: "11px", letterSpacing: "0.2em", color: C.gold, textTransform: "uppercase", marginBottom: "16px" }}>
            Pricing
          </div>
          <h2 style={{ ...bebas, fontSize: "clamp(44px, 6vw, 72px)", color: C.white, letterSpacing: "0.04em", margin: 0 }}>
            Plans For Every Scale
          </h2>
        </div>
 
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: C.border }}>
          {[
            {
              tier: "Starter",
              price: "$490",
              period: "/mo",
              desc: "For regional contractors entering new markets.",
              features: [
                "5 metro market dashboards",
                "Monthly forecast reports",
                "Materials cost index",
                "Permit volume trends",
                "Email support",
              ],
              cta: "Start Free Trial",
              highlight: false,
            },
            {
              tier: "Professional",
              price: "$1,490",
              period: "/mo",
              desc: "For mid-size GCs and ENR 400 firms.",
              features: [
                "25 metro market dashboards",
                "Weekly forecast updates",
                "Full labor market signals",
                "Federal pipeline monitor",
                "Bid intelligence module",
                "API access (50k calls/mo)",
                "Slack / Teams alerts",
                "Priority support",
              ],
              cta: "Get Early Access",
              highlight: true,
            },
            {
              tier: "Enterprise",
              price: "Custom",
              period: "",
              desc: "For ENR 100 GCs, owners, and capital advisors.",
              features: [
                "Unlimited metro coverage",
                "Daily data refresh",
                "Scenario modeling suite",
                "Portfolio stress-testing",
                "Dedicated analyst",
                "Unlimited API access",
                "SSO + audit logs",
                "SLA guarantee",
              ],
              cta: "Contact Sales",
              highlight: false,
            },
          ].map((plan, i) => (
            <div key={i} style={{
              background: plan.highlight ? "#141711" : C.bgCard,
              padding: "48px 36px",
              position: "relative",
              outline: plan.highlight ? `1px solid ${C.gold}` : "none",
              outlineOffset: "-1px",
            }}>
              {plan.highlight && (
                <div style={{
                  position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)",
                  ...mono, fontSize: "9px", letterSpacing: "0.2em", color: C.bg,
                  background: C.gold, padding: "4px 14px", textTransform: "uppercase",
                }}>
                  Most Popular
                </div>
              )}
              <div style={{ ...mono, fontSize: "11px", letterSpacing: "0.2em", color: C.gold, textTransform: "uppercase", marginBottom: "20px" }}>
                {plan.tier}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                <span style={{ ...bebas, fontSize: "54px", color: C.white, lineHeight: 1 }}>{plan.price}</span>
                <span style={{ ...dm, fontSize: "14px", color: C.muted }}>{plan.period}</span>
              </div>
              <p style={{ ...dm, fontSize: "13px", color: C.muted, margin: "0 0 32px", lineHeight: 1.6 }}>{plan.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px" }}>
                {plan.features.map(f => (
                  <li key={f} style={{ ...dm, fontSize: "13px", color: C.cream, padding: "8px 0", borderBottom: `1px solid ${C.border}`, display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ color: C.gold, flexShrink: 0 }}>—</span>{f}
                  </li>
                ))}
              </ul>
              <button style={{
                ...dm, width: "100%", padding: "14px", fontSize: "12px", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                borderRadius: "2px", transition: "all 0.15s",
                background: plan.highlight ? C.gold : "transparent",
                color: plan.highlight ? C.bg : C.gold,
                border: plan.highlight ? "none" : `1px solid ${C.gold}`,
              }}
                onMouseEnter={e => {
                  if (plan.highlight) { e.currentTarget.style.background = C.goldDim; }
                  else { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = C.bg; }
                }}
                onMouseLeave={e => {
                  if (plan.highlight) { e.currentTarget.style.background = C.gold; }
                  else { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.gold; }
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>
 
      {/* ── CTA BAND ───────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, #131510 0%, #0F110E 100%)`,
        borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
        padding: "80px 48px", textAlign: "center",
      }}>
        <h2 style={{ ...bebas, fontSize: "clamp(44px, 8vw, 96px)", color: C.white, letterSpacing: "0.04em", margin: "0 0 16px" }}>
          Know The Market<br /><span style={{ color: C.gold }}>Before It Moves</span>
        </h2>
        <p style={{ ...dm, fontSize: "16px", color: C.muted, marginBottom: "40px", maxWidth: "480px", margin: "0 auto 40px", lineHeight: 1.7 }}>
          Join contractors, capital advisors, and market economists on the early access list.
        </p>
        <a href="#early-access" style={{
          ...dm, display: "inline-block", padding: "16px 44px",
          background: C.gold, color: C.bg, textDecoration: "none",
          fontWeight: 700, fontSize: "13px", letterSpacing: "0.1em",
          textTransform: "uppercase", borderRadius: "2px",
        }}>
          Request Early Access
        </a>
      </section>
 
      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${C.border}`,
        padding: "48px 48px 32px",
        maxWidth: "1200px", margin: "0 auto",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px", marginBottom: "16px" }}>
              <span style={{ ...bebas, fontSize: "22px", letterSpacing: "0.06em", color: C.white, fontWeight: 300 }}>CONSTRUCT</span>
              <span style={{ ...bebas, fontSize: "22px", letterSpacing: "0.01em", color: C.gold }}>AIQ</span>
            </div>
            <p style={{ ...dm, fontSize: "13px", color: C.muted, lineHeight: 1.75, maxWidth: "280px" }}>
              AI-powered construction market intelligence. 312 federal and state data sources unified into forecasts you can act on.
            </p>
          </div>
 
          {/* Links */}
          {[
            { heading: "Product", links: ["Features", "Pricing", "Data Sources", "API Docs", "Changelog"] },
            { heading: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
            { heading: "Legal", links: ["Privacy Policy", "Terms of Service", "Data Usage", "Security"] },
          ].map(col => (
            <div key={col.heading}>
              <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", color: C.gold, textTransform: "uppercase", marginBottom: "20px" }}>
                {col.heading}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" style={{ ...dm, fontSize: "13px", color: C.muted, textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.cream)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
                    >{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
 
        <div style={{
          borderTop: `1px solid ${C.border}`, paddingTop: "24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ ...mono, fontSize: "11px", color: C.faint, letterSpacing: "0.08em" }}>
            © 2025 CONSTRUCTAIQ INC. ALL RIGHTS RESERVED.
          </span>
          <div style={{ display: "flex", gap: "24px" }}>
            {["LinkedIn", "X / Twitter", "GitHub"].map(s => (
              <a key={s} href="#" style={{ ...mono, fontSize: "10px", letterSpacing: "0.12em", color: C.faint, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = C.faint)}
              >{s}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
