"use client"
import { useState }      from "react"
import Link              from "next/link"
import Image             from "next/image"
import { color, font }   from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

const PREVIEW_CARDS = [
  {
    label: "Market Verdict",
    body:  "EXPAND / HOLD / CONTRACT — one decisive read on the week's conditions.",
    accent: color.green,
  },
  {
    label: "Key Numbers",
    body:  "Spending, permits, and employment — the three numbers that move construction.",
    accent: color.blue,
  },
  {
    label: "Signal Alert",
    body:  "The week's top anomaly — what deviated from trend and why it matters.",
    accent: color.amber,
  },
]

export default function SubscribePage() {
  const [email,   setEmail]   = useState("")
  const [status,  setStatus]  = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errMsg,  setErrMsg]  = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    try {
      const res = await fetch("/api/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, source: "subscribe-page", plan: "newsletter" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrMsg(data.error ?? "Something went wrong.")
        setStatus("error")
      } else {
        setStatus("success")
      }
    } catch {
      setErrMsg("Network error. Please try again.")
      setStatus("error")
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: color.bg0, color: color.t1, fontFamily: SYS }}>
      {/* Nav */}
      <nav style={{
        padding:        "20px 32px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        borderBottom:   `1px solid ${color.bd1}`,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <Image src="/ConstructAIQWhiteLogo.svg" alt="ConstructAIQ" width={120} height={20}
                 style={{ height: 20, width: "auto" }} />
        </Link>
        <Link href="/dashboard" style={{
          fontSize: 13, color: color.t3, textDecoration: "none", fontFamily: SYS,
        }}>
          Open Dashboard →
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ padding: "80px 32px 60px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{
          fontFamily:    MONO,
          fontSize:      11,
          color:         color.amber,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom:  20,
          textAlign:     "center",
        }}>
          The Signal
        </div>

        <h1 style={{
          fontSize:      "clamp(32px, 7vw, 52px)",
          fontWeight:    700,
          letterSpacing: "-0.03em",
          lineHeight:    1.1,
          margin:        "0 0 20px",
          color:         color.t1,
          textAlign:     "center",
        }}>
          Weekly US construction market intelligence.
        </h1>

        <p style={{
          fontSize:     18,
          color:        color.t3,
          lineHeight:   1.6,
          margin:       "0 0 48px",
          fontWeight:   400,
          textAlign:    "center",
        }}>
          Free. Every Monday morning.
        </p>

        {/* Preview cards */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 12,
          marginBottom:        48,
        }}>
          {PREVIEW_CARDS.map(card => (
            <div key={card.label} style={{
              background:   color.bg1,
              border:       `1px solid ${color.bd1}`,
              borderRadius: 10,
              padding:      "18px 16px",
            }}>
              <div style={{
                fontFamily:    MONO,
                fontSize:      10,
                color:         card.accent,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom:  8,
              }}>
                {card.label}
              </div>
              <p style={{ fontSize: 13, color: color.t3, lineHeight: 1.6, margin: 0 }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>

        {/* Form / success */}
        {status === "success" ? (
          <div style={{
            background:   color.greenDim,
            border:       `1px solid ${color.green}`,
            borderRadius: 12,
            padding:      "28px 32px",
            textAlign:    "center",
          }}>
            <div style={{
              fontSize:     18,
              fontWeight:   600,
              color:        color.green,
              marginBottom: 10,
            }}>
              You&apos;re on the list.
            </div>
            <p style={{ fontSize: 14, color: color.t3, margin: 0 }}>
              First issue next Monday morning.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} style={{
              display: "flex", gap: 10, maxWidth: 440, margin: "0 auto",
            }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  flex:         1,
                  background:   color.bg1,
                  border:       `1px solid ${color.bd2}`,
                  borderRadius: 10,
                  padding:      "13px 16px",
                  fontSize:     15,
                  color:        color.t1,
                  fontFamily:   SYS,
                  outline:      "none",
                  minWidth:     0,
                }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  background:   color.blue,
                  color:        "#fff",
                  border:       "none",
                  borderRadius: 10,
                  padding:      "13px 22px",
                  fontSize:     15,
                  fontWeight:   600,
                  cursor:       status === "loading" ? "wait" : "pointer",
                  whiteSpace:   "nowrap",
                  fontFamily:   SYS,
                  flexShrink:   0,
                }}
              >
                {status === "loading" ? "..." : "Subscribe"}
              </button>
            </form>

            {status === "error" && (
              <p style={{
                fontSize:   13,
                color:      color.red,
                marginTop:  12,
                textAlign:  "center",
              }}>
                {errMsg}
              </p>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer style={{
        padding:    "24px 32px",
        borderTop:  `1px solid ${color.bd1}`,
        textAlign:  "center",
        marginTop:  "auto",
      }}>
        <p style={{ fontSize: 12, color: color.t4, margin: 0 }}>
          ConstructAIQ · Free construction intelligence ·{" "}
          <Link href="/dashboard" style={{ color: color.t4, textDecoration: "none" }}>
            Dashboard
          </Link>
        </p>
      </footer>
    </div>
  )
}
