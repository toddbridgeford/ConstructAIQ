import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.fn()

vi.mock('@/lib/supabase', () => {
  const limit = vi.fn()
  // Store reference so tests can override it
  ;(globalThis as Record<string, unknown>).__exportMockLimit = limit
  return {
    supabaseAdmin: {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit,
            }),
          }),
        }),
      }),
    },
  }
})

import { GET } from '../route'

function getLimit(): ReturnType<typeof vi.fn> {
  return (globalThis as Record<string, unknown>).__exportMockLimit as ReturnType<typeof vi.fn>
}

function makeReq(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/export')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new Request(url.toString())
}

beforeEach(() => {
  vi.clearAllMocks()
  getLimit().mockResolvedValue({ data: [], error: null })
})

describe('GET /api/export', () => {
  it('returns 400 for invalid series ID characters', async () => {
    const res = await GET(makeReq({ series: '../../etc/passwd' }))
    expect(res.status).toBe(400)
    const text = await res.text()
    expect(text).toMatch(/Invalid series/)
  })

  it('returns 400 for series ID that is too long', async () => {
    const res = await GET(makeReq({ series: 'A'.repeat(21) }))
    expect(res.status).toBe(400)
  })

  it('returns 404 for unsupported series with no DB data', async () => {
    const res = await GET(makeReq({ series: 'UNKNOWN_SERIES_XYZ' }))
    expect(res.status).toBe(404)
    const text = await res.text()
    expect(text).toMatch(/No data available/)
  })

  it('returns CSV with correct headers for TTLCONS when DB is empty', async () => {
    const res = await GET(makeReq({ series: 'TTLCONS' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/text\/csv/)
    expect(res.headers.get('Content-Disposition')).toMatch(/constructaiq-TTLCONS/)
  })

  it('CSV body starts with header row and has data rows', async () => {
    getLimit().mockResolvedValue({
      data: Array.from({ length: 12 }, (_, i) => ({
        obs_date: `2025-${String(i + 1).padStart(2, '0')}-01`,
        value:    2100 + i * 10,
      })),
      error: null,
    })
    const res = await GET(makeReq({ series: 'TTLCONS' }))
    const text = await res.text()
    const lines = text.split('\n')
    expect(lines[0]).toBe('date,value')
    expect(lines.length).toBeGreaterThan(10)
    expect(lines[1]).toMatch(/^\d{4}-\d{2}-\d{2},\d/)
  })

  it('uses DB data when Supabase returns rows', async () => {
    getLimit().mockResolvedValue({
      data: [
        { obs_date: '2025-01-01', value: 2190 },
        { obs_date: '2025-02-01', value: 2200 },
      ],
      error: null,
    })
    const res = await GET(makeReq({ series: 'TTLCONS' }))
    expect(res.status).toBe(200)
    const text = await res.text()
    const lines = text.split('\n')
    expect(lines).toHaveLength(3) // header + 2 rows
    expect(lines[1]).toBe('2025-01-01,2190')
    expect(lines[2]).toBe('2025-02-01,2200')
  })

  it('returns empty CSV when Supabase throws', async () => {
    getLimit().mockRejectedValue(new Error('DB connection failed'))
    const res = await GET(makeReq({ series: 'HOUST' }))
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text.split('\n')[0]).toBe('date,value')
  })

  it('defaults to TTLCONS when no series param is given', async () => {
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Disposition')).toMatch(/TTLCONS/)
  })

  it('normalizes lowercase series param to uppercase', async () => {
    const res = await GET(makeReq({ series: 'ttlcons' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Disposition')).toMatch(/TTLCONS/)
  })

  it('sets Cache-Control header', async () => {
    const res = await GET(makeReq({ series: 'TTLCONS' }))
    expect(res.headers.get('Cache-Control')).toMatch(/s-maxage/)
  })
})
