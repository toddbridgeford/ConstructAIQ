# Operator Runbook

Day-to-day operations for ConstructAIQ. Audience is anyone with
admin access to the Vercel project — a developer is not required
for any procedure in this document.

For first-time launch setup (DNS, domain alias, env vars, smoke
tests), see [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md). This
runbook assumes launch setup has already passed.

---

## How to deploy

The canonical deploy is **a push to `main`**. Vercel auto-builds
on push and promotes the new build to Production once it reaches
the **Ready** state.

**Standard path (recommended):**

```bash
git checkout main
git pull
# … edits …
git commit -m "feat: …"
git push origin main
```

Vercel will build, run the configured CI checks, and ship.

**Alternative paths:**

| Trigger                       | When to use                                       |
|-------------------------------|---------------------------------------------------|
| Vercel CLI (`vercel --prod`)  | Hotfix from a clean checkout without merging.     |
| **Redeploy** in Vercel UI     | Re-run the existing build to pick up new env vars. Deployments → newest Production deployment → `…` → **Redeploy**. |
| Push a no-op `docs:` commit   | Simplest way to trigger a redeploy without using the Vercel UI. |

A new **environment variable** value does **not** become live until
the next deployment finishes — see
[`docs/ENVIRONMENT.md` § Vercel Production setup](./ENVIRONMENT.md#vercel-production-setup--generic-walkthrough).

---

## How to run launch checks

There is **one command** that runs the automatable checks. Use it
before every release sign-off, not just at first launch:

```bash
# Local — runs build + lint + tests; prints Gates 1–3 manual checks.
# Does NOT fail if production network is unavailable.
npm run launch:check

# CI / launch sign-off — also runs smoke:prod + smoke:www and fails
# if either fails. Requires outbound network access to constructaiq.trade.
npm run launch:check -- --include-smoke
```

For individual gates:

| Command                | What it covers                                                        |
|------------------------|-----------------------------------------------------------------------|
| `npm run build`        | Gate 5 — Next.js build is clean.                                      |
| `npm run lint`         | Gate 5 — ESLint clean.                                                |
| `npm test`             | Gate 5 — Vitest suite green.                                          |
| `npx playwright test`  | Gate 5 — e2e suite green (requires browser & network).                |
| `npm run smoke:prod`   | Gate 4 — live deployment serves expected pages and `/api/dashboard` shape. |
| `npm run smoke:www`    | Gate 4 — `www → apex` redirect chain.                                 |

Gates 1–3 are not fully automatable — they require a human looking
at Vercel UI / DNS / data freshness. Walk through
[LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) to verify them.

---

## How to interpret /api/status

`/api/status` is the launch-control panel. Three sections matter
for routine operations:

```bash
curl -s https://constructaiq.trade/api/status | jq '{env, data, runtime, freshness}'
```

### `env` — required infrastructure booleans

```json
{
  "supabaseConfigured":   true,
  "anthropicConfigured":  true,
  "upstashConfigured":    true,
  "sentryConfigured":     true,
  "cronSecretConfigured": true
}
```

Any `false` here is a launch blocker. Each maps directly to
Vercel env vars — see
[`docs/ENVIRONMENT.md` § Vercel Production setup](./ENVIRONMENT.md#vercel-production-setup--generic-walkthrough).

### `data` — live data state

```json
{
  "federalSource":     "usaspending.gov",
  "weeklyBriefSource": "ai"
}
```

| Field               | Healthy value      | Other states                                                            |
|---------------------|--------------------|-------------------------------------------------------------------------|
| `federalSource`     | `"usaspending.gov"` | `"static-fallback"` (cache stale > 24h, live fetch failing); `"unknown"` (Supabase query errored). |
| `weeklyBriefSource` | `"ai"`             | `"static-fallback"` (`ANTHROPIC_API_KEY` unset).                        |

For the deeper KPI shape check:

```bash
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data.dashboardShapeOk
# expected: true
```

`false` means at least one of TTLCONS / employment / permits has
zero observations in Supabase — usually a stalled data harvest.
Trigger the harvest cron (or wait for the next scheduled run).

### `runtime` — process context

```json
{ "nodeEnv": "production", "appUrl": "https://constructaiq.trade", "siteLocked": false }
```

`siteLocked: true` means Basic Auth is gating the site — fine for
soft launch, must be `false` before any public announcement.

### `freshness` — per-source last-updated

Any entry with `"status": "stale"` means data is more than 7 days
old. List them with:

```bash
curl -s https://constructaiq.trade/api/status | jq '.freshness | map(select(.status == "stale"))'
```

Persistent staleness usually means the harvest cron is failing or
the upstream API key is rotated/expired.

---

## How to roll back in Vercel

When a Production deploy is bad — UI broken, dashboard 500ing,
data pipeline corrupt — roll back to the previous good
deployment **before** debugging. A roll-back takes ~30 seconds
and stops bleeding.

1. <https://vercel.com/dashboard> → **ConstructAIQ** project.
2. **Deployments** tab.
3. Find the most recent deployment with a green **Production** badge
   that you remember being healthy. (The deployments list shows the
   commit message and timestamp.)
4. Click that deployment's `…` menu → **Promote to Production**.
5. Confirm.

Vercel re-aliases `constructaiq.trade` to the older build. Existing
serverless invocations will drain; new requests go to the older
build immediately.

**After rolling back:**

- Run `npm run smoke:prod` to confirm the older build is healthy on
  the live URL.
- Open the bad deployment's Function logs in Vercel and capture the
  error — this is the artifact you debug from.
- The bad commit is still on `main`. Decide: revert the commit and
  push, or fix-forward in a new commit. Either path triggers a fresh
  build that supersedes the rolled-back version.

> **Roll back first, debug second.** Do not edit the live deployment
> by toggling env vars in an attempt to "fix forward" before rolling
> back — that compounds the problem and makes the failure harder to
> reproduce.

---

## What to do if /dashboard shows a global error

The "Something went wrong" page is the React global error boundary
catching an unhandled exception during render. Two distinct causes:

### A. The page itself is broken

```bash
npm run smoke:prod
# Look for: ✗ GET /dashboard has no global error page
```

If the smoke script flags `/dashboard` specifically:

1. **Roll back** in Vercel (steps above) to stop bleeding.
2. Open the failing deployment's **Function logs** in Vercel for
   `/dashboard` — look for the first error stack with timestamp
   matching the failure.
3. Cross-reference with Sentry — events tagged `api_scope:dashboard`
   carry the same exception with the redacted context object
   attached.
4. Reproduce locally:
   ```bash
   git fetch origin
   git checkout <bad-deploy-sha>
   npm install
   npm run dev
   # open http://localhost:3000/dashboard
   ```
   The local error overlay will show the React component stack the
   production logs do not.

### B. A backing API failed and the page surface degraded ungracefully

Check `/api/dashboard` directly:

```bash
curl -s https://constructaiq.trade/api/dashboard | jq 'keys'
# expected: includes construction_spending, employment, permits,
#           cshi, forecast, signals, commodities, obs, fetched_at
```

If keys are missing, the route is the cause — not the dashboard
component. Triage:

| Missing key(s)                          | Likely cause                                    |
|-----------------------------------------|-------------------------------------------------|
| `construction_spending`, `employment`, `permits` | Supabase `observations` table empty or unreachable. Check `/api/status` `env.supabaseConfigured`. |
| `cshi`                                  | `computeCshi()` threw — see Sentry `api_scope:dashboard` and `api_scope:cshi`. |
| `forecast`                              | Forecast cron not run yet, or `runEnsemble` threw. Trigger `/api/cron/forecast`. |
| `commodities`                           | `/api/pricewatch` upstream (BLS or FRED) failing. Check `[pricewatch]` log lines. |

The shape contract is asserted by `npm run smoke:prod` — any drift
fails the smoke script before users ever see it, **provided the
script is run as part of the deploy ritual**.

### C. Sanity check before assuming the worst

Before any of the above, the cheapest possible diagnosis:

```bash
curl -s https://constructaiq.trade/api/status | jq '{env, data}'
```

If `env.supabaseConfigured` is `false`, no other troubleshooting
will help — fix the env var and redeploy first
([ENVIRONMENT.md walkthrough](./ENVIRONMENT.md#vercel-production-setup--generic-walkthrough)).

---

## Reference

| Doc                                                         | Use for                                                                          |
|-------------------------------------------------------------|----------------------------------------------------------------------------------|
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)                | Initial launch sign-off and every subsequent release.                            |
| [ENVIRONMENT.md](./ENVIRONMENT.md)                          | Adding, rotating, or troubleshooting Vercel env vars.                            |
| [PRODUCTION_SMOKE.md](./PRODUCTION_SMOKE.md)                | What `smoke:prod` / `smoke:www` actually check, and how to fix each failure.     |
| [STABILIZATION_REPORT.md](./STABILIZATION_REPORT.md)        | Pre-existing audit context — what was inherited vs. recently shipped.            |
