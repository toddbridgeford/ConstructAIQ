"use client"
import Link from "next/link"
import { useState } from "react"
import { color } from "@/lib/theme"

const { green: GREEN, red: RED } = color

export function CtaSection() {
  const [email,  setEmail]  = useState("")
  const [status, setStatus] = useState<""|"success"|"error">("")
  const [busy,   setBusy]   = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || busy) return
    setBusy(true)
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "weekly-brief" }),
      })
      setStatus(r.ok ? "success" : "error")
      if (r.ok) setEmail("")
    } catch { setStatus("error") } finally { setBusy(false) }
  }

  return (
    <section className="cta-sec">
      <div className="wrap">
        <p className="eyebrow-lbl">Weekly Briefing</p>
        <h2 className="cta-h2">The construction market<br />brief, every Monday.</h2>
        <p className="cta-sub">
          Top 3 signals, a 30-day forecast snapshot, and the one data<br />
          point every construction professional needs to know.
        </p>

        <form onSubmit={submit} className="cta-form">
          <input
            type="email" placeholder="your@email.com" value={email}
            onChange={e => setEmail(e.target.value)} className="cta-inp"
          />
          <button type="submit" disabled={busy} className="btn-fl"
                  style={{ opacity: busy ? 0.7 : 1 }}>
            {busy ? "…" : "Subscribe Free"}
          </button>
        </form>

        {status === "success" && (
          <div style={{ fontSize:14, color:GREEN, marginTop:12, textAlign:"center" }}>✓ You&apos;re on the list.</div>
        )}
        {status === "error" && (
          <div style={{ fontSize:14, color:RED, marginTop:12, textAlign:"center" }}>Something went wrong. Try again.</div>
        )}

        <p className="cta-disc" style={{ marginTop:14 }}>No spam. Unsubscribe anytime. 2,000+ subscribers.</p>

        <div style={{ marginTop:40, display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <Link href="/dashboard" className="btn-fl">Open Dashboard →</Link>
          <Link href="/pricing"   className="btn-g">View Pricing</Link>
        </div>
      </div>
    </section>
  )
}
