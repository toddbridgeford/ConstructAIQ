import { NextResponse } from 'next/server'
import { getLatestObs } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Last 24 months of baked-in seed data (Jan 2024 – Dec 2025)
// Kept in sync with src/app/api/forecast/route.ts SEED arrays.
const SEED_24: Record<string, number[]> = {
  TTLCONS:
    [2184.6,2174.9,2206.5,2215.4,2199.8,2200.7,2205.3,2197.9,2197.1,2192.9,2176.6,2169.6,
     2165.4,2150.8,2153.4,2149.1,2160.7,2168.5,2177.2,2169.5,2167.9,2181.2,2197.6,2190.4],
  CES2000000001:
    [8170,8176,8196,8208,8236,8254,8262,8267,8276,8264,8267,8273,
     8271,8269,8267,8261,8239,8255,8243,8279,8272,8317,8304,8330],
  HOUST:
    [1552,1312,1385,1316,1327,1265,1391,1357,1352,1295,1514,1358,
     1490,1355,1398,1282,1382,1420,1291,1328,1272,1324,1387,1487],
  PERMIT:
    [1577,1476,1459,1407,1461,1436,1476,1434,1428,1508,1480,1460,
     1454,1481,1422,1394,1393,1362,1330,1415,1411,1388,1455,1386],
}

// Generate ISO date strings ending at Dec 2025 going back n months
function seedDates(n: number): string[] {
  const dates: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    let m = 11 - i   // 0-indexed month, anchored to Dec 2025
    let y = 2025
    while (m < 0) { m += 12; y-- }
    dates.push(`${y}-${String(m + 1).padStart(2, '0')}-01`)
  }
  return dates
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seriesId = (searchParams.get('series') || '').toUpperCase()
  const n = Math.min(60, Math.max(1, parseInt(searchParams.get('n') || '24')))

  if (!seriesId || !/^[A-Z0-9_]{1,20}$/.test(seriesId)) {
    return NextResponse.json({ error: 'Invalid series' }, { status: 400 })
  }

  try {
    const dbRows = await getLatestObs(seriesId, n)
    if (dbRows.length > 0) {
      return NextResponse.json(
        { series: seriesId, obs: dbRows.map(r => ({ date: r.obs_date, value: r.value })), source: 'supabase' },
        { headers: { 'Cache-Control': 'public, s-maxage=300' } },
      )
    }
  } catch {
    // fall through to seed
  }

  const seedArr = SEED_24[seriesId]
  if (seedArr) {
    const sliced = seedArr.slice(-n)
    const dates  = seedDates(sliced.length)
    return NextResponse.json(
      { series: seriesId, obs: sliced.map((value, i) => ({ date: dates[i], value })), source: 'seed' },
      { headers: { 'Cache-Control': 'public, s-maxage=60' } },
    )
  }

  return NextResponse.json(
    { series: seriesId, obs: [], source: 'empty' },
    { headers: { 'Cache-Control': 'public, s-maxage=60' } },
  )
}
