import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CONSTRUCTION_NAICS = ['236', '237', '238', '23']
const WARN_CSV_URL = 'https://www.dol.gov/sites/dolgov/files/ETA/warn/docs/warn-act-data.csv'
const CACHE_KEY = 'warn_act_v1'
const CACHE_TTL_HOURS = 24

export interface WarnNotice {
  company:      string
  state:        string
  city:         string
  employees:    number
  notice_date:  string
  layoff_date:  string
  naics:        string
}

export interface WarnData {
  notices:                  WarnNotice[]
  total_count:              number
  total_employees_affected: number
  by_state:                 Record<string, { count: number; employees: number }>
  source:                   string
  as_of:                    string
  stale?:                   boolean
}

function parseWarnCsv(csv: string): WarnNotice[] {
  const lines = csv.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  // Handle quoted CSV fields that may contain commas
  function splitCsvLine(line: string): string[] {
    const out: string[] = []
    let current = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        out.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    out.push(current.trim())
    return out
  }

  const headers = splitCsvLine(lines[0]).map(h => h.replace(/"/g, '').trim().toLowerCase())

  return lines.slice(1)
    .map(line => {
      const values = splitCsvLine(line)
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = (values[i] ?? '').replace(/"/g, '').trim() })
      return row
    })
    .filter(row => {
      const naics    = row['naics'] ?? row['naics code'] ?? ''
      const industry = (row['industry'] ?? '').toLowerCase()
      return CONSTRUCTION_NAICS.some(code => naics.startsWith(code)) ||
             industry.includes('construct') ||
             industry.includes('contractor') ||
             industry.includes('building')
    })
    .map(row => ({
      company:     row['company']      ?? row['employer']             ?? 'Unknown',
      state:       row['state']        ?? '',
      city:        row['city']         ?? '',
      employees:   parseInt(row['employees'] ?? row['number of workers'] ?? '0') || 0,
      notice_date: row['notice date']  ?? row['warn date']            ?? '',
      layoff_date: row['layoff date']  ?? '',
      naics:       row['naics']        ?? row['naics code']           ?? '',
    }))
    .filter(r => r.employees >= 50)
    .sort((a, b) => new Date(b.notice_date).getTime() - new Date(a.notice_date).getTime())
    .slice(0, 50)
}

function buildResult(notices: WarnNotice[]): WarnData {
  const byState: Record<string, { count: number; employees: number }> = {}
  for (const n of notices) {
    if (!byState[n.state]) byState[n.state] = { count: 0, employees: 0 }
    byState[n.state].count++
    byState[n.state].employees += n.employees
  }
  return {
    notices,
    total_count:              notices.length,
    total_employees_affected: notices.reduce((s, n) => s + n.employees, 0),
    by_state:                 byState,
    source:                   'dol.gov',
    as_of:                    new Date().toISOString(),
  }
}

export async function GET() {
  try {
    // Check cache first
    const { data: cached } = await supabaseAdmin
      .from('federal_cache')
      .select('data_json, cached_at')
      .eq('key', CACHE_KEY)
      .single()

    if (cached) {
      const ageHours = (Date.now() - new Date(cached.cached_at).getTime()) / 3_600_000
      if (ageHours < CACHE_TTL_HOURS) {
        return NextResponse.json(cached.data_json, {
          headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
        })
      }
    }

    // Fetch live DOL WARN data
    const response = await fetch(WARN_CSV_URL, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'ConstructAIQ/1.0 (constructaiq.trade)' },
    })
    if (!response.ok) throw new Error(`DOL WARN HTTP ${response.status}`)

    const csv     = await response.text()
    const notices = parseWarnCsv(csv)
    const result  = buildResult(notices)

    // Cache result — best-effort, don't block response
    void (async () => {
      try {
        await supabaseAdmin.from('federal_cache').upsert({
          key:       CACHE_KEY,
          data_json: result,
          cached_at: new Date().toISOString(),
        })
      } catch (e) { console.warn('[WARN] cache write failed:', e) }
    })()

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })

  } catch (err) {
    console.error('[WARN] fetch failed:', err)

    // Serve stale cache on failure
    const { data: stale } = await supabaseAdmin
      .from('federal_cache')
      .select('data_json')
      .eq('key', CACHE_KEY)
      .single()

    if (stale?.data_json) {
      return NextResponse.json({ ...stale.data_json, stale: true })
    }

    return NextResponse.json({
      notices:                  [],
      total_count:              0,
      total_employees_affected: 0,
      by_state:                 {},
      source:                   'unavailable',
      as_of:                    new Date().toISOString(),
    })
  }
}
