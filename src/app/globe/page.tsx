"use client"
import dynamic from 'next/dynamic'

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
          fontFamily:"ui-monospace,'SF Mono',Consolas,monospace",
          fontSize:"13px", color:"#f5a623", marginBottom:"16px",
        }}>
          ◉ INITIALIZING GEOINTEL SYSTEM
        </div>
        <div style={{fontFamily:"ui-monospace,'SF Mono',Consolas,monospace",fontSize:"11px",color:"#444"}}>
          CONSTRUCTAIQ PHASE 5 · GEOSPATIAL INTELLIGENCE
        </div>
      </div>
    ),
  }
)

export default function GlobePage() {
  return <GlobeClient />
}
