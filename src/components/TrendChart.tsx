"use client"

import { useState } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  BarChart,
  LineChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from "recharts"
import { color, font } from "@/lib/theme"

interface DataPoint {
  label: string
  value: number
  value2?: number
}

interface TrendChartProps {
  data: Array<DataPoint>
  type?: "area" | "bar" | "line"
  color1?: string
  color2?: string
  label1?: string
  label2?: string
  height?: number
  timeRanges?: string[]
  onTimeRangeChange?: (range: string) => void
  activeRange?: string
  yFormatter?: (v: number) => string
  title?: string
  showExport?: boolean
  onCSVExport?: () => void
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null

  return (
    <div
      style={{
        background: color.bg3,
        border: `1px solid ${color.bd2}`,
        borderRadius: 10,
        padding: "8px 12px",
        fontFamily: font.mono,
        fontSize: 12,
        color: color.t1,
        pointerEvents: "none",
      }}
    >
      <div style={{ color: color.t4, marginBottom: 4, fontSize: 10 }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color as string }}>
          {entry.name ? `${entry.name}: ` : ""}{String(entry.value)}
        </div>
      ))}
    </div>
  )
}

const GRADIENT_ID_1 = "trendGradient1"
const GRADIENT_ID_2 = "trendGradient2"

export function TrendChart({
  data,
  type = "area",
  color1,
  color2,
  label1,
  label2,
  height = 200,
  timeRanges,
  onTimeRangeChange,
  activeRange,
  yFormatter = (v) => `${v}`,
  title,
  showExport = false,
  onCSVExport,
}: TrendChartProps) {
  const [internalRange, setInternalRange] = useState<string>(
    timeRanges?.[0] ?? ""
  )

  const c1 = color1 ?? color.amber
  const c2 = color2 ?? color.blue

  const currentRange = activeRange ?? internalRange
  const hasValue2 = data.some((d) => d.value2 !== undefined)

  function handleRangeClick(range: string) {
    setInternalRange(range)
    onTimeRangeChange?.(range)
  }

  const tickProps = { fontFamily: font.mono, fontSize: 9, fill: color.t4 }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 4, right: 4, left: 0, bottom: 0 },
    }

    if (type === "bar") {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid vertical={false} stroke={color.bd1} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={tickProps}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={tickProps}
            axisLine={false}
            tickLine={false}
            tickFormatter={yFormatter}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            name={label1}
            fill={c1}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          {hasValue2 && (
            <Bar
              dataKey="value2"
              name={label2}
              fill={c2}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      )
    }

    if (type === "line") {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid vertical={false} stroke={color.bd1} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={tickProps}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={tickProps}
            axisLine={false}
            tickLine={false}
            tickFormatter={yFormatter}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            name={label1}
            stroke={c1}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          {hasValue2 && (
            <Line
              type="monotone"
              dataKey="value2"
              name={label2}
              stroke={c2}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          )}
        </LineChart>
      )
    }

    // Default: area
    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id={GRADIENT_ID_1} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={c1} stopOpacity={0.25} />
            <stop offset="95%" stopColor={c1} stopOpacity={0} />
          </linearGradient>
          {hasValue2 && (
            <linearGradient id={GRADIENT_ID_2} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={c2} stopOpacity={0.25} />
              <stop offset="95%" stopColor={c2} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid vertical={false} stroke={color.bd1} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={tickProps}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={tickProps}
          axisLine={false}
          tickLine={false}
          tickFormatter={yFormatter}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          name={label1}
          stroke={c1}
          strokeWidth={2}
          fill={`url(#${GRADIENT_ID_1})`}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        {hasValue2 && (
          <Area
            type="monotone"
            dataKey="value2"
            name={label2}
            stroke={c2}
            strokeWidth={2}
            fill={`url(#${GRADIENT_ID_2})`}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        )}
      </AreaChart>
    )
  }

  return (
    <div
      style={{
        background: color.bg2,
        borderRadius: 16,
        padding: 16,
        border: `1px solid ${color.bd1}`,
      }}
    >
      {/* Header row: title + export */}
      {(title || showExport) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          {title ? (
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 11,
                color: color.t4,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {title}
            </span>
          ) : (
            <span />
          )}
          {showExport && null}
        </div>
      )}

      {/* Time range toggles */}
      {timeRanges && timeRanges.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {timeRanges.map((range) => {
            const isActive = range === currentRange
            return (
              <button
                key={range}
                onClick={() => handleRangeClick(range)}
                style={{
                  fontFamily: font.mono,
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 400,
                  padding: "3px 10px",
                  borderRadius: 20,
                  border: `1px solid ${isActive ? color.amber : color.bd1}`,
                  background: isActive ? color.amberDim : color.bg1,
                  color: isActive ? color.amber : color.t4,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {range}
              </button>
            )
          })}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}
