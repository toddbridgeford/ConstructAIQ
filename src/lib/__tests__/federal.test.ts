import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// vi.mock is hoisted; mock state is created via vi.hoisted so the factory can
// reference it without a TDZ error.
const mocks = vi.hoisted(() => {
  const upsertMock = vi.fn().mockResolvedValue({ error: null })
  const singleMock = vi.fn()
  const eqMock     = vi.fn(() => ({ single: singleMock }))
  const selectMock = vi.fn(() => ({ eq: eqMock }))
  const fromMock   = vi.fn(() => ({
    select: selectMock,
    upsert: upsertMock,
    eq:     eqMock,
    single: singleMock,
  }))
  return { upsertMock, singleMock, eqMock, selectMock, fromMock }
})
const { upsertMock, singleMock, fromMock } = mocks

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: mocks.fromMock },
}))

import {
  aggregateContractors,
  aggregateAgencies,
  aggregateMonthlyAwards,
  getFederalLeaderboard,
  getFederalMonthlyAwards,
} from '../federal'

type AwardRow = {
  'Recipient Name':                  string | null
  'recipient_id':                    string | null
  'Awarding Agency':                 string | null
  'Awarding Sub Agency':             string | null
  'Place of Performance State Code': string | null
  'Award Amount':                    number | null
}

function award(p: Partial<AwardRow>): AwardRow {
  return {
    'Recipient Name':                  null,
    'recipient_id':                    null,
    'Awarding Agency':                 null,
    'Awarding Sub Agency':             null,
    'Place of Performance State Code': null,
    'Award Amount':                    0,
    ...p,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default cache miss for all lookups
  singleMock.mockResolvedValue({ data: null, error: null })
  // Re-arm the upsert default after clearAllMocks
  upsertMock.mockResolvedValue({ error: null })
  // Avoid noise — fromMock keeps its impl from vi.hoisted
  fromMock.mockImplementation(() => ({
    select: () => ({ eq: () => ({ single: singleMock }) }),
    upsert: upsertMock,
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ───────────────────────────────────────────────────────────────────────────
// Pure aggregators
// ───────────────────────────────────────────────────────────────────────────

describe('aggregateContractors', () => {
  it('returns the canonical Contractor leaderboard shape', () => {
    const rows: AwardRow[] = [
      award({ 'Recipient Name': 'Acme Construction', 'recipient_id': 'r1',
              'Awarding Agency': 'Department of Defense',
              'Place of Performance State Code': 'TX', 'Award Amount': 250_000_000 }),
      award({ 'Recipient Name': 'Acme Construction', 'recipient_id': 'r1',
              'Awarding Agency': 'Department of Defense',
              'Place of Performance State Code': 'TX', 'Award Amount': 150_000_000 }),
      award({ 'Recipient Name': 'Beta Builders', 'recipient_id': 'r2',
              'Awarding Agency': 'GSA',
              'Place of Performance State Code': 'CA', 'Award Amount': 90_000_000 }),
    ]

    const out = aggregateContractors(rows)

    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({
      rank:       1,
      name:       'Acme Construction',
      awardValue: 400,         // $M
      contracts:  2,
      agency:     'Department of Defense',
      state:      'TX',
    })
    expect(out[1].rank).toBe(2)
    expect(out[1].name).toBe('Beta Builders')
  })

  it('sums multi-agency awards but reports the highest-value awarding agency', () => {
    const rows: AwardRow[] = [
      award({ 'Recipient Name': 'Multi Corp', 'recipient_id': 'r1',
              'Awarding Agency': 'GSA',         'Award Amount': 100_000_000 }),
      award({ 'Recipient Name': 'Multi Corp', 'recipient_id': 'r1',
              'Awarding Agency': 'DoD',         'Award Amount': 300_000_000 }),
      award({ 'Recipient Name': 'Multi Corp', 'recipient_id': 'r1',
              'Awarding Agency': 'EPA',         'Award Amount':  50_000_000 }),
    ]

    const out = aggregateContractors(rows)
    expect(out).toHaveLength(1)
    expect(out[0].agency).toBe('DoD')
    expect(out[0].awardValue).toBe(450)
    expect(out[0].contracts).toBe(3)
  })

  it('falls back to a normalized name key when recipient_id is missing', () => {
    const rows: AwardRow[] = [
      award({ 'Recipient Name': 'No-ID Co', 'Awarding Agency': 'A',
              'Award Amount': 10_000_000 }),
      award({ 'Recipient Name': 'No-ID Co', 'Awarding Agency': 'A',
              'Award Amount': 20_000_000 }),
    ]
    const out = aggregateContractors(rows)
    expect(out).toHaveLength(1)
    expect(out[0].contracts).toBe(2)
    expect(out[0].awardValue).toBe(30)
  })

  it('caps the leaderboard at 20 entries', () => {
    const rows: AwardRow[] = Array.from({ length: 30 }, (_, i) =>
      award({
        'Recipient Name': `Vendor ${i}`,
        'recipient_id':   `r_${i}`,
        'Awarding Agency': 'X',
        'Award Amount':   (30 - i) * 1_000_000,
      }),
    )
    expect(aggregateContractors(rows)).toHaveLength(20)
  })

  it('drops rows without a recipient name', () => {
    const rows: AwardRow[] = [
      award({ 'Recipient Name': '', 'recipient_id': 'rx', 'Award Amount': 1_000_000 }),
      award({ 'Recipient Name': 'Real Co', 'recipient_id': 'rr', 'Award Amount': 2_000_000 }),
    ]
    const out = aggregateContractors(rows)
    expect(out).toHaveLength(1)
    expect(out[0].name).toBe('Real Co')
  })

  it('awardValue is an integer number of $M (no cents)', () => {
    const rows: AwardRow[] = [
      award({ 'Recipient Name': 'Precise Co', 'recipient_id': 'p1',
              'Awarding Agency': 'DoD', 'Award Amount': 123_456_789 }),
      award({ 'Recipient Name': 'Precise Co', 'recipient_id': 'p1',
              'Awarding Agency': 'DoD', 'Award Amount':  76_543_211 }),
    ]
    const out = aggregateContractors(rows)
    // 123_456_789 + 76_543_211 = 200_000_000 → exactly 200 $M
    expect(out[0].awardValue).toBe(200)
    expect(Number.isInteger(out[0].awardValue)).toBe(true)
  })
})

describe('aggregateAgencies', () => {
  it('returns the canonical Agency shape with normalized obligatedPct', () => {
    const rows: AwardRow[] = [
      award({ 'Awarding Agency': 'DoD',  'Award Amount': 800_000_000 }),
      award({ 'Awarding Agency': 'DoD',  'Award Amount': 200_000_000 }),
      award({ 'Awarding Agency': 'GSA',  'Award Amount': 500_000_000 }),
      award({ 'Awarding Agency': 'EPA',  'Award Amount': 100_000_000 }),
    ]

    const out = aggregateAgencies(rows)

    expect(out[0]).toMatchObject({ name: 'DoD', obligatedPct: 100 })
    expect(out[1].name).toBe('GSA')
    expect(out[1].obligatedPct).toBe(50)
    expect(out[2].name).toBe('EPA')
    expect(out[2].obligatedPct).toBe(10)
    // Color tier mapping: ≥70 green, ≥50 amber, else red
    expect(out[0].color).toBe('#30d158')
    expect(out[1].color).toBe('#f5a623')
    expect(out[2].color).toBe('#ff453a')
  })

  it('returns an empty array when no awards have an awarding agency', () => {
    const rows: AwardRow[] = [
      award({ 'Awarding Agency': '',   'Award Amount': 1_000_000 }),
      award({ 'Awarding Agency': null, 'Award Amount': 2_000_000 }),
    ]
    expect(aggregateAgencies(rows)).toEqual([])
  })

  it('caps the agency table at 8 entries', () => {
    const rows: AwardRow[] = Array.from({ length: 12 }, (_, i) =>
      award({ 'Awarding Agency': `Agency ${i}`, 'Award Amount': (12 - i) * 1_000_000 }),
    )
    expect(aggregateAgencies(rows)).toHaveLength(8)
  })

  it('obligatedPct is always in the range 0–100 inclusive', () => {
    const rows: AwardRow[] = Array.from({ length: 5 }, (_, i) =>
      award({ 'Awarding Agency': `Agency ${i}`, 'Award Amount': (i + 1) * 1_000_000 }),
    )
    const out = aggregateAgencies(rows)
    for (const a of out) {
      expect(a.obligatedPct).toBeGreaterThanOrEqual(0)
      expect(a.obligatedPct).toBeLessThanOrEqual(100)
      expect(Number.isInteger(a.obligatedPct)).toBe(true)
    }
  })

  it('top agency always has obligatedPct === 100', () => {
    const rows: AwardRow[] = [
      award({ 'Awarding Agency': 'BigAgency',   'Award Amount': 999_000_000 }),
      award({ 'Awarding Agency': 'SmallAgency', 'Award Amount':   1_000_000 }),
    ]
    const out = aggregateAgencies(rows)
    expect(out[0].obligatedPct).toBe(100)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// getFederalLeaderboard — caching + fallback paths
// ───────────────────────────────────────────────────────────────────────────

describe('getFederalLeaderboard', () => {
  it('returns cached data without calling fetch when the cache is fresh', async () => {
    const cached = {
      contractors: [{ rank: 1, name: 'Cached Co', awardValue: 999, contracts: 7,
                      agency: 'GSA', state: 'NY' }],
      agencies:    [{ name: 'GSA', obligatedPct: 100, color: '#30d158' }],
    }
    singleMock.mockResolvedValueOnce({
      data:  { data_json: cached, cached_at: new Date().toISOString() },
      error: null,
    })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const out = await getFederalLeaderboard()

    expect(out.fromCache).toBe(true)
    expect(out.data.contractors[0].name).toBe('Cached Co')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('hits USASpending and shapes a live leaderboard on cache miss', async () => {
    singleMock.mockResolvedValue({ data: null, error: null })
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [
          { 'Recipient Name': 'Live Vendor', 'recipient_id': 'rv',
            'Awarding Agency': 'DoD', 'Awarding Sub Agency': 'Army',
            'Place of Performance State Code': 'VA',
            'Award Amount': 500_000_000 },
          { 'Recipient Name': 'Live Vendor', 'recipient_id': 'rv',
            'Awarding Agency': 'DoD', 'Awarding Sub Agency': 'Army',
            'Place of Performance State Code': 'VA',
            'Award Amount': 250_000_000 },
        ],
        page_metadata: { hasNext: false },
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    const out = await getFederalLeaderboard()

    expect(out.fromCache).toBe(false)
    expect(out.error).toBeUndefined()
    expect(out.data.contractors).toHaveLength(1)
    expect(out.data.contractors[0]).toMatchObject({
      rank: 1, name: 'Live Vendor', awardValue: 750, contracts: 2,
      agency: 'DoD', state: 'VA',
    })
    expect(out.data.agencies[0]).toMatchObject({
      name: 'DoD', obligatedPct: 100,
    })
    // Fire-and-forget cache write
    expect(upsertMock).toHaveBeenCalled()
  })

  it('returns stale cached data with a fetchError when live fetch fails', async () => {
    const cached = {
      contractors: [{ rank: 1, name: 'Stale Co', awardValue: 100, contracts: 3,
                      agency: 'GSA', state: 'NJ' }],
      agencies:    [{ name: 'GSA', obligatedPct: 100, color: '#30d158' }],
    }
    // First call: cache TTL check — return stale (>24h old)
    const stale = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
    singleMock.mockResolvedValueOnce({ data: { data_json: cached, cached_at: stale }, error: null })
    // Second call (the post-failure fallback path): same stale row available
    singleMock.mockResolvedValueOnce({ data: { data_json: cached, cached_at: stale }, error: null })

    const fetchSpy = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchSpy)

    const out = await getFederalLeaderboard()

    expect(out.error).toBe('network down')
    expect(out.fromCache).toBe(true)
    expect(out.data.contractors[0].name).toBe('Stale Co')
  })

  it('returns empty arrays + fetchError when both live and cache are unavailable', async () => {
    singleMock.mockResolvedValue({ data: null, error: null })
    const fetchSpy = vi.fn().mockRejectedValue(new Error('boom'))
    vi.stubGlobal('fetch', fetchSpy)

    const out = await getFederalLeaderboard()
    expect(out.error).toBe('boom')
    expect(out.fromCache).toBe(false)
    expect(out.data).toEqual({ contractors: [], agencies: [] })
  })
})

// ───────────────────────────────────────────────────────────────────────────
// aggregateMonthlyAwards — pure fiscal→calendar conversion + grouping
// ───────────────────────────────────────────────────────────────────────────

type MonthlyPoint = { aggregated_amount: number; time_period: { fiscal_year: string; month: string } }

function mp(fiscalYear: string, fiscalMonth: string, amount: number): MonthlyPoint {
  return { aggregated_amount: amount, time_period: { fiscal_year: fiscalYear, month: fiscalMonth } }
}

describe('aggregateMonthlyAwards', () => {
  it('converts fiscal Oct (M1) to calendar Oct of the prior year', () => {
    const out = aggregateMonthlyAwards([mp('2025', '1', 1_000_000_000)])
    expect(out).toHaveLength(1)
    expect(out[0].month).toBe('2024-10-01')
  })

  it('converts fiscal Nov (M2) to calendar Nov of the prior year', () => {
    const out = aggregateMonthlyAwards([mp('2025', '2', 500_000_000)])
    expect(out[0].month).toBe('2024-11-01')
  })

  it('converts fiscal Dec (M3) to calendar Dec of the prior year', () => {
    const out = aggregateMonthlyAwards([mp('2025', '3', 500_000_000)])
    expect(out[0].month).toBe('2024-12-01')
  })

  it('converts fiscal Jan (M4) to calendar Jan of the same fiscal year', () => {
    const out = aggregateMonthlyAwards([mp('2025', '4', 500_000_000)])
    expect(out[0].month).toBe('2025-01-01')
  })

  it('converts fiscal Sep (M12) to calendar Sep of the same fiscal year', () => {
    const out = aggregateMonthlyAwards([mp('2025', '12', 500_000_000)])
    expect(out[0].month).toBe('2025-09-01')
  })

  it('converts aggregated_amount to integer $M', () => {
    const out = aggregateMonthlyAwards([mp('2025', '4', 4_820_000_000)])
    expect(out[0].value).toBe(4820)
    expect(Number.isInteger(out[0].value)).toBe(true)
  })

  it('sorts output ascending by calendar month', () => {
    const out = aggregateMonthlyAwards([
      mp('2025', '4', 1_000_000_000),  // Jan 2025
      mp('2025', '1', 2_000_000_000),  // Oct 2024
      mp('2025', '6', 3_000_000_000),  // Mar 2025
    ])
    expect(out.map(r => r.month)).toEqual(['2024-10-01', '2025-01-01', '2025-03-01'])
  })

  it('filters out zero-amount rows', () => {
    const out = aggregateMonthlyAwards([
      mp('2025', '4', 0),
      mp('2025', '5', 1_000_000_000),
    ])
    expect(out).toHaveLength(1)
    expect(out[0].month).toBe('2025-02-01')
  })

  it('returns an empty array for empty input', () => {
    expect(aggregateMonthlyAwards([])).toEqual([])
  })
})

// ───────────────────────────────────────────────────────────────────────────
// getFederalMonthlyAwards — cache + fallback paths
// ───────────────────────────────────────────────────────────────────────────

describe('getFederalMonthlyAwards', () => {
  it('returns cached data without calling fetch when cache is fresh', async () => {
    const cached = [{ month: '2025-01-01', value: 4820 }]
    singleMock.mockResolvedValueOnce({
      data:  { data_json: cached, cached_at: new Date().toISOString() },
      error: null,
    })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const out = await getFederalMonthlyAwards()

    expect(out.fromCache).toBe(true)
    expect(out.data).toEqual(cached)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('calls USASpending spending_over_time on cache miss and returns live data', async () => {
    singleMock.mockResolvedValue({ data: null, error: null })
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [
          { aggregated_amount: 5_000_000_000, time_period: { fiscal_year: '2025', month: '4' } },
          { aggregated_amount: 4_500_000_000, time_period: { fiscal_year: '2025', month: '5' } },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    const out = await getFederalMonthlyAwards()

    expect(out.fromCache).toBe(false)
    expect(out.error).toBeUndefined()
    expect(out.data).toHaveLength(2)
    expect(out.data[0]).toMatchObject({ month: '2025-01-01', value: 5000 })
    expect(out.data[1]).toMatchObject({ month: '2025-02-01', value: 4500 })
    expect(upsertMock).toHaveBeenCalled()
  })

  it('returns stale cached data + fetchError when live fetch fails', async () => {
    const cached = [{ month: '2024-10-01', value: 4820 }]
    const stale  = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
    singleMock.mockResolvedValueOnce({ data: { data_json: cached, cached_at: stale }, error: null })
    singleMock.mockResolvedValueOnce({ data: { data_json: cached, cached_at: stale }, error: null })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))

    const out = await getFederalMonthlyAwards()

    expect(out.error).toBe('timeout')
    expect(out.fromCache).toBe(true)
    expect(out.data).toEqual(cached)
  })

  it('returns empty array + fetchError when both live and cache are unavailable', async () => {
    singleMock.mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const out = await getFederalMonthlyAwards()

    expect(out.error).toBe('network down')
    expect(out.fromCache).toBe(false)
    expect(out.data).toEqual([])
  })
})
