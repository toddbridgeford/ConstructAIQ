import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width:           '100%',
          height:          '100%',
          background:      '#0a0a0a',
          display:         'flex',
          flexDirection:   'column',
          justifyContent:  'space-between',
          padding:         '72px 80px',
          fontFamily:      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width:        8,
            height:       8,
            borderRadius: '50%',
            background:   '#22c55e',
            boxShadow:    '0 0 12px #22c55e',
          }} />
          <span style={{ fontSize: 13, color: '#6b7280', letterSpacing: '0.12em', fontWeight: 600 }}>
            LIVE · CONSTRUCTAIQ.TRADE
          </span>
        </div>

        {/* Center content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            fontSize:      11,
            fontWeight:    700,
            color:         '#f59e0b',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
            US Construction Intelligence
          </div>
          <div style={{
            fontSize:      64,
            fontWeight:    800,
            color:         '#f9fafb',
            lineHeight:    1.05,
            letterSpacing: '-0.03em',
          }}>
            Construction
            <br />
            Market Dashboard
          </div>
          <div style={{ fontSize: 20, color: '#9ca3af', maxWidth: 620, lineHeight: 1.5 }}>
            12-month AI forecast · Materials BUY/SELL/HOLD signals · Permit activity · WARN Act alerts
          </div>
        </div>

        {/* Bottom stats row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 48 }}>
            {[
              { label: 'Total Construction', value: '$2.19T' },
              { label: 'Employment',          value: '8.3M'   },
              { label: 'Building Permits',    value: '1.48M'  },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: '#f9fafb', letterSpacing: '-0.02em' }}>
                  {value}
                </span>
                <span style={{ fontSize: 12, color: '#6b7280', letterSpacing: '0.04em' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div style={{
            fontSize:      12,
            color:         '#374151',
            fontFamily:    'monospace',
            letterSpacing: '0.06em',
          }}>
            Free forever · No account required
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
