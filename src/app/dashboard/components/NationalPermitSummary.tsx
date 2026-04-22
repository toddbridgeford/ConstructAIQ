"use client"
import { color, font } from "@/lib/theme"

export interface NationalTotal {
  cities_covered:         number
  latest_month_count:     number
  latest_month_valuation: number
  yoy_change_pct:         number | null
}

function fmtVal(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  return `$${v.toLocaleString()}`
}

export function NationalPermitSummary({ national }: { national: NationalTotal | null }) {
  const BG1 = color.bg1, BD1 = color.bd1, BD2 = color.bd2
  const T1 = color.t1, T3 = color.t3, T4 = color.t4
  const MONO = font.mono, SYS = font.sys
  const AMBER = color.amber, GREEN = color.green, RED = color.red

  const yoy      = national?.yoy_change_pct ?? null
  const yoyColor = yoy == null ? T4 : yoy >= 0 ? GREEN : RED
  const yoyStr   = yoy == null ? '—' : `${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}%`

  const metrics = [
    { label: 'Cities Covered',       value: String(national?.cities_covered ?? 12),                           color: T1  },
    { label: 'Latest Month Permits', value: national ? national.latest_month_count.toLocaleString() : '—',    color: T1  },
    { label: 'Valuation',            value: national ? fmtVal(national.latest_month_valuation) : '—',         color: T1  },
    { label: 'YoY Change',           value: yoyStr,                                                           color: yoyColor },
  ]

  return (
    <div style={{ background: BG1, borderRadius: 16, border: `1px solid ${BD1}`, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontFamily: SYS, fontSize: 15, fontWeight: 700, color: T1 }}>
          City Permit Intelligence
        </span>
        <span style={{
          fontFamily: MONO, fontSize: 10, color: AMBER,
          background: AMBER + '22', border: `1px solid ${AMBER}44`,
          borderRadius: 6, padding: '2px 8px',
        }}>
          12 CITIES
        </span>
      </div>

      <div style={{ fontFamily: SYS, fontSize: 13, color: T4, marginBottom: 20 }}>
        Open data · Updated daily
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{
              fontFamily: MONO, fontSize: 10, color: T4,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              {m.label}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        fontFamily: SYS, fontSize: 12, color: T4,
        marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BD2}`,
      }}>
        Aggregated from 12 major US city open data portals.{' '}
        <span style={{ color: T3 }}>
          Source: Socrata open data APIs · constructaiq.trade/permits
        </span>
      </div>
    </div>
  )
}
