"use client"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"
import { font, color } from "@/lib/theme"
import { seeded } from "@/lib/seeded"

const MONO = font.mono

interface ModelAccuracyProps {
  accuracy: number
  mape: number
}

function buildSyntheticData() {
  const base = 2160
  return Array.from({ length: 12 }, (_, i) => {
    const actual   = Math.round(base + (seeded(i) - 0.5) * 120 + i * 4)
    const offset   = (seeded(i + 12) - 0.5) * 0.08
    const forecast = Math.round(actual * (1 + offset))
    return { period: `P${i + 1}`, actual, forecast }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const actual   = payload.find((p: { name: string }) => p.name === "actual")?.value
  const forecast = payload.find((p: { name: string }) => p.name === "forecast")?.value
  return (
    <div style={{ background: color.bg3, border: `1px solid ${color.bd2}`, borderRadius: 10, padding: "8px 12px" }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, marginBottom: 4 }}>{label}</div>
      {actual   != null && <div style={{ fontFamily: MONO, fontSize: 12, color: color.amber, fontWeight: 600 }}>Actual: ${actual}M</div>}
      {forecast != null && <div style={{ fontFamily: MONO, fontSize: 12, color: color.blue,  fontWeight: 600 }}>Forecast: ${forecast}M</div>}
    </div>
  )
}

export function ModelAccuracy({ accuracy, mape }: ModelAccuracyProps) {
  if (accuracy == null || mape == null) {
    return (
      <div style={{ background: color.bg2, borderRadius: 16, padding: 24, border: `1px solid ${color.bd1}`, textAlign: "center", color: color.t4, fontFamily: MONO, fontSize: 13 }}>
        Loading model accuracy…
      </div>
    )
  }

  const data = buildSyntheticData()

  return (
    <div style={{ background: color.bg2, borderRadius: 16, padding: 20, border: `1px solid ${color.bd1}` }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.amber, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 14 }}>
        FORECAST vs ACTUAL — LAST 12 PERIODS
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke={color.bd1} strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tick={{ fontFamily: MONO, fontSize: 9, fill: color.t4 }}
            tickLine={false}
            axisLine={{ stroke: color.bd2 }}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontFamily: MONO, fontSize: 9, fill: color.t4 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `$${v}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="actual"
            name="actual"
            stroke={color.amber}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color.amber, stroke: color.bg3, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="forecast"
            stroke={color.blue}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 4, fill: color.blue, stroke: color.bg3, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 10, marginBottom: 14 }}>
        {[
          { col: color.amber, label: "Actual" },
          { col: color.blue,  label: "Forecast" },
        ].map(({ col, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 16, height: 2.5, background: col, borderRadius: 2 }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 24, borderTop: `1px solid ${color.bd1}`, paddingTop: 14 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", marginBottom: 4 }}>
            MODEL ACCURACY (LAST 12 MO)
          </div>
          <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: color.green }}>
            {accuracy.toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: color.t4, letterSpacing: "0.08em", marginBottom: 4 }}>
            MAPE
          </div>
          <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: color.amber }}>
            {mape.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  )
}
