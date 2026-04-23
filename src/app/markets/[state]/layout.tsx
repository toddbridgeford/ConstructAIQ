import { type Metadata } from 'next'
import { STATE_NAMES } from '@/lib/state-names'

export async function generateMetadata(
  { params }: { params: Promise<{ state: string }> }
): Promise<Metadata> {
  const { state } = await params
  const code  = state.toUpperCase()
  const name  = STATE_NAMES[code] ?? code

  return {
    title: `${name} Construction Market Intelligence — ConstructAIQ`,
    description:
      `Free ${name} construction market data: federal awards, ` +
      `building permits, employment, and satellite ground signals. ` +
      `Updated daily from Census, BLS, and USASpending.gov.`,
    openGraph: {
      title:       `${name} Construction Market — ConstructAIQ`,
      description: `${name} construction intelligence: ` +
        `federal pipeline, city permits, satellite activity, ` +
        `WARN Act filings. Free and updated daily.`,
      type: 'website',
    },
    alternates: {
      canonical: `/markets/${state.toLowerCase()}`,
    },
  }
}

export default function StateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
