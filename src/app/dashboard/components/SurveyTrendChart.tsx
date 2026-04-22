"use client"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { color, font } from "@/lib/theme"

const MONO = font.mono
const SYS  = font.sys

interface TrendPoint {
  quarter: string
  backlog_net: number
  margin_net:  number
  labor_net:   number
  market_net:  number
}

interface Props {
  data: TrendPoint[]
}

function abbrevQuarter(q: string): string {
  // "Q2 2025" → "Q2'25"
  return q.replace(/(\w+)\s+(\d{2})(\d{2})/, "$1'$3").replace(/(\w+)\s+(\d{4})/, (_, qp, yr) => `${qp}'${yr.slice(2)}`)
}

const LINES = [
  { key: "backlog_net", label: "BOI",  col: color.green },
  { key: "margin_net",  label: "MEI",  col: color.blue  },
  { key: "labor_net",   label: "LAI",  col: color.amber },
  { key: "market_net",  label: "MOI",  col: color.t2    },
]

export function SurveyTrendChart({ data }: Props) {
  const formatted = data.map(d => ({ ...d, quarter: abbrevQuarter(d.quarter) }))

  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.1em", marginBottom: 12 }}>
        QUARTERLY TREND — NET SCORES
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={color.bd1} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="quarter"
            tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[-100, 100]}
            tick={{ fontFamily: MONO, fontSize: 10, fill: color.t4 }}
            axisLine={false} tickLine={false}
            tickCount={5}
          />
          <ReferenceLine y={0} stroke={color.bd2} strokeDasharray="4 2" />
          <Tooltip
            contentStyle={{
              background: color.bg2, border: `1px solid ${color.bd1}`,
              borderRadius: 8, fontFamily: SYS, fontSize: 12,
            }}
            labelStyle={{ color: color.t3, marginBottom: 4 }}
            itemStyle={{ color: color.t2 }}
            formatter={(v: number, name: string) => [
              `${v > 0 ? "+" : ""}${v}`,
              LINES.find(l => l.key === name)?.label ?? name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontFamily: MONO, fontSize: 10, color: color.t4, paddingTop: 8 }}
            formatter={(value) => LINES.find(l => l.key === value)?.label ?? value}
          />
          {LINES.map(({ key, col }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={col}
              strokeWidth={2}
              dot={{ fill: col, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: col }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
