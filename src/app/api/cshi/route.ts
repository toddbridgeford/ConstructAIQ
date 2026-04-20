import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Weighted sub-scores (each normalized 0-100):
// Construction Spend Growth (MoM + YoY): 20%
// Permit Velocity (units + value, MoM): 20%
// Employment Momentum (BLS, MoM change): 15%
// Materials Cost Pressure (inverted — high cost = lower score): 15%
// Regional Momentum (HOT states as % of total): 15%
// Federal Contract Award Pace: 15%

// Score bands: 70-100=EXPANDING(green), 50-69=NEUTRAL(yellow), 30-49=SLOWING(orange), 0-29=CONTRACTING(red)

interface SubScore {
  score: number
  weight: number
  label: string
}

interface SubScores {
  spendGrowth: SubScore
  permitVelocity: SubScore
  employmentMomentum: SubScore
  materialsCostPressure: SubScore
  regionalMomentum: SubScore
  federalAwardPace: SubScore
}

interface HistoryPoint {
  week: string
  score: number
  classification: string
}

interface MomentumPoint {
  week: string
  momentum: number
}

type Classification = 'EXPANDING' | 'NEUTRAL' | 'SLOWING' | 'CONTRACTING'

function classify(score: number): { classification: Classification; classColor: string } {
  if (score >= 70) return { classification: 'EXPANDING', classColor: '#30d158' }
  if (score >= 50) return { classification: 'NEUTRAL', classColor: '#f5a623' }
  if (score >= 30) return { classification: 'SLOWING', classColor: '#ff453a' }
  return { classification: 'CONTRACTING', classColor: '#ff453a' }
}

function computeComposite(sub: SubScores): number {
  return (
    sub.spendGrowth.score * sub.spendGrowth.weight +
    sub.permitVelocity.score * sub.permitVelocity.weight +
    sub.employmentMomentum.score * sub.employmentMomentum.weight +
    sub.materialsCostPressure.score * sub.materialsCostPressure.weight +
    sub.regionalMomentum.score * sub.regionalMomentum.weight +
    sub.federalAwardPace.score * sub.federalAwardPace.weight
  )
}

// Seeded pseudo-random for deterministic history
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function generateHistory(finalScore: number): HistoryPoint[] {
  const history: HistoryPoint[] = []
  const weeks = 24
  const startScore = 64.0

  // Build a smooth trend from 64 → finalScore with weekly variance ±3
  for (let i = 0; i < weeks; i++) {
    const progress = i / (weeks - 1)
    // Ease-in-out interpolation
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
    const base = startScore + (finalScore - startScore) * eased
    // Add ±3 volatility using deterministic seed
    const noise = (seededRand(i * 7 + 3) - 0.5) * 6
    const score = Math.max(30, Math.min(100, parseFloat((base + noise).toFixed(1))))
    const weekDate = new Date('2025-10-27')
    weekDate.setDate(weekDate.getDate() + (i - weeks + 1) * 7)
    const weekStr = weekDate.toISOString().split('T')[0]
    history.push({
      week: weekStr,
      score,
      classification: classify(score).classification,
    })
  }

  return history
}

function generateMomentumLine(history: HistoryPoint[]): MomentumPoint[] {
  // 4-week rate of change
  return history.map((point, idx) => {
    if (idx < 4) {
      return { week: point.week, momentum: 0.0 }
    }
    const prev = history[idx - 4].score
    const momentum = parseFloat(((point.score - prev) / 4).toFixed(2))
    return { week: point.week, momentum }
  })
}

export async function GET() {
  try {
    // Current sub-scores derived from synthetic seed data (realistic April 2026 values)
    const subScores: SubScores = {
      spendGrowth: {
        score: 75,
        weight: 0.20,
        label: 'Spend Growth',
      },
      permitVelocity: {
        score: 68,
        weight: 0.20,
        label: 'Permit Velocity',
      },
      employmentMomentum: {
        score: 78,
        weight: 0.15,
        label: 'Employment Momentum',
      },
      materialsCostPressure: {
        score: 62,
        weight: 0.15,
        label: 'Materials Cost (inverted)',
      },
      regionalMomentum: {
        score: 80,
        weight: 0.15,
        label: 'Regional Momentum',
      },
      federalAwardPace: {
        score: 71,
        weight: 0.15,
        label: 'Federal Award Pace',
      },
    }

    const rawScore = computeComposite(subScores)
    const score = parseFloat(rawScore.toFixed(1))
    const { classification, classColor } = classify(score)

    const history = generateHistory(score)
    const momentumLine = generateMomentumLine(history)

    // Weekly change = current score minus previous week's score
    const prevScore = history[history.length - 2]?.score ?? score - 1.3
    const weeklyChange = parseFloat((score - prevScore).toFixed(1))

    return NextResponse.json(
      {
        score,
        classification,
        classColor,
        weeklyChange,
        subScores,
        history,
        momentumLine,
        updatedAt: '2026-04-20T07:00:00Z',
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
    )
  } catch (err) {
    console.error('[/api/cshi]', err)
    return NextResponse.json({ error: 'Failed to compute CSHI' }, { status: 500 })
  }
}
