import { describe, test, expect } from 'vitest'
import { runEnsemble } from '../ensemble'

// 24-month construction spending series (realistic TTLCONS values in $B)
const SERIES_24 = [
  2150.8, 2153.4, 2149.1, 2160.7, 2168.5, 2177.2,
  2169.5, 2167.9, 2181.2, 2197.6, 2190.4, 2184.6,
  2174.9, 2206.5, 2215.4, 2199.8, 2200.7, 2205.3,
  2197.9, 2197.1, 2192.9, 2176.6, 2169.6, 2165.4,
]

const SERIES_SHORT = [100, 102, 101]

describe('runEnsemble', () => {
  test('returns null for insufficient data', () => {
    expect(runEnsemble(SERIES_SHORT, 12)).toBeNull()
  })

  test('produces 12 forecast points', () => {
    const r = runEnsemble(SERIES_24, 12)
    expect(r).not.toBeNull()
    expect(r!.ensemble).toHaveLength(12)
  })

  test('confidence intervals are correctly ordered', () => {
    const r = runEnsemble(SERIES_24, 12)
    for (const p of r!.ensemble) {
      expect(p.lo95).toBeLessThanOrEqual(p.lo80)
      expect(p.lo80).toBeLessThanOrEqual(p.base)
      expect(p.base).toBeLessThanOrEqual(p.hi80)
      expect(p.hi80).toBeLessThanOrEqual(p.hi95)
    }
  })

  test('model weights sum to approximately 1', () => {
    const r = runEnsemble(SERIES_24, 12)
    // Weights are stored rounded to 2 decimal places, so sum may differ by ±0.02
    const total = r!.metrics.hwWeight + r!.metrics.sarimaWeight + r!.metrics.xgboostWeight
    expect(total).toBeGreaterThanOrEqual(0.97)
    expect(total).toBeLessThanOrEqual(1.03)
  })

  test('base values are finite and in a reasonable range', () => {
    const r = runEnsemble(SERIES_24, 12)
    const last = SERIES_24[SERIES_24.length - 1]
    for (const p of r!.ensemble) {
      expect(Number.isFinite(p.base)).toBe(true)
      // Forecast should stay within ±30% of last known value
      expect(p.base).toBeGreaterThan(last * 0.7)
      expect(p.base).toBeLessThan(last * 1.3)
    }
  })

  test('reports at least one model', () => {
    const r = runEnsemble(SERIES_24, 12)
    expect(r!.models.length).toBeGreaterThanOrEqual(1)
  })

  test('custom periods parameter is respected', () => {
    const r = runEnsemble(SERIES_24, 6)
    expect(r!.ensemble).toHaveLength(6)
  })
})
