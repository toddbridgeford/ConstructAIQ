import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Construction-relevant NWS event types
const CONSTRUCTION_EVENTS = [
  'Extreme Heat Warning','Excessive Heat Warning','Heat Advisory',
  'Freeze Warning','Frost Advisory','Hard Freeze Warning',
  'High Wind Warning','High Wind Advisory','Wind Advisory',
  'Dense Fog Advisory','Blizzard Warning','Winter Storm Warning',
  'Winter Storm Watch','Ice Storm Warning','Freezing Rain Advisory',
  'Flash Flood Warning','Flood Warning','Coastal Flood Advisory',
  'Fire Weather Watch','Red Flag Warning',
]

// State centroid lookup for geocoding alerts
const STATE_CENTROIDS: Record<string, [number, number]> = {
  AL:[32.8,-86.8],AK:[64.2,-153.4],AZ:[34.3,-111.1],AR:[34.9,-92.4],
  CA:[37.3,-119.6],CO:[39.0,-105.5],CT:[41.6,-72.7],DE:[39.0,-75.5],
  FL:[28.7,-82.5],GA:[32.7,-83.4],HI:[20.3,-156.4],ID:[44.4,-114.5],
  IL:[40.1,-89.2],IN:[40.3,-86.1],IA:[42.1,-93.2],KS:[38.5,-98.4],
  KY:[37.7,-84.9],LA:[31.2,-91.8],ME:[45.4,-69.2],MD:[39.1,-76.8],
  MA:[42.3,-71.8],MI:[44.3,-85.4],MN:[46.4,-93.2],MS:[32.7,-89.7],
  MO:[38.5,-92.5],MT:[47.0,-110.5],NE:[41.5,-99.9],NV:[38.5,-117.1],
  NH:[43.7,-71.6],NJ:[40.1,-74.6],NM:[34.4,-106.1],NY:[42.9,-75.5],
  NC:[35.6,-79.4],ND:[47.5,-100.5],OH:[40.4,-82.8],OK:[35.6,-97.5],
  OR:[44.1,-120.5],PA:[40.6,-77.2],RI:[41.7,-71.5],SC:[33.9,-81.1],
  SD:[44.4,-100.2],TN:[35.9,-86.7],TX:[31.5,-99.3],UT:[39.4,-111.1],
  VT:[44.1,-72.7],VA:[37.8,-78.2],WA:[47.4,-120.6],WV:[38.9,-80.5],
  WI:[44.3,-89.8],WY:[43.0,-107.6],
}

interface WeatherAlert {
  id:          string
  event:       string
  area:        string
  severity:    string
  description: string
  lat:         number
  lng:         number
  state:       string
  onset:       string
  expires:     string
}

function extractStateFromArea(area: string): string {
  // Try to match state abbreviation in parentheses or at end
  const match = area.match(/\b([A-Z]{2})\b/)
  if (match && STATE_CENTROIDS[match[1]]) return match[1]
  return 'TX' // fallback
}

export async function GET() {
  try {
    // Fetch active alerts - filter to US only
    const url = 'https://api.weather.gov/alerts/active?' +
      'status=actual&message_type=alert&urgency=Immediate,Expected,Future&' +
      'severity=Extreme,Severe,Moderate'

    const res = await fetch(url, {
      headers: { 'User-Agent': 'ConstructAIQ/3.0 hello@constructaiq.trade', 'Accept': 'application/geo+json' },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return NextResponse.json(getFallbackAlerts(), {
        headers: { 'Cache-Control': 'public, s-maxage=300' },
      })
    }

    type NwsFeature = { id: string; properties: Record<string, string>; geometry: { coordinates: number[] } | null }
    const data = await res.json()
    const features: NwsFeature[] = data?.features || []

    const alerts: WeatherAlert[] = features
      .filter(f => {
        const event = f.properties?.event || ''
        return CONSTRUCTION_EVENTS.some(e => event.includes(e.split(' ')[0]))
      })
      .slice(0, 80)
      .map(f => {
        const props   = f.properties || {}
        const areaDesc = props.areaDesc || ''
        const state   = extractStateFromArea(areaDesc)
        const centroid = STATE_CENTROIDS[state] || [39, -98]

        // Add jitter so overlapping state alerts spread out
        const lat = centroid[0] + (Math.random() - 0.5) * 3
        const lng = centroid[1] + (Math.random() - 0.5) * 4

        return {
          id:          f.id || '',
          event:       props.event || 'Weather Alert',
          area:        areaDesc.slice(0, 80),
          severity:    props.severity || 'Moderate',
          description: (props.description || '').slice(0, 300),
          lat, lng, state,
          onset:   props.onset   || '',
          expires: props.expires || '',
        }
      })
      .filter(a => !isNaN(a.lat) && !isNaN(a.lng))

    // Compute construction impact summary
    const extremeCount  = alerts.filter(a => a.severity === 'Extreme').length
    const severeCount   = alerts.filter(a => a.severity === 'Severe').length
    const impactLevel   = extremeCount > 5 ? 'HIGH' : severeCount > 10 ? 'MODERATE' : 'LOW'

    return NextResponse.json({
      source:    'NWS / api.weather.gov',
      count:     alerts.length,
      alerts,
      summary: {
        extreme:     extremeCount,
        severe:      severeCount,
        impactLevel,
        description: `${alerts.length} active construction-relevant weather alerts. ${extremeCount} extreme, ${severeCount} severe.`,
      },
      updated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' }, // 5 min cache
    })

  } catch (err) {
    console.error('[/api/weather]', err)
    return NextResponse.json(getFallbackAlerts(), {
      headers: { 'Cache-Control': 'public, s-maxage=300' },
    })
  }
}

function getFallbackAlerts() {
  const SAMPLE_EVENTS = [
    { event: 'Extreme Heat Warning', area: 'Maricopa County, AZ', state: 'AZ', severity: 'Extreme' },
    { event: 'High Wind Warning',    area: 'Wyoming Front Range',  state: 'WY', severity: 'Severe'  },
    { event: 'Freeze Warning',       area: 'Northern Minnesota',   state: 'MN', severity: 'Severe'  },
    { event: 'Flash Flood Warning',  area: 'Houston Metro, TX',    state: 'TX', severity: 'Extreme' },
    { event: 'Red Flag Warning',     area: 'Southern California',  state: 'CA', severity: 'Severe'  },
    { event: 'Dense Fog Advisory',   area: 'Pacific Northwest',    state: 'WA', severity: 'Moderate'},
  ]
  const alerts = SAMPLE_EVENTS.map((e, i) => {
    const c = STATE_CENTROIDS[e.state] || [39, -98]
    return { id: `fallback-${i}`, ...e, description: `${e.event} in effect. Construction activities may be impacted.`, lat: c[0]+(Math.random()-.5)*2, lng: c[1]+(Math.random()-.5)*3, onset: new Date().toISOString(), expires: new Date(Date.now()+86400000).toISOString() }
  })
  return { source: 'NWS fallback', count: alerts.length, alerts, summary: { extreme: 2, severe: 3, impactLevel: 'MODERATE', description: 'Sample weather alerts — live data from NWS when available.' }, updated: new Date().toISOString() }
}
