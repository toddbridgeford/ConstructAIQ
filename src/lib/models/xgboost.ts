/**
 * ConstructAIQ XGBoost-style Gradient Boosting
 * Gradient boosted regression trees for construction time series
 * Uses L2 loss, Newton boosting, and regularized leaf weights
 */

interface GBNode {
  isLeaf:    boolean
  splitFeature?: number
  splitValue?: number
  left?:     GBNode
  right?:    GBNode
  weight?:   number
}

interface GBTree {
  root: GBNode
}

interface XGBConfig {
  nEstimators?:   number   // Number of boosting rounds (default: 100)
  maxDepth?:      number   // Max tree depth (default: 6)
  learningRate?:  number   // Shrinkage factor (default: 0.1)
  subsample?:     number   // Row subsampling ratio (default: 0.8)
  colsample?:     number   // Feature subsampling ratio (default: 0.8)
  lambda?:        number   // L2 regularization (default: 1.0)
  gamma?:         number   // Min split gain (default: 0.0)
  minChildWeight?: number  // Min sum of hessians in child (default: 1)
}

interface ForecastResult {
  forecasts:  number[]
  dates:      string[]
  lowerBound: number[]
  upperBound: number[]
  model:      string
  rmse:       number
  mape:       number
}

// ── Feature engineering for time series ───────────────────────────────────────
function buildFeatures(series: number[], lookback = 12): number[][] {
  const X: number[][] = []
  for (let i = lookback; i < series.length; i++) {
    const features: number[] = []
    // Lag features
    for (let lag = 1; lag <= lookback; lag++) {
      features.push(series[i - lag])
    }
    // Rolling statistics
    const window3  = series.slice(i - 3,  i)
    const window6  = series.slice(i - 6,  i)
    const window12 = series.slice(i - 12, i)
    features.push(mean(window3))
    features.push(mean(window6))
    features.push(mean(window12))
    features.push(std(window3))
    features.push(std(window12))
    // Trend features
    features.push(series[i - 1] - series[i - 2])       // MoM change
    features.push(series[i - 1] - series[i - 12])      // YoY change
    // Seasonal index (month position approximate)
    features.push(Math.sin(2 * Math.PI * (i % 12) / 12))
    features.push(Math.cos(2 * Math.PI * (i % 12) / 12))
    X.push(features)
  }
  return X
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function std(arr: number[]): number {
  const m = mean(arr)
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length)
}

// ── Decision tree node fitting ─────────────────────────────────────────────────
function fitTree(
  X: number[][], gradients: number[], hessians: number[],
  depth: number, config: Required<XGBConfig>
): GBNode {
  const n = X.length
  const sumG = gradients.reduce((a, b) => a + b, 0)
  const sumH = hessians.reduce((a, b) => a + b, 0)

  // Leaf weight: -G / (H + lambda)
  const leafWeight = -sumG / (sumH + config.lambda)

  if (depth === 0 || n < config.minChildWeight * 2) {
    return { isLeaf: true, weight: leafWeight }
  }

  const nFeatures = X[0].length
  let bestGain = config.gamma
  let bestFeature = -1
  let bestValue = 0
  let bestLeftIdx: number[] = []
  let bestRightIdx: number[] = []

  // Feature subsampling
  const featureMask = Array.from({ length: nFeatures }, (_, i) => i)
    .filter(() => Math.random() < config.colsample)

  for (const f of featureMask) {
    const values = [...new Set(X.map(x => x[f]))].sort((a, b) => a - b)
    const thresholds = values.slice(0, -1).map((v, i) => (v + values[i + 1]) / 2)

    for (const threshold of thresholds.slice(0, 32)) { // max 32 splits
      const leftIdx  = X.map((_, i) => i).filter(i => X[i][f] <= threshold)
      const rightIdx = X.map((_, i) => i).filter(i => X[i][f] >  threshold)

      if (leftIdx.length < config.minChildWeight || rightIdx.length < config.minChildWeight) continue

      const gL = leftIdx.reduce((s, i) => s + gradients[i], 0)
      const hL = leftIdx.reduce((s, i) => s + hessians[i], 0)
      const gR = rightIdx.reduce((s, i) => s + gradients[i], 0)
      const hR = rightIdx.reduce((s, i) => s + hessians[i], 0)

      const gain = 0.5 * (gL*gL/(hL+config.lambda) + gR*gR/(hR+config.lambda) - sumG*sumG/(sumH+config.lambda))

      if (gain > bestGain) {
        bestGain = gain
        bestFeature = f
        bestValue = threshold
        bestLeftIdx = leftIdx
        bestRightIdx = rightIdx
      }
    }
  }

  if (bestFeature === -1) {
    return { isLeaf: true, weight: leafWeight }
  }

  // Row subsampling for children
  const leftX   = bestLeftIdx.map(i => X[i])
  const leftG   = bestLeftIdx.map(i => gradients[i])
  const leftH   = bestLeftIdx.map(i => hessians[i])
  const rightX  = bestRightIdx.map(i => X[i])
  const rightG  = bestRightIdx.map(i => gradients[i])
  const rightH  = bestRightIdx.map(i => hessians[i])

  return {
    isLeaf:       false,
    splitFeature: bestFeature,
    splitValue:   bestValue,
    left:         fitTree(leftX,  leftG,  leftH,  depth - 1, config),
    right:        fitTree(rightX, rightG, rightH, depth - 1, config),
    weight:       leafWeight,
  }
}

function predictNode(node: GBNode, x: number[]): number {
  if (node.isLeaf || !node.splitFeature === undefined) return node.weight || 0
  if (x[node.splitFeature!] <= node.splitValue!) {
    return predictNode(node.left!, x)
  }
  return predictNode(node.right!, x)
}

// ── XGBoost model class ────────────────────────────────────────────────────────
export class XGBoost {
  private trees:     GBTree[] = []
  private basePred:  number   = 0
  private config:    Required<XGBConfig>

  constructor(config: XGBConfig = {}) {
    this.config = {
      nEstimators:    config.nEstimators   ?? 80,
      maxDepth:       config.maxDepth      ?? 4,
      learningRate:   config.learningRate  ?? 0.1,
      subsample:      config.subsample     ?? 0.8,
      colsample:      config.colsample     ?? 0.8,
      lambda:         config.lambda        ?? 1.0,
      gamma:          config.gamma         ?? 0.0,
      minChildWeight: config.minChildWeight ?? 1,
    }
  }

  fit(X: number[][], y: number[]): void {
    this.basePred = mean(y)
    let preds = new Array(y.length).fill(this.basePred)

    for (let t = 0; t < this.config.nEstimators; t++) {
      // L2 loss: gradient = pred - actual, hessian = 1
      const gradients = preds.map((p, i) => p - y[i])
      const hessians  = preds.map(() => 1.0)

      // Row subsampling
      const sampleIdx = Array.from({ length: X.length }, (_, i) => i)
        .filter(() => Math.random() < this.config.subsample)

      const sampledX = sampleIdx.map(i => X[i])
      const sampledG = sampleIdx.map(i => gradients[i])
      const sampledH = sampleIdx.map(i => hessians[i])

      const tree = fitTree(sampledX, sampledG, sampledH, this.config.maxDepth, this.config)
      this.trees.push({ root: tree })

      // Update predictions
      for (let i = 0; i < X.length; i++) {
        preds[i] += this.config.learningRate * predictNode(tree, X[i])
      }
    }
  }

  predict(X: number[][]): number[] {
    return X.map(x => {
      let pred = this.basePred
      for (const tree of this.trees) {
        pred += this.config.learningRate * predictNode(tree.root, x)
      }
      return pred
    })
  }
}

// ── Main forecast function ────────────────────────────────────────────────────
export function xgboostForecast(
  series: number[],
  periods: number = 12,
  dates?: string[]
): ForecastResult {
  const lookback = Math.min(12, Math.floor(series.length / 3))

  if (series.length < lookback + 4) {
    // Insufficient data — return trend extrapolation
    const trend = (series[series.length - 1] - series[0]) / series.length
    const forecasts = Array.from({ length: periods }, (_, i) => series[series.length - 1] + trend * (i + 1))
    return {
      forecasts, dates: generateDates(dates, periods),
      lowerBound: forecasts.map(v => v * 0.95),
      upperBound: forecasts.map(v => v * 1.05),
      model: 'xgboost-trend-fallback', rmse: 0, mape: 0,
    }
  }

  const X = buildFeatures(series, lookback)
  const y = series.slice(lookback)

  // Train/validation split (last 20% for validation)
  const splitIdx = Math.floor(X.length * 0.8)
  const XTrain = X.slice(0, splitIdx)
  const yTrain = y.slice(0, splitIdx)
  const XVal   = X.slice(splitIdx)
  const yVal   = y.slice(splitIdx)

  const model = new XGBoost({
    nEstimators: 60, maxDepth: 3, learningRate: 0.1,
    subsample: 0.8, colsample: 0.8, lambda: 1.0,
  })
  model.fit(XTrain, yTrain)

  // Compute validation metrics
  const valPreds = model.predict(XVal)
  const rmse = Math.sqrt(valPreds.reduce((s, p, i) => s + (p - yVal[i]) ** 2, 0) / valPreds.length)
  const mape = valPreds.reduce((s, p, i) => s + Math.abs((p - yVal[i]) / (yVal[i] || 1)), 0) / valPreds.length * 100

  // Generate multi-step forecasts (recursive)
  const history = [...series]
  const forecasts: number[] = []

  for (let step = 0; step < periods; step++) {
    const feats = buildFeatures(history, lookback)
    if (feats.length === 0) {
      forecasts.push(history[history.length - 1])
    } else {
      const lastFeat = feats[feats.length - 1]
      const pred = model.predict([lastFeat])[0]
      forecasts.push(pred)
      history.push(pred)
    }
  }

  // Uncertainty bounds based on validation RMSE
  const confFactor = 1.96
  const lowerBound = forecasts.map((v, i) => v - confFactor * rmse * Math.sqrt(i + 1))
  const upperBound = forecasts.map((v, i) => v + confFactor * rmse * Math.sqrt(i + 1))

  return {
    forecasts, dates: generateDates(dates, periods),
    lowerBound, upperBound,
    model: 'xgboost-gbrt',
    rmse:  parseFloat(rmse.toFixed(2)),
    mape:  parseFloat(mape.toFixed(2)),
  }
}

function generateDates(existingDates: string[] | undefined, periods: number): string[] {
  const lastDate = existingDates?.[existingDates.length - 1]
  const base = lastDate ? new Date(lastDate) : new Date()
  return Array.from({ length: periods }, (_, i) => {
    const d = new Date(base)
    d.setMonth(d.getMonth() + i + 1)
    return d.toISOString().slice(0, 7)
  })
}
