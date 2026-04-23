import { describe, test, expect } from 'vitest'
import { formatFreshness } from '../freshness'

describe('formatFreshness', () => {
  test('returns unknown for null input', () => {
    const r = formatFreshness(null)
    expect(r.label).toBe('Freshness unknown')
    expect(r.isStale).toBe(true)
    expect(r.isoDate).toBe('')
  })

  test('returns unknown for undefined input', () => {
    const r = formatFreshness(undefined)
    expect(r.label).toBe('Freshness unknown')
    expect(r.isStale).toBe(true)
  })

  test('returns "just now" for very recent timestamps', () => {
    const now = new Date().toISOString()
    const r   = formatFreshness(now)
    expect(r.label).toBe('Updated just now')
    expect(r.isStale).toBe(false)
  })

  test('returns "just now" for 1 minute ago', () => {
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString()
    const r = formatFreshness(oneMinAgo)
    expect(r.label).toBe('Updated just now')
  })

  test('formats minutes correctly for 5 minutes ago', () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const r = formatFreshness(fiveMinsAgo)
    expect(r.label).toContain('5m ago')
    expect(r.isStale).toBe(false)
  })

  test('formats hours correctly', () => {
    const twoHrsAgo = new Date(Date.now() - 2 * 3_600_000).toISOString()
    const r         = formatFreshness(twoHrsAgo)
    expect(r.label).toContain('2h ago')
    expect(r.isStale).toBe(false)
  })

  test('returns "yesterday" for ~25 hours ago (not yet stale)', () => {
    const yesterdayish = new Date(Date.now() - 25 * 3_600_000).toISOString()
    const r = formatFreshness(yesterdayish)
    expect(r.label).toBe('Updated yesterday')
    // 25 hours < 48-hour stale threshold
    expect(r.isStale).toBe(false)
  })

  test('formats days correctly', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString()
    const r            = formatFreshness(threeDaysAgo)
    expect(r.label).toBe('Updated 3 days ago')
    expect(r.isStale).toBe(true)
  })

  test('marks data older than 48h as stale', () => {
    const old = new Date(Date.now() - 50 * 3_600_000).toISOString()
    const r   = formatFreshness(old)
    expect(r.isStale).toBe(true)
  })

  test('marks data at exactly 47h as not stale', () => {
    const almostStale = new Date(Date.now() - 47 * 3_600_000).toISOString()
    const r = formatFreshness(almostStale)
    expect(r.isStale).toBe(false)
  })

  test('preserves the isoDate from input', () => {
    const iso = '2026-01-15T12:00:00.000Z'
    const r   = formatFreshness(iso)
    expect(r.isoDate).toBe(iso)
  })
})
