'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { color, font } from '@/lib/theme'
import { STATE_NAMES } from '@/app/api/state/[code]/route'

// ── Types ────────────────────────────────────────────────────
interface StateData {
  state_code:               string
  state_name:               string
  verdict:                  'EXPANDING' | 'STABLE' | 'CONTRACTING'
  federal_awards_rank:      number
  federal_awards_total:     number
  federal_yoy:              number
  cities:                   string[]
  permit_trend:             string
  satellite_msas:           string[]
  dominant_satellite_class: string
  warn_notices_30d:         number
  as_of:                    string
}

interface CityPermit {
  city_code:          string
  city_name:          string
  state_code:         string
  latest_month_count: number
  yoy_change_pct:     number | null
}

interface MsaRow {
  msa_code:        string
  msa_name:        string
  classification:  string
  bsi_change_90d:  number | null
  confidence:      string
}

// ── Helpers ──────────────────────────────────────────────────
function verdictColor(v: string) {
  if (v === 'EXPANDING')   return color.green
  if (v === 'CONTRACTING') return color.red
  return color.amber
}

function trendColor(t: number | null) {
  if (t === null) return color.t4
  return t >= 0 ? color.green : color.red
}

function fmt(n: number, dp = 1) {
  return n.toFixed(dp)
}

// ── Component ────────────────────────────────────────────────
export default function StatePage() {
  const params    = useParams()
  const stateCode = (params?.state as string ?? '').toUpperCase()

  const [data,    setData]    = useState<StateData | null>(null)
  const [cities,  setCities]  = useState<CityPermit[]>([])
  const [msas,    setMsas]    = useState<MsaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!stateCode) return
    Promise.all([
      fetch(`/api/state/${stateCode}`)
        .then(r => r.ok ? r.json() : null),
      fetch('/api/permits')
        .then(r => r.ok ? r.json() : { cities: [] }),
      fetch('/api/satellite')
        .then(r => r.ok ? r.json() : { msas: [] }),
    ])
      .then(([sd, pd, sat]) => {
        if (!sd || sd.error) {
          setError(sd?.error ?? 'State not found')
          return
        }
        setData(sd as StateData)

        const stateCities: CityPermit[] =
          ((pd as { cities?: CityPermit[] }).cities ?? [])
            .filter((c: CityPermit) =>
              (sd as StateData).cities.includes(c.city_code)
            )
        setCities(stateCities)

        const stateMsas: MsaRow[] =
          ((sat as { msas?: MsaRow[] }).msas ?? [])
            .filter((m: MsaRow) =>
              (sd as StateData).satellite_msas.includes(m.msa_code)
            )
        setMsas(stateMsas)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [stateCode])

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding:'80px 40px', textAlign:'center',
      fontFamily:font.mono, fontSize:12, color:color.t4 }}>
      Loading {STATE_NAMES[stateCode] ?? stateCode}…
    </div>
  )

  if (error || !data) return (
    <div style={{ padding:'80px 40px', textAlign:'center',
      fontFamily:font.sys, fontSize:14, color:color.t3 }}>
      {error ?? 'State data unavailable.'}
      <br />
      <Link href="/markets" style={{ color:color.amber,
        textDecoration:'none', marginTop:8, display:'inline-block' }}>
        ← All markets
      </Link>
    </div>
  )

  const vc = verdictColor(data.verdict)

  // ── Narrative ─────────────────────────────────────────────
  const topCity  = data.cities[0] ?? ''
  const narrative =
    `${data.state_name} construction is ${data.verdict.toLowerCase()} ` +
    `with $${data.federal_awards_total.toLocaleString()}M in federal awards ` +
    `(ranked #${data.federal_awards_rank} nationally). ` +
    (topCity
      ? `Permit activity in ${topCity} is ${data.permit_trend.toLowerCase()}. `
      : '') +
    (data.warn_notices_30d > 0
      ? `${data.warn_notices_30d} WARN Act notice(s) filed in the last 30 days.`
      : `No construction WARN Act notices in the last 30 days — a positive signal.`)

  const sectionLabel = (t: string) => (
    <div style={{ fontFamily:font.mono, fontSize:10,
      color:color.t4, letterSpacing:'0.1em',
      textTransform:'uppercase', marginBottom:12 }}>
      {t}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:color.bg0,
      color:color.t1 }}>
      <div style={{ maxWidth:960, margin:'0 auto',
        padding:'48px 40px 80px' }}>

        {/* Back */}
        <Link href="/markets" style={{ fontFamily:font.sys,
          fontSize:13, color:color.t4, textDecoration:'none',
          display:'inline-block', marginBottom:24 }}>
          ← All markets
        </Link>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start',
          gap:20, marginBottom:40, flexWrap:'wrap' }}>
          <div style={{ flex:1 }}>
            <h1 style={{ fontFamily:font.sys, fontSize:32,
              fontWeight:700, color:color.t1, margin:'0 0 8px' }}>
              {data.state_name}
            </h1>
            <p style={{ fontFamily:font.sys, fontSize:14,
              color:color.t3, margin:0 }}>
              Construction Market Intelligence ·{' '}
              <span style={{ fontFamily:font.mono, fontSize:12 }}>
                Updated {data.as_of}
              </span>
            </p>
          </div>
          <div style={{ background: vc + '22',
            border: `1px solid ${vc}44`,
            borderRadius:10, padding:'10px 20px',
            fontFamily:font.mono, fontSize:14,
            fontWeight:700, color:vc,
            letterSpacing:'0.06em' }}>
            {data.verdict}
          </div>
        </div>

        {/* Section 1 — Vitals */}
        {sectionLabel('State Vitals')}
        <div style={{ display:'grid',
          gridTemplateColumns:
            'repeat(auto-fit,minmax(200px,1fr))',
          gap:16, marginBottom:40 }}>
          {[
            {
              label: 'Federal Awards',
              value: `$${data.federal_awards_total.toLocaleString()}M`,
              sub:   `Rank #${data.federal_awards_rank} nationally`,
              arrow: data.federal_yoy >= 0 ? '▲' : '▼',
              col:   trendColor(data.federal_yoy),
            },
            {
              label: 'Permit Activity',
              value: data.permit_trend,
              sub:   `${data.cities.length} cities tracked`,
              arrow: data.permit_trend === 'GROWING' ? '▲'
                : data.permit_trend === 'DECLINING' ? '▼' : '—',
              col:   data.permit_trend === 'GROWING' ? color.green
                : data.permit_trend === 'DECLINING' ? color.red
                : color.amber,
            },
            {
              label: 'Satellite MSAs',
              value: data.satellite_msas.length.toString(),
              sub:   data.dominant_satellite_class
                .replace(/_/g, ' '),
              arrow: '',
              col:   color.blue,
            },
            {
              label: 'WARN Notices (30d)',
              value: data.warn_notices_30d.toString(),
              sub:   data.warn_notices_30d === 0
                ? 'No recent layoff notices'
                : 'Construction layoffs filed',
              arrow: data.warn_notices_30d > 0 ? '▼' : '',
              col:   data.warn_notices_30d > 3 ? color.red
                : color.t3,
            },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background:color.bg1, borderRadius:12,
              border:`1px solid ${color.bd1}`,
              padding:'20px 20px', display:'flex',
              flexDirection:'column', gap:4,
            }}>
              <div style={{ fontFamily:font.mono, fontSize:10,
                color:color.t4, letterSpacing:'0.08em',
                textTransform:'uppercase' }}>
                {kpi.label}
              </div>
              <div style={{ fontFamily:font.mono, fontSize:24,
                fontWeight:700, color:kpi.col }}>
                {kpi.value}
                {kpi.arrow && (
                  <span style={{ fontSize:14, marginLeft:6 }}>
                    {kpi.arrow}
                  </span>
                )}
              </div>
              <div style={{ fontFamily:font.sys, fontSize:12,
                color:color.t4 }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Section 2 — Active Cities */}
        {data.cities.length > 0 && (
          <div style={{ marginBottom:40 }}>
            {sectionLabel('Active Cities')}
            <div style={{ display:'grid',
              gridTemplateColumns:
                'repeat(auto-fill,minmax(180px,1fr))',
              gap:12 }}>
              {cities.map(c => {
                const yoy = c.yoy_change_pct ?? null
                return (
                  <Link key={c.city_code}
                    href={`/permits/${c.city_code.toLowerCase()}`}
                    style={{ textDecoration:'none' }}>
                    <div style={{
                      background:color.bg1, borderRadius:10,
                      border:`1px solid ${color.bd1}`,
                      padding:'16px', cursor:'pointer',
                    }}>
                      <div style={{ fontFamily:font.sys,
                        fontSize:14, fontWeight:600,
                        color:color.t1 }}>
                        {c.city_name ?? c.city_code}
                      </div>
                      <div style={{ fontFamily:font.mono,
                        fontSize:12,
                        color: trendColor(yoy),
                        marginTop:4 }}>
                        {yoy !== null
                          ? `${yoy >= 0 ? '+' : ''}${fmt(yoy)}% YoY`
                          : '—'}
                      </div>
                      <div style={{ fontFamily:font.sys,
                        fontSize:11, color:color.amber,
                        marginTop:6 }}>
                        View permits →
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Section 3 — Federal Pipeline */}
        <div style={{ marginBottom:40 }}>
          {sectionLabel('Federal Pipeline')}
          <div style={{ background:color.bg1, borderRadius:12,
            border:`1px solid ${color.bd1}`, padding:'24px' }}>
            <div style={{ display:'flex', alignItems:'center',
              gap:16, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontFamily:font.mono, fontSize:28,
                  fontWeight:700, color:color.t1 }}>
                  ${data.federal_awards_total.toLocaleString()}M
                </div>
                <div style={{ fontFamily:font.sys, fontSize:13,
                  color:color.t3 }}>
                  Total federal construction awards
                </div>
              </div>
              <div style={{ background:color.bg2, borderRadius:8,
                padding:'8px 16px', fontFamily:font.mono,
                fontSize:13, color:color.amber }}>
                #{data.federal_awards_rank} nationally
              </div>
              {data.federal_yoy !== 0 && (
                <div style={{
                  fontFamily:font.mono, fontSize:13,
                  color: trendColor(data.federal_yoy) }}>
                  {data.federal_yoy >= 0 ? '+' : ''}
                  {fmt(data.federal_yoy)}% YoY
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4 — Satellite */}
        <div style={{ marginBottom:40 }}>
          {sectionLabel('Satellite Activity')}
          {msas.length === 0 ? (
            <div style={{ background:color.bg1, borderRadius:12,
              border:`1px solid ${color.bd1}`,
              padding:'24px', fontFamily:font.sys,
              fontSize:14, color:color.t4 }}>
              No satellite MSAs tracked in {data.state_name}.
              Coverage is limited to 20 US metro areas.{' '}
              <Link href="/ground-signal" style={{
                color:color.amber, textDecoration:'none' }}>
                View all tracked MSAs →
              </Link>
            </div>
          ) : (
            <div style={{ display:'flex',
              flexDirection:'column', gap:8 }}>
              {msas.map(m => {
                const bsi = m.bsi_change_90d
                return (
                  <div key={m.msa_code} style={{
                    background:color.bg1, borderRadius:10,
                    border:`1px solid ${color.bd1}`,
                    padding:'14px 20px',
                    display:'flex', alignItems:'center', gap:16,
                  }}>
                    <div style={{ flex:1, fontFamily:font.sys,
                      fontSize:14, color:color.t1, fontWeight:500 }}>
                      {m.msa_name ?? m.msa_code}
                    </div>
                    <div style={{
                      fontFamily:font.mono, fontSize:11,
                      fontWeight:600, letterSpacing:'0.06em',
                      padding:'3px 10px', borderRadius:20,
                      background: color.green + '22',
                      color: color.green,
                    }}>
                      {m.classification.replace(/_/g,' ')}
                    </div>
                    <div style={{ fontFamily:font.mono,
                      fontSize:13,
                      color: trendColor(bsi) }}>
                      {bsi !== null
                        ? `${bsi >= 0 ? '+' : ''}${fmt(bsi)}%`
                        : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Section 5 — WARN Act */}
        <div style={{ marginBottom:40 }}>
          {sectionLabel('Labor Health')}
          <div style={{
            background: data.warn_notices_30d > 0
              ? color.red + '11' : color.bg1,
            borderRadius:12,
            border:`1px solid ${
              data.warn_notices_30d > 0
                ? color.red + '44' : color.bd1}`,
            padding:'20px 24px',
            fontFamily:font.sys, fontSize:14,
            color:color.t2, lineHeight:1.7,
          }}>
            {data.warn_notices_30d === 0
              ? 'No construction WARN Act notices in the last 30 days — a positive signal for labor market stability.'
              : `${data.warn_notices_30d} WARN Act notice(s) filed in ${data.state_name} in the last 30 days. Review the federal data for context.`}
            {' '}<Link href="/dashboard#signals"
              style={{ color:color.amber,
                textDecoration:'none' }}>
              View WARN feed →
            </Link>
          </div>
        </div>

        {/* Section 6 — Context */}
        <div>
          {sectionLabel('Market Context')}
          <div style={{ background:color.bg1, borderRadius:12,
            border:`1px solid ${color.bd1}`,
            padding:'24px', fontFamily:font.sys,
            fontSize:15, color:color.t2, lineHeight:1.8 }}>
            {narrative}
          </div>
        </div>

      </div>
    </div>
  )
}
