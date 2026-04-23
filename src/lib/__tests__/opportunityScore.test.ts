import { describe, test, expect } from 'vitest'
import {
  classify,
  classifyConfidence,
  clamp,
  compositeScore,
  pickTopDrivers,
  scoreFromBsiDelta,
  scoreFromPct,
  scoreFromRatio,
  scoreFromWarnCount,
  sectorVerdictScore,
  WEIGHTS,
  type ScoreDriver,
} from '@/lib/opportunityScore'

describe('classify', () => {
  test('80+ is FORMATION', () => {
    expect(classify(100)).toBe('FORMATION')
    expect(classify(80)).toBe('FORMATION')
  })
  test('60–79 is BUILDING', () => {
    expect(classify(79)).toBe('BUILDING')
    expect(classify(60)).toBe('BUILDING')
  })
  test('40–59 is STABLE', () => {
    expect(classify(59)).toBe('STABLE')
    expect(classify(40)).toBe('STABLE')
  })
  test('20–39 is COOLING', () => {
    expect(classify(39)).toBe('COOLING')
    expect(classify(20)).toBe('COOLING')
  })
  test('below 20 is CONTRACTING', () => {
    expect(classify(19)).toBe('CONTRACTING')
    expect(classify(0)).toBe('CONTRACTING')
  })
})

describe('classifyConfidence', () => {
  test('5+ live drivers → HIGH', () => {
    expect(classifyConfidence(5)).toBe('HIGH')
    expect(classifyConfidence(6)).toBe('HIGH')
  })
  test('3–4 live drivers → MEDIUM', () => {
    expect(classifyConfidence(3)).toBe('MEDIUM')
    expect(classifyConfidence(4)).toBe('MEDIUM')
  })
  test('fewer than 3 → LOW', () => {
    expect(classifyConfidence(0)).toBe('LOW')
    expect(classifyConfidence(2)).toBe('LOW')
  })
})

describe('numeric score helpers', () => {
  test('scoreFromPct is 50 at neutral and clamps', () => {
    expect(scoreFromPct(0)).toBe(50)
    expect(scoreFromPct(20)).toBe(100)
    expect(scoreFromPct(-20)).toBe(0)
    expect(scoreFromPct(50)).toBe(100)
    expect(scoreFromPct(-50)).toBe(0)
    expect(scoreFromPct(null)).toBe(50)
  })

  test('scoreFromRatio maps 1.0 → 50 and scales linearly', () => {
    expect(scoreFromRatio(1)).toBe(50)
    expect(scoreFromRatio(2)).toBe(100)
    expect(scoreFromRatio(0.5)).toBe(25)
    expect(scoreFromRatio(null)).toBe(50)
  })

  test('scoreFromBsiDelta clamps at ±0.05', () => {
    expect(scoreFromBsiDelta(0)).toBe(50)
    expect(scoreFromBsiDelta(0.05)).toBe(100)
    expect(scoreFromBsiDelta(-0.05)).toBe(0)
    expect(scoreFromBsiDelta(null)).toBe(50)
  })

  test('scoreFromWarnCount decreases with layoffs', () => {
    expect(scoreFromWarnCount(0)).toBe(100)
    expect(scoreFromWarnCount(5)).toBe(75)
    expect(scoreFromWarnCount(20)).toBe(0)
    expect(scoreFromWarnCount(50)).toBe(0)
  })

  test('sectorVerdictScore maps verdicts', () => {
    expect(sectorVerdictScore('EXPANDING')).toBe(75)
    expect(sectorVerdictScore('STABLE')).toBe(50)
    expect(sectorVerdictScore('CONTRACTING')).toBe(25)
    expect(sectorVerdictScore(null)).toBe(50)
  })

  test('clamp respects bounds', () => {
    expect(clamp(150)).toBe(100)
    expect(clamp(-10)).toBe(0)
    expect(clamp(42)).toBe(42)
  })
})

describe('compositeScore', () => {
  test('weights sum to 1', () => {
    const total = Object.values(WEIGHTS).reduce((s, w) => s + w, 0)
    expect(Math.abs(total - 1)).toBeLessThan(1e-9)
  })

  test('uniform neutral drivers produce 50', () => {
    const drivers: ScoreDriver[] = (Object.entries(WEIGHTS) as [keyof typeof WEIGHTS, number][])
      .map(([id, weight]) => ({
        id, label: id, score: 50, weight, value: null, detail: '', source: 'live',
      }))
    expect(compositeScore(drivers)).toBe(50)
  })

  test('all-max drivers produce 100, all-min produce 0', () => {
    const maxed: ScoreDriver[] = (Object.entries(WEIGHTS) as [keyof typeof WEIGHTS, number][])
      .map(([id, weight]) => ({
        id, label: id, score: 100, weight, value: null, detail: '', source: 'live',
      }))
    const zeroed: ScoreDriver[] = maxed.map(d => ({ ...d, score: 0 }))
    expect(compositeScore(maxed)).toBe(100)
    expect(compositeScore(zeroed)).toBe(0)
  })
})

describe('pickTopDrivers', () => {
  test('returns the three drivers furthest from neutral', () => {
    const drivers: ScoreDriver[] = [
      { id: 'permit_trend',   label: '', score: 55, weight: 0.25, value: null, detail: '', source: 'live' },
      { id: 'federal_awards', label: '', score: 90, weight: 0.20, value: null, detail: '', source: 'live' },
      { id: 'satellite_bsi',  label: '', score: 10, weight: 0.20, value: null, detail: '', source: 'live' },
      { id: 'lics',           label: '', score: 48, weight: 0.15, value: null, detail: '', source: 'live' },
      { id: 'warn_inverse',   label: '', score: 80, weight: 0.10, value: null, detail: '', source: 'live' },
      { id: 'sector_verdict', label: '', score: 50, weight: 0.10, value: null, detail: '', source: 'live' },
    ]
    const top = pickTopDrivers(drivers).map(d => d.id)
    expect(top).toEqual(['federal_awards', 'satellite_bsi', 'warn_inverse'])
  })
})
