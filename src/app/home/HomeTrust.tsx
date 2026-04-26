"use client"
import { Fragment } from "react"
import Link from "next/link"
import { color, type as TS } from "@/lib/theme"
import { WHITE, BG, BD, T1, T3, MONO, SYS, type PlatformStats } from "./home-utils"

interface Props {
  stats: PlatformStats | null
}

export function HomeTrust({ stats }: Props) {
  return (
    <section style={{ background: BG, borderTop: `1px solid ${BD}`, padding: '64px 40px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ ...TS.label, color: T3, textAlign: 'center', marginBottom: 36 }}>
          BUILT ON TRUSTED SOURCES
        </div>

        <div className="hp-trust">
          {/* ── Data Provenance ── */}
          <div style={{ background: WHITE, border: `1px solid ${BD}`, borderRadius: 14, padding: '28px 24px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 14 }}>
              DATA PROVENANCE
            </div>
            <div style={{ fontSize: 14, fontFamily: SYS, color: T1, fontWeight: 600, lineHeight: 1.7, marginBottom: 12 }}>
              Census Bureau · BLS · FRED · BEA
              <br />EIA · USASpending.gov · ESA Copernicus
            </div>
            <div style={{ fontSize: 13, fontFamily: SYS, color: T3, lineHeight: 1.6, marginBottom: 16 }}>
              38+ official U.S. government and recognized industry sources. No scraped, unverified, or synthetic data.
            </div>
            {stats && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: `${color.green}12`, border: `1px solid ${color.green}40`,
                borderRadius: 7, padding: '5px 12px',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.green, display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontFamily: MONO, color: color.green }}>
                  {stats.observations_label}+ observations indexed
                </span>
              </div>
            )}
          </div>

          {/* ── Methodology ── */}
          <div style={{ background: WHITE, border: `1px solid ${BD}`, borderRadius: 14, padding: '28px 24px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 14 }}>
              METHODOLOGY
            </div>
            <div style={{ fontSize: 14, fontFamily: SYS, color: T1, fontWeight: 600, lineHeight: 1.7, marginBottom: 12 }}>
              Open methodology.
              <br />Every calculation documented.
              <br />Every source cited.
            </div>
            <div style={{ fontSize: 13, fontFamily: SYS, color: T3, lineHeight: 1.6, marginBottom: 16 }}>
              3-model ensemble: Holt-Winters + SARIMA + Gradient-Boosted Tree. Accuracy-weighted. Published confidence intervals.
            </div>
            <Link href="/methodology" style={{
              fontSize: 13, fontFamily: SYS, fontWeight: 500,
              color: color.blue, textDecoration: 'none',
            }}>
              Read methodology →
            </Link>
          </div>

          {/* ── Free Forever ── */}
          <div style={{ background: WHITE, border: `1px solid ${BD}`, borderRadius: 14, padding: '28px 24px' }}>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T3, letterSpacing: '0.1em', marginBottom: 14 }}>
              FREE FOREVER
            </div>
            <div style={{ fontSize: 14, fontFamily: SYS, color: T1, fontWeight: 600, lineHeight: 1.7, marginBottom: 12 }}>
              No subscription.
              <br />No credit card.
              <br />No account required.
            </div>
            <div style={{ fontSize: 13, fontFamily: SYS, color: T3, lineHeight: 1.6, marginBottom: 16 }}>
              The full dashboard is open to everyone. No sign-in, no paywall, no data sold.
            </div>
            <Link href="/dashboard" style={{
              fontSize: 13, fontFamily: SYS, fontWeight: 500,
              color: color.blue, textDecoration: 'none',
            }}>
              Open the dashboard →
            </Link>
          </div>
        </div>

        {/* ── Live stats bar ── */}
        <div style={{
          marginTop: 28, borderTop: `1px solid ${BD}`, paddingTop: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 32, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Cities tracked',      value: stats ? String(stats.cities_tracked)                       : '—' },
            { label: 'Satellite MSAs',       value: stats ? String(stats.msas_tracked)                         : '—' },
            { label: 'Gov. data sources',    value: stats ? `${stats.data_sources}+`                           : '—' },
            { label: 'Observations indexed', value: stats?.observations_label ? `${stats.observations_label}+` : '—' },
          ].map(({ label, value }, i) => (
            <Fragment key={label}>
              {i > 0 && <div style={{ width: 1, height: 18, background: BD }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontFamily: MONO, fontWeight: 700, color: T1 }}>{value}</div>
                <div style={{ fontSize: 12, fontFamily: SYS, color: T3, marginTop: 2 }}>{label}</div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
