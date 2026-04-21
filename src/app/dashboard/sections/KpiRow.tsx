"use client"
import { KPICard } from "../components/KPICard"
import { color, fmtB, fmtK } from "@/lib/theme"

const AMBER = color.amber, GREEN = color.green, RED = color.red, BLUE = color.blue
const BG2 = color.bg2, T2 = color.t2

interface KpiRowProps {
  spendVal:   number
  spendMom:   number
  spendSpark: number[]
  empVal:     number
  empMom:     number
  empSpark:   number[]
  permitSpark: number[]
  houstSpark:  number[]
  sigCount:   number
  loading:    boolean
}

export function KpiRow({ spendVal, spendMom, spendSpark, empVal, empMom, empSpark, permitSpark, houstSpark, sigCount, loading }: KpiRowProps) {
  if (loading) return (
    <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:20 }}>
      {Array.from({length:6}).map((_,i) => (
        <div key={i} style={{ flex:"1 1 160px", height:96, borderRadius:14, background:BG2, animation:"pulse 1.5s infinite" }} />
      ))}
    </div>
  )
  return (
    <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:20 }}>
      <KPICard label="Total Construction Spend" value={fmtB(spendVal)}         mom={spendMom} yoy={3.4}  sparkData={spendSpark}                    color={AMBER} icon="🏗️" />
      <KPICard label="Permit Volume (units)"    value="1,482K/yr"               mom={2.8}      yoy={-4.2} sparkData={permitSpark}                   color={BLUE}  icon="📋" />
      <KPICard label="Permit Value ($)"          value="$48.2B"                 mom={3.1}      yoy={1.8}  sparkData={houstSpark}                    color={BLUE}  icon="💰" />
      <KPICard label="Construction Employment"   value={`${fmtK(empVal)}M`}    mom={empMom}   yoy={2.1}  sparkData={empSpark}                      color={GREEN} icon="👷" />
      <KPICard label="Materials Cost Index"      value="318.4"                  mom={1.2}      yoy={6.8}  sparkData={Array(12).fill(318)}           color={RED}   icon="💹" />
      <KPICard label="Active AI Signals"         value={String(sigCount || 6)}  mom={0}                   sparkData={Array(12).fill(sigCount || 6)} color={T2}    icon="📡" />
    </div>
  )
}
