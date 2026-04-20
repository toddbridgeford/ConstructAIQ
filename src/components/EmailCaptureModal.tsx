"use client"

import { useState, useEffect, useCallback } from "react"
import { color, font } from "@/lib/theme"

interface EmailCaptureModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (email: string, name?: string) => void
  title?: string
  subtitle?: string
  ctaText?: string
  showName?: boolean
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EmailCaptureModal({
  open,
  onClose,
  onSubmit,
  title = "Stay in the Loop",
  subtitle,
  ctaText = "Get Access",
  showName = false,
}: EmailCaptureModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [nameFocused, setNameFocused] = useState(false)

  const handleClose = useCallback(() => {
    setName("")
    setEmail("")
    setError("")
    setDone(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, handleClose])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email address.")
      return
    }
    onSubmit(email.trim(), showName && name.trim() ? name.trim() : undefined)
    setDone(true)
    setTimeout(() => handleClose(), 2000)
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) handleClose()
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    background: color.bg3,
    border: `1px solid ${focused ? color.bd3 : color.bd2}`,
    borderRadius: 8,
    padding: "10px 14px",
    fontFamily: font.sys,
    fontSize: 14,
    color: color.t1,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 12,
  })

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: color.bg1,
          border: `1px solid ${color.bd2}`,
          borderRadius: 20,
          padding: "36px 40px",
          maxWidth: 480,
          width: "90%",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 20,
            background: "transparent",
            border: "none",
            color: color.t4,
            fontSize: 20,
            cursor: "pointer",
            lineHeight: 1,
            padding: "4px 6px",
          }}
        >
          ×
        </button>

        {/* Title */}
        <h2
          style={{
            fontFamily: font.sys,
            fontSize: 22,
            fontWeight: 700,
            color: color.t1,
            margin: "0 0 10px",
          }}
        >
          {title}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              fontFamily: font.sys,
              fontSize: 15,
              color: color.t3,
              lineHeight: 1.6,
              margin: "0 0 24px",
            }}
          >
            {subtitle}
          </p>
        )}

        {done ? (
          <div
            style={{
              fontFamily: font.mono,
              fontSize: 14,
              color: color.green,
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            ✓ Done! Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {showName && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="Your name"
                autoComplete="name"
                style={inputStyle(nameFocused)}
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={inputStyle(emailFocused)}
            />
            {error && (
              <p
                style={{
                  fontFamily: font.sys,
                  fontSize: 12,
                  color: color.red,
                  margin: "-8px 0 10px",
                }}
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              style={{
                background: color.amber,
                color: "#000",
                fontFamily: font.mono,
                fontSize: 13,
                fontWeight: 700,
                padding: "14px 20px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                width: "100%",
              }}
            >
              {ctaText}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
