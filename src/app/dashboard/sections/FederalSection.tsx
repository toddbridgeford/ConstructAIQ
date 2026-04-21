"use client"
import { FederalPrograms }    from "../components/FederalPrograms"
import { AgencyVelocity }     from "../components/AgencyVelocity"
import { FederalLeaderboard } from "../components/FederalLeaderboard"
import { FederalStateTable }  from "../components/FederalStateTable"
import { GateLock }           from "../components/GateLock"
import { SectionHeader }      from "../components/SectionHeader"
import { color } from "@/lib/theme"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const BG1 = color.bg1, BD1 = color.bd1

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

interface FederalSectionProps {
  federal: AnyData | null
}

export function FederalSection({ federal }: FederalSectionProps) {
  return (
    <section id="federal" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="06" title="Federal Infrastructure Tracker" badge="IIJA · IRA" live onExportCSV={() => {}} />

      <Card style={{ marginBottom:20 }}>
        <FederalPrograms programs={federal?.programs ?? []} />
      </Card>

      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
        <Card style={{ flex:"1 1 340px" }}>
          <AgencyVelocity agencies={federal?.agencies ?? []} />
        </Card>
        <GateLock locked={false} requiredPlan="Institutional" featureName="Contractor Leaderboard">
          <Card style={{ flex:"2 1 440px" }}>
            <FederalLeaderboard contractors={federal?.contractors ?? []} />
          </Card>
        </GateLock>
      </div>

      <GateLock locked={false} requiredPlan="Institutional" featureName="State Allocation Table">
        <Card>
          <FederalStateTable stateAllocations={federal?.stateAllocations ?? []} />
        </Card>
      </GateLock>
    </section>
  )
}
