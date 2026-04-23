'use client'
import { color, font, type as typeScale } from '@/lib/theme'

interface KPICardProps {
  label:        string
  value:        string
  change?:      number
  changeLabel?: string
  spark?:       number[]
  loading?:     boolean
}

function SparkLine({ data, positive }: { data: number[], positive: boolean }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 72, h = 20
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) + 1}`
  ).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block', flexShrink: 0 }}>
      <polyline
        points={pts}
        fill="none"
        stroke={positive ? color.green : color.red}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function KPICard({ label, value, change, changeLabel, spark, loading }: KPICardProps) {
  if (loading) {
    return (
      <div style={{
        height:      120,
        background:  color.bg2,
        borderRadius: 12,
        borderLeft:  `3px solid ${color.bd1}`,
        flex:        '1 1 160px',
      }} />
    )
  }

  const positive   = (change ?? 0) >= 0
  const borderColor = change === undefined
    ? color.bd1
    : positive ? color.green : color.red

  return (
    <div style={{
      height:         120,
      background:     color.bg2,
      border:         `1px solid ${color.bd1}`,
      borderLeft:     `3px solid ${borderColor}`,
      borderRadius:   12,
      padding:        '14px 16px',
      display:        'flex',
      flexDirection:  'column',
      justifyContent: 'space-between',
      flex:           '1 1 160px',
      minWidth:       0,
    }}>
      <span style={{ ...typeScale.label, color: color.t4 }}>{label}</span>
      <span style={{ ...typeScale.kpiSm, color: color.t1 }}>{value}</span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {change !== undefined && (
          <span style={{
            fontFamily: font.mono,
            fontSize:   11,
            fontWeight: 600,
            color:      positive ? color.green : color.red,
          }}>
            {positive ? '+' : ''}{change.toFixed(2)}%{changeLabel ? ' ' + changeLabel : ''}
          </span>
        )}
        {spark && spark.length >= 2 && <SparkLine data={spark} positive={positive} />}
      </div>
    </div>
  )
}
