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
  getFederalLeaderboard,
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
