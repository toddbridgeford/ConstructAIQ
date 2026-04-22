"use client"
import { AnomalyFeed }        from "../components/AnomalyFeed"
import { DivergenceDetector } from "../components/DivergenceDetector"
import { WeeklyBrief }        from "../components/WeeklyBrief"
import { GateLock }           from "../components/GateLock"
import { SectionHeader }      from "../components/SectionHeader"
import { Skeleton }           from "@/app/components/Skeleton"
import { color } from "@/lib/theme"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const BG1 = color.bg1, BD1 = color.bd1

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

interface SignalsSectionProps {
  signals: AnyData | null
  brief:   AnyData | null
}

export function SignalsSection({ signals, brief }: SignalsSectionProps) {
  if (!signals) return (
    <section id="signals" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="08" title="Signal Intelligence Feed" badge="AI-POWERED" live onExportCSV={() => {}} />
      <Skeleton height={200} borderRadius={20} />
    </section>
  )
  return (
    <section id="signals" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="08" title="Signal Intelligence Feed" badge="AI-POWERED" live onExportCSV={() => {}} />

      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
        <div style={{ flex:"1 1 320px", minWidth:0 }}>
          <AnomalyFeed alerts={signals?.anomalies ?? []} />
        </div>
        <GateLock locked={false} requiredPlan="Starter" featureName="Divergence Detector">
          <div style={{ flex:"1 1 320px", minWidth:0 }}>
            <DivergenceDetector pairs={signals?.divergences ?? []} />
          </div>
        </GateLock>
      </div>

      <GateLock locked={false} requiredPlan="Starter" featureName="AI Weekly Intelligence Brief">
        <Card>
          <WeeklyBrief {...(brief ?? {})} />
        </Card>
      </GateLock>
    </section>
  )
}
