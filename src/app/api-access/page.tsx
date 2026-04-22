"use client"
import { useState } from "react"
import Link from "next/link"
import { Nav } from "@/app/components/Nav"
import { color, font } from "@/lib/theme"

// ── Tokens ────────────────────────────────────────────────────────────────

const { bg0:BG0, bg1:BG1, bg2:BG2, bd1:BD1, bd2:BD2,
        t1:T1, t2:T2, t3:T3, t4:T4,
        green:GREEN, amber:AMBER, blue:BLUE, red:RED,
        blueDim:BLUE_DIM } = color
const MONO = font.mono, SYS = font.sys

// ── Code snippets ─────────────────────────────────────────────────────────

const SNIPPETS = {
  curl: `# Get your free API key
curl -X POST https://constructaiq.trade/api/keys/issue \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","plan":"free"}'

# Use your key
curl https://constructaiq.trade/api/forecast?series=TTLCONS \\
  -H "X-Api-Key: caiq_your_key_here"`,

  python: `import requests

r = requests.get(
    "https://constructaiq.trade/api/forecast",
    params={"series": "TTLCONS"},
    headers={"X-Api-Key": "caiq_your_key_here"}
)
data = r.json()`,

  js: `const res = await fetch(
  "https://constructaiq.trade/api/forecast?series=TTLCONS",
  { headers: { "X-Api-Key": "caiq_your_key_here" } }
)
const data = await res.json()`,
}

// ── Endpoint table ────────────────────────────────────────────────────────

const ENDPOINTS = [
  { path:"GET /api/forecast?series=TTLCONS", desc:"12-month ensemble forecast",    auth:"Key",  rate:"1K/day"    },
  { path:"GET /api/census",                  desc:"Construction spending (Census)", auth:"Key",  rate:"1K/day"    },
  { path:"GET /api/bls",                     desc:"Employment data (BLS)",          auth:"Key",  rate:"1K/day"    },
  { path:"GET /api/signals",                 desc:"Anomaly detection signals",      auth:"Key",  rate:"1K/day"    },
  { path:"GET /api/federal",                 desc:"Federal pipeline by state",      auth:"None", rate:"1K/day"    },
  { path:"GET /api/pricewatch",              desc:"Commodity prices",               auth:"Key",  rate:"1K/day"    },
  { path:"GET /api/map",                     desc:"State-level permit data",        auth:"None", rate:"1K/day"    },
  { path:"GET /api/export?series=TTLCONS",   desc:"Download CSV",                   auth:"None", rate:"100/day"   },
  { path:"POST /api/keys/issue",             desc:"Issue API key",                  auth:"None", rate:"10/day"    },
  { path:"GET /api/status",                  desc:"Health check",                   auth:"None", rate:"Unlimited" },
]

// ── Rate limit tiers ──────────────────────────────────────────────────────

const TIERS = [
  { plan:"Free",              limits:"1,000 req/day · 60 req/min",  note:""                                        },
  { plan:"Researcher (.edu)", limits:"10,000 req/day · 60 req/min", note:"Email research@constructaiq.trade"       },
  { plan:"Enterprise",        limits:"Unlimited · Custom SLA",      note:"Contact us"                              },
]

const USE_CASES = [
  "Research", "Construction lending", "General contracting",
  "Investment analysis", "Software development", "Other",
]

type Tab = "curl" | "python" | "js"

// ── Small shared components ────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`,
                  padding:"32px 36px", ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ label, title }: { label:string; title:string }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.12em",
                    textTransform:"uppercase", marginBottom:10 }}>{label}</div>
      <h2 style={{ fontFamily:SYS, fontSize:26, fontWeight:700, color:T1,
                   letterSpacing:"-0.025em", margin:0 }}>{title}</h2>
    </div>
  )
}

// ── Code block with tabs ───────────────────────────────────────────────────

function CodeTabs() {
  const [tab, setTab] = useState<Tab>("curl")
  const tabs: { key: Tab; label: string }[] = [
    { key:"curl",   label:"curl"       },
    { key:"python", label:"Python"     },
    { key:"js",     label:"JavaScript" },
  ]
  return (
    <div>
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${BD1}`, marginBottom:0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background:      tab === t.key ? BG2 : "transparent",
              border:          "none",
              borderBottom:    tab === t.key ? `2px solid ${BLUE}` : "2px solid transparent",
              color:           tab === t.key ? T1 : T4,
              fontFamily:      MONO, fontSize:12, fontWeight:600,
              padding:         "10px 20px", cursor:"pointer",
              letterSpacing:   "0.04em", minHeight:44,
              transition:      "color 0.1s",
            }}>
            {t.label}
          </button>
        ))}
      </div>
      <pre style={{
        background:BG2, border:`1px solid ${BD1}`,
        borderTop:"none", borderRadius:"0 0 12px 12px",
        padding:"24px 24px", fontFamily:MONO, fontSize:13,
        color:GREEN, lineHeight:1.7, overflowX:"auto", margin:0,
        whiteSpace:"pre",
      }}>
        {SNIPPETS[tab]}
      </pre>
    </div>
  )
}

// ── Key registration form ─────────────────────────────────────────────────

function KeyRegistrationForm() {
  const [email,  setEmail]  = useState("")
  const [use,    setUse]    = useState(USE_CASES[0])
  const [busy,   setBusy]   = useState(false)
  const [key,    setKey]    = useState<string | null>(null)
  const [err,    setErr]    = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || busy) return
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch("/api/keys/issue", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), plan: "free", name: use }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error ?? "Key generation failed. Please try again.")
      } else {
        setKey(data.key)
      }
    } catch {
      setErr("Network error. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  function copyKey() {
    if (!key) return
    navigator.clipboard.writeText(key).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (key) {
    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:GREEN,
                         display:"inline-block" }} />
          <span style={{ fontFamily:MONO, fontSize:12, color:GREEN, fontWeight:600 }}>
            Your API key is ready
          </span>
        </div>

        <div style={{ background:BG2, border:`1px solid ${GREEN}44`, borderRadius:12,
                      padding:"16px 20px", marginBottom:16,
                      display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <code style={{ fontFamily:MONO, fontSize:13, color:GREEN,
                         flex:"1 1 200px", wordBreak:"break-all" }}>
            {key}
          </code>
          <button
            onClick={copyKey}
            style={{
              flexShrink:0, background: copied ? GREEN+"22" : "transparent",
              border:`1px solid ${copied ? GREEN : BD2}`,
              color: copied ? GREEN : T3,
              borderRadius:8, padding:"8px 16px",
              fontFamily:MONO, fontSize:12, fontWeight:700,
              cursor:"pointer", minHeight:44, letterSpacing:"0.04em",
              transition:"all 0.15s",
            }}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        <div style={{ background:AMBER+"14", border:`1px solid ${AMBER}44`,
                      borderRadius:10, padding:"12px 16px",
                      fontFamily:SYS, fontSize:13, color:AMBER, lineHeight:1.6 }}>
          Store this key securely. It is shown once and never stored in plaintext.
        </div>

        <div style={{ marginTop:20, fontFamily:SYS, fontSize:13, color:T4 }}>
          Pass your key as an{" "}
          <code style={{ fontFamily:MONO, fontSize:12, color:T3 }}>X-Api-Key</code>
          {" "}header on every request. See the{" "}
          <span style={{ color:BLUE }}>endpoint reference</span> below for available routes.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={{ fontFamily:MONO, fontSize:10, color:T4,
                          letterSpacing:"0.08em", display:"block", marginBottom:6 }}>
            EMAIL ADDRESS
          </label>
          <input
            type="email" required placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{
              width:"100%", background:BG2, border:`1px solid ${BD2}`,
              borderRadius:10, padding:"12px 14px",
              fontFamily:SYS, fontSize:14, color:T1,
              outline:"none", minHeight:44,
            }}
          />
        </div>

        <div>
          <label style={{ fontFamily:MONO, fontSize:10, color:T4,
                          letterSpacing:"0.08em", display:"block", marginBottom:6 }}>
            INTENDED USE
          </label>
          <select
            value={use} onChange={e => setUse(e.target.value)}
            style={{
              width:"100%", background:BG2, border:`1px solid ${BD2}`,
              borderRadius:10, padding:"12px 14px",
              fontFamily:SYS, fontSize:14, color:T2,
              outline:"none", cursor:"pointer", minHeight:44,
            }}>
            {USE_CASES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        {err && (
          <div style={{ background:RED+"18", border:`1px solid ${RED}44`,
                        borderRadius:10, padding:"10px 14px",
                        fontFamily:SYS, fontSize:13, color:RED }}>
            {err}
          </div>
        )}

        <button
          type="submit" disabled={busy}
          style={{
            background: busy ? BLUE_DIM : BLUE,
            color: busy ? T4 : BG0, border:"none",
            borderRadius:12, padding:"14px 24px",
            fontFamily:MONO, fontSize:13, fontWeight:700,
            letterSpacing:"0.06em", cursor: busy ? "default" : "pointer",
            minHeight:44, opacity: busy ? 0.7 : 1,
            transition:"all 0.15s",
          }}>
          {busy ? "Generating…" : "Get My Free API Key →"}
        </button>

        <p style={{ fontFamily:SYS, fontSize:12, color:T4, margin:0, lineHeight:1.6 }}>
          Free forever. No credit card. Keys are issued instantly.
          By requesting a key you agree to the{" "}
          <Link href="/about" style={{ color:T3 }}>terms of use</Link>.
        </p>
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function ApiAccessPage() {
  return (
    <div style={{ minHeight:"100vh", background:BG0, color:T1, fontFamily:SYS,
                  paddingBottom:"env(safe-area-inset-bottom,24px)" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{color:inherit;text-decoration:none}button{font-family:inherit}input,select{color-scheme:dark}`}</style>

      <Nav />

      <div style={{ maxWidth:960, margin:"0 auto", padding:"64px 32px 80px" }}>

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div style={{ textAlign:"center", marginBottom:72 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                        background:BLUE_DIM, border:`1px solid ${BLUE}44`,
                        borderRadius:20, padding:"6px 18px", marginBottom:24 }}>
            <span style={{ fontFamily:MONO, fontSize:11, color:BLUE, letterSpacing:"0.08em" }}>
              REST API
            </span>
          </div>
          <h1 style={{ fontFamily:SYS, fontSize:52, fontWeight:700,
                       letterSpacing:"-0.04em", lineHeight:1.05, color:T1, marginBottom:16 }}>
            Open API — Free
          </h1>
          <p style={{ fontFamily:SYS, fontSize:19, color:T3, lineHeight:1.65,
                      maxWidth:520, margin:"0 auto" }}>
            1,000 requests/day free. Full historical data. No credit card.
          </p>
        </div>

        {/* ── Quick Start ──────────────────────────────────────────────── */}
        <Card style={{ marginBottom:24 }}>
          <SectionTitle label="Quick Start" title="Up and running in 60 seconds" />
          <CodeTabs />
        </Card>

        {/* ── Key Registration ─────────────────────────────────────────── */}
        <Card style={{ marginBottom:24, border:`1px solid ${BLUE}33`,
                       boxShadow:`0 0 48px ${BLUE}0d` }}>
          <SectionTitle label="Self-Serve Registration" title="Get your free API key" />
          <KeyRegistrationForm />
        </Card>

        {/* ── Endpoint Reference ───────────────────────────────────────── */}
        <Card style={{ marginBottom:24 }}>
          <SectionTitle label="Reference" title="Endpoint Reference" />
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Endpoint","Description","Auth","Rate Limit"].map(h => (
                    <th key={h} style={{
                      fontFamily:MONO, fontSize:10, color:T4,
                      letterSpacing:"0.08em", textTransform:"uppercase",
                      padding:"10px 14px", textAlign:"left",
                      background:BG2, fontWeight:600, whiteSpace:"nowrap",
                      borderBottom:`1px solid ${BD1}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((ep, i) => (
                  <tr key={ep.path} style={{ background: i % 2 === 0 ? BG2 : BG1 }}>
                    <td style={{ fontFamily:MONO, fontSize:12, color:BLUE,
                                 padding:"11px 14px", borderTop:`1px solid ${BD1}`,
                                 whiteSpace:"nowrap" }}>
                      {ep.path}
                    </td>
                    <td style={{ fontFamily:SYS, fontSize:13, color:T2,
                                 padding:"11px 14px", borderTop:`1px solid ${BD1}` }}>
                      {ep.desc}
                    </td>
                    <td style={{ fontFamily:MONO, fontSize:11, padding:"11px 14px",
                                 borderTop:`1px solid ${BD1}`, whiteSpace:"nowrap" }}>
                      <span style={{
                        color:      ep.auth === "Key" ? AMBER : T4,
                        background: ep.auth === "Key" ? AMBER+"18" : "transparent",
                        borderRadius:4, padding: ep.auth === "Key" ? "2px 8px" : "0",
                      }}>
                        {ep.auth}
                      </span>
                    </td>
                    <td style={{ fontFamily:MONO, fontSize:11, color:T3,
                                 padding:"11px 14px", borderTop:`1px solid ${BD1}`,
                                 whiteSpace:"nowrap" }}>
                      {ep.rate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:16, fontFamily:SYS, fontSize:13, color:T4, lineHeight:1.6 }}>
            Pass your key as the{" "}
            <code style={{ fontFamily:MONO, fontSize:12, color:T3 }}>X-Api-Key</code>
            {" "}header. All endpoints return JSON.
          </div>
        </Card>

        {/* ── Rate Limits ──────────────────────────────────────────────── */}
        <Card style={{ marginBottom:48 }}>
          <SectionTitle label="Plans" title="Rate Limits" />
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {TIERS.map((tier, i) => (
              <div key={tier.plan} style={{
                display:"flex", alignItems:"center", gap:24, flexWrap:"wrap",
                padding:"16px 0",
                borderTop: i > 0 ? `1px solid ${BD1}` : "none",
              }}>
                <div style={{ flex:"0 0 180px" }}>
                  <div style={{ fontFamily:SYS, fontSize:14, fontWeight:600, color:T1 }}>
                    {tier.plan}
                  </div>
                </div>
                <div style={{ fontFamily:MONO, fontSize:13, color:GREEN, flex:"1 1 200px" }}>
                  {tier.limits}
                </div>
                {tier.note && (
                  <div style={{ fontFamily:SYS, fontSize:13, color:T4 }}>
                    {tier.plan === "Enterprise"
                      ? <Link href="/contact" style={{ color:AMBER }}>{tier.note} →</Link>
                      : <a href="mailto:research@constructaiq.trade"
                           style={{ color:T3 }}>{tier.note}</a>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* ── Back links ───────────────────────────────────────────────── */}
        <div style={{ display:"flex", gap:24, justifyContent:"center", flexWrap:"wrap" }}>
          <Link href="/dashboard" style={{ fontFamily:SYS, fontSize:14, color:T4,
                                           textDecoration:"underline" }}>
            ← Open Dashboard
          </Link>
          <Link href="/federal" style={{ fontFamily:SYS, fontSize:14, color:T4,
                                         textDecoration:"underline" }}>
            Federal Pipeline
          </Link>
          <Link href="/pricing" style={{ fontFamily:SYS, fontSize:14, color:T4,
                                         textDecoration:"underline" }}>
            Pricing
          </Link>
        </div>
      </div>
    </div>
  )
}
