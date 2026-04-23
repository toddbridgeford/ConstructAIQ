"use client"
import { color, font, radius } from "@/lib/theme"
import { AnomalyFeed } from "../components/AnomalyFeed"
import { DivergenceDetector } from "../components/DivergenceDetector"
import { WeeklyBrief } from "../components/WeeklyBrief"
import { NLQInterface } from "../components/NLQInterface"
import { WarnFeed } from "../components/WarnFeed"

const MONO = font.mono

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

interface Props {
  signals: AnyData
  brief:   AnyData
  warn:    AnyData
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

export function SignalsSection({ signals, brief, warn }: Props) {
  return (
    <div>
      {/* NLQ — Ask the Data */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700, color: color.t1, letterSpacing: "-0.02em" }}>
            Ask the Data
          </span>
          <span style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 600,
            color: color.blue, background: color.blueDim,
            border: `1px solid ${color.blue}33`,
            borderRadius: radius.xs, padding: "2px 7px",
            letterSpacing: "0.08em",
          }}>
            AI
          </span>
        </div>
        <p style={{ fontFamily: MONO, fontSize: 12, color: color.t4, margin: "0 0 14px", letterSpacing: "0.01em" }}>
          Natural language queries across all 38+ data sources
        </p>
        <NLQInterface />
      </div>

      <Divider label="LIVE SIGNAL FEED" />

      {/* WARN Act — leading contraction indicator */}
      <div style={{ marginBottom: 20 }}>
        <WarnFeed data={warn} />
      </div>

      <Divider label="PUBLIC DATA SIGNALS" />

      {/* Anomaly feed + divergence detector */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ flex: "1 1 320px" }}>
          <AnomalyFeed alerts={signals?.anomalies ?? []} />
        </div>
        <div style={{ flex: "1 1 320px" }}>
          <DivergenceDetector pairs={signals?.divergences ?? []} />
        </div>
      </div>

      {/* AI Weekly Brief */}
      <div style={{
        background: color.bg1,
        borderRadius: 20,
        border: `1px solid ${color.bd1}`,
        padding: "24px 28px",
      }}>
        <WeeklyBrief {...(brief ?? {})} />
      </div>
    </div>
  )
}
