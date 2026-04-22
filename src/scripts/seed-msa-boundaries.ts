import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

const MSAs = [
  { msa_code: 'NYC', msa_name: 'New York-Newark',        state_codes: ['NY','NJ','PA'], bbox_west: -74.26,  bbox_south: 40.49, bbox_east: -73.70,  bbox_north: 40.92 },
  { msa_code: 'LAX', msa_name: 'Los Angeles-Long Beach', state_codes: ['CA'],           bbox_west: -118.67, bbox_south: 33.70, bbox_east: -117.65, bbox_north: 34.34 },
  { msa_code: 'CHI', msa_name: 'Chicago-Naperville',     state_codes: ['IL','IN','WI'], bbox_west: -88.32,  bbox_south: 41.47, bbox_east: -87.52,  bbox_north: 42.15 },
  { msa_code: 'DFW', msa_name: 'Dallas-Fort Worth',      state_codes: ['TX'],           bbox_west: -97.65,  bbox_south: 32.55, bbox_east: -96.55,  bbox_north: 33.35 },
  { msa_code: 'HOU', msa_name: 'Houston-The Woodlands',  state_codes: ['TX'],           bbox_west: -95.82,  bbox_south: 29.52, bbox_east: -94.92,  bbox_north: 30.18 },
  { msa_code: 'PHX', msa_name: 'Phoenix-Mesa',           state_codes: ['AZ'],           bbox_west: -112.65, bbox_south: 33.22, bbox_east: -111.58, bbox_north: 33.92 },
  { msa_code: 'PHL', msa_name: 'Philadelphia',           state_codes: ['PA','NJ','DE'], bbox_west: -75.55,  bbox_south: 39.85, bbox_east: -74.95,  bbox_north: 40.14 },
  { msa_code: 'ATL', msa_name: 'Atlanta-Sandy Springs',  state_codes: ['GA'],           bbox_west: -84.90,  bbox_south: 33.35, bbox_east: -83.90,  bbox_north: 34.15 },
  { msa_code: 'MIA', msa_name: 'Miami-Fort Lauderdale',  state_codes: ['FL'],           bbox_west: -80.50,  bbox_south: 25.70, bbox_east: -80.05,  bbox_north: 26.35 },
  { msa_code: 'SEA', msa_name: 'Seattle-Tacoma',         state_codes: ['WA'],           bbox_west: -122.54, bbox_south: 47.15, bbox_east: -121.75, bbox_north: 47.85 },
  { msa_code: 'DEN', msa_name: 'Denver-Aurora',          state_codes: ['CO'],           bbox_west: -105.20, bbox_south: 39.55, bbox_east: -104.60, bbox_north: 39.95 },
  { msa_code: 'BOS', msa_name: 'Boston-Cambridge',       state_codes: ['MA','NH'],      bbox_west: -71.55,  bbox_south: 42.15, bbox_east: -70.75,  bbox_north: 42.55 },
  { msa_code: 'TPA', msa_name: 'Tampa-St. Petersburg',   state_codes: ['FL'],           bbox_west: -82.75,  bbox_south: 27.65, bbox_east: -82.15,  bbox_north: 28.15 },
  { msa_code: 'SAN', msa_name: 'San Diego-Chula Vista',  state_codes: ['CA'],           bbox_west: -117.35, bbox_south: 32.55, bbox_east: -116.90, bbox_north: 33.05 },
  { msa_code: 'LAS', msa_name: 'Las Vegas-Henderson',    state_codes: ['NV'],           bbox_west: -115.45, bbox_south: 35.95, bbox_east: -114.90, bbox_north: 36.40 },
  { msa_code: 'MSP', msa_name: 'Minneapolis-St. Paul',   state_codes: ['MN','WI'],      bbox_west: -93.65,  bbox_south: 44.75, bbox_east: -92.95,  bbox_north: 45.15 },
  { msa_code: 'ORL', msa_name: 'Orlando-Kissimmee',      state_codes: ['FL'],           bbox_west: -81.65,  bbox_south: 28.25, bbox_east: -81.05,  bbox_north: 28.75 },
  { msa_code: 'STL', msa_name: 'St. Louis',              state_codes: ['MO','IL'],      bbox_west: -90.65,  bbox_south: 38.45, bbox_east: -89.95,  bbox_north: 38.85 },
  { msa_code: 'CLT', msa_name: 'Charlotte-Concord',      state_codes: ['NC','SC'],      bbox_west: -81.05,  bbox_south: 35.05, bbox_east: -80.55,  bbox_north: 35.45 },
  { msa_code: 'AUS', msa_name: 'Austin-Round Rock',      state_codes: ['TX'],           bbox_west: -98.05,  bbox_south: 30.05, bbox_east: -97.45,  bbox_north: 30.55 },
]

async function main() {
  console.log(`Seeding ${MSAs.length} MSA boundaries...`)

  const { error } = await supabaseAdmin
    .from('msa_boundaries')
    .upsert(MSAs, { onConflict: 'msa_code' })

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`Done — ${MSAs.length} rows upserted.`)
}

main()
