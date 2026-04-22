"use client"
import Link from "next/link"
import { font, color } from "@/lib/theme"

const SYS = font.sys, MONO = font.mono
const AMBER = color.amber, BG1 = color.bg1, BD1 = color.bd1, T1 = color.t1, T3 = color.t3, T4 = color.t4

interface GateLockProps {
  locked?: boolean
  requiredPlan: "Starter" | "Institutional" | "Enterprise"
  featureName: string
  children: React.ReactNode
}

export function GateLock({ locked = false, requiredPlan, featureName, children }: GateLockProps) {
  if (!locked) return <>{children}</>
  return (
    <div style={{ position: "relative" }}>
      <div style={{ opacity: 0.12, pointerEvents: "none", userSelect: "none", filter: "blur(3px)" }}>{children}</div>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}>
        <div style={{ background:BG1, border:`1px solid ${BD1}`, borderRadius:16, padding:"32px 40px", textAlign:"center", maxWidth:320, boxShadow:"0 8px 40px rgba(0,0,0,0.53)" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔒</div>
          <div style={{ fontFamily:SYS, fontSize:16, color:T1, fontWeight:600, marginBottom:8 }}>{featureName}</div>
          <div style={{ fontFamily:SYS, fontSize:14, color:T3, marginBottom:4 }}>Requires</div>
          <div style={{ fontFamily:MONO, fontSize:15, color:AMBER, fontWeight:700, marginBottom:20 }}>{requiredPlan.toUpperCase()} ACCESS</div>
          <Link href="/contact">
            <button style={{ background:AMBER, color:"#000", fontFamily:MONO, fontSize:13, fontWeight:700, padding:"10px 24px", borderRadius:10, letterSpacing:"0.06em", cursor:"pointer", border:"none" }}>
              CONTACT US TO UNLOCK →
            </button>
          </Link>
          <div style={{ fontFamily:SYS, fontSize:12, color:T4, marginTop:10 }}>or <Link href="/pricing" style={{ color:AMBER, textDecoration:"underline" }}>view pricing</Link></div>
        </div>
      </div>
    </div>
  )
}
