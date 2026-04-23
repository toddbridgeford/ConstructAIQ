'use client'
import { color, font } from '@/lib/theme'

interface SectionVerdictProps {
  text: string
}

export function SectionVerdict({ text }: SectionVerdictProps) {
  return (
    <p style={{
      fontFamily:  font.sys,
      fontSize:    13,
      color:       color.t3,
      lineHeight:  1.6,
      borderTop:   `1px solid ${color.bd1}`,
      paddingTop:  12,
      marginTop:   12,
      marginBottom: 0,
    }}>
      {text}
    </p>
  )
}
