export async function GET() {
  const key = process.env.CENSUS_API_KEY;
  const url = `https://api.census.gov/data/timeseries/eits/vip?get=cell_value,time_slot_id&category_code=TOTAL&error_data=no&seasonally_adj=yes&key=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 14400 } });
    const data = await res.json();
    return Response.json({ data, updated: new Date().toISOString() });
  } catch (e) {
    return Response.json({ error: "Census fetch failed", detail: String(e) }, { status: 500 });
  }
}
