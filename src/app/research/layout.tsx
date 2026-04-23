import type { Metadata } from "next"

export const metadata: Metadata = {
  title:       'Construction Market Research — ConstructAIQ',
  description: 'Free US construction market data: spending, employment, permits, mortgage rates, and material costs. Updated daily from Census, BLS, and FRED. AI-generated weekly brief.',
  openGraph: {
    title:       'ConstructAIQ — Construction Market Snapshot',
    description: 'Free weekly construction intelligence brief and live market metrics: Census, BLS, FRED data updated daily.',
    url:         'https://constructaiq.trade/research',
    siteName:    'ConstructAIQ',
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       'ConstructAIQ — Construction Market Snapshot',
    description: 'Free US construction data: spending, permits, employment, and material costs. Updated daily.',
  },
}

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
