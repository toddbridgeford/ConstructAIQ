export async function GET() {
  const key = process.env.FRED_API_KEY;
  const series = ["HOUST", "PERMIT", "TTLCONS", "LNS14000000"];

  const results = await Promise.all(
    series.map(id =>
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${key}&file_type=json&limit=24&sort_order=desc`)
        .then(r => r.json())
    )
  );

  return Response.json({ series: results, updated: new Date().toISOString() });
}
