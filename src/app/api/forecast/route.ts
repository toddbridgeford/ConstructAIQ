import { NextResponse } from 'next/server'
import { runEnsemble, type EnsembleResult } from '@/lib/models/ensemble'
import { supabase, upsertForecasts, type ForecastRow } from '@/lib/supabase'

// Real API data baked-in (last refresh Apr 19 2026)
// These are updated by the DataHarvest cron job
// Extended to 60 months (5 years) for better model training
const SEED: Record<string, number[]> = {
  // TTLCONS: Total Construction Spending (billions SAAR)
  // 2021–2023 prepended, then existing 24 months (2024–2025)
  TTLCONS: [
    // 2021
    1610,1639,1703,1750,1796,1829,1847,1859,1872,1891,1906,1921,
    // 2022
    1938,1952,1969,1985,2001,2018,2035,2049,2062,2078,2091,2101,
    // 2023
    2111,2119,2133,2142,2158,2162,2168,2171,2175,2178,2180,2183,
    // 2024–2025 (original 24 data points)
    2184.6,2174.9,2206.5,2215.4,2199.8,2200.7,2205.3,2197.9,2197.1,2192.9,2176.6,2169.6,2165.4,2150.8,2153.4,2149.1,2160.7,2168.5,2177.2,2169.5,2167.9,2181.2,2197.6,2190.4,
  ],
  // CES2000000001: Construction Employment (thousands)
  // 2021–2023 prepended, then existing 24 months (2024–2025)
  CES2000000001: [
    // 2021
    7407,7449,7516,7573,7618,7651,7696,7726,7765,7793,7818,7839,
    // 2022
    7868,7889,7913,7940,7972,7998,8024,8043,8059,8075,8091,8104,
    // 2023
    8116,8124,8132,8141,8148,8155,8161,8166,8169,8172,8174,8176,
    // 2024–2025 (original 24 data points)
    8170,8176,8196,8208,8236,8254,8262,8267,8276,8264,8267,8273,8271,8269,8267,8261,8239,8255,8243,8279,8272,8317,8304,8330,
  ],
  // HOUST: Housing Starts (thousands SAAR)
  // 2021–2023 prepended, then existing 24 months (2024–2025)
  HOUST: [
    // 2021
    1580,1421,1520,1733,1572,1643,1534,1554,1589,1520,1678,1702,
    // 2022
    1638,1788,1725,1724,1549,1559,1442,1446,1439,1425,1427,1371,
    // 2023
    1309,1432,1420,1340,1631,1434,1452,1543,1358,1359,1560,1460,
    // 2024–2025 (original 24 data points)
    1552,1312,1385,1316,1327,1265,1391,1357,1352,1295,1514,1358,1490,1355,1398,1282,1382,1420,1291,1328,1272,1324,1387,1487,
  ],
  // PERMIT: Building Permits (thousands SAAR)
  // 2021–2023 prepended, then existing 24 months (2024–2025)
  PERMIT: [
    // 2021
    1681,1717,1766,1760,1681,1598,1635,1728,1586,1650,1717,1708,
    // 2022
    1895,1859,1870,1819,1695,1685,1674,1520,1564,1512,1487,1337,
    // 2023
    1339,1524,1413,1416,1491,1440,1443,1541,1471,1487,1460,1495,
    // 2024–2025 (original 24 data points)
    1577,1476,1459,1407,1461,1436,1476,1434,1428,1508,1480,1460,1454,1481,1422,1394,1393,1362,1330,1415,1411,1388,1455,1386,
  ],
}

const SUPPORTED = Object.keys(SEED)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seriesId = (searchParams.get('series') || 'TTLCONS').toUpperCase()
  const periods  = Math.min(24, Math.max(1, parseInt(searchParams.get('periods') || '12')))
  const forceRun = searchParams.get('force') === '1'

  if (!/^[A-Z0-9_]{1,20}$/.test(seriesId) || !SUPPORTED.includes(seriesId)) {
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
      history:    vals.slice(-12),
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
