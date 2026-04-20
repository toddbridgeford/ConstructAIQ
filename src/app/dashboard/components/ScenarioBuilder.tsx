"use client"
import { useState } from "react"
import { font, color, fmtB, fmtPct } from "@/lib/theme"

const SYS   = font.sys
const MONO  = font.mono
const AMBER = color.amber
const GREEN = color.green
const RED   = color.red
const BLUE  = color.blue
const BG1   = color.bg1, BG2 = color.bg2, BG3 = color.bg3
const BD1   = color.bd1, BD2 = color.bd2
const T1    = color.t1,  T2  = color.t2,  T3  = color.t3, T4 = color.t4

interface Preset { label: string; rate: number; iija: number; labor: number; material: number }

const PRESETS: Preset[] = [
  { label: "Recession",          rate:  200, iija:  70, labor: -3,   material:  10 },
  { label: "Baseline",           rate:    0, iija: 100, labor:  0,   material:   0 },
  { label: "Expansion",          rate: -100, iija: 120, labor:  2,   material:  -5 },
  { label: "Infrastructure Push",rate:   50, iija: 150, labor:  3,   material:   5 },
]

interface SliderRowProps {
  label: string; sub: string; val: number; setter: (v: number) => void
  min: number; max: number; step: number; unit: string; positiveIsGood: boolean
}

function SliderRow({ label, sub, val, setter, min, max, step, unit, positiveIsGood }: SliderRowProps) {
  const vc = positiveIsGood
    ? (val > 0 ? GREEN : val < 0 ? RED   : T4)
    : (val > 0 ? RED   : val < 0 ? GREEN : T4)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 14, color: T1, fontWeight: 500,
                         letterSpacing: "-0.01em" }}>{label}</span>
          <span style={{ fontSize: 12, color: T4, marginLeft: 8 }}>{sub}</span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 14, color: vc, fontWeight: 600 }}>
          {val > 0 ? "+" : ""}{val}{unit}
        </span>
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
  const [active,   setActive]   = useState(1)

  const base  = 2190
  const delta = (-rate * 0.018) + ((iija - 100) * 0.003) + (labor * 0.008) + (-material * 0.012)
  const proj  = base * (1 + delta / 100)
  const diff  = proj - base
  const pct   = (diff / base) * 100
  const up    = proj >= base

  function applyPreset(p: Preset, idx: number) {
    setRate(p.rate); setIija(p.iija); setLabor(p.labor); setMaterial(p.material)
    setActive(idx)
  }

  const impacts = [
    { label: "Rate shock",     val: (-rate * 0.018) / 100 * base },
    { label: "IIJA funding",   val: ((iija - 100) * 0.003) / 100 * base },
    { label: "Labor supply",   val: (labor * 0.008) / 100 * base },
    { label: "Material costs", val: (-material * 0.012) / 100 * base },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Scenario presets */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: T4,
                      letterSpacing: "0.1em", marginBottom: 10 }}>SCENARIO PRESETS</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PRESETS.map((p, i) => {
            const on = active === i
            return (
              <button key={p.label} onClick={() => applyPreset(p, i)}
                style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                         background: on ? BLUE + "22" : BG2,
                         border: `1px solid ${on ? BLUE : BD2}`,
                         fontSize: 13, fontWeight: on ? 600 : 400,
                         color: on ? BLUE : T3,
                         letterSpacing: "-0.01em", transition: "all 0.15s",
                         fontFamily: SYS }}>
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sliders */}
      <div>
        <SliderRow label="Rate Shock"     sub="basis points"
          val={rate}     setter={setRate}
          min={-200} max={200} step={25} unit="bps" positiveIsGood={false} />
        <SliderRow label="IIJA Funding"   sub="% of baseline"
          val={iija}     setter={setIija}
          min={50}   max={150} step={5}  unit="%" positiveIsGood={true} />
        <SliderRow label="Labor Supply"   sub="% change"
          val={labor}    setter={setLabor}
          min={-5}   max={5}   step={0.5} unit="%" positiveIsGood={true} />
        <SliderRow label="Material Costs" sub="% change"
          val={material} setter={setMaterial}
          min={-20}  max={20}  step={2}   unit="%" positiveIsGood={false} />
      </div>

      {/* Result panel */}
      <div style={{ background: up ? color.greenDim : color.redDim,
                    borderRadius: 14, padding: "20px",
                    border: up ? "1px solid rgba(48,209,88,0.28)" : "1px solid rgba(255,69,58,0.28)" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: T4,
                      letterSpacing: "0.1em", marginBottom: 10 }}>
          PROJECTED TOTAL CONSTRUCTION SPEND
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 34, color: up ? GREEN : RED,
                         fontWeight: 700, lineHeight: 1 }}>
            {fmtB(proj)}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 14, color: up ? GREEN : RED }}>
            {diff >= 0 ? "+" : ""}{fmtB(Math.abs(diff))} ({fmtPct(pct)})
          </span>
        </div>

        {/* Impact breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, borderTop: `1px solid ${BD1}`, paddingTop: 12 }}>
          {impacts.map(({ label, val: v }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T3 }}>{label}</span>
              <span style={{ fontFamily: MONO, fontSize: 12,
                             color: v === 0 ? T4 : v > 0 ? GREEN : RED }}>
                {v === 0 ? "—" : `${v > 0 ? "+" : ""}${fmtB(Math.abs(v))}`}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
