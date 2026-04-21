"use client"
import { useEffect } from "react"
import { color, font } from "@/lib/theme"

interface BottomSheetProps {
  open:     boolean
  onClose:  () => void
  title?:   string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else      document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0,
          background:"rgba(0,0,0,0.6)",
          backdropFilter:"blur(4px)",
          zIndex:400,
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position:"fixed", left:0, right:0, bottom:0, zIndex:401,
          background:color.bg1,
          borderRadius:"20px 20px 0 0",
          border:`1px solid ${color.bd1}`,
          borderBottom:"none",
          paddingBottom:"max(24px, env(safe-area-inset-bottom))",
          maxHeight:"85dvh",
          overflowY:"auto",
          animation:"sheet-up 0.25s ease",
        }}
      >
        {/* Drag handle */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:12, paddingBottom:4 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:color.bd2 }} />
        </div>

        {title && (
          <div style={{
            padding:"8px 24px 16px",
            fontFamily:font.sys, fontSize:16, fontWeight:600,
            color:color.t1, letterSpacing:"-0.01em",
          }}>
            {title}
          </div>
        )}

        <div style={{ padding:"0 24px 8px" }}>
          {children}
        </div>
      </div>
    </>
  )
}
