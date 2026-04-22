"use client"
import { CommoditySignalCard }  from "../components/CommoditySignalCard"
import { ProcurementIndex }     from "../components/ProcurementIndex"
import { MaterialsHeatmap }     from "../components/MaterialsHeatmap"
import { MaterialsCorrelation } from "../components/MaterialsCorrelation"
import { SectionHeader }        from "../components/SectionHeader"
import { color } from "@/lib/theme"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

const FALLBACK_COMMODITIES = [
  { name:"Lumber",    icon:"🌲", value:421.8, unit:"PPI",   signal:"BUY",  mom7d:-1.2, mom30d:-3.7, mom90d:-8.4,  sparkData:Array(12).fill(421.8) },
  { name:"Steel",     icon:"🔩", value:318.4, unit:"PPI",   signal:"SELL", mom7d:2.8,  mom30d:4.1,  mom90d:8.4,   sparkData:Array(12).fill(318.4) },
  { name:"Concrete",  icon:"🧱", value:284.6, unit:"PPI",   signal:"HOLD", mom7d:0.4,  mom30d:1.2,  mom90d:4.8,   sparkData:Array(12).fill(284.6) },
  { name:"Copper",    icon:"🔶", value:9842,  unit:"$/t",   signal:"SELL", mom7d:4.5,  mom30d:7.2,  mom90d:12.4,  sparkData:Array(12).fill(9842)  },
  { name:"WTI Crude", icon:"🛢️", value:74.8,  unit:"$/bbl", signal:"HOLD", mom7d:-1.8, mom30d:-3.2, mom90d:-6.4,  sparkData:Array(12).fill(74.8)  },
  { name:"Diesel",    icon:"⛽", value:3.84,  unit:"$/gal", signal:"HOLD", mom7d:-0.6, mom30d:-1.4, mom90d:2.8,   sparkData:Array(12).fill(3.84)  },
]

interface MaterialsSectionProps {
  commodities:      AnyData[]
  procurementValue: number
  heatmapData:      AnyData[]
  corrMaterials:    { date: string; value: number }[]
  corrSpend:        { date: string; value: number }[]
  loading:          boolean
}

export function MaterialsSection({ commodities, procurementValue, heatmapData, corrMaterials, corrSpend, loading }: MaterialsSectionProps) {
  const items = (commodities.length > 0 ? commodities : FALLBACK_COMMODITIES).slice(0, 6)
  return (
    <section id="materials" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="04" title="Materials Intelligence" subtitle="BUY/SELL/HOLD signals for lumber, steel, concrete, copper, WTI, and diesel" />

      <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:20 }}>
        {loading
          ? Array.from({length:6}).map((_,i) => <div key={i} style={{ flex:"1 1 160px", height:180, borderRadius:14, background:BG2, animation:"pulse 1.5s infinite" }} />)
          : items.map((c: AnyData, i: number) => (
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
    </section>
  )
}
