"use client"
import { SectorChart }    from "../components/SectorChart"
import { EarningsCards }  from "../components/EarningsCards"
import { SectorRotation } from "../components/SectorRotation"
import { ETFMonitor }     from "../components/ETFMonitor"
import { GateLock }       from "../components/GateLock"
import { SectionHeader }  from "../components/SectionHeader"
import { color } from "@/lib/theme"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const BG1 = color.bg1, BD1 = color.bd1

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

interface EquitiesSectionProps {
  equities:            AnyData | null
  sectorRange:         "3M" | "6M" | "1Y" | "3Y"
  onSectorRangeChange: (v: "3M" | "6M" | "1Y" | "3Y") => void
}

export function EquitiesSection({ equities, sectorRange, onSectorRangeChange }: EquitiesSectionProps) {
  return (
    <section id="equities" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="07" title="Market Signals & Equities" badge="EQUITIES" live onExportCSV={() => {}} />

      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
        <Card style={{ flex:"3 1 500px" }}>
          <SectorChart
            data={equities?.sectorHistory ?? []}
            timeRange={sectorRange}
            onTimeRangeChange={onSectorRangeChange}
          />
        </Card>
        <Card style={{ flex:"1 1 260px" }}>
          <ETFMonitor etfs={equities?.etfs ?? []} />
        </Card>
      </div>

      <GateLock locked={false} requiredPlan="Institutional" featureName="Earnings Signal Cards">
        <Card style={{ marginBottom:20 }}>
          <EarningsCards companies={equities?.companies ?? []} />
        </Card>
      </GateLock>

      <GateLock locked={false} requiredPlan="Institutional" featureName="Sector Rotation Quadrant">
        <Card>
          <SectorRotation data={equities?.sectorRotation ?? []} />
        </Card>
      </GateLock>
    </section>
  )
}
