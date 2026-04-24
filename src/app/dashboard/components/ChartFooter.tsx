'use client'
import { color, font } from '@/lib/theme'

interface ChartFooterProps {
  source:       string
  unit:         string
  frequency:    string
  asOf?:        string | null
  preliminary?: boolean
  forecast?:    boolean
}

export function ChartFooter({
  source, unit, frequency, asOf, preliminary, forecast,
}: ChartFooterProps) {
  const dateStr = asOf
    ? new Date(asOf).toLocaleDateString('en-US', {
        month: 'short', year: 'numeric',
      })
    : null

  return (
    <div style={{
      display:    'flex',
      flexWrap:   'wrap',
      gap:        '6px 16px',
      marginTop:  10,
      paddingTop: 8,
      borderTop:  `1px solid ${color.bd1}`,
    }}>
      <span style={{ fontFamily: font.mono, fontSize: 10,
        color: color.t4, letterSpacing: '0.04em' }}>
        Source: {source}
      </span>
      <span style={{ fontFamily: font.mono, fontSize: 10,
        color: color.t4 }}>
        {unit} · {frequency}
      </span>
      {dateStr && (
        <span style={{ fontFamily: font.mono, fontSize: 10,
          color: color.t4 }}>
          Data as of {dateStr}
        </span>
      )}
      {preliminary && (
        <span style={{ fontFamily: font.mono, fontSize: 9,
          color: color.amber, letterSpacing: '0.06em',
          background: color.amber + '20',
          padding: '1px 6px', borderRadius: 4 }}>
          PRELIMINARY
        </span>
      )}
      {forecast && (
        <span style={{ fontFamily: font.mono, fontSize: 9,
          color: color.blue, letterSpacing: '0.06em',
          background: color.blue + '20',
          padding: '1px 6px', borderRadius: 4 }}>
          INCLUDES FORECAST
        </span>
      )}
    </div>
  )
}
