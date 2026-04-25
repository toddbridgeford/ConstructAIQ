# Launch Readiness Checklist

This is the single document an owner walks through before declaring
ConstructAIQ launch-ready. Every box must be checkable; "looks fine"
is not a check.

The checklist is grouped into five gates. Do not skip ahead — each
gate depends on the previous one (a failing build can't be smoke-
tested; a missing env var can't be verified by the dashboard).

> **Run it as one command:**  `npm run launch:check`
> See the [launch:check](#launchcheck-helper) section at the bottom.

---

## Gate 1 — Domain / DNS

- [ ] **`constructaiq.trade` resolves and serves the app**
      ```bash
      curl -sSI https://constructaiq.trade | head -1
      # expected: HTTP/2 200 (or 301/302 to the canonical path)
      ```
- [ ] **`www.constructaiq.trade` resolves**
      ```bash
      dig +short www.constructaiq.trade
      # expected: a CNAME to cname.vercel-dns.com (or an A record from Vercel)
      ```
- [ ] **`www` redirects to the apex domain**
      ```bash
      npm run smoke:www
      # expected: ✓ www DNS resolves, ✓ www returns 30x redirect,
      #           ✓ redirect target → https://constructaiq.trade/...
      ```
      If any of those fail, [docs/PRODUCTION_SMOKE.md](./PRODUCTION_SMOKE.md)
      lists each failure mode (DNS / Vercel alias / no redirect / wrong
      target) with the specific manual fix.

- [ ] **Other subdomain behavior is documented (or absent)**
      The `next.config.ts` redirects rule only matches host
      `www.constructaiq.trade`. There is no current product handling
      for `api.`, `docs.`, or `data.` subdomains. If those are
      registered in DNS, decide before launch whether to:
      - leave them unconfigured (DNS NXDOMAIN — clean), or
      - point them at the apex Vercel project and add explicit
        redirect rules to `next.config.ts`, or
      - park them on a placeholder host.
      Confirm the chosen behavior with `dig` and document the
      decision here once made.

---

## Gate 2 — Environment variables

These are checked at the **runtime environment** (Vercel Production),
not just `.env.local`. After setting any of them in Vercel you must
trigger a redeploy for serverless functions to pick them up.

The full plain-English list lives in [`.env.example`](../.env.example).
The required keys are:

- [ ] **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
      Verify:
      ```bash
      curl -s https://constructaiq.trade/api/status | jq '.freshness | length'
      # expected: > 0  (the route depends on Supabase to list series)
      ```
- [ ] **`ANTHROPIC_API_KEY`** — required for live Weekly Brief generation.
      Without it the brief response carries explicit static-fallback
      provenance instead of stale fabricated text. See
      [docs/ENVIRONMENT.md](./ENVIRONMENT.md) for the full setup walkthrough.
      Verify:
      ```bash
      curl -s https://constructaiq.trade/api/status | jq .env.anthropicConfigured
      # expected: true
      curl -s https://constructaiq.trade/api/weekly-brief | jq '{source, live, configured}'
      # expected: source="ai", live=true (after the first generation), configured=true
      ```
- [ ] **`CRON_SECRET`** — set to a long random string.
      Required so the GitHub Actions data-refresh workflow and any
      manual `curl /api/cron/...` calls authenticate. Set the same
      value as a GitHub Actions secret.
- [ ] **`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`** —
      required if real-time per-API-key rate limiting is expected
      to enforce. Without them, limits are stored in DB but not
      enforced in real time, which is acceptable for soft-launch
      but should be set before public announcement.
- [ ] **Sentry** — `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`,
      `SENTRY_PROJECT`. Required if source maps and crash events
      are expected to land in Sentry. Without these, the SDK is
      silently disabled — confirm whether silent disable is the
      intended state or a launch blocker.
- [ ] **Optional data-source keys** — `FRED_API_KEY`,
      `CENSUS_API_KEY`, `BLS_API_KEY`, `BEA_API_KEY`,
      `EIA_API_KEY`, `SAM_GOV_API_KEY`, `POLYGON_API_KEY`,
      `COPERNICUS_CLIENT_ID/SECRET`. Each one has a documented
      degraded behavior when unset (in `.env.example`). Decide
      per-source whether degraded is acceptable for launch.
- [ ] **`SITE_LOCKED` is `false` (or unset)** in Production —
      otherwise visitors hit a Basic Auth prompt.

A quick "what's actually configured" sanity sweep:
```bash
# Required infrastructure — all five must be true before launch
curl -s https://constructaiq.trade/api/status | jq .env
# expected: { supabaseConfigured: true, anthropicConfigured: true,
#             upstashConfigured: true, sentryConfigured: true,
#             cronSecretConfigured: true }

# Optional data-source keys and pricewatch/benchmark connectivity
curl -s https://constructaiq.trade/api/status | jq .api_health
# Boolean per source: pricewatch, benchmark, eia, bea, solicitations, equities

# Federal + weekly-brief live data status
curl -s https://constructaiq.trade/api/status | jq .data
# expected: { federalSource: "usaspending.gov", weeklyBriefSource: "ai" }

# Deep check — verifies dashboard KPI series exist in observations table
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data.dashboardShapeOk
# expected: true
```

- [ ] **Sentry server-side capture is wired**
      Production-critical routes use the `logApiError` helper
      (`src/lib/observability.ts`), which forwards to
      `Sentry.captureException` whenever `NEXT_PUBLIC_SENTRY_DSN`
      is set. Verify after a deploy by either:
      1. **Inspect deployment logs.** Trigger any of the live
         feeds with the upstream key intentionally absent (e.g.
         visit `/api/weekly-brief` while `ANTHROPIC_API_KEY` is
         unset) and confirm the `[weeklyBrief]` log line lands
         in Vercel function logs.
      2. **Check the Sentry project.** Open the Sentry project
         and confirm at least one event exists in the last 24h
         tagged `api_scope`. Stable scopes used today:
         `dashboard`, `federal`, `weeklyBrief`, `status`,
         `pricewatch`, `forecast`, `cshi`. Do not add a public
         "/api/sentry-test" route — if a smoke trigger is
         needed, gate it behind `CRON_SECRET` or
         `NODE_ENV !== 'production'`.

---

## Gate 3 — Data integrity

Public-facing data must be live, cached, or explicitly labeled — no
fabricated values dressed up as real.

- [ ] **`/api/federal` contractor + agency data is live or cached
      from USASpending.gov**
      ```bash
      curl -s https://constructaiq.trade/api/federal \
        | jq '{dataSource, fromCache, contractors: (.contractors | length), agencies: (.agencies | length)}'
      # expected on healthy run: dataSource="usaspending.gov",
      #                          contractors >= 1, agencies >= 1
      ```
- [ ] **`/api/federal` fallback is explicitly labeled**
      If `dataSource: "static-fallback"` ever appears, `contractors`
      and `agencies` must be empty (the route returns `[]` rather
      than fabricated names) and `fetchError` is set with the
      underlying cause. Validate with:
      ```bash
      curl -s https://constructaiq.trade/api/federal \
        | jq 'if .dataSource == "static-fallback"
              then {ok: (.contractors == [] and .agencies == []), fetchError}
              else {ok: true} end'
      ```
- [ ] **`/api/dashboard` schema validates**
      ```bash
      npm run smoke:prod
      # The smoke script checks every required key:
      #   construction_spending, employment, permits, cshi, forecast,
      #   signals (array), commodities (array), obs, fetched_at,
      #   plus a regression guard that cshi is object|null (never a
      #   bare string).
      ```
- [ ] **Weekly Brief never serves stale fabricated content**
      The neutral fallback in `src/lib/weeklyBrief.ts` contains no
      numeric metric claims. To regression-guard:
      ```bash
      npm test -- src/lib/__tests__/weeklyBrief.test.ts
      ```
      asserts the static copy never re-introduces CSHI/MoM/$/% values.

- [ ] **Latest data is reasonably fresh**
      ```bash
      curl -s https://constructaiq.trade/api/status | jq '.freshness | map(select(.status == "stale")) | length'
      # expected: 0 (or document why a source is intentionally stale)
      ```

---

## Gate 4 — Smoke tests

These run against the live deployment and require outbound network
to `https://constructaiq.trade`. Sandboxed CI environments without
egress will fail with `net::ERR_QUIC_PROTOCOL_ERROR` or `403`; that
is **not** a launch blocker for the tooling — the smoke script
itself is correct, it just can't reach the host.

- [ ] **`npm run smoke:prod` passes**
      Exits 0. Output ends with `✓ All checks passed`.
      See [docs/PRODUCTION_SMOKE.md](./PRODUCTION_SMOKE.md) for the
      list of checks and remediation table.
- [ ] **`npm run smoke:www` passes** (or the result is one of the
      four documented www failures and the listed manual fix has
      been applied).

---

## Gate 5 — Build / unit tests / e2e

These run on a developer laptop or in CI without needing prod network.

- [ ] **`npm run build`** — Compiled successfully. No new warnings.
- [ ] **`npm run lint`** — `✔ No ESLint warnings or errors`.
- [ ] **`npm test`** — every Vitest file passes.
- [ ] **`npx playwright test`** — passes against either production or
      a local `npm start` (`E2E_BASE_URL=http://localhost:3000`).
      Sandboxed environments without outbound network cannot run
      this — document and skip in that case; do not declare launch-
      ready without running it from a connected workstation at least
      once per release candidate.

---

## launch:check helper

`npm run launch:check` runs Gates 5 + 4 in one command and prints the
manual checks (Gates 1–3) that require a human.

```bash
# Local — runs build + lint + tests; prints Gate 1–3 and Gate 4 guidance.
# Does NOT fail if production network is unavailable.
npm run launch:check

# CI / launch sign-off — also runs smoke:prod + smoke:www and fails
# the command if either fails. Requires outbound network access.
npm run launch:check -- --include-smoke
```

The script source is `scripts/launch-check.mjs`. It is intentionally
not a hard "go / no-go" — Gates 1–3 require human judgment (DNS
provider, Vercel UI, deciding which optional data sources are
acceptable as missing for this release). The script captures
everything that *can* be automated.

---

## When something fails

Each gate references the doc that explains the failure mode in detail:

| Failure                                  | Reference                                  |
|------------------------------------------|--------------------------------------------|
| www does not resolve / 403 / no redirect | [docs/PRODUCTION_SMOKE.md](./PRODUCTION_SMOKE.md) |
| Weekly Brief stuck on static fallback    | [docs/ENVIRONMENT.md](./ENVIRONMENT.md)             |
| `/api/dashboard` shape regression        | [docs/PRODUCTION_SMOKE.md](./PRODUCTION_SMOKE.md) |
| Hardcoded contractor leaderboard re-emerges | `src/app/api/federal/__tests__/route.test.ts` source-level guard fails CI |
| Pre-existing audit context               | [docs/STABILIZATION_REPORT.md](./STABILIZATION_REPORT.md) |
