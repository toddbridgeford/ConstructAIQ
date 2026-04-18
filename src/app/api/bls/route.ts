export async function GET() {
  const res = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seriesid: ["CES2000000001", "PRS30006092", "PCU2362--2362--"],
      startyear: "2023",
      endyear: "2026",
      registrationkey: process.env.BLS_API_KEY
    })
  });
  const data = await res.json();
  return Response.json({ data, updated: new Date().toISOString() });
}
