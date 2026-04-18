export async function GET() {
  const key = process.env.CENSUS_API_KEY;
  const url = `https://api.census.gov/data/timeseries/eits/vip?get=cell_value,time_slot_id,category_code&category_code=TOTAL&seasonally_adj=yes&key=${key}&limit=24`;

  const res = await fetch(url, { next: { revalidate: 14400 } });
  const data = await res.json();

  return Response.json({ data, updated: new Date().toISOString() });
}
