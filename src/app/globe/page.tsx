"use client"
import dynamic from 'next/dynamic'
import { ErrorBoundary } from '../dashboard/components/ErrorBoundary'
import { font, color } from '@/lib/theme'

const GlobeClient = dynamic(
  () => import('./GlobeClient'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width:"100vw", height:"100vh", background:"#000",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
      }}>
        <div style={{
          fontFamily: font.mono,
          fontSize:"13px", color: color.amber, marginBottom:"16px",
        }}>
          ◉ INITIALIZING GEOINTEL SYSTEM
        </div>
        <div style={{fontFamily: font.mono,fontSize:"11px",color:"#444"}}>
          CONSTRUCTAIQ PHASE 5 · GEOSPATIAL INTELLIGENCE
        </div>
      </div>
    ),
  }
)

export default function GlobePage() {
  return (
    <ErrorBoundary>
      <GlobeClient />
    </ErrorBoundary>
  )
}
