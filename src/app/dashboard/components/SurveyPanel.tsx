"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { color, font, radius } from "@/lib/theme"
import { SurveyIndexCard, type SurveyResults } from "./SurveyIndexCard"
import { SurveyDistribution } from "./SurveyDistribution"
import { SurveyTrendChart } from "./SurveyTrendChart"

const SYS  = font.sys
const MONO = font.mono

interface TrendPoint {
  quarter: string
  backlog_net: number
  margin_net:  number
  labor_net:   number
  market_net:  number
}

const DIST_LABELS = [
  "Very Negative",
  "Negative",
  "Neutral",
  "Positive",
  "Very Positive",
]

const DIST_QUESTIONS = [
  { key: "backlog_dist",  label: "Backlog Outlook (BOI)" },
  { key: "margin_dist",   label: "Margin Outlook (MEI)" },
  { key: "labor_dist",    label: "Labor Availability (LAI)" },
  { key: "market_dist",   label: "Market Outlook (MOI)" },
]

export function SurveyPanel() {
  const [results,  setResults]  = useState<SurveyResults | null>(null)
  const [trend,    setTrend]    = useState<TrendPoint[]>([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [rRes, tRes] = await Promise.all([
          fetch("/api/survey/results"),
          fetch("/api/survey/trend"),
        ])
        if (!active) return
        if (rRes.ok) setResults(await rRes.json())
        if (tRes.ok) {
          const t = await tRes.json()
          setTrend(Array.isArray(t) ? t : t.data ?? [])
        }
      } catch { /* leave null — no crash */ } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const isCollecting = results?.collecting !== false
  const hasDetail    = !isCollecting && results?.backlog_dist

  return (
    <div style={{
      background: color.bg2,
      border: `1px solid ${color.bd1}`,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20,
    }}>
      {/* Index card — always visible */}
      <SurveyIndexCard results={results} loading={loading} />

      {/* Expand toggle — only when published data exists */}
      {hasDetail && (
        <div style={{
          borderTop: `1px solid ${color.bd1}`,
          padding: "0 18px",
        }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: "transparent",
              border: "none",
              fontFamily: SYS, fontSize: 12,
              color: color.blue,
              padding: "10px 0",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span style={{
              fontFamily: MONO, fontSize: 10,
              display: "inline-block",
              transform: expanded ? "rotate(90deg)" : "none",
              transition: "transform 0.2s",
            }}>▶</span>
            {expanded ? "Hide detail" : "Show detail"}
          </button>
        </div>
      )}

      {/* Collecting CTA */}
      {isCollecting && !loading && (
        <div style={{
          borderTop: `1px solid ${color.bd1}`,
          padding: "12px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
        }}>
          <span style={{ fontFamily: SYS, fontSize: 12, color: color.t4 }}>
            Your firm's data shapes the index. Responses close {results?.closes_at
              ? new Date(results.closes_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "soon"}.
          </span>
          <Link href="/survey">
            <button style={{
              background: color.amber + "22",
              border: `1px solid ${color.amber}44`,
              borderRadius: radius.sm,
              color: color.amber,
              fontFamily: SYS, fontSize: 12, fontWeight: 600,
              padding: "6px 14px", minHeight: 32, cursor: "pointer",
              whiteSpace: "nowrap",
            }}>
              Take the survey →
            </button>
          </Link>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && hasDetail && (
        <div style={{
          borderTop: `1px solid ${color.bd1}`,
          padding: "20px 18px",
          display: "flex", flexDirection: "column", gap: 20,
        }}>
          {/* Distribution bars */}
          {DIST_QUESTIONS.map(({ key, label }) => {
            const dist = (results as unknown as Record<string, Record<string, number>>)[key] ?? {}
            return (
              <SurveyDistribution
                key={key}
                question={label}
                distribution={dist}
                labels={DIST_LABELS}
              />
            )
          })}

          {/* Trend chart */}
          {trend.length >= 2 && (
            <SurveyTrendChart data={trend} />
          )}
        </div>
      )}
    </div>
  )
}
