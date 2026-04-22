import { color, font } from "@/lib/theme"

const { bd1: BD1, t4: T4, green: GREEN } = color
const SYS  = font.sys
const MONO = font.mono

const SOURCES = ["Census Bureau", "BLS", "FRED / Fed Reserve", "BEA", "EIA", "USASpending.gov"]

const FREE_POINTS = ["Free forever", "Open API", "Open methodology", "Trusted by economists, lenders, and contractors"]

export function TrustStrip() {
  return (
    <div className="wrap" style={{ paddingTop:40 }}>
      <div style={{
        borderTop: `1px solid ${BD1}`,
        padding: "18px 0", display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:8,
      }}>
        <span style={{ fontFamily:SYS, fontSize:11, color:T4, fontWeight:600,
                       letterSpacing:"0.04em", whiteSpace:"nowrap", textTransform:"uppercase" }}>
          Data from
        </span>
        {SOURCES.map((s, i) => (
          <span key={i} style={{
            fontSize:12, color:T4, fontWeight:500, padding:"0 14px", whiteSpace:"nowrap",
            borderLeft: i > 0 ? `1px solid ${BD1}` : "none",
          }}>{s}</span>
        ))}
      </div>
      <div style={{
        borderTop: `1px solid ${BD1}`, borderBottom: `1px solid ${BD1}`,
        padding: "14px 0", display:"flex", alignItems:"center",
        justifyContent:"center", flexWrap:"wrap", gap:0,
      }}>
        {FREE_POINTS.map((s, i) => (
          <span key={i} style={{
            fontFamily: MONO, fontSize:11, color: GREEN, fontWeight:600,
            letterSpacing:"0.06em", padding:"0 18px", whiteSpace:"nowrap",
            borderLeft: i > 0 ? `1px solid ${BD1}` : "none",
          }}>{s}</span>
        ))}
      </div>
    </div>
  )
}
