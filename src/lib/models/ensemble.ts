/**
 * ForecastEngine Ensemble
 * ─────────────────────────────────────────────────────────────
 * Combines Holt-Winters and SARIMA forecasts using accuracy-
 * weighted averaging. Weights are derived from each model's
 * in-sample MAPE — better models get higher weight.
 *
 * Future: add Prophet and XGBoost models to the ensemble.
 */

import { hwForecast,     type HWResult,     type HWPoint     } from './holtwinters'
import { sarimaForecast, type SARIMAResult, type SARIMAPoint } from './sarima'

export interface EnsemblePoint {
  base: number
  lo80: number
  hi80: number
  lo95: number
  hi95: number
}

export interface ModelResult {
  model:   string
  weight:  number
  mape:    number
  accuracy: number
  forecast: EnsemblePoint[]
}

export interface EnsembleResult {
  ensemble:  EnsemblePoint[]
  models:    ModelResult[]
  bestModel: string
  metrics: {
    accuracy:    number
    mape:        number
    hwWeight:    number
    sarimaWeight: number
    n:           number
  }
}

export function runEnsemble(
  vals:    number[],
  periods: number = 12,
): EnsembleResult | null {
  const hw     = hwForecast(vals, periods)
  const sarima = sarimaForecast(vals, periods)

  if (!hw && !sarima) return null

  const models: ModelResult[] = []

  if (hw) {
    models.push({
      model:    'holt-winters',
      weight:   0,           // computed below
      mape:     hw.metrics.mape,
      accuracy: hw.metrics.accuracy,
      forecast: hw.forecast.map(p => ({ base:p.base, lo80:p.lo80, hi80:p.hi80, lo95:p.lo95, hi95:p.hi95 })),
    })
  }

  if (sarima) {
    models.push({
      model:    'sarima',
      weight:   0,
      mape:     sarima.metrics.mape,
      accuracy: sarima.metrics.accuracy,
      forecast: sarima.forecast.map(p => ({ base:p.base, lo80:p.lo80, hi80:p.hi80, lo95:p.lo95, hi95:p.hi95 })),
    })
  }

  // ── Compute accuracy-based weights ────────────────────────
  // Weight = 1/MAPE  (lower MAPE = higher weight)
  const invMapes  = models.map(m => m.mape > 0 ? 1 / m.mape : 10)
  const totalInv  = invMapes.reduce((s, x) => s + x, 0)
  const weights   = invMapes.map(im => im / totalInv)

  models.forEach((m, i) => { m.weight = Math.round(weights[i] * 100) / 100 })

  // ── Build ensemble forecast ────────────────────────────────
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

  // ── Ensemble accuracy (weighted average MAPE) ─────────────
  const ensembleMape = models.reduce((s, m, i) => s + weights[i] * m.mape, 0)
  const bestModel    = models.reduce((a, b) => a.mape < b.mape ? a : b).model
  const hwWeight     = models.find(m => m.model === 'holt-winters')?.weight || 0
  const sarimaWeight = models.find(m => m.model === 'sarima')?.weight || 0
  const n            = hw?.metrics.n || sarima?.metrics.n || 0

  return {
    ensemble,
    models,
    bestModel,
    metrics: {
      accuracy:     r1(100 - ensembleMape),
      mape:         r2(ensembleMape),
      hwWeight:     r2(hwWeight),
      sarimaWeight: r2(sarimaWeight),
      n,
    },
  }
}

// ── Build Recharts-ready data series ───────────────────────────
export interface ChartPoint {
  m:    string
  v:    number | null   // historical value
  b:    number | null   // forecast base
  lo8:  number | null   // 80% lower
  hi8:  number | null   // 80% upper
  lo9:  number | null   // 95% lower
  hi9:  number | null   // 95% upper
}

export function buildChartSeries(
  histMonths:  string[],
  histVals:    number[],
  fcstMonths:  string[],
  result:      EnsembleResult | null,
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
    return p ? { m, v: null, b: p.base, lo8: p.lo80, hi8: p.hi80, lo9: p.lo95, hi9: p.hi95 }
             : { m, v: null, b: null, lo8: null, hi8: null, lo9: null, hi9: null }
  }) : []

  return [...hist, bridge, ...fcst]
}

// ── helpers ──────────────────────────────────────────────────
function r1(x: number) { return Math.round(x * 10) / 10 }
function r2(x: number) { return Math.round(x * 100) / 100 }
