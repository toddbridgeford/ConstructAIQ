"use client"
import { font, color, type as typeScale } from "@/lib/theme"
import { SatelliteBadge } from "./SatelliteBadge"
import { WatchButton } from "@/app/components/ui/WatchButton"

const SYS  = font.sys
const MONO = font.mono

export interface SatelliteMsa {
  msa_code: string
  msa_name: string
  state_codes: string[]
  bsi_mean: number | null
  bsi_change_90d: number | null
  bsi_change_yoy: number | null
  cloud_cover_pct: number | null
  confidence: string | null
  false_positive_flags: string[]
  classification: string
  interpretation: string | null
  observation_date: string
}

interface Props {
  msas: SatelliteMsa[]
  selectedMsa: string | null
  onMsaClick: (code: string) => void
}

function classBarColor(cls: string): string {
  switch (cls) {
    case "DEMAND_DRIVEN":      return color.green
    case "FEDERAL_INVESTMENT": return color.blue
    case "RECONSTRUCTION":     return color.amber
    case "ORGANIC_GROWTH":     return color.t2
    case "LOW_ACTIVITY":       return color.bg3
    default:                   return color.bg2
  }
}

function confColor(conf: string | null): string {
  if (conf === "HIGH")   return color.green
  if (conf === "MEDIUM") return color.amber
  return color.red
}

function fmtChg(v: number | null): string {
  if (v === null) return "—"
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`
}

function chgColor(v: number | null): string {
  if (v === null)  return color.t4
  if (v > 5)       return color.green
  if (v < -5)      return color.red
  return color.t3
}

export function SatelliteHeatmap({ msas, selectedMsa, onMsaClick }: Props) {
  const selected = msas.find(m => m.msa_code === selectedMsa) ?? null
  const maxChange = Math.max(1, ...msas.map(m => Math.max(0, m.bsi_change_90d ?? 0)))

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>

      {/* ── LEFT: ranked activity list ─────────────────────────────────── */}
      <div style={{ flex: "3 1 340px", minWidth: 0 }}>
        {/* Column headers */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 12px 8px",
          borderBottom: `1px solid ${color.bd1}`,
          marginBottom: 4,
        }}>
          <div style={{ width: 150, flexShrink: 0, fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.08em" }}>MARKET</div>
          <div style={{ flex: 1, fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.08em" }}>ACTIVITY</div>
          <div style={{ width: 6, flexShrink: 0 }} />
          <div style={{ width: 56, textAlign: "right", fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.08em" }}>90D CHG</div>
          <div style={{ width: 92, textAlign: "right", fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.08em" }}>WATCH</div>
        </div>

        {msas.map(msa => {
          const isSel    = msa.msa_code === selectedMsa
          const barW     = Math.max(0, (msa.bsi_change_90d ?? 0) / maxChange * 100)
          const barClr   = classBarColor(msa.classification)

          return (
            <div
              key={msa.msa_code}
              onClick={() => onMsaClick(msa.msa_code)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px",
                borderRadius: 10,
                cursor: "pointer",
                marginBottom: 2,
                background: isSel ? color.bg3 : "transparent",
                border: `1px solid ${isSel ? color.bd2 : "transparent"}`,
              }}
            >
              {/* Market name + states */}
              <div style={{ width: 150, flexShrink: 0 }}>
                <div style={{ fontFamily: SYS, fontSize: 13, fontWeight: 600, color: color.t1, lineHeight: 1.2 }}>
                  {msa.msa_name.split("-")[0].trim()}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, marginTop: 1 }}>
                  {msa.state_codes.slice(0, 3).join(" · ")}
                </div>
              </div>

              {/* Activity bar */}
              <div style={{ flex: 1, minWidth: 40 }}>
                <div style={{ height: 4, background: color.bg4, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${barW}%`,
                    background: barClr,
                    borderRadius: 2,
                  }} />
                </div>
              </div>

              {/* Confidence dot */}
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: confColor(msa.confidence),
                flexShrink: 0,
              }} />

              {/* 90d change */}
              <div style={{
                fontFamily: MONO, fontSize: 12, fontWeight: 600,
                color: chgColor(msa.bsi_change_90d),
                width: 56, textAlign: "right", flexShrink: 0,
              }}>
                {fmtChg(msa.bsi_change_90d)}
              </div>

              {/* Watch toggle — stops propagation so clicks don't also select the row */}
              <div
                onClick={e => e.stopPropagation()}
                style={{ width: 92, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}
              >
                <WatchButton
                  entityType="metro"
                  entityId={msa.msa_code}
                  entityLabel={msa.msa_name}
                />
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div style={{
          display: "flex", gap: 16, flexWrap: "wrap",
          padding: "12px 12px 0",
          borderTop: `1px solid ${color.bd1}`,
          marginTop: 8,
        }}>
          {[
            { cls: "DEMAND_DRIVEN",      label: "Demand Driven" },
            { cls: "FEDERAL_INVESTMENT", label: "Federal" },
            { cls: "RECONSTRUCTION",     label: "Reconstruction" },
            { cls: "ORGANIC_GROWTH",     label: "Organic" },
          ].map(({ cls, label }) => (
            <div key={cls} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: classBarColor(cls) }} />
              <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>{label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}>
            <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>Conf:</span>
            {(["HIGH", "MEDIUM", "LOW"] as const).map(c => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: confColor(c) }} />
                <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>{c.charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: detail card ─────────────────────────────────────────── */}
      <div style={{ flex: "2 1 260px", minWidth: 0 }}>
        {selected ? (
          <div style={{
            background: color.bg2, borderRadius: 16,
            border: `1px solid ${color.bd1}`, padding: "20px 24px",
          }}>
            {/* Heading */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...typeScale.h3, fontFamily: SYS, color: color.t1, marginBottom: 8 }}>
                {selected.msa_name}
              </div>
              <SatelliteBadge classification={selected.classification} large />
            </div>

            {/* Interpretation */}
            {selected.interpretation && (
              <div style={{
                fontFamily: SYS, fontSize: 13.5, color: color.t3,
                lineHeight: 1.65, marginBottom: 16,
              }}>
                {selected.interpretation}
              </div>
            )}

            {/* Metric rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {[
                { label: "BSI Change (90d)", value: fmtChg(selected.bsi_change_90d) },
                { label: "BSI Change (YoY)", value: fmtChg(selected.bsi_change_yoy) },
                {
                  label: "Cloud Cover",
                  value: selected.cloud_cover_pct != null
                    ? `${selected.cloud_cover_pct.toFixed(1)}%`
                    : "—",
                },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: SYS, fontSize: 13, color: color.t4 }}>{label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: color.t1 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Observation date */}
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginBottom: 12 }}>
              Last processed: {selected.observation_date}
            </div>

            {/* False positive warning */}
            {selected.false_positive_flags.length > 0 && (
              <div style={{
                background: color.amberDim,
                border: `1px solid ${color.amber}44`,
                borderRadius: 8,
                padding: "10px 12px",
                fontFamily: SYS, fontSize: 12, color: color.amber,
                lineHeight: 1.5, marginBottom: 12,
              }}>
                Recent storm events detected in this region — activity may include reconstruction, not new construction
              </div>
            )}

            {/* Data source */}
            <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, lineHeight: 1.6 }}>
              Sentinel-2 L2A · Copernicus Data Space<br />
              10m resolution · Cloud-masked BSI
            </div>
          </div>
        ) : (
          <div style={{
            height: 320, display: "flex", alignItems: "center", justifyContent: "center",
            background: color.bg2, borderRadius: 16, border: `1px solid ${color.bd1}`,
            fontFamily: SYS, fontSize: 14, color: color.t4,
            textAlign: "center", padding: 24,
          }}>
            Select a market to see satellite intelligence
          </div>
        )}
      </div>

    </div>
  )
}
