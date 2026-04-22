"use client"
import { useState, useEffect, useRef } from "react"
import { color, font, radius } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

const DISMISS_KEY = "pwa-dismissed"

export function InstallPrompt() {
  const [show,       setShow]       = useState(false)
  const [isIOS,      setIsIOS]      = useState(false)
  const [deferredEvt, setDeferredEvt] = useState<Event | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Never show if dismissed or already in standalone mode
    if (localStorage.getItem(DISMISS_KEY)) return
    const standalone = window.matchMedia("(display-mode: standalone)").matches
    if (standalone) return

    const ua = navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua) && !(ua.includes("crios") || ua.includes("fxios"))
    setIsIOS(ios)

    if (ios) {
      // Show iOS instructions on delay
      setTimeout(() => setShow(true), 3000)
      return
    }

    // Android/Chrome — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredEvt(e)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1")
    setShow(false)
  }

  async function install() {
    if (!deferredEvt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (deferredEvt as any).prompt()
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position:     "fixed",
      bottom:       "calc(56px + env(safe-area-inset-bottom, 0px) + 8px)",
      left:         12,
      right:        12,
      zIndex:       400,
      background:   color.bg2,
      border:       `1px solid ${color.bd2}`,
      borderRadius: radius.xl,
      padding:      "14px 16px",
      display:      "flex",
      gap:          12,
      alignItems:   "center",
      boxShadow:    "0 8px 32px rgba(0,0,0,0.56)",
    }}>
      {/* Icon */}
      <div style={{
        width:        40,
        height:       40,
        borderRadius: radius.md,
        background:   color.blue,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        flexShrink:   0,
        fontFamily:   SYS,
        fontSize:     20,
      }}>
        🏗️
      </div>

      {/* Copy */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t1, marginBottom: 2 }}>
          Install ConstructAIQ
        </div>
        {isIOS ? (
          <div style={{ fontFamily: SYS, fontSize: 11, color: color.t3, lineHeight: 1.5 }}>
            Tap <strong style={{ color: color.t1 }}>Share</strong> › <strong style={{ color: color.t1 }}>Add to Home Screen</strong>
          </div>
        ) : (
          <div style={{ fontFamily: SYS, fontSize: 11, color: color.t3 }}>
            Free. Works offline. No account needed.
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {!isIOS && (
          <button
            onClick={install}
            style={{
              background:   color.blue,
              color:        color.t1,
              fontFamily:   SYS,
              fontSize:     13,
              fontWeight:   600,
              padding:      "7px 14px",
              borderRadius: radius.md,
              minHeight:    36,
              border:       "none",
              cursor:       "pointer",
            }}
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          style={{
            background:   "transparent",
            color:        color.t4,
            fontFamily:   MONO,
            fontSize:     11,
            padding:      "7px 10px",
            borderRadius: radius.md,
            minHeight:    36,
            border:       `1px solid ${color.bd1}`,
            cursor:       "pointer",
          }}
        >
          {isIOS ? "OK" : "Not now"}
        </button>
      </div>
    </div>
  )
}
