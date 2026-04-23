export type VerdictOverall    = 'EXPAND' | 'HOLD' | 'CONTRACT'
export type VerdictConfidence = 'HIGH'   | 'MEDIUM' | 'LOW'

export interface VerdictInputs {
  /** Forecast: % change from last history point to last ensemble point. null = unavailable. */
  forecastPct:   number | null
  /** Permits: year-over-year % change. null = unavailable. */
  permitYoy:     number | null
  /** CSHI score (0-100). null = unavailable. */
  cshiScore:     number | null
  /** WARN Act notices in last 30 days. */
  warnCount:     number
  /** Whether the WARN API responded (needed to distinguish "0 notices" from "API unavailable"). */
  warnAvailable: boolean
  /** Number of demand-driven MSAs from satellite data. */
  demandMsas:    number
  /** Number of low-activity MSAs from satellite data. */
  lowActMsas:    number
  /** Recession probability as a fraction (0–1). null = unavailable. */
  recessionProb: number | null
}

export interface VerdictResult {
  score:       number
  directional: number
  overall:     VerdictOverall
  confidence:  VerdictConfidence
}

/** Classify a numeric score into EXPAND / HOLD / CONTRACT. */
export function classifyScore(score: number): VerdictOverall {
  if (score >= 3)  return 'EXPAND'
  if (score <= -3) return 'CONTRACT'
  return 'HOLD'
}

/** Classify a directional signal count into HIGH / MEDIUM / LOW confidence. */
export function classifyConfidence(directional: number): VerdictConfidence {
  if (directional >= 5) return 'HIGH'
  if (directional >= 3) return 'MEDIUM'
  return 'LOW'
}

/**
 * Pure scoring function — mirrors the signal accumulation logic in
 * /api/verdict/route.ts. Accepts pre-computed signal values and returns
 * the verdict classification without any I/O.
 */
export function scoreVerdict(inputs: VerdictInputs): VerdictResult {
  let score = 0
  let directional = 0

  // 1. Forecast direction (+2 / -2 / 0)
  if (inputs.forecastPct !== null) {
    if (inputs.forecastPct > 2)       { score += 2; directional++ }
    else if (inputs.forecastPct < -2) { score -= 2; directional++ }
  }

  // 2. Permits YoY (+1 / -1 / 0)
  if (inputs.permitYoy !== null) {
    if (inputs.permitYoy > 1)        { score += 1; directional++ }
    else if (inputs.permitYoy < -1)  { score -= 1; directional++ }
  }

  // 3. CSHI / LICS (+2 / -2 / 0)
  if (inputs.cshiScore !== null) {
    if (inputs.cshiScore > 60)       { score += 2; directional++ }
    else if (inputs.cshiScore < 40)  { score -= 2; directional++ }
  }

  // 4. WARN Act filings (+1 / -1 / 0)
  if (inputs.warnCount > 20) {
    score -= 1; directional++
  } else if (inputs.warnCount < 5 && inputs.warnAvailable) {
    score += 1; directional++
  }

  // 5. Satellite (+1 / -1 / 0)
  if (inputs.demandMsas > 3)      { score += 1; directional++ }
  else if (inputs.lowActMsas > 3) { score -= 1; directional++ }

  // 6. Recession probability (+1 / -2 / 0)
  if (inputs.recessionProb !== null) {
    if (inputs.recessionProb > 0.40)       { score -= 2; directional++ }
    else if (inputs.recessionProb < 0.20)  { score += 1; directional++ }
  }

  return {
    score,
    directional,
    overall:    classifyScore(score),
    confidence: classifyConfidence(directional),
  }
}
