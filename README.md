# ConstructAIQ

Free US construction market intelligence platform.
Live at: https://constructaiq.trade

> **Launch status:** [docs/LAUNCH_NOW.md](./docs/LAUNCH_NOW.md)

## What it does
Tracks 38+ government data sources and shows you:
- 12-month AI forecast for US construction spending
- Federal pipeline: every USASpending.gov construction award
- City permits: 59 major US cities, updated daily
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

## Data refresh architecture

ConstructAIQ uses two separate scheduling systems:

**Vercel Cron** (vercel.json) — runs on every deployment:
| Job | Schedule | What it does |
|-----|----------|-------------|
| /api/cron/push-alerts | Daily 8am UTC | Sends push notifications for major signals |

**GitHub Actions** (.github/workflows/data-refresh.yml) —
daily at 6am UTC, manually triggerable:
| Step | Job | Cadence |
|------|-----|---------|
| 0 | Validate environment secrets | Every run |
| 1 | Harvest government data (FRED, BLS, Census) | Daily |
| 2 | Run ensemble forecast models | Daily |
| 3 | Refresh federal awards (USASpending) | Daily |
| 4 | Fetch SAM.gov solicitations | Daily |
| 5 | Fetch city permits (59 cities) | Daily |
| 6 | Generate AI weekly brief | Mondays only |
| 7 | Send newsletter | Mondays only |
| 8 | Generate project summaries | Sundays only |
| 9 | Evaluate prediction outcomes (PAR) | Wednesdays only |
| 10 | Compute project formation scores | Daily |
| 11 | Compute reality gap scores | Daily |
| 12 | Compute opportunity scores | Daily |

**Required GitHub Actions secrets:**
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`CRON_SECRET`

**Required Vercel environment variables:**
See .env.example — the 5 required keys are at the top.

## Running locally
```
npm install
cp .env.example .env.local
# Fill in your values in .env.local
npm run dev
```

## Launch readiness

Before declaring a release "launch-ready" — public announcement, DNS
cutover, paid-traffic ramp — walk through
[`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md). It groups the
gates into Domain/DNS, Environment, Data integrity, Smoke tests, and
Build/test. The automatable parts run with:

```bash
npm run launch:check                  # build + lint + tests, prints manual gates
npm run launch:check -- --include-smoke   # also runs smoke:prod and smoke:www
```

Other operational docs:
- [`docs/OPERATOR_HANDOFF.md`](docs/OPERATOR_HANDOFF.md) — **current
  launch verdict and next manual action** (start here if handing off
  to ops).
- [`docs/PRODUCTION_SMOKE.md`](docs/PRODUCTION_SMOKE.md) — what the
  smoke checks cover, www failure modes, and the exact Vercel UI +
  DNS steps to fix each one.
- [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) — runtime env vars
  whose absence silently degrades a feature (currently
  `ANTHROPIC_API_KEY` for the Weekly Brief).
- [`docs/STABILIZATION_REPORT.md`](docs/STABILIZATION_REPORT.md) —
  audit baseline / pre-existing risks.

## Triggering a manual data refresh

From GitHub → Actions → "Daily Data Refresh" →
"Run workflow" → choose a specific job or "all".

Or via curl (requires CRON_SECRET):
```
curl -X GET https://constructaiq.trade/api/cron/harvest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
