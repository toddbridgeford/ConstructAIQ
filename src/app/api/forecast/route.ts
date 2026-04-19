import { NextResponse } from 'next/server'
import { runEnsemble, type EnsembleResult } from '@/lib/models/ensemble'
import { supabase, upsertForecasts, type ForecastRow } from '@/lib/supabase'

// Real API data baked-in (last refresh Apr 19 2026)
// These are updated by the DataHarvest cron job
const SEED: Record<string, number[]> = {
  TTLCONS:        [2184.6,2174.9,2206.5,2215.4,2199.8,2200.7,2205.3,2197.9,2197.1,2192.9,2176.6,2169.6,2165.4,2150.8,2153.4,2149.1,2160.7,2168.5,2177.2,2169.5,2167.9,2181.2,2197.6,2190.4],
  CES2000000001:  [8170,8176,8196,8208,8236,8254,8262,8267,8276,8264,8267,8273,8271,8269,8267,8261,8239,8255,8243,8279,8272,8317,8304,8330],
  HOUST:          [1552,1312,1385,1316,1327,1265,1391,1357,1352,1295,1514,1358,1490,1355,1398,1282,1382,1420,1291,1328,1272,1324,1387,1487],
  PERMIT:         [1577,1476,1459,1407,1461,1436,1476,1434,1428,1508,1480,1460,1454,1481,1422,1394,1393,1362,1330,1415,1411,1388,1455,1386],
}

const SUPPORTED = Object.keys(SEED)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seriesId = (searchParams.get('series') || 'TTLCONS').toUpperCase()
  const periods  = Math.min(24, Math.max(1, parseInt(searchParams.get('periods') || '12')))
  const forceRun = searchParams.get('force') === '1'

  if (!SUPPORTED.includes(seriesId)) {
    return NextResponse.json(
      { error: `Unsupported series. Supported: ${SUPPORTED.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    // 1. Try to load from Supabase cache first (unless force refresh)
    if (!forceRun) {
      const cached = await getCachedForecast(seriesId, periods)
      if (cached) return NextResponse.json(cached)
    }

    // 2. Load observations from Supabase (may have newer data than seed)
    let vals = await loadObservationsFromDB(seriesId) || SEED[seriesId]

    // 3. Run ensemble model
    const result = runEnsemble(vals, periods)
    if (!result) {
      return NextResponse.json({ error: 'Insufficient data for forecast' }, { status: 422 })
    }

    // 4. Persist to Supabase (best-effort, don't fail if DB unavailable)
    persistForecast(seriesId, result, periods).catch(e => console.warn('persist failed:', e))

    // 5. Build response
    const today = new Date()
    const fcstMonths = Array.from({ length: periods }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() + i + 1, 1)
      return d.toISOString().slice(0, 7)
    })

    return NextResponse.json({
      seriesId,
      periods,
      trainedOn:  vals.length,
      runAt:      today.toISOString(),
      ensemble:   result.ensemble,
      models:     result.models,
      bestModel:  result.bestModel,
      metrics:    result.metrics,
      fcstMonths,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  } catch (err) {
    console.error('[/api/forecast]', err)
    return NextResponse.json(
      { error: 'Forecast computation failed', detail: String(err) },
      { status: 500 }
    )
  }
}

// ── Helpers ──────────────────────────────────────────────────

async function loadObservationsFromDB(seriesId: string): Promise<number[] | null> {
  try {
    const { data, error } = await supabase
      .from('observations')
      .select('value')
      .eq('series_id', seriesId)
      .order('obs_date', { ascending: true })
      .limit(60)
    if (error || !data?.length) return null
    return data.map((r: any) => r.value)
  } catch {
    return null
  }
}

async function getCachedForecast(seriesId: string, periods: number) {
  try {
    const { data } = await supabase
      .from('forecasts')
      .select('*')
      .eq('series_id', seriesId)
      .eq('model', 'ensemble')
      .gte('run_date', new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0,10)) // within 4 hours
      .order('run_date', { ascending: false })
      .order('horizon_steps', { ascending: true })
      .limit(periods)
    if (!data?.length) return null

    return {
      seriesId,
      periods,
      cached:    true,
      runAt:     data[0].created_at,
      ensemble:  data.map((r: any) => ({
        base: r.base_value, lo80: r.lo80, hi80: r.hi80, lo95: r.lo95, hi95: r.hi95,
      })),
    }
  } catch {
    return null
  }
}

async function persistForecast(seriesId: string, result: EnsembleResult, periods: number) {
  const today   = new Date().toISOString().slice(0, 10)
  const rows: ForecastRow[] = []

  // Persist all model variants
  for (const m of [...result.models, { model:'ensemble', forecast:result.ensemble, mape:result.metrics.mape, accuracy:result.metrics.accuracy, weight:1 }]) {
    for (let h = 0; h < periods; h++) {
      const p = m.forecast[h]
      if (!p) continue
      const hDate = new Date(new Date().getFullYear(), new Date().getMonth() + h + 1, 1)
        .toISOString().slice(0, 10)
      rows.push({
        series_id:     seriesId,
        model:         (m as any).model || 'ensemble',
        run_date:      today,
        horizon_month: hDate,
        horizon_steps: h + 1,
        base_value:    p.base,
        lo80:          p.lo80,
        hi80:          p.hi80,
        lo95:          p.lo95,
        hi95:          p.hi95,
        mape:          (m as any).mape,
        accuracy:      (m as any).accuracy,
        weight:        (m as any).weight || 1,
      })
    }
  }

  await upsertForecasts(rows)
}
