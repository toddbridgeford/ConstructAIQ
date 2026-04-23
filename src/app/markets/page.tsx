'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { color, font } from '@/lib/theme'
import { STATE_NAMES } from '@/lib/state-names'

// ── Types ────────────────────────────────────────────────────
interface StateRow {
  state_code:           string
  state_name:           string
  verdict:              string
  federal_awards_rank:  number
  federal_awards_total: number
  permit_trend:         string
  warn_notices_30d:     number
  cities:               string[]
}

type SortKey = 'alpha' | 'federal' | 'permits' | 'warn'

// ── Helpers ──────────────────────────────────────────────────
function verdictColor(v: string) {
  if (v === 'EXPANDING')   return color.green
  if (v === 'CONTRACTING') return color.red
  return color.amber
}

const SORT_LABELS: Record<SortKey, string> = {
  alpha:   'Alphabetical',
  federal: 'Federal Awards',
  permits: 'Permit Activity',
  warn:    'WARN Activity',
}

// ── States to pre-fetch (all 50 + DC) ────────────────────────
const STATE_CODES = Object.keys(STATE_NAMES)

export default function MarketsPage() {
  const [rows,    setRows]    = useState<StateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sort,    setSort]    = useState<SortKey>('federal')
  const [search,  setSearch]  = useState('')

  // Fetch summary data for all states in parallel batches
  useEffect(() => {
    const BATCH = 10  // fetch 10 states at a time
    const results: StateRow[] = []

    async function fetchAll() {
      for (let i = 0; i < STATE_CODES.length; i += BATCH) {
        const batch = STATE_CODES.slice(i, i + BATCH)
        const settled = await Promise.allSettled(
          batch.map(code =>
            fetch(`/api/state/${code}`)
              .then(r => r.ok ? r.json() : null)
          )
        )
        settled.forEach(r => {
          if (r.status === 'fulfilled' && r.value &&
              !r.value.error) {
            results.push(r.value as StateRow)
          }
        })
      }
      setRows(results)
      setLoading(false)
    }

    fetchAll()
  }, [])

  const sorted = useMemo(() => {
    let list = [...rows]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.state_name.toLowerCase().includes(q) ||
        r.state_code.toLowerCase().includes(q)
      )
    }

    switch (sort) {
      case 'alpha':
        return list.sort((a, b) =>
          a.state_name.localeCompare(b.state_name))
      case 'federal':
        return list.sort((a, b) =>
          (b.federal_awards_total ?? 0) -
          (a.federal_awards_total ?? 0))
      case 'permits':
        // GROWING > STABLE > DECLINING
        const order = { GROWING:2, STABLE:1, DECLINING:0,
          UNKNOWN:-1 }
        return list.sort((a, b) =>
          (order[b.permit_trend as keyof typeof order] ?? -1) -
          (order[a.permit_trend as keyof typeof order] ?? -1))
      case 'warn':
        return list.sort((a, b) =>
          (b.warn_notices_30d ?? 0) -
          (a.warn_notices_30d ?? 0))
    }
  }, [rows, sort, search])

  const loaded = rows.length

  return (
    <div id="main-content" style={{ minHeight:'100vh', background:color.bg0,
      color:color.t1 }}>
      <div style={{ maxWidth:960, margin:'0 auto',
        padding:'48px 40px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontFamily:font.mono, fontSize:10,
            color:color.amber, letterSpacing:'0.1em',
            marginBottom:12 }}>
            MARKET INTELLIGENCE
          </div>
          <h1 style={{ fontFamily:font.sys, fontSize:32,
            fontWeight:700, color:color.t1, margin:'0 0 8px' }}>
            US Construction Markets
          </h1>
          <p style={{ fontFamily:font.sys, fontSize:14,
            color:color.t3, margin:0 }}>
            State-level intelligence: federal pipeline, permits,
            satellite signals, and labor health.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:12, marginBottom:28,
          flexWrap:'wrap', alignItems:'center' }}>

          <input
            placeholder="Search states…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background:color.bg1,
              border:`1px solid ${color.bd1}`,
              borderRadius:8, padding:'8px 14px',
              fontFamily:font.sys, fontSize:14,
              color:color.t1, width:200,
              outline:'none',
            }}
          />

          <div style={{ display:'flex', gap:4 }}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
              <button key={k} onClick={() => setSort(k)}
                style={{
                  background: sort === k
                    ? color.amber : color.bg1,
                  color: sort === k ? '#000' : color.t3,
                  border:`1px solid ${
                    sort === k ? color.amber : color.bd1}`,
                  borderRadius:8, padding:'7px 14px',
                  fontFamily:font.sys, fontSize:13,
                  cursor:'pointer', fontWeight:
                    sort === k ? 600 : 400,
                }}>
                {SORT_LABELS[k]}
              </button>
            ))}
          </div>

          <div style={{ marginLeft:'auto', fontFamily:font.mono,
            fontSize:11, color:color.t4 }}>
            {loading
              ? `Loading… ${loaded}/${STATE_CODES.length}`
              : `${sorted.length} states`}
          </div>
        </div>

        {/* Table */}
        <div style={{ background:color.bg1, borderRadius:14,
          border:`1px solid ${color.bd1}`,
          overflow:'hidden' }}>

          {/* Header row */}
          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 120px 140px 100px 100px',
            padding:'12px 20px',
            borderBottom:`1px solid ${color.bd1}` }}>
            {['State','Verdict','Federal Awards',
              'Permits','WARN (30d)'].map(h => (
              <div key={h} style={{ fontFamily:font.mono,
                fontSize:10, color:color.t4,
                letterSpacing:'0.08em',
                textTransform:'uppercase' }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {sorted.map(row => {
            const vc = verdictColor(row.verdict)
            return (
              <Link key={row.state_code}
                href={`/markets/${row.state_code.toLowerCase()}`}
                style={{ textDecoration:'none' }}>
                <div style={{
                  display:'grid',
                  gridTemplateColumns:
                    '1fr 120px 140px 100px 100px',
                  padding:'14px 20px',
                  borderBottom:`1px solid ${color.bd1}`,
                  cursor:'pointer',
                  transition:'background 0.1s',
                }}
                  onMouseEnter={e =>
                    (e.currentTarget.style.background =
                      color.bg2)}
                  onMouseLeave={e =>
                    (e.currentTarget.style.background =
                      'transparent')}>

                  {/* State name */}
                  <div style={{ fontFamily:font.sys,
                    fontSize:14, color:color.t1,
                    fontWeight:500 }}>
                    {row.state_name}
                    <span style={{ fontFamily:font.mono,
                      fontSize:10, color:color.t4,
                      marginLeft:8 }}>
                      {row.state_code}
                    </span>
                  </div>

                  {/* Verdict */}
                  <div style={{ display:'flex',
                    alignItems:'center' }}>
                    <span style={{
                      fontFamily:font.mono, fontSize:10,
                      fontWeight:700, letterSpacing:'0.06em',
                      padding:'3px 8px', borderRadius:20,
                      background: vc + '22', color: vc,
                    }}>
                      {row.verdict}
                    </span>
                  </div>

                  {/* Federal */}
                  <div style={{ fontFamily:font.mono,
                    fontSize:13, color:color.t1 }}>
                    ${row.federal_awards_total
                      ? row.federal_awards_total
                          .toLocaleString() + 'M'
                      : '—'}
                    {row.federal_awards_rank > 0 && (
                      <span style={{ fontSize:10,
                        color:color.t4, marginLeft:6 }}>
                        #{row.federal_awards_rank}
                      </span>
                    )}
                  </div>

                  {/* Permits */}
                  <div style={{ fontFamily:font.mono,
                    fontSize:12,
                    color:
                      row.permit_trend === 'GROWING'
                        ? color.green
                        : row.permit_trend === 'DECLINING'
                        ? color.red : color.t3 }}>
                    {row.permit_trend}
                  </div>

                  {/* WARN */}
                  <div style={{ fontFamily:font.mono,
                    fontSize:13,
                    color: row.warn_notices_30d > 0
                      ? color.red : color.t4 }}>
                    {row.warn_notices_30d}
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Empty or loading */}
          {!loading && sorted.length === 0 && (
            <div style={{ padding:'40px', textAlign:'center',
              fontFamily:font.sys, fontSize:14, color:color.t4 }}>
              No states match &quot;{search}&quot;
            </div>
          )}

          {loading && rows.length === 0 && (
            <div style={{ padding:'40px', textAlign:'center',
              fontFamily:font.mono, fontSize:12, color:color.t4 }}>
              Loading state data…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
