'use client'
import { font, color } from '@/lib/theme'

const MONO = font.mono, SYS = font.sys

interface SectionHeaderProps {
  sectionId?:    string
  title:         string
  subtitle?:     string
  badge?:        string
  live?:         boolean
  rightContent?: React.ReactNode
  onExportCSV?:  () => void
  onExportPNG?:  () => void
}

export function SectionHeader({
  title, subtitle, badge, live, rightContent, onExportCSV, onExportPNG,
}: SectionHeaderProps) {
  const hasExports = onExportCSV || onExportPNG
  const right = rightContent ?? (hasExports
    ? (
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
        {onExportCSV && (
          <button onClick={onExportCSV} style={{
            background: 'transparent', color: color.t4,
            fontFamily: MONO, fontSize: 11,
            padding: '5px 10px',
            border: `1px solid ${color.bd1}`,
            borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, minHeight: 44,
          }}>
            CSV
          </button>
        )}
        {onExportPNG && (
          <button onClick={onExportPNG} style={{
            background: 'transparent', color: color.t4,
            fontFamily: MONO, fontSize: 11,
            padding: '5px 10px',
            border: `1px solid ${color.bd1}`,
            borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, minHeight: 44,
          }}>
            PNG
          </button>
        )}
      </div>
    )
    : null
  )

  return (
    <div style={{ paddingBottom: 12, borderBottom: `1px solid ${color.bd2}`, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          {(live || badge) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {live && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: MONO, fontSize: 10, color: color.green }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.green, boxShadow: `0 0 6px ${color.green}`, display: 'inline-block' }} />
                  LIVE
                </span>
              )}
              {badge && (
                <span style={{
                  fontFamily: MONO, fontSize: 10, color: color.amber,
                  background: color.amber + '22',
                  border: `1px solid ${color.amber}44`,
                  borderRadius: 6, padding: '2px 8px',
                }}>
                  {badge}
                </span>
              )}
            </div>
          )}
          <h2 style={{ fontFamily: SYS, fontSize: 22, fontWeight: 700, color: color.t1, letterSpacing: '-0.01em', margin: 0 }}>
            {title}
          </h2>
          {subtitle && (
            <div style={{ fontFamily: SYS, fontSize: 14, color: color.t3, marginTop: 4 }}>
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>
    </div>
  )
}
