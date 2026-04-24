import { headers } from 'next/headers'
import { color, font } from '@/lib/theme'
import OpportunityIndexClient from './components/OpportunityIndexClient'
import type { OpportunityIndexResponse } from '@/app/api/opportunity-index/route'

export const dynamic            = 'force-dynamic'
export const revalidate         = 1800  // 30 min — aligns with API cache TTL
export const metadata = {
  title: 'Opportunity Index — ConstructAIQ',
  description:
    'Formation Score, Reality Gap, 90-day spend release, and signal drivers ' +
    'for 40+ tracked construction metros.',
}

async function fetchIndex(): Promise<OpportunityIndexResponse | null> {
  try {
    const headersList = await headers()
    const host        = headersList.get('host') ?? 'localhost:3000'
    const protocol    = host.startsWith('localhost') ? 'http' : 'https'

    const res = await fetch(`${protocol}://${host}/api/opportunity-index`, {
      next: { revalidate: 1800 },
    })

    if (!res.ok) return null
    return res.json() as Promise<OpportunityIndexResponse>
  } catch {
    return null
  }
}

export default async function OpportunityIndexPage() {
  const data = await fetchIndex()

  if (!data) {
    return (
      <main style={{
        minHeight: '100vh', background: color.bg0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: font.mono, color: color.t3, fontSize: 13,
      }}>
        Failed to load opportunity index — check Supabase connection and run the crons.
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: color.bg0,
      padding: '32px 24px 80px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <OpportunityIndexClient data={data} />
      </div>
    </main>
  )
}
