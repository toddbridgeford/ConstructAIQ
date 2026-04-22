"use client"
import { useState } from "react"
import { font, color } from "@/lib/theme"
import { SectionHeader } from "../components/SectionHeader"
import { SatelliteHeatmap, type SatelliteMsa } from "../components/SatelliteHeatmap"

const SYS  = font.sys
const MONO = font.mono

interface SatelliteData {
  processing_status: "live" | "pending_first_run"
  msas: SatelliteMsa[]
  last_processed?: string
  msa_count?: number
  ranked_by_activity?: string[]
}

interface Props {
  data: SatelliteData | null
}

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

export function SatelliteSection({ data }: Props) {
  const [selectedMsa, setSelectedMsa] = useState<string | null>(null)

  const msas      = data?.msas ?? []
  const isLoading = data === null
  const isPending = data?.processing_status === "pending_first_run" || (!isLoading && msas.length === 0)

  return (
    <section id="satellite" style={{ paddingTop: 48, paddingBottom: 8 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

      <SectionHeader
        sectionId="07"
        title="Ground Signal Intelligence"
        badge="SENTINEL-2"
        subtitle="Satellite-detected construction activity · 20 US markets · Updated weekly"
      />

      <div style={{
        background: color.bg1, borderRadius: 20,
        border: `1px solid ${color.bd1}`, padding: "24px 28px",
      }}>
        {isLoading && <Skeleton height={500} />}

        {!isLoading && isPending && (
          <div style={{
            height: 300,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: color.amber, letterSpacing: "0.1em" }}>
              PENDING FIRST RUN
            </div>
            <div style={{ fontFamily: SYS, fontSize: 14, color: color.t3, textAlign: "center", maxWidth: 400 }}>
              The satellite pipeline has not run yet. BSI results will appear after the next weekly GitHub Actions run.
            </div>
          </div>
        )}

        {!isLoading && !isPending && (
          <SatelliteHeatmap
            msas={msas}
            selectedMsa={selectedMsa}
            onMsaClick={code => setSelectedMsa(prev => prev === code ? null : code)}
          />
        )}
      </div>

      {/* Methodology note */}
      <div style={{
        marginTop: 12,
        fontFamily: SYS, fontSize: 12, color: color.t4, lineHeight: 1.65,
        padding: "0 4px",
      }}>
        BSI (Bare Soil Index) measures ground disturbance from Sentinel-2 satellite imagery. Higher values indicate
        active earthmoving and site preparation — typically 3–6 months ahead of Census permit data. Cloud cover
        affects data quality; confidence ratings reflect scene availability. False positive checks run against NOAA
        storm events.{" "}
        <a href="/methodology" style={{ color: color.amber, textDecoration: "none" }}>
          Source: ESA Copernicus · constructaiq.trade/methodology
        </a>
      </div>
    </section>
  )
}
