# Production Smoke Test

`scripts/smoke-prod.mjs` runs a lightweight set of HTTP checks against a live
deployment to catch "build READY but website broken" failures that unit tests
and e2e suites cannot detect.

---

## Running it

```bash
# Against production
npm run smoke:prod

# Against a preview deployment
node scripts/smoke-prod.mjs https://my-branch.vercel.app
```

The script exits 0 on success, 1 on any failure.

---

## When to run

| Trigger | Command |
|---|---|
| After merging to main (post-deploy) | `npm run smoke:prod` |
| After a preview deployment | `node scripts/smoke-prod.mjs <preview-url>` |
| After changing `/api/dashboard` response shape | `npm run smoke:prod` |
| After changing `next.config.ts` redirects | `npm run smoke:prod` |
| Verifying a new Vercel domain/DNS setting | `npm run smoke:prod` |

---

## Checks performed

| Check | Pass condition |
|---|---|
| `GET /` | HTTP 200, body does not contain "Something went wrong" |
| `GET /dashboard` | HTTP 200, body does not contain "Something went wrong" |
| `GET /api/status` | HTTP 200 |
| `GET /api/dashboard` | HTTP 200 and valid JSON |
| `/api/dashboard` shape | All required keys present |
| `signals` field | Is an array |
| `commodities` field | Is an array |
| `cshi` field | Is object or null (not a primitive string) |
| www redirect | `www.constructaiq.trade/dashboard` → 301/302 → `constructaiq.trade/dashboard` |

Required `/api/dashboard` keys: `construction_spending`, `employment`, `permits`,
`cshi`, `forecast`, `signals`, `commodities`, `obs`, `fetched_at`.

---

## Expected output (all passing)

```
ConstructAIQ production smoke test
Target: https://constructaiq.trade
──────────────────────────────────────────────────

Pages
  ✓  GET / returns 200
  ✓  GET / has no global error page
  ✓  GET /dashboard returns 200
  ✓  GET /dashboard has no global error page

API
  ✓  /api/status returns 200
  ✓  /api/dashboard returns 200
  ✓  /api/dashboard returns valid JSON
  ✓  /api/dashboard has all required keys
  ✓  /api/dashboard signals is an array
  ✓  /api/dashboard commodities is an array
  ✓  /api/dashboard cshi is object or null (regression guard)

www redirect
  ✓  www subdomain returns 301 redirect
  ✓  www redirect → https://constructaiq.trade/dashboard

──────────────────────────────────────────────────
13 passed, 0 failed

✓ All checks passed
```

---

## Common failures and fixes

### Global error page — "Something went wrong"

```
✗  GET /dashboard does not show global error page
     "Something went wrong" found in body
```

**Cause:** A React rendering error escaped all error boundaries, or the root
layout threw before any boundary could catch it.

**Fix:**
1. Open `/dashboard` in a browser and check the browser console.
2. Check Vercel function logs for a server-side exception.
3. Run `npm run e2e` locally to reproduce.

---

### Missing www domain

```
✗  www subdomain is configured
     Could not reach https://www.constructaiq.trade/dashboard — DNS likely not configured.
     Add a CNAME record for www.constructaiq.trade and add it as a Vercel project domain.
```

**Cause:** `www.constructaiq.trade` is not pointed at Vercel.

**Fix:**
1. In your DNS provider, add a CNAME record: `www` → `cname.vercel-dns.com`.
2. In the Vercel project settings → Domains, add `www.constructaiq.trade`.
3. Vercel will issue an SSL certificate automatically.
4. The redirect in `next.config.ts` handles the apex rewrite at the
   application layer once DNS resolves.

---

### www redirect not redirecting

```
✗  www redirects to apex (expected 301/302, got 200)
```

**Cause:** The redirect rule in `next.config.ts` is present but the `www`
domain has not been added to the Vercel project. Vercel serves the full app
on `www` instead of redirecting.

**Fix:** Add `www.constructaiq.trade` as a domain alias in Vercel project
settings (not as the primary domain). Vercel must handle the DNS-level request
before Next.js can fire the `redirects()` rule.

---

### /api/dashboard shape regression

```
✗  /api/dashboard has all required keys
     missing: cshi, forecast
```

**Cause:** A cron job failed, `normalizeDashboardData` dropped keys, or a
schema migration removed columns.

**Fix:**
1. Check `src/app/api/dashboard/route.ts` for recent changes.
2. Check `src/lib/dashboard-schema.ts` — `normalizeDashboardData` may be
   dropping keys that are now null.
3. Check Supabase for missing rows in `observations` or `forecasts`.
4. Manually trigger the harvest and forecast crons:
   `GET /api/cron/harvest` and `GET /api/cron/forecast`.

---

### /api/status returns non-200

```
✗  /api/status returns 200
     got 500
```

**Cause:** Supabase connection is down, environment variables are missing, or
the status route threw an unhandled exception.

**Fix:** Check Vercel environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`) and Supabase project health dashboard.
