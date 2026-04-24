import { describe, it, expect } from 'vitest'
import { normalizeDashboardData } from '../dashboard-schema'

// ── fixture helpers ───────────────────────────────────────────────────────────

const OBS_ROW = { date: '2026-01-01', value: 100 }

function validPayload() {
  return {
    construction_spending: { value: 2190.4, mom_change: 0.12, data_as_of: '2026-01-01', spark: [2180, 2185, 2190] },
    employment:            { value: 8363,   mom_change: 0.4,  data_as_of: '2026-01-01' },
    permits:               { value: 1376,   mom_change: -0.7, data_as_of: '2026-01-01', spark: [1380, 1376] },
    cshi: {
      score: 62, classification: 'NEUTRAL', classColor: '#f5a623', weeklyChange: 1.2,
      subScores: { spendGrowth: { score: 65, weight: 0.25, label: 'Spend Growth' } },
      history: [{ week: '2026-01-05', score: 60, classification: 'NEUTRAL' }],
      momentumLine: [{ week: '2026-01-05', momentum: 0.5 }],
      updatedAt: '2026-01-05T00:00:00Z',
    },
    forecast: {
      ensemble:   [{ base: 2200, lo80: 2150, hi80: 2250, lo95: 2120, hi95: 2280 }],
      models:     [{ model: 'ensemble', weight: 1, mape: 2.1, accuracy: 92 }],
      metrics:    { accuracy: 92, mape: 2.1, models: 3 },
      history:    [2180, 2185, 2190],
      run_at:     '2026-01-05T00:00:00Z',
      trained_on: 60,
    },
    signals:    [{ type: 'zscore', title: 'Spike', description: 'desc', confidence: 0.9 }],
    commodities:[{ name: 'Lumber', value: 450, unit: 'MBF', signal: 'BUY' }],
    brief_excerpt: 'Brief text.',
    brief_as_of:   '2026-01-05T00:00:00Z',
    obs: {
      TTLCONS_12:       [OBS_ROW],
      CES2000000001_12: [OBS_ROW],
      PERMIT_12:        [OBS_ROW],
      TTLCONS_24:       [OBS_ROW],
      WPS081_24:        [OBS_ROW],
    },
    fetched_at: '2026-01-05T00:00:00Z',
  }
}

// ── null / non-object inputs ──────────────────────────────────────────────────

describe('normalizeDashboardData — degenerate inputs', () => {
  it('returns null for null', () => {
    expect(normalizeDashboardData(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(normalizeDashboardData(undefined)).toBeNull()
  })

  it('returns null for a string', () => {
    expect(normalizeDashboardData('{"value":1}')).toBeNull()
  })

  it('returns null for an array', () => {
    expect(normalizeDashboardData([])).toBeNull()
  })

  it('returns null for a number', () => {
    expect(normalizeDashboardData(42)).toBeNull()
  })
})

// ── regression: cshi shape drift ─────────────────────────────────────────────

describe('normalizeDashboardData — cshi field', () => {
  it('sets cshi to null when the field is absent (the original crash pattern)', () => {
    const payload = validPayload()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (payload as any).cshi
    const result = normalizeDashboardData(payload)
    expect(result).not.toBeNull()
    expect(result!.cshi).toBeNull()
  })

  it('sets cshi to null when the field is explicitly null', () => {
    const payload = { ...validPayload(), cshi: null }
    const result = normalizeDashboardData(payload)
    expect(result).not.toBeNull()
    expect(result!.cshi).toBeNull()
  })

  it('sets cshi to null when the field is an empty object', () => {
    const payload = { ...validPayload(), cshi: {} }
    const result = normalizeDashboardData(payload)
    expect(result!.cshi).toBeNull()
  })

  it('preserves valid cshi data', () => {
    const result = normalizeDashboardData(validPayload())
    expect(result!.cshi).not.toBeNull()
    expect(result!.cshi!.score).toBe(62)
    expect(result!.cshi!.weeklyChange).toBe(1.2)
    expect(result!.cshi!.history).toHaveLength(1)
  })
})

// ── regression: missing obs arrays ───────────────────────────────────────────

describe('normalizeDashboardData — obs arrays', () => {
  it('defaults all obs arrays to [] when obs is absent', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = validPayload(); delete (payload as any).obs
    const result = normalizeDashboardData(payload)
    expect(result!.obs.TTLCONS_12).toEqual([])
    expect(result!.obs.CES2000000001_12).toEqual([])
    expect(result!.obs.PERMIT_12).toEqual([])
    expect(result!.obs.TTLCONS_24).toEqual([])
    expect(result!.obs.WPS081_24).toEqual([])
  })

  it('defaults individual missing obs sub-arrays to []', () => {
    const payload = { ...validPayload(), obs: { TTLCONS_12: [OBS_ROW] } }
    const result = normalizeDashboardData(payload)
    expect(result!.obs.TTLCONS_12).toHaveLength(1)
    expect(result!.obs.CES2000000001_12).toEqual([])
    expect(result!.obs.WPS081_24).toEqual([])
  })

  it('coerces malformed obs rows to safe defaults', () => {
    const payload = { ...validPayload(), obs: { TTLCONS_12: [{ date: 123, value: 'bad' }] } }
    const result = normalizeDashboardData(payload)
    expect(result!.obs.TTLCONS_12[0].date).toBe('')   // non-string → ''
    expect(result!.obs.TTLCONS_12[0].value).toBe(0)   // non-finite → 0
  })
})

// ── regression: forecast shape drift ─────────────────────────────────────────

describe('normalizeDashboardData — forecast field', () => {
  it('sets forecast to null when absent', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = validPayload(); delete (payload as any).forecast
    expect(normalizeDashboardData(payload)!.forecast).toBeNull()
  })

  it('sets forecast to null when explicitly null', () => {
    expect(normalizeDashboardData({ ...validPayload(), forecast: null })!.forecast).toBeNull()
  })

  it('defaults forecast.models to [] when the field is missing', () => {
    const forecast = { ...validPayload().forecast }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (forecast as any).models
    const result = normalizeDashboardData({ ...validPayload(), forecast })
    expect(result!.forecast!.models).toEqual([])
  })

  it('defaults forecast.ensemble to [] when the field is missing', () => {
    const forecast = { ...validPayload().forecast }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (forecast as any).ensemble
    const result = normalizeDashboardData({ ...validPayload(), forecast })
    expect(result!.forecast!.ensemble).toEqual([])
  })

  it('defaults forecast.history to [] when missing', () => {
    const forecast = { ...validPayload().forecast }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (forecast as any).history
    const result = normalizeDashboardData({ ...validPayload(), forecast })
    expect(result!.forecast!.history).toEqual([])
  })
})

// ── valid full payload round-trip ─────────────────────────────────────────────

describe('normalizeDashboardData — full valid payload', () => {
  it('returns non-null for a complete valid payload', () => {
    expect(normalizeDashboardData(validPayload())).not.toBeNull()
  })

  it('preserves KPI values', () => {
    const result = normalizeDashboardData(validPayload())!
    expect(result.construction_spending.value).toBe(2190.4)
    expect(result.employment.value).toBe(8363)
    expect(result.permits.value).toBe(1376)
  })

  it('preserves forecast data', () => {
    const result = normalizeDashboardData(validPayload())!
    expect(result.forecast!.ensemble).toHaveLength(1)
    expect(result.forecast!.models).toHaveLength(1)
    expect(result.forecast!.metrics.accuracy).toBe(92)
  })

  it('preserves signals and commodities as arrays', () => {
    const result = normalizeDashboardData(validPayload())!
    expect(Array.isArray(result.signals)).toBe(true)
    expect(Array.isArray(result.commodities)).toBe(true)
    expect(result.signals[0].title).toBe('Spike')
    expect(result.commodities[0].signal).toBe('BUY')
  })

  it('defaults signals and commodities to [] when absent', () => {
    const payload = validPayload()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (payload as any).signals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (payload as any).commodities
    const result = normalizeDashboardData(payload)!
    expect(result.signals).toEqual([])
    expect(result.commodities).toEqual([])
  })
})
