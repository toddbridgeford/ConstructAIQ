"use client"

import { useState } from "react"
import { color, font } from "@/lib/theme"

interface GatedSectionProps {
  locked: boolean
  tier: "free" | "starter" | "professional" | "enterprise"
  children: React.ReactNode
  ctaText?: string
  onUnlock?: (email: string) => void
}

export function GatedSection({
  locked,
  tier,
  children,
  ctaText,
  onUnlock,
}: GatedSectionProps) {
  const [email, setEmail] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  if (!locked) {
    return <>{children}</>
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    onUnlock?.(email)
    setUnlocked(true)
  }

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)

  return (
    <div style={{ position: "relative" }}>
      {/* Blurred children */}
      <div
        style={{
          filter: "blur(6px) brightness(0.4)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: color.bg2,
            border: `1px solid ${color.bd2}`,
            borderRadius: 16,
            padding: "28px 32px",
            maxWidth: 380,
            width: "90%",
            textAlign: "center",
          }}
        >
          {/* Lock icon */}
          <div style={{ fontSize: 24, marginBottom: 12 }}>🔒</div>

          {/* Tier label */}
          <div
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              color: color.amber,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Requires {tierLabel} Plan
          </div>

          {unlocked ? (
            <div
              style={{
                fontFamily: font.mono,
                fontSize: 13,
                color: color.green,
                marginTop: 8,
              }}
            >
              ✓ Access unlocked
            </div>
          ) : (
            <>
              {/* CTA text */}
              <p
                style={{
                  fontFamily: font.sys,
                  fontSize: 14,
                  color: color.t3,
                  marginBottom: 20,
                  lineHeight: 1.6,
                  margin: "0 0 20px",
                }}
              >
                {ctaText ?? "Enter your email to unlock free access"}
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="you@example.com"
                  style={{
                    background: color.bg3,
                    border: `1px solid ${inputFocused ? color.bd3 : color.bd2}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontFamily: font.sys,
                    fontSize: 14,
                    color: color.t1,
                    width: "100%",
                    marginBottom: 12,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: color.amber,
                    color: "#000",
                    fontFamily: font.mono,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Unlock Access
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
