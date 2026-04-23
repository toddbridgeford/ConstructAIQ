import { describe, test, expect } from 'vitest'
import type {
  CshiResponse,
  DashboardData,
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
