import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Stable Supabase chain that always reports "no cached brief" so the
// generation path runs on every call.
const mocks = vi.hoisted(() => {
  const insertMock = vi.fn().mockResolvedValue({ error: null })
  const singleMock = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
  const limitMock  = vi.fn(() => ({ single: singleMock }))
  const orderMock  = vi.fn(() => ({ limit: limitMock }))
  const gteMock    = vi.fn(() => ({ order: orderMock }))
  const selectMock = vi.fn(() => ({ gte: gteMock }))
  const fromMock   = vi.fn(() => ({
    select: selectMock,
    insert: insertMock,
  }))
  return { insertMock, singleMock, fromMock }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: mocks.fromMock },
  getLatestObs:  vi.fn().mockResolvedValue([]),
}))

import {
  generateBrief,
  getWeeklyBrief,
  isWeeklyBriefConfigured,
  STATIC_BRIEF,
} from '../weeklyBrief'

beforeEach(() => {
  vi.clearAllMocks()
  // Default cache miss
  mocks.singleMock.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
  mocks.insertMock.mockResolvedValue({ error: null })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ───────────────────────────────────────────────────────────────────────────
// Static fallback content
// ───────────────────────────────────────────────────────────────────────────

describe('STATIC_BRIEF — neutral fallback copy', () => {
  it('contains no specific numeric metric claims', () => {
    // The previous static brief had hard numbers like "CSHI rose to 72.4",
    // "+8.3% MoM", "$4.8B in new awards". None should appear in the
    // fallback ever again — they were stale on day one.
    expect(STATIC_BRIEF).not.toMatch(/CSHI/i)
    expect(STATIC_BRIEF).not.toMatch(/\d+\.\d+%/)              // e.g. 8.3%
    expect(STATIC_BRIEF).not.toMatch(/\$\d/)                   // e.g. $4.8B
    expect(STATIC_BRIEF).not.toMatch(/\bMoM\b/)
    expect(STATIC_BRIEF).not.toMatch(/permits surged/i)
    expect(STATIC_BRIEF).not.toMatch(/Bechtel|Turner|Fluor/i)
  })

  it('explicitly tells the reader that AI generation is unavailable', () => {
    expect(STATIC_BRIEF.toLowerCase()).toContain('unavailable')
    expect(STATIC_BRIEF).toContain('ANTHROPIC_API_KEY')
  })
})

// ───────────────────────────────────────────────────────────────────────────
// isWeeklyBriefConfigured
// ───────────────────────────────────────────────────────────────────────────

describe('isWeeklyBriefConfigured', () => {
  it('returns false when ANTHROPIC_API_KEY is unset', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    expect(isWeeklyBriefConfigured()).toBe(false)
  })

  it('returns true when ANTHROPIC_API_KEY is set', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key')
    expect(isWeeklyBriefConfigured()).toBe(true)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// generateBrief — fallback path
// ───────────────────────────────────────────────────────────────────────────

describe('generateBrief without ANTHROPIC_API_KEY', () => {
  beforeEach(() => vi.stubEnv('ANTHROPIC_API_KEY', ''))

  it('returns explicit static-fallback provenance', async () => {
    const result = await generateBrief()
    expect(result.source).toBe('static-fallback')
    expect(result.live).toBe(false)
    expect(result.configured).toBe(false)
    expect(result.error).toBe('ANTHROPIC_API_KEY not set')
    expect(result.warning).toBeDefined()
    expect(result.brief).toBe(STATIC_BRIEF)
  })

  it('does not write to weekly_briefs when falling back', async () => {
    await generateBrief()
    expect(mocks.insertMock).not.toHaveBeenCalled()
  })

  it('produces a generatedAt timestamp that is a valid ISO date', async () => {
    const result = await generateBrief()
    expect(() => new Date(result.generatedAt).toISOString()).not.toThrow()
  })
})

// ───────────────────────────────────────────────────────────────────────────
// getWeeklyBrief — DB cache + fallback
// ───────────────────────────────────────────────────────────────────────────

describe('getWeeklyBrief', () => {
  it('returns cached AI brief from DB without calling generate', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')   // unset — proves we did NOT regen
    mocks.singleMock.mockResolvedValueOnce({
      data: {
        brief_text:   'CACHED HEADLINE: cached body.',
        generated_at: '2026-04-20T00:00:00Z',
        source:       'ai',
      },
      error: null,
    })
    const result = await getWeeklyBrief()
    expect(result.source).toBe('ai')
    expect(result.live).toBe(false)              // not "this-call live"
    expect(result.configured).toBe(false)        // env still missing
    expect(result.brief).toContain('CACHED')
    // No insert because we didn't generate
    expect(mocks.insertMock).not.toHaveBeenCalled()
  })

  it('falls through to static-fallback when no cache and no env key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    const result = await getWeeklyBrief()
    expect(result.source).toBe('static-fallback')
    expect(result.live).toBe(false)
    expect(result.configured).toBe(false)
    expect(result.brief).toBe(STATIC_BRIEF)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// generateBrief — configured path is callable (Anthropic mocked)
// ───────────────────────────────────────────────────────────────────────────

describe('generateBrief with ANTHROPIC_API_KEY', () => {
  it('produces source=ai when Claude returns content', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test')

    // Mock Anthropic SDK by intercepting global fetch — the SDK ultimately
    // calls fetch under the hood. Using messages.create directly via the
    // SDK is awkward to mock, so we use vi.doMock + dynamic import.
    vi.resetModules()
    vi.doMock('@anthropic-ai/sdk', () => {
      class FakeAnthropic {
        public messages = {
          create: vi.fn().mockResolvedValue({
            content: [{ type: 'text', text: 'HEADLINE SIGNAL: live test brief.' }],
          }),
        }
      }
      return { default: FakeAnthropic }
    })

    const mod = await import('../weeklyBrief')
    const result = await mod.generateBrief()

    expect(result.source).toBe('ai')
    expect(result.live).toBe(true)
    expect(result.configured).toBe(true)
    expect(result.brief).toContain('HEADLINE SIGNAL')
    expect(result.error).toBeUndefined()

    vi.doUnmock('@anthropic-ai/sdk')
  })

  it('falls back when Claude throws — provenance reflects the failure', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test')
    vi.resetModules()
    vi.doMock('@anthropic-ai/sdk', () => {
      class FakeAnthropic {
        public messages = {
          create: vi.fn().mockRejectedValue(new Error('rate limit')),
        }
      }
      return { default: FakeAnthropic }
    })
    const mod = await import('../weeklyBrief')
    const result = await mod.generateBrief()

    expect(result.source).toBe('static-fallback')
    expect(result.configured).toBe(true)
    expect(result.live).toBe(false)
    expect(result.error).toBe('rate limit')

    vi.doUnmock('@anthropic-ai/sdk')
  })
})
