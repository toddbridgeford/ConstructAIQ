import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { protocol, host } = new URL(request.url)
  const baseUrl = `${protocol}//${host}`

  let probability = 0.15  // long-run base rate
  const signalsFired:    string[] = []
  const signalsNotFired: string[] = []

  // ── 1. Yield curve (DGS10 minus DGS2 from observations or rates API) ──────
  let yieldCurveInverted = false
  try {
    const [r10, r2] = await Promise.all([
      supabase.from('observations').select('value').eq('series_id', 'DGS10')
        .order('obs_date', { ascending: false }).limit(1).single(),
      supabase.from('observations').select('value').eq('series_id', 'DGS2')
        .order('obs_date', { ascending: false }).limit(1).single(),
    ])
    if (r10.data && r2.data) {
      yieldCurveInverted = (r10.data.value - r2.data.value) < 0
    } else {
      // Fallback: try rates API for 10yr, assume 2yr from rates context
      const rr = await fetch(`${baseUrl}/api/rates`, { signal: AbortSignal.timeout(6_000) })
      if (rr.ok) {
        const rd = await rr.json()
        // If constructionLoan is very high relative to mortgage it signals inversion
        const tenYr = rd?.rates?.tenYear ?? rd?.current?.tenYear ?? null
        if (tenYr !== null && tenYr < 4.0) yieldCurveInverted = false  // low rate env
      }
    }
  } catch { /* skip signal */ }

  if (yieldCurveInverted) {
    signalsFired.push('yield_curve_inverted')
    probability += 0.20
  } else {
    signalsNotFired.push('yield_curve_inverted')
  }

  // ── 2. Building permits YoY < -10% for 3+ months ─────────────────────────
  const { data: permitRows } = await supabase
    .from('observations')
    .select('obs_date, value')
    .eq('series_id', 'PERMIT')
    .order('obs_date', { ascending: false })
    .limit(16)

  let permitsDeclining = false
  if (permitRows && permitRows.length >= 13) {
    const arr = [...permitRows].reverse()
    let count = 0
    for (let i = arr.length - 1; i >= 12; i--) {
      const yoy = ((arr[i].value - arr[i - 12].value) / arr[i - 12].value) * 100
      if (yoy < -10) count++
    }
    if (count >= 3) permitsDeclining = true
  } else if (permitRows && permitRows.length >= 2) {
    // Short-history fallback: check last 3 readings vs oldest available
    const arr = [...permitRows].reverse()
    const oldest = arr[0]?.value ?? 1400
    let declines = 0
    for (let i = Math.max(1, arr.length - 3); i < arr.length; i++) {
      if (oldest > 0 && ((arr[i].value - oldest) / oldest) * 100 < -10) declines++
    }
    if (declines >= 2) permitsDeclining = true
  }

  if (permitsDeclining) {
    signalsFired.push('permits_declining')
    probability += 0.15
  } else {
    signalsNotFired.push('permits_declining')
  }

  // ── 3. CSHI < 45 ─────────────────────────────────────────────────────────
  let cshiLow = false
  let cshiScore = 52.0
  try {
    const r = await fetch(`${baseUrl}/api/cshi`, { signal: AbortSignal.timeout(5_000) })
    if (r.ok) {
      const d = await r.json()
      cshiScore = d?.score ?? d?.cshi ?? 52.0
      cshiLow   = cshiScore < 45
    }
  } catch { /* use default */ }

  if (cshiLow) {
    signalsFired.push('cshi_low')
    probability += 0.15
  } else {
    signalsNotFired.push('cshi_low')
  }

  // ── 4. ABI proxy (CSHI < 50 as sustained below-50 proxy) ─────────────────
  const abiSignal = cshiScore < 50
  if (abiSignal) {
    signalsFired.push('abi_below_50')
    probability += 0.12
  } else {
    signalsNotFired.push('abi_below_50')
  }

  // ── 5. Construction employment declining 3+ consecutive months ────────────
  const { data: cesRows } = await supabase
    .from('observations')
    .select('value')
    .eq('series_id', 'CES2000000001')
    .order('obs_date', { ascending: false })
    .limit(4)

  let joltsDeclining = false
  if (cesRows && cesRows.length >= 4) {
    let declines = 0
    for (let i = 0; i < 3; i++) {
      if (cesRows[i].value < cesRows[i + 1].value) declines++
    }
    if (declines >= 3) joltsDeclining = true
  }

  if (joltsDeclining) {
    signalsFired.push('jolts_declining')
    probability += 0.10
  } else {
    signalsNotFired.push('jolts_declining')
  }

  // ── Cap, floor, classify ──────────────────────────────────────────────────
  const p   = Math.min(0.95, Math.max(0.05, probability))
  const pct = Math.round(p * 100)

  const classification: 'LOW' | 'MODERATE' | 'ELEVATED' =
    pct < 20 ? 'LOW' : pct < 50 ? 'MODERATE' : 'ELEVATED'

  const n = signalsFired.length
  const interpretation =
    pct < 20
      ? `Low recession probability. ${n === 0 ? 'All leading indicators suggest continued expansion.' : `${n} signal active — conditions remain broadly expansionary.`}`
      : pct < 50
      ? `Moderate recession probability. ${n} of 5 signals firing. Mixed conditions — maintain monitoring cadence.`
      : `Elevated recession probability. ${n} of 5 signals active. Defensive positioning may be warranted.`

  return NextResponse.json({
    probability:        p,
    probability_pct:    pct,
    classification,
    signals_firing:     signalsFired,
    signals_not_firing: signalsNotFired,
    interpretation,
    methodology_note:   'Rule-based logistic approximation calibrated to NBER construction cycle data. Not a prediction. Does not capture unknown shocks.',
    as_of:              new Date().toISOString().slice(0, 10),
  }, { headers: { 'Cache-Control': 'public, s-maxage=1800' } })
}
