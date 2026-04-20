"use client"

import { useState } from "react"
import { color, font } from "@/lib/theme"

interface ExportBarProps {
  onCSV?: () => void
  onPNG?: () => void
  shareUrl?: string
  label?: string
}

interface ExportButtonProps {
  label: string
  onClick?: () => void
  disabled: boolean
  children: React.ReactNode
}

function ExportButton({ label, onClick, disabled, children }: ExportButtonProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={label}
      style={{
        fontFamily: font.mono,
        fontSize: 11,
        color: hovered && !disabled ? color.t1 : color.t4,
        background: "transparent",
        border: `1px solid ${color.bd1}`,
        borderRadius: 6,
        padding: "3px 10px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "color 0.15s",
        lineHeight: 1.6,
      }}
    >
      {children}
    </button>
  )
}

export function ExportBar({ onCSV, onPNG, shareUrl, label }: ExportBarProps) {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      {label && (
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            color: color.t4,
            marginRight: 4,
          }}
        >
          {label}
        </span>
      )}
      <ExportButton label="Export CSV" onClick={onCSV} disabled={!onCSV}>
        CSV
      </ExportButton>
      <ExportButton label="Export PNG" onClick={onPNG} disabled={!onPNG}>
        PNG
      </ExportButton>
      <ExportButton
        label="Copy share link"
        onClick={handleShare}
        disabled={!shareUrl}
      >
        {copied ? "✓ Copied" : "Share"}
      </ExportButton>
    </div>
  )
}
