"use client"
import { useState, useEffect } from "react"
import { Sidebar, type SidebarMode } from "@/app/components/Sidebar"
import { ContextPanel }               from "@/app/components/ContextPanel"
import { BottomNav }                  from "@/app/dashboard/components/BottomNav"
import { layout as L }                from "@/lib/theme"

type Breakpoint = 'wide' | 'mid' | 'narrow' | 'mobile'

function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'wide'
  const w = window.innerWidth
  if (w >= 1280) return 'wide'
  if (w >= 1024) return 'mid'
  if (w >= 768)  return 'narrow'
  return 'mobile'
}

function sidebarModeFor(bp: Breakpoint): SidebarMode {
  if (bp === 'mobile') return 'hidden'
  if (bp === 'narrow') return 'icon'
  return 'full'
}

function sidebarWidthFor(bp: Breakpoint): number {
  if (bp === 'mobile') return 0
  if (bp === 'narrow') return 64
  return L.sidebar
}

interface Props {
  children:       React.ReactNode
  activeSection?: string
  onNavigate?:    (section: string) => void
}

export function DashboardShell({ children, activeSection, onNavigate }: Props) {
  const [bp, setBp]                         = useState<Breakpoint>('wide')
  const [contextPanelOpen, setContextOpen]  = useState(true)

  useEffect(() => {
    const update = () => {
      const next = getBreakpoint()
      setBp(next)
      // collapse context panel automatically on mid/narrow/mobile
      if (next !== 'wide') setContextOpen(false)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const sidebarMode   = sidebarModeFor(bp)
  const marginLeft    = sidebarWidthFor(bp)
  const contextWidth  = bp === 'wide' && contextPanelOpen ? L.contextPanel : 0
  // extra 20px for the toggle tab at right edge
  const marginRight   = contextWidth > 0 ? contextWidth + 20 : 20

  return (
    <>
      <Sidebar mode={sidebarMode} activeSection={activeSection} onNavigate={onNavigate} />

      <main
        style={{
          marginLeft,
          marginRight,
          minHeight:  '100vh',
          transition: 'margin 0.2s ease',
        }}
      >
        {children}
      </main>

      {bp === 'wide' && (
        <ContextPanel
          open={contextPanelOpen}
          onToggle={() => setContextOpen(o => !o)}
        />
      )}

      {bp === 'mobile' && <BottomNav />}
    </>
  )
}
