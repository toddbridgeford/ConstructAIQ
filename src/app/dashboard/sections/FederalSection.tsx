"use client"
import { FederalPrograms }    from "../components/FederalPrograms"
import { AgencyVelocity }     from "../components/AgencyVelocity"
import { FederalLeaderboard } from "../components/FederalLeaderboard"
import { FederalStateTable }  from "../components/FederalStateTable"
import { SectionHeader }      from "../components/SectionHeader"
import { ErrorState }         from "@/app/components/ui/ErrorState"
import { DataTrustBadge }     from "@/app/components/DataTrustBadge"
import { Skeleton }           from "@/app/components/Skeleton"
import { color } from "@/lib/theme"
import { federalProvenance }  from "@/lib/dashboardProvenance"
import { statusFromFederalProvenance } from "@/lib/data-trust-utils"
import type { FederalResponse } from "@/lib/api-types"

const BG1 = color.bg1, BD1 = color.bd1

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

interface FederalSectionProps {
  federal: FederalResponse | null
}

export function FederalSection({ federal }: FederalSectionProps) {
  if (!federal) return (
    <section id="federal" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="06" title="Federal Infrastructure Tracker" badge="IIJA · IRA" onExportCSV={() => {}} shareSection="federal" />
      <Skeleton height={300} borderRadius={20} />
    </section>
  )

  const prov = federalProvenance(federal)

  return (
    <section id="federal" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="06" title="Federal Infrastructure Tracker" badge="IIJA · IRA" onExportCSV={() => {}} shareSection="federal" />

      {(prov.state === 'error' || prov.state === 'fallback') && (
        <div style={{ marginBottom: 20 }}>
          <ErrorState
            message={prov.state === 'fallback'
              ? 'Federal live feed unavailable'
              : 'Federal data temporarily unavailable'}
            detail={prov.message}
            cached_at={prov.cachedAt}
          />
        </div>
      )}

      <Card style={{ marginBottom:20 }}>
        <FederalPrograms programs={federal?.programs ?? []} />
      </Card>

      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
        <Card style={{ flex:"1 1 340px" }}>
          <AgencyVelocity agencies={federal?.agencies ?? []} />
        </Card>
        <Card style={{ flex:"2 1 440px" }}>
          <FederalLeaderboard contractors={federal?.contractors ?? []} />
        </Card>
      </div>

      <Card>
        <FederalStateTable stateAllocations={federal?.stateAllocations ?? []} />
      </Card>

      <div style={{ marginTop: 12 }}>
        <DataTrustBadge
          source="USASpending.gov"
          cadence="Daily"
          type={prov.state === 'fallback' ? 'fallback' : 'actual'}
          status={statusFromFederalProvenance(prov.state)}
          lastRefreshed={federal?.cached_at || undefined}
          caveat={
            prov.state === 'fallback'
              ? 'Static fallback — contractor and agency leaderboards are intentionally empty'
              : prov.state === 'error'
              ? 'Upstream error — showing most recently cached allocation data'
              : undefined
          }
        />
      </div>
    </section>
  )
}
