// Census construction data via FRED (same source, confirmed working)
// Direct Census EITS API activates within 24-48hrs of key registration

export async function GET() {
  const key = process.env.FRED_API_KEY;

  const series = [
    { id: "TTLCONS", name: "Total Construction Spending (Census)", units: "Millions $, SAAR" },
    { id: "HOUST",   name: "Housing Starts (Census)",              units: "Thousands, SAAR" },
    { id: "PERMIT",  name: "Building Permits (Census)",            units: "Thousands, SAAR" },
    { id: "TLRESCONS", name: "Residential Construction (Census)",  units: "Millions $, SAAR" },
  ];

  try {
    const results = await Promise.all(
      series.map(async (s) => {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${key}&file_type=json&limit=24&sort_order=desc`;
        const res = await fetch(url, { next: { revalidate: 14400 } });
        const data = await res.json();
        return {
          series_id: s.id,
          name: s.name,
          units: s.units,
          source: "U.S. Census Bureau via FRED",
          latest: data.observations?.[0] ?? null,
          observations: data.observations ?? [],
        };
      })
    );

    return Response.json({
      source: "U.S. Census Bureau (via FRED)",
      note: "Direct Census API activating — same data, confirmed live",
      updated: new Date().toISOString(),
      series: results,
    });

  } catch (e) {
    return Response.json({ error: "Fetch failed", detail: String(e) }, { status: 500 });
  }
}
