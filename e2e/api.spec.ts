import { test, expect } from '@playwright/test'

// ── /api/status ───────────────────────────────────────────────────────────────

test.describe('/api/status', () => {
  test('returns 200', async ({ request }) => {
    const res = await request.get('/api/status')
    expect(res.status()).toBe(200)
  })
})

// ── /api/dashboard ────────────────────────────────────────────────────────────

test.describe('/api/dashboard shape', () => {
  let body: Record<string, unknown>

  // Fetch once and share across assertions in this describe block.
  // The API has a 5-min CDN cache so this is at most one origin request.
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/dashboard')
    expect(res.status(), '/api/dashboard must return 200').toBe(200)

    const contentType = res.headers()['content-type'] ?? ''
    expect(
      contentType,
      '/api/dashboard must return application/json',
    ).toContain('application/json')

    body = await res.json()
  })

  // ── cshi regression ─────────────────────────────────────────────────────

  test('response contains cshi key (regression: missing cshi crashed the dashboard)', () => {
    // The key must exist even when the value is null.  A missing key means
    // normalizeDashboardData would receive undefined for cshi — the original
    // crash pattern this test was added to prevent.
    expect(body).toHaveProperty('cshi')
  })

  test('cshi is null or an object with a numeric score', () => {
    const cshi = body.cshi
    if (cshi !== null) {
      expect(typeof cshi).toBe('object')
      expect(typeof (cshi as Record<string, unknown>).score).toBe('number')
    }
  })

  // ── array fields ─────────────────────────────────────────────────────────

  test('signals is an array', () => {
    expect(Array.isArray(body.signals)).toBe(true)
  })

  test('commodities is an array', () => {
    expect(Array.isArray(body.commodities)).toBe(true)
  })

  // ── obs arrays ────────────────────────────────────────────────────────────

  test('obs object is present', () => {
    expect(body.obs).toBeDefined()
    expect(typeof body.obs).toBe('object')
  })

  test('obs.TTLCONS_12 is an array', () => {
    const obs = body.obs as Record<string, unknown>
    expect(Array.isArray(obs.TTLCONS_12)).toBe(true)
  })

  test('obs.CES2000000001_12 is an array', () => {
    const obs = body.obs as Record<string, unknown>
    expect(Array.isArray(obs.CES2000000001_12)).toBe(true)
  })

  test('obs.PERMIT_12 is an array', () => {
    const obs = body.obs as Record<string, unknown>
    expect(Array.isArray(obs.PERMIT_12)).toBe(true)
  })

  test('obs.TTLCONS_24 is an array', () => {
    const obs = body.obs as Record<string, unknown>
    expect(Array.isArray(obs.TTLCONS_24)).toBe(true)
  })

  test('obs.WPS081_24 is an array', () => {
    const obs = body.obs as Record<string, unknown>
    expect(Array.isArray(obs.WPS081_24)).toBe(true)
  })

  // ── KPI fields ────────────────────────────────────────────────────────────

  test('construction_spending is an object with a value field', () => {
    const kpi = body.construction_spending as Record<string, unknown>
    expect(typeof kpi).toBe('object')
    // value may be null when DB has no data, but the key must exist
    expect(kpi).toHaveProperty('value')
  })

  test('employment is an object with a value field', () => {
    const kpi = body.employment as Record<string, unknown>
    expect(typeof kpi).toBe('object')
    expect(kpi).toHaveProperty('value')
  })

  test('permits is an object with a value field', () => {
    const kpi = body.permits as Record<string, unknown>
    expect(typeof kpi).toBe('object')
    expect(kpi).toHaveProperty('value')
  })

  // ── metadata ──────────────────────────────────────────────────────────────

  test('fetched_at is a non-empty ISO string', () => {
    expect(typeof body.fetched_at).toBe('string')
    expect((body.fetched_at as string).length).toBeGreaterThan(10)
  })
})
