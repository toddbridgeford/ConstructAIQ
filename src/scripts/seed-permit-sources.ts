import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

const SOURCES = [
  {
    city_code:   'NYC',
    city_name:   'New York City',
    state_code:  'NY',
    msa_code:    'NYC',
    api_url:     'https://data.cityofnewyork.us/resource/ipu4-2q9a.json',
    api_dataset: 'ipu4-2q9a',
  },
  {
    city_code:   'LAX',
    city_name:   'Los Angeles',
    state_code:  'CA',
    msa_code:    'LAX',
    api_url:     'https://data.lacity.org/resource/nbyu-2ha9.json',
    api_dataset: 'nbyu-2ha9',
  },
  {
    city_code:   'CHI',
    city_name:   'Chicago',
    state_code:  'IL',
    msa_code:    'CHI',
    api_url:     'https://data.cityofchicago.org/resource/ydr8-5enu.json',
    api_dataset: 'ydr8-5enu',
  },
  {
    city_code:   'HOU',
    city_name:   'Houston',
    state_code:  'TX',
    msa_code:    'HOU',
    api_url:     'https://opendata.houstontx.gov/resource/fwfs-d8d8.json',
    api_dataset: 'fwfs-d8d8',
  },
  {
    city_code:   'PHX',
    city_name:   'Phoenix',
    state_code:  'AZ',
    msa_code:    'PHX',
    api_url:     'https://www.phoenixopendata.com/resource/5k9d-pqgx.json',
    api_dataset: '5k9d-pqgx',
  },
  {
    city_code:   'SAN',
    city_name:   'San Antonio',
    state_code:  'TX',
    msa_code:    'SAN',
    api_url:     'https://data.sanantonio.gov/resource/7xgn-7xn5.json',
    api_dataset: '7xgn-7xn5',
  },
  {
    city_code:   'DAL',
    city_name:   'Dallas',
    state_code:  'TX',
    msa_code:    'DFW',
    api_url:     'https://www.dallasopendata.com/resource/ykcy-kq9p.json',
    api_dataset: 'ykcy-kq9p',
  },
  {
    city_code:   'JAX',
    city_name:   'Jacksonville',
    state_code:  'FL',
    msa_code:    'JAX',
    api_url:     'https://data.coj.net/resource/da2u-bq2k.json',
    api_dataset: 'da2u-bq2k',
  },
  {
    city_code:   'AUS',
    city_name:   'Austin',
    state_code:  'TX',
    msa_code:    'AUS',
    api_url:     'https://data.austintexas.gov/resource/3syk-w9eu.json',
    api_dataset: '3syk-w9eu',
  },
  {
    city_code:   'COL',
    city_name:   'Columbus',
    state_code:  'OH',
    msa_code:    'COL',
    api_url:     'https://opendata.columbus.gov/resource/wmq3-6nbv.json',
    api_dataset: 'wmq3-6nbv',
  },
  {
    city_code:   'IND',
    city_name:   'Indianapolis',
    state_code:  'IN',
    msa_code:    'IND',
    api_url:     'https://data.indy.gov/resource/ufhp-wqr6.json',
    api_dataset: 'ufhp-wqr6',
  },
  {
    city_code:   'SJC',
    city_name:   'San Jose',
    state_code:  'CA',
    msa_code:    'SJC',
    api_url:     'https://data.sanjoseca.gov/resource/fp5k-rk6n.json',
    api_dataset: 'fp5k-rk6n',
  },
]

async function main() {
  console.log(`Seeding ${SOURCES.length} permit sources...`)

  const { error } = await supabaseAdmin
    .from('permit_sources')
    .upsert(SOURCES, { onConflict: 'city_code' })

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`Done — ${SOURCES.length} rows upserted into permit_sources.`)
}

main()
