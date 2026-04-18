import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ConstructAIQ — AI Construction Market Intelligence',
  description:
    '312 federal and state data sources unified into forecasts economists and industry leaders can act on.',
  openGraph: {
    title: 'ConstructAIQ — AI Construction Market Intelligence',
    description:
      '312 federal and state data sources unified into forecasts economists and industry leaders can act on.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
