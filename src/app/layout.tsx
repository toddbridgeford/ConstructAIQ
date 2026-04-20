import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConstructAIQ — Construction Market Intelligence",
  description: "AI-powered construction forecasting platform. 312 federal and state data sources unified into actionable market intelligence.",
  keywords: "construction forecasting, construction data, building permits, construction AI, market intelligence",
  openGraph: {
    title: "ConstructAIQ",
    description: "AI-powered construction market intelligence platform",
    url: "https://constructaiq.trade",
    siteName: "ConstructAIQ",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
