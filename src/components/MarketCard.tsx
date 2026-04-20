"use client"

import { useState } from "react"
import Link from "next/link"
import { color, font } from "@/lib/theme"
import { SignalBadge } from "./SignalBadge"

interface MetricItem {
  label: string
  value: string
  trend?: "up" | "down" | "flat"
}

interface MarketCardProps {
  market: string
  grade: string
  score: number
  classification: string
  metrics: MetricItem[]
  onClick?: () => void
  href?: string
  compact?: boolean
}

function getGradeColor(grade: string): string {
  const g = grade.charAt(0).toUpperCase()
  switch (g) {
    case "A": return color.green
    case "B": return color.blue
    case "C": return color.amber
    default:  return color.red
  }
}

function TrendArrow({ trend }: { trend?: "up" | "down" | "flat" }) {
  if (trend === "up")   return <span style={{ color: color.green }}>▲</span>
  if (trend === "down") return <span style={{ color: color.red }}>▼</span>
  return <span style={{ color: color.t4 }}>—</span>
}

interface CardInnerProps {
  market: string
  grade: string
  score: number
  classification: string
  metrics: MetricItem[]
  compact: boolean
}

function CardInner({
  market,
  grade,
  score,
  classification,
  metrics,
  compact,
}: CardInnerProps) {
  const gradeColor = getGradeColor(grade)
  const barColor = getGradeColor(grade)
  const clamped = Math.min(100, Math.max(0, score))

  return (
    <>
      {/* Top row: market name + grade */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: font.sys,
            fontWeight: 700,
            fontSize: compact ? 13 : 15,
            color: color.t1,
            lineHeight: 1.3,
          }}
        >
          {market}
        </span>
        <span
          style={{
            fontFamily: font.mono,
            fontSize: compact ? 16 : 22,
            fontWeight: 700,
            color: gradeColor,
            lineHeight: 1,
          }}
        >
          {grade}
        </span>
      </div>

      {/* Classification badge */}
      <div style={{ marginBottom: 8 }}>
        <SignalBadge signal={classification} size="sm" />
      </div>

      {/* Score bar */}
      <div
        style={{
          background: color.bg3,
          borderRadius: 2,
          height: 3,
          marginTop: 8,
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: barColor,
            height: "100%",
            width: `${clamped}%`,
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Metric chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {metrics.slice(0, 3).map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: color.bg2,
              border: `1px solid ${color.bd1}`,
              borderRadius: 8,
              padding: "4px 10px",
              fontFamily: font.mono,
              fontSize: 10,
              color: color.t3,
            }}
          >
            <span style={{ color: color.t4 }}>{m.label}</span>
            <span style={{ color: color.t2, marginLeft: 2 }}>{m.value}</span>
            {m.trend !== undefined && (
              <span style={{ marginLeft: 2 }}>
                <TrendArrow trend={m.trend} />
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export function MarketCard({
  market,
  grade,
  score,
  classification,
  metrics,
  onClick,
  href,
  compact = false,
}: MarketCardProps) {
  const [hovered, setHovered] = useState(false)
  const interactive = !!(onClick || href)
  const padding = compact ? 16 : 20

  const cardStyle: React.CSSProperties = {
    background: color.bg1,
    border: `1px solid ${interactive && hovered ? color.bd3 : color.bd1}`,
    borderRadius: 16,
    padding,
    cursor: interactive ? "pointer" : "default",
    transition: "border-color 0.15s",
    display: "block",
    textDecoration: "none",
    color: "inherit",
  }

  const inner = (
    <CardInner
      market={market}
      grade={grade}
      score={score}
      classification={classification}
      metrics={metrics}
      compact={compact}
    />
  )

  if (href) {
    return (
      <Link
        href={href}
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {inner}
      </Link>
    )
  }

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {inner}
    </div>
  )
}
