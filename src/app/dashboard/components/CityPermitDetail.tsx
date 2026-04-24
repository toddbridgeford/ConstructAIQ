"use client"
import { useEffect, useState, useMemo } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import { color, font } from "@/lib/theme"

interface MonthlyPoint { year_month: string; permit_count: number; total_valuation: number; total_units: number }
interface TypeBreakdownItem { permit_type: string; permit_count: number; total_valuation: number }
interface HighValuePermit { permit_number: string; permit_type: string; valuation: number; address: string; zip_code: string; issued_date: string }
interface CityDetailData { last_fetched: string | null; monthly: MonthlyPoint[]; type_breakdown: TypeBreakdownItem[]; high_value_permits: HighValuePermit[] }

export interface CityPermitData {
  city_code: string; city_name: string; state_code: string
  last_fetched: string | null; monthly: MonthlyPoint[]
  latest_month: MonthlyPoint | null; yoy_change_pct: number | null; ytd_valuation: number
}

function fmtVal(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v}`
}

const TYPE_LABELS: Record<string, string> = {
  new_construction: 'New Construction',
  addition:         'Addition',
  alteration:       'Alteration',
  other:            'Other',
}
const TYPE_ORDER = ['new_construction', 'addition', 'alteration', 'other']

export function CityPermitDetail({ cityCode, cityData }: { cityCode: string; cityData: CityPermitData }) {
  const [detail,  setDetail]  = useState<CityDetailData | null>(null)
  const [resMo,   setResMo]   = useState<MonthlyPoint[]>([])
  const [comMo,   setComMo]   = useState<MonthlyPoint[]>([])
  const [loading, setLoading] = useState(false)

  const BG2 = color.bg2, BG3 = color.bg3, BD1 = color.bd1, BD2 = color.bd2
  const T1 = color.t1, T3 = color.t3, T4 = color.t4
  const MONO = font.mono, SYS = font.sys
  const BLUE = color.blue, AMBER = color.amber, GREEN = color.green, RED = color.red
  const typeColors: Record<string, string> = { new_construction: BLUE, addition: GREEN, alteration: AMBER, other: T3 }

  useEffect(() => {
    setLoading(true)
    setDetail(null); setResMo([]); setComMo([])
    Promise.all([
      fetch(`/api/permits/${cityCode}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/permits?city=${cityCode}&class=residential`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/permits?city=${cityCode}&class=commercial`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([det, res, com]) => {
      setDetail(det)
      setResMo(res?.cities?.[0]?.monthly ?? [])
      setComMo(com?.cities?.[0]?.monthly ?? [])
      setLoading(false)
    })
  }, [cityCode])

  const chartData = useMemo(() => {
    const months = [...new Set([...resMo.map(m => m.year_month), ...comMo.map(m => m.year_month)])].sort().slice(-12)
    return months.map(ym => ({
      month:       ym.slice(5, 7) + '/' + ym.slice(2, 4),
      residential: resMo.find(m => m.year_month === ym)?.permit_count ?? 0,
      commercial:  comMo.find(m => m.year_month === ym)?.permit_count ?? 0,
    }))
  }, [resMo, comMo])

  const avgLine = chartData.length
    ? Math.round(chartData.reduce((s, d) => s + d.residential + d.commercial, 0) / chartData.length)
    : 0

  const latest   = cityData.latest_month
  const yoy      = cityData.yoy_change_pct
  const yoyColor = yoy == null ? T4 : yoy >= 0 ? GREEN : RED
  const yoyStr   = yoy == null ? '—' : `${yoy >= 0 ? '↑' : '↓'} ${Math.abs(yoy).toFixed(1)}%`

  const typeBreakdown  = detail?.type_breakdown ?? []
  const totalTypeCount = typeBreakdown.reduce((s, t) => s + t.permit_count, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Heading */}
      <div>
        <h3 style={{ fontFamily: SYS, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: T1, margin: 0 }}>
          {cityData.city_name}
        </h3>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T4, marginTop: 4 }}>
          {detail?.last_fetched
            ? `Updated ${new Date(detail.last_fetched).toLocaleDateString()}`
            : loading ? 'Loading…' : 'No data yet'}
        </div>
      </div>

      {/* KPI trio */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'This Month',    value: latest ? latest.permit_count.toLocaleString() : '—',    vc: T1      },
          { label: 'YoY Change',    value: yoyStr,                                                  vc: yoyColor },
          { label: 'Valuation',     value: latest ? fmtVal(latest.total_valuation) : '—',           vc: T1      },
        ].map(k => (
          <div key={k.label} style={{ background: BG3, borderRadius: 10, padding: '10px 12px', border: `1px solid ${BD2}` }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: T4, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>{k.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: k.vc }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {chartData.length > 0 ? (
        <div style={{ background: BG2, borderRadius: 12, padding: '14px 14px 8px', border: `1px solid ${BD1}` }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: T4, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            12-MONTH TREND
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: -22 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={BD2} vertical={false} />
              <XAxis dataKey="month" tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontFamily: MONO, fontSize: 9, fill: T4 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: BG3, border: `1px solid ${BD2}`, borderRadius: 8, fontFamily: MONO, fontSize: 10 }} labelStyle={{ color: T3 }} itemStyle={{ color: T1 }} />
              {avgLine > 0 && <ReferenceLine y={avgLine} stroke={T4} strokeDasharray="4 4" strokeWidth={1} />}
              <Line type="monotone" dataKey="residential" stroke={BLUE}  strokeWidth={1.5} dot={false} name="Residential" />
              <Line type="monotone" dataKey="commercial"  stroke={AMBER} strokeWidth={1.5} dot={false} name="Commercial"  />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 14, marginTop: 4, justifyContent: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: 9, color: BLUE  }}>● Residential</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: AMBER }}>● Commercial</span>
          </div>
        </div>
      ) : loading ? (
        <div style={{ height: 160, background: BG2, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BD1}` }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: T4 }}>Loading trend…</span>
        </div>
      ) : null}

      {/* Type breakdown */}
      {typeBreakdown.length > 0 && (
        <div style={{ background: BG2, borderRadius: 12, padding: '14px 14px', border: `1px solid ${BD1}` }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: T4, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            PERMIT TYPE BREAKDOWN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {TYPE_ORDER.map(key => {
              const row  = typeBreakdown.find(t => t.permit_type === key)
              const cnt  = row?.permit_count ?? 0
              const pct  = totalTypeCount > 0 ? (cnt / totalTypeCount) * 100 : 0
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: SYS, fontSize: 12, color: T3 }}>{TYPE_LABELS[key]}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T4 }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 4, background: BD1, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: typeColors[key] ?? T3, borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* High-value permits */}
      {(detail?.high_value_permits?.length ?? 0) > 0 && (
        <div style={{ background: BG2, borderRadius: 12, padding: '14px 14px', border: `1px solid ${BD1}` }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: T4, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            RECENT PROJECTS &gt; $5M
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detail!.high_value_permits.slice(0, 5).map(p => (
              <div key={p.permit_number} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, paddingBottom: 8, borderBottom: `1px solid ${BD2}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: SYS, fontSize: 12, color: T1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.address || p.permit_number}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: T4, marginTop: 2 }}>
                    {p.permit_type.replace(/_/g, ' ')} · {p.issued_date}
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: GREEN, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {fmtVal(p.valuation)}
                </div>
              </div>
            ))}
          </div>
          <a href={`/permits/${cityCode}`} style={{ display: 'block', fontFamily: MONO, fontSize: 9, color: BLUE, marginTop: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            View all permits →
          </a>
        </div>
      )}
    </div>
  )
}
