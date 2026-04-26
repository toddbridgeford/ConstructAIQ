"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { color, font, type as TS, signal as SIG, layout as L, fmtB } from "@/lib/theme"
import { BenchmarkBadge, type BenchmarkResult } from "@/app/components/ui/BenchmarkBadge"
import { InsightChip } from "@/app/components/ui/InsightChip"
import { DataTrustBadge } from "@/app/components/DataTrustBadge"
import { getPrefs } from "@/lib/preferences"
import { RecommendationsCard } from '@/app/dashboard/components/RecommendationsCard'
import { WatchlistCard } from '@/app/dashboard/components/WatchlistCard'
import type { Signal } from "../types"
import type { FreshnessInfo } from "@/lib/freshness"

const ROLE_ORDER: Record<string, string[]> = {
  lender:     ['cshi',   'spend',  'permit', 'emp'],
  contractor: ['emp',    'permit', 'spend',  'cshi'],
  supplier:   ['permit', 'emp',    'spend',  'cshi'],
}
const DEFAULT_ORDER = ['spend', 'emp', 'permit', 'cshi']

const ROLE_NOTES: Record<string, string> = {
  lender:     'Optimized for lending decisions',
  contractor: 'Optimized for contractor decisions',
  supplier:   'Optimized for supplier decisions',
}

const MONO = font.mono
const SYS  = font.sys

interface OverviewProps {
  spendVal:    number | null
  spendMom:    number
  spendSpark:  number[]
  empVal:      number | null
  empMom:      number
  empSpark:    number[]
  permitVal:   number | null
  permitMom:   number
  permitSpark: number[]
  cshiScore:   number | null
  cshiChange:  number | null
  cshiSpark:   number[]
  spendObs:    { date: string; value: number }[]
  signals:     Signal[]
  loading:     boolean
  freshness?:  FreshnessInfo
  forecastDirection?: string | null
}

// ── Anomaly detection ──────────────────────────────────────────────────────

function detectAnomaly(bench: BenchmarkResult): { type: 'anomaly' | 'trend'; text: string; detail?: string } | null {
  if (bench.percentile > 90)
    return { type: 'anomaly', text: 'Unusually high — P90+', detail: `Current value is at the ${bench.percentile}th percentile of the historical range` }
  if (bench.percentile < 10)
    return { type: 'anomaly', text: 'Unusually low — P10 or below', detail: `Current value is at the ${bench.percentile}th percentile of the historical range` }
  const yoy = bench.yoy_change_pct ?? 0
  if (yoy < -5)
    return { type: 'trend', text: `${Math.abs(yoy).toFixed(1)}% below year-ago`, detail: `YoY: ${yoy.toFixed(1)}%` }
  if (yoy > 5)
    return { type: 'trend', text: `${yoy.toFixed(1)}% above year-ago`, detail: `YoY: +${yoy.toFixed(1)}%` }
  return null
}

// ── Inline helpers ─────────────────────────────────────────────────────────

function momColor(v: number): string {
  return v > 0.05 ? SIG.expand : v < -0.05 ? SIG.contract : SIG.watch
}

function Sparkline({ data, stroke }: { data: number[]; stroke: string }) {
  const W = 64, H = 28, P = 2
  const vals = data.filter(Number.isFinite)
  if (vals.length < 2) return <div style={{ width: W, height: H }} />
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1
  const n = vals.length
  const pts = vals.map((v, i) =>
    `${P + (i / (n - 1)) * (W - P * 2)},${H - P - ((v - min) / range) * (H - P * 2)}`
  ).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5}
                strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function ChangeBadge({ value }: { value: number }) {
  const col = momColor(value)
  const arrow = value > 0.05 ? '↑' : value < -0.05 ? '↓' : '→'
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           3,
      fontSize:      11,
      fontFamily:    MONO,
      fontWeight:    600,
      color:         col,
      background:    `${col}18`,
      border:        `1px solid ${col}30`,
      borderRadius:  5,
      padding:       '2px 7px',
      letterSpacing: '0.04em',
    }}>
      {arrow} {value > 0 ? '+' : ''}{value.toFixed(2)}% MoM
    </span>
  )
}

// Pure-SVG spending trend — replaces recharts LineChart to keep recharts
// out of the initial /dashboard bundle.
function SpendingTrend({ data }: { data: { month: string; value: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (data.length < 2) {
    return (
      <div style={{
        height: 200, borderRadius: 8,
        background: `linear-gradient(90deg,${color.bg2} 25%,${color.bg3} 50%,${color.bg2} 75%)`,
        backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
      }} />
    )
  }

  const VW = 600, VH = 200
  const PL = 4, PR = 4, PT = 8, PB = 22
  const cW = VW - PL - PR
  const cH = VH - PT - PB
  const n  = data.length

  const vals = data.map(d => d.value)
  const min  = Math.min(...vals)
  const max  = Math.max(...vals)
  const rng  = max - min || 1

  const px = (i: number) => PL + (i / (n - 1)) * cW
  const py = (v: number) => PT + cH - ((v - min) / rng) * cH
  const pts = data.map((d, i) => `${px(i).toFixed(1)},${py(d.value).toFixed(1)}`).join(' ')

  const step = Math.max(1, Math.ceil((n - 1) / 5))

  const tip = hovered !== null ? (() => {
    const d  = data[hovered]
    const cx = px(hovered), cy = py(d.value)
    const tw = 72, th = 34
    const tx = cx > VW * 0.7 ? cx - tw - 6 : cx + 6
    const ty = Math.max(PT, cy - th - 2)
    return { cx, cy, tx, ty, tw, th, month: d.month, label: fmtB(d.value) }
  })() : null

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
      onMouseLeave={() => setHovered(null)}
    >
      <polyline
        points={pts} fill="none"
        stroke={color.amber} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round"
      />
      <line x1={PL} y1={PT + cH} x2={VW - PR} y2={PT + cH}
            stroke={color.bd1} strokeWidth={0.5} />

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (i % step !== 0 && i !== n - 1) return null
        return (
          <text key={i} x={px(i)} y={VH - 4}
                textAnchor="middle" fontSize={9} fill={color.t4} fontFamily={MONO}>
            {d.month}
          </text>
        )
      })}

      {/* Hover hit-targets */}
      {data.map((_, i) => {
        const slW = cW / (n - 1)
        return (
          <rect key={i}
                x={Math.max(0, px(i) - slW / 2)} y={PT}
                width={slW} height={cH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                style={{ cursor: 'crosshair' }} />
        )
      })}

      {/* Tooltip */}
      {tip && (
        <g>
          <rect x={tip.tx} y={tip.ty} width={tip.tw} height={tip.th}
                rx={4} ry={4} fill={color.bg2} stroke={color.bd2} strokeWidth={0.5} />
          <text x={tip.tx + 6} y={tip.ty + 12}
                fontSize={9} fill={color.t3} fontFamily={MONO}>{tip.month}</text>
          <text x={tip.tx + 6} y={tip.ty + 27}
                fontSize={11} fill={color.t1} fontFamily={MONO} fontWeight="600">{tip.label}</text>
          <circle cx={tip.cx} cy={tip.cy} r={3.5}
                  fill={color.amber} stroke={color.bg1} strokeWidth={1.5} />
        </g>
      )}
    </svg>
  )
}

interface KpiCardProps {
  label:      string
  sourceLine: string
  value:      string
  mom:        number
  spark:      number[]
  accent:     string
  bench?:     BenchmarkResult | null
}

function KpiCard({ label, sourceLine, value, mom, spark, accent, bench }: KpiCardProps) {
  return (
    <div style={{
      background:    color.bg1,
      borderRadius:  L.cardRadius,
      border:        `1px solid ${color.bd1}`,
      padding:       L.cardPad,
      display:       'flex',
      flexDirection: 'column',
      gap:           8,
      minWidth:      0,
    }}>
      <div>
        <div style={{ ...TS.label, color: color.t3 }}>{label}</div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: '0.06em', marginTop: 3 }}>
          {sourceLine}
        </div>
      </div>
      <div style={{
        fontSize:   TS.kpi.fontSize,
        fontFamily: TS.kpi.fontFamily,
        fontWeight: TS.kpi.fontWeight,
        lineHeight: TS.kpi.lineHeight,
        color:      color.t1,
      }}>
        {value}
      </div>
      {bench && (
        <BenchmarkBadge
          classification={bench.classification}
          percentile={bench.percentile}
          label={bench.label}
        />
      )}
      {bench && (() => {
        const chip = detectAnomaly(bench)
        return chip
          ? <InsightChip type={chip.type} text={chip.text} detail={chip.detail} size="sm" />
          : null
      })()}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <ChangeBadge value={mom} />
        <Sparkline data={spark} stroke={accent} />
      </div>
    </div>
  )
}

function signalBorder(type: string): string {
  if (type === 'BULLISH' || type === 'BUY')  return SIG.expand
  if (type === 'BEARISH' || type === 'SELL') return SIG.contract
  return SIG.watch
}

function firstSentence(text: string | undefined): string {
  if (!text) return ''
  const m = text.match(/^[^.!?]+[.!?]/)
  return m ? m[0] : text.slice(0, 140)
}

// ── Section ────────────────────────────────────────────────────────────────

export function OverviewSection({
  spendVal, spendMom, spendSpark,
  empVal,   empMom,   empSpark,
  permitVal, permitMom, permitSpark,
  cshiScore, cshiChange, cshiSpark,
  spendObs, signals, loading, freshness, forecastDirection,
}: OverviewProps) {

  const [spendBench,  setSpendBench]  = useState<BenchmarkResult | null>(null)
  const [empBench,    setEmpBench]    = useState<BenchmarkResult | null>(null)
  const [permitBench, setPermitBench] = useState<BenchmarkResult | null>(null)

  useEffect(() => {
    if (!spendVal || loading) return
    fetch(`/api/benchmark?series=TTLCONS&value=${spendVal}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setSpendBench(d) })
      .catch(() => {})
  }, [spendVal, loading])

  useEffect(() => {
    if (!empVal || loading) return
    fetch(`/api/benchmark?series=CES2000000001&value=${empVal}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setEmpBench(d) })
      .catch(() => {})
  }, [empVal, loading])

  useEffect(() => {
    if (!permitVal || loading) return
    fetch(`/api/benchmark?series=PERMIT&value=${permitVal}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setPermitBench(d) })
      .catch(() => {})
  }, [permitVal, loading])

  const empDisplay    = empVal != null
    ? (empVal >= 1000 ? `${(empVal / 1000).toFixed(1)}M` : `${empVal.toFixed(0)}K`)
    : '—'
  const permitDisplay = permitVal != null
    ? (permitVal >= 1000 ? `${(permitVal / 1000).toFixed(1)}M` : `${permitVal.toFixed(0)}K`)
    : '—'

  // Chart data: month abbreviation + value
  const chartData = spendObs.slice(-12).map(o => ({
    month: new Date(String(o.date) + 'T12:00:00').toLocaleString('default', { month: 'short' }),
    value: Number(o.value),
  }))

  // Role-based ordering
  const role       = getPrefs().role
  const markets    = getPrefs().markets ?? []
  const cardOrder  = ROLE_ORDER[role ?? ''] ?? DEFAULT_ORDER
  const roleNote   = role ? ROLE_NOTES[role] : null

  // For contractors, WARN-related signals surface first
  const sortedSignals = role === 'contractor'
    ? [
        ...signals.filter(s => /warn/i.test(s.type ?? '')),
        ...signals.filter(s => !/warn/i.test(s.type ?? '')),
      ]
    : signals
  const topSignals = sortedSignals.slice(0, 3)

  // Card descriptors — sorted by role preference
  const CARD_DEFS = [
    {
      id: 'spend',
      el: (
        <KpiCard
          key="spend"
          label="Construction Spending"
          sourceLine="Census Bureau · ACTUAL"
          value={spendVal != null ? fmtB(spendVal) : '—'}
          mom={spendMom}
          spark={spendSpark}
          accent={color.amber}
          bench={spendBench}
        />
      ),
    },
    {
      id: 'emp',
      el: (
        <KpiCard
          key="emp"
          label="Construction Employment"
          sourceLine="BLS · ACTUAL"
          value={empDisplay}
          mom={empMom}
          spark={empSpark}
          accent={color.green}
          bench={empBench}
        />
      ),
    },
    {
      id: 'permit',
      el: (
        <KpiCard
          key="permit"
          label="Permits (annualized)"
          sourceLine="Census Bureau · ACTUAL · 59 cities"
          value={permitDisplay}
          mom={permitMom}
          spark={permitSpark}
          accent={color.blue}
          bench={permitBench}
        />
      ),
    },
    {
      id: 'cshi',
      el: (
        <KpiCard
          key="cshi"
          label="CSHI Score"
          sourceLine="ConstructAIQ · DERIVED SCORE"
          value={cshiScore != null ? cshiScore.toFixed(1) : '—'}
          mom={cshiChange ?? 0}
          spark={cshiSpark.length >= 2 ? cshiSpark : []}
          accent={color.purple}
        />
      ),
    },
  ]
  const orderedCards = [...CARD_DEFS].sort(
    (a, b) => cardOrder.indexOf(a.id) - cardOrder.indexOf(b.id)
  )

  return (
    <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', gap: L.sectionGap }}>
      <style>{`
        .ov-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        .ov-row2  { display: grid; grid-template-columns: 3fr 2fr;       gap: 14px; }
        @media (max-width: 900px)  { .ov-cards { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 900px)  { .ov-row2  { grid-template-columns: 1fr; } }
        @media (max-width: 480px)  { .ov-cards { grid-template-columns: 1fr; } }
      `}</style>

      {freshness && (
        <DataTrustBadge
          source="Census Bureau · BLS"
          cadence="Monthly"
          type="actual"
          status={!freshness.isoDate ? 'unknown' : freshness.isStale ? 'stale' : 'fresh'}
          dataAsOf={freshness.isoDate || undefined}
        />
      )}

      {/* ── Forecast direction chip ── */}
      {!loading && forecastDirection && (
        <div style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           8,
          background:    `${color.blue}12`,
          border:        `1px solid ${color.blue}30`,
          borderRadius:  7,
          padding:       '5px 12px',
          alignSelf:     'flex-start',
        }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: color.blue, letterSpacing: '0.06em' }}>
            FORECAST
          </span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: color.t2 }}>
            {forecastDirection}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9, color: color.t4 }}>
            — model estimate · see Forecast tab
          </span>
        </div>
      )}

      {/* ── Top signal driver ── */}
      {!loading && signals[0] && (
        <div style={{
          background:   color.bg1,
          border:       `1px solid ${color.bd1}`,
          borderRadius: 10,
          padding:      '12px 20px',
          marginBottom: 20,
          fontFamily:   font.sys,
          fontSize:     14,
          color:        color.t2,
          lineHeight:   1.6,
        }}>
          <span style={{
            fontFamily:    font.mono,
            fontSize:      10,
            color:         color.amber,
            letterSpacing: '0.08em',
            marginRight:   10,
          }}>
            TOP SIGNAL
          </span>
          {signals[0].title}
          {signals[0].description && (
            <span style={{ color: color.t4 }}>
              {' — '}{signals[0].description}
            </span>
          )}
        </div>
      )}

      {/* ── Row 1: KPI cards ── */}
      {roleNote && !loading && (
        <div style={{
          fontFamily:    font.mono,
          fontSize:      10,
          color:         color.t4,
          letterSpacing: '0.06em',
          marginBottom:  -L.sectionGap + 8,
        }}>
          {roleNote}
        </div>
      )}
      <div className="ov-cards">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              height: 130, borderRadius: L.cardRadius,
              background: `linear-gradient(90deg,${color.bg2} 25%,${color.bg3} 50%,${color.bg2} 75%)`,
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
            }} />
          ))
        ) : (
          orderedCards.map(({ el }) => el)
        )}
      </div>

      {/* ── Row 2: Trend chart + Signals ── */}
      <div className="ov-row2">

        {/* LEFT — 12-month spending trend */}
        <div style={{
          background:    color.bg1,
          borderRadius:  L.cardRadius,
          border:        `1px solid ${color.bd1}`,
          padding:       L.cardPad,
          display:       'flex',
          flexDirection: 'column',
          gap:           16,
        }}>
          <div style={{ ...TS.label, color: color.t3 }}>Construction Spending — 12 Months</div>
          <SpendingTrend data={chartData} />
        </div>

        {/* RIGHT — Top 3 signals */}
        <div style={{
          background:    color.bg1,
          borderRadius:  L.cardRadius,
          border:        `1px solid ${color.bd1}`,
          padding:       L.cardPad,
          display:       'flex',
          flexDirection: 'column',
          gap:           0,
        }}>
          <div style={{ ...TS.label, color: color.t3, marginBottom: 14 }}>Live Signals</div>

          {topSignals.length === 0 && loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                height: 52, marginBottom: 10, borderRadius: 8,
                background: `linear-gradient(90deg,${color.bg2} 25%,${color.bg3} 50%,${color.bg2} 75%)`,
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }} />
            ))
          ) : topSignals.length === 0 ? (
            <div style={{
              padding: '20px 0', textAlign: 'center',
              fontFamily: SYS, fontSize: 13, color: color.t4, lineHeight: 1.6,
            }}>
              No active signals detected.
              <br />
              <span style={{ fontSize: 12 }}>
                Signals generate when anomalies or divergences exceed detection thresholds.
              </span>
            </div>
          ) : (
            topSignals.map((sig, i) => {
              const border = signalBorder(sig.type)
              return (
                <div key={i} style={{
                  borderLeft:    `3px solid ${border}`,
                  paddingLeft:   12,
                  paddingTop:    10,
                  paddingBottom: 10,
                  marginBottom:  i < topSignals.length - 1 ? 8 : 0,
                }}>
                  <div style={{
                    fontSize:   13,
                    fontFamily: SYS,
                    fontWeight: 600,
                    color:      color.t1,
                    lineHeight: 1.35,
                    marginBottom: 4,
                  }}>
                    {sig.title}
                  </div>
                  <div style={{
                    fontSize:   12,
                    fontFamily: SYS,
                    color:      color.t3,
                    lineHeight: 1.5,
                  }}>
                    {firstSentence(sig.description)}
                  </div>
                </div>
              )
            })
          )}

          <Link href="/dashboard" onClick={() => {}} style={{
            display:       'block',
            marginTop:     'auto',
            paddingTop:    14,
            fontSize:      12,
            fontFamily:    MONO,
            color:         color.blue,
            letterSpacing: '0.04em',
            textDecoration: 'none',
          }}>
            See all signals →
          </Link>
        </div>

      </div>

      {/* Watchlist (server-persisted) */}
      <div style={{ marginTop: 32 }}>
        <WatchlistCard />
      </div>

      {/* Recommendations */}
      <div style={{ marginTop: 32 }}>
        <RecommendationsCard
          markets={markets}
        />
      </div>
    </div>
  )
}
