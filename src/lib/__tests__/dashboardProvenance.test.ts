import { describe, it, expect } from 'vitest'
import {
  weeklyBriefBadge,
  federalProvenance,
  forecastAvailability,
} from '../dashboardProvenance'

// ── weeklyBriefBadge ──────────────────────────────────────────────────────────

describe('weeklyBriefBadge', () => {
  it('returns AI badge when text and source=ai', () => {
    const b = weeklyBriefBadge({ briefText: 'HEADLINE: x', source: 'ai' })
    expect(b.kind).toBe('ai')
    expect(b.label).toBe('AI GENERATED')
    expect(b.unavailable).toBe(false)
  })

  it('returns UNAVAILABLE badge with no text and source=static-fallback', () => {
    const b = weeklyBriefBadge({ briefText: undefined, source: 'static-fallback' })
    expect(b.kind).toBe('unavailable')
    expect(b.label).toBe('UNAVAILABLE')
    expect(b.unavailable).toBe(true)
  })

  it('returns UNAVAILABLE badge for empty-string brief with static-fallback source', () => {
    const b = weeklyBriefBadge({ briefText: '', source: 'static-fallback' })
    expect(b.kind).toBe('unavailable')
    expect(b.unavailable).toBe(true)
  })

  it('returns EDITORIAL when no text and unknown source — caller still loading', () => {
    const b = weeklyBriefBadge({ briefText: undefined, source: undefined })
    expect(b.kind).toBe('editorial')
    expect(b.unavailable).toBe(false)
  })

  it('returns UNAVAILABLE badge but not panel when text present + static-fallback', () => {
    // Edge case: the API returned the static fallback but the component still
    // got handed a brief string. Badge is honest, panel keeps the content.
    const b = weeklyBriefBadge({ briefText: 'Static copy', source: 'static-fallback' })
    expect(b.kind).toBe('unavailable')
    expect(b.unavailable).toBe(true)
  })

  it('returns EDITORIAL for non-AI non-fallback brief with text', () => {
    const b = weeklyBriefBadge({ briefText: 'Editorial copy', source: 'static' })
    expect(b.kind).toBe('editorial')
    expect(b.label).toBe('EDITORIAL')
    expect(b.unavailable).toBe(false)
  })
})

// ── federalProvenance ────────────────────────────────────────────────────────

describe('federalProvenance', () => {
  it('returns LOADING for null input', () => {
    expect(federalProvenance(null)).toEqual({ state: 'loading', label: 'LOADING' })
  })

  it('returns LIVE when dataSource=usaspending.gov and no error/cache flags', () => {
    const p = federalProvenance({ dataSource: 'usaspending.gov' })
    expect(p.state).toBe('live')
    expect(p.label).toContain('LIVE')
  })

  it('returns CACHED when fromCache=true', () => {
    const p = federalProvenance({
      dataSource: 'usaspending.gov',
      fromCache:  true,
      cached_at:  '2026-01-01T00:00:00Z',
    })
    expect(p.state).toBe('cached')
    expect(p.cachedAt).toBe('2026-01-01T00:00:00Z')
  })

  it('returns FALLBACK when dataSource=static-fallback', () => {
    const p = federalProvenance({ dataSource: 'static-fallback' })
    expect(p.state).toBe('fallback')
    expect(p.label).toBe('STATIC FALLBACK')
    expect(p.message).toMatch(/leaderboards are intentionally empty/i)
  })

  it('FALLBACK message explicitly says leaderboards are not fabricated', () => {
    const p = federalProvenance({ dataSource: 'static-fallback' })
    expect(p.message).toMatch(/never fabricated/i)
  })

  it('returns ERROR when error=true (overrides any other state)', () => {
    const p = federalProvenance({
      dataSource: 'usaspending.gov',
      error:      true,
      cached_at:  '2026-01-02T00:00:00Z',
    })
    expect(p.state).toBe('error')
    expect(p.cachedAt).toBe('2026-01-02T00:00:00Z')
  })

  it('falls back to updatedAt for cached state when cached_at missing', () => {
    const p = federalProvenance({
      dataSource: 'usaspending.gov',
      fromCache:  true,
      updatedAt:  '2026-01-03T00:00:00Z',
    })
    expect(p.cachedAt).toBe('2026-01-03T00:00:00Z')
  })
})

// ── forecastAvailability ──────────────────────────────────────────────────────

describe('forecastAvailability', () => {
  it('LOADING while dashboard fetch is in flight', () => {
    expect(forecastAvailability(null, true)).toBe('loading')
    expect(forecastAvailability({ ensemble: [] }, true)).toBe('loading')
  })

  it('UNAVAILABLE when dashboard loaded but forecast is null/undefined', () => {
    expect(forecastAvailability(null, false)).toBe('unavailable')
    expect(forecastAvailability(undefined, false)).toBe('unavailable')
  })

  it('AVAILABLE when forecast object present', () => {
    expect(forecastAvailability({ ensemble: [] }, false)).toBe('available')
  })
})
