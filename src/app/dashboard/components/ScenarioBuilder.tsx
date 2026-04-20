"use client"
import { useState } from "react"
import { font, color, fmtB, fmtPct } from "@/lib/theme"

const SYS  = font.sys
const MONO = font.mono

const AMBER     = color.amber,    AMBER_DIM = color.amberDim
const GREEN     = color.green,    GREEN_DIM = color.greenDim
const RED       = color.red,      RED_DIM   = color.redDim
const BLUE      = color.blue,     BLUE_DIM  = color.blueDim
const BG0       = color.bg0,      BG1 = color.bg1, BG2 = color.bg2, BG3 = color.bg3, BG4 = color.bg4
const BD1       = color.bd1,      BD2 = color.bd2, BD3 = color.bd3
const T1        = color.t1,       T2  = color.t2,  T3  = color.t3,  T4  = color.t4

interface SliderRowProps {
  label: string; val: number; setter: (v: number) => void
  min: number; max: number; step: number; unit: string; positiveIsGood: boolean
}
function SliderRow({ label, val, setter, min, max, step, unit, positiveIsGood }: SliderRowProps) {
  const vc = positiveIsGood ? (val >= 0 ? GREEN : RED) : (val <= 0 ? GREEN : RED)
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: SYS, fontSize: 15, color: T2, fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 15, color: vc, fontWeight: 600 }}>{val > 0 ? "+" : ""}{val}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => setter(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: vc, cursor: "pointer", height: 4 }} />
    </div>
  )
}

export function ScenarioBuilder() {
  const [rate,     setRate]     = useState(0)
  const [iija,     setIija]     = useState(100)
  const [labor,    setLabor]    = useState(0)
  const [material, setMaterial] = useState(0)
  const base  = 2190
  const delta = (-rate * 0.018) + ((iija - 100) * 0.003) + (labor * 0.008) + (-material * 0.012)
  const proj  = base * (1 + delta / 100)
  const diff  = proj - base
  const col   = proj >= base ? GREEN : RED
  return (
    <div>
      <SliderRow label="Rate Shock"           val={rate}     setter={setRate}     min={-200} max={200} step={25}  unit="bps" positiveIsGood={false} />
      <SliderRow label="IIJA Funding"         val={iija}     setter={setIija}     min={50}   max={150} step={5}   unit="%"   positiveIsGood={true}  />
      <SliderRow label="Labor Supply Change"  val={labor}    setter={setLabor}    min={-5}   max={5}   step={0.5} unit="%"   positiveIsGood={true}  />
      <SliderRow label="Material Cost Change" val={material} setter={setMaterial} min={-20}  max={20}  step={2}   unit="%"   positiveIsGood={false} />
      <div style={{ background: BG3, borderRadius: 16, padding: 20, border: `1px solid ${col}44`, marginTop: 8 }}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: T4, marginBottom: 8 }}>PROJECTED TOTAL CONSTRUCTION SPENDING</div>
        <div style={{ fontFamily: MONO, fontSize: 36, color: col, lineHeight: 1, fontWeight: 700, marginBottom: 6 }}>{fmtB(proj)}</div>
        <div style={{ fontFamily: MONO, fontSize: 15, color: col }}>{diff >= 0 ? "+" : ""}{fmtB(Math.abs(diff))} ({fmtPct((diff / base) * 100)}) vs baseline</div>
      </div>
    </div>
  )
}
