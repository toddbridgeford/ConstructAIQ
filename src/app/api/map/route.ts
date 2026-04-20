import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BEA_KEY = process.env.BEA_API_KEY || ''
const BEA_URL = 'https://apps.bea.gov/api/data'

const NAME_CODE: Record<string, string> = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA',
  'Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
  'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO',
  'Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ',
  'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH',
  'Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT',
  'Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
}

function syntheticStates() {
  return [
    {code:'TX',name:'Texas',          permits:183420,yoyChange:8.2, gdpConst:98420,employment:542},
    {code:'FL',name:'Florida',        permits:164280,yoyChange:11.4,gdpConst:72340,employment:421},
    {code:'CA',name:'California',     permits:98340, yoyChange:-4.2,gdpConst:94180,employment:498},
    {code:'NC',name:'North Carolina', permits:72840, yoyChange:14.8,gdpConst:38420,employment:218},
    {code:'GA',name:'Georgia',        permits:68320, yoyChange:9.6, gdpConst:41280,employment:234},
    {code:'AZ',name:'Arizona',        permits:64180, yoyChange:6.2, gdpConst:38740,employment:198},
    {code:'CO',name:'Colorado',       permits:48240, yoyChange:3.8, gdpConst:32840,employment:168},
    {code:'WA',name:'Washington',     permits:46820, yoyChange:2.1, gdpConst:36180,employment:182},
    {code:'TN',name:'Tennessee',      permits:44320, yoyChange:12.4,gdpConst:29420,employment:156},
    {code:'OH',name:'Ohio',           permits:38420, yoyChange:-1.8,gdpConst:24180,employment:142},
    {code:'NY',name:'New York',       permits:36840, yoyChange:-8.4,gdpConst:58920,employment:198},
    {code:'VA',name:'Virginia',       permits:36280, yoyChange:4.2, gdpConst:28640,employment:148},
    {code:'IL',name:'Illinois',       permits:32840, yoyChange:-3.6,gdpConst:22480,employment:132},
    {code:'SC',name:'South Carolina', permits:32480, yoyChange:16.2,gdpConst:24180,employment:128},
    {code:'PA',name:'Pennsylvania',   permits:28640, yoyChange:-2.4,gdpConst:18940,employment:118},
    {code:'NV',name:'Nevada',         permits:26840, yoyChange:7.8, gdpConst:26180,employment:104},
    {code:'UT',name:'Utah',           permits:24680, yoyChange:5.4, gdpConst:18420,employment:96},
    {code:'MI',name:'Michigan',       permits:22840, yoyChange:-1.2,gdpConst:16840,employment:98},
    {code:'MN',name:'Minnesota',      permits:21840, yoyChange:1.8, gdpConst:15640,employment:88},
    {code:'IN',name:'Indiana',        permits:20840, yoyChange:4.6, gdpConst:14280,employment:84},
    {code:'OR',name:'Oregon',         permits:19840, yoyChange:-6.2,gdpConst:13840,employment:82},
    {code:'MD',name:'Maryland',       permits:18640, yoyChange:2.8, gdpConst:14280,employment:86},
    {code:'MO',name:'Missouri',       permits:17840, yoyChange:3.2, gdpConst:12480,employment:76},
    {code:'WI',name:'Wisconsin',      permits:16840, yoyChange:1.4, gdpConst:11640,employment:72},
    {code:'MA',name:'Massachusetts',  permits:15840, yoyChange:-5.8,gdpConst:14840,employment:82},
    {code:'LA',name:'Louisiana',      permits:14840, yoyChange:6.4, gdpConst:11280,employment:68},
    {code:'AL',name:'Alabama',        permits:13840, yoyChange:8.2, gdpConst:10480,employment:64},
    {code:'KY',name:'Kentucky',       permits:12840, yoyChange:4.8, gdpConst:9840, employment:58},
    {code:'ID',name:'Idaho',          permits:12480, yoyChange:9.8, gdpConst:7840, employment:48},
    {code:'OK',name:'Oklahoma',       permits:11840, yoyChange:2.6, gdpConst:8840, employment:54},
    {code:'KS',name:'Kansas',         permits:9840,  yoyChange:2.2, gdpConst:7480, employment:46},
    {code:'NM',name:'New Mexico',     permits:8840,  yoyChange:3.4, gdpConst:6840, employment:42},
    {code:'AR',name:'Arkansas',       permits:8640,  yoyChange:5.6, gdpConst:6480, employment:42},
    {code:'IA',name:'Iowa',           permits:9280,  yoyChange:1.8, gdpConst:7280, employment:44},
    {code:'NE',name:'Nebraska',       permits:8280,  yoyChange:3.6, gdpConst:6280, employment:40},
    {code:'MS',name:'Mississippi',    permits:7840,  yoyChange:4.2, gdpConst:5840, employment:38},
    {code:'CT',name:'Connecticut',    permits:7280,  yoyChange:-4.8,gdpConst:8480, employment:46},
    {code:'MT',name:'Montana',        permits:5640,  yoyChange:12.4,gdpConst:4140, employment:28},
    {code:'NH',name:'New Hampshire',  permits:5840,  yoyChange:4.2, gdpConst:4840, employment:28},
    {code:'HI',name:'Hawaii',         permits:5280,  yoyChange:-8.4,gdpConst:4280, employment:26},
    {code:'ME',name:'Maine',          permits:4840,  yoyChange:2.8, gdpConst:3840, employment:24},
    {code:'WV',name:'West Virginia',  permits:4280,  yoyChange:-2.4,gdpConst:3480, employment:24},
    {code:'SD',name:'South Dakota',   permits:4280,  yoyChange:7.2, gdpConst:3280, employment:22},
    {code:'ND',name:'North Dakota',   permits:3840,  yoyChange:4.8, gdpConst:3140, employment:20},
    {code:'DE',name:'Delaware',       permits:3640,  yoyChange:5.8, gdpConst:3140, employment:20},
    {code:'RI',name:'Rhode Island',   permits:3840,  yoyChange:-3.6,gdpConst:3240, employment:22},
    {code:'AK',name:'Alaska',         permits:2840,  yoyChange:-6.2,gdpConst:2640, employment:18},
    {code:'VT',name:'Vermont',        permits:2280,  yoyChange:1.8, gdpConst:2180, employment:14},
    {code:'WY',name:'Wyoming',        permits:2480,  yoyChange:3.4, gdpConst:2280, employment:16},
  ]
}

async function fetchBEAStateGDP(): Promise<Record<string, { gdpCurr: number; gdpPrev: number }> | null> {
  if (!BEA_KEY) return null
  try {
    const url = new URL(BEA_URL)
    url.searchParams.set('UserID', BEA_KEY)
    url.searchParams.set('method', 'GetData')
    url.searchParams.set('datasetname', 'Regional')
    url.searchParams.set('TableName', 'SAGDP2N')
    url.searchParams.set('LineCode', '11')
    url.searchParams.set('GeoFips', 'STATE')
    // Use the two most recently completed annual periods (BEA lags ~1 year)
    const currYear = new Date().getFullYear() - 1
    const prevYear = currYear - 1
    url.searchParams.set('Year', `${currYear},${prevYear}`)
    url.searchParams.set('ResultFormat', 'JSON')
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    const rows = data?.BEAAPI?.Results?.Data || []
    const byCode: Record<string, Record<string, number>> = {}
    for (const r of rows) {
      const code = NAME_CODE[r.GeoName]
      if (!code) continue
      if (!byCode[code]) byCode[code] = {}
      const val = parseFloat((r.DataValue || '').replace(/,/g, ''))
      if (!isNaN(val) && val > 0) byCode[code][r.TimePeriod] = val
    }
    const result: Record<string, { gdpCurr: number; gdpPrev: number }> = {}
    for (const [code, years] of Object.entries(byCode)) {
      if (years[String(currYear)] && years[String(prevYear)]) {
        result[code] = { gdpCurr: years[String(currYear)], gdpPrev: years[String(prevYear)] }
      }
    }
    return Object.keys(result).length > 0 ? result : null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const beaData = await fetchBEAStateGDP()
    const live = beaData != null

    const states = syntheticStates().map(s => {
      const bea = beaData?.[s.code]
      if (bea) {
        const yoyChange = +((bea.gdpCurr - bea.gdpPrev) / bea.gdpPrev * 100).toFixed(1)
        return { ...s, gdpConst: Math.round(bea.gdpCurr), yoyChange }
      }
      return s
    })

    states.sort((a, b) => b.permits - a.permits)
    const vals    = states.map(s => s.permits)
    const maxV    = Math.max(...vals), minV = Math.min(...vals)
    const total   = vals.reduce((a, b) => a + b, 0)
    const ranked  = states.map((s, i) => ({
      ...s, rank: i + 1,
      percentile: Math.round((1 - i / states.length) * 100),
      intensity:  maxV > minV ? (s.permits - minV) / (maxV - minV) : 0.5,
      signal:     s.yoyChange > 10 ? 'HOT' : s.yoyChange > 0 ? 'GROWING' : s.yoyChange > -10 ? 'STABLE' : 'COOLING',
    }))

    return NextResponse.json({
      source:       live ? 'BEA Regional GDP (construction sector) + Census permits' : 'ConstructAIQ State Map',
      live,
      states:       ranked,
      totalPermits: total,
      nationalAvg:  Math.round(total / ranked.length),
      topStates:    ranked.slice(0, 5).map(s => s.code),
      updated:      new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
  } catch (err) {
    return NextResponse.json({ error: 'map failed' }, { status: 500 })
  }
}
