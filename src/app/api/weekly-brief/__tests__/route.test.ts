import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getWeeklyBriefMock } = vi.hoisted(() => ({
  getWeeklyBriefMock: vi.fn(),
}))

vi.mock('@/lib/weeklyBrief', () => ({
  getWeeklyBrief: getWeeklyBriefMock,
}))

import { GET } from '../route'

beforeEach(() => {
  getWeeklyBriefMock.mockReset()
})

describe('GET /api/weekly-brief', () => {
  it('exposes provenance fields when AI generation is unavailable', async () => {
    getWeeklyBriefMock.mockResolvedValue({
      brief:       'Weekly Brief unavailable — live AI generation is not configured.',
      generatedAt: '2026-04-25T00:00:00Z',
      source:      'static-fallback',
      live:        false,
      configured:  false,
      warning:     'Live AI weekly brief unavailable; serving neutral fallback copy.',
      error:       'ANTHROPIC_API_KEY not set',
    })

    const res  = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.source).toBe('static-fallback')
    expect(body.live).toBe(false)
    expect(body.configured).toBe(false)
    expect(body.warning).toBeDefined()
    expect(body.error).toBe('ANTHROPIC_API_KEY not set')
    // The fallback brief must NOT contain stale numeric claims
    expect(body.brief).not.toMatch(/\d+\.\d+%/)
    expect(body.brief).not.toMatch(/CSHI/i)
  })

  it('exposes source=ai, live=true when Claude generated the brief', async () => {
    getWeeklyBriefMock.mockResolvedValue({
      brief:       'HEADLINE SIGNAL: live data.',
      generatedAt: '2026-04-25T12:00:00Z',
      source:      'ai',
      live:        true,
      configured:  true,
    })

    const res  = await GET()
    const body = await res.json()

    expect(body.source).toBe('ai')
    expect(body.live).toBe(true)
    expect(body.configured).toBe(true)
    expect(body.warning).toBeUndefined()
    expect(body.error).toBeUndefined()
  })

  it('does not expose any secret value on missing key', async () => {
    getWeeklyBriefMock.mockResolvedValue({
      brief:       'Weekly Brief unavailable.',
      generatedAt: '2026-04-25T00:00:00Z',
      source:      'static-fallback',
      live:        false,
      configured:  false,
      error:       'ANTHROPIC_API_KEY not set',
    })
    const res  = await GET()
    const body = await res.json()
    const json = JSON.stringify(body)
    expect(json).not.toMatch(/sk-ant/)
    expect(json).not.toMatch(/Bearer\s+[A-Za-z0-9]/)
  })
})
