'use client'
import { AlertTriangle } from "lucide-react"
import { color, font } from "@/lib/theme"

interface Props {
  message:    string
  detail?:    string
  cached_at?: string
}

export function ErrorState({ message, detail, cached_at }: Props) {
  const cachedLabel = cached_at
    ? new Date(cached_at).toLocaleString([], {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div style={{
      background:   color.amber + '10',
      border:       `1px solid ${color.amber}44`,
      borderRadius: 12,
      padding:      '16px 20px',
      display:      'flex',
      gap:          12,
      alignItems:   'flex-start',
    }}>
      <AlertTriangle size={18} color={color.amber} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontFamily: font.sys,
          fontSize:   14,
          fontWeight: 600,
          color:      color.amber,
        }}>
          {message}
        </div>
        {detail && (
          <div style={{
            fontFamily: font.sys,
            fontSize:   13,
            color:      color.t3,
            lineHeight: 1.55,
          }}>
            {detail}
          </div>
        )}
        {cachedLabel && (
          <div style={{
            fontFamily:    font.mono,
            fontSize:      11,
            color:         color.t4,
            letterSpacing: '0.04em',
            marginTop:     4,
          }}>
            Showing cached data from {cachedLabel}
          </div>
        )}
      </div>
    </div>
  )
}
