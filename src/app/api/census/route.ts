export async function GET() {
  const key = process.env.FRED_API_KEY;

  // Total Construction Spending — Census Bureau via FRED
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=TTLCONS&api_key=${key}&file_type=json&limit=24&sort_order=desc`;

  const res = await fetch(url);
  const data = await res.json();

  return Response.json({
    source: "U.S. Census Bureau via FRED",
    series: "Total Construction Put in Place (TTLCONS)",
    units: "Millions of Dollars, SAAR",
    latest: data.observations?.[0] ?? null,
    observations: data.observations ?? [],
    updated: new Date().toISOString()
  });
}
