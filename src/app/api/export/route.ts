// Public endpoint — no auth required.
// Exports observation data as CSV for a given series.
// Query params:
//   series  (default: TTLCONS) — the series ID to export
//   format  (default: csv)     — reserved for future formats

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Fallback seed data (matches the 60-point training window in the forecast route)
const SEED_FALLBACK: Record<string, { date: string; value: number }[]> = {
  TTLCONS: [
    // 2021
    { date: '2021-01-01', value: 1610 },
    { date: '2021-02-01', value: 1639 },
    { date: '2021-03-01', value: 1703 },
    { date: '2021-04-01', value: 1750 },
    { date: '2021-05-01', value: 1796 },
    { date: '2021-06-01', value: 1829 },
    { date: '2021-07-01', value: 1847 },
    { date: '2021-08-01', value: 1859 },
    { date: '2021-09-01', value: 1872 },
    { date: '2021-10-01', value: 1891 },
    { date: '2021-11-01', value: 1906 },
    { date: '2021-12-01', value: 1921 },
    // 2022
    { date: '2022-01-01', value: 1938 },
    { date: '2022-02-01', value: 1952 },
    { date: '2022-03-01', value: 1969 },
    { date: '2022-04-01', value: 1985 },
    { date: '2022-05-01', value: 2001 },
    { date: '2022-06-01', value: 2018 },
    { date: '2022-07-01', value: 2035 },
    { date: '2022-08-01', value: 2049 },
    { date: '2022-09-01', value: 2062 },
    { date: '2022-10-01', value: 2078 },
    { date: '2022-11-01', value: 2091 },
    { date: '2022-12-01', value: 2101 },
    // 2023
    { date: '2023-01-01', value: 2111 },
    { date: '2023-02-01', value: 2119 },
    { date: '2023-03-01', value: 2133 },
    { date: '2023-04-01', value: 2142 },
    { date: '2023-05-01', value: 2158 },
    { date: '2023-06-01', value: 2162 },
    { date: '2023-07-01', value: 2168 },
    { date: '2023-08-01', value: 2171 },
    { date: '2023-09-01', value: 2175 },
    { date: '2023-10-01', value: 2178 },
    { date: '2023-11-01', value: 2180 },
    { date: '2023-12-01', value: 2183 },
    // 2024 (existing 24 points)
    { date: '2024-01-01', value: 2184.6 },
    { date: '2024-02-01', value: 2174.9 },
    { date: '2024-03-01', value: 2206.5 },
    { date: '2024-04-01', value: 2215.4 },
    { date: '2024-05-01', value: 2199.8 },
    { date: '2024-06-01', value: 2200.7 },
    { date: '2024-07-01', value: 2205.3 },
    { date: '2024-08-01', value: 2197.9 },
    { date: '2024-09-01', value: 2197.1 },
    { date: '2024-10-01', value: 2192.9 },
    { date: '2024-11-01', value: 2176.6 },
    { date: '2024-12-01', value: 2169.6 },
    { date: '2025-01-01', value: 2165.4 },
    { date: '2025-02-01', value: 2150.8 },
    { date: '2025-03-01', value: 2153.4 },
    { date: '2025-04-01', value: 2149.1 },
    { date: '2025-05-01', value: 2160.7 },
    { date: '2025-06-01', value: 2168.5 },
    { date: '2025-07-01', value: 2177.2 },
    { date: '2025-08-01', value: 2169.5 },
    { date: '2025-09-01', value: 2167.9 },
    { date: '2025-10-01', value: 2181.2 },
    { date: '2025-11-01', value: 2197.6 },
    { date: '2025-12-01', value: 2190.4 },
  ],
}

const SUPPORTED_SERIES = ['TTLCONS', 'CES2000000001', 'HOUST', 'PERMIT']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const series = (searchParams.get('series') || 'TTLCONS').toUpperCase()
  // format param reserved for future use (e.g., json)
  // const format = searchParams.get('format') || 'csv'

  if (!/^[A-Z0-9_]{1,20}$/.test(series)) {
    return new NextResponse('Invalid series ID', { status: 400 })
  }

  let rows: { date: string; value: number }[] = []

  // Attempt to load from Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('observations')
      .select('obs_date, value')
      .eq('series_id', series)
      .order('obs_date', { ascending: true })
      .limit(500)

    if (!error && data && data.length > 0) {
      rows = data.map((r: { obs_date: string; value: number }) => ({
        date:  r.obs_date,
        value: r.value,
      }))
    }
  } catch (err) {
    console.warn('[/api/export] Supabase fetch failed, using seed fallback:', err)
  }

  // Fall back to seed data if DB returned nothing
  if (rows.length === 0) {
    const seed = SEED_FALLBACK[series]
    if (seed) {
      rows = seed
    } else if (!SUPPORTED_SERIES.includes(series)) {
      return new NextResponse(
        `No data available for series "${series}". Supported: ${SUPPORTED_SERIES.join(', ')}`,
        { status: 404 }
      )
    }
  }

  // Build CSV
  const today = new Date().toISOString().slice(0, 10)
  const lines  = ['date,value', ...rows.map(r => `${r.date},${r.value}`)]
  const csv    = lines.join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="constructaiq-${series}-${today}.csv"`,
      'Cache-Control':       'public, s-maxage=3600',
    },
  })
}
