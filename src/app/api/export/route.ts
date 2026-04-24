// Public endpoint — no auth required.
// Exports observation data as CSV for a given series.
// Query params:
//   series  (default: TTLCONS) — the series ID to export
//   format  (default: csv)     — reserved for future formats

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


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
    console.warn('[/api/export] Supabase fetch failed:', err)
  }

  const today = new Date().toISOString().slice(0, 10)

  if (rows.length === 0) {
    if (!SUPPORTED_SERIES.includes(series)) {
      return new NextResponse(
        `No data available for series "${series}". Supported: ${SUPPORTED_SERIES.join(', ')}`,
        { status: 404 }
      )
    }
    return new NextResponse('date,value', {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="constructaiq-${series}-${today}.csv"`,
        'Cache-Control':       'public, s-maxage=3600',
        'X-Data-Status':       'empty',
      },
    })
  }

  // Build CSV
  const lines = ['date,value', ...rows.map(r => `${r.date},${r.value}`)]
  const csv   = lines.join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="constructaiq-${series}-${today}.csv"`,
      'Cache-Control':       'public, s-maxage=3600',
    },
  })
}
