/**
 * Seeds initial Census Bureau construction data
 * Run with: npx tsx scripts/seed-census.ts
 */
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CENSUS_KEY = process.env.CENSUS_API_KEY!;

// Core series to seed first
const SERIES_CATALOG = [
  {
    id: "PERMITS-TOTAL-MONTHLY",
    name: "New Privately Owned Housing Units Authorized — Total",
    source: "Census Bureau",
    source_url: "https://www.census.gov/construction/bps/",
    units: "Thousands of Units, SAAR",
    frequency: "monthly",
    seasonal_adjustment: "SAAR",
    category: "permits",
  },
  {
    id: "HOUSING-STARTS-TOTAL",
    name: "New Privately Owned Housing Units Started — Total",
    source: "Census Bureau",
    units: "Thousands of Units, SAAR",
    frequency: "monthly",
    seasonal_adjustment: "SAAR",
    category: "starts",
  },
  {
    id: "CONSTRUCTION-SPEND-TOTAL",
    name: "Value of Construction Put in Place — Total",
    source: "Census Bureau",
    units: "Millions of Dollars, SAAR",
    frequency: "monthly",
    seasonal_adjustment: "SAAR",
    category: "spending",
  },
];

async function seedSeries() {
  console.log("Seeding series catalog...");
  const { error } = await supabase
    .from("series")
    .upsert(SERIES_CATALOG, { onConflict: "id" });
  if (error) console.error("Series seed error:", error);
  else console.log(`✓ Seeded ${SERIES_CATALOG.length} series`);
}

async function fetchCensusData() {
  console.log("Fetching Census data...");

  // Construction Spending API
  const url = `https://api.census.gov/data/timeseries/eits/vip?get=cell_value,time_slot_id&category_code=TOTAL&error_data=no&seasonally_adj=yes&key=${CENSUS_KEY}`;

  try {
    const res = await axios.get(url);
    const rows = res.data.slice(1); // skip header

    const observations = rows
      .map((row: string[]) => ({
        series_id: "CONSTRUCTION-SPEND-TOTAL",
        date: `${row[2]}-01`,
        value: parseFloat(row[0]),
        vintage_date: new Date().toISOString().split("T")[0],
      }))
      .filter((o: { value: number }) => !isNaN(o.value));

    const { error } = await supabase
      .from("observations")
      .upsert(observations, { onConflict: "series_id,date,vintage_date" });

    if (error) console.error("Observations error:", error);
    else console.log(`✓ Seeded ${observations.length} observations`);
  } catch (e) {
    console.error("Census fetch error:", e);
  }
}

async function main() {
  await seedSeries();
  await fetchCensusData();
  console.log("\n✓ Seed complete. Open Supabase to verify.");
}

main();
