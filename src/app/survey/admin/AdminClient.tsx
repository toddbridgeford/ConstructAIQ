"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { color, font, radius, type as typeScale } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

interface Period {
  id: number
  quarter: string
  opens_at: string
  closes_at: string
  is_active: boolean
  published_at: string | null
  response_count: number
  has_results: boolean
}

interface Props {
  periods: Period[]
  current: Period | null
  cronSecret: string
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch { return iso }
}

function StatusBadge({ p }: { p: Period }) {
  const label = p.has_results ? "Published" : p.is_active ? "Open" : "Closed"
  const col   = p.has_results ? color.green   : p.is_active ? color.amber  : color.t4
  return (
    <span style={{
      fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em",
      color: col, background: col + "22",
      border: `1px solid ${col}44`,
      borderRadius: radius.sm, padding: "2px 8px",
    }}>
      {label.toUpperCase()}
    </span>
  )
}

function ActionButton({
  label, onClick, loading, color: col = color.blue, disabled = false,
}: { label: string; onClick: () => void; loading: boolean; color?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        background: disabled ? color.bg3 : col + "22",
        border: `1px solid ${disabled ? color.bd1 : col + "55"}`,
        color: disabled ? color.t4 : col,
        fontFamily: SYS, fontSize: 13, fontWeight: 600,
        padding: "8px 18px", borderRadius: radius.md,
        minHeight: 36, cursor: loading || disabled ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1, transition: "opacity 0.15s",
      }}
    >
      {loading ? "Working…" : label}
    </button>
  )
}

export function SurveyAdminClient({ periods, current, cronSecret }: Props) {
  const [inviting,    setInviting]    = useState(false)
  const [publishing,  setPublishing]  = useState(false)
  const [inviteResult, setInviteResult]   = useState<string | null>(null)
  const [publishResult, setPublishResult] = useState<string | null>(null)

  async function sendInvitations() {
    setInviting(true)
    setInviteResult(null)
    try {
      const res = await fetch("/api/survey/invite", {
        headers: { Authorization: `Bearer ${cronSecret}` },
      })
      const data = await res.json()
      if (res.ok) {
        setInviteResult(`✓ Sent ${data.sent} invitations. ${data.already_responded} already responded. (${data.total} total subscribers)`)
      } else {
        setInviteResult(`✗ ${data.error}`)
      }
    } catch {
      setInviteResult("✗ Network error")
    } finally {
      setInviting(false)
    }
  }

  async function publishResults() {
    if (!current) return
    setPublishing(true)
    setPublishResult(null)
    try {
      const res = await fetch("/api/survey/aggregate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quarter: current.quarter }),
      })
      const data = await res.json()
      if (res.ok) {
        setPublishResult(`✓ Published ${current.quarter} results. ${data.respondent_count} respondents. BOI: ${data.backlog_net > 0 ? "+" : ""}${data.backlog_net}`)
      } else if (res.status === 422) {
        setPublishResult(`✗ Insufficient responses: ${data.count}/${data.required} required.`)
      } else {
        setPublishResult(`✗ ${data.error}`)
      }
    } catch {
      setPublishResult("✗ Network error")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: color.bg0,
      color: color.t1,
      fontFamily: SYS,
      paddingBottom: 64,
    }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} a{color:inherit;text-decoration:none} button{font-family:inherit;cursor:pointer;border:none;outline:none}`}</style>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: color.bg1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${color.bd1}`,
        height: 60, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ" style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 20, background: color.bd1 }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: color.amber, letterSpacing: "0.1em" }}>SURVEY ADMIN</span>
        </div>
        <Link href="/survey/results">
          <button style={{ background: "transparent", border: `1px solid ${color.bd1}`, borderRadius: radius.sm, color: color.t3, fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", padding: "6px 12px", minHeight: 36 }}>
            VIEW RESULTS →
          </button>
        </Link>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px" }}>

        {/* Header */}
        <div style={{ paddingTop: 44, paddingBottom: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.12em", marginBottom: 8 }}>INTERNAL OPERATIONS</div>
          <h1 style={{ ...typeScale.h3, color: color.t1, marginBottom: 8 }}>Survey Administration</h1>
          <p style={{ ...typeScale.bodySm, color: color.t4 }}>Access this page at /survey/admin · Requires admin_token cookie</p>
        </div>

        {/* Current period */}
        {current && (
          <div style={{ background: color.bg1, border: `1px solid ${color.bd1}`, borderRadius: radius.lg, padding: "24px 28px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <h2 style={{ fontFamily: SYS, fontSize: 18, fontWeight: 700, color: color.t1 }}>{current.quarter}</h2>
                  <StatusBadge p={current} />
                </div>
                <div style={{ fontFamily: SYS, fontSize: 13, color: color.t3 }}>
                  Opens {fmtDate(current.opens_at)} · Closes {fmtDate(current.closes_at)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: SYS, fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", color: color.amber, lineHeight: 1 }}>
                  {current.response_count}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", marginTop: 4 }}>RESPONSES</div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <ActionButton
                label="Send Invitations"
                onClick={sendInvitations}
                loading={inviting}
                color={color.blue}
                disabled={!current.is_active}
              />
              <ActionButton
                label="Publish Results"
                onClick={publishResults}
                loading={publishing}
                color={color.green}
                disabled={current.has_results}
              />
              <Link href="/survey/results">
                <button style={{
                  background: "transparent",
                  border: `1px solid ${color.bd1}`,
                  color: color.t3,
                  fontFamily: MONO, fontSize: 11, letterSpacing: "0.07em",
                  padding: "8px 16px", borderRadius: radius.md, minHeight: 36,
                }}>
                  VIEW RESULTS PAGE →
                </button>
              </Link>
            </div>

            {/* Result messages */}
            {inviteResult && (
              <div style={{
                marginTop: 16,
                fontFamily: SYS, fontSize: 13,
                color: inviteResult.startsWith("✓") ? color.green : color.red,
                background: inviteResult.startsWith("✓") ? color.greenDim : color.redDim,
                border: `1px solid ${inviteResult.startsWith("✓") ? color.green : color.red}33`,
                borderRadius: radius.md, padding: "10px 14px",
              }}>
                {inviteResult}
              </div>
            )}
            {publishResult && (
              <div style={{
                marginTop: 12,
                fontFamily: SYS, fontSize: 13,
                color: publishResult.startsWith("✓") ? color.green : color.red,
                background: publishResult.startsWith("✓") ? color.greenDim : color.redDim,
                border: `1px solid ${publishResult.startsWith("✓") ? color.green : color.red}33`,
                borderRadius: radius.md, padding: "10px 14px",
              }}>
                {publishResult}
              </div>
            )}
          </div>
        )}

        {/* Period history */}
        <div style={{ background: color.bg1, border: `1px solid ${color.bd1}`, borderRadius: radius.lg, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${color.bd1}` }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.08em" }}>QUARTER HISTORY</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${color.bd1}` }}>
                {["Quarter", "Closes", "Responses", "Status", ""].map(h => (
                  <th key={h} style={{
                    fontFamily: MONO, fontSize: 10, color: color.t4,
                    letterSpacing: "0.08em", padding: "10px 16px",
                    textAlign: h === "Responses" ? "right" : "left",
                    fontWeight: 600,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < periods.length - 1 ? `1px solid ${color.bd1}` : "none" }}>
                  <td style={{ fontFamily: SYS, fontSize: 14, fontWeight: 600, color: color.t1, padding: "12px 16px" }}>{p.quarter}</td>
                  <td style={{ fontFamily: MONO, fontSize: 12, color: color.t3, padding: "12px 16px" }}>{fmtDate(p.closes_at)}</td>
                  <td style={{ fontFamily: MONO, fontSize: 14, color: color.amber, padding: "12px 16px", textAlign: "right" }}>{p.response_count}</td>
                  <td style={{ padding: "12px 16px" }}><StatusBadge p={p} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.has_results && (
                      <Link href={`/survey/results?quarter=${encodeURIComponent(p.quarter)}`}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: color.blue, letterSpacing: "0.08em" }}>RESULTS →</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {periods.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ fontFamily: SYS, fontSize: 13, color: color.t4, padding: "20px 16px", textAlign: "center" }}>
                    No survey periods found. Run schema.sql against Supabase to seed Q2 2025.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: 24, padding: "16px 20px", background: color.bg2, border: `1px solid ${color.bd1}`, borderRadius: radius.md }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 10 }}>HOW TO SET THE admin_token COOKIE</div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: color.t3, lineHeight: 1.8 }}>
            In your browser devtools console (Application → Cookies):<br />
            <span style={{ color: color.green }}>document.cookie = &quot;admin_token=YOUR_CRON_SECRET; path=/&quot;</span><br />
            Then reload this page. The cookie is session-scoped and cleared on browser close.
          </div>
        </div>

      </div>
    </div>
  )
}
