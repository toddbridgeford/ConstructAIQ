'use client'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Nav } from '@/app/components/Nav'
import { CityPermitDetail, type CityPermitData } from '@/app/dashboard/components/CityPermitDetail'
import { BenchmarkBadge } from '@/app/components/ui/BenchmarkBadge'
import type { BenchmarkResult } from '@/app/components/ui/BenchmarkBadge'
import { color, font, layout as L } from '@/lib/theme'
import { ShareButton } from '@/app/components/ui/ShareButton'
import { WatchButton } from '@/app/components/ui/WatchButton'

const { bg0: BG0, bg1: BG1, bg2: BG2, bd1: BD1,
        t1: T1, t3: T3, t4: T4,
        blue: BLUE, green: GREEN } = color
const MONO = font.mono, SYS = font.sys

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

export default function CityPermitsPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = use(params)
  const cityCode  = city.toUpperCase()

  const [cityData,   setCityData]   = useState<CityPermitData | null>(null)
  const [bench,      setBench]      = useState<BenchmarkResult | null>(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/permits?city=${cityCode}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch(`/api/benchmark/permits?city=${cityCode}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]).then(([permits, benchmark]) => {
      const cd = permits?.cities?.[0] ?? null
      if (cd) setCityData(cd)
      if (benchmark && !benchmark.error) setBench(benchmark)
      setLoading(false)
    })
  }, [cityCode])

  const cityName = cityData?.city_name ?? bench?.city_name ?? cityCode
  const count    = cityData?.latest_month?.permit_count ?? null

  return (
    <div style={{
      minHeight:   '100vh',
      background:  BG0,
      color:       T1,
      fontFamily:  SYS,
      paddingBottom: 'env(safe-area-inset-bottom, 24px)',
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <div style={{ fontFamily: MONO, fontSize: 11, color: T4, marginBottom: 28, letterSpacing: '0.06em' }}>
          <Link href="/permits" style={{ color: BLUE }}>Permits</Link>
          {' / '}
          <span style={{ color: T3 }}>{cityName}</span>
        </div>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          {loading ? (
            <div style={{
              height: 44, width: 260, borderRadius: 8,
              background: `linear-gradient(90deg, ${BG2} 25%, ${color.bg3} 50%, ${BG2} 75%)`,
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              marginBottom: 12,
            }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                          gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
              <h1 style={{
                fontFamily: SYS, fontSize: 36, fontWeight: 700,
                letterSpacing: '-0.03em', lineHeight: 1.1, color: T1,
              }}>
                {cityName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <ShareButton
                  title={`${cityName} Construction Permits — ConstructAIQ`}
                  url={`https://constructaiq.trade/permits/${city.toLowerCase()}`}
                />
                <WatchButton
                  entityType="metro"
                  entityId={cityCode}
                  entityLabel={cityName}
                  size="md"
                  labelWatch="+ Watch market"
                />
              </div>
            </div>
          )}

          {/* Permit count + benchmark badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {loading ? (
              <div style={{
                height: 32, width: 140, borderRadius: 8,
                background: `linear-gradient(90deg, ${BG2} 25%, ${color.bg3} 50%, ${BG2} 75%)`,
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }} />
            ) : (
              <>
                {count !== null && (
                  <span style={{
                    fontFamily: MONO, fontSize: 28, fontWeight: 700,
                    color: T1, letterSpacing: '-0.02em',
                  }}>
                    {count.toLocaleString()}
                    <span style={{ fontFamily: SYS, fontSize: 14, fontWeight: 400, color: T3, marginLeft: 6 }}>
                      permits this month
                    </span>
                  </span>
                )}
                {bench && (
                  <BenchmarkBadge
                    classification={bench.classification}
                    percentile={bench.percentile}
                    label={bench.label}
                  />
                )}
              </>
            )}
          </div>

          {/* Benchmark sentence */}
          {bench && !loading && (
            <p style={{
              fontFamily:  SYS,
              fontSize:    14,
              color:       T3,
              marginTop:   10,
              lineHeight:  1.6,
              maxWidth:    560,
            }}>
              Current activity is at the {ordinal(bench.percentile)} percentile of this
              city&apos;s 24-month history
              {bench.as_of ? ` (through ${bench.as_of})` : ''}.
              {bench.yoy_change_pct !== null && (
                <> Year-over-year change: {bench.yoy_change_pct > 0 ? '+' : ''}{bench.yoy_change_pct.toFixed(1)}%.</>
              )}
            </p>
          )}
        </div>

        {/* ── Benchmark context bar ───────────────────────────────────────── */}
        {bench && !loading && (
          <div style={{
            background:    BG1,
            border:        `1px solid ${BD1}`,
            borderRadius:  L.cardRadius,
            padding:       '16px 20px',
            display:       'flex',
            flexWrap:      'wrap',
            gap:           24,
            marginBottom:  28,
          }}>
            {[
              { label: 'P10',    value: bench.p10.toLocaleString() },
              { label: 'P25',    value: bench.p25.toLocaleString() },
              { label: 'Median', value: bench.median.toLocaleString() },
              { label: 'Mean',   value: bench.mean.toLocaleString() },
              { label: 'P75',    value: bench.p75.toLocaleString() },
              { label: 'P90',    value: bench.p90.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: T4,
                              letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: T1 }}>
                  {value}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginLeft: 'auto' }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: T4,
                            letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Benchmark period
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: T3 }}>
                {bench.benchmark_period}
              </div>
            </div>
          </div>
        )}

        {/* ── City detail component ───────────────────────────────────────── */}
        {loading ? (
          <div style={{
            height: 400, borderRadius: L.cardRadius,
            background: `linear-gradient(90deg, ${BG2} 25%, ${color.bg3} 50%, ${BG2} 75%)`,
            backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
          }} />
        ) : cityData ? (
          <div style={{
            background:   BG1,
            border:       `1px solid ${BD1}`,
            borderRadius: L.cardRadius,
            padding:      '24px',
          }}>
            <CityPermitDetail cityCode={cityCode} cityData={cityData} />
          </div>
        ) : (
          <div style={{
            padding:    '48px 24px',
            textAlign:  'center',
            fontFamily: SYS,
            fontSize:   14,
            color:      T4,
          }}>
            No permit data available for {cityCode}.
          </div>
        )}

        {/* ── Source line ─────────────────────────────────────────────────── */}
        <div style={{
          fontFamily:    MONO,
          fontSize:      11,
          color:         T4,
          letterSpacing: '0.06em',
          marginTop:     32,
        }}>
          Source: City permit API · Benchmark: 24-month local history ·{' '}
          <Link href="/permits" style={{ color: BLUE }}>← All cities</Link>
        </div>

      </div>

      <footer style={{
        borderTop: `1px solid ${BD1}`, padding: '24px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: SYS, fontSize: 13, color: T4 }}>
          Construction Intelligence Platform · constructaiq.trade
        </div>
        <div style={{ fontFamily: SYS, fontSize: 12, color: T4 }}>
          <a href={`/permits/${city}`} style={{ color: GREEN }}>
            {cityName} Permits
          </a>
        </div>
      </footer>
    </div>
  )
}
