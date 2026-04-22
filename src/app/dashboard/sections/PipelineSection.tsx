"use client"
import { PipelineTimeline }  from "../components/PipelineTimeline"
import { CascadeAlerts }     from "../components/CascadeAlerts"
import { PredictiveOverlay } from "../components/PredictiveOverlay"
import { CycleComparison }   from "../components/CycleComparison"
import { SectionHeader }     from "../components/SectionHeader"
import { color } from "@/lib/theme"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const BG1 = color.bg1, BD1 = color.bd1
const GREEN = color.green, AMBER = color.amber

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

const DEFAULT_STAGES = [
  { id:"permits",    label:"BUILDING PERMITS",    value:"1,482", unit:"K/mo", mom:2.1,  trend:"UP",   trendColor:GREEN, lagToNext:6    },
  { id:"starts",     label:"HOUSING STARTS",      value:"1,394", unit:"K/mo", mom:1.4,  trend:"UP",   trendColor:GREEN, lagToNext:4    },
  { id:"employment", label:"CONSTRUCTION EMPLOY", value:"8,330", unit:"K",    mom:0.3,  trend:"UP",   trendColor:GREEN, lagToNext:8    },
  { id:"spending",   label:"CONSTR. SPENDING",    value:"$2.19", unit:"T",    mom:0.31, trend:"UP",   trendColor:GREEN, lagToNext:12   },
  { id:"gdp",        label:"GDP CONTRIBUTION",    value:"4.8",   unit:"%",    mom:-0.1, trend:"FLAT", trendColor:AMBER, lagToNext:null },
]
const DEFAULT_ALERTS = [
  { id:"a1", severity:"WATCH",   title:"Permit-to-Start Gap Widening", description:"Permits outpacing starts by 6.2% — labor capacity constraint signal", timestamp:"2h ago" },
  { id:"a2", severity:"INFO",    title:"Employment Momentum Positive", description:"3-month employment trend: +0.9% — above 5yr average of +0.4%",         timestamp:"4h ago" },
  { id:"a3", severity:"ANOMALY", title:"Lumber Futures Spike +8.4%",  description:"Price breakout above 2σ band — cost pressure building",                 timestamp:"1d ago" },
]

interface PipelineSectionProps {
  pipeline: AnyData | null
}

export function PipelineSection({ pipeline }: PipelineSectionProps) {
  return (
    <section id="pipeline" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="05" title="Lead / Lag Pipeline" badge="PREDICTIVE" live onExportCSV={() => {}} />

      <Card style={{ marginBottom:20 }}>
        <PipelineTimeline stages={pipeline?.stages ?? DEFAULT_STAGES} onStageClick={() => {}} activeStage={null} />
      </Card>

      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
        <div style={{ flex:"1 1 300px", minWidth:0 }}>
          <CascadeAlerts alerts={pipeline?.alerts ?? DEFAULT_ALERTS} />
        </div>
        <Card style={{ flex:"2 1 400px", minWidth:0, height:"100%" }}>
          <PredictiveOverlay />
        </Card>
      </div>

      <Card>
        <CycleComparison
          current={pipeline?.cycleComparison?.current}
          cycle2008={pipeline?.cycleComparison?.cycle2008}
          cycle2016={pipeline?.cycleComparison?.cycle2016}
          cycle2020={pipeline?.cycleComparison?.cycle2020}
          currentMonth={pipeline?.cycleComparison?.currentMonth ?? 14}
          description={pipeline?.cycleComparison?.description}
        />
      </Card>
    </section>
  )
}
