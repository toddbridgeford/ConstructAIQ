"use client"
import Link from "next/link"
import { BG, BD, T3, GREEN, RED, AMBER, BLUE, MONO, SYS } from "./home-utils"

interface Props {
  spendVal: number | null
  empVal:   number | null
  spendMom: number
  empMom:   number
}

export function HomeLiveStats({ spendVal, empVal, spendMom, empMom }: Props) {
  if (spendVal === null && empVal === null) return null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
      <div style={{
        background: BG, borderRadius: 20, border: `1px solid ${BD}`,
        padding: '28px 32px', display: 'flex', gap: 40,
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        {spendVal !== null && (
          <div>
            <div style={{
              fontFamily: SYS, fontSize: 10, color: T3, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
            }}>
              Construction Spending
            </div>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: AMBER, lineHeight: 1 }}>
              ${(spendVal / 1000).toFixed(1)}B
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: spendMom >= 0 ? GREEN : RED, marginTop: 4 }}>
              {spendMom >= 0 ? '+' : ''}{spendMom.toFixed(2)}% MoM
            </div>
          </div>
        )}

        {spendVal !== null && empVal !== null && (
          <div style={{ width: 1, height: 48, background: BD }} />
        )}

        {empVal !== null && (
          <div>
            <div style={{
              fontFamily: SYS, fontSize: 10, color: T3, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
            }}>
              Construction Employment
            </div>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: GREEN, lineHeight: 1 }}>
              {empVal >= 1000 ? `${(empVal / 1000).toFixed(1)}M` : `${empVal}K`}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: empMom >= 0 ? GREEN : RED, marginTop: 4 }}>
              {empMom >= 0 ? '+' : ''}{empMom.toFixed(2)}% MoM
            </div>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            fontFamily: SYS, fontSize: 14, fontWeight: 600,
            color: BLUE, textDecoration: 'none',
          }}>
            Open full dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
