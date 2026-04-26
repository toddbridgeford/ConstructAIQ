"use client"
import Link from "next/link"
import { color, type as TS } from "@/lib/theme"
import { WHITE, BG, BD, T1, T3, SYS } from "./home-utils"

const ROLES = [
  {
    role:     'Contractors',
    decision: 'Know which markets are heating up before you mobilize.',
  },
  {
    role:     'Suppliers',
    decision: 'See where demand and material cost pressure are moving.',
  },
  {
    role:     'Lenders',
    decision: 'Understand construction risk and momentum by region.',
  },
  {
    role:     'Developers',
    decision: 'Track permits, costs, rates, and opportunity in one view.',
  },
  {
    role:     'Public-sector analysts',
    decision: 'Monitor infrastructure spend and active federal solicitations.',
  },
]

export function HomeRoles() {
  return (
    <section style={{ background: WHITE, borderTop: `1px solid ${BD}`, padding: '56px 40px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ ...TS.label, color: T3, marginBottom: 28 }}>WHO IT IS FOR</div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {ROLES.map(({ role, decision }) => (
            <div key={role} style={{
              padding: '18px 20px',
              background: BG,
              border: `1px solid ${BD}`,
              borderLeft: `3px solid ${color.blue}`,
              borderRadius: '0 10px 10px 0',
            }}>
              <div style={{
                fontSize: 14, fontFamily: SYS,
                fontWeight: 600, color: T1, marginBottom: 4,
              }}>
                {role}
              </div>
              <div style={{
                fontSize: 13, fontFamily: SYS,
                color: T3, lineHeight: 1.55,
              }}>
                {decision}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <Link href="/dashboard" style={{
            fontSize: 13, fontFamily: SYS, fontWeight: 500,
            color: color.blue, textDecoration: 'none',
          }}>
            Open the dashboard →
          </Link>
          <span style={{ fontSize: 13, color: T3, margin: '0 10px' }}>·</span>
          <Link href="/methodology" style={{
            fontSize: 13, fontFamily: SYS, fontWeight: 500,
            color: color.blue, textDecoration: 'none',
          }}>
            View data sources →
          </Link>
        </div>
      </div>
    </section>
  )
}
