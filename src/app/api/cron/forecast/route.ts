import { NextResponse } from 'next/server'
import { runEnsemble, type EnsembleResult } from '@/lib/models/ensemble'
import { supabase, supabaseAdmin, upsertForecasts, insertSignal, type ForecastRow } from '@/lib/supabase'
import { writeSourceHealth } from '@/lib/sourceHealth'

function cronSecret() { return process.env.CRON_SECRET || '' }

// Series to forecast and their current seed data
const FORECAST_SERIES = [
  { id:'TTLCONS',       periods:12, minObs:16 },
  { id:'CES2000000001', periods:12, minObs:16 },
  { id:'HOUST',         periods:12, minObs:18 },
  { id:'PERMIT',        periods:12, minObs:18 },
  { id:'MORTGAGE30US',  periods:6,  minObs:16 },
  { id:'JOLTS_CONST_JO',periods:6,  minObs:16 },
  { id:'PPI_LUMBER',    periods:6,  minObs:16 },
  { id:'PPI_STEEL',     periods:6,  minObs:16 },
]

// Signal detection thresholds
const SIGNAL_THRESHOLDS = {
  momZScore:      2.5,   // MoM z-score to trigger anomaly signal
  trendReversal:  0.3,   // % slope change to flag reversal
  permitSpend:    0.15,  // permits declining while spend rising => margin warning
}

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 10

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = cronSecret()
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const processed: string[] = []
  const errors:    string[] = []
  let forecastsWritten = 0


  // Collect latest observations for all series
  const obsMap: Record<string, number[]> = {}

  for (const s of FORECAST_SERIES) {
    try {
      const { data } = await supabase
        .from('observations')
        .select('value')
        .eq('series_id', s.id)
        .order('obs_date', { ascending: true })
        .limit(60)

      if (data && data.length >= s.minObs) {
        obsMap[s.id] = data.map((r: { value: number }) => r.value)
      }
    } catch (e) {
      errors.push(`load_${s.id}: ${e}`)
    }
  }

  // Run ensemble on each series
  const today = new Date().toISOString().slice(0, 10)

  for (const s of FORECAST_SERIES) {
    const vals = obsMap[s.id]
    if (!vals || vals.length < s.minObs) {
      errors.push(`${s.id}: insufficient data (${vals?.length || 0} < ${s.minObs})`)
      continue
    }

    try {
      const result = runEnsemble(vals, s.periods)
      if (!result) {
        errors.push(`${s.id}: model returned null`)
        continue
      }

      const rows: ForecastRow[] = []

      // All model variants
      for (const m of result.models) {
        for (let h = 0; h < s.periods; h++) {
          const p     = m.forecast[h]
          const hDate = new Date(
            new Date().getFullYear(),
            new Date().getMonth() + h + 1,
            1
          ).toISOString().slice(0, 10)

          rows.push({
            series_id:     s.id,
            model:         m.model,
            run_date:      today,
            horizon_month: hDate,
            horizon_steps: h + 1,
            base_value:    p.base,
            lo80:          p.lo80,
            hi80:          p.hi80,
            lo95:          p.lo95,
            hi95:          p.hi95,
            mape:          m.mape,
            accuracy:      m.accuracy,
            weight:        m.weight,
          })
        }
      }

      // Ensemble
      for (let h = 0; h < s.periods; h++) {
        const p     = result.ensemble[h]
        const hDate = new Date(
          new Date().getFullYear(),
          new Date().getMonth() + h + 1,
          1
        ).toISOString().slice(0, 10)

        rows.push({
          series_id:     s.id,
          model:         'ensemble',
          run_date:      today,
          horizon_month: hDate,
          horizon_steps: h + 1,
          base_value:    p.base,
          lo80:          p.lo80,
          hi80:          p.hi80,
          lo95:          p.lo95,
          hi95:          p.hi95,
          mape:          result.metrics.mape,
          accuracy:      result.metrics.accuracy,
          training_n:    result.metrics.n,
        })
      }

      const { error } = await upsertForecasts(rows)
      if (error) {
        errors.push(`upsert_${s.id}: ${error.message}`)
      } else {
        processed.push(s.id)
        forecastsWritten += rows.length
      }

      // ── Signal detection on latest data ───────────────────
      await detectAndSaveSignals(s.id, vals, result)

    } catch (e) {
      errors.push(`forecast_${s.id}: ${e}`)
    }
  }

  const duration = Date.now() - startTime

  // Log forecast run
  try {
    await supabaseAdmin.from('forecast_log').insert({
      run_at:              new Date().toISOString(),
      series_processed:    processed,
      models_run:          ['holt-winters', 'sarima', 'ensemble'],
      forecasts_written:   forecastsWritten,
      duration_ms:         duration,
    })
  } catch {}

  await writeSourceHealth({
    source_id:              'forecast_ensemble',
    source_label:           'Forecast Ensemble — TTLCONS + 7 series',
    category:               'scores',
    status:                 errors.length > 0 && processed.length === 0 ? 'failed'
                              : errors.length > 0 ? 'warn' : 'ok',
    rows_written:           forecastsWritten,
    duration_ms:            duration,
    expected_cadence_hours: 24,
    ...(errors.length > 0 ? { error_message: errors.slice(0, 3).join('; ') } : {}),
  })

  return NextResponse.json({
    status:           'ok',
    processed,
    errors,
    forecastsWritten,
    durationMs:       duration,
    runAt:            new Date().toISOString(),
  })
}

// ── Signal detection ──────────────────────────────────────────
async function detectAndSaveSignals(
  seriesId: string,
  vals:     number[],
  result:   EnsembleResult,
) {
  try {
    const n     = vals.length
    if (n < 4) return

    const latest = vals[n - 1]
    const prev   = vals[n - 2]
    const mom    = (latest - prev) / prev

    // Compute rolling mean and std for z-score
    const window = vals.slice(-12)
    const mean   = window.reduce((s, v) => s + v, 0) / window.length
    const std    = Math.sqrt(window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length)
    const zScore = std > 0 ? (latest - mean) / std : 0

    // Anomaly: current value outside 2.5σ of 12-month window
    if (Math.abs(zScore) > SIGNAL_THRESHOLDS.momZScore) {
      await insertSignal({
        type:             zScore > 0 ? 'BULLISH' : 'BEARISH',
        series_id:        seriesId,
        title:            `${seriesId} ${zScore > 0 ? 'Surge' : 'Drop'} Detected`,
        description:      `Latest value ${zScore > 0 ? 'exceeds' : 'falls below'} 12-month average by ${Math.abs(zScore).toFixed(1)}σ (${(mom * 100).toFixed(1)}% MoM)`,
        confidence:       Math.min(99, Math.round(Math.abs(zScore) * 30 + 50)),
        method:           'zscore',
        value_at_signal:  latest,
        threshold:        SIGNAL_THRESHOLDS.momZScore,
      })
    }

    // Trend reversal: AR trend sign flip
    const hw = result.models.find(m => m.model === 'holt-winters')
    if (hw) {
      const trend3  = vals[n-1] - vals[n-4]  // 3-month trend
      const trend12 = vals[n-1] - vals[Math.max(0,n-13)]  // 12-month trend
      if (trend3 * trend12 < 0) {  // sign flip = reversal
        await insertSignal({
          type:            trend3 > 0 ? 'BULLISH' : 'BEARISH',
          series_id:       seriesId,
          title:           `${seriesId} Trend Reversal`,
          description:     `3-month momentum reversed vs 12-month trend. Short-term ${trend3 > 0 ? 'recovering' : 'decelerating'}.`,
          confidence:      72,
          method:          'slope-change',
          value_at_signal: latest,
        })
      }
    }
  } catch (e) {
    console.warn(`[SignalDetect] ${seriesId}:`, e)
  }
}
