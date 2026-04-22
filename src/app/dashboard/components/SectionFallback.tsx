"use client"
import { color, font } from "@/lib/theme"

export function SectionFallback({ title }: { title: string }) {
  return (
    <div style={{ padding:"28px",borderRadius:16,border:`1px solid ${color.bd1}`,background:color.bg1,margin:"48px 0 8px",display:"flex",gap:12,alignItems:"center" }}>
      <span style={{ fontFamily:font.mono,fontSize:10,color:color.amber,letterSpacing:"0.1em" }}>SECTION ERROR</span>
      <span style={{ fontFamily:font.sys,fontSize:13,color:color.t3 }}>{title} failed to load. Reload to retry.</span>
    </div>
  )
}
