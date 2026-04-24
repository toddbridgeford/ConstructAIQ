import { describe, test, expect } from 'vitest'
import type {
  CshiResponse,
  DashboardData,
  DashboardCshi,
  DashboardForecast,
  SignalItem,
  CommodityItem,
} from '../api-types'

describe('API type null safety', () => {
  test('CshiResponse score falls through to null when data is null', () => {
    const data: CshiResponse | null = null
    const score = data?.score ?? null
    expect(score).toBeNull()
  })

  test('CshiResponse history returns empty array when data is null', () => {
    const data: CshiResponse | null = null
    const spark = (data?.history ?? []).slice(-12).map(h => h.score)
    expect(spark).toEqual([])
  })

  test('DashboardForecast history last value falls through to null', () => {
    const data: DashboardForecast | null = null
    const lastVal = data?.history?.[data.history.length - 1] ?? null
    expect(lastVal).toBeNull()
  })

  test('DashboardForecast ensemble falls through to empty array', () => {
    const data: DashboardForecast | null = null
    const ensemble = data?.ensemble ?? []
    expect(ensemble).toEqual([])
  })

  test('construction_spending value falls through to null correctly', () => {
    const spend: { value: number | null; mom_change: number | null } | null = null
    const val = spend?.value ?? null
    expect(val).toBeNull()
  })

  test('real construction_spending value is returned', () => {
    const spend: { value: number | null; mom_change: number | null } = { value: 2190.4, mom_change: 0.3 }
    const val = spend?.value ?? null
    expect(val).toBe(2190.4)
  })

  test('DashboardData signals defaults to empty array', () => {
    const data: DashboardData | null = null
    const sigList: SignalItem[] = data?.signals ?? []
    expect(sigList).toEqual([])
  })

  test('DashboardData commodities defaults to empty array', () => {
    const data: DashboardData | null = null
    const comms: CommodityItem[] = data?.commodities ?? []
    expect(comms).toEqual([])
  })

  test('DashboardData brief_excerpt falls through to null', () => {
    const data: DashboardData | null = null
    const excerpt = data?.brief_excerpt ?? null
    expect(excerpt).toBeNull()
  })

  test('SignalItem confidence is a number', () => {
    const item: SignalItem = {
      type:        'BULLISH',
      title:       'Test signal',
      description: 'Test description',
      confidence:  92,
    }
    expect(item.confidence).toBe(92)
  })

  test('CommodityItem signal is BUY | SELL | HOLD', () => {
    const item: CommodityItem = { name: 'Lumber', value: 421, unit: 'PPI Index', signal: 'BUY' }
    expect(['BUY', 'SELL', 'HOLD']).toContain(item.signal)
  })
})

describe('Dashboard cshi null safety', () => {
  // Regression for the /dashboard crash: dashCore.cshi was undefined at runtime
  // even though DashboardData typed it as required. All cshi access must use ?. chains.

  test('cshiScore does not throw when dashCore.cshi is null', () => {
    const dashCore = { cshi: null as DashboardCshi | null }
    const score = dashCore?.cshi?.score ?? null
    expect(score).toBeNull()
  })

  test('cshiChange does not throw when dashCore.cshi is null', () => {
    const dashCore = { cshi: null as DashboardCshi | null }
    const change = dashCore?.cshi?.weeklyChange ?? null
    expect(change).toBeNull()
  })

  test('cshiSpark returns empty array when dashCore.cshi is null', () => {
    const dashCore = { cshi: null as DashboardCshi | null }
    const spark = (dashCore?.cshi?.history ?? []).slice(-12).map(h => h.score)
    expect(spark).toEqual([])
  })

  test('overviewFreshness falls back when both cshi and construction_spending are null', () => {
    const dashCore: Partial<DashboardData> = { cshi: null, construction_spending: undefined as never }
    const freshness = (dashCore as DashboardData)?.construction_spending?.data_as_of
      ?? (dashCore as DashboardData)?.cshi?.updatedAt
      ?? null
    expect(freshness).toBeNull()
  })

  test('DashboardData accepts cshi: null at the type level', () => {
    // TypeScript compile-time check — if this test file compiles, the type allows null.
    const partial: Pick<DashboardData, 'cshi'> = { cshi: null }
    expect(partial.cshi).toBeNull()
  })

  test('cshi values are returned correctly when cshi is populated', () => {
    const cshi: DashboardCshi = {
      score:          62.5,
      classification: 'NEUTRAL',
      classColor:     '#f5a623',
      weeklyChange:   1.2,
      subScores:      {},
      history:        [{ week: '2026-04-14', score: 61.3, classification: 'NEUTRAL' }],
      momentumLine:   [{ week: '2026-04-14', momentum: 0.3 }],
      updatedAt:      '2026-04-14T00:00:00Z',
    }
    const dashCore = { cshi }
    expect(dashCore?.cshi?.score).toBe(62.5)
    expect(dashCore?.cshi?.weeklyChange).toBe(1.2)
    expect((dashCore?.cshi?.history ?? []).slice(-12).map(h => h.score)).toEqual([61.3])
  })
})
