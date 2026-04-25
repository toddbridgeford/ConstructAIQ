# Release Candidate — Validation Notes (raw)

**Status:** Working notes. Superseded by `RELEASE_CANDIDATE_REPORT.md`
once the data here is reviewed and signed off.

**Captured:** 2026-04-25 04:00 UTC
**Captured by:** Claude Code, Phase 3 release-candidate validation chunk
**Branch:** `claude/verify-federal-pipeline-data-PNxPB`
**HEAD SHA:** `8c1cd98d320077525c797d90d0b9dd48d12bc2c8`
**HEAD short:** `8c1cd98d`
**Working tree:** clean (`git status --porcelain` empty)
**Last commit:** `feat(dashboard): honest fallback states for federal/brief/forecast`

This file records exactly what was observed when each command was
run. Every line below comes from a real captured stdout/stderr — no
assumptions, no rewrites. Logs preserved at `/tmp/rc-validation/*.log`
on the validation host (will not survive sandbox teardown — re-run
to reproduce).

---

## Commands run

### 1. `git rev-parse HEAD`

| Field          | Value                                           |
|----------------|-------------------------------------------------|
| Exit code      | 0                                               |
| Output         | `8c1cd98d320077525c797d90d0b9dd48d12bc2c8`      |
| `git status`   | clean — no uncommitted/untracked files          |

### 2. `npm run launch:check`

| Field      | Value                                                   |
|------------|---------------------------------------------------------|
| Exit code  | 0                                                       |
| Wall time  | ~93 s (build 74.7 s + lint 11.4 s + tests 7.4 s)        |
| Smoke      | not run (no `--include-smoke`); script printed `•  smoke:prod / smoke:www not run (use --include-smoke)` |
| Final line | `✓ Automatable gates passed. Walk through docs/LAUNCH_CHECKLIST.md Gates 1–3 to sign off.` |

Per-step results (from launch:check output):

```
✓ npm run build  (74.7s, exit 0)
✓ npm run lint   (11.4s, exit 0)
✓ npm test       (7.4s,  exit 0)
```

### 3. `npm run launch:check -- --include-smoke`

| Field       | Value                                                        |
|-------------|--------------------------------------------------------------|
| Exit code   | non-zero                                                     |
| Smoke phase | **ran** — sandbox does have outbound network                 |
| Smoke result| `smoke:prod` and `smoke:www` both **failed**                 |
| Final line  | `✗ Launch readiness FAILED — smoke gates: smoke:prod, smoke:www` |

Cause: production deployment is currently rejecting requests with
HTTP 403 at the Vercel edge (see § Smoke results below). This is
the dominant launch blocker — the codebase is fine, the live
deployment hostname is not bound to the project.

### 4. `npm run build` (standalone)

| Field      | Value                                                     |
|------------|-----------------------------------------------------------|
| Exit code  | 0                                                         |
| Wall time  | ~74 s                                                     |
| Output     | `✓ Compiled successfully in 19.3s` then full route table  |
| Warnings   | One: `⚠ Using edge runtime on a page currently disables static generation for that page` — expected for `/api/og/*` (see [STABILIZATION_REPORT.md](./STABILIZATION_REPORT.md)) |
| Errors     | none                                                      |

### 5. `npm run lint` (standalone)

| Field      | Value                                                     |
|------------|-----------------------------------------------------------|
| Exit code  | 0                                                         |
| Output     | `✔ No ESLint warnings or errors`                          |
| Notes      | Deprecation notice from Next: `next lint` is deprecated and will be removed in Next.js 16. Pre-existing — not introduced by Phase 3. |

### 6. `npx vitest run` (standalone)

| Field      | Value                                                     |
|------------|-----------------------------------------------------------|
| Exit code  | 0                                                         |
| Wall time  | ~8 s                                                      |
| Result     | `Test Files  23 passed (23)` · `Tests  317 passed (317)`  |

### 7. `npm run smoke:prod` (standalone)

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

| Field         | Value                                                |
|---------------|------------------------------------------------------|
| Exit code     | 1                                                    |
| Network       | reachable (TCP/TLS handshake completed)              |
| Apex response | HTTP 403, header `x-deny-reason: host_not_allowed`   |
| Diagnosis     | Vercel edge rejects the host before serving the app. |

### 8. `npm run smoke:www` (standalone)

```
www redirect
  ✓  www DNS resolves (www.constructaiq.trade responded)
  ✗  www is bound to this Vercel project — HTTP 403
1 passed, 1 failed
✗ Smoke test FAILED
```

Exit code 1. Same root cause as smoke:prod.

### 9. `curl -sSI https://constructaiq.trade` (manual probe)

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 04:00:29 GMT
```

The `x-deny-reason: host_not_allowed` header is emitted by Vercel's
edge layer when an incoming request's `Host` does not match any
domain configured on the targeted project. This is **not** a
deployment-protection password gate (those return a different page)
and **not** a Cloudflare/firewall block — it is Vercel's own
"unknown host" rejection.

---

## Smoke status — explicit

| Run                   | Status   | Reason                                       |
|-----------------------|----------|----------------------------------------------|
| `npm run launch:check` | skipped  | command did not include `--include-smoke`    |
| `npm run launch:check -- --include-smoke` | **ran** and **failed** | sandbox has outbound network but the apex returns 403 |
| `npm run smoke:prod`  | **ran** and **failed** | apex 403 (host_not_allowed)               |
| `npm run smoke:www`   | **ran** and **failed** | www 403 (host_not_allowed)                |

Smoke was **not** skipped. It was attempted, reached
`https://constructaiq.trade`, and got a hard 403 at Vercel's edge.
This is a real production-state finding, not a sandbox limitation.

---

## Observed launch blockers

### 🔴 P0 — `constructaiq.trade` is not bound to the Vercel project

- Symptom: `HTTP/2 403` with `x-deny-reason: host_not_allowed` on
  every request to apex and www.
- Code is **not** the cause — the Next app never gets the request.
- Fix is entirely external (Vercel project Settings → Domains).
  Steps documented in:
  - `docs/LAUNCH_CHECKLIST.md` § Gate 1.1 (Vercel domain alias setup)
  - `docs/LAUNCH_CHECKLIST.md` § Gate 1.2 (DNS records at provider)
  - `docs/PRODUCTION_SMOKE.md` § www: full configuration steps
- Until this is resolved, **all** Gate 3 / Gate 4 smoke checks will
  remain failing, and `/api/status` cannot be inspected to verify
  Gate 2 env-var configuration.

### 🟡 P1 — Vercel Production env vars unverified

`/api/status` cannot be polled until P0 above is fixed, so the
authoritative `env.*Configured` booleans are currently unknown.
The variables that **must** be set in Vercel Production scope
(per `docs/LAUNCH_CHECKLIST.md` Gate 2 and `docs/ENVIRONMENT.md`):

Required (each one a launch blocker if missing):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` — without it, Weekly Brief stays on
  static-fallback; Phase 3 dashboard now surfaces this honestly via
  the UNAVAILABLE panel rather than fake content
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL` (dashboard route falls back to
  `https://constructaiq.trade` literal when missing — survivable
  but should be set explicitly)
- `SITE_LOCKED` should be `false` (or unset) for public launch

Strongly recommended:

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — without
  them, per-API-key rate limiting is DB-only and not enforced in
  real time
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` — the
  Phase 3 observability helper (`src/lib/observability.ts`)
  forwards `logApiError` to Sentry only when DSN is set; without
  it, error capture is console-only

Optional data-source keys (each has documented degraded fallback):

- `FRED_API_KEY`, `CENSUS_API_KEY`, `BLS_API_KEY`, `BEA_API_KEY`,
  `EIA_API_KEY`, `SAM_GOV_API_KEY`, `POLYGON_API_KEY`,
  `COPERNICUS_CLIENT_ID` + `COPERNICUS_CLIENT_SECRET`

Push notification keys (only if web push is launching with this
release):

- `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`

GitHub data-refresh action (separate secret in GitHub Actions, not
Vercel):

- `GITHUB_TOKEN` (managed by GitHub, not relevant here)
- `CRON_SECRET` (must match the Vercel value)

### 🟡 P1 — Stray subdomain DNS unknown

Per Gate 1.4, `api.`, `docs.`, `data.`, `app.` subdomains must
either be intentionally configured or absent. Cannot be verified
from inside this sandbox without the operator's DNS provider
access. **Listed as an explicit manual action**, not a code change.

---

## Observed warnings (non-blocking)

1. **Edge runtime static-generation notice** during `npm run build`:
   `⚠ Using edge runtime on a page currently disables static generation for that page`.
   Pre-existing behavior on `/api/og/*` routes — `@vercel/og` requires
   edge. Documented in `STABILIZATION_REPORT.md`.

2. **`next lint` deprecation notice**: `next lint will be removed in Next.js 16.`
   Migration tracked separately; not a Phase 3 task.

3. **No new warnings introduced by Phase 3.** Build, lint, and tests
   all green at the same level as the post-stabilization baseline.

---

## Data-source provenance — current state per code

The actual production state cannot be observed (P0 blocker), but
the contracts every API guarantees are encoded in code and tested:

| Surface                | Live signal                                | Fallback signal                               | Empty / null state                                          |
|------------------------|--------------------------------------------|-----------------------------------------------|-------------------------------------------------------------|
| `/api/federal`         | `dataSource: "usaspending.gov"`            | `dataSource: "static-fallback"` + empty contractors/agencies + `fetchError` set | banner: "Federal live feed unavailable"; UI says contractors/agencies are intentionally empty |
| `/api/federal` (cached)| `fromCache: true` + `cached_at` timestamp  | n/a                                           | section-level `FreshnessIndicator` shows "Federal data cached (USASpending.gov)" |
| `/api/weekly-brief`    | `source: "ai"`, `live: true`, `configured: true` | `source: "static-fallback"`, `live: false`, `configured: false` | dashboard panel renders explicit `UNAVAILABLE` badge + "no stale or fabricated copy" body |
| `/api/dashboard`       | `forecast`, `cshi`, `commodities`, `signals` populated | shape always present; null/empty fields per source | dashboard surfaces explicit empty states (Phase 3); `commodities=[]` → "Material prices unavailable" empty card |
| `/api/pricewatch`      | `live: true`, `commodities` non-empty       | HTTP 503 + `commodities: []` when both BLS_API_KEY and FRED_API_KEY missing | Materials section already renders EmptyState |
| `/api/forecast`        | `ensemble` array + `models` + `metrics`    | falls back to seed data internally; HTTP 422 only on truly insufficient data | dashboard HeroForecast renders EmptyState with CloudOff icon when forecast=null |
| `/api/cshi`            | `score` + `subScores` + `history`           | `null` propagated to dashboard               | dashboard already null-guards via `dashCore?.cshi?.score ?? null` |
| `/api/status`          | full payload (`env`, `data`, `runtime`, `freshness`) | top-level catch logs+rethrows via `logApiError('status', err)` | n/a — route either succeeds or 500s |

Phase 3 backend changes guarantee that **every** fallback path
emits structured logs via `src/lib/observability.ts` with one of
the seven canonical scopes: `[dashboard]`, `[federal]`,
`[weeklyBrief]`, `[status]`, `[pricewatch]`, `[forecast]`,
`[cshi]`. Sentry capture only on actual failures (Federal live
fetch total, Dashboard top-level aggregate, Weekly Brief Claude
call, Supabase connection). No spam from expected empty states.

---

## Unresolved manual actions (operator must complete)

These are **external to the codebase** — no code change can resolve
them. Listed in execution order:

1. **Vercel: add `constructaiq.trade` to project domains.**
   Settings → Domains → Add → enter apex. Verify green checkmark.
2. **Vercel: add `www.constructaiq.trade` to project domains.**
   Same panel. Copy the CNAME target Vercel displays for step 3.
3. **DNS provider: add `www` CNAME** to `cname.vercel-dns.com`.
4. **DNS provider: add apex A record** `76.76.21.21`
   (or flattened CNAME / ALIAS to `cname.vercel-dns.com` if
   provider supports it).
5. **Wait 1–10 minutes**; Vercel Domains panel should auto-issue
   SSL.
6. **Run `npm run smoke:www`** — must exit 0. (After step 5, the
   `host_not_allowed` 403 will be gone.)
7. **Set Production env vars** — see § P1 list above. After save,
   trigger a redeploy.
8. **Run `curl /api/status | jq .env`** — every required boolean
   must be `true`.
9. **Run `npm run smoke:prod`** — must exit 0.
10. **Run `npx playwright test`** from a connected workstation
    (sandbox does not have browsers installed).
11. **Verify or remove stray subdomain DNS** (`api.`, `docs.`,
    `data.`, `app.`) per Gate 1.4.

---

## Acceptance vs. task brief

| Requirement                                                  | Status                                                                                          |
|--------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| `docs/RELEASE_CANDIDATE_NOTES.md` exists                     | ✓ this file                                                                                     |
| Contains real command results, not assumptions               | ✓ every value is from a captured stdout (logs at `/tmp/rc-validation/*.log` while sandbox lives) |
| Network-dependent smoke status clearly marked                | ✓ ran, failed, with explicit reason and HTTP code                                               |
| Build/lint/tests attempted and documented                    | ✓ standalone runs + via launch:check; both confirm exit 0                                       |
| No broad product code changes in this chunk                  | ✓ only this notes file added                                                                    |

---

## Next chunk (do not perform here)

1. Update `docs/STABILIZATION_REPORT.md` with the supersession pointer.
2. Create `docs/RELEASE_CANDIDATE_REPORT.md` from this raw notes file.
3. Re-run validation if any change between chunks invalidates the
   numbers above.
