# ConstructAIQ

**The Bloomberg Terminal for Construction**

[![CI](https://github.com/toddbridgeford/ConstructAIQ/actions/workflows/ci.yml/badge.svg)](https://github.com/toddbridgeford/ConstructAIQ/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)

Real-time construction market intelligence platform that aggregates 10+ government data sources and runs a 3-model AI ensemble forecast for spending, employment, permits, and housing starts.

---

## What It Is

ConstructAIQ pulls live data from FRED, Census Bureau, BLS, BEA, EIA, and USASpending, normalizes it into a unified time-series store, and surfaces it through a forecasting dashboard and REST API. The forecast engine combines Holt-Winters exponential smoothing, SARIMA, and XGBoost into an ensemble whose weights are determined by inverse MAPE on in-sample data (trained on ~60 monthly observations). The result is a 12-month forward projection with 80% and 95% confidence intervals.

The platform is built for construction economists, contractors, real estate investors, and analysts who need high-frequency market signals — not quarterly PDF reports.

---

## Features

- **12-month ensemble forecast** — Holt-Winters + SARIMA + XGBoost with 80%/95% confidence intervals
- **Anomaly detection** — Z-score alerts and trend reversal signals on all tracked series
- **State heatmap** — Construction activity by state, powered by Census permit data
- **Commodity price watch** — Lumber, steel, concrete, and copper price tracking
- **News aggregation** — Live feed from ENR, Construction Dive, NAHB, and AGC
- **Scenario builder** — Model the impact of rate shocks, IIJA funding changes, and labor/material cost shifts
- **REST API** — Tiered key access (Starter / Professional / Enterprise) with RPM + RPD enforcement
- **CSV export** — Download any series at `/api/export`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, React 18, TypeScript 5 |
| Database | Supabase (PostgreSQL) |
| Rate limiting | Upstash Redis |
| Error monitoring | Sentry |
| Deployment | Vercel |
| Testing | Vitest |
| Charts | Recharts |

---

## Quick Start

```bash
git clone https://github.com/toddbridgeford/ConstructAIQ
cd ConstructAIQ
cp .env.example .env.local
# Fill in required environment variables (see below)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app. The dashboard is at `/dashboard`; pricing is at `/pricing`.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values. Full descriptions are inline in `.env.example`.

**Required:**

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `FRED_API_KEY` | https://fred.stlouisfed.org/docs/api/api_key.html |
| `CENSUS_API_KEY` | https://api.census.gov/data/key_signup.html |
| `BLS_API_KEY` | https://www.bls.gov/developers/ |
| `BEA_API_KEY` | https://apps.bea.gov/api/signup/ |
| `EIA_API_KEY` | https://www.eia.gov/opendata/ |
| `CRON_SECRET` | Any long random string — protects `/api/cron/*` |

**Optional:**

| Variable | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Enables real-time RPM/RPD enforcement. Without it, rate limits are tracked in the DB but not enforced at request time. |
| `UPSTASH_REDIS_REST_TOKEN` | Required with `UPSTASH_REDIS_REST_URL` |
| `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring. Sentry is silently disabled if unset. |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project name |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (default: `https://constructaiq.trade`) |

---

## Database Setup

The schema is idempotent — safe to run against an existing database.

```bash
# Apply schema to your Supabase project
psql "$DATABASE_URL" -f schema.sql

# Seed initial series catalog and observations
npx tsx scripts/seed-census.ts
```

You can also paste `schema.sql` directly into the Supabase SQL editor.

---

## API Reference

All data endpoints accept an optional `X-Api-Key` header. Requests without a key are subject to anonymous rate limits.

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/forecast?series=TTLCONS` | Optional | 12-month ensemble forecast with confidence intervals |
| `GET /api/census` | Optional | Construction spending (Census Bureau) |
| `GET /api/bls` | Optional | Employment data (BLS) |
| `GET /api/rates` | Optional | Interest rates (FRED) |
| `GET /api/signals` | Optional | Anomaly detection and trend reversal signals |
| `GET /api/news` | Optional | Aggregated construction industry news |
| `GET /api/map` | Optional | State-level permit data |
| `GET /api/pricewatch` | Optional | Commodity prices (lumber, steel, concrete, copper) |
| `GET /api/export?series=TTLCONS` | Public | Download series as CSV |
| `POST /api/keys/issue` | Public | Issue an API key |
| `GET /api/status` | Public | Health check |

### Issuing an API Key

```bash
curl -X POST https://constructaiq.trade/api/keys/issue \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","plan":"starter"}'
```

The response includes your key. **Store it immediately — it is shown once and never stored in plaintext.**

```json
{
  "success": true,
  "key": "caiq_...",
  "prefix": "caiq_xxxxxxxx",
  "plan": "starter",
  "limits": { "requestsPerMinute": 60, "requestsPerDay": 1000 },
  "warning": "Store this key securely. It will not be shown again."
}
```

### Using Your Key

```bash
curl https://constructaiq.trade/api/forecast?series=TTLCONS \
  -H "X-Api-Key: caiq_your_key_here"
```

---

## Plans

| Plan | Requests/min | Requests/day | Price |
|---|---|---|---|
| Starter | 60 | 1,000 | $490/mo |
| Professional | 300 | 10,000 | $1,490/mo |
| Enterprise | 1,000 | 100,000 | Custom |

See `/pricing` for details.

---

## Development

```bash
npm run dev      # Start development server (http://localhost:3000)
npm test         # Run test suite (Vitest, 18 tests)
npm run lint     # ESLint
npx tsc --noEmit # Type check without emitting
```

---

## CI

Every push to `main` and every pull request targeting `main` runs the full pipeline via `.github/workflows/ci.yml`:

1. Type check (`npx tsc --noEmit`)
2. Lint (`npm run lint`)
3. Tests (`npm test`)

The pipeline runs on Node.js 20.

---

## Deployment (Vercel)

1. Connect your fork to a new Vercel project.
2. Add all variables from `.env.example` in the Vercel environment settings.
3. Deploy. Routing is handled by `vercel.json`.

Vercel cron jobs call `/api/cron/*` endpoints using `Authorization: Bearer <CRON_SECRET>` to refresh data on schedule.

---

## Architecture — Forecast Ensemble

The forecast engine runs three independent models against each series:

- **Holt-Winters** — captures level, trend, and seasonality via triple exponential smoothing
- **SARIMA** — handles non-stationary seasonal time series
- **XGBoost** — gradient-boosted trees on engineered lag/calendar features

Ensemble weights are computed as inverse MAPE on in-sample holdout data, so models that performed better on recent history receive proportionally more weight. All three models are trained on approximately 60 monthly observations (~5 years). The final output is a blended 12-month point forecast plus 80% and 95% prediction intervals.

---

## Database Schema (overview)

| Table | Purpose |
|---|---|
| `series` | Catalog of tracked data series (FRED, Census, BLS, etc.) |
| `observations` | Time-series data points for each series |
| `api_keys` | Hashed API keys with plan/rate-limit metadata |

Full schema: [`schema.sql`](./schema.sql)

---

## License

Private — all rights reserved. Not licensed for redistribution.
