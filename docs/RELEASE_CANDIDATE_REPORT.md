# Release Candidate Report

## Current SHA

| Field           | Value                                        |
|-----------------|----------------------------------------------|
| Full SHA        | `8c1cd98d320077525c797d90d0b9dd48d12bc2c8`   |
| Short SHA       | `8c1cd98d`                                   |
| Branch          | `claude/verify-federal-pipeline-data-PNxPB`  |
| Working tree    | Clean — `git status --porcelain` empty       |
| Last commit     | `feat(dashboard): honest fallback states for federal/brief/forecast` |
| Captured        | 2026-04-25 04:00 UTC                         |

## Command Results

### `npm run build`

| Field      | Value                                                     |
|------------|-----------------------------------------------------------|
| Exit code  | 0                                                         |
| Wall time  | ~74 s                                                     |
| Output     | `✓ Compiled successfully in 19.3s`                        |
| Warnings   | `⚠ Using edge runtime on a page currently disables static generation for that page` — pre-existing; expected on `/api/og/*` (edge required for `@vercel/og`) |
| Errors     | None                                                      |

### `npm run lint`

| Field      | Value                                                     |
|------------|-----------------------------------------------------------|
| Exit code  | 0                                                         |
| Output     | `✔ No ESLint warnings or errors`                          |
| Notes      | Pre-existing deprecation notice: `next lint will be removed in Next.js 16` — not introduced by this work |

### `npx vitest run`

| Field      | Value                                                     |
|------------|-----------------------------------------------------------|
| Exit code  | 0                                                         |
| Wall time  | ~8 s                                                      |
| Result     | `Test Files  23 passed (23)` · `Tests  317 passed (317)` |

### `npm run launch:check` (no smoke)

| Field      | Value                                                                                         |
|------------|-----------------------------------------------------------------------------------------------|
| Exit code  | 0                                                                                             |
| Wall time  | ~93 s (build 74.7 s + lint 11.4 s + tests 7.4 s)                                             |
| Smoke      | Not run — script printed `• smoke:prod / smoke:www not run (use --include-smoke)`             |
| Final line | `✓ Automatable gates passed. Walk through docs/LAUNCH_CHECKLIST.md Gates 1–3 to sign off.`   |

Per-step breakdown:

```
✓ npm run build  (74.7s, exit 0)
✓ npm run lint   (11.4s, exit 0)
✓ npm test       (7.4s,  exit 0)
```

### `npm run launch:check -- --include-smoke`

| Field       | Value                                                                     |
|-------------|---------------------------------------------------------------------------|
| Exit code   | Non-zero                                                                  |
| Smoke phase | **Ran** — sandbox had outbound network access                             |
| Smoke result| `smoke:prod` and `smoke:www` both **failed**                              |
| Final line  | `✗ Launch readiness FAILED — smoke gates: smoke:prod, smoke:www`          |

## Smoke Test Status

**Both smoke tests ran. Both failed. The codebase is not the cause.**

The sandbox had outbound network. Both `smoke:prod` and `smoke:www` reached
`https://constructaiq.trade`, completed a TCP/TLS handshake, and received a
hard **HTTP 403** from Vercel's edge layer with the response header:

```
x-deny-reason: host_not_allowed
```

This header is emitted by Vercel when an incoming request's `Host` does not
match any domain configured on the targeted project. It is not a
deployment-protection password gate and not a Cloudflare/firewall block.
The Next.js application never receives the request — Vercel rejects it before
any application code runs.

### `npm run smoke:prod` output

```
ConstructAIQ production smoke test
Target: https://constructaiq.trade
──────────────────────────────────────────────────

Pages
  ✗  GET / returns 200            got 403
  ✗  GET /dashboard returns 200   got 403

API
  ✗  /api/status returns 200      got 403
  ✗  /api/dashboard returns 200   got 403

www redirect
  ✓  www DNS resolves
  ✗  www is bound to this Vercel project — HTTP 403

──────────────────────────────────────────────────
1 passed, 5 failed
✗ Smoke test FAILED
```

| Field         | Value                                                          |
|---------------|----------------------------------------------------------------|
| Exit code     | 1                                                              |
| Network       | Reachable (TCP/TLS handshake completed)                        |
| Apex response | HTTP 403, header `x-deny-reason: host_not_allowed`             |
| Diagnosis     | Vercel edge rejects the host before serving the app            |

### `npm run smoke:www` output

```
www redirect
  ✓  www DNS resolves (www.constructaiq.trade responded)
  ✗  www is bound to this Vercel project — HTTP 403
1 passed, 1 failed
✗ Smoke test FAILED
```

| Field      | Value                                        |
|------------|----------------------------------------------|
| Exit code  | 1                                            |
| Root cause | Same as `smoke:prod` — `host_not_allowed`    |

### `curl -sSI https://constructaiq.trade` (manual probe)

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 04:00:29 GMT
```

### Smoke summary

| Run                                       | Status              | Reason                                     |
|-------------------------------------------|---------------------|--------------------------------------------|
| `npm run launch:check`                    | Skipped             | Command run without `--include-smoke`      |
| `npm run launch:check -- --include-smoke` | Ran — **Failed**    | Sandbox has network; apex returns 403      |
| `npm run smoke:prod`                      | Ran — **Failed**    | Apex HTTP 403 (`host_not_allowed`)         |
| `npm run smoke:www`                       | Ran — **Failed**    | www HTTP 403 (`host_not_allowed`)          |

## Go / No-Go Summary

| Dimension        | Verdict     | Rationale                                                                                       |
|------------------|-------------|-------------------------------------------------------------------------------------------------|
| **Codebase**     | **GO**      | Build, lint, and all 317 tests are green at SHA `8c1cd98d`. No code regression introduced.     |
| **Public launch**| **NO-GO**   | Production smoke tests failed. Every request to `constructaiq.trade` returns HTTP 403 (`x-deny-reason: host_not_allowed`). The Vercel project has not been bound to the domain. The app is unreachable by users until Gates 1–3 in `docs/LAUNCH_CHECKLIST.md` are completed. |

**The codebase is candidate-ready. The infrastructure is not.**

Smoke tests cannot pass until:

1. `constructaiq.trade` and `www.constructaiq.trade` are added as domains in the Vercel project settings.
2. DNS records at the provider are set (apex A record `76.76.21.21` or ALIAS; `www` CNAME to `cname.vercel-dns.com`).
3. Required Vercel Production environment variables are set and a redeploy is triggered.
4. `npm run smoke:prod` exits 0.

## Launch Blockers

### Code blockers

None. Build, lint, and tests are all green. No code change is required before launch.

### External configuration blockers

| Priority | Blocker                                                       | Symptom                                         | Fix location                          |
|----------|---------------------------------------------------------------|-------------------------------------------------|---------------------------------------|
| 🔴 P0    | `constructaiq.trade` not bound to Vercel project              | HTTP 403 `host_not_allowed` on every request    | Vercel UI → Settings → Domains        |
| 🔴 P0    | `www.constructaiq.trade` not bound to Vercel project          | HTTP 403 `host_not_allowed` on www              | Vercel UI → Settings → Domains        |
| 🔴 P0    | DNS apex record missing or not pointing at Vercel             | App unreachable at apex                         | DNS provider — A record `76.76.21.21` |
| 🔴 P0    | DNS `www` CNAME missing                                       | www unreachable; smoke:www fails                | DNS provider — CNAME → `cname.vercel-dns.com` |
| 🟡 P1    | Stray subdomain DNS (`api.`, `docs.`, `data.`, `app.`) unknown | Subdomains may resolve somewhere unintended    | DNS provider — verify or remove       |

### Environment variable blockers

| Priority | Variable                         | Impact if missing                                                       |
|----------|----------------------------------|-------------------------------------------------------------------------|
| 🔴 P0    | `NEXT_PUBLIC_SUPABASE_URL`        | All data routes fail; dashboard is empty                                |
| 🔴 P0    | `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | All data routes fail; dashboard is empty                                |
| 🔴 P0    | `SUPABASE_SERVICE_ROLE_KEY`       | Server-side DB writes (cron harvest, forecast) fail                     |
| 🔴 P0    | `CRON_SECRET`                     | GitHub Actions data-refresh workflow cannot authenticate                |
| 🔴 P0    | `SITE_LOCKED` must be `false`     | If set `true`, all visitors hit a Basic Auth prompt                     |
| 🟡 P1    | `ANTHROPIC_API_KEY`               | Weekly Brief stays on static fallback; dashboard shows UNAVAILABLE badge |
| 🟡 P1    | `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Per-API-key rate limiting is DB-only, not enforced in real time        |
| 🟡 P1    | `NEXT_PUBLIC_SENTRY_DSN` etc.     | Error capture is console-only; no Sentry events                         |
| 🟢 P2    | `NEXT_PUBLIC_APP_URL`             | Falls back to `https://constructaiq.trade` literal — survivable         |

**Env vars cannot be verified until P0 DNS/Vercel domain blockers are resolved**, because
`/api/status` (the authoritative boolean check) returns 403 until the domain is bound.

### Data-source / fallback risks

| Source             | Risk if key absent                                                                                  | Fallback behavior                                      |
|--------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| `FRED_API_KEY`      | FRED series not harvested; forecast uses seed data                                                  | Seed data; explicitly labeled                          |
| `BLS_API_KEY`       | BLS employment/permits series not refreshed                                                         | Seed data; explicitly labeled                          |
| `CENSUS_API_KEY`    | Census construction-spending series not refreshed                                                   | Seed data; explicitly labeled                          |
| `SAM_GOV_API_KEY`   | SAM.gov solicitations not fetched                                                                   | Empty solicitations array; labeled                     |
| `EIA_API_KEY`       | Energy price data unavailable                                                                       | Materials section shows EmptyState                     |
| `POLYGON_API_KEY`   | Equities data unavailable                                                                           | Equities section shows EmptyState                      |
| `BEA_API_KEY`       | BEA GDP series not refreshed                                                                        | Seed data; explicitly labeled                          |
| Federal live data   | USASpending.gov fetch fails                                                                         | `dataSource: "static-fallback"`, contractors/agencies empty, `fetchError` set |

Every fallback emits structured logs via `src/lib/observability.ts`. No fabricated data is
surfaced as live — all degraded states are explicitly labeled in the UI and API response.

### Post-launch cleanup

These are not blockers but should be resolved after launch:

| Item                                                            | File / location                                      |
|-----------------------------------------------------------------|------------------------------------------------------|
| `AnyData = any` in `MobileDashboard.tsx` and `HeroSection.tsx` | Replace with `DashboardData` from `api-types.ts`     |
| `ask.spec.ts:78` — meaningless `bodyLength > 200` assertion     | `e2e/ask.spec.ts` — remove the length check          |
| `GlobeClient.tsx` swallows 6 fetch errors silently              | Change `catch(e){}` to `catch(e){ console.warn(...) }` |
| `next lint` deprecation — migrate to ESLint CLI                 | Per Next.js 16 migration guide                       |
| 7 moderate npm vulnerabilities (postcss + uuid chains)          | Not fixable without breaking changes; document       |
| Playwright e2e suite not run in sandbox                         | Run `npx playwright test` from a connected workstation once before announcing launch |

## External Configuration Actions

These are **operator actions only** — no code change resolves any of them.
Complete in this order:

1. **Vercel: add `constructaiq.trade`** — Settings → Domains → Add Domain → enter apex.
   Verify green checkmark in the Domains panel before continuing.

2. **Vercel: add `www.constructaiq.trade`** — same panel. Copy the CNAME target Vercel
   displays (typically `cname.vercel-dns.com`).

3. **DNS provider: add `www` CNAME record**
   ```
   Type:  CNAME
   Name:  www
   Value: cname.vercel-dns.com
   TTL:   3600
   ```

4. **DNS provider: add apex record**
   - If provider supports ALIAS/CNAME flattening: ALIAS → `cname.vercel-dns.com`
   - Otherwise: `A` → `76.76.21.21`

5. **Wait 1–10 minutes** for Vercel to detect DNS and auto-issue SSL. The Domains panel
   transitions from "Invalid Configuration" to a green checkmark when ready.

6. **Run `npm run smoke:www`** — must exit 0 before continuing.

7. **Verify or remove stray subdomain DNS** for `api.`, `docs.`, `data.`, `app.`
   (see `docs/LAUNCH_CHECKLIST.md` Gate 1.4).

8. **Trigger a Vercel redeploy** after completing step 5 to ensure all env vars
   (set in the next section) are picked up by serverless functions.

## Environment Variable Actions

Set all variables in **Vercel → Settings → Environment Variables → Production scope**.
A redeploy is required after any change. See `docs/ENVIRONMENT.md` for the full walkthrough.

### Required before launch

```bash
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/public key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
CRON_SECRET=<long random string — set the same value in GitHub Actions secrets>
SITE_LOCKED=false
```

### Required for full feature set

```bash
ANTHROPIC_API_KEY=<key from console.anthropic.com>   # activates live Weekly Brief
UPSTASH_REDIS_REST_URL=<Upstash REST URL>             # real-time rate limiting
UPSTASH_REDIS_REST_TOKEN=<Upstash REST token>
NEXT_PUBLIC_SENTRY_DSN=<Sentry DSN>                  # error capture
SENTRY_ORG=<org slug>
SENTRY_PROJECT=<project slug>
```

### Optional data-source keys (degraded fallback if absent)

```bash
FRED_API_KEY=
CENSUS_API_KEY=
BLS_API_KEY=
BEA_API_KEY=
EIA_API_KEY=
SAM_GOV_API_KEY=
POLYGON_API_KEY=
COPERNICUS_CLIENT_ID=
COPERNICUS_CLIENT_SECRET=
```

### Verification after redeploy

```bash
# All five must be true
curl -s https://constructaiq.trade/api/status | jq .env
# expected: { supabaseConfigured: true, anthropicConfigured: true,
#             upstashConfigured: true, sentryConfigured: true,
#             cronSecretConfigured: true }

# Then run the full smoke suite
npm run smoke:prod   # must exit 0
npm run smoke:www    # must exit 0
```

## Data Source Status

## Known Fallbacks

## Post-Launch Monitoring Checklist

## Rollback Procedure
