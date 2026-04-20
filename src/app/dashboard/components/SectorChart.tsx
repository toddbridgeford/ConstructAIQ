"use client"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts"
import { font, color } from "@/lib/theme"

const MONO = font.mono
const SYS = font.sys

type TimeRange = "3M" | "6M" | "1Y" | "3Y"

interface SectorChartProps {
  data: Array<{ date: string; constructionIndex: number; sp500Index: number }>
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const construction = payload.find((p) => p.name === "constructionIndex")
  const sp500 = payload.find((p) => p.name === "sp500Index")
  const spread = construction && sp500 ? (construction.value - sp500.value).toFixed(1) : null

  return (
    <div
      style={{
        background: color.bg4,
        border: `1px solid ${color.bd2}`,
        borderRadius: 8,
        padding: "10px 14px",
        fontFamily: MONO,
        fontSize: 12,
      }}
    >
      <div style={{ color: color.t4, marginBottom: 6 }}>{label}</div>
      {construction && (
        <div style={{ color: color.amber, marginBottom: 2 }}>
          Construction: {construction.value.toFixed(1)}
        </div>
      )}
      {sp500 && (
        <div style={{ color: color.t3, marginBottom: 4 }}>
          S&P 500: {sp500.value.toFixed(1)}
        </div>
      )}
      {spread && (
        <div style={{ color: parseFloat(spread) >= 0 ? color.green : color.red, borderTop: `1px solid ${color.bd1}`, paddingTop: 4 }}>
          Spread: {parseFloat(spread) >= 0 ? "+" : ""}{spread}
        </div>
      )}
    </div>
  )
}

const TIME_RANGES: TimeRange[] = ["3M", "6M", "1Y", "3Y"]

export function SectorChart({ data, timeRange, onTimeRangeChange }: SectorChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 24, color: color.t4, fontFamily: SYS, fontSize: 14, textAlign: "center" }}>
        No market data available.
      </div>
    )
  }

  return (
    <div
      style={{
        background: color.bg2,
        border: `1px solid ${color.bd1}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
            Sector Performance
          </div>
          <div style={{ fontFamily: SYS, fontSize: 16, fontWeight: 600, color: color.t1 }}>
            Construction vs. S&P 500 (Indexed to 100)
          </div>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => onTimeRangeChange(r)}
              style={{
                background: timeRange === r ? color.amber : "transparent",
                border: `1px solid ${timeRange === r ? color.amber : color.bd2}`,
                borderRadius: 6,
                padding: "4px 10px",
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 600,
                color: timeRange === r ? color.bg0 : color.t3,
                cursor: "pointer",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={color.bd1} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
            axisLine={{ stroke: color.bd2 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={100} stroke={color.bd3} strokeDasharray="4 2" />
          <Legend
            wrapperStyle={{ fontFamily: SYS, fontSize: 12, color: color.t3, paddingTop: 8 }}
            formatter={(value) =>
              value === "constructionIndex"
                ? "ConstructAIQ Construction Composite"
                : "S&P 500"
            }
          />
          <Line
            type="monotone"
            dataKey="constructionIndex"
            stroke={color.amber}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="sp500Index"
            stroke={color.t4}
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
