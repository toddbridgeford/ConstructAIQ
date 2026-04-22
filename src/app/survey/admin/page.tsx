import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { SurveyAdminClient } from './AdminClient'

// ─── Server component — handles auth + data fetch ─────────────────────────────

export const dynamic = 'force-dynamic'

interface Period {
  id: number
  quarter: string
  opens_at: string
  closes_at: string
  is_active: boolean
  published_at: string | null
  response_count: number
  has_results: boolean
}

async function fetchPeriods(): Promise<Period[]> {
  try {
    const { data: periods } = await supabaseAdmin
      .from('survey_periods')
      .select('id, quarter, opens_at, closes_at, is_active, published_at')
      .order('opens_at', { ascending: false })
      .limit(6)

    if (!periods?.length) return []

    const enriched: Period[] = await Promise.all(
      periods.map(async (p) => {
        const { count } = await supabaseAdmin
          .from('survey_responses')
          .select('id', { count: 'exact', head: true })
          .eq('period_id', p.id)

        const { count: resultsCount } = await supabaseAdmin
          .from('survey_results')
          .select('id', { count: 'exact', head: true })
          .eq('period_id', p.id)

        return {
          ...p,
          response_count: count ?? 0,
          has_results: (resultsCount ?? 0) > 0,
        }
      })
    )

    return enriched
  } catch {
    return []
  }
}

export default async function SurveyAdminPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const adminToken  = cookieStore.get('admin_token')?.value
  const cronSecret  = process.env.CRON_SECRET

  if (!cronSecret || adminToken !== cronSecret) {
    redirect('/dashboard')
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  const periods = await fetchPeriods()
  const current  = periods.find(p => p.is_active) ?? periods[0] ?? null

  return (
    <SurveyAdminClient
      periods={periods}
      current={current}
      cronSecret={cronSecret}
    />
  )
}
