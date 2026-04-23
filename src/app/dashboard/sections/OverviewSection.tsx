"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { color, font, type as TS, signal as SIG, layout as L, fmtB } from "@/lib/theme"
import { BenchmarkBadge, type BenchmarkResult } from "@/app/components/ui/BenchmarkBadge"
import type { Signal } from "../types"

const MONO = font.mono
const SYS  = font.sys

interface OverviewProps {
  spendVal:    number
  spendMom:    number
  spendSpark:  number[]
  empVal:      number
  empMom:      number
  empSpark:    number[]
  permitVal:   number
  permitMom:   number
  permitSpark: number[]
  cshiScore:   number
  cshiChange:  number
  cshiSpark:   number[]
  spendObs:    { date: string; value: number }[]
  signals:     Signal[]
  loading:     boolean
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

interface KpiCardProps {
  label:  string
  value:  string
  mom:    number
  spark:  number[]
  accent: string
  bench?: BenchmarkResult | null
}

function KpiCard({ label, value, mom, spark, accent, bench }: KpiCardProps) {
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
      <div style={{ ...TS.label, color: color.t3 }}>{label}</div>
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
  spendObs, signals, loading,
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

  const empDisplay    = empVal >= 1000  ? `${(empVal / 1000).toFixed(1)}M` : `${empVal.toFixed(0)}K`
  const permitDisplay = permitVal >= 1000 ? `${(permitVal / 1000).toFixed(1)}M` : `${permitVal.toFixed(0)}K`

  // Chart data: month abbreviation + value
  const chartData = spendObs.slice(-12).map(o => ({
    month: new Date(String(o.date) + 'T12:00:00').toLocaleString('default', { month: 'short' }),
    value: Number(o.value),
  }))

  const topSignals = signals.slice(0, 3)

  return (
    <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', gap: L.sectionGap }}>
      <style>{`
        .ov-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        .ov-row2  { display: grid; grid-template-columns: 3fr 2fr;       gap: 14px; }
        @media (max-width: 900px)  { .ov-cards { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 900px)  { .ov-row2  { grid-template-columns: 1fr; } }
        @media (max-width: 480px)  { .ov-cards { grid-template-columns: 1fr; } }
      `}</style>

      {/* ── Row 1: KPI cards ── */}
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
          <>
            <KpiCard
              label="Construction Spending"
              value={fmtB(spendVal)}
              mom={spendMom}
              spark={spendSpark}
              accent={color.amber}
              bench={spendBench}
            />
            <KpiCard
              label="Employment"
              value={empDisplay}
              mom={empMom}
              spark={empSpark}
              accent={color.green}
              bench={empBench}
            />
            <KpiCard
              label="Permits (annualized)"
              value={permitDisplay}
              mom={permitMom}
              spark={permitSpark}
              accent={color.blue}
              bench={permitBench}
            />
            <KpiCard
              label="CSHI Score"
              value={cshiScore.toFixed(1)}
              mom={cshiChange}
              spark={cshiSpark.length >= 2 ? cshiSpark : Array(12).fill(cshiScore)}
              accent={color.purple}
            />
          </>
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
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: color.t4, fontFamily: MONO }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background:   color.bg2,
                    border:       `1px solid ${color.bd2}`,
                    borderRadius: 8,
                    fontSize:     12,
                    fontFamily:   MONO,
                    color:        color.t1,
                  }}
                  labelStyle={{ color: color.t3 }}
                  formatter={(v: number) => [fmtB(v), 'Spending']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color.amber}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: color.amber, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 200, borderRadius: 8,
              background: `linear-gradient(90deg,${color.bg2} 25%,${color.bg3} 50%,${color.bg2} 75%)`,
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
            }} />
          )}
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

          {topSignals.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                height: 52, marginBottom: 10, borderRadius: 8,
                background: `linear-gradient(90deg,${color.bg2} 25%,${color.bg3} 50%,${color.bg2} 75%)`,
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }} />
            ))
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
    </div>
  )
}
