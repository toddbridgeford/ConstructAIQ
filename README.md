# ConstructAIQ

Free US construction market intelligence platform.
Live at: https://constructaiq.trade

## What it does
Tracks 38+ government data sources and shows you:
- 12-month AI forecast for US construction spending
- Federal pipeline: every USASpending.gov construction award
- City permits: 40 major US cities, updated daily
- Satellite ground signal: Sentinel-2 BSI for 20 US markets
- WARN Act layoff notices for construction companies
- Construction cost estimates by building type
- Natural language queries: ask questions in plain English

## Branch structure (simple)
- **Predictive-Model** — the main branch. Vercel deploys from here.
- **main** — kept in sync with Predictive-Model.
- All work goes to Predictive-Model.

## Technology
Next.js 15 · Supabase (PostgreSQL) · Vercel · Anthropic Claude

## Environment setup
Copy .env.example to .env.local and fill in the 5 required keys.
See .env.example for a plain-English guide on what each key does.

## Data crons (run automatically on Vercel)
| Job | Schedule | What it does |
|-----|----------|-------------|
| /api/cron/permits | Daily 5am | Fetches permits from 40 cities |
| /api/cron/harvest | Daily 6am | Fetches government data (FRED, BLS, Census) |
| /api/cron/forecast | Daily 7am | Runs AI ensemble forecast |
| /api/cron/federal | Daily 8am | Refreshes USASpending federal awards |
| /api/cron/brief | Monday noon | Generates AI weekly brief |
| /api/cron/project-summaries | Sunday 10am | AI summaries for top projects |
| /api/cron/push-alerts | Every 30 min | Sends push notifications for major signals |

## Running locally
```
npm install
cp .env.example .env.local
# Fill in your values in .env.local
npm run dev
```
