"use client"
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { font, color } from "@/lib/theme"
import { ChartFooter } from "./ChartFooter"

const MONO = font.mono
const SYS = font.sys

interface DataPoint {
  date: string
  value: number
}

interface MaterialsCorrelationProps {
  materialsCostData: DataPoint[]
  constructionSpendData: DataPoint[]
}

function computeR2(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return 0
  const meanX = xs.slice(0, n).reduce((a, b) => a + b, 0) / n
  const meanY = ys.slice(0, n).reduce((a, b) => a + b, 0) / n
  let ssXY = 0, ssXX = 0, ssYY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    ssXY += dx * dy
    ssXX += dx * dx
    ssYY += dy * dy
  }
  if (ssXX === 0 || ssYY === 0) return 0
  const r = ssXY / Math.sqrt(ssXX * ssYY)
  return parseFloat((r * r).toFixed(3))
}

function mergeData(mats: DataPoint[], spend: DataPoint[]) {
  const spendMap = new Map(spend.map(d => [d.date, d.value]))
  return mats.map(m => ({
    date: m.date,
    materials: m.value,
    spending: spendMap.get(m.date) ?? null,
  }))
}

export function MaterialsCorrelation({ materialsCostData, constructionSpendData }: MaterialsCorrelationProps) {
  const hasMats = materialsCostData && materialsCostData.length > 0
  const hasSpend = constructionSpendData && constructionSpendData.length > 0

  const chartData = hasMats && hasSpend
    ? mergeData(materialsCostData, constructionSpendData)
    : []

  const r2 = hasMats && hasSpend
    ? computeR2(materialsCostData.map(d => d.value), constructionSpendData.map(d => d.value))
    : 0

  const isEmpty = chartData.length === 0

  return (
    <div style={{
      background: color.bg2,
      border: `1px solid ${color.bd1}`,
      borderRadius: 16,
      padding: 20,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, letterSpacing: "0.08em" }}>
          MATERIALS COST vs. CONSTRUCTION SPENDING
        </div>
        {!isEmpty && (
          <div style={{
            background: color.bg3,
            border: `1px solid ${color.bd2}`,
            borderRadius: 8,
            padding: "4px 10px",
            fontFamily: MONO,
            fontSize: 11,
            color: color.t3,
          }}>
            R² = <span style={{ color: color.amber, fontWeight: 700 }}>{r2.toFixed(3)}</span>
          </div>
        )}
      </div>

      <div style={{ fontFamily: SYS, fontSize: 11, color: color.t4, marginBottom: 14 }}>
        Materials costs typically lead construction spending by 60–90 days
      </div>

      {isEmpty ? (
        <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: color.t4, fontFamily: MONO, fontSize: 13 }}>
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 50, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={color.bd1} />
            <XAxis
              dataKey="date"
              tick={{ fontFamily: MONO, fontSize: 9, fill: color.t4 }}
              axisLine={{ stroke: color.bd2 }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontFamily: MONO, fontSize: 9, fill: color.red }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v: number) => v.toFixed(0)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontFamily: MONO, fontSize: 9, fill: color.amber }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v: number) => `$${v.toFixed(0)}B`}
            />
            <Tooltip
              contentStyle={{
                background: color.bg3,
                border: `1px solid ${color.bd2}`,
                borderRadius: 8,
                fontFamily: MONO,
                fontSize: 11,
              }}
              labelStyle={{ color: color.t2 }}
            />
            <Legend
              wrapperStyle={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="materials"
              name="Materials Cost Index"
              stroke={color.red}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="spending"
              name="Construction Spending ($B)"
              stroke={color.amber}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              strokeDasharray="4 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <ChartFooter
        source="BLS Producer Price Index"
        unit="Index 1982=100"
        frequency="Monthly"
        asOf={materialsCostData?.[materialsCostData.length - 1]?.date ?? null}
      />
    </div>
  )
}
