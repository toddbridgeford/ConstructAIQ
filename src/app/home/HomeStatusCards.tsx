"use client"
import { layout as L, type as TS } from "@/lib/theme"
import { WHITE, BD, T1, T3, MONO, type Card } from "./home-utils"

function StatusCard({ label, verdict, col, metric, sub }: Card) {
  return (
    <div style={{
      background: WHITE, borderRadius: L.cardRadius,
      border: `1px solid ${BD}`, borderLeft: `3px solid ${col}`,
      padding: L.cardPad, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ ...TS.label, color: T3 }}>{label}</div>
      {verdict && (
        <span style={{
          alignSelf: 'flex-start',
          background: `${col}18`, border: `1px solid ${col}40`,
          borderRadius: 6, padding: '3px 10px',
          fontSize: 11, fontFamily: MONO, fontWeight: 600,
          color: col, letterSpacing: '0.08em',
        }}>
          {verdict}
        </span>
      )}
      <div style={{ fontSize: 36, fontFamily: MONO, fontWeight: 700, color: T1, lineHeight: 1.1 }}>
        {metric}
      </div>
      <div style={{ fontSize: 13, fontFamily: MONO, color: T3 }}>{sub}</div>
    </div>
  )
}

interface Props {
  cards: Card[]
}

export function HomeStatusCards({ cards }: Props) {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ ...TS.label, color: T3, marginBottom: 24 }}>CURRENT MARKET CONDITIONS</div>
      <div className="hp-cards">
        {cards.map(c => <StatusCard key={c.label} {...c} />)}
      </div>
    </div>
  )
}
