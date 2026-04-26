"use client"
import Link from "next/link"
import { color, type as TS } from "@/lib/theme"
import { WHITE, T1, T3, BD, MONO, SYS, BLUE, trendColor } from "./home-utils"

interface Props {
  spendDisp: string | null
  spendMom:  number
}

export function HomeHero({ spendDisp, spendMom }: Props) {
  return (
    <section style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 40px',
      background: WHITE,
    }}>
      <div style={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
        <div style={{ ...TS.label, color: T3, marginBottom: 24 }}>CONSTRUCTAIQ</div>

        <h1 className="hp-h1" style={{
          fontSize: 'clamp(36px,5vw,52px)',
          fontFamily: SYS, fontWeight: 700,
          lineHeight: 1.15, letterSpacing: '-0.03em',
          color: T1, marginBottom: 14,
        }}>
          Free construction market intelligence.
        </h1>

        <p style={{
          fontSize: 18, fontFamily: SYS, fontWeight: 500,
          color: T1, lineHeight: 1.5,
          maxWidth: 560, margin: '0 auto 14px',
        }}>
          Transparent sources. Validated forecasts. AI-explained signals.
        </p>

        <p style={{
          fontSize: 16, fontFamily: SYS, fontWeight: 400,
          color: T3, lineHeight: 1.65,
          maxWidth: 500, margin: '0 auto 56px',
        }}>
          Know when markets are moving, where demand is building, and
          what signals matter — for contractors, suppliers, lenders,
          and developers.
        </p>

        {/* ── Spending KPI ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ ...TS.label, color: T3, marginBottom: 12 }}>
            Total US Construction Spending
          </div>

          {spendDisp ? (
            <>
              <div className="hp-kpi" style={{
                fontSize: 'clamp(64px,10vw,96px)',
                fontFamily: MONO, fontWeight: 700,
                color: T1, lineHeight: 1, marginBottom: 12,
              }}>
                {spendDisp}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 15, fontFamily: MONO,
                color: trendColor(spendMom), fontWeight: 600,
              }}>
                <span>{spendMom >= 0 ? '↑' : '↓'}</span>
                <span>{spendMom >= 0 ? '+' : ''}{spendMom.toFixed(2)}% MoM</span>
              </div>
            </>
          ) : (
            <div style={{
              height: 88, width: 220, margin: '0 auto 12px',
              borderRadius: 8, background: color.lightBgSkel,
              backgroundImage: `linear-gradient(90deg,${color.lightBgSkel} 25%,${color.lightBgSub} 50%,${color.lightBgSkel} 75%)`,
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
            }} />
          )}
        </div>

        {/* ── CTAs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: BLUE, color: WHITE,
            fontSize: 16, fontWeight: 600,
            padding: '14px 32px', borderRadius: 12, minHeight: 52,
            textDecoration: 'none', letterSpacing: '-0.01em',
            boxShadow: '0 4px 20px rgba(10,132,255,0.28)',
          }}>
            Open Dashboard →
          </Link>
          <Link href="/methodology" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', color: T1,
            fontSize: 15, fontWeight: 500,
            padding: '13px 24px', borderRadius: 12, minHeight: 48,
            border: `1px solid ${BD}`,
            letterSpacing: '-0.01em', textDecoration: 'none',
          }}>
            Read Methodology →
          </Link>
        </div>
      </div>
    </section>
  )
}
