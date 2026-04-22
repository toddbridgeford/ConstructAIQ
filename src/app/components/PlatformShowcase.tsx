import Link from "next/link"
import { color, font, sentBg } from "@/lib/theme"

const { amber: AMBER, green: GREEN, red: RED, blue: BLUE,
        bg2: BG2, bg3: BG3, bd1: BD1, t2: T2, t3: T3, t4: T4 } = color
const SYS  = font.sys
const MONO = font.mono

const STATE_ROWS = [
  { state:"TX", label:"HOT",     pct:92, col:RED   },
  { state:"FL", label:"HOT",     pct:89, col:RED   },
  { state:"AZ", label:"GROWING", pct:74, col:AMBER },
  { state:"NC", label:"GROWING", pct:71, col:AMBER },
  { state:"OH", label:"COOLING", pct:48, col:BLUE  },
]

const MATERIALS = [
  { mat:"Lumber",   signal:"BUY",  chg:"+2.1%", col:GREEN },
  { mat:"Steel",    signal:"HOLD", chg:"+0.4%", col:AMBER },
  { mat:"Concrete", signal:"BUY",  chg:"+1.8%", col:GREEN },
  { mat:"Copper",   signal:"SELL", chg:"-3.2%", col:RED   },
  { mat:"WTI",      signal:"HOLD", chg:"-0.9%", col:AMBER },
]

const PANEL_HDR: React.CSSProperties = {
  fontFamily:SYS, fontSize:11, color:T4, fontWeight:600,
  letterSpacing:"0.04em", marginBottom:18, textTransform:"uppercase",
}
const PANEL: React.CSSProperties = {
  flex:"1 1 240px", background:BG2, borderRadius:18, border:`1px solid ${BD1}`,
  padding:22, minHeight:260, display:"flex", flexDirection:"column",
}

export function PlatformShowcase() {
  return (
    <section className="sec sec-dk">
      <div className="wrap">
        <div className="hd-center">
          <p className="eyebrow-lbl">Platform Intelligence</p>
          <h2 className="h2">Everything in context.<br />Nothing buried.</h2>
          <p className="sub">State-level activity, materials signals, and live market data — unified in one view.</p>
        </div>

        <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>

          {/* State activity */}
          <div style={PANEL}>
            <div style={PANEL_HDR}>State Activity</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
              {STATE_ROWS.map(({ state, label, pct, col }) => (
                <div key={state} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontFamily:MONO, fontSize:11, color:T3, width:22 }}>{state}</span>
                  <div style={{ flex:1, height:5, background:BG3, borderRadius:3, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:col, borderRadius:3 }} />
                  </div>
                  <span style={{ fontFamily:MONO, fontSize:10, color:col,
                                 width:56, textAlign:"right", letterSpacing:"0.04em" }}>{label}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard" style={{ fontFamily:SYS, fontSize:13, color:T4, marginTop:18, display:"block", fontWeight:500 }}>
              All 50 states →
            </Link>
          </div>

          {/* Materials signals */}
          <div style={PANEL}>
            <div style={PANEL_HDR}>Materials Signals</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12, flex:1 }}>
              {MATERIALS.map(({ mat, signal, chg, col }) => (
                <div key={mat} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:14, color:T2, fontWeight:500 }}>{mat}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontFamily:MONO, fontSize:11, color:T4 }}>{chg}</span>
                    <span style={{ fontFamily:MONO, fontSize:10, color:col,
                                   background:sentBg(signal), borderRadius:6,
                                   padding:"3px 8px", letterSpacing:"0.04em" }}>{signal}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/dashboard" style={{ fontFamily:SYS, fontSize:13, color:T4, marginTop:18, display:"block", fontWeight:500 }}>
              Full signals →
            </Link>
          </div>

          {/* Live market metrics */}
          <div style={{ ...PANEL, gap:16 }}>
            <div style={PANEL_HDR}>Live Market Data</div>
            <div style={{ display:"flex", flexDirection:"column", gap:16, flex:1 }}>
              {[
                { lbl:"Total Construction Spend", val:"$2.2B",   mom:0.3,  col:AMBER },
                { lbl:"Construction Employment",  val:"8.3M",    mom:0.31, col:GREEN },
              ].map(({ lbl, val, mom, col }) => (
                <div key={lbl} style={{ paddingBottom:14, borderBottom:`1px solid ${BD1}` }}>
                  <div style={{ fontFamily:SYS, fontSize:10, color:T4, fontWeight:600,
                                letterSpacing:"0.04em", marginBottom:5, textTransform:"uppercase" }}>{lbl}</div>
                  <div style={{ fontFamily:MONO, fontSize:24, fontWeight:700, color:col, lineHeight:1 }}>{val}</div>
                  <div style={{ fontFamily:MONO, fontSize:12, color:mom >= 0 ? GREEN : RED, marginTop:3 }}>
                    {mom >= 0 ? "+" : ""}{mom.toFixed(2)}% MoM
                  </div>
                </div>
              ))}
              <div>
                <div style={{ fontFamily:SYS, fontSize:10, color:T4, fontWeight:600,
                              letterSpacing:"0.04em", marginBottom:5, textTransform:"uppercase" }}>Active AI Signals</div>
                <div style={{ fontFamily:MONO, fontSize:24, fontWeight:700, color:BLUE, lineHeight:1 }}>6</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
