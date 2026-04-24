"use client"
import { useState } from "react"
import Link from "next/link"
import { color } from "@/lib/theme"
import { T1, T3, BD, MONO, SYS } from "./home-utils"

export function HomeNewsletter() {
  const [email,  setEmail]  = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    try {
      const res = await fetch("/api/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, source: "homepage", plan: "newsletter" }),
      })
      setStatus(res.ok ? "success" : "error")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      <div style={{
        fontFamily: MONO, fontSize: 10, color: color.amber,
        letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12,
      }}>
        The Signal — Free Weekly
      </div>
      <h2 style={{
        fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em",
        color: T1, margin: "0 0 8px",
      }}>
        Construction market intelligence, every Monday.
      </h2>
      <p style={{ fontSize: 14, color: T3, margin: "0 0 24px", lineHeight: 1.6 }}>
        Verdict, key numbers, and the week&apos;s top signal — delivered free.
      </p>

      {status === "success" ? (
        <p style={{ fontSize: 14, fontFamily: MONO, color: color.green, fontWeight: 600 }}>
          You&apos;re on the list. First issue next Monday.
        </p>
      ) : (
        <form onSubmit={submit} style={{
          display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap",
        }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{
              background: color.bg0, border: `1px solid ${BD}`,
              borderRadius: 10, padding: "11px 16px",
              fontSize: 14, color: T1, fontFamily: SYS,
              outline: "none", width: 240,
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              background: color.amber, color: "#000",
              border: "none", borderRadius: 10,
              padding: "11px 20px", fontSize: 14, fontWeight: 600,
              cursor: status === "loading" ? "wait" : "pointer",
              fontFamily: SYS,
            }}
          >
            {status === "loading" ? "..." : "Subscribe free"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p style={{ fontSize: 12, color: color.red, marginTop: 8 }}>
          Something went wrong.{" "}
          <Link href="/subscribe" style={{ color: color.blue }}>Try here</Link>.
        </p>
      )}
    </div>
  )
}
