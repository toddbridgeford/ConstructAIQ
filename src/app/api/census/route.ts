export async function GET() {
  const key = process.env.CENSUS_API_KEY;

  // Building Permits Survey — most reliable Census construction endpoint
  const url = `https://api.census.gov/data/timeseries/eits/bps?get=cell_value,time_slot_id,category_code&category_code=TOT&error_data=no&key=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 14400 } });
    const text = await res.text();

    // Census returns text errors — check before parsing
    if (text.startsWith("error") || text.startsWith("<")) {
      return Response.json({
        error: "Census API error",
        detail: text.slice(0, 200),
        url_used: url.replace(key!, "REDACTED")
      }, { status: 502 });
    }

    const data = JSON.parse(text);
    return Response.json({
      source: "Census Bureau — Building Permits Survey",
      series: "Total Building Permits",
      observations: data.slice(1, 25), // skip header row
      updated: new Date().toISOString()
    });

  } catch (e) {
    return Response.json({
      error: "Census fetch failed",
      detail: String(e)
    }, { status: 500 });
  }
}
