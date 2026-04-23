import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchCityPermits } from '@/lib/permits'
import { promotePermitsToProjects } from '@/lib/projects'

function cronSecret() { return process.env.CRON_SECRET || '' }

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (cronSecret() && auth !== `Bearer ${cronSecret()}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start   = Date.now()
  const results: Record<string, { inserted: number; errors: number; skipped: number; promoted: number }> = {}

  const { data: sources, error: srcErr } = await supabaseAdmin
    .from('permit_sources')
    .select('*')
    .eq('status', 'active')

  if (srcErr) {
    return NextResponse.json({ error: srcErr.message }, { status: 500 })
  }
  if (!sources?.length) {
    return NextResponse.json({ ok: true, cities: 0, results: {}, duration: Date.now() - start, message: 'No active permit sources configured — run seed-permit-sources.ts' })
  }

  for (const source of sources) {
    results[source.city_code] = { inserted: 0, errors: 0, skipped: 0, promoted: 0 }

    try {
      const permits = await fetchCityPermits(source, 2000, 180)

      if (!permits.length) {
        results[source.city_code].skipped = 1
        continue
      }

      const BATCH = 200
      for (let i = 0; i < permits.length; i += BATCH) {
        const batch = permits.slice(i, i + BATCH).map(p => ({
          city_code:  source.city_code,
          ...p,
          fetched_at: new Date().toISOString(),
        }))

        const { error } = await supabaseAdmin
          .from('city_permits')
          .upsert(batch, { onConflict: 'city_code,permit_number', ignoreDuplicates: false })

        if (error) {
          console.error(`[permits] ${source.city_code} batch error:`, error.message)
          results[source.city_code].errors++
        } else {
          results[source.city_code].inserted += batch.length
        }
      }

      await supabaseAdmin
        .from('permit_sources')
        .update({
          last_fetched:  new Date().toISOString(),
          record_count:  permits.length,
          status:        'active',
        })
        .eq('city_code', source.city_code)

      await computeMonthlyAgg(source.city_code)

      const promoted = await promotePermitsToProjects(source.city_code)
      results[source.city_code].promoted = promoted

    } catch (err) {
      console.error(`[permits] ${source.city_code} failed:`, err)
      results[source.city_code].errors++

      await supabaseAdmin
        .from('permit_sources')
        .update({ status: 'degraded' })
        .eq('city_code', source.city_code)
    }
  }

  return NextResponse.json({
    ok:       true,
    duration: Date.now() - start,
    results,
    cities:   Object.keys(results).length,
  })
}

async function computeMonthlyAgg(cityCode: string): Promise<void> {
  const cutoff = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0]

  const { data: permits } = await supabaseAdmin
    .from('city_permits')
    .select('permit_type, permit_class, issued_date, valuation, units, sqft')
    .eq('city_code', cityCode)
    .not('issued_date', 'is', null)
    .gte('issued_date', cutoff)

  if (!permits?.length) return

  type AggBucket = { count: number; valuation: number; units: number; sqft: number }
  const groups: Record<string, AggBucket> = {}

  for (const p of permits) {
    // issued_date is a string 'YYYY-MM-DD'; slice to 'YYYY-MM'
    const ym = (p.issued_date as string).slice(0, 7)

    for (const typeKey of [p.permit_type as string, 'all']) {
      for (const classKey of [p.permit_class as string, 'all']) {
        const key = `${ym}|${typeKey}|${classKey}`
        if (!groups[key]) groups[key] = { count: 0, valuation: 0, units: 0, sqft: 0 }
        groups[key].count++
        groups[key].valuation += (p.valuation as number) ?? 0
        groups[key].units     += (p.units as number)     ?? 0
        groups[key].sqft      += (p.sqft as number)      ?? 0
      }
    }
  }

  const rows = Object.entries(groups).map(([key, agg]) => {
    const [ym, type, cls] = key.split('|')
    return {
      city_code:       cityCode,
      year_month:      ym,
      permit_type:     type,
      permit_class:    cls,
      permit_count:    agg.count,
      total_valuation: Math.round(agg.valuation),
      total_units:     agg.units,
      total_sqft:      Math.round(agg.sqft),
      computed_at:     new Date().toISOString(),
    }
  })

  const { error } = await supabaseAdmin
    .from('permit_monthly_agg')
    .upsert(rows, { onConflict: 'city_code,year_month,permit_type,permit_class' })

  if (error) console.error(`[permits] agg write failed for ${cityCode}:`, error.message)
}
