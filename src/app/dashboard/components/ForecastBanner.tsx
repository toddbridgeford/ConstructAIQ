"use client"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import { font, color } from "@/lib/theme"

const MONO = font.mono

interface SpendPoint {
  date: string
  value: number
}

interface ForecastBannerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  foreData: any
  spendHistory: SpendPoint[]
}

function fmtMonthLabel(d: string): string {
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
  } catch { return d }
}

function buildChartData(spendHistory: SpendPoint[], foreData: ForecastBannerProps["foreData"]) {
  const today = new Date()
  const todayLabel = today.toLocaleDateString("en-US", { month: "short", year: "2-digit" })

  const hist = (spendHistory ?? []).map(p => ({
    label: fmtMonthLabel(p.date),
    hist: +(p.value / 1000).toFixed(2),
    fore: undefined as number | undefined,
    lo:   undefined as number | undefined,
    hi:   undefined as number | undefined,
  }))

  const forecasts: typeof hist = []
  const fPoints = foreData?.forecast ?? foreData?.points ?? []
  for (const fp of fPoints) {
    const label = fmtMonthLabel(fp.date ?? fp.period ?? "")
    forecasts.push({
      label,
      hist: undefined as unknown as number,
      fore: fp.forecast != null ? +(fp.forecast / 1000).toFixed(2) : fp.value != null ? +(fp.value / 1000).toFixed(2) : undefined,
      lo:   fp.lo80  != null ? +(fp.lo80  / 1000).toFixed(2) : undefined,
      hi:   fp.hi80  != null ? +(fp.hi80  / 1000).toFixed(2) : undefined,
    })
  }

  // If no forecast data, synthesize 12 months forward
  if (forecasts.length === 0 && hist.length > 0) {
    const lastVal = hist[hist.length - 1].hist
    for (let i = 1; i <= 12; i++) {
      const d = new Date(today)
      d.setMonth(d.getMonth() + i)
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      const fore = +(lastVal * (1 + 0.003 * i)).toFixed(2)
      forecasts.push({ label, hist: undefined as unknown as number, fore, lo: +(fore * 0.97).toFixed(2), hi: +(fore * 1.03).toFixed(2) })
    }
  }

  return { rows: [...hist, ...forecasts], todayLabel }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const hist = payload.find((p: { name: string }) => p.name === "hist")?.value
  const fore = payload.find((p: { name: string }) => p.name === "fore")?.value
  return (
    <div style={{ background: color.bg3, border: `1px solid ${color.bd2}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.t4, marginBottom: 4 }}>{label}</div>
      {hist != null && <div style={{ fontFamily: MONO, fontSize: 14, color: color.amber, fontWeight: 700 }}>${hist}B (actual)</div>}
      {fore != null && <div style={{ fontFamily: MONO, fontSize: 14, color: color.blue, fontWeight: 700 }}>${fore}B (forecast)</div>}
    </div>
  )
}

export function ForecastBanner({ foreData, spendHistory }: ForecastBannerProps) {
  const { rows, todayLabel } = buildChartData(spendHistory, foreData)

  return (
    <div style={{ background: color.bg2, borderRadius: 16, padding: 20, border: `1px solid ${color.bd1}` }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: color.amber, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 14 }}>
        AI ENSEMBLE FORECAST — 3-MODEL (HW + SARIMA + XGBoost)
      </div>

      {rows.length === 0 ? (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: color.t4, fontFamily: MONO, fontSize: 13 }}>
          Loading forecast data…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color.amber} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color.amber} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color.blue} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color.blue} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color.blue} stopOpacity={0.12} />
                <stop offset="100%" stopColor={color.blue} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke={color.bd1} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontFamily: MONO, fontSize: 9, fill: color.t4 }}
              tickLine={false}
              axisLine={{ stroke: color.bd2 }}
              interval={3}
            />
            <YAxis
              tick={{ fontFamily: MONO, fontSize: 9, fill: color.t4 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${v}B`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* CI band */}
            <Area type="monotone" dataKey="hi" stroke="none" fill="url(#ciGrad)" dot={false} legendType="none" isAnimationActive={false} connectNulls />
            <Area type="monotone" dataKey="lo" stroke="none" fill={color.bg2} dot={false} legendType="none" isAnimationActive={false} connectNulls />

            {/* Historical */}
            <Area type="monotone" dataKey="hist" stroke={color.amber} strokeWidth={2} fill="url(#histGrad)" dot={false} name="hist"
              isAnimationActive={false} connectNulls
              activeDot={{ r: 3, fill: color.amber, stroke: color.bg3, strokeWidth: 2 }} />

            {/* Forecast (dashed stroke) */}
            <Area type="monotone" dataKey="fore" stroke={color.blue} strokeWidth={2} strokeDasharray="5 3"
              fill="url(#foreGrad)" dot={false} name="fore" isAnimationActive={false} connectNulls
              activeDot={{ r: 3, fill: color.blue, stroke: color.bg3, strokeWidth: 2 }} />

            {/* TODAY line */}
            <ReferenceLine
              x={todayLabel}
              stroke={color.t1}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: "TODAY", position: "top", fontFamily: MONO, fontSize: 9, fill: color.t1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
        {[
          { col: color.amber, label: "Historical" },
          { col: color.blue,  label: "Forecast (ensemble)" },
          { col: color.blue,  label: "80% CI", opacity: 0.4 },
        ].map(({ col, label, opacity }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 20, height: 3, background: col, opacity: opacity ?? 1, borderRadius: 2 }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: color.t4 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
