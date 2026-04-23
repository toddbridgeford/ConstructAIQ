'use client'
import { color, font } from '@/lib/theme'
import { setPrefs } from '@/lib/preferences'

interface RolePromptProps {
  onSelect: () => void
}

const ROLES: { id: string; label: string }[] = [
  { id: 'contractor', label: 'Contractor' },
  { id: 'lender',     label: 'Lender / Investor' },
  { id: 'supplier',   label: 'Supplier' },
]

export function RolePrompt({ onSelect }: RolePromptProps) {
  function choose(role: string) {
    setPrefs({ role })
    onSelect()
  }

  return (
    <div
      role="dialog"
      aria-label="Personalize your experience"
      style={{
        position:     'fixed',
        bottom:       0,
        left:         0,
        right:        0,
        zIndex:       900,
        background:   color.bg1,
        borderTop:    `1px solid ${color.bd2}`,
        padding:      '16px 24px env(safe-area-inset-bottom, 16px)',
        display:      'flex',
        alignItems:   'center',
        gap:          16,
        flexWrap:     'wrap',
        boxShadow:    '0 -4px 24px rgba(0,0,0,0.40)',
      }}
    >
      <span style={{
        fontFamily:  font.sys,
        fontSize:    14,
        color:       color.t2,
        fontWeight:  500,
        flexShrink:  0,
      }}>
        Tell us who you are for a better experience:
      </span>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
        {ROLES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => choose(id)}
            style={{
              fontFamily:    font.sys,
              fontSize:      13,
              fontWeight:    500,
              color:         color.t1,
              background:    color.bg3,
              border:        `1px solid ${color.bd2}`,
              borderRadius:  8,
              padding:       '8px 18px',
              cursor:        'pointer',
              transition:    'background 0.12s, border-color 0.12s',
              minHeight:     38,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background     = color.bg4
              ;(e.currentTarget as HTMLButtonElement).style.borderColor   = color.bd3
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background     = color.bg3
              ;(e.currentTarget as HTMLButtonElement).style.borderColor   = color.bd2
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={onSelect}
        title="Dismiss"
        aria-label="Dismiss role prompt"
        style={{
          background:  'none',
          border:      'none',
          color:       color.t4,
          fontSize:    18,
          cursor:      'pointer',
          padding:     '4px 8px',
          lineHeight:  1,
          flexShrink:  0,
        }}
      >
        ×
      </button>
    </div>
  )
}
