"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Nav } from "@/app/components/Nav"
import { color, font, layout as L, signal as SIG } from "@/lib/theme"
import type { SectorResponse, Verdict } from "@/app/api/sector/[sector]/route"

const MONO = font.mono
const SYS  = font.sys

const SECTORS = ['residential', 'commercial', 'infrastructure', 'industrial'] as const
type SectorId = typeof SECTORS[number]

const SECTOR_META: Record<SectorId, { label: string; icon: string; description: string }> = {
  residential:    { label: 'Residential',    icon: '🏠', description: 'Single-family & multi-family housing' },
  commercial:     { label: 'Commercial',     icon: '🏢', description: 'Office, retail & mixed-use development' },
  infrastructure: { label: 'Infrastructure', icon: '🌉', description: 'Federal highway, bridge & transit programs' },
  industrial:     { label: 'Industrial',     icon: '🏭', description: 'Warehouse, manufacturing & data centers' },
}

function verdictColor(v: Verdict | undefined): string {
  if (v === 'EXPANDING')   return color.green
  if (v === 'CONTRACTING') return color.red
  return color.amber
}

function VerdictBadge({ verdict }: { verdict: Verdict | undefined }) {
  const col = verdictColor(verdict)
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           5,
      fontFamily:    MONO,
      fontSize:      11,
      fontWeight:    700,
      letterSpacing: '0.08em',
      color:         col,
      background:    col + '18',
      border:        `1px solid ${col}33`,
      borderRadius:  20,
      padding:       '3px 10px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, flexShrink: 0 }} />
      {verdict ?? '—'}
    </span>
  )
}

function DirectionArrow({ dir }: { dir: 'UP' | 'DOWN' | 'FLAT' | undefined }) {
  if (dir === 'UP')   return <span style={{ color: color.green }}>↑</span>
  if (dir === 'DOWN') return <span style={{ color: color.red }}>↓</span>
  return <span style={{ color: color.t4 }}>→</span>
}

function SectorCard({ id, data, loading }: { id: SectorId; data: SectorResponse | null; loading: boolean }) {
  const meta   = SECTOR_META[id]
  const col    = verdictColor(data?.verdict)

  return (
    <Link
      href={`/sectors/${id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        background:    color.bg1,
        border:        `1px solid ${data ? col + '55' : color.bd1}`,
        borderTop:     `3px solid ${data ? col : color.bd1}`,
        borderRadius:  L.cardRadius,
        padding:       '24px 28px',
        display:       'flex',
        flexDirection: 'column',
        gap:           14,
        cursor:        'pointer',
        transition:    'border-color 0.15s, background 0.15s',
        minHeight:     240,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{
              fontFamily:    MONO,
              fontSize:      10,
              color:         color.t4,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom:  6,
            }}>
              {meta.description}
            </div>
            <div style={{
              fontFamily:    SYS,
              fontSize:      22,
              fontWeight:    700,
              color:         color.t1,
              letterSpacing: '-0.02em',
              lineHeight:    1.1,
            }}>
              {meta.label}
            </div>
          </div>
          <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{meta.icon}</span>
        </div>

        {/* Verdict */}
        {loading ? (
          <div style={{
            height: 24, width: 120, borderRadius: 12,
            background: color.bg2, animation: 'shimmer 1.5s infinite',
          }} />
        ) : (
          <VerdictBadge verdict={data?.verdict} />
        )}

        {/* Headline */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[100, 85].map((w, i) => (
              <div key={i} style={{
                height: 12, width: `${w}%`, borderRadius: 4,
                background: color.bg2, animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        ) : (
          <p style={{
            fontFamily: SYS,
            fontSize:   13,
            color:      color.t3,
            lineHeight: 1.55,
            margin:     0,
          }}>
            {data?.headline ?? 'Loading sector data…'}
          </p>
        )}

        {/* Signal pills */}
        {!loading && data && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.primary_signals.slice(0, 3).map(sig => (
              <span
                key={sig.id}
                style={{
                  display:       'inline-flex',
                  alignItems:    'center',
                  gap:           4,
                  fontFamily:    MONO,
                  fontSize:      10,
                  fontWeight:    600,
                  color:         color.t2,
                  background:    color.bg2,
                  border:        `1px solid ${color.bd2}`,
                  borderRadius:  6,
                  padding:       '3px 8px',
                  whiteSpace:    'nowrap',
                  letterSpacing: '0.03em',
                }}
              >
                <DirectionArrow dir={sig.direction} />
                {sig.label}
                {sig.value && (
                  <span style={{ color: color.t4, marginLeft: 2 }}>{sig.value}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Deep dive link */}
        <div style={{
          marginTop:     'auto',
          fontFamily:    MONO,
          fontSize:      11,
          color:         color.blue,
          letterSpacing: '0.04em',
        }}>
          Deep dive →
        </div>
      </div>
    </Link>
  )
}

export default function SectorsPage() {
  const [data,    setData]    = useState<Partial<Record<SectorId, SectorResponse>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    void Promise.all(
      SECTORS.map(id =>
        fetch(`/api/sector/${id}`)
          .then(r => r.ok ? r.json() as Promise<SectorResponse> : null)
          .then(d => { if (mounted && d) setData(prev => ({ ...prev, [id]: d })) })
          .catch(() => null)
      )
    ).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  // Determine the strongest signal sector for the page subtitle
  const topSector = (['expanding', 'contracting'] as const).reduce<SectorId | null>((found, v) => {
    if (found) return found
    const match = SECTORS.find(id => data[id]?.verdict?.toLowerCase() === v)
    return match ?? null
  }, null)

  return (
    <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1, fontFamily: SYS,
                  paddingBottom: 'env(safe-area-inset-bottom,24px)' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .sectors-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 720px) { .sectors-grid { grid-template-columns: 1fr; } }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily:    MONO,
            fontSize:      10,
            color:         color.t4,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom:  12,
          }}>
            Market Intelligence · Sector View
          </div>
          <h1 style={{
            fontFamily:    SYS,
            fontSize:      40,
            fontWeight:    700,
            letterSpacing: '-0.03em',
            lineHeight:    1.08,
            color:         color.t1,
            marginBottom:  12,
          }}>
            Construction by Sector
          </h1>
          <p style={{ fontFamily: SYS, fontSize: 15, color: color.t3, lineHeight: 1.6 }}>
            Residential · Commercial · Infrastructure · Industrial
            {topSector && !loading && (
              <span style={{ marginLeft: 16, color: verdictColor(data[topSector]?.verdict) }}>
                — {SECTOR_META[topSector].label} leading this cycle
              </span>
            )}
          </p>
        </div>

        {/* 2×2 sector grid */}
        <div className="sectors-grid">
          {SECTORS.map(id => (
            <SectorCard
              key={id}
              id={id}
              data={data[id] ?? null}
              loading={loading && !data[id]}
            />
          ))}
        </div>

        {/* Source line */}
        <div style={{
          marginTop:     40,
          fontFamily:    MONO,
          fontSize:      11,
          color:         color.t4,
          letterSpacing: '0.06em',
        }}>
          Sources: FRED, Census Bureau, BLS, USASpending.gov · Updated daily
        </div>

      </div>
    </div>
  )
}
