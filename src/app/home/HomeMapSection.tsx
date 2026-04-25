"use client"
import dynamic from "next/dynamic"
import { color, type as TS } from "@/lib/theme"
import { WHITE, BD, T3 } from "./home-utils"
import type { MapState } from "../components/HomeMap"

function MapPlaceholder() {
  return (
    <div style={{
      width: '100%', height: 380,
      background: color.lightBgSkel,
      animation: 'shimmer 1.5s infinite',
      backgroundImage: `linear-gradient(90deg, ${color.lightBgSkel} 25%, ${color.lightBgSub} 50%, ${color.lightBgSkel} 75%)`,
      backgroundSize: '200% 100%',
    }} />
  )
}

const HomeMap = dynamic(
  () => import("../components/HomeMap").then(m => m.HomeMap),
  { ssr: false, loading: () => <MapPlaceholder /> },
)

interface Props {
  mapStates: MapState[]
  mapDate:   string
}

export function HomeMapSection({ mapStates, mapDate }: Props) {
  return (
    <section style={{ background: WHITE, borderTop: `1px solid ${BD}` }}>
      <HomeMap states={mapStates} />
      <div style={{
        textAlign: 'center', padding: '14px 40px 20px',
        ...TS.caption, color: T3,
      }}>
        Hot markets as of {mapDate || '—'}
      </div>
    </section>
  )
}
