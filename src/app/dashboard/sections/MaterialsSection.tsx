"use client"
import { PackageX } from "lucide-react"
import { CommoditySignalCard }  from "../components/CommoditySignalCard"
import { ProcurementIndex }     from "../components/ProcurementIndex"
import { MaterialsHeatmap }     from "../components/MaterialsHeatmap"
import { MaterialsCorrelation } from "../components/MaterialsCorrelation"
import { SectionHeader }        from "../components/SectionHeader"
import { EmptyState }           from "@/app/components/ui/EmptyState"
import { color, font } from "@/lib/theme"
import Link from "next/link"
import type { CommodityItem } from "@/lib/api-types"
import type { FreshnessInfo } from "@/lib/freshness"

const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1
const SYS = font.sys

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

export interface HeatmapMonth {
  month:     string
  value:     number
  pctChange: number
}

export interface HeatmapRow {
  commodity: string
  months:    HeatmapMonth[]
}

interface MaterialsSectionProps {
  commodities:      CommodityItem[]
  procurementValue: number
  heatmapData:      HeatmapRow[]
  corrMaterials:    { date: string; value: number }[]
  corrSpend:        { date: string; value: number }[]
  loading:          boolean
  freshness?:       FreshnessInfo
}

export function MaterialsSection({ commodities, procurementValue, heatmapData, corrMaterials, corrSpend, loading, freshness }: MaterialsSectionProps) {
  const items = commodities.slice(0, 6)
  return (
    <section id="materials" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="04" title="Materials Intelligence" subtitle="BUY/SELL/HOLD signals for lumber, steel, concrete, copper, WTI, and diesel" shareSection="materials" freshness={freshness} />

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<PackageX size={32} />}
          title="Material prices unavailable"
          description="Configure BLS_API_KEY and FRED_API_KEY to enable live commodity price signals."
          action={{ label: "View configuration guide", href: "/methodology" }}
        />
      ) : (
        <>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:20 }}>
            {loading
              ? Array.from({length:6}).map((_,i) => <div key={i} style={{ flex:"1 1 160px", height:180, borderRadius:14, background:BG2, animation:"pulse 1.5s infinite" }} />)
              : items.map((c, i) => (
                  <div key={i} style={{ flex:"1 1 160px", minWidth:150 }}>
                    <CommoditySignalCard
                      name={c.name} icon={c.icon||"📦"} value={c.value} unit={c.unit||"PPI"}
                      signal={c.signal||"HOLD"} mom7d={c.mom7d||c.mom||0} mom30d={c.mom30d||0} mom90d={c.mom90d||c.yoy||0}
                      sparkData={c.sparkData || Array(12).fill(c.value)}
                    />
                  </div>
                ))
            }
          </div>

          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
            <Card style={{ flex:"0 0 auto", minWidth:280 }}>
              <ProcurementIndex value={procurementValue} />
            </Card>
            <Card style={{ flex:"2 1 400px", minWidth:0 }}>
              <MaterialsHeatmap data={heatmapData} />
            </Card>
          </div>

          <Card>
            <MaterialsCorrelation materialsCostData={corrMaterials} constructionSpendData={corrSpend} />
          </Card>
        </>
      )}

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BD1}`, textAlign: "right" }}>
        <Link href="/materials" style={{
          fontFamily:     SYS,
          fontSize:       13,
          color:          color.amber,
          textDecoration: "none",
          fontWeight:     500,
          letterSpacing:  "0.01em",
        }}>
          Full material cost index →
        </Link>
      </div>
    </section>
  )
}
