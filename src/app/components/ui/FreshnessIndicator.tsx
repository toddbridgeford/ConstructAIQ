'use client'
import { color, font } from "@/lib/theme"

interface Props {
  updated_at: string
  label?:     string
}

function relativeTime(iso: string): string {
  const ms  = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60_000)
  const hr  = Math.floor(ms / 3_600_000)
  const day = Math.floor(ms / 86_400_000)

  if (min < 2)   return 'just now'
  if (min < 60)  return `${min} minutes ago`
  if (hr  < 2)   return '1 hour ago'
  if (hr  < 24)  return `${hr} hours ago`
  if (day === 1) return 'yesterday'
  return `${day} days ago`
}

function isStale(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() > 48 * 3_600_000
}

export function FreshnessIndicator({ updated_at, label }: Props) {
  const stale = isStale(updated_at)
  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        6,
      fontFamily: font.mono,
      fontSize:   11,
      color:      color.t4,
      marginTop:  8,
      padding:    '0 4px',
    }}>
      {stale && (
        <span style={{
          width:       6,
          height:      6,
          borderRadius:'50%',
          background:  color.amber,
          display:     'inline-block',
          flexShrink:  0,
        }} />
      )}
      <span>{label ?? 'Updated'} {relativeTime(updated_at)}</span>
    </div>
  )
}
