import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")

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
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=(), push=()" },
          {
            key:   "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key:   "Content-Security-Policy",
            // Tight policy: self + CDN sources used in the product
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' unpkg.com cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: raw.githubusercontent.com unpkg.com",
              "connect-src 'self' https://*.supabase.co https://api.weather.gov https://earthquake.usgs.gov https://api.stlouisfed.org https://api.eia.gov https://api.bls.gov https://apps.bea.gov https://api.usaspending.gov https://api.sam.gov https://data.sec.gov https://api.census.gov https://sentry.io https://*.sentry.io https://unpkg.com",
              "font-src 'self' data:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        // Embed pages — allow iframing on any third-party domain.
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          {
            key:   "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://*.supabase.co https://api.stlouisfed.org https://api.eia.gov https://api.bls.gov https://apps.bea.gov https://api.usaspending.gov https://api.sam.gov https://api.census.gov https://sentry.io https://*.sentry.io",
              "font-src 'self' data:",
              "frame-ancestors *",
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
      // www must also be configured as a Vercel project domain and DNS CNAME for this redirect to execute.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.constructaiq.trade" }],
        destination: "https://constructaiq.trade/:path*",
        permanent: true,
      },
    ];
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !isProd,
  fallbacks: {
    document: "/offline.html",
    image:    "/icons/icon-192.png",
    audio:    "",
    video:    "",
    font:     "",
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/constructaiq\.trade\/api\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:woff2?|ttf|otf)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "font-cache",
        expiration: { maxEntries: 16, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/constructaiq\.trade\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "page-cache",
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
})(nextConfig);

export default withSentryConfig(pwaConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: { disable: false },
  disableLogger: true,
  automaticVercelMonitors: true,
})
