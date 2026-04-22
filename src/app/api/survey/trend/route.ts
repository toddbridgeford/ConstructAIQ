import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Demo trend — shown when Supabase unavailable or insufficient history
const DEMO_TREND = [
  { quarter: 'Q3 2024', backlog_net: 18, margin_net: -8,  labor_net: -42, market_net: 12  },
  { quarter: 'Q4 2024', backlog_net: 22, margin_net: -14, labor_net: -38, market_net: 8   },
  { quarter: 'Q1 2025', backlog_net: 31, margin_net: -6,  labor_net: -35, market_net: 24  },
  { quarter: 'Q2 2025', backlog_net: 38, margin_net: 4,   labor_net: -28, market_net: 31  },
]

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('survey_results')
      .select('quarter, backlog_net, margin_net, labor_net, market_net')
      .order('published_at', { ascending: true })
      .limit(8)

    if (error || !data?.length) return NextResponse.json({ trend: DEMO_TREND, demo: true })

    return NextResponse.json({ trend: data, demo: false })
  } catch {
    return NextResponse.json({ trend: DEMO_TREND, demo: true })
  }
}
