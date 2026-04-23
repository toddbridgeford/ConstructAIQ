'use client'
import { font, signal } from '@/lib/theme'

function statusToColor(status: string): string {
  const s = status.toUpperCase().replace(/[\s-]/g, '_')
  if (['EXPANDING', 'BULLISH', 'ACTIVE', 'HIGH', 'OPEN', 'LIVE'].includes(s))          return signal.expand
  if (['CONTRACTING', 'BEARISH', 'INACTIVE', 'LOW', 'CLOSED'].includes(s))             return signal.contract
  if (['WATCH', 'WARNING', 'MODERATE', 'CLOSING', 'CLOSING_SOON'].includes(s))         return signal.watch
  if (['FEDERAL', 'GOVERNMENT', 'FEDERAL_INVESTMENT'].includes(s))                      return signal.federal
  return signal.neutral
}

interface StatusBadgeProps {
  status: string
  size?:  'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const col = statusToColor(status)
  return (
    <span style={{
      display:       'inline-block',
      fontFamily:    font.mono,
      fontSize:      size === 'sm' ? 9 : 11,
      fontWeight:    600,
      letterSpacing: '0.06em',
      padding:       size === 'sm' ? '1px 6px' : '3px 10px',
      borderRadius:  20,
      color:         col,
      background:    col + '22',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
