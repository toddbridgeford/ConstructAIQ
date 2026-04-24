"use client"
import Link from "next/link"
import { GREEN, RED, AMBER, BD, BG, T1, T3, MONO, SYS, type VerdictData } from "./home-utils"

interface Props {
  verdict: VerdictData | null
  loading: boolean
}

export function HomeVerdictBanner({ verdict, loading }: Props) {
  if (loading) {
    return (
      <div style={{
        width: '100%', height: 48,
        background: BG, borderBottom: `1px solid ${BD}`,
      }} />
    )
  }
  if (!verdict) return null

  const col =
    verdict.overall === 'EXPAND'   ? GREEN :
    verdict.overall === 'CONTRACT' ? RED   : AMBER

  return (
    <div style={{
      width: '100%',
      background: `${col}18`,
      borderBottom: `1px solid ${col}44`,
      padding: '12px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      minHeight: 48,
    }}>
      <span style={{
        fontFamily: MONO, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.1em', color: col,
      }}>
        MARKET SIGNAL: {verdict.overall}
      </span>
      <span style={{ width: 1, height: 14, background: BD, display: 'inline-block' }} />
      <span style={{ fontFamily: SYS, fontSize: 13, color: T1, lineHeight: 1.5 }}>
        {verdict.headline}
      </span>
      <Link href="/dashboard" style={{
        marginLeft: 'auto', fontFamily: SYS, fontSize: 12,
        color: T3, textDecoration: 'none', whiteSpace: 'nowrap',
      }}>
        Full analysis →
      </Link>
    </div>
  )
}
