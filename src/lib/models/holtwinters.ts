/**
 * Holt-Winters Double Exponential Smoothing
 * Trend model with expanding confidence intervals
 * Deployed on all 4 primary construction series
 */

export interface HWPoint {
  base: number
  lo80: number
  hi80: number
  lo95: number
  hi95: number
}

export interface HWResult {
  fitted:      number[]
  forecast:    HWPoint[]
  finalLevel:  number
  finalTrend:  number
  metrics: {
    accuracy: number
    mape:     number
    mae:      number
    se:       number
    n:        number
  }
}

export function hwForecast(
  vals:    number[],
  periods: number  = 12,
  alpha:   number  = 0.30,
  beta:    number  = 0.08,
): HWResult | null {
  if (!vals || vals.length < 4) return null
  const v = vals.filter(x => x != null && !isNaN(x))
  const n = v.length
  if (n < 4) return null

  // Initialize level and trend
  let level = v[0]
  let trend = (v[Math.min(5, n - 1)] - v[0]) / Math.min(5, n - 1)
  const fitted: number[] = [v[0]]

  // Forward pass
  for (let i = 1; i < n; i++) {
    const prevL = level
    level = alpha * v[i] + (1 - alpha) * (level + trend)
    trend = beta  * (level - prevL) + (1 - beta) * trend
    fitted.push(level + trend)
  }

  // Residual statistics
  const residuals = v.map((x, i) => x - fitted[i])
  const se   = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n)
  const mae  = residuals.reduce((s, r) => s + Math.abs(r), 0) / n
  const mape = v.reduce((s, x, i) => s + Math.abs((x - fitted[i]) / x), 0) / n * 100

  // Generate forecast with expanding CI
  const forecast: HWPoint[] = []
  for (let h = 1; h <= periods; h++) {
    const f    = level + h * trend
    const se_h = se * Math.sqrt(1 + alpha * alpha * h)
    forecast.push({
      base: round(f),
      lo80: round(f - 1.282 * se_h),
      hi80: round(f + 1.282 * se_h),
      lo95: round(f - 1.960 * se_h),
      hi95: round(f + 1.960 * se_h),
    })
  }

  return {
    fitted,
    forecast,
    finalLevel: level,
    finalTrend: trend,
    metrics: {
      accuracy: Math.max(50, round(100 - mape)),
      mape:     round2(mape),
      mae:      round(mae),
      se:       round(se),
      n,
    },
  }
}

// ── helpers ──────────────────────────────────────────────────
function round(x: number)  { return Math.round(x * 10) / 10 }
function round2(x: number) { return Math.round(x * 100) / 100 }
