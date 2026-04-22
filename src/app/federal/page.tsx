"use client"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { font, color } from "@/lib/theme"
import { FederalPrograms }  from "@/app/dashboard/components/FederalPrograms"
import { FederalLeaderboard } from "@/app/dashboard/components/FederalLeaderboard"
import { FederalStateTable }  from "@/app/dashboard/components/FederalStateTable"
import { SolicitationsTable } from "@/app/dashboard/components/SolicitationsTable"

const SYS  = font.sys
const MONO = font.mono

type AnyData = Record<string, unknown>

function Skeleton({ h = 200 }: { h?: number }) {
  return (
    <div style={{
      width: "100%", height: h,
      background: color.bg2, borderRadius: 12,
      animation: "pulse 1.4s ease-in-out infinite",
    }} />
  )
}

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      flex: "1 1 180px",
      background: color.bg1,
      border: `1px solid ${color.bd1}`,
      borderRadius: 14, padding: "20px 24px",
    }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: SYS, fontSize: 28, fontWeight: 700, color: color.t1, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  )
}

export default function FederalPage() {
  const [data, setData] = useState<AnyData | null>(null)
  const [err,  setErr]  = useState(false)

  useEffect(() => {
    fetch("/api/federal")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setData(d))
      .catch(() => setErr(true))
  }, [])

  const programs         = (data?.programs         as AnyData[] | undefined) ?? []
  const agencies         = (data?.agencies          as AnyData[] | undefined) ?? []
  const contractors      = (data?.contractors       as AnyData[] | undefined) ?? []
  const stateAllocations = (data?.stateAllocations  as AnyData[] | undefined) ?? []
  const solicitations    = (data?.solicitations     as AnyData[] | undefined) ?? []

  const totalAuth = typeof data?.totalAuthorized === "number" ? data.totalAuthorized as number : null
  const totalObl  = typeof data?.totalObligated  === "number" ? data.totalObligated  as number : null
  const totalSpent = typeof data?.totalSpent     === "number" ? data.totalSpent      as number : null

  function fmtB(v: number) {
    return `$${(v / 1000).toFixed(1)}B`
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: color.bg0,
      color: color.t1,
      fontFamily: SYS,
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        button{outline:none;font-family:inherit;cursor:pointer;border:none}
        button:hover{opacity:.85}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: color.bg1 + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${color.bd1}`,
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <Image src="/ConstructAIQWhiteLogo.svg" width={120} height={24} alt="ConstructAIQ"
              style={{ height: 24, width: "auto" }} />
          </Link>
          <div style={{ width: 1, height: 24, background: color.bd1 }} />
          <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.1em" }}>
            FEDERAL PIPELINE
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            fontFamily: MONO, fontSize: 9, color: color.green,
            animation: "pulse 2s ease-in-out infinite",
          }}>● LIVE</span>
          <Link href="/dashboard">
            <button style={{
              background: "transparent", color: color.t3,
              fontFamily: MONO, fontSize: 12,
              padding: "8px 14px", borderRadius: 8,
              border: `1px solid ${color.bd1}`, minHeight: 36,
            }}>DASHBOARD</button>
          </Link>
          <Link href="/api-access">
            <button style={{
              background: color.amber, color: "#000",
              fontFamily: MONO, fontSize: 12, fontWeight: 700,
              padding: "8px 16px", borderRadius: 8,
              letterSpacing: "0.06em", minHeight: 36,
            }}>FREE API →</button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ padding: "52px 0 40px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: color.amberDim, border: `1px solid ${color.amber}44`,
            borderRadius: 20, padding: "5px 14px", marginBottom: 20,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.amber, letterSpacing: "0.08em" }}>
              FREE · PUBLIC · OPEN DATA
            </span>
          </div>
          <h1 style={{
            fontFamily: SYS, fontSize: 36, fontWeight: 700, color: color.t1,
            marginBottom: 12, lineHeight: 1.2, letterSpacing: "-0.02em",
          }}>
            Federal Infrastructure Pipeline
          </h1>
          <p style={{
            fontFamily: SYS, fontSize: 16, color: color.t3,
            lineHeight: 1.6, maxWidth: 600,
          }}>
            Live tracking of IIJA and IRA program execution, agency velocity,
            contractor leaderboard, and active federal bid opportunities from SAM.gov.
            All data is public — updated continuously.
          </p>
        </div>

        {/* ── KPI ROW ── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 36 }}>
          {data ? (
            <>
              <KPICard
                label="TOTAL AUTHORIZED"
                value={totalAuth != null ? fmtB(totalAuth) : "—"}
                sub="IIJA + IRA + DoD"
              />
              <KPICard
                label="OBLIGATED"
                value={totalObl != null ? fmtB(totalObl) : "—"}
                sub={totalAuth && totalObl ? `${((totalObl / totalAuth) * 100).toFixed(0)}% of authorized` : undefined}
              />
              <KPICard
                label="SPENT / DISBURSED"
                value={totalSpent != null ? fmtB(totalSpent) : "—"}
                sub={totalObl && totalSpent ? `${((totalSpent / totalObl) * 100).toFixed(0)}% of obligated` : undefined}
              />
              <KPICard
                label="ACTIVE SOLICITATIONS"
                value={String(solicitations.length)}
                sub="NAICS 236 · 237 · 238"
              />
            </>
          ) : (
            <>
              <Skeleton h={96} />
              <Skeleton h={96} />
              <Skeleton h={96} />
              <Skeleton h={96} />
            </>
          )}
        </div>

        {err && (
          <div style={{
            padding: "16px 20px", marginBottom: 24,
            background: color.redDim, border: `1px solid ${color.red}44`,
            borderRadius: 10, fontFamily: SYS, fontSize: 13, color: color.red,
          }}>
            Failed to load federal data. Please try refreshing.
          </div>
        )}

        {/* ── PROGRAM EXECUTION ── */}
        <section style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, color: color.t4,
            letterSpacing: "0.1em", marginBottom: 14,
          }}>
            PROGRAM EXECUTION · IIJA · IRA · DoD
          </div>
          {data ? <FederalPrograms programs={programs as unknown as Parameters<typeof FederalPrograms>[0]["programs"]} />
                : <Skeleton h={340} />}
        </section>

        {/* ── LEADERBOARD + STATE TABLE ── */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
          <div style={{ flex: "2 1 480px" }}>
            <div style={{
              fontFamily: MONO, fontSize: 10, color: color.t4,
              letterSpacing: "0.1em", marginBottom: 14,
            }}>
              CONTRACTOR LEADERBOARD
            </div>
            {data
              ? <FederalLeaderboard contractors={contractors as unknown as Parameters<typeof FederalLeaderboard>[0]["contractors"]} />
              : <Skeleton h={320} />}
          </div>
        </div>

        {/* ── STATE ALLOCATIONS ── */}
        <section style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, color: color.t4,
            letterSpacing: "0.1em", marginBottom: 14,
          }}>
            STATE ALLOCATION TRACKER
          </div>
          {data
            ? <FederalStateTable stateAllocations={stateAllocations as unknown as Parameters<typeof FederalStateTable>[0]["stateAllocations"]} />
            : <Skeleton h={400} />}
        </section>

        {/* ── SAM.GOV SOLICITATIONS ── */}
        <section style={{ marginBottom: 32 }}>
          <SolicitationsTable solicitations={solicitations as unknown as Parameters<typeof SolicitationsTable>[0]["solicitations"]} />
          {!data && <Skeleton h={300} />}
        </section>

        {/* ── DATA ATTRIBUTION ── */}
        <div style={{
          marginBottom: 48,
          padding: "16px 20px",
          background: color.bg1,
          border: `1px solid ${color.bd1}`,
          borderRadius: 12,
          display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center",
        }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em" }}>
            DATA SOURCES
          </div>
          {["SAM.gov — Active Solicitations", "USASpending.gov — Program Execution", "IIJA (2021)", "IRA (2022)", "DoD MILCON"].map(src => (
            <span key={src} style={{ fontFamily: SYS, fontSize: 13, color: color.t3 }}>{src}</span>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${color.bd1}`,
        padding: "28px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <Image src="/ConstructAIQWhiteLogo.svg" width={100} height={20} alt="ConstructAIQ"
          style={{ height: 18, width: "auto" }} />
        <div style={{ fontFamily: SYS, fontSize: 13, color: color.t4 }}>
          Free public data · constructaiq.trade ·{" "}
          <Link href="/methodology" style={{ color: color.amber }}>Open methodology</Link>
        </div>
      </footer>
    </div>
  )
}
