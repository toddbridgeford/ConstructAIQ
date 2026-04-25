# Post-Launch Watch — First 24 Hours

Run this checklist the moment `npm run smoke:prod` exits 0 and traffic is
live on `constructaiq.trade`. Work top-to-bottom; do not skip ahead.

Related docs: [RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) ·
[OPERATOR_RUNBOOK.md](./OPERATOR_RUNBOOK.md) ·
[PRODUCTION_SMOKE.md](./PRODUCTION_SMOKE.md)

---

## First 15 minutes

These checks confirm the deployment landed cleanly and the minimum
required infrastructure is responding.

### 1. Smoke tests — must both exit 0

```bash
npm run smoke:prod
npm run smoke:www
```

Expected terminal lines:

```
✓ All checks passed     ← smoke:prod
✓ All checks passed     ← smoke:www
```

If either fails, **stop and trigger rollback** — see
[Rollback triggers](#rollback-triggers) below.

### 2. Env booleans — all five must be true

```bash
curl -s https://constructaiq.trade/api/status | jq .env
```

Expected:

```json
{
  "supabaseConfigured":   true,
  "anthropicConfigured":  true,
  "upstashConfigured":    true,
  "sentryConfigured":     true,
  "cronSecretConfigured": true
}
```

If `supabaseConfigured` or `cronSecretConfigured` is `false`, the dashboard
and data-refresh cron are broken. Fix the env var in Vercel and redeploy
before continuing.

### 3. Runtime context — confirm not locked

```bash
curl -s https://constructaiq.trade/api/status | jq .runtime
```

`siteLocked` must be `false`. `nodeEnv` must be `"production"`.

### 4. Vercel Function Logs — first scan

Open **Vercel dashboard → ConstructAIQ project → Deployments → latest
Production → Logs (Functions tab)**. Filter by the deployment timestamp.

Look for lines written by `src/lib/observability.ts`. The canonical scopes are:

| Scope | Route | Fires on |
|-------|-------|----------|
| `[dashboard]` | `/api/dashboard` | Aggregate failure or partial source error |
| `[federal]` | `/api/federal` | USASpending.gov fetch failure |
| `[weeklyBrief]` | `/api/weekly-brief` | Claude API error or missing key |
| `[status]` | `/api/status` | Supabase query failure |
| `[pricewatch]` | `/api/pricewatch` | BLS/FRED key missing or fetch failure |
| `[forecast]` | `/api/forecast` | Ensemble computation failure |
| `[cshi]` | `/api/cshi` | CSHI computation failure |

**Expected:** zero `ERROR` lines from any scope in the first 15 minutes of
traffic. `WARN` lines for optional missing keys (`[federal] USASpending fetch
skipped`) are acceptable if those keys were intentionally deferred.

---

## First hour

### 5. Data-source live status

```bash
curl -s https://constructaiq.trade/api/status | jq .data
```

Expected:

```json
{
  "federalSource":     "usaspending.gov",
  "weeklyBriefSource": "ai"
}
```

`"static-fallback"` on either field is acceptable only if the corresponding
key (`SAM_GOV_API_KEY` / `ANTHROPIC_API_KEY`) was intentionally deferred and
that decision was documented before launch.

### 6. Federal data is live

```bash
curl -s https://constructaiq.trade/api/federal \
  | jq '{dataSource, contractors: (.contractors|length), agencies: (.agencies|length)}'
```

Expected:

```json
{
  "dataSource":   "usaspending.gov",
  "contractors":  10,
  "agencies":     8
}
```

If `dataSource` is `"static-fallback"`, `contractors` and `agencies` will be
`0` — this is the explicit labeled fallback, not fabricated data. Check
`fetchError` for the underlying cause:

```bash
curl -s https://constructaiq.trade/api/federal | jq .fetchError
```

### 7. Weekly Brief is live

```bash
curl -s https://constructaiq.trade/api/weekly-brief \
  | jq '{source, live, configured}'
```

Expected after the first cron run (`/api/cron/brief`):

```json
{
  "source":     "ai",
  "live":       true,
  "configured": true
}
```

If `source` is `"static-fallback"`, check `env.anthropicConfigured` and
the `[weeklyBrief]` scope in Vercel Function Logs.

### 8. Dashboard shape

```bash
curl -s https://constructaiq.trade/api/dashboard \
  | jq '{fetched_at, cshi: (.cshi|type)}'
```

Expected:

```json
{
  "fetched_at": "2026-04-25T...",
  "cshi":       "object"
}
```

`cshi` must be `"object"` or `"null"` — never `"string"`. A string value
means the shape regression guard is failing.

For a full schema check:

```bash
npm run smoke:prod
```

### 9. Data freshness — target 0 stale series

```bash
curl -s https://constructaiq.trade/api/status \
  | jq '[.freshness[] | select(.status=="stale")] | length'
```

Expected: `0`. Any stale series should have a documented reason (source key
missing, source API down). Check `[harvest]` and `[forecast]` Vercel cron
logs for the last scheduled run.

### 10. Deep shape check

```bash
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data.dashboardShapeOk
```

Must be `true`. `false` means the `observations` table is missing one or
more KPI series (`TTLCONS`, `CES2000000001`, `PERMIT`). Trigger the harvest
cron manually if so:

```bash
curl -X POST https://constructaiq.trade/api/cron/harvest \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 11. Sentry — first-hour review

If `sentryConfigured` is `true`, open the Sentry project and filter to the
last hour.

- **Expected:** zero issues from `api_scope` tag in the first hour, unless
  a specific optional source was intentionally left unconfigured.
- **Flag immediately:** any `[dashboard]` or `[status]` Sentry event — these
  indicate Supabase connectivity or aggregation failures.
- **Acceptable:** a single `[weeklyBrief]` event if `ANTHROPIC_API_KEY` was
  not set (the fallback is explicit; the event is expected on first request).

---

## First 24 hours

### 12. Cron runs completed

ConstructAIQ runs two recurring crons. Verify both fired at least once in
the 24-hour window:

| Cron | Schedule | Route | What it updates |
|------|----------|-------|-----------------|
| Harvest | Defined in `vercel.json` | `/api/cron/harvest` | `observations` table — FRED, Census, BLS |
| Forecast | Defined in `vercel.json` | `/api/cron/forecast` | `forecasts` table — 12-month ensemble |

Check Vercel **Settings → Crons** to confirm each cron fired and shows
**Success**. If one failed, inspect Function Logs for that invocation.

### 13. Re-run full smoke suite

After 24 hours of traffic, re-run smoke to confirm no drift:

```bash
npm run smoke:prod
npm run smoke:www
```

### 14. Freshness re-check

```bash
curl -s https://constructaiq.trade/api/status \
  | jq '[.freshness[] | select(.status!="ok")] | .[] | {source: .label, status, last_updated}'
```

Any `"warn"` (2–7 days) or `"stale"` (>7 days) entries should be
investigated and documented.

### 15. API key registrations

Check for any early API key registrations in Supabase:

```sql
-- Run in Supabase SQL editor or via dashboard
SELECT COUNT(*), tier, created_at::date
FROM api_keys
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY tier, created_at::date;
```

### 16. End-of-day sign-off

At the close of the first day, confirm:

- [ ] Both smoke suites exit 0
- [ ] Zero critical Sentry events from `api_scope`
- [ ] `federalSource` is `"usaspending.gov"` (not `"static-fallback"`)
- [ ] `weeklyBriefSource` is `"ai"` (brief has been generated at least once)
- [ ] Both cron jobs show **Success** in Vercel
- [ ] Zero `"stale"` entries in freshness
- [ ] `dashboardShapeOk` is `true`

---

## Rollback triggers

Trigger an immediate rollback if any of the following occur. Do not wait
for a second occurrence — these are hard stops.

| Trigger | Signal | Action |
|---------|--------|--------|
| Homepage 5xx | `curl -sSo /dev/null -w "%{http_code}" https://constructaiq.trade/` returns `5xx` | Rollback now |
| Dashboard global error | `/dashboard` body contains `"Something went wrong"` or `"A rendering error occurred"` | Rollback now |
| `/api/dashboard` invalid shape | `smoke:prod` fails with a key-missing or type-mismatch check | Rollback now |
| Smoke failure post-deploy | `npm run smoke:prod` exits non-zero on any check other than `www DNS` | Rollback now |
| Sentry error burst | >10 new issues in any 5-minute window from a stable scope | Investigate; rollback if cause is unknown |
| `/api/status` returns non-200 | `curl -sSo /dev/null -w "%{http_code}" https://constructaiq.trade/api/status` returns non-200 | Rollback now |

### Rollback steps

1. Open **Vercel → ConstructAIQ → Deployments**.
2. Find the last **Ready** deployment before the regression.
3. Click `…` → **Promote to Production**.
4. Wait for the promotion to reach **Ready** state (~30 s).
5. Verify: `curl -sSo /dev/null -w "%{http_code}" https://constructaiq.trade/` → `200`.
6. Rerun: `npm run smoke:prod` — must exit 0 before declaring rollback complete.
7. Record the regressing SHA and the promoted SHA in an incident note.

Via CLI: `vercel rollback <deployment-url-or-id> --prod`

Last known-good code SHA: **`8c1cd98d`**. See
[RELEASE_CANDIDATE_REPORT.md § Rollback Procedure](./RELEASE_CANDIDATE_REPORT.md#rollback-procedure)
for the full procedure.

---

## Quick-reference command set

Copy this block at launch time and run in order:

```bash
# Gate check — both must exit 0
npm run smoke:prod
npm run smoke:www

# Env booleans
curl -s https://constructaiq.trade/api/status | jq .env

# Data sources
curl -s https://constructaiq.trade/api/status | jq .data

# Federal live data
curl -s https://constructaiq.trade/api/federal \
  | jq '{dataSource, contractors: (.contractors|length), agencies: (.agencies|length)}'

# Weekly Brief
curl -s https://constructaiq.trade/api/weekly-brief \
  | jq '{source, live, configured}'

# Dashboard shape
curl -s https://constructaiq.trade/api/dashboard \
  | jq '{fetched_at, cshi: (.cshi|type)}'

# Freshness — target 0 stale
curl -s https://constructaiq.trade/api/status \
  | jq '[.freshness[] | select(.status=="stale")] | length'

# Deep shape check
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data.dashboardShapeOk
```
