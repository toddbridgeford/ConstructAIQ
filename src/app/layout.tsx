import type { Metadata, Viewport } from "next";
import "./globals.css";
import { InstallPrompt } from "@/app/components/InstallPrompt";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ConstructAIQ — Construction Market Intelligence",
  description: "AI-powered construction forecasting platform. 312 federal and state data sources unified into actionable market intelligence.",
  keywords: "construction forecasting, construction data, building permits, construction AI, market intelligence",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ConstructAIQ",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
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
    <html lang="en" className="fa">
      <body className="fa">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
