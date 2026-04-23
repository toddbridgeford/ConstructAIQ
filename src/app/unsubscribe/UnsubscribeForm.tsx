"use client"
import { useState, useEffect } from "react"
import Link                    from "next/link"
import Image                   from "next/image"
import { useSearchParams }     from "next/navigation"
import { color, font }         from "@/lib/theme"

const SYS = font.sys

export default function UnsubscribeForm() {
  const searchParams = useSearchParams()
  const token        = searchParams.get("token") ?? ""

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    token ? "loading" : "error",
  )

  useEffect(() => {
    if (!token) return
    fetch("/api/unsubscribe", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(d => setStatus(d.ok ? "done" : "error"))
      .catch(() => setStatus("error"))
  }, [token])

  return (
    <div style={{
      minHeight:      "100vh",
      background:     color.bg0,
      color:          color.t1,
      fontFamily:     SYS,
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      padding:        32,
      textAlign:      "center",
    }}>
      <Link href="/" style={{ marginBottom: 40, display: "inline-block" }}>
        <Image src="/ConstructAIQWhiteLogo.svg" alt="ConstructAIQ" width={120} height={20}
               style={{ height: 20, width: "auto" }} />
      </Link>

      {status === "loading" && (
        <p style={{ color: color.t3, fontSize: 15 }}>Processing…</p>
      )}

      {status === "done" && (
        <div style={{ maxWidth: 420 }}>
          <h1 style={{
            fontSize:      24,
            fontWeight:    700,
            letterSpacing: "-0.02em",
            marginBottom:  16,
            color:         color.t1,
          }}>
            You&apos;ve been unsubscribed.
          </h1>
          <p style={{
            color:        color.t3,
            fontSize:     15,
            lineHeight:   1.6,
            marginBottom: 32,
          }}>
            We&apos;re sorry to see you go. You won&apos;t receive any more Signal emails.
          </p>
        </div>
      )}

      {status === "error" && (
        <div style={{ maxWidth: 420 }}>
          <h1 style={{
            fontSize:      24,
            fontWeight:    700,
            letterSpacing: "-0.02em",
            marginBottom:  16,
            color:         color.t1,
          }}>
            Invalid unsubscribe link.
          </h1>
          <p style={{
            color:        color.t3,
            fontSize:     15,
            lineHeight:   1.6,
            marginBottom: 32,
          }}>
            This link is invalid or has already been used. If you need help, contact us.
          </p>
        </div>
      )}

      <Link href="/dashboard" style={{
        display:        "inline-flex",
        alignItems:     "center",
        background:     color.bg1,
        color:          color.t2,
        border:         `1px solid ${color.bd1}`,
        borderRadius:   10,
        padding:        "12px 24px",
        fontSize:       14,
        textDecoration: "none",
        fontWeight:     500,
        fontFamily:     SYS,
      }}>
        Back to Dashboard
      </Link>
    </div>
  )
}
