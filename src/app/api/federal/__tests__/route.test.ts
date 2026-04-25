import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const {
  getStateAllocationsMock,
  getFederalLeaderboardMock,
  getFederalMonthlyAwardsMock,
} = vi.hoisted(() => ({
  getStateAllocationsMock:      vi.fn(),
  getFederalLeaderboardMock:    vi.fn(),
  getFederalMonthlyAwardsMock:  vi.fn(),
}))

vi.mock('@/lib/federal', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/federal')>('@/lib/federal')
  return {
    ...actual,
    getStateAllocations:      getStateAllocationsMock,
    getFederalLeaderboard:    getFederalLeaderboardMock,
    getFederalMonthlyAwards:  getFederalMonthlyAwardsMock,
    // Explicitly pass through constants so the route can reference them even if
    // vi.importActual has trouble loading the module in the test environment.
    GEO_CACHE_KEY:               'federal_geo_fy2025',
    LEADERBOARD_CACHE_KEY:        'federal_leaderboard_v1',
    MONTHLY_AWARDS_CACHE_KEY:     'federal_monthly_awards_v1',
    LEADERBOARD_LOOKBACK_MONTHS:  24,
    LEADERBOARD_AWARD_LIMIT:      500,
    FEDERAL_NAICS_CODES:          ['2361','2362','2371','2372','2379','2381','2382','2383','2389'],
  }
})

import { GET } from '../route'

const liveMonthly = {
  data:      [{ month: '2025-01-01', value: 4820 }, { month: '2025-02-01', value: 5140 }],
  fromCache: false,
  fetchedAt: '2026-04-25T00:00:00Z',
}

beforeEach(() => {
  getStateAllocationsMock.mockReset()
  getFederalLeaderboardMock.mockReset()
  getFederalMonthlyAwardsMock.mockReset()
  // Default: all three feeds live
  getFederalMonthlyAwardsMock.mockResolvedValue(liveMonthly)
})

const liveStates = [
  { state: 'TX', allocated: 18000, obligated: 14000, spent: 9000,
    executionPct: 78, rank: 1 },
]
const liveLeader = {
  contractors: [{ rank: 1, name: 'Live Co', awardValue: 500, contracts: 4,
                  agency: 'DoD', state: 'VA' }],
  agencies:    [{ name: 'DoD', obligatedPct: 100, color: '#30d158' }],
}

describe('GET /api/federal — response shape', () => {
  it('returns the full FederalResponse shape from live data', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })

    const res  = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toMatchObject({
      contractors:      liveLeader.contractors,
      agencies:         liveLeader.agencies,
      stateAllocations: liveStates,
      dataSource:       'usaspending.gov',
      fromCache:        false,
    })
    expect(Array.isArray(json.programs)).toBe(true)
    expect(Array.isArray(json.monthlyAwards)).toBe(true)
    expect(json.solicitations).toEqual([])
    expect(typeof json.totalAuthorized).toBe('number')
    expect(typeof json.totalObligated).toBe('number')
    expect(typeof json.totalSpent).toBe('number')
    expect(typeof json.updatedAt).toBe('string')
  })

  it('flags fromCache=true when all three feeds return cached data', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: true, fetchedAt: '2026-04-24T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: true, fetchedAt: '2026-04-24T00:00:00Z',
    })
    getFederalMonthlyAwardsMock.mockResolvedValue({
      data: liveMonthly.data, fromCache: true, fetchedAt: '2026-04-24T00:00:00Z',
    })

    const res  = await GET()
    const json = await res.json()
    expect(json.fromCache).toBe(true)
    expect(json.dataSource).toBe('usaspending.gov')
  })

  it('returns static-fallback + fetchError when leaderboard fetch fails with no cache', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data:      { contractors: [], agencies: [] },
      fromCache: false,
      fetchedAt: '2026-04-25T00:00:00Z',
      error:     'USASpending HTTP 500',
    })

    const res  = await GET()
    const json = await res.json()

    expect(json.contractors).toEqual([])
    expect(json.agencies).toEqual([])
    expect(json.dataSource).toBe('static-fallback')
    expect(json.fetchError).toBe('USASpending HTTP 500')
  })

  it('still serves stateAllocations from static fallback when geo feed fails', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: [], fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
      error: 'geo down',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })

    const res  = await GET()
    const json = await res.json()
    expect(json.stateAllocations.length).toBeGreaterThan(0)
    expect(json.dataSource).toBe('static-fallback')
    expect(json.fetchError).toBe('geo down')
    // Live leaderboard still surfaces — never replaced by fabricated names
    expect(json.contractors).toEqual(liveLeader.contractors)
  })

  it('absorbs an unexpected throw and returns empty leaderboard with fetchError', async () => {
    getStateAllocationsMock.mockRejectedValue(new Error('totally unexpected'))
    getFederalLeaderboardMock.mockRejectedValue(new Error('also broken'))

    const res  = await GET()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.contractors).toEqual([])
    expect(json.agencies).toEqual([])
    expect(json.dataSource).toBe('static-fallback')
    expect(typeof json.fetchError).toBe('string')
  })
})

describe('GET /api/federal — federalMeta provenance', () => {
  it('includes federalMeta in every successful response', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })

    const json = await (await GET()).json()
    expect(json.federalMeta).toBeDefined()
    expect(typeof json.federalMeta.leaderboardLookbackMonths).toBe('number')
    expect(typeof json.federalMeta.leaderboardAwardLimit).toBe('number')
    expect(Array.isArray(json.federalMeta.naicsCodes)).toBe(true)
    expect(json.federalMeta.naicsCodes.length).toBeGreaterThan(0)
    expect(typeof json.federalMeta.cacheKeys.geo).toBe('string')
    expect(typeof json.federalMeta.cacheKeys.leaderboard).toBe('string')
  })

  it('geoSource is usaspending.gov/live when geo feed is live', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    const json = await (await GET()).json()
    expect(json.federalMeta.geoSource).toBe('usaspending.gov/live')
    expect(json.federalMeta.leaderboardSource).toBe('usaspending.gov/live')
  })

  it('geoSource is usaspending.gov/cached when geo comes from cache', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: true, fetchedAt: '2026-04-24T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: true, fetchedAt: '2026-04-24T00:00:00Z',
    })
    const json = await (await GET()).json()
    expect(json.federalMeta.geoSource).toBe('usaspending.gov/cached')
    expect(json.federalMeta.leaderboardSource).toBe('usaspending.gov/cached')
  })

  it('geoSource is static-fallback and leaderboardSource is none when both feeds fail', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: [], fromCache: false, fetchedAt: '2026-04-25T00:00:00Z', error: 'geo down',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: { contractors: [], agencies: [] },
      fromCache: false, fetchedAt: '2026-04-25T00:00:00Z', error: 'leader down',
    })
    const json = await (await GET()).json()
    expect(json.federalMeta.geoSource).toBe('static-fallback')
    expect(json.federalMeta.leaderboardSource).toBe('none')
  })

  it('federalMeta is included in the catch-block static fallback', async () => {
    getStateAllocationsMock.mockRejectedValue(new Error('catastrophic'))
    getFederalLeaderboardMock.mockRejectedValue(new Error('also bad'))
    const json = await (await GET()).json()
    expect(json.federalMeta).toBeDefined()
    expect(json.federalMeta.geoSource).toBe('static-fallback')
    expect(json.federalMeta.leaderboardSource).toBe('none')
  })
})

describe('GET /api/federal — units and data integrity', () => {
  it('contractor awardValue values in the response are integers (integer $M)', async () => {
    const contractorsWithFractional = {
      contractors: [
        { rank: 1, name: 'Co A', awardValue: 450, contracts: 3, agency: 'DoD', state: 'TX' },
        { rank: 2, name: 'Co B', awardValue: 123, contracts: 1, agency: 'GSA', state: 'VA' },
      ],
      agencies: [{ name: 'DoD', obligatedPct: 100, color: '#30d158' }],
    }
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: contractorsWithFractional, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    const json = await (await GET()).json()
    for (const c of json.contractors) {
      expect(Number.isInteger(c.awardValue)).toBe(true)
    }
  })

  it('agency obligatedPct values in the response are in range 0–100', async () => {
    const agenciesOut = [
      { name: 'DoD', obligatedPct: 100, color: '#30d158' },
      { name: 'GSA', obligatedPct: 47,  color: '#f5a623' },
      { name: 'EPA', obligatedPct: 12,  color: '#ff453a' },
    ]
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: { contractors: liveLeader.contractors, agencies: agenciesOut },
      fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    const json = await (await GET()).json()
    for (const a of json.agencies) {
      expect(a.obligatedPct).toBeGreaterThanOrEqual(0)
      expect(a.obligatedPct).toBeLessThanOrEqual(100)
    }
  })

  it('dataSource is usaspending.gov only when both geo and leaderboard have data', async () => {
    // Case 1: both live → usaspending.gov
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    expect((await (await GET()).json()).dataSource).toBe('usaspending.gov')

    // Case 2: geo missing → static-fallback
    getStateAllocationsMock.mockResolvedValue({
      data: [], fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    expect((await (await GET()).json()).dataSource).toBe('static-fallback')

    // Case 3: leaderboard empty → static-fallback
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: { contractors: [], agencies: [] },
      fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    expect((await (await GET()).json()).dataSource).toBe('static-fallback')

    // Case 4: monthly empty → static-fallback
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalMonthlyAwardsMock.mockResolvedValue({
      data: [], fromCache: false, fetchedAt: '2026-04-25T00:00:00Z', error: 'monthly down',
    })
    expect((await (await GET()).json()).dataSource).toBe('static-fallback')
  })

  it('static-fallback response has empty contractors, agencies, and monthlyAwards', async () => {
    getStateAllocationsMock.mockRejectedValue(new Error('down'))
    getFederalLeaderboardMock.mockRejectedValue(new Error('down'))
    const json = await (await GET()).json()
    expect(json.contractors).toEqual([])
    expect(json.agencies).toEqual([])
    expect(json.monthlyAwards).toEqual([])
    expect(json.dataSource).toBe('static-fallback')
    // State allocations should still be populated from static table
    expect(Array.isArray(json.stateAllocations)).toBe(true)
    expect(json.stateAllocations.length).toBeGreaterThan(0)
  })
})

describe('GET /api/federal — monthly awards feed', () => {
  it('includes live monthlyAwards from getFederalMonthlyAwards in response', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    // getFederalMonthlyAwardsMock defaults to liveMonthly from beforeEach

    const json = await (await GET()).json()
    expect(json.monthlyAwards).toEqual(liveMonthly.data)
  })

  it('monthlyAwards is [] when monthly fetch fails and no cache', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalMonthlyAwardsMock.mockResolvedValue({
      data: [], fromCache: false, fetchedAt: '2026-04-25T00:00:00Z', error: 'monthly API 503',
    })

    const json = await (await GET()).json()
    expect(json.monthlyAwards).toEqual([])
    expect(json.dataSource).toBe('static-fallback')
    expect(json.fetchError).toContain('monthly API 503')
  })

  it('federalMeta includes monthlyAwardsSource', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })

    const json = await (await GET()).json()
    expect(json.federalMeta.monthlyAwardsSource).toBe('usaspending.gov/live')
    expect(json.federalMeta.cacheKeys.monthlyAwards).toBe('federal_monthly_awards_v1')
  })

  it('monthlyAwardsSource is usaspending.gov/cached when monthly comes from cache', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: false, fetchedAt: '2026-04-25T00:00:00Z',
    })
    getFederalMonthlyAwardsMock.mockResolvedValue({
      data: liveMonthly.data, fromCache: true, fetchedAt: '2026-04-24T00:00:00Z',
    })

    const json = await (await GET()).json()
    expect(json.federalMeta.monthlyAwardsSource).toBe('usaspending.gov/cached')
  })

  it('catch-block static fallback returns empty monthlyAwards (not fabricated)', async () => {
    getStateAllocationsMock.mockRejectedValue(new Error('catastrophic'))
    getFederalLeaderboardMock.mockRejectedValue(new Error('also bad'))

    const json = await (await GET()).json()
    expect(json.monthlyAwards).toEqual([])
    expect(json.federalMeta.monthlyAwardsSource).toBe('none')
  })
})

// Provenance guard — keeps any future change from re-introducing fake data
// inside the route handler itself.
describe('route.ts source — no hardcoded federal data', () => {
  const source = readFileSync(
    join(__dirname, '..', 'route.ts'),
    'utf-8',
  )

  it('contains no hardcoded CONTRACTORS array', () => {
    expect(source).not.toMatch(/const\s+CONTRACTORS\s*:/)
  })

  it('contains no hardcoded AGENCIES array', () => {
    expect(source).not.toMatch(/const\s+AGENCIES\s*:/)
  })

  it('does not embed common fabricated contractor names', () => {
    // These are the names that previously shipped as live data. If any of
    // them re-appear inside route.ts, the leaderboard has regressed.
    for (const name of ['Bechtel', 'Turner Construction', 'Fluor', 'Kiewit']) {
      expect(source).not.toContain(name)
    }
  })

  it('does not contain buildMonthlyAwards function (hardcoded monthly series removed)', () => {
    expect(source).not.toMatch(/buildMonthlyAwards/)
  })

  it('does not contain the hardcoded monthly base array magic numbers', () => {
    // The original array started with these values — any re-introduction is caught here.
    expect(source).not.toMatch(/4820,5140,4680/)
    expect(source).not.toMatch(/4820\s*,\s*5140\s*,\s*4680/)
  })
})
