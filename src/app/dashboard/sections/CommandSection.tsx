"use client"
import { CSHIGauge }      from "../components/CSHIGauge"
import { CSHIHistory }    from "../components/CSHIHistory"
import { ForecastBanner } from "../components/ForecastBanner"
import { SectionHeader }  from "../components/SectionHeader"
import { KpiRow }         from "./KpiRow"
import { color } from "@/lib/theme"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const BG1 = color.bg1, BG2 = color.bg2, BD1 = color.bd1

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}

interface CommandSectionProps {
  cshi:        AnyData | null
  foreData:    AnyData | null
  corrSpend:   { date: string; value: number }[]
  spendVal:    number
  spendMom:    number
  spendSpark:  number[]
  empVal:      number
  empMom:      number
  empSpark:    number[]
  permitSpark: number[]
  houstSpark:  number[]
  sigCount:    number
}

export function CommandSection({ cshi, foreData, corrSpend, spendVal, spendMom, spendSpark, empVal, empMom, empSpark, permitSpark, houstSpark, sigCount }: CommandSectionProps) {
  const score     = cshi?.score          ?? 72.4
  const change    = cshi?.weeklyChange   ?? 1.3
  const cls       = cshi?.classification ?? "EXPANDING"
  const subScores = cshi?.subScores      ?? {}
  const history   = cshi?.history        ?? []
  const SKEL: React.CSSProperties = { height:200, borderRadius:16, background:BG2, animation:"pulse 1.5s infinite" }

  return (
    <section id="command" style={{ paddingTop:48, paddingBottom:8 }}>
      <SectionHeader sectionId="01" title="Sector Command Center" subtitle="The pulse of the entire US construction sector" live />

      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:20 }}>
        <Card style={{ flex:"0 0 auto", minWidth:300 }}>
          {cshi ? <CSHIGauge score={score} weeklyChange={change} classification={cls} subScores={subScores} /> : <div style={SKEL} />}
        </Card>
        <Card style={{ flex:1, minWidth:320 }}>
          {cshi ? <CSHIHistory data={history} /> : <div style={SKEL} />}
        </Card>
      </div>

      <KpiRow
        spendVal={spendVal} spendMom={spendMom} spendSpark={spendSpark}
        empVal={empVal}     empMom={empMom}     empSpark={empSpark}
        permitSpark={permitSpark} houstSpark={houstSpark}
        sigCount={sigCount} loading={false}
      />

      <Card>
        <ForecastBanner foreData={foreData} spendHistory={corrSpend.slice(0, 24)} />
      </Card>
    </section>
  )
}
