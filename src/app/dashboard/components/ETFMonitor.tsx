"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono, SYS = font.sys
const AMBER = color.amber, GREEN = color.green, RED = color.red
const BG2 = color.bg2, BD1 = color.bd1
const T1 = color.t1, T3 = color.t3, T4 = color.t4

export interface ETFData {
  ticker: string
  name: string
  price: number
  change1d: number
  change1w: number
  change1m: number
  signal: string
  signalColor: string
}

const SIGNAL_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  BUY:  { bg: GREEN+"22", border: GREEN+"44", text: GREEN },
  HOLD: { bg: AMBER+"22", border: AMBER+"44", text: AMBER },
  SELL: { bg: RED+"22",   border: RED+"44",   text: RED   },
}

function ChangeRow({ label, value }: { label: string; value: number }) {
  const col = value >= 0 ? GREEN : RED
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", borderBottom:`1px solid ${BD1}` }}>
      <span style={{ fontFamily:MONO, fontSize:11, color:T4 }}>{label}</span>
      <span style={{ fontFamily:MONO, fontSize:13, color:col, fontWeight:600 }}>
        {value >= 0 ? "+" : ""}{value.toFixed(2)}%
      </span>
    </div>
  )
}

interface ETFMonitorProps {
  etfs?: ETFData[]
}

const DEFAULTS: ETFData[] = [
  { ticker:"ITB", name:"iShares Home Construction ETF",            price:84.32, change1d:0.84, change1w:2.14, change1m:-1.84, signal:"BUY",  signalColor:GREEN },
  { ticker:"XHB", name:"SPDR S&P Homebuilders ETF",               price:72.18, change1d:0.62, change1w:1.88, change1m:-2.14, signal:"BUY",  signalColor:GREEN },
  { ticker:"PKB", name:"Invesco Dynamic Building & Construction",  price:38.42, change1d:0.48, change1w:1.24, change1m:0.84,  signal:"HOLD", signalColor:AMBER },
]

export function ETFMonitor({ etfs }: ETFMonitorProps) {
  const items = (etfs && etfs.length > 0) ? etfs : DEFAULTS
  const s = SIGNAL_STYLES
  return (
    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
      {items.map(etf => {
        const sig = s[etf.signal] ?? s.HOLD
        return (
          <div key={etf.ticker} style={{ background:BG2, border:`1px solid ${BD1}`, borderRadius:16, padding:"20px 22px", flex:"1 1 200px", minWidth:180 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <span style={{ fontFamily:MONO, fontSize:20, color:AMBER, fontWeight:700 }}>{etf.ticker}</span>
              <span style={{ fontFamily:MONO, fontSize:11, color:sig.text, background:sig.bg, border:`1px solid ${sig.border}`, borderRadius:6, padding:"3px 9px" }}>{etf.signal}</span>
            </div>
            <div style={{ fontFamily:SYS, fontSize:12, color:T3, marginBottom:14, lineHeight:1.4 }}>{etf.name}</div>
            <div style={{ fontFamily:MONO, fontSize:24, color:T1, fontWeight:700, marginBottom:14 }}>${etf.price.toFixed(2)}</div>
            <ChangeRow label="1 Day"   value={etf.change1d} />
            <ChangeRow label="1 Week"  value={etf.change1w} />
            <ChangeRow label="1 Month" value={etf.change1m} />
          </div>
        )
      })}
    </div>
  )
}
