import { describe, test, expect } from 'vitest'
import {
  classifyScore,
  classifyConfidence,
  scoreVerdict,
  type VerdictInputs,
} from '@/lib/verdict'

// ── Baseline neutral inputs ───────────────────────────────────────────────────
function base(overrides: Partial<VerdictInputs> = {}): VerdictInputs {
  return {
    forecastPct:   null,
    permitYoy:     null,
    cshiScore:     null,
    warnCount:     0,
    warnAvailable: false,
    demandMsas:    0,
    lowActMsas:    0,
    recessionProb: null,
    ...overrides,
  }
}

describe('classifyScore', () => {
  test('score of exactly 3 → EXPAND', () => {
    expect(classifyScore(3)).toBe('EXPAND')
  })

  test('score of 4 → EXPAND', () => {
    expect(classifyScore(4)).toBe('EXPAND')
  })

  test('score of exactly -3 → CONTRACT', () => {
    expect(classifyScore(-3)).toBe('CONTRACT')
  })

  test('score of -5 → CONTRACT', () => {
    expect(classifyScore(-5)).toBe('CONTRACT')
  })

  test('score of exactly -2 → HOLD', () => {
    expect(classifyScore(-2)).toBe('HOLD')
  })

  test('score of 2 → HOLD', () => {
    expect(classifyScore(2)).toBe('HOLD')
  })

  test('score of 0 → HOLD', () => {
    expect(classifyScore(0)).toBe('HOLD')
  })
})

describe('classifyConfidence', () => {
  test('5 or more directional signals → HIGH', () => {
    expect(classifyConfidence(5)).toBe('HIGH')
    expect(classifyConfidence(6)).toBe('HIGH')
  })

  test('3-4 directional signals → MEDIUM', () => {
    expect(classifyConfidence(3)).toBe('MEDIUM')
    expect(classifyConfidence(4)).toBe('MEDIUM')
  })

  test('0-2 directional signals → LOW', () => {
    expect(classifyConfidence(0)).toBe('LOW')
    expect(classifyConfidence(2)).toBe('LOW')
  })
})

describe('scoreVerdict — all positive signals → EXPAND', () => {
  test('strong positive signals produce EXPAND verdict', () => {
    const result = scoreVerdict(base({
      forecastPct:   5,    // +2
      permitYoy:     3,    // +1
      cshiScore:     75,   // +2
      warnCount:     2, warnAvailable: true,  // +1
      demandMsas:    4,    // +1
      recessionProb: 0.10, // +1  (total = +8)
    }))
    expect(result.overall).toBe('EXPAND')
    expect(result.score).toBeGreaterThanOrEqual(3)
  })
})

describe('scoreVerdict — all negative signals → CONTRACT', () => {
  test('strong negative signals produce CONTRACT verdict', () => {
    const result = scoreVerdict(base({
      forecastPct:   -5,   // -2
      permitYoy:     -3,   // -1
      cshiScore:     30,   // -2
      warnCount:     25,   // -1  (warnAvailable irrelevant for >20 case)
      warnAvailable: true,
      lowActMsas:    5,    // -1
      recessionProb: 0.50, // -2  (total = -9)
    }))
    expect(result.overall).toBe('CONTRACT')
    expect(result.score).toBeLessThanOrEqual(-3)
  })
})

describe('scoreVerdict — mixed signals → HOLD', () => {
  test('offsetting signals cancel out to HOLD', () => {
    const result = scoreVerdict(base({
      forecastPct:   5,    // +2
      cshiScore:     30,   // -2  (total = 0)
    }))
    expect(result.overall).toBe('HOLD')
    expect(result.score).toBe(0)
  })

  test('all null inputs → HOLD with zero score', () => {
    const result = scoreVerdict(base())
    expect(result.overall).toBe('HOLD')
    expect(result.score).toBe(0)
    expect(result.directional).toBe(0)
    expect(result.confidence).toBe('LOW')
  })
})

describe('scoreVerdict — individual signal contributions', () => {
  test('forecast >2% adds +2 to score', () => {
    const result = scoreVerdict(base({ forecastPct: 3 }))
    expect(result.score).toBe(2)
  })

  test('forecast <-2% subtracts 2 from score', () => {
    const result = scoreVerdict(base({ forecastPct: -4 }))
    expect(result.score).toBe(-2)
  })

  test('flat forecast adds 0', () => {
    const result = scoreVerdict(base({ forecastPct: 1 }))
    expect(result.score).toBe(0)
    expect(result.directional).toBe(0)
  })

  test('CSHI >60 adds +2', () => {
    const result = scoreVerdict(base({ cshiScore: 72 }))
    expect(result.score).toBe(2)
    expect(result.directional).toBe(1)
  })

  test('CSHI <40 subtracts 2', () => {
    const result = scoreVerdict(base({ cshiScore: 25 }))
    expect(result.score).toBe(-2)
  })

  test('warnCount <5 with warnAvailable adds +1', () => {
    const result = scoreVerdict(base({ warnCount: 3, warnAvailable: true }))
    expect(result.score).toBe(1)
  })

  test('warnCount <5 without warnAvailable adds 0 (API was down)', () => {
    const result = scoreVerdict(base({ warnCount: 0, warnAvailable: false }))
    expect(result.score).toBe(0)
  })

  test('warnCount >20 subtracts 1', () => {
    const result = scoreVerdict(base({ warnCount: 25, warnAvailable: true }))
    expect(result.score).toBe(-1)
  })

  test('recession probability >0.40 subtracts 2', () => {
    const result = scoreVerdict(base({ recessionProb: 0.45 }))
    expect(result.score).toBe(-2)
  })

  test('recession probability <0.20 adds +1', () => {
    const result = scoreVerdict(base({ recessionProb: 0.10 }))
    expect(result.score).toBe(1)
  })

  test('demandMsas >3 adds +1', () => {
    const result = scoreVerdict(base({ demandMsas: 4 }))
    expect(result.score).toBe(1)
  })

  test('lowActMsas >3 subtracts 1', () => {
    const result = scoreVerdict(base({ lowActMsas: 5 }))
    expect(result.score).toBe(-1)
  })
})

describe('scoreVerdict — boundary / edge cases', () => {
  test('score of exactly 3 classifies as EXPAND', () => {
    // forecast +2, demandMsas +1 → total 3
    const result = scoreVerdict(base({ forecastPct: 5, demandMsas: 4 }))
    expect(result.score).toBe(3)
    expect(result.overall).toBe('EXPAND')
  })

  test('score of exactly -2 classifies as HOLD', () => {
    // forecast -2 only → total -2
    const result = scoreVerdict(base({ forecastPct: -5 }))
    expect(result.score).toBe(-2)
    expect(result.overall).toBe('HOLD')
  })

  test('multiple positive signals accumulate correctly', () => {
    const result = scoreVerdict(base({
      forecastPct:   4,    // +2
      permitYoy:     2,    // +1
      cshiScore:     65,   // +2
    }))
    expect(result.score).toBe(5)
    expect(result.directional).toBe(3)
    expect(result.overall).toBe('EXPAND')
    expect(result.confidence).toBe('MEDIUM')
  })
})
