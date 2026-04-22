"use client"
import { color } from "@/lib/theme"

interface SkeletonProps {
  height:       number | string
  width?:       number | string
  borderRadius?: number | string
  style?:       React.CSSProperties
}

export function Skeleton({ height, width, borderRadius = 12, style }: SkeletonProps) {
  return (
    <div style={{
      height,
      width: width ?? "100%",
      borderRadius,
      background: `linear-gradient(90deg, ${color.bg2} 25%, ${color.bg3} 50%, ${color.bg2} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.6s infinite",
      flexShrink: 0,
      ...style,
    }} />
  )
}
