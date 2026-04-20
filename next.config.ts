import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const isProd = process.env.NODE_ENV === "production";
const ORIGIN  = isProd ? "https://constructaiq.trade" : "http://localhost:3000";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Security headers on all responses
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
          {
            key:   "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key:   "Content-Security-Policy",
            // Tight policy: self + CDN sources used in the product
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' unpkg.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: raw.githubusercontent.com unpkg.com",
              "connect-src 'self' https://*.supabase.co https://api.weather.gov https://earthquake.usgs.gov https://api.stlouisfed.org https://api.eia.gov https://api.bls.gov https://apps.bea.gov https://api.usaspending.gov https://data.sec.gov https://api.census.gov https://sentry.io https://*.sentry.io https://unpkg.com",
              "font-src 'self' data:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        // CORS for API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin",  value: ORIGIN },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, X-API-Key" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "www.constructaiq.trade" }],
        destination: "https://constructaiq.trade",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: { disable: false },
  disableLogger: true,
  automaticVercelMonitors: true,
})
