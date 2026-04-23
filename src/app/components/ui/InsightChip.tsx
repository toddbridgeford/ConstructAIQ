"use client"
import { useState } from "react"
import { color, font } from "@/lib/theme"

export type InsightType = 'anomaly' | 'trend' | 'benchmark' | 'context'

export interface InsightChipProps {
  type:    InsightType
  text:    string
  detail?: string
  size:    'sm' | 'md'
}

function chipConfig(type: InsightType): { icon: string; borderColor: string; bg: string; fg: string } {
  switch (type) {
    case 'anomaly':   return { icon: '⚠',  borderColor: color.amber, bg: color.amber + '14', fg: color.amber }
    case 'trend':     return { icon: '↑↓', borderColor: color.blue,  bg: color.blue  + '14', fg: color.blue  }
    case 'benchmark': return { icon: '',   borderColor: 'transparent', bg: color.bg3,         fg: color.t3    }
    case 'context':   return { icon: 'i',  borderColor: 'transparent', bg: color.bg3,         fg: color.t4    }
  }
}

export function InsightChip({ type, text, detail, size }: InsightChipProps) {
  const [shown,     setShown]     = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const { icon, borderColor, bg, fg } = chipConfig(type)
  const sm = size === 'sm'

  const hasBorder = type === 'anomaly' || type === 'trend'

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: sm ? 2 : 4 }}
      onMouseEnter={() => detail && setShown(true)}
      onMouseLeave={() => setShown(false)}
    >
      <span style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           sm ? 3 : 4,
        background:    bg,
        borderLeft:    hasBorder ? `2px solid ${borderColor}` : 'none',
        borderRadius:  sm ? 4 : 5,
        padding:       sm ? '2px 6px' : '4px 9px',
        fontFamily:    font.mono,
        fontSize:      sm ? 10 : 12,
        fontWeight:    600,
        color:         fg,
        letterSpacing: '0.02em',
        lineHeight:    sm ? 1.2 : 1.4,
        whiteSpace:    sm ? 'nowrap' : 'normal',
        maxWidth:      sm ? 'none' : 260,
        cursor:        detail ? 'help' : 'default',
      }}>
        {icon && <span style={{ fontSize: sm ? 9 : 11, flexShrink: 0 }}>{icon}</span>}
        {text}
      </span>

      <button
        onClick={() => setDismissed(true)}
        style={{
          background:  'none',
          border:      'none',
          padding:     '0 1px',
          fontSize:    sm ? 9 : 10,
          color:       fg,
          opacity:     0.45,
          cursor:      'pointer',
          lineHeight:  1,
          flexShrink:  0,
        }}
        title="Dismiss"
      >
        ✕
      </button>

      {shown && detail && (
        <span style={{
          position:      'absolute',
          bottom:        '100%',
          left:          0,
          marginBottom:  6,
          zIndex:        999,
          background:    color.bg3,
          border:        `1px solid ${color.bd2}`,
          borderRadius:  7,
          padding:       '7px 11px',
          fontFamily:    font.mono,
          fontSize:      11,
          color:         color.t2,
          lineHeight:    1.45,
          whiteSpace:    'nowrap',
          pointerEvents: 'none',
          boxShadow:     '0 4px 16px rgba(0,0,0,0.35)',
        }}>
          {detail}
        </span>
      )}
    </span>
  )
}
