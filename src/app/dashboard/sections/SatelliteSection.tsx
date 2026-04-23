"use client"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { font, color } from "@/lib/theme"
import { Satellite } from "lucide-react"
import { SectionHeader } from "../components/SectionHeader"
import { SectionVerdict } from "../components/SectionVerdict"
import { EmptyState } from "@/app/components/ui/EmptyState"
import { FreshnessIndicator } from "@/app/components/ui/FreshnessIndicator"
import { SatelliteHeatmap, type SatelliteMsa } from "../components/SatelliteHeatmap"
import type { FusionMsa } from "../components/FusionMap"

const SYS  = font.sys
const MONO = font.mono

// FusionMap uses react-simple-maps — SSR-unsafe
const FusionMap = dynamic(
  () => import("../components/FusionMap").then(m => ({ default: m.FusionMap })),
  { ssr: false, loading: () => (
    <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 12, color: color.t4 }}>
      Loading map…
    </div>
  )},
)

interface SatelliteData {
  processing_status: "live" | "pending_first_run"
  msas: SatelliteMsa[]
  last_processed?: string
  msa_count?: number
  ranked_by_activity?: string[]
}

interface FusionData {
  processing_status: "live" | "pending_first_run"
  msas: FusionMsa[]
  msa_count?: number
}

interface Props {
  data: SatelliteData | null
}

type Tab = "ranking" | "fusion"

function Skeleton({ height }: { height: number }) {
  return (
    <div style={{
      height,
      background: `linear-gradient(90deg, ${color.bg2} 25%, ${color.bg3} 50%, ${color.bg2} 75%)`,
      backgroundSize: "200% 100%",
      borderRadius: 12,
      animation: "shimmer 1.8s ease-in-out infinite",
    }} />
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: MONO,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.05em",
        color: active ? color.t1 : color.t4,
        background: active ? color.bg3 : "transparent",
        border: `1px solid ${active ? color.bd2 : "transparent"}`,
        borderRadius: 8,
        padding: "6px 14px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )
}

export function SatelliteSection({ data }: Props) {
  const [selectedMsa, setSelectedMsa] = useState<string | null>(null)
  const [activeTab,   setActiveTab]   = useState<Tab>("ranking")
  const [fusionData,  setFusionData]  = useState<FusionData | null>(null)

  useEffect(() => {
    fetch("/api/fusion/msa")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setFusionData(d) })
      .catch(() => {})
  }, [])

  const msas      = data?.msas ?? []
  const isLoading = data === null
  const isPending = !isLoading && (data.processing_status === "pending_first_run" || msas.length === 0)

  const fusionMsas  = fusionData?.msas ?? []
  const fusionReady = fusionData !== null && fusionMsas.length > 0

  return (
    <section id="satellite" style={{ paddingTop: 48, paddingBottom: 8 }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

      <SectionHeader
        sectionId="07"
        title="Ground Signal Intelligence"
        badge="SENTINEL-2"
        subtitle="Satellite-detected construction activity · 20 US markets · Updated weekly"
        shareSection="satellite"
      />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <TabBtn label="Activity Ranking"  active={activeTab === "ranking"} onClick={() => setActiveTab("ranking")} />
        <TabBtn label="Signal Fusion Map" active={activeTab === "fusion"}  onClick={() => setActiveTab("fusion")}  />
      </div>

      <div style={{
        background: color.bg1, borderRadius: 20,
        border: `1px solid ${color.bd1}`, padding: "24px 28px",
      }}>
        {/* ── Activity Ranking tab ───────────────────────────────────── */}
        {activeTab === "ranking" && (
          <>
            {isLoading  && <Skeleton height={500} />}
            {!isLoading && isPending && (
              <EmptyState
                icon={<Satellite size={32} />}
                title="Satellite data pending"
                description="Sentinel-2 imagery is processed every Sunday at 2am UTC via GitHub Actions. First results appear after the Sunday workflow completes."
                action={{ label: "View satellite methodology", href: "/methodology#satellite" }}
              />
            )}
            {!isLoading && !isPending && (
              <SatelliteHeatmap
                msas={msas}
                selectedMsa={selectedMsa}
                onMsaClick={code => setSelectedMsa(prev => prev === code ? null : code)}
              />
            )}
          </>
        )}

        {/* ── Signal Fusion Map tab ──────────────────────────────────── */}
        {activeTab === "fusion" && (
          <>
            {!fusionReady && (
              fusionData === null
                ? <Skeleton height={360} />
                : <EmptyState
                    icon={<Satellite size={32} />}
                    title="Signal fusion pending"
                    description="Signal fusion requires satellite data. Run the BSI pipeline first to generate results."
                    action={{ label: "View satellite methodology", href: "/methodology#satellite" }}
                  />
            )}
            {fusionReady && <FusionMap msas={fusionMsas} />}
          </>
        )}
      </div>

      {/* Methodology note */}
      <div style={{ marginTop: 12, fontFamily: SYS, fontSize: 12, color: color.t4, lineHeight: 1.65, padding: "0 4px" }}>
        BSI (Bare Soil Index) measures ground disturbance from Sentinel-2 satellite imagery. Higher values indicate
        active earthmoving and site preparation — typically 3–6 months ahead of Census permit data. Signal fusion
        combines BSI, federal award flow, and NOAA storm alerts to classify activity type.{" "}
        <a href="/methodology" style={{ color: color.amber, textDecoration: "none" }}>
          Source: ESA Copernicus · constructaiq.trade/methodology
        </a>
      </div>

      {!isLoading && data?.last_processed && (
        <FreshnessIndicator updated_at={data.last_processed} label="Satellite data processed" />
      )}

      {!isLoading && !isPending && (() => {
        const activeCount = msas.filter(m => m.classification !== 'LOW_ACTIVITY').length
        const topTwo = [...msas]
          .filter(m => m.bsi_mean !== null)
          .sort((a, b) => (b.bsi_mean ?? 0) - (a.bsi_mean ?? 0))
          .slice(0, 2)
          .map(m => m.msa_name.split('-')[0].trim())
        const topLabel = topTwo.length >= 2
          ? `${topTwo[0]} and ${topTwo[1]}`
          : topTwo[0] ?? 'top markets'
        const total = msas.length || 20
        return (
          <SectionVerdict
            text={`${activeCount} of ${total} tracked markets show active ground disturbance. Demand is concentrated in ${topLabel}.`}
          />
        )
      })()}
    </section>
  )
}
