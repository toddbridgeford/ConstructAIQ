"use client"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { font, color } from "@/lib/theme"
import { SatelliteHeatmap } from "../dashboard/components/SatelliteHeatmap"
import type { FusionMsa } from "../dashboard/components/FusionMap"

const SYS  = font.sys
const MONO = font.mono

const FusionMap = dynamic(
  () => import("../dashboard/components/FusionMap").then(m => ({ default: m.FusionMap })),
  { ssr: false, loading: () => (
    <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 12, color: color.t4 }}>
      Loading map…
    </div>
  )},
)

interface FusionResponse {
  processing_status: "live" | "pending_first_run"
  msas: FusionMsa[]
  last_processed?: string
  msa_count?: number
}

export default function GroundSignalPage() {
  const [fusion,      setFusion]      = useState<FusionResponse | null>(null)
  const [selectedMsa, setSelectedMsa] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/fusion/msa")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setFusion(d) })
      .catch(() => {})
  }, [])

  const msas     = fusion?.msas ?? []
  const isLive   = fusion?.processing_status === "live" && msas.length > 0

  return (
    <div style={{ minHeight: "100vh", background: color.bg0, color: color.t1, fontFamily: SYS }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} a{color:inherit;text-decoration:none}`}</style>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        background: `${color.bg1}f0`, backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${color.bd1}`,
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/">
          <Image src="/ConstructAIQWhiteLogo.svg" width={110} height={22} alt="ConstructAIQ" style={{ height: 22, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/dashboard" style={{ fontFamily: SYS, fontSize: 14, color: color.t3 }}>Dashboard</Link>
          <Link href="/methodology" style={{ fontFamily: SYS, fontSize: 14, color: color.t3 }}>Methodology</Link>
          <Link href="/api-access" style={{ fontFamily: SYS, fontSize: 14, color: color.amber }}>Free API</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.amber, letterSpacing: "0.12em", marginBottom: 10 }}>
            SENTINEL-2 · WEEKLY · 20 US MARKETS
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.03em", color: color.t1, marginBottom: 12, lineHeight: 1.1 }}>
            Ground Signal Intelligence
          </h1>
          <p style={{ fontSize: 17, color: color.t3, lineHeight: 1.6, maxWidth: 600 }}>
            Satellite-detected US construction activity — free, weekly, from orbit.
            BSI (Bare Soil Index) measures ground disturbance 3–6 months ahead of Census permit data.
          </p>
          {isLive && fusion?.last_processed && (
            <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, marginTop: 12 }}>
              Last processed: {fusion.last_processed} · {fusion.msa_count} markets
            </div>
          )}
        </div>

        {/* Fusion Map */}
        <div style={{ background: color.bg1, borderRadius: 20, border: `1px solid ${color.bd1}`, padding: "24px 28px", marginBottom: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 16 }}>
            SIGNAL FUSION MAP — BSI · FEDERAL AWARDS · NOAA STORM EVENTS
          </div>
          {isLive
            ? <FusionMap msas={msas} />
            : (
              <div style={{ height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: color.amber, letterSpacing: "0.1em" }}>
                  {fusion === null ? "LOADING…" : "PENDING FIRST RUN"}
                </div>
                <div style={{ fontFamily: SYS, fontSize: 14, color: color.t3, textAlign: "center", maxWidth: 420 }}>
                  {fusion === null
                    ? "Fetching satellite data…"
                    : "The satellite pipeline has not run yet. BSI results appear after the first weekly GitHub Actions run."
                  }
                </div>
              </div>
            )
          }
        </div>

        {/* Ranked MSA list */}
        {isLive && (
          <div style={{ background: color.bg1, borderRadius: 20, border: `1px solid ${color.bd1}`, padding: "24px 28px", marginBottom: 32 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 20 }}>
              RANKED BY ACTIVITY — 90-DAY BSI CHANGE
            </div>
            <SatelliteHeatmap
              msas={msas}
              selectedMsa={selectedMsa}
              onMsaClick={code => setSelectedMsa(prev => prev === code ? null : code)}
            />
          </div>
        )}

        {/* Attribution */}
        <div style={{ fontFamily: SYS, fontSize: 12, color: color.t4, lineHeight: 1.8, borderTop: `1px solid ${color.bd1}`, paddingTop: 24 }}>
          <div style={{ marginBottom: 4 }}>
            <strong style={{ color: color.t3 }}>Data sources:</strong>{" "}
            ESA Copernicus Sentinel-2 L2A via Copernicus Data Space · NOAA Weather Alerts API ·
            IIJA/IRA federal construction awards via USASpending.gov
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong style={{ color: color.t3 }}>Update frequency:</strong> Weekly (every Sunday 02:00 UTC via GitHub Actions)
          </div>
          <div>
            <a href="/methodology" style={{ color: color.amber }}>Full methodology</a>
            {" · "}
            <a href="/api-access" style={{ color: color.amber }}>Free API access</a>
            {" · "}
            <a href="/dashboard" style={{ color: color.t3 }}>Full dashboard</a>
          </div>
        </div>
      </main>
    </div>
  )
}
