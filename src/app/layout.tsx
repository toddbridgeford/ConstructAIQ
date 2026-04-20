import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });
const dmSans    = DM_Sans({ subsets: ["latin"], weight: ["300","400","500","600"], variable: "--font-dm-sans" });
const ibmMono   = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400","500"], variable: "--font-ibm-mono" });

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable} ${ibmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
