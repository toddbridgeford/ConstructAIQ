'use client'
import { color, font } from '@/lib/theme'

export type BenchmarkClassification = 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'

export interface BenchmarkResult {
  series?:          string
  city?:            string
  city_name?:       string
  current_value:    number
  percentile:       number
  classification:   BenchmarkClassification
  mean:             number
  median:           number
  p25:              number
  p75:              number
  p10:              number
  p90:              number
  yoy_change_pct:   number | null
  trend_5yr?:       'RISING' | 'DECLINING' | 'STABLE'
  benchmark_period: string
  label:            string
  as_of:            string
}

interface BenchmarkBadgeProps {
  classification: BenchmarkClassification
  percentile:     number
  label?:         string
}

export function BenchmarkBadge({ classification, percentile, label }: BenchmarkBadgeProps) {
  let bg:   string
  let fg:   string
  let text: string

  if (classification === 'ABOVE_AVERAGE') {
    bg   = color.green + '22'
    fg   = color.green
    text = `Above avg · P${percentile}`
  } else if (classification === 'BELOW_AVERAGE') {
    bg   = color.red + '22'
    fg   = color.red
    text = `Below avg · P${percentile}`
  } else {
    bg   = color.bg2
    fg   = color.t3
    text = `Near avg · P${percentile}`
  }

  return (
    <span
      title={label}
      style={{
        display:       'inline-block',
        background:    bg,
        color:         fg,
        borderRadius:  20,
        padding:       '2px 8px',
        fontFamily:    font.mono,
        fontSize:      10,
        fontWeight:    600,
        letterSpacing: '0.06em',
        whiteSpace:    'nowrap',
        cursor:        label ? 'help' : 'default',
      }}
    >
      {text}
    </span>
  )
}
