"use client"
import Link from "next/link"
import { color, font, radius } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

export interface SurveyResults {
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
  backlog_dist: Record<string, number>
  margin_dist: Record<string, number>
  labor_dist: Record<string, number>
  market_dist: Record<string, number>
  material_dist: Record<string, number>
}

interface Props {
  results: SurveyResults | null
  loading: boolean
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

type Interpretation = "broadly_optimistic" | "growth_with_pressure" | "contraction_signal" | "mixed"

function interpret(r: SurveyResults): { key: Interpretation; text: string } | null {
  const { backlog_net: b, margin_net: m, labor_net: l, market_net: mk } = r
  if (b === null || m === null || l === null || mk === null) return null
  if (b > 20 && m > 20 && l > 20 && mk > 20) return {
    key: "broadly_optimistic",
    text: "Broadly optimistic — all four indices net positive and above trend.",
  }
  if (b > 0 && m < 0) return {
    key: "growth_with_pressure",
    text: "Growth with pressure — backlog expanding while margins are under strain.",
  }
  if (b < 0 && m < 0 && l < 0 && mk < 0) return {
    key: "contraction_signal",
    text: "Contraction signal — all four indices net negative.",
  }
  return {
    key: "mixed",
    text: "Mixed conditions — sector indicators diverging without a dominant trend.",
  }
}

const INTERP_COLOR: Record<Interpretation, string> = {
  broadly_optimistic:  color.green,
  growth_with_pressure: color.amber,
  contraction_signal:  color.red,
  mixed:               color.t3,
}

export function SurveyIndexCard({ results, loading }: Props) {
  const isCollecting = results?.collecting !== false
  const hasScores    = !isCollecting && results?.backlog_net !== null
  const interp       = results && !isCollecting ? interpret(results) : null

  return (
    <div style={{
      background: color.bg2,
      border: `1px solid ${color.bd1}`,
      borderRadius: 16,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: `1px solid ${color.bd1}`,
      }}>
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
                ? `${results?.quarter ?? "Q2 2025"} · ${results?.respondent_count ?? 0} responses so far · Results ${fmtDate(results?.closes_at ?? "")}`
                : `${results?.quarter ?? ""} · ${results?.respondent_count?.toLocaleString() ?? 0} respondents`
            )}
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

      {/* Body */}
      {loading ? (
        <div style={{ padding: "20px 18px", fontFamily: MONO, fontSize: 11, color: color.t4 }}>
          Loading survey data…
        </div>
      ) : hasScores ? (
        <>
          <div style={{
            display: "flex", padding: "18px 10px",
            borderBottom: `1px solid ${color.bd1}`,
          }}>
            <ScoreCell label="Backlog"  abbr="BOI" score={results!.backlog_net} qoq={results!.backlog_qoq} />
            <div style={{ width: 1, background: color.bd1, flexShrink: 0 }} />
            <ScoreCell label="Margins"  abbr="MEI" score={results!.margin_net}  qoq={results!.margin_qoq} />
            <div style={{ width: 1, background: color.bd1, flexShrink: 0 }} />
            <ScoreCell label="Labor"    abbr="LAI" score={results!.labor_net}   qoq={results!.labor_qoq} />
            <div style={{ width: 1, background: color.bd1, flexShrink: 0 }} />
            <ScoreCell label="Market"   abbr="MOI" score={results!.market_net}  qoq={results!.market_qoq} />
          </div>
          {interp && (
            <div style={{
              padding: "8px 18px",
              borderBottom: `1px solid ${color.bd1}`,
              fontFamily: SYS, fontSize: 12,
              color: INTERP_COLOR[interp.key],
            }}>
              {interp.text}
            </div>
          )}
        </>
      ) : (
        <div style={{
          padding: "16px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3 }}>
            {results?.quarter ?? "Q2 2025"} survey open ·{" "}
            <strong style={{ color: color.amber }}>{results?.respondent_count ?? 0}</strong>{" "}
            responses so far · Results publish{" "}
            {fmtDate(results?.closes_at ?? "")}
          </div>
          <Link href="/survey">
            <button style={{
              background: color.blue + "22",
              border: `1px solid ${color.blue}44`,
              borderRadius: radius.sm,
              color: color.blue,
              fontFamily: SYS, fontSize: 12, fontWeight: 600,
              padding: "6px 14px", minHeight: 32, cursor: "pointer",
            }}>
              Take Survey →
            </button>
          </Link>
        </div>
      )}

      <div style={{ padding: "8px 18px" }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.06em" }}>
          NET SCORE SCALE: −100 (all negative) → 0 (neutral) → +100 (all positive) · NOT AVAILABLE FROM ANY PUBLIC API
        </span>
      </div>
    </div>
  )
}
