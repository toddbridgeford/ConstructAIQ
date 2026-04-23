'use client'
import { useState, useEffect } from 'react'
import { font, color } from '@/lib/theme'
import { Skeleton } from '@/app/components/Skeleton'

interface MsaRow {
  msa_code:         string
  msa_name:         string
  bsi_change_90d:   number | null
  classification:   string
  confidence:       string
  observation_date: string
}

interface SatelliteData {
  processing_status: string
  msa_count:         number
  msas:              MsaRow[]
  last_processed:    string
}

function classColor(c: string): string {
  if (c === 'DEMAND_DRIVEN')      return color.green
  if (c === 'FEDERAL_INVESTMENT') return '#0066CC'
  if (c === 'RECONSTRUCTION')     return color.amber
  if (c === 'ORGANIC_GROWTH')     return color.t2
  return color.t4
}

export default function GroundSignalPage() {
  const [data, setData]           = useState<SatelliteData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [selectedMsa, setSelectedMsa] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/satellite')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sorted = data?.msas
    ? [...data.msas].sort((a, b) => {
        if (a.bsi_change_90d === null && b.bsi_change_90d === null) return 0
        if (a.bsi_change_90d === null) return 1
        if (b.bsi_change_90d === null) return -1
        return b.bsi_change_90d - a.bsi_change_90d
      })
    : []

  return (
    <div style={{ minHeight: '100vh', background: color.bg0, color: color.t1, fontFamily: font.sys }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} a{color:inherit;text-decoration:none}`}</style>

      {/* Section 1: Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '32px 40px 0' }}>
        <h1 style={{ fontFamily: font.sys, fontSize: 22, fontWeight: 700, color: color.t1, margin: 0 }}>
          Ground Signal Intelligence
        </h1>

        <span style={{ fontFamily: font.sys, fontSize: 14, color: color.t3 }}>
          Sentinel-2 Satellite · 20 US Markets
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            background: color.bg2,
            border: '1px solid ' + color.bd1,
            borderRadius: 6,
            padding: '4px 10px',
            fontFamily: font.mono,
            fontSize: 10,
            color: color.amber,
            letterSpacing: '0.08em',
          }}>
            UPDATED WEEKLY
          </span>
          <span style={{
            background: color.bg2,
            border: '1px solid ' + color.bd1,
            borderRadius: 6,
            padding: '4px 10px',
            fontFamily: font.mono,
            fontSize: 10,
            color: color.t4,
            letterSpacing: '0.08em',
          }}>
            {data?.last_processed ?? '—'}
          </span>
        </div>
      </div>

      {/* Section 2: Map placeholder */}
      <div style={{
        height: '70vh',
        minHeight: 480,
        margin: '24px 40px',
        borderRadius: 16,
        background: color.bg1,
        border: '1px solid ' + color.bd1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {/* MapComponent goes here — UI6-B */}
        <span style={{ fontFamily: font.mono, fontSize: 12, color: color.t4 }}>
          Map loading in next session
        </span>
      </div>

      {/* Section 3: Ranked table */}
      <div style={{ padding: '0 40px 48px' }}>
        {loading ? (
          <Skeleton height={300} />
        ) : data?.processing_status === 'pending_first_run' ? (
          <div style={{ textAlign: 'center', color: color.t3, fontFamily: font.sys, fontSize: 15, padding: '48px 0' }}>
            Satellite data pending first processing run.
            <br />
            Check back after the Sunday GitHub Actions workflow completes.
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {(['MARKET', 'CLASSIFICATION', 'BSI CHANGE (90D)', 'CONFIDENCE'] as const).map(h => (
                    <th key={h} style={{
                      fontFamily: font.mono,
                      fontSize: 11,
                      color: color.t4,
                      fontWeight: 500,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '0 16px 12px',
                      textAlign: 'left',
                      borderBottom: '1px solid ' + color.bd1,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(msa => (
                  <tr
                    key={msa.msa_code}
                    onClick={() => setSelectedMsa(selectedMsa === msa.msa_code ? null : msa.msa_code)}
                    style={{
                      borderBottom: '1px solid ' + color.bd1,
                      cursor: 'pointer',
                      background: selectedMsa === msa.msa_code ? color.bg2 : 'transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = color.bg2 }}
                    onMouseLeave={e => { e.currentTarget.style.background = selectedMsa === msa.msa_code ? color.bg2 : 'transparent' }}
                  >
                    <td style={{ padding: '14px 16px', fontFamily: font.sys, fontSize: 14, color: color.t1, fontWeight: 500 }}>
                      {msa.msa_name}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        borderRadius: 20,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontFamily: font.mono,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        background: classColor(msa.classification) + '22',
                        color: classColor(msa.classification),
                      }}>
                        {msa.classification.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      fontFamily: font.mono,
                      fontSize: 14,
                      color: msa.bsi_change_90d === null
                        ? color.t4
                        : msa.bsi_change_90d > 0 ? color.green : color.red,
                    }}>
                      {msa.bsi_change_90d === null
                        ? '—'
                        : (msa.bsi_change_90d > 0 ? '+' : '') + msa.bsi_change_90d.toFixed(1) + '%'}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      fontFamily: font.mono,
                      fontSize: 11,
                      color: msa.confidence === 'HIGH'
                        ? color.green
                        : msa.confidence === 'MEDIUM'
                        ? color.amber
                        : color.t4,
                    }}>
                      {msa.confidence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{
              margin: '24px 0 0',
              padding: '16px 20px',
              background: color.bg1,
              borderRadius: 10,
              border: '1px solid ' + color.bd1,
            }}>
              <p style={{ fontFamily: font.sys, fontSize: 13, color: color.t4, lineHeight: 1.7 }}>
                BSI (Bare Soil Index) is computed from Sentinel-2 L2A satellite imagery via the ESA
                Copernicus Data Space. Higher values indicate exposed mineral soil — the signature of
                active construction site preparation. Results are updated weekly. Cloud cover affects
                data quality; the Confidence column reflects scene availability. Source: ESA Copernicus
                ·{' '}
                <a href="/methodology" style={{ color: color.amber }}>
                  /methodology
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
