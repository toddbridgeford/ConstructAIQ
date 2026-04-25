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

---

## Revalidation — 2026-04-25 (post-VERCEL_DOMAIN_FIX.md)

A second validation pass was run after `docs/VERCEL_DOMAIN_FIX.md` was written
and the operator was directed to complete the Vercel domain-binding steps.

### `npm run launch:check -- --include-smoke` (revalidation)

| Gate | Command         | Exit | Time   |
|------|-----------------|------|--------|
| 5    | `npm run build` | 0    | 67.3 s |
| 5    | `npm run lint`  | 0    | 11.7 s |
| 5    | `npm test`      | 0    | 7.8 s  |
| 4    | `smoke:prod`    | **1**| 1.3 s  |
| 4    | `smoke:www`     | **1**| 0.5 s  |

Final line: `✗ Launch readiness FAILED — smoke gates: smoke:prod, smoke:www`

### `npm run smoke:prod` (revalidation)

```
Pages
  ✗  GET / returns 200            got 403
  ✗  GET /dashboard returns 200   got 403

API
  ✗  /api/status returns 200      got 403
  ✗  /api/dashboard returns 200   got 403

www redirect
  ✓  www DNS resolves (www.constructaiq.trade responded)
  ✗  www is bound to this Vercel project — HTTP 403

1 passed, 5 failed  ✗ Smoke test FAILED
```

### `npm run smoke:www` (revalidation)

```
www redirect
  ✓  www DNS resolves (www.constructaiq.trade responded)
  ✗  www is bound to this Vercel project — HTTP 403

1 passed, 1 failed  ✗ Smoke test FAILED
```

### Manual endpoint probes (revalidation)

```bash
curl -sSI https://constructaiq.trade
```
```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 17:33:13 GMT
```

```bash
curl -sSI https://www.constructaiq.trade/dashboard
```
```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 17:33:14 GMT
```

```bash
curl -s https://constructaiq.trade/api/status
```
```
Host not in allowlist
```

`/api/status` returned plain text, not JSON. The Vercel edge intercepted the
request before the Next.js app was reached.

### Revalidation interpretation

DNS is resolving correctly — `www DNS resolves` passes on every run. The
`host_not_allowed` 403 is unchanged, which means **the Vercel project domain
binding has not been completed**. The operator action in
`docs/VERCEL_DOMAIN_FIX.md` Steps 1–4 (Vercel UI → Settings → Domains →
Add `constructaiq.trade` and `www.constructaiq.trade`) is still outstanding.

Build, lint, and tests remain green. The blocker is external infrastructure only.

## Go / No-Go Summary

| Dimension        | Verdict     | Rationale                                                                                       |
|------------------|-------------|-------------------------------------------------------------------------------------------------|
| **Codebase**     | **GO**      | Build, lint, and all 317 tests are green at SHA `8c1cd98d`. Confirmed green on revalidation pass (2026-04-25 17:33 UTC). No code regression introduced. |
| **Public launch**| **NO-GO**   | Smoke tests still fail as of 2026-04-25 17:33 UTC. Every request returns HTTP 403 `x-deny-reason: host_not_allowed`. DNS resolves correctly (confirmed by `www DNS resolves` passing on both runs). The Vercel project domain binding for `constructaiq.trade` and `www.constructaiq.trade` has not been completed. |

**The codebase is candidate-ready. The infrastructure is not.**

DNS is confirmed propagated. The single remaining blocker is:

1. **Vercel project domain binding** — add `constructaiq.trade` and `www.constructaiq.trade` in Vercel → Settings → Domains. See [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) Steps 1–4.

After binding:

2. Required Vercel Production environment variables must be set and a redeploy triggered.
3. `npm run smoke:prod` must exit 0.

See [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) for step-by-step operator instructions.

## Launch Blockers

### Code blockers

None. Build, lint, and tests are all green. No code change is required before launch.

### External configuration blockers

| Priority | Blocker                                                       | Symptom                                         | Status (2026-04-25)                   | Fix location                          |
|----------|---------------------------------------------------------------|-------------------------------------------------|---------------------------------------|---------------------------------------|
| 🔴 P0    | `constructaiq.trade` not bound to Vercel project              | HTTP 403 `host_not_allowed` on every request    | **Open** — confirmed by revalidation  | Vercel UI → Settings → Domains        |
| 🔴 P0    | `www.constructaiq.trade` not bound to Vercel project          | HTTP 403 `host_not_allowed` on www              | **Open** — confirmed by revalidation  | Vercel UI → Settings → Domains        |
| ✅ —     | DNS apex record                                               | ~~App unreachable at apex~~                     | **Resolved** — `www DNS resolves` passes; apex DNS propagated | No action needed |
| ✅ —     | DNS `www` CNAME                                               | ~~www unreachable~~                             | **Resolved** — www DNS resolves on every smoke run | No action needed |
| 🟡 P1    | Stray subdomain DNS (`api.`, `docs.`, `data.`, `app.`) unknown | Subdomains may resolve somewhere unintended    | Unverified — cannot check from sandbox | DNS provider — verify or remove     |

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

The actual production state of live data feeds cannot be observed until the P0
domain/DNS blockers are resolved (every request returns 403 today). The table below
reflects the contracts encoded in code and verified by the 317-test suite.

| Surface             | Live signal when key is set                           | Current verifiable state          |
|---------------------|-------------------------------------------------------|-----------------------------------|
| `/api/federal`       | `dataSource: "usaspending.gov"`, `fromCache: true/false`, contractors and agencies populated | Cannot poll — production returns 403 |
| `/api/weekly-brief`  | `source: "ai"`, `live: true`, `configured: true`     | Cannot poll — production returns 403 |
| `/api/dashboard`     | `forecast`, `cshi`, `commodities`, `signals` all populated | Cannot poll — production returns 403 |
| `/api/pricewatch`    | `live: true`, `commodities` non-empty                 | Cannot poll — production returns 403 |
| `/api/forecast`      | `ensemble` array, `models`, `metrics` present         | Cannot poll — production returns 403 |
| `/api/cshi`          | `score`, `subScores`, `history` present               | Cannot poll — production returns 403 |
| `/api/status`        | `env.*Configured` booleans, `freshness` array         | Cannot poll — production returns 403 |

**Action:** once the domain is bound and env vars are set, run:

```bash
# Infrastructure booleans — all five must be true
curl -s https://constructaiq.trade/api/status | jq .env

# Data-source live/fallback state
curl -s https://constructaiq.trade/api/status | jq .data
# expected: { federalSource: "usaspending.gov", weeklyBriefSource: "ai" }

# Freshness — count of stale series (should be 0)
curl -s https://constructaiq.trade/api/status | jq '[.freshness[] | select(.status=="stale")] | length'

# Deep check — verifies dashboard KPI observations exist
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data.dashboardShapeOk
```

## Known Fallbacks

Every fallback path is explicit, structured, and tested. No fabricated data is
presented as live.

| Route               | Trigger                                                  | Fallback response                                                                      | UI behavior                                              |
|---------------------|----------------------------------------------------------|----------------------------------------------------------------------------------------|----------------------------------------------------------|
| `/api/federal`       | USASpending.gov fetch fails or `SAM_GOV_API_KEY` absent  | `dataSource: "static-fallback"`, `contractors: []`, `agencies: []`, `fetchError` set  | Banner: "Federal live feed unavailable"; leaderboard and agency rows empty |
| `/api/weekly-brief`  | `ANTHROPIC_API_KEY` absent or Claude API call fails      | `source: "static-fallback"`, `live: false`, `configured: false`                        | Dashboard panel shows UNAVAILABLE badge; no numeric claims in body |
| `/api/dashboard`     | Individual upstream source unavailable                   | Shape always present; null/empty per failing source                                    | Section-level EmptyState components; no global error     |
| `/api/pricewatch`    | Both `BLS_API_KEY` and `FRED_API_KEY` absent             | HTTP 503, `commodities: []`                                                            | Materials section renders EmptyState                     |
| `/api/forecast`      | Insufficient observations in Supabase                   | Falls back to baked-in seed data internally; HTTP 422 only if seed data also fails     | HeroForecast renders EmptyState with CloudOff icon when forecast is null |
| `/api/cshi`          | Supabase query returns null                              | `null` propagated to dashboard response                                                | Dashboard null-guards via `dashCore?.cshi?.score ?? null` |
| Equities data        | `POLYGON_API_KEY` absent                                 | Empty equities array                                                                   | Equities section renders EmptyState                      |
| Energy/EIA data      | `EIA_API_KEY` absent                                     | Empty commodities from EIA                                                             | Materials section renders EmptyState for EIA rows        |

All fallback paths emit structured logs via `src/lib/observability.ts` using one of the
seven canonical scopes: `[dashboard]`, `[federal]`, `[weeklyBrief]`, `[status]`,
`[pricewatch]`, `[forecast]`, `[cshi]`. Sentry capture fires only on actual failures
(Federal live fetch total failure, Dashboard top-level aggregate, Weekly Brief Claude
call, Supabase connection). Expected empty states do not generate Sentry noise.

## Post-Launch Monitoring Checklist

Run these checks after launch and on any deploy or infrastructure change.

### Immediate post-launch (within 30 minutes of going live)

- [ ] **`npm run smoke:prod` exits 0** — confirms pages, API shape, and www redirect all pass
- [ ] **`npm run smoke:www` exits 0** — confirms www DNS + Vercel binding + redirect chain
- [ ] **`/api/status` infrastructure booleans**
  ```bash
  curl -s https://constructaiq.trade/api/status | jq .env
  # all five must be true: supabaseConfigured, anthropicConfigured,
  # upstashConfigured, sentryConfigured, cronSecretConfigured
  ```
- [ ] **`/api/status` data-source state**
  ```bash
  curl -s https://constructaiq.trade/api/status | jq .data
  # federalSource should be "usaspending.gov" (not "static-fallback")
  # weeklyBriefSource should be "ai"
  ```
- [ ] **`/api/dashboard` shape is valid**
  ```bash
  curl -s https://constructaiq.trade/api/dashboard | jq '{forecast: (.forecast|type), cshi: (.cshi|type), signals: (.signals|length), commodities: (.commodities|length)}'
  ```
- [ ] **`/api/federal` is live (not fallback)**
  ```bash
  curl -s https://constructaiq.trade/api/federal | jq '{dataSource, contractors: (.contractors|length), agencies: (.agencies|length)}'
  # dataSource should be "usaspending.gov", counts > 0
  ```
- [ ] **`/api/weekly-brief` is live**
  ```bash
  curl -s https://constructaiq.trade/api/weekly-brief | jq '{source, live, configured}'
  # source: "ai", live: true, configured: true
  ```
- [ ] **Vercel function logs** — open the Vercel dashboard for the Production deployment,
      scan Function Logs for any `[scope] ERROR` lines from the observability helper.
      Stable scopes: `[dashboard]`, `[federal]`, `[weeklyBrief]`, `[status]`,
      `[pricewatch]`, `[forecast]`, `[cshi]`.
- [ ] **Sentry project** (if `NEXT_PUBLIC_SENTRY_DSN` is set) — confirm no unexpected
      `api_scope` events in the last hour. One event per intentional test is acceptable;
      a flood indicates a live fallback path is looping.

### Ongoing (after each deploy or cron run)

- [ ] Re-run `npm run smoke:prod` from a machine with outbound network access.
- [ ] Check `/api/status?deep=1` — `data.dashboardShapeOk` must be `true`.
- [ ] Verify freshness: `curl -s https://constructaiq.trade/api/status | jq '[.freshness[] | select(.status=="stale")] | length'` — target 0.
- [ ] Scan Vercel function logs for the deploy window for unexpected error bursts.

## Rollback Procedure

Use this if a deploy introduces a regression visible in smoke tests, Sentry, or
Vercel function logs.

### 1. Identify the last known good deployment

1. Open <https://vercel.com/dashboard> → **ConstructAIQ** project.
2. Click **Deployments** in the left nav.
3. Locate the most recent deployment whose status was **Ready** before the
   regression appeared. Note its deployment ID and the commit SHA it was built from.
4. Cross-reference the SHA against this report (`8c1cd98d`) or the git log to
   confirm it predates the regression.

### 2. Promote / rollback to that deployment

**Via Vercel UI (recommended):**

1. Click the deployment row to open its detail page.
2. Click the `…` menu (top right of the deployment card).
3. Select **Promote to Production**.
4. Confirm the promotion. Vercel will instantly shift production traffic to that
   build — no rebuild occurs; the previous artifact is re-promoted.

**Via Vercel CLI:**

```bash
vercel rollback <deployment-url-or-id> --prod
```

### 3. Verify the rollback is live

```bash
# Check the deployment is serving the expected SHA
curl -s https://constructaiq.trade/api/status | jq .runtime
# confirm "version" or build timestamp matches the promoted deployment

# Homepage and dashboard return 200
curl -sSo /dev/null -w "%{http_code}" https://constructaiq.trade/
curl -sSo /dev/null -w "%{http_code}" https://constructaiq.trade/dashboard

# API status and dashboard shape are valid
curl -s https://constructaiq.trade/api/status | jq .env
curl -s https://constructaiq.trade/api/dashboard | jq .fetched_at
```

### 4. Re-run smoke tests

```bash
npm run smoke:prod   # must exit 0
npm run smoke:www    # must exit 0
```

Both must exit 0 before the rollback is declared complete. If either still fails,
the issue is infrastructure (DNS/Vercel domain) rather than the deployment artifact —
do not keep rolling back through deployment history; investigate the external
configuration blockers in this report instead.

### 5. Document and notify

- Record the regression SHA, the promoted rollback SHA, and the time of rollback in
  a git commit message or incident note.
- Open a follow-up issue with the full symptom, the smoke/Sentry evidence, and a
  pointer to the regressing commit so the fix can be landed cleanly on a new branch.
