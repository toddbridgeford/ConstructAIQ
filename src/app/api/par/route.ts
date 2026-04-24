import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type OutcomeRow = {
  score_type:      string
  horizon_days:    number
  outcome_correct: boolean
}

export async function GET() {
  // Pull all resolved predictions
  const { data, error } = await supabaseAdmin
    .from('prediction_outcomes')
    .select('score_type, horizon_days, outcome_correct')
    .not('outcome_correct', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as OutcomeRow[]

  if (rows.length === 0) {
    return NextResponse.json({
      overall_par: null,
      by_horizon:  {},
      by_type:     {},
      sample_size: 0,
      as_of:       new Date().toISOString().slice(0, 10),
      note:        'No resolved predictions yet — outcomes are checked weekly after the horizon window elapses.',
    })
  }

  // Overall PAR
  const totalCorrect  = rows.filter(r => r.outcome_correct).length
  const overallPar    = Math.round((totalCorrect / rows.length) * 1000) / 10

  // By horizon
  const horizonMap: Record<string, { correct: number; total: number }> = {}
  for (const r of rows) {
    const key = `${r.horizon_days}d`
    if (!horizonMap[key]) horizonMap[key] = { correct: 0, total: 0 }
    horizonMap[key].total++
    if (r.outcome_correct) horizonMap[key].correct++
  }
  const byHorizon: Record<string, { par: number; sample_size: number }> = {}
  for (const [key, { correct, total }] of Object.entries(horizonMap)) {
    byHorizon[key] = {
      par:         Math.round((correct / total) * 1000) / 10,
      sample_size: total,
    }
  }

  // By score type
  const typeMap: Record<string, { correct: number; total: number }> = {}
  for (const r of rows) {
    if (!typeMap[r.score_type]) typeMap[r.score_type] = { correct: 0, total: 0 }
    typeMap[r.score_type].total++
    if (r.outcome_correct) typeMap[r.score_type].correct++
  }
  const byType: Record<string, { par: number; sample_size: number }> = {}
  for (const [key, { correct, total }] of Object.entries(typeMap)) {
    byType[key] = {
      par:         Math.round((correct / total) * 1000) / 10,
      sample_size: total,
    }
  }

  return NextResponse.json({
    overall_par: overallPar,
    by_horizon:  byHorizon,
    by_type:     byType,
    sample_size: rows.length,
    as_of:       new Date().toISOString().slice(0, 10),
    note:        `Based on ${rows.length} predictions with resolved outcomes`,
  })
}
