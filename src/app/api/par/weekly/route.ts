import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 10

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type OutcomeRow = {
  outcome_checked_at: string
  outcome_correct: boolean
}

function isoWeekSaturday(d: Date): string {
  const copy = new Date(d)
  // Move forward to the Saturday of this week
  const dow = copy.getDay() // 0=Sun … 6=Sat
  copy.setDate(copy.getDate() + (6 - dow))
  return copy.toISOString().slice(0, 10)
}

export async function GET() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 84) // 12 weeks back

  const { data, error } = await supabaseAdmin
    .from('prediction_outcomes')
    .select('outcome_checked_at, outcome_correct')
    .not('outcome_correct', 'is', null)
    .not('outcome_checked_at', 'is', null)
    .gte('outcome_checked_at', cutoff.toISOString())
    .order('outcome_checked_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Bucket resolved outcomes by week-ending Saturday
  const buckets: Record<string, { correct: number; total: number }> = {}
  for (const row of (data ?? []) as OutcomeRow[]) {
    const key = isoWeekSaturday(new Date(row.outcome_checked_at))
    if (!buckets[key]) buckets[key] = { correct: 0, total: 0 }
    buckets[key].total++
    if (row.outcome_correct) buckets[key].correct++
  }

  // Build a contiguous 12-week series from 11 weeks ago through the current week
  const today = new Date()
  const weeks: { week_ending: string; par: number | null; sample_size: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i * 7)
    const key = isoWeekSaturday(d)
    const b = buckets[key]
    weeks.push({
      week_ending: key,
      par: b ? Math.round((b.correct / b.total) * 1000) / 10 : null,
      sample_size: b?.total ?? 0,
    })
  }

  return NextResponse.json({ weeks })
}
