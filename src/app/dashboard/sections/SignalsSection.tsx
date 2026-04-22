"use client"
import { color, font, radius } from "@/lib/theme"
import { SurveyPanel } from "../components/SurveyPanel"
import { AnomalyFeed } from "../components/AnomalyFeed"
import { DivergenceDetector } from "../components/DivergenceDetector"
import { WeeklyBrief } from "../components/WeeklyBrief"
import { GateLock } from "../components/GateLock"

const MONO = font.mono

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

interface Props {
  signals: AnyData
  brief:   AnyData
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      marginTop: 8, marginBottom: 16,
    }}>
      <div style={{ flex: 1, height: 1, background: color.bd1 }} />
      <span style={{
        fontFamily: MONO, fontSize: 9, color: color.t4,
        letterSpacing: "0.12em", flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: color.bd1 }} />
    </div>
  )
}

export function SignalsSection({ signals, brief }: Props) {
  return (
    <div>
      {/* Proprietary survey panel — primary source */}
      <SurveyPanel />

      <Divider label="PUBLIC DATA SIGNALS" />

      {/* Anomaly feed + divergence detector */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ flex: "1 1 320px" }}>
          <AnomalyFeed alerts={signals?.anomalies ?? []} />
        </div>
        <GateLock locked={false} requiredPlan="Starter" featureName="Divergence Detector">
          <div style={{ flex: "1 1 320px" }}>
            <DivergenceDetector pairs={signals?.divergences ?? []} />
          </div>
        </GateLock>
      </div>

      {/* AI Weekly Brief */}
      <GateLock locked={false} requiredPlan="Starter" featureName="AI Weekly Intelligence Brief">
        <div style={{
          background: color.bg1,
          borderRadius: 20,
          border: `1px solid ${color.bd1}`,
          padding: "24px 28px",
        }}>
          <WeeklyBrief {...(brief ?? {})} />
        </div>
      </GateLock>
    </div>
  )
}
