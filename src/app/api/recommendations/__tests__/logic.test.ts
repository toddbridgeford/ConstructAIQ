import { describe, test, expect } from 'vitest'
import {
  CONTRACTOR_RULES,
  LENDER_RULES,
  SUPPLIER_RULES,
  PRIORITY_WEIGHT,
  runRules,
  type Signals,
} from '../route'

// ── Baseline neutral signal object ───────────────────────────────────────────
function baseSignals(overrides: Partial<Signals> = {}): Signals {
  return {
    verdict:          'HOLD',
    lics:             50,
    recessionProb:    0,
    warnCount30d:     0,
    warnTrend:        'FLAT',
    lumberPctile:     50,
    steelPctile:      50,
    demandDrivenMsas: 0,
    federalYoy:       0,
    mortgageRate:     6.0,
    ...overrides,
  }
}

describe('PRIORITY_WEIGHT', () => {
  test('HIGH outranks MEDIUM outranks LOW', () => {
    expect(PRIORITY_WEIGHT.HIGH).toBeGreaterThan(PRIORITY_WEIGHT.MEDIUM)
    expect(PRIORITY_WEIGHT.MEDIUM).toBeGreaterThan(PRIORITY_WEIGHT.LOW)
  })
})

describe('recommendation rules — contractor', () => {
  test('EXPAND + high LICS (>60) fires capacity recommendation', () => {
    const sigs = baseSignals({ verdict: 'EXPAND', lics: 65 })
    const recs = runRules(CONTRACTOR_RULES, sigs)
    const cat  = recs.find(r => r.category === 'capacity')
    expect(cat).toBeDefined()
    expect(cat?.priority).toBe('HIGH')
  })

  test('EXPAND + moderate LICS (>55, ≤60) fires bidding but NOT capacity', () => {
    const sigs = baseSignals({ verdict: 'EXPAND', lics: 57 })
    const recs = runRules(CONTRACTOR_RULES, sigs)
    expect(recs.find(r => r.category === 'bidding')).toBeDefined()
    expect(recs.find(r => r.category === 'capacity')).toBeUndefined()
  })

  test('high lumber percentile (>80) fires materials recommendation', () => {
    const sigs = baseSignals({ lumberPctile: 85 })
    const recs = runRules(CONTRACTOR_RULES, sigs)
    const mat  = recs.find(r => r.category === 'materials')
    expect(mat).toBeDefined()
    expect(mat?.priority).toBe('HIGH')
    expect(mat?.title).toMatch(/lumber/i)
  })

  test('high steel percentile alone fires materials (MEDIUM priority)', () => {
    const sigs = baseSignals({ steelPctile: 80, lumberPctile: 50 })
    const recs = runRules(CONTRACTOR_RULES, sigs)
    const mat  = recs.find(r => r.category === 'materials')
    expect(mat).toBeDefined()
    expect(mat?.priority).toBe('MEDIUM')
  })

  test('CONTRACT verdict fires protect-margins recommendation', () => {
    const sigs = baseSignals({ verdict: 'CONTRACT' })
    const recs = runRules(CONTRACTOR_RULES, sigs)
    const risk = recs.find(r => r.category === 'risk')
    expect(risk).toBeDefined()
    expect(risk?.priority).toBe('HIGH')
  })

  test('WARN RISING + HOLD verdict fires risk monitoring recommendation', () => {
    const sigs = baseSignals({ verdict: 'HOLD', warnTrend: 'RISING' })
    const recs = runRules(CONTRACTOR_RULES, sigs)
    expect(recs.find(r => r.category === 'risk')).toBeDefined()
  })
})

describe('recommendation rules — lender', () => {
  test('high recession probability (>35) fires tighten-LTV recommendation', () => {
    const sigs = baseSignals({ recessionProb: 40 })
    const recs = runRules(LENDER_RULES, sigs)
    const risk = recs.find(r => r.category === 'risk')
    expect(risk).toBeDefined()
    expect(risk?.priority).toBe('HIGH')
    expect(risk?.title).toMatch(/LTV/i)
  })

  test('mortgage rate >6.5 and non-EXPAND verdict fires rate-risk recommendation', () => {
    const sigs = baseSignals({ mortgageRate: 7.2, verdict: 'HOLD' })
    const recs = runRules(LENDER_RULES, sigs)
    const risk = recs.find(r => r.category === 'risk')
    expect(risk).toBeDefined()
    expect(risk?.title).toMatch(/7\.20%/i)
  })

  test('mortgage rate >6.5 does NOT fire when verdict is EXPAND', () => {
    const sigs = baseSignals({ mortgageRate: 7.0, verdict: 'EXPAND' })
    const recs = runRules(LENDER_RULES, sigs)
    // rate-env rule should not fire
    const rateRec = recs.find(r => r.title.includes('%'))
    expect(rateRec).toBeUndefined()
  })

  test('federal YoY >10 and demandDrivenMsas ≥2 fires infrastructure-opportunity', () => {
    const sigs = baseSignals({ federalYoy: 15, demandDrivenMsas: 3 })
    const recs = runRules(LENDER_RULES, sigs)
    expect(recs.find(r => r.category === 'opportunity')).toBeDefined()
  })
})

describe('recommendation rules — supplier', () => {
  test('EXPAND + demandDrivenMsas ≥3 fires build-inventory recommendation', () => {
    const sigs = baseSignals({ verdict: 'EXPAND', demandDrivenMsas: 4 })
    const recs = runRules(SUPPLIER_RULES, sigs)
    const opp  = recs.find(r => r.category === 'opportunity' && r.priority === 'HIGH')
    expect(opp).toBeDefined()
  })

  test('federal YoY >15 fires structural-demand recommendation', () => {
    const sigs = baseSignals({ federalYoy: 20 })
    const recs = runRules(SUPPLIER_RULES, sigs)
    expect(recs.find(r => r.category === 'opportunity')).toBeDefined()
  })
})

describe('deduplication: keeps highest priority per category', () => {
  test('lumber HIGH outranks steel MEDIUM when both materials rules fire', () => {
    // Both materials rules fire; lumber is HIGH, steel is MEDIUM
    const sigs = baseSignals({ lumberPctile: 85, steelPctile: 80 })
    const recs = runRules(CONTRACTOR_RULES, sigs)
    const materialRecs = recs.filter(r => r.category === 'materials')
    // Deduplication: only one materials rec
    expect(materialRecs).toHaveLength(1)
    expect(materialRecs[0].priority).toBe('HIGH')
    expect(materialRecs[0].title).toMatch(/lumber/i)
  })

  test('result contains at most one rec per category', () => {
    // Trigger many rules
    const sigs = baseSignals({ verdict: 'EXPAND', lics: 65, lumberPctile: 85, steelPctile: 80 })
    const recs = runRules(CONTRACTOR_RULES, sigs)
    const categories = recs.map(r => r.category)
    const unique = new Set(categories)
    expect(categories.length).toBe(unique.size)
  })
})

describe('returns maximum 3 recommendations', () => {
  test('even when many rules fire, only 3 are returned', () => {
    // Signals that trigger multiple categories: capacity, bidding, materials, risk (4 categories)
    const sigs = baseSignals({
      verdict:       'EXPAND',
      lics:          65,       // fires capacity (HIGH) + bidding (HIGH)
      lumberPctile:  85,       // fires materials (HIGH)
      recessionProb: 31,       // fires risk (MEDIUM)
    })
    const recs = runRules(CONTRACTOR_RULES, sigs)
    expect(recs.length).toBeLessThanOrEqual(3)
  })

  test('result is sorted HIGH before MEDIUM before LOW', () => {
    const sigs = baseSignals({
      verdict:       'EXPAND',
      lics:          65,
      lumberPctile:  85,
      recessionProb: 31,
    })
    const recs = runRules(CONTRACTOR_RULES, sigs)
    for (let i = 1; i < recs.length; i++) {
      expect(PRIORITY_WEIGHT[recs[i - 1].priority]).toBeGreaterThanOrEqual(
        PRIORITY_WEIGHT[recs[i].priority]
      )
    }
  })
})
