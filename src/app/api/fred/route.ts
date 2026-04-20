export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const key    = process.env.FRED_API_KEY
  const series = ['HOUST', 'PERMIT', 'TTLCONS', 'LNS14000000']

  if (!key) {
    return Response.json(
      { error: 'FRED_API_KEY not configured' },
      { status: 503 },
    )
  }

  const results = await Promise.allSettled(
    series.map(id =>
      fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${key}&file_type=json&limit=24&sort_order=desc`,
        { signal: AbortSignal.timeout(8000) },
      ).then(r => {
        if (!r.ok) throw new Error(`FRED ${id} returned ${r.status}`)
        return r.json()
      })
    )
  )

  const data: Record<string, unknown> = {}
  results.forEach((r, i) => {
    data[series[i]] = r.status === 'fulfilled' ? r.value : null
  })

  return Response.json({ series: data, updated: new Date().toISOString() })
}
