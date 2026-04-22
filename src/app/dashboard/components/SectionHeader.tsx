"use client"
import { font, color } from "@/lib/theme"

const MONO = font.mono, SYS = font.sys
const AMBER = color.amber, GREEN = color.green
const BG2 = color.bg2, BD1 = color.bd1, BD2 = color.bd2
const T1 = color.t1, T3 = color.t3, T4 = color.t4

interface SectionHeaderProps {
  sectionId: string
  title: string
  subtitle?: string
  badge?: string
  live?: boolean
  onExportCSV?: () => void
  onExportPNG?: () => void
}

export function SectionHeader({ sectionId, title, subtitle, badge, live, onExportCSV, onExportPNG }: SectionHeaderProps) {
  const hasExports = onExportCSV || onExportPNG
  return (
    <div style={{ paddingBottom:12, borderBottom:`1px solid ${BD2}`, marginBottom:24 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <span style={{ fontFamily:MONO, fontSize:10, color:T4, letterSpacing:"0.12em" }}>{sectionId}</span>
            {live && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontFamily:MONO, fontSize:10, color:GREEN }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:GREEN, boxShadow:`0 0 6px ${GREEN}`, display:"inline-block" }} />
                LIVE
              </span>
            )}
            {badge && <span style={{ fontFamily:MONO, fontSize:10, color:AMBER, background:AMBER+"22", border:`1px solid ${AMBER}44`, borderRadius:6, padding:"2px 8px" }}>{badge}</span>}
          </div>
          <h2 style={{ fontFamily:SYS, fontSize:22, fontWeight:700, color:T1, letterSpacing:"-0.01em", margin:0 }}>{title}</h2>
          {subtitle && <div style={{ fontFamily:SYS, fontSize:14, color:T3, marginTop:4 }}>{subtitle}</div>}
        </div>
        {hasExports && (
          <div style={{ display:"flex", gap:6, flexShrink:0, marginTop:2 }}>
            {onExportCSV && (
              <button onClick={onExportCSV} style={{ background:"transparent", color:T4, fontFamily:MONO, fontSize:11, padding:"5px 10px", border:`1px solid ${BD1}`, borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:4, minHeight:44 }}>
                📥 <span>CSV</span>
              </button>
            )}
            {onExportPNG && (
              <button onClick={onExportPNG} style={{ background:"transparent", color:T4, fontFamily:MONO, fontSize:11, padding:"5px 10px", border:`1px solid ${BD1}`, borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:4, minHeight:44 }}>
                📷 <span>PNG</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
