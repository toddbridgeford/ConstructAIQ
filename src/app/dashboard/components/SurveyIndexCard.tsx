"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { color, font, radius } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

interface SurveyData {
  quarter: string
  respondent_count: number
  closes_at: string
  collecting: boolean
  backlog_net: number | null
  margin_net: number | null
  labor_net: number | null
  market_net: number | null
  backlog_qoq: number | null
  margin_qoq: number | null
  labor_qoq: number | null
  market_qoq: number | null
}

function netColor(n: number | null): string {
  if (n === null) return color.t4
  if (n > 15)  return color.green
  if (n < -5)  return color.red
  return color.amber
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch { return iso }
}

function ScoreCell({
  label, abbr, score, qoq,
}: { label: string; abbr: string; score: number | null; qoq: number | null }) {
  const col = netColor(score)
  return (
    <div style={{ flex: "1 1 0", minWidth: 0, textAlign: "center", padding: "0 8px" }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.1em", marginBottom: 5 }}>
        {abbr}
      </div>
      <div style={{
        fontFamily: SYS,
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: "-0.03em",
        color: score !== null ? col : color.t4,
        lineHeight: 1,
        marginBottom: 3,
      }}>
        {score !== null ? (score > 0 ? "+" : "") + score : "—"}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 10, color: color.t4, lineHeight: 1.3 }}>{label}</div>
      {qoq !== null && score !== null && (
        <div style={{
          fontFamily: MONO, fontSize: 9, marginTop: 3,
          color: qoq > 0 ? color.green : qoq < 0 ? color.red : color.t4,
        }}>
          {qoq > 0 ? "▲" : qoq < 0 ? "▼" : "—"} {Math.abs(qoq)}
        </div>
      )}
    </div>
  )
}

export function SurveyIndexCard() {
  const [data, setData]   = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/survey/results")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const isCollecting = data?.collecting !== false
  const hasScores    = !isCollecting && data?.backlog_net !== null

  return (
    <div style={{
      background: color.bg2,
      border: `1px solid ${color.bd1}`,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20,
    }}>
      {/* Header row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: `1px solid ${color.bd1}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: color.t1 }}>
                Proprietary GC Survey
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 9, color: color.amber,
                background: color.amber + "22",
                border: `1px solid ${color.amber}44`,
                borderRadius: 4, padding: "2px 7px",
                letterSpacing: "0.08em",
              }}>
                PRIMARY SOURCE
              </span>
            </div>
            <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4 }}>
              {loading ? "Loading…" : (
                isCollecting
                  ? `${data?.quarter ?? "Q2 2025"} · ${data?.respondent_count ?? 0} responses so far · Results ${fmtDate(data?.closes_at ?? "")}`
                  : `${data?.quarter ?? ""} · ${data?.respondent_count?.toLocaleString() ?? 0} respondents`
              )}
            </div>
          </div>
        </div>

        <Link href="/survey/results">
          <button style={{
            background: "transparent",
            border: `1px solid ${color.bd1}`,
            borderRadius: radius.sm,
            color: color.t3,
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.08em",
            padding: "5px 10px",
            minHeight: 30,
            cursor: "pointer",
            flexShrink: 0,
          }}>
            VIEW RESULTS →
          </button>
        </Link>
      </div>

      {/* Score grid or collecting state */}
      {loading ? (
        <div style={{ padding: "20px 18px", fontFamily: MONO, fontSize: 11, color: color.t4 }}>
          Loading survey data…
        </div>
      ) : hasScores ? (
        <div style={{
          display: "flex", padding: "18px 10px",
          borderBottom: `1px solid ${color.bd1}`,
        }}>
          <ScoreCell label="Backlog"  abbr="BOI" score={data!.backlog_net} qoq={data!.backlog_qoq} />
          <div style={{ width: 1, background: color.bd1, flexShrink: 0 }} />
          <ScoreCell label="Margins"  abbr="MEI" score={data!.margin_net}  qoq={data!.margin_qoq} />
          <div style={{ width: 1, background: color.bd1, flexShrink: 0 }} />
          <ScoreCell label="Labor"    abbr="LAI" score={data!.labor_net}   qoq={data!.labor_qoq} />
          <div style={{ width: 1, background: color.bd1, flexShrink: 0 }} />
          <ScoreCell label="Market"   abbr="MOI" score={data!.market_net}  qoq={data!.market_qoq} />
        </div>
      ) : (
        <div style={{
          padding: "16px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3 }}>
            {data?.quarter ?? "Q2 2025"} survey open ·{" "}
            <strong style={{ color: color.amber }}>{data?.respondent_count ?? 0}</strong>{" "}
            responses so far · Results publish{" "}
            {fmtDate(data?.closes_at ?? "")}
          </div>
          <Link href="/survey">
            <button style={{
              background: color.blue + "22",
              border: `1px solid ${color.blue}44`,
              borderRadius: radius.sm,
              color: color.blue,
              fontFamily: SYS,
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              minHeight: 32,
              cursor: "pointer",
            }}>
              Take Survey →
            </button>
          </Link>
        </div>
      )}

      {/* Scale note */}
      <div style={{ padding: "8px 18px" }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.06em" }}>
          NET SCORE SCALE: −100 (all negative) → 0 (neutral) → +100 (all positive) · NOT AVAILABLE FROM ANY PUBLIC API
        </span>
      </div>
    </div>
  )
}
