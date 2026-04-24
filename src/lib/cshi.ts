import { supabaseAdmin } from './supabase'

interface SubScore {
  score:  number
  weight: number
  label:  string
}

interface SubScores {
  spendGrowth:           SubScore
  permitVelocity:        SubScore
  employmentMomentum:    SubScore
  materialsCostPressure: SubScore
  regionalMomentum:      SubScore
  federalAwardPace:      SubScore
}

interface HistoryPoint {
  week:           string
  score:          number
  classification: string
}

interface MomentumPoint {
  week:     string
  momentum: number
}

type Classification = 'EXPANDING' | 'NEUTRAL' | 'SLOWING' | 'CONTRACTING'

export interface CshiResult {
  score:          number
  classification: Classification
  classColor:     string
  weeklyChange:   number
  subScores:      SubScores
  history:        HistoryPoint[]
  momentumLine:   MomentumPoint[]
  updatedAt:      string
}

function classify(score: number): { classification: Classification; classColor: string } {
  if (score >= 70) return { classification: 'EXPANDING',    classColor: '#30d158' }
  if (score >= 50) return { classification: 'NEUTRAL',      classColor: '#f5a623' }
  if (score >= 30) return { classification: 'SLOWING',      classColor: '#ff453a' }
  return             { classification: 'CONTRACTING',   classColor: '#ff453a' }
}

function computeComposite(sub: SubScores): number {
  return (
    sub.spendGrowth.score           * sub.spendGrowth.weight           +
    sub.permitVelocity.score        * sub.permitVelocity.weight        +
    sub.employmentMomentum.score    * sub.employmentMomentum.weight    +
    sub.materialsCostPressure.score * sub.materialsCostPressure.weight +
    sub.regionalMomentum.score      * sub.regionalMomentum.weight      +
    sub.federalAwardPace.score      * sub.federalAwardPace.weight
  )
}

function generateMomentumLine(history: HistoryPoint[]): MomentumPoint[] {
  return history.map((point, idx) => {
    if (idx < 4) return { week: point.week, momentum: 0.0 }
    const prev     = history[idx - 4].score
    const momentum = parseFloat(((point.score - prev) / 4).toFixed(2))
    return { week: point.week, momentum }
  })
}

export async function computeCshi(): Promise<CshiResult> {
  const [spendRows, permitRows, empRows, lumberRows, steelRows, fedRows, briefRows] =
    await Promise.all([
      supabaseAdmin.from('observations')
        .select('value,obs_date').eq('series_id', 'TTLCONS')
        .order('obs_date', { ascending: false }).limit(13),
      supabaseAdmin.from('observations')
        .select('value,obs_date').eq('series_id', 'PERMIT')
        .order('obs_date', { ascending: false }).limit(13),
      supabaseAdmin.from('observations')
        .select('value,obs_date').eq('series_id', 'CES2000000001')
        .order('obs_date', { ascending: false }).limit(2),
      supabaseAdmin.from('observations')
        .select('value,obs_date').eq('series_id', 'PPI_LUMBER')
        .order('obs_date', { ascending: false }).limit(13),
      supabaseAdmin.from('observations')
        .select('value,obs_date').eq('series_id', 'PPI_STEEL')
        .order('obs_date', { ascending: false }).limit(13),
      supabaseAdmin.from('federal_cache')
        .select('payload').order('fetched_at', { ascending: false }).limit(1),
      supabaseAdmin.from('weekly_briefs')
        .select('generated_at').order('generated_at', { ascending: false }).limit(24),
    ])

  const spendVals  = (spendRows.data  ?? []).map(r => r.value)
  const spendCur   = spendVals[0]  ?? null
  const spendYrAgo = spendVals[12] ?? null
  const spendYoy   = spendCur && spendYrAgo
    ? ((spendCur - spendYrAgo) / spendYrAgo) * 100 : 0
  const spendScore = Math.max(0, Math.min(100, 50 + spendYoy * 5))

  const permVals   = (permitRows.data ?? []).map(r => r.value)
  const permCur    = permVals[0]  ?? null
  const permYrAgo  = permVals[12] ?? null
  const permYoy    = permCur && permYrAgo
    ? ((permCur - permYrAgo) / permYrAgo) * 100 : 0
  const permitScore = Math.max(0, Math.min(100, 50 + permYoy * 4))

  const empVals  = (empRows.data ?? []).map(r => r.value)
  const empMom   = empVals.length >= 2
    ? ((empVals[0] - empVals[1]) / empVals[1]) * 100 : 0
  const empScore = Math.max(0, Math.min(100, 50 + empMom * 20))

  const lbrVals   = (lumberRows.data ?? []).map(r => r.value)
  const stlVals   = (steelRows.data  ?? []).map(r => r.value)
  const lbrYoy    = lbrVals.length >= 13
    ? ((lbrVals[0] - lbrVals[12]) / lbrVals[12]) * 100 : 0
  const stlYoy    = stlVals.length >= 13
    ? ((stlVals[0] - stlVals[12]) / stlVals[12]) * 100 : 0
  const avgMatYoy = (lbrYoy + stlYoy) / 2
  const matsScore = Math.max(0, Math.min(100, 70 - avgMatYoy * 3))

  const regionalScore = 70

  const fedPayload = fedRows.data?.[0]?.payload as
    { national_total?: number; prior_year?: number } | null
  const fedYoy  = fedPayload?.national_total && fedPayload?.prior_year
    ? ((fedPayload.national_total - fedPayload.prior_year) / fedPayload.prior_year) * 100 : 0
  const fedScore = Math.max(0, Math.min(100, 50 + fedYoy * 3))

  const subScores: SubScores = {
    spendGrowth:           { score: parseFloat(spendScore.toFixed(1)),  weight: 0.20, label: 'Spend Growth' },
    permitVelocity:        { score: parseFloat(permitScore.toFixed(1)), weight: 0.20, label: 'Permit Velocity' },
    employmentMomentum:    { score: parseFloat(empScore.toFixed(1)),    weight: 0.15, label: 'Employment Momentum' },
    materialsCostPressure: { score: parseFloat(matsScore.toFixed(1)),   weight: 0.15, label: 'Materials Cost (inverted)' },
    regionalMomentum:      { score: regionalScore,                      weight: 0.15, label: 'Regional Momentum' },
    federalAwardPace:      { score: parseFloat(fedScore.toFixed(1)),    weight: 0.15, label: 'Federal Award Pace' },
  }

  const score = parseFloat(computeComposite(subScores).toFixed(1))
  const { classification, classColor } = classify(score)

  const history: HistoryPoint[] = ((briefRows.data ?? []) as { generated_at: string }[])
    .slice()
    .reverse()
    .map(row => ({
      week:           row.generated_at.split('T')[0],
      score,
      classification: classify(score).classification,
    }))

  const momentumLine = generateMomentumLine(history)

  const prevScore    = history[history.length - 2]?.score ?? score
  const weeklyChange = parseFloat((score - prevScore).toFixed(1))

  return {
    score,
    classification,
    classColor,
    weeklyChange,
    subScores,
    history,
    momentumLine,
    updatedAt: new Date().toISOString(),
  }
}
