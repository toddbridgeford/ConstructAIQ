import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const { getStateAllocationsMock, getFederalLeaderboardMock } = vi.hoisted(() => ({
  getStateAllocationsMock:   vi.fn(),
  getFederalLeaderboardMock: vi.fn(),
}))

vi.mock('@/lib/federal', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/federal')>('@/lib/federal')
  return {
    ...actual,
    getStateAllocations:   getStateAllocationsMock,
    getFederalLeaderboard: getFederalLeaderboardMock,
  }
})

import { GET } from '../route'

beforeEach(() => {
  getStateAllocationsMock.mockReset()
  getFederalLeaderboardMock.mockReset()
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

  it('flags fromCache=true when both feeds return cached data', async () => {
    getStateAllocationsMock.mockResolvedValue({
      data: liveStates, fromCache: true, fetchedAt: '2026-04-24T00:00:00Z',
    })
    getFederalLeaderboardMock.mockResolvedValue({
      data: liveLeader, fromCache: true, fetchedAt: '2026-04-24T00:00:00Z',
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

// Provenance guard — keeps any future change from re-introducing a fake
// public-facing leaderboard inside the route handler itself.
describe('route.ts source — no hardcoded leaderboard', () => {
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
})
