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
  {
    city_code:   'SEA',
    city_name:   'Seattle',
    state_code:  'WA',
    msa_code:    'SEA',
    api_url:     'https://data.seattle.gov/resource/uyyd-8znb.json',
    api_dataset: 'uyyd-8znb',
  },
  {
    city_code:   'DEN',
    city_name:   'Denver',
    state_code:  'CO',
    msa_code:    'DEN',
    api_url:     'https://www.denvergov.org/resource/5rm3-jnck.json',
    api_dataset: '5rm3-jnck',
  },
  {
    city_code:   'NSH',
    city_name:   'Nashville',
    state_code:  'TN',
    msa_code:    'NSH',
    api_url:     'https://data.nashville.gov/resource/3h5a-yzac.json',
    api_dataset: '3h5a-yzac',
  },
  {
    city_code:   'CLT',
    city_name:   'Charlotte',
    state_code:  'NC',
    msa_code:    'CLT',
    api_url:     'https://data.charlottenc.gov/resource/7ubx-kwcq.json',
    api_dataset: '7ubx-kwcq',
  },
  {
    city_code:   'TPA',
    city_name:   'Tampa',
    state_code:  'FL',
    msa_code:    'TPA',
    api_url:     'https://data.tampagov.net/resource/bt5m-5x2w.json',
    api_dataset: 'bt5m-5x2w',
  },
  {
    city_code:   'ATL',
    city_name:   'Atlanta',
    state_code:  'GA',
    msa_code:    'ATL',
    api_url:     'https://opendata.atlantaga.gov/resource/7whg-z7gh.json',
    api_dataset: '7whg-z7gh',
  },
  {
    city_code:   'MIA',
    city_name:   'Miami',
    state_code:  'FL',
    msa_code:    'MIA',
    api_url:     'https://opendata.miamidade.gov/resource/nd95-9i4k.json',
    api_dataset: 'nd95-9i4k',
  },
  {
    city_code:   'POR',
    city_name:   'Portland',
    state_code:  'OR',
    msa_code:    'POR',
    api_url:     'https://opendata.portland.gov/resource/yqhr-rigj.json',
    api_dataset: 'yqhr-rigj',
  },
  {
    city_code:   'MIN',
    city_name:   'Minneapolis',
    state_code:  'MN',
    msa_code:    'MSP',
    api_url:     'https://opendata.minneapolismn.gov/resource/m7ck-g2m4.json',
    api_dataset: 'm7ck-g2m4',
  },
  {
    city_code:   'STL',
    city_name:   'St. Louis',
    state_code:  'MO',
    msa_code:    'STL',
    api_url:     'https://www.stlouis-mo.gov/data/resource/e53e-vs4i.json',
    api_dataset: 'e53e-vs4i',
  },
  {
    city_code:   'KCY',
    city_name:   'Kansas City',
    state_code:  'MO',
    msa_code:    'KCY',
    api_url:     'https://data.kcmo.org/resource/2s8e-ux9b.json',
    api_dataset: '2s8e-ux9b',
  },
  {
    city_code:   'ORL',
    city_name:   'Orlando',
    state_code:  'FL',
    msa_code:    'ORL',
    api_url:     'https://data.cityoforlando.net/resource/ryhf-vc9f.json',
    api_dataset: 'ryhf-vc9f',
  },
  {
    city_code:   'LVG',
    city_name:   'Las Vegas',
    state_code:  'NV',
    msa_code:    'LAS',
    api_url:     'https://opendata.lasvegasnevada.gov/resource/kk4g-4ygm.json',
    api_dataset: 'kk4g-4ygm',
  },
  {
    city_code:   'RAL',
    city_name:   'Raleigh',
    state_code:  'NC',
    msa_code:    'RAL',
    api_url:     'https://data.raleighnc.gov/resource/ms6c-t5fm.json',
    api_dataset: 'ms6c-t5fm',
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
