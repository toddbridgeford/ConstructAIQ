import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatDataAsOf,
  formatRefreshed,
  statusFromAge,
  statusFromFederalProvenance,
  TYPE_LABELS,
  STATUS_LABELS,
  type DataStatus,
  type DataType,
  type FederalProvenanceState,
} from '../data-trust-utils'

// Fix "now" to a known point for deterministic relative-time tests.
const FIXED_NOW = new Date('2026-04-26T12:00:00Z').getTime()

afterEach(() => {
  vi.useRealTimers()
})

// ── formatDataAsOf ────────────────────────────────────────────────────────────

describe('formatDataAsOf', () => {
  it('formats a valid ISO date as "Apr 2026"', () => {
    expect(formatDataAsOf('2026-04-15T00:00:00Z')).toBe('Apr 2026')
  })

  it('formats a year-month string', () => {
    expect(formatDataAsOf('2025-12-01')).toBe('Dec 2025')
  })

  it('returns "unknown" for undefined', () => {
    expect(formatDataAsOf(undefined)).toBe('unknown')
  })

  it('returns "unknown" for null', () => {
    expect(formatDataAsOf(null)).toBe('unknown')
  })

  it('returns "unknown" for empty string', () => {
    expect(formatDataAsOf('')).toBe('unknown')
  })

  it('returns the raw string for an unparseable date', () => {
    expect(formatDataAsOf('not-a-date')).toBe('not-a-date')
  })
})

// ── formatRefreshed ───────────────────────────────────────────────────────────

describe('formatRefreshed', () => {
  it('returns "unknown" for undefined', () => {
    expect(formatRefreshed(undefined)).toBe('unknown')
  })

  it('returns "unknown" for null', () => {
    expect(formatRefreshed(null)).toBe('unknown')
  })

  it('returns "unknown" for empty string', () => {
    expect(formatRefreshed('')).toBe('unknown')
  })

  it('returns "just now" for timestamps < 2 minutes ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const oneMinAgo = new Date(FIXED_NOW - 60_000).toISOString()
    expect(formatRefreshed(oneMinAgo)).toBe('just now')
  })

  it('returns "just now" for a future timestamp (clock skew)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const future = new Date(FIXED_NOW + 5_000).toISOString()
    expect(formatRefreshed(future)).toBe('just now')
  })

  it('returns minutes label for timestamps 2–59 minutes ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const tenMinsAgo = new Date(FIXED_NOW - 10 * 60_000).toISOString()
    expect(formatRefreshed(tenMinsAgo)).toBe('10m ago')
  })

  it('returns hours label for timestamps 1–23 hours ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const fiveHrsAgo = new Date(FIXED_NOW - 5 * 3_600_000).toISOString()
    expect(formatRefreshed(fiveHrsAgo)).toBe('5h ago')
  })

  it('returns days label for timestamps >= 24 hours ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const twoDaysAgo = new Date(FIXED_NOW - 2 * 86_400_000).toISOString()
    expect(formatRefreshed(twoDaysAgo)).toBe('2d ago')
  })
})

// ── statusFromAge ─────────────────────────────────────────────────────────────

describe('statusFromAge', () => {
  it('returns "unknown" for undefined', () => {
    expect(statusFromAge(undefined)).toBe('unknown')
  })

  it('returns "unknown" for null', () => {
    expect(statusFromAge(null)).toBe('unknown')
  })

  it('returns "fresh" for a timestamp < 24 hours ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const twoHrsAgo = new Date(FIXED_NOW - 2 * 3_600_000).toISOString()
    expect(statusFromAge(twoHrsAgo)).toBe('fresh')
  })

  it('returns "fresh" for a timestamp exactly at boundary (clock skew)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const future = new Date(FIXED_NOW + 1_000).toISOString()
    expect(statusFromAge(future)).toBe('fresh')
  })

  it('returns "stale" for a timestamp 1–6 days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const threeDaysAgo = new Date(FIXED_NOW - 3 * 86_400_000).toISOString()
    expect(statusFromAge(threeDaysAgo)).toBe('stale')
  })

  it('returns "delayed" for a timestamp >= 7 days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const tenDaysAgo = new Date(FIXED_NOW - 10 * 86_400_000).toISOString()
    expect(statusFromAge(tenDaysAgo)).toBe('delayed')
  })

  it('returns "unknown" for an unparseable string', () => {
    expect(statusFromAge('not-a-date')).toBe('unknown')
  })
})

// ── statusFromFederalProvenance ───────────────────────────────────────────────

describe('statusFromFederalProvenance', () => {
  const cases: [FederalProvenanceState, DataStatus][] = [
    ['live',     'fresh'],
    ['cached',   'stale'],
    ['fallback', 'fallback'],
    ['error',    'failed'],
    ['loading',  'unknown'],
  ]

  it.each(cases)('maps %s → %s', (state, expected) => {
    expect(statusFromFederalProvenance(state)).toBe(expected)
  })
})

// ── TYPE_LABELS completeness ──────────────────────────────────────────────────

describe('TYPE_LABELS', () => {
  const types: DataType[] = ['actual', 'forecast', 'derived', 'ai-generated', 'fallback']

  it('has a label for every DataType', () => {
    for (const t of types) {
      expect(TYPE_LABELS[t]).toBeTruthy()
    }
  })

  it('does not return empty strings', () => {
    for (const t of types) {
      expect(TYPE_LABELS[t].length).toBeGreaterThan(0)
    }
  })
})

// ── STATUS_LABELS completeness ────────────────────────────────────────────────

describe('STATUS_LABELS', () => {
  const statuses: DataStatus[] = ['fresh', 'stale', 'delayed', 'failed', 'fallback', 'unknown']

  it('has a label for every DataStatus', () => {
    for (const s of statuses) {
      expect(STATUS_LABELS[s]).toBeTruthy()
    }
  })
})
