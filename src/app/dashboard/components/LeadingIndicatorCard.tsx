"use client"
import { useState, useEffect } from "react"
import { color, font } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys

interface LICSComponent {
  score:       number
  value:       number
  weight:      number
  label:       string
  lag_months?: number
}

interface LICSData {
  lics:           number
  interpretation: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  horizon:        string
  components: {
    abi:              LICSComponent
    permits:          LICSComponent
    federal_pipeline: LICSComponent
    jolts:            LICSComponent
  }
  as_of: string
}

function scoreColor(score: number): string {
  if (score >= 60) return color.green
  if (score >= 40) return color.amber
  return color.red
}

export function LeadingIndicatorCard() {
  const [data, setData] = useState<LICSData | null>(null)

  useEffect(() => {
    fetch('/api/leading-indicators')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => { /* leave null — skeleton stays visible */ })
  }, [])

  const licsCol   = data ? scoreColor(data.lics) : color.t4
  const interpCol = data
    ? data.interpretation === 'POSITIVE' ? color.green
    : data.interpretation === 'NEUTRAL'  ? color.amber
    : color.red
    : color.t4

  const comps = data ? [
    { key: 'abi',              ...data.components.abi              },
    { key: 'permits',          ...data.components.permits          },
    { key: 'federal_pipeline', ...data.components.federal_pipeline },
    { key: 'jolts',            ...data.components.jolts            },
  ] : []

  return (
    <div style={{ background: color.bg2, borderRadius: 16, padding: 20, border: `1px solid ${color.bd1}` }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.amber, fontWeight: 600, letterSpacing: '0.08em', marginBottom: 12 }}>
        LEADING INDICATOR COMPOSITE — 6M
      </div>

      {/* Score + badge */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {data ? (
          <>
            <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 700, color: licsCol, lineHeight: 1 }}>
              {data.lics}
            </span>
            <span style={{
              fontFamily: MONO, fontSize: 10, fontWeight: 600,
              color: interpCol, background: interpCol + '22',
              border: `1px solid ${interpCol}44`,
              borderRadius: 20, padding: '3px 10px', letterSpacing: '0.06em',
            }}>
              {data.interpretation}
            </span>
          </>
        ) : (
          <div style={{ width: 80, height: 36, background: color.bg4, borderRadius: 8 }} />
        )}
      </div>

      {/* Component mini-bars */}
      {data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {comps.map(c => (
            <div key={c.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{
                  fontFamily: SYS, fontSize: 11, color: color.t3,
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '76%',
                }}>
                  {c.label}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: scoreColor(c.score), flexShrink: 0 }}>
                  {c.score}
                </span>
              </div>
              <div style={{ background: color.bg4, borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div style={{
                  width: `${c.score}%`, height: '100%',
                  background: scoreColor(c.score), borderRadius: 4,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 24, background: color.bg4, borderRadius: 4 }} />
          ))}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${color.bd1}`, paddingTop: 10 }}>
        <div style={{ fontFamily: SYS, fontSize: 10, color: color.t4, lineHeight: 1.5 }}>
          Weights: ABI 35% · Permits 30% · Federal 20% · Employment 15%
        </div>
        {data && (
          <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, marginTop: 4 }}>
            AS OF {data.as_of}
          </div>
        )}
      </div>
    </div>
  )
}
