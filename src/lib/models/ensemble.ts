/**
 * ForecastEngine Ensemble v2
 * ─────────────────────────────────────────────────────────────
 * Three-model accuracy-weighted ensemble:
 *   1. Holt-Winters DES (α=0.30 β=0.08)
 *   2. SARIMA(1,1,0)(0,1,0)[12]
 *   3. XGBoost Gradient Boosted Regression Trees
 *
 * Weights derived from in-sample MAPE. Lower MAPE = higher weight.
 * XGBoost falls back gracefully if insufficient data (<16 obs).
 */

import { hwForecast,        type HWResult     } from './holtwinters'
import { sarimaForecast,    type SARIMAResult  } from './sarima'
import { xgboostForecast,   type ForecastResult as XGBResult } from './xgboost'

export interface EnsemblePoint {
  base: number
  lo80: number
  hi80: number
  lo95: number
  hi95: number
}

export interface ModelResult {
  model:    string
  weight:   number
  mape:     number
  accuracy: number
  forecast: EnsemblePoint[]
}

export interface EnsembleResult {
  ensemble:  EnsemblePoint[]
  models:    ModelResult[]
  bestModel: string
  metrics: {
    accuracy:      number
    mape:          number
    hwWeight:      number
    sarimaWeight:  number
    xgboostWeight: number
    n:             number
    models:        number
  }
}

export function runEnsemble(
  vals:    number[],
  periods: number = 12,
): EnsembleResult | null {

  // ── Run all three models ────────────────────────────────────
  const hw     = hwForecast(vals, periods)
  const sarima = sarimaForecast(vals, periods)

  // XGBoost requires feature window — only run with sufficient data
  let xgb: XGBResult | null = null
  if (vals.length >= 20) {
    try {
      xgb = xgboostForecast(vals, periods)
    } catch (e) {
      console.warn('[ensemble] xgboost failed, skipping:', e)
    }
  }

  if (!hw && !sarima && !xgb) return null

  const models: ModelResult[] = []

  // ── Holt-Winters ─────────────────────────────────────────────
  if (hw) {
    models.push({
      model:    'holt-winters',
      weight:   0,
      mape:     hw.metrics.mape,
      accuracy: hw.metrics.accuracy,
      forecast: hw.forecast.map(p => ({
        base: p.base, lo80: p.lo80, hi80: p.hi80, lo95: p.lo95, hi95: p.hi95,
      })),
    })
  }

  // ── SARIMA ───────────────────────────────────────────────────
  if (sarima) {
    models.push({
      model:    'sarima',
      weight:   0,
      mape:     sarima.metrics.mape,
      accuracy: sarima.metrics.accuracy,
      forecast: sarima.forecast.map(p => ({
        base: p.base, lo80: p.lo80, hi80: p.hi80, lo95: p.lo95, hi95: p.hi95,
      })),
    })
  }

  // ── XGBoost ──────────────────────────────────────────────────
  if (xgb && xgb.forecasts.length > 0) {
    const xgbMape = xgb.mape > 0 ? xgb.mape : 5.0  // fallback if 0
    const xgbAcc  = Math.max(0, 100 - xgbMape)

    // Build confidence bounds from XGBoost lowerBound/upperBound
    const xgbForecast: EnsemblePoint[] = xgb.forecasts.map((base, i) => {
      const lo = xgb!.lowerBound[i] ?? base * 0.97
      const hi = xgb!.upperBound[i] ?? base * 1.03
      const mid80lo = base - (base - lo) * 0.6
      const mid80hi = base + (hi - base) * 0.6
      return {
        base: r1(base),
        lo80: r1(mid80lo),
        hi80: r1(mid80hi),
        lo95: r1(lo),
        hi95: r1(hi),
      }
    })

    models.push({
      model:    'xgboost',
      weight:   0,
      mape:     r2(xgbMape),
      accuracy: r1(xgbAcc),
      forecast: xgbForecast,
    })
  }

  // ── Compute accuracy-based weights (1/MAPE normalised) ───────
  const invMapes = models.map(m => m.mape > 0 ? 1 / m.mape : 10)
  const totalInv = invMapes.reduce((s, x) => s + x, 0)
  const weights  = invMapes.map(im => im / totalInv)

  models.forEach((m, i) => { m.weight = r2(weights[i]) })

  // ── Build weighted ensemble forecast ─────────────────────────
  const ensemble: EnsemblePoint[] = []

  for (let h = 0; h < periods; h++) {
    let wBase = 0, wLo80 = 0, wHi80 = 0, wLo95 = 0, wHi95 = 0

    models.forEach((m, i) => {
      const p = m.forecast[h]
      if (!p) return
      wBase += weights[i] * p.base
      wLo80 += weights[i] * p.lo80
      wHi80 += weights[i] * p.hi80
      wLo95 += weights[i] * p.lo95
      wHi95 += weights[i] * p.hi95
    })

    ensemble.push({
      base: r1(wBase),
      lo80: r1(wLo80),
      hi80: r1(wHi80),
      lo95: r1(wLo95),
      hi95: r1(wHi95),
    })
  }

  // ── Ensemble metrics ──────────────────────────────────────────
  const ensembleMape   = models.reduce((s, m, i) => s + weights[i] * m.mape, 0)
  const bestModel      = models.reduce((a, b) => a.mape < b.mape ? a : b).model
  const hwWeight       = models.find(m => m.model === 'holt-winters')?.weight ?? 0
  const sarimaWeight   = models.find(m => m.model === 'sarima')?.weight ?? 0
  const xgboostWeight  = models.find(m => m.model === 'xgboost')?.weight ?? 0
  const n              = hw?.metrics.n ?? sarima?.metrics.n ?? vals.length

  return {
    ensemble,
    models,
    bestModel,
    metrics: {
      accuracy:      r1(100 - ensembleMape),
      mape:          r2(ensembleMape),
      hwWeight:      r2(hwWeight),
      sarimaWeight:  r2(sarimaWeight),
      xgboostWeight: r2(xgboostWeight),
      n,
      models:        models.length,
    },
  }
}

// ── Chart series builder ────────────────────────────────────────
export interface ChartPoint {
  m:    string
  v:    number | null
  b:    number | null
  lo8:  number | null
  hi8:  number | null
  lo9:  number | null
  hi9:  number | null
}

export function buildChartSeries(
  histMonths: string[],
  histVals:   number[],
  fcstMonths: string[],
  result:     EnsembleResult | null,
): ChartPoint[] {
  const hist: ChartPoint[] = histMonths.map((m, i) => ({
    m, v: histVals[i], b: null, lo8: null, hi8: null, lo9: null, hi9: null,
  }))

  const lastV = histVals[histVals.length - 1]
  const bridge: ChartPoint = {
    m: histMonths[histMonths.length - 1],
    v: lastV, b: lastV, lo8: lastV, hi8: lastV, lo9: lastV, hi9: lastV,
  }

  const fcst: ChartPoint[] = result ? fcstMonths.map((m, i) => {
    const p = result.ensemble[i]
    return p
      ? { m, v: null, b: p.base, lo8: p.lo80, hi8: p.hi80, lo9: p.lo95, hi9: p.hi95 }
      : { m, v: null, b: null,   lo8: null,    hi8: null,    lo9: null,   hi9: null   }
  }) : []

  return [...hist, bridge, ...fcst]
}

// ── Helpers ───────────────────────────────────────────────────
function r1(x: number) { return Math.round(x * 10) / 10 }
function r2(x: number) { return Math.round(x * 100) / 100 }
