export async function GET() {
  const url = "https://api.usaspending.gov/api/v2/search/spending_by_award/";

  const body = {
    filters: {
      naics_codes: ["236","237","238"],
      time_period: [{ start_date: "2026-01-01", end_date: "2026-04-18" }],
      award_type_codes: ["A","B","C","D"]
    },
    fields: ["Award ID","Recipient Name","Award Amount","Place of Performance State Code","Description"],
    sort: "Award Amount",
    order: "desc",
    limit: 20,
    page: 1
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 3600 }
    });
    const data = await res.json();
    return Response.json({
      source: "USASpending.gov",
      series: "Federal Construction Contract Awards",
      awards: data.results ?? [],
      total: data.page_metadata?.total ?? 0,
      updated: new Date().toISOString()
    });
  } catch (e) {
    return Response.json({ error: "USASpending fetch failed", detail: String(e) }, { status: 500 });
  }
}
