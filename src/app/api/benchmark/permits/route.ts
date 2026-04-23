import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function pctVal(sorted: number[], p: number): number {
  const h  = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(h)
  const hi = Math.ceil(h)
  if (lo === hi) return sorted[lo]
  return Math.round((sorted[lo] + (sorted[hi] - sorted[lo]) * (h - lo)) * 10) / 10
}

function pctRank(sorted: number[], value: number): number {
  const below = sorted.filter(v => v < value).length
  return Math.round((below / sorted.length) * 100)
}

function classify(percentile: number): 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE' {
  if (percentile > 66) return 'ABOVE_AVERAGE'
  if (percentile < 33) return 'BELOW_AVERAGE'
  return 'AVERAGE'
}

function makeLabel(classification: string, cityName?: string): string {
  const who = cityName ? `${cityName} is` : 'Activity is'
  if (classification === 'ABOVE_AVERAGE')
    return `${who} above its 24-month average — permit volume is in the upper third of its recent range`
  if (classification === 'BELOW_AVERAGE')
    return `${who} below its 24-month average — permit volume is in the lower third of its recent range`
  return `${who} near its 24-month average — permit volume is in the middle of its recent range`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = (searchParams.get('city') || '').toUpperCase().trim()

  if (!city || !/^[A-Z0-9_]{2,20}$/.test(city)) {
    return NextResponse.json({ error: 'city param required (e.g. ?city=PHX)' }, { status: 400 })
  }

  // Pull last 24 months of monthly aggregates for this city
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 24)
  const cutoffYM = cutoff.toISOString().slice(0, 7)

  const { data: rows } = await supabaseAdmin
    .from('permit_monthly_agg')
    .select('year_month, permit_count, city_code')
    .eq('city_code', city)
    .eq('permit_type', 'all')
    .eq('permit_class', 'all')
    .gte('year_month', cutoffYM)
    .order('year_month', { ascending: true })

  if (!rows || rows.length < 3) {
    return NextResponse.json({ error: 'Insufficient permit history for this city' }, { status: 404 })
  }

  // Resolve city name from permit_sources if possible
  let cityName: string | undefined
  try {
    const { data: src } = await supabaseAdmin
      .from('permit_sources')
      .select('city_name')
      .eq('city_code', city)
      .single()
    cityName = src?.city_name as string | undefined
  } catch { /* non-fatal */ }

  const values       = rows.map(r => r.permit_count as number)
  const currentValue = values[values.length - 1]
  const asOf         = rows[rows.length - 1].year_month as string

  const sorted = [...values].sort((a, b) => a - b)
  const n      = values.length

  const mean   = parseFloat((values.reduce((s, v) => s + v, 0) / n).toFixed(1))
  const median = pctVal(sorted, 50)
  const p10    = pctVal(sorted, 10)
  const p25    = pctVal(sorted, 25)
  const p75    = pctVal(sorted, 75)
  const p90    = pctVal(sorted, 90)

  const percentile     = pctRank(sorted, currentValue)
  const classification = classify(percentile)

  // YoY: latest month vs same month last year
  let yoyChangePct: number | null = null
  if (n >= 13) {
    const lyVal = values[n - 13]
    if (lyVal && lyVal !== 0) {
      yoyChangePct = parseFloat(((currentValue - lyVal) / lyVal * 100).toFixed(1))
    }
  }

  return NextResponse.json({
    city,
    city_name:        cityName ?? city,
    current_value:    currentValue,
    percentile,
    classification,
    mean,
    median,
    p25,
    p75,
    p10,
    p90,
    yoy_change_pct:   yoyChangePct,
    benchmark_period: '24mo',
    label:            makeLabel(classification, cityName),
    as_of:            asOf,
  }, { headers: { 'Cache-Control': 'public, s-maxage=300' } })
}
