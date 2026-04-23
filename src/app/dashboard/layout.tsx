import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Construction Intelligence Dashboard — ConstructAIQ',
  description: '12-month AI forecast, live materials signals, permit activity, and anomaly alerts for the US construction economy.',
  openGraph: {
    title:       'Construction Intelligence Dashboard — ConstructAIQ',
    description: '12-month AI forecast, live materials signals, permit activity, and anomaly alerts for the US construction economy.',
    url:         'https://constructaiq.trade/dashboard',
    siteName:    'ConstructAIQ',
    images: [
      {
        url:    'https://constructaiq.trade/api/og/dashboard',
        width:  1200,
        height: 630,
        alt:    'ConstructAIQ Dashboard',
      },
    ],
    type: 'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Construction Intelligence Dashboard — ConstructAIQ',
    description: '12-month AI forecast, live materials signals, permit activity, and anomaly alerts for the US construction economy.',
    images:      ['https://constructaiq.trade/api/og/dashboard'],
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
