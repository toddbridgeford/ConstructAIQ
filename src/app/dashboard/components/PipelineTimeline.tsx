"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

export interface PipelineStage {
  id: string
  label: string
  value: string
  unit: string
  mom: number
  trend: "UP" | "DOWN" | "FLAT"
  trendColor: string
  lagToNext: number | null
}

interface PipelineTimelineProps {
  stages: PipelineStage[]
  onStageClick: (stageId: string) => void
  activeStage: string | null
}

function trendArrow(trend: "UP" | "DOWN" | "FLAT"): string {
  if (trend === "UP") return "↑"
  if (trend === "DOWN") return "↓"
  return "→"
}

function momColor(mom: number): string {
  if (mom > 0) return color.green
  if (mom < 0) return color.red
  return color.amber
}

export function PipelineTimeline({ stages, onStageClick, activeStage }: PipelineTimelineProps) {
  if (!stages || stages.length === 0) {
    return (
      <div style={{
        background: color.bg2,
        border: `1px solid ${color.bd1}`,
        borderRadius: 16,
        padding: 24,
        fontFamily: MONO,
        fontSize: 13,
        color: color.t4,
        textAlign: "center",
      }}>
        No pipeline stages available
      </div>
    )
  }

  return (
    <div style={{
      background: color.bg2,
      border: `1px solid ${color.bd1}`,
      borderRadius: 16,
      padding: 20,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.08em", marginBottom: 16 }}>
        LEAD / LAG PIPELINE STAGES
      </div>

      {/* Horizontal scrollable container */}
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          minWidth: stages.length * 160 + (stages.length - 1) * 72,
        }}>
          {stages.map((stage, idx) => {
            const isActive = activeStage === stage.id
            const mc = momColor(stage.mom)

            return (
              <div key={stage.id} style={{ display: "flex", alignItems: "center" }}>
                {/* Stage box */}
                <div
                  onClick={() => onStageClick(stage.id)}
                  style={{
                    background: color.bg3,
                    border: `1px solid ${isActive ? color.amber : color.bd1}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    width: 148,
                    flexShrink: 0,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    boxShadow: isActive ? `0 0 0 1px ${color.amber}44` : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                >
                  {/* Stage label */}
                  <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: "0.08em" }}>
                    {stage.label}
                  </div>

                  {/* Value + unit */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: color.t1 }}>
                      {stage.value}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{stage.unit}</span>
                  </div>

                  {/* MoM change */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: mc, fontWeight: 600 }}>
                      {trendArrow(stage.trend)}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: mc, fontWeight: 600 }}>
                      {stage.mom > 0 ? "+" : ""}{stage.mom.toFixed(1)}%
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>MoM</span>
                  </div>

                  {/* Trend direction indicator */}
                  <div style={{
                    borderTop: `1px solid ${color.bd1}`,
                    paddingTop: 6,
                    fontFamily: MONO,
                    fontSize: 16,
                    color: stage.trendColor,
                    textAlign: "center",
                  }}>
                    {trendArrow(stage.trend)}
                  </div>
                </div>

                {/* Connector arrow */}
                {stage.lagToNext !== null && idx < stages.length - 1 && (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "0 6px",
                    flexShrink: 0,
                  }}>
                    <div style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      color: color.t4,
                      marginBottom: 2,
                      whiteSpace: "nowrap",
                    }}>
                      {stage.lagToNext}wk
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                      <div style={{ width: 24, height: 1.5, background: color.bd2 }} />
                      <span style={{ fontFamily: MONO, fontSize: 12, color: color.bd3 }}>▶</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
