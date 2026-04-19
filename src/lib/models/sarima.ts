/**
 * SARIMA(1,1,0)(0,1,0)[12]
 * ─────────────────────────────────────────────────────────────
 * Seasonal AutoRegressive Integrated Moving Average
 * Best suited for monthly construction series with annual seasonality
 *
 * Model order chosen:
 *   p=1  — AR(1) captures first-order autocorrelation
 *   d=1  — first difference removes stochastic trend
 *   q=0  — no explicit MA term (kept simple for robustness)
 *   P=0  — seasonal AR handled via seasonal differencing
 *   D=1  — seasonal difference removes annual cycle (lag-12)
 *   Q=0  — no seasonal MA
 *   s=12 — monthly seasonality
 *
 * Reference: Box, Jenkins & Reinsel (2015) — §9.2
 */

export interface SARIMAPoint {
  base: number
  lo80: number
  hi80: number
  lo95: number
  hi95: number
}

export interface SARIMAResult {
  forecast: SARIMAPoint[]
  metrics: {
    phi:      number      // AR(1) coefficient
    sigma:    number      // residual std dev (differenced scale)
    mape:     number      // in-sample MAPE (undifferenced scale)
    accuracy: number      // 100 - mape/2 approximation
    n:        number      // training observations
  }
}

export function sarimaForecast(
  vals:    number[],
  periods: number = 12,
): SARIMAResult | null {
  if (!vals || vals.length < 18) return null
  const v = vals.filter(x => x != null && !isNaN(x))
  const n = v.length
  if (n < 18) return null

  // ── Step 1: Seasonal differencing  ∇_12 y_t = y_t - y_{t-12} ──
  const sdiff: number[] = []
  for (let i = 12; i < n; i++) sdiff.push(v[i] - v[i - 12])

  // ── Step 2: First-order differencing  ∇ z_t = z_t - z_{t-1} ───
  const diff: number[] = []
  for (let i = 1; i < sdiff.length; i++) diff.push(sdiff[i] - sdiff[i - 1])

  const m = diff.length
  if (m < 6) return null

  // ── Step 3: Fit AR(1) via OLS ───────────────────────────────────
  const y = diff.slice(1)
  const x = diff.slice(0, -1)
  const ny = y.length

  const xBar = x.reduce((s, xi) => s + xi, 0) / ny
  const yBar = y.reduce((s, yi) => s + yi, 0) / ny

  let covXY = 0, varX = 0
  for (let i = 0; i < ny; i++) {
    covXY += (x[i] - xBar) * (y[i] - yBar)
    varX  += (x[i] - xBar) ** 2
  }
  const phi = varX > 1e-10 ? Math.max(-0.99, Math.min(0.99, covXY / varX)) : 0

  // ── Step 4: Residuals + variance ────────────────────────────────
  const residuals = y.map((yi, i) => yi - phi * x[i])
  const sigma2 = residuals.reduce((s, r) => s + r * r, 0) / ny
  const sigma  = Math.sqrt(sigma2)

  // In-sample MAPE on original scale (undoing the differencing)
  const vHat = reconstructFromDiff(diff.map((d, i) => (i < ny ? phi * (i > 0 ? diff[i-1] : 0) : 0)), v, 12)
  const mape = v.slice(14).reduce((s, vi, i) => {
    const idx = 14 + i
    if (idx >= vHat.length || vi === 0) return s
    return s + Math.abs((vi - vHat[idx]) / vi)
  }, 0) / Math.max(1, v.length - 14) * 100

  // ── Step 5: Multi-step forecast ─────────────────────────────────
  // Maintain extended arrays for back-transformation
  const vExt      = [...v]
  const sdiffExt  = [...sdiff]
  let   lastDiff  = diff[diff.length - 1]

  const forecast: SARIMAPoint[] = []

  for (let h = 1; h <= periods; h++) {
    // AR(1) prediction on doubly-differenced series
    const nextDiff = phi * lastDiff

    // Undo first difference: add to previous seasonal-differenced value
    const nextSD = sdiffExt[sdiffExt.length - 1] + nextDiff
    sdiffExt.push(nextSD)

    // Undo seasonal difference: add the seasonal-diff to the value 12 steps back
    const idx12  = vExt.length - 12
    const nextV  = idx12 >= 0 ? vExt[idx12] + nextSD : nextSD
    vExt.push(nextV)

    // Forecast uncertainty — variance grows with horizon
    // For doubly-differenced series the multi-step variance is approximately:
    //   Var(h) ≈ σ² * [ Σ_{j=0}^{h-1} ψ_j² ]  where ψ_j are the MA(∞) coefficients
    // Approximation: σ_h ≈ σ * sqrt(h) * scale_factor
    // The scale_factor accounts for double-differencing amplification
    const scaledSigma  = Math.abs(nextV) * (sigma / Math.abs(v[v.length - 1] || 1))
    const expandedSe   = scaledSigma * Math.sqrt(h)
    const practicalSe  = Math.max(expandedSe, sigma * 1.5 * Math.sqrt(h))

    forecast.push({
      base: r1(nextV),
      lo80: r1(nextV - 1.282 * practicalSe),
      hi80: r1(nextV + 1.282 * practicalSe),
      lo95: r1(nextV - 1.960 * practicalSe),
      hi95: r1(nextV + 1.960 * practicalSe),
    })

    lastDiff = nextDiff
  }

  return {
    forecast,
    metrics: {
      phi:      r2(phi),
      sigma:    r1(sigma),
      mape:     r2(Math.max(0, mape)),
      accuracy: Math.max(50, r1(100 - mape * 0.5)),
      n,
    },
  }
}

// ── Helpers ──────────────────────────────────────────────────

/** Approximate reconstruction — for in-sample MAPE only */
function reconstructFromDiff(diffFitted: number[], orig: number[], s: number): number[] {
  const result = [...orig.slice(0, s + 2)]
  for (let i = s + 2; i < orig.length; i++) {
    const sd  = (result[i - s] !== undefined ? result[i - s] : orig[i - s])
    result.push(sd + diffFitted[i - s - 2] || orig[i])
  }
  return result
}

function r1(x: number) { return Math.round(x * 10) / 10 }
function r2(x: number) { return Math.round(x * 100) / 100 }
