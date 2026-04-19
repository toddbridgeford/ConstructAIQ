import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const ORIGIN  = isProd ? "https://constructaiq.trade" : "http://localhost:3000";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
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

export default nextConfig;
