'use client'
import type { ReactNode } from "react"
import { color, font } from "@/lib/theme"

interface Props {
  icon:        ReactNode
  title:       string
  description: string
  action?:     { label: string; href: string }
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div style={{
      height:         200,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            12,
      background:     color.bg1,
      border:         `1px solid ${color.bd1}`,
      borderRadius:   12,
      padding:        '24px 32px',
      textAlign:      'center',
    }}>
      <div style={{ color: color.t4 }}>{icon}</div>
      <div style={{
        fontFamily: font.sys,
        fontSize:   15,
        fontWeight: 600,
        color:      color.t2,
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: font.sys,
        fontSize:   14,
        color:      color.t4,
        lineHeight: 1.6,
        maxWidth:   420,
      }}>
        {description}
      </div>
      {action && (
        <a
          href={action.href}
          style={{
            fontFamily:     font.mono,
            fontSize:       12,
            color:          color.amber,
            textDecoration: 'none',
            marginTop:      4,
          }}
        >
          {action.label} →
        </a>
      )}
    </div>
  )
}
