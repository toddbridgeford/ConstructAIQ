# Production Smoke Test

`scripts/smoke-prod.mjs` runs a lightweight set of HTTP checks against a live
deployment to catch "build READY but website broken" failures that unit tests
and e2e suites cannot detect.

---

## Running it

```bash
# Full check — pages, API shape, and www redirect (against production)
npm run smoke:prod

# www-only — just the apex/www redirect chain. Use after a DNS or Vercel
# domain change without re-running the full suite.
npm run smoke:www

# Against a preview deployment
node scripts/smoke-prod.mjs https://my-branch.vercel.app

# www-only against a custom URL
node scripts/smoke-prod.mjs https://constructaiq.trade --www-only
```

The script exits 0 on success, 1 on any failure (including any single
www failure — see "www: full configuration steps" below).

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

### www: full configuration steps

The `www` redirect requires THREE separate things to be configured. The
Next.js `redirects()` rule in `next.config.ts` only fires after the first
two are in place — code alone cannot make `www.constructaiq.trade` work.

**1. Vercel project domain alias** (one-time, manual)

1. Open <https://vercel.com/dashboard> and select the **ConstructAIQ** project.
2. **Settings → Domains** in the left nav.
3. Click **Add Domain**.
4. Enter `www.constructaiq.trade` and submit.
5. Vercel shows a verification panel with a CNAME target — usually
   `cname.vercel-dns.com`. Copy this exact value; it may differ per region.
6. Leave the panel open while you do step 2.

**2. DNS CNAME record** (one-time, manual)

In your DNS provider (whatever hosts `constructaiq.trade`), add:

```
Type:    CNAME
Name:    www                      ← just "www", not "www.constructaiq.trade"
Value:   cname.vercel-dns.com     ← exact value Vercel showed in step 1.5
TTL:     3600 (or provider default)
```

After ~1–10 minutes, return to the Vercel Domains panel — the verification
warning should disappear and Vercel will auto-issue an SSL certificate.

**3. Application-layer redirect** (already in repo)

`next.config.ts` contains:

```ts
async redirects() {
  return [{
    source: "/:path*",
    has: [{ type: "host", value: "www.constructaiq.trade" }],
    destination: "https://constructaiq.trade/:path*",
    permanent: true,
  }]
}
```

This only runs **after** steps 1 + 2 — Vercel must accept the request and
hand it to the Next.js function before the redirects() rule can match.

**Verification:**

```bash
npm run smoke:www
# expected:
#   ✓  www DNS resolves (www.constructaiq.trade responded)
#   ✓  www returns 308 redirect
#   ✓  www redirect target → https://constructaiq.trade/dashboard
```

---

### www failure modes — what each one means

`smoke:www` distinguishes four distinct failures so you know exactly which
of the three steps above is missing.

#### (a) DNS does not resolve

```
✗  www DNS resolves
     www.constructaiq.trade does not resolve or is not assigned to this Vercel project.
     Add www as a Vercel domain and DNS CNAME.
     (DNS error: ENOTFOUND)
```

**Means:** No DNS record exists for `www.constructaiq.trade`. **Fix:** do
both step 1 AND step 2 above.

#### (b) HTTP 403 — Vercel/project mismatch

```
✗  www is bound to this Vercel project
     https://www.constructaiq.trade/dashboard returned HTTP 403.
     www.constructaiq.trade resolves to Vercel but is not assigned to this project.
```

**Means:** DNS resolves correctly but Vercel does not recognize `www` as
belonging to the ConstructAIQ project. **Fix:** step 1 above (add the domain
in the Vercel UI). DNS is fine.

#### (c) No redirect — got 200 / 301-to-wrong-thing

```
✗  www returns a 30x redirect
     https://www.constructaiq.trade/dashboard returned HTTP 200 — the Next.js redirects() rule did not fire.
```

**Means:** Vercel is serving the full app on `www` instead of redirecting.
The most likely cause is that `www` is configured in Vercel as a **primary
domain** rather than a redirect-to-apex alias, OR the deployment containing
the redirects() rule has not propagated. **Fix:** in Vercel → Settings →
Domains, ensure `www.constructaiq.trade` is configured to redirect to
`constructaiq.trade` (or relies on the application-layer redirect, in which
case redeploy the latest `main`).

#### (d) Wrong redirect target

```
✗  www redirect target is the apex domain
     Location header was "https://example.com/" — expected something starting with "https://constructaiq.trade".
```

**Means:** The redirect fires but points somewhere unexpected. **Fix:** the
`destination` in the `next.config.ts` `redirects()` block has been edited.
Restore it to `https://constructaiq.trade/:path*`.

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
