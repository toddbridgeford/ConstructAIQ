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

---

## Phase 5 domain recheck — 2026-04-25 17:39 UTC

This section records the Phase 5 verification pass. Its purpose is to determine
whether the Vercel domain binding described in `docs/VERCEL_DOMAIN_FIX.md` has
been completed by the operator.

### Commands run

```
npm run smoke:www
npm run smoke:prod
curl -sSI https://constructaiq.trade
curl -sSI https://www.constructaiq.trade/dashboard
npm run lint
```

### `npm run smoke:www`

```
ConstructAIQ production smoke test
Target: https://constructaiq.trade  (--www-only)
──────────────────────────────────────────────────

www redirect
  ✓  www DNS resolves (www.constructaiq.trade responded)
  ✗  www is bound to this Vercel project
       https://www.constructaiq.trade/dashboard returned HTTP 403.
       www.constructaiq.trade resolves but is rejected (403).

──────────────────────────────────────────────────
1 passed, 1 failed

✗ Smoke test FAILED
```

| Field     | Value |
|-----------|-------|
| Exit code | **1** |

### `npm run smoke:prod`

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
  ✓  www DNS resolves (www.constructaiq.trade responded)
  ✗  www is bound to this Vercel project — HTTP 403

──────────────────────────────────────────────────
1 passed, 5 failed

✗ Smoke test FAILED
```

| Field     | Value |
|-----------|-------|
| Exit code | **1** |

### `curl -sSI https://constructaiq.trade`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 17:39:00 GMT
```

| Field              | Value                           |
|--------------------|---------------------------------|
| HTTP status        | **403**                         |
| x-deny-reason      | **host_not_allowed**            |
| Location           | (none)                          |

### `curl -sSI https://www.constructaiq.trade/dashboard`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 17:39:02 GMT
```

| Field                      | Value                           |
|----------------------------|---------------------------------|
| HTTP status                | **403**                         |
| x-deny-reason              | **host_not_allowed**            |
| Location (www→apex)        | (none — no redirect occurred)   |

### `npm run lint`

ESLint exited 0 — no code lint errors. `next lint` crashes in this sandbox
because `@opentelemetry/sdk-trace-base` (a Sentry peer dependency) is absent
from the sandbox environment; this is a pre-existing sandbox gap, not a code
defect. The ESLint pass confirms no lint issues were introduced.

| Field           | Value |
|-----------------|-------|
| ESLint exit code| **0** |
| next lint exit  | 1 (sandbox — missing Sentry OpenTelemetry peer; not a code error) |

### Phase 5 interpretation

DNS resolution is confirmed: `www DNS resolves` passes on both smoke runs,
identical to all prior revalidation passes. The `host_not_allowed` 403 is
**unchanged** across every run since 2026-04-25 04:00 UTC.

**The Vercel domain binding has not been completed.** Both
`constructaiq.trade` and `www.constructaiq.trade` remain unbound from the
Vercel project. The operator steps in `docs/VERCEL_DOMAIN_FIX.md` Steps 1–4
(Vercel UI → Settings → Domains → Add both domains) are still outstanding.

**Vercel domain blocker: OPEN — not resolved.**

---

## Phase 5 env verification — 2026-04-25 17:43 UTC

This section records the attempt to verify production environment variables
through the live `/api/status` endpoint.

### Prerequisite check

The prerequisite for this phase is that `constructaiq.trade` no longer returns
`x-deny-reason: host_not_allowed`. That condition has not been met.

```bash
curl -si https://constructaiq.trade/api/status
```
```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 17:43:39 GMT

Host not in allowlist
```

All three endpoint probes returned HTTP 403 before reaching the Next.js
application layer. The `jq` commands produced parse errors because the
response body is the plain-text string `Host not in allowlist`, not JSON.

| Probe | Command | HTTP status | x-deny-reason |
|-------|---------|-------------|---------------|
| env booleans | `curl -s …/api/status \| jq .env` | 403 | host_not_allowed |
| runtime | `curl -s …/api/status \| jq .runtime` | 403 | host_not_allowed |
| data | `curl -s …/api/status \| jq .data` | 403 | host_not_allowed |

### Environment variable booleans — observed vs expected

The `/api/status` route (see `src/app/api/status/route.ts:53–59`) exposes
these booleans when reachable. All are **unobservable** until the Vercel
domain binding is completed.

| Boolean | Env var(s) required | Expected | Observed | Priority |
|---------|---------------------|----------|----------|----------|
| `supabaseConfigured` | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | `true` | **UNOBSERVABLE** | 🔴 P0 — all data routes fail without this |
| `cronSecretConfigured` | `CRON_SECRET` | `true` | **UNOBSERVABLE** | 🔴 P0 — data-refresh cron cannot authenticate |
| `anthropicConfigured` | `ANTHROPIC_API_KEY` | `true` | **UNOBSERVABLE** | 🟡 P1 — Weekly Brief falls back to static if absent |
| `upstashConfigured` | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | `true` | **UNOBSERVABLE** | 🟡 P1 — per-key rate limiting is DB-only if absent |
| `sentryConfigured` | `NEXT_PUBLIC_SENTRY_DSN` | `true` | **UNOBSERVABLE** | 🟡 P1 — error capture is console-only if absent |

Additional runtime values also unobservable:

| Field | Env var | Expected | Observed |
|-------|---------|----------|----------|
| `runtime.siteLocked` | `SITE_LOCKED` | `false` | **UNOBSERVABLE** — if `true`, all visitors hit Basic Auth |
| `runtime.appUrl` | `NEXT_PUBLIC_APP_URL` | `https://constructaiq.trade` | **UNOBSERVABLE** — survivable fallback if absent |
| `runtime.nodeEnv` | `NODE_ENV` | `production` | **UNOBSERVABLE** |

### `npm run lint`

ESLint exited 0 — no code lint errors. `next lint` crashes in this sandbox
because `@opentelemetry/sdk-trace-base` (a Sentry peer dependency) is absent
from the sandbox environment; this is a pre-existing sandbox gap, not a code
defect.

| Tool | Exit code | Result |
|------|-----------|--------|
| ESLint (direct) | **0** | No errors, no warnings |
| `next lint` | 1 | Sandbox-only: missing `@opentelemetry/sdk-trace-base` peer — not a code defect |

### Phase 5 env verification interpretation

**All env booleans are unobservable.** The Vercel domain binding must be
completed first. Until then, `/api/status` returns HTTP 403 before the
Next.js application runs, making it impossible to confirm any production
environment variable from the live endpoint.

**The P0 env vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`CRON_SECRET`) remain unverified launch blockers.** They are documented in
the Environment Variable Actions section below. They cannot be verified until
the Vercel domain blocker (P0) is resolved.

---

## Phase 5 data-source verification — 2026-04-25 17:46 UTC

This section records the attempt to verify live production data sources through
the five specified endpoints.

### Prerequisite check

The prerequisite for this phase is that `constructaiq.trade` serves the app
and `/api/status` returns JSON. That condition has not been met.

All five endpoints return HTTP 403 from Vercel's edge layer before reaching
the Next.js application. The response body is the plain-text string
`Host not in allowlist` — not JSON. All `jq` commands exited with parse
error (exit 5).

### Probe results

#### `curl -s https://constructaiq.trade/api/status | jq .data`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-type: text/plain

Host not in allowlist
```
jq exit: **5** (parse error — not JSON)

#### `curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-type: text/plain

Host not in allowlist
```
jq exit: **5** (parse error — not JSON)

#### `curl -s https://constructaiq.trade/api/federal | jq '{dataSource, fromCache, contractors: (.contractors | length), agencies: (.agencies | length), fetchError}'`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-type: text/plain

Host not in allowlist
```
jq exit: **5** (parse error — not JSON)

#### `curl -s https://constructaiq.trade/api/weekly-brief | jq '{source, live, configured, warning, error}'`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-type: text/plain

Host not in allowlist
```
jq exit: **5** (parse error — not JSON)

#### `curl -s https://constructaiq.trade/api/dashboard | jq '{fetched_at, cshi: (.cshi | type), signals: (.signals | length), commodities: (.commodities | length), forecast: (.forecast | type)}'`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-type: text/plain

Host not in allowlist
```
jq exit: **5** (parse error — not JSON)

### Data-source status summary

| Surface | Expected (when live) | Observed | Fallback active? |
|---------|---------------------|----------|-----------------|
| `/api/status` `.data.federalSource` | `"usaspending.gov"` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/status` `.data.weeklyBriefSource` | `"ai"` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/status?deep=1` `.data.dashboardShapeOk` | `true` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/federal` `dataSource` | `"usaspending.gov"` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/federal` `contractors` count | `> 0` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/federal` `agencies` count | `> 0` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/weekly-brief` `source` | `"ai"` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/weekly-brief` `live` | `true` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/dashboard` `forecast` type | `"object"` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/dashboard` `cshi` type | `"object"` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/dashboard` `signals` length | `> 0` | **UNOBSERVABLE** | Unknown — domain blocked |
| `/api/dashboard` `commodities` length | `> 0` | **UNOBSERVABLE** | Unknown — domain blocked |

### `npm run lint`

ESLint exited 0 — no code errors. `next lint` fails in this sandbox due to
missing Sentry OpenTelemetry peers (pre-existing sandbox gap, not a code
defect — same as all prior phases).

| Tool | Exit code | Result |
|------|-----------|--------|
| ESLint (direct) | **0** | No errors, no warnings |
| `next lint` | 1 | Sandbox-only: missing `@opentelemetry/sdk-trace-base` — not a code defect |

### Fallback classification

No fallback state can be confirmed or denied — all endpoints are unreachable.
The fallback behavior documented in the Known Fallbacks section of this report
(written from code analysis) remains the authoritative description of what will
activate if individual data sources are unavailable once the domain is live.
None of those fallbacks are launch blockers on their own; the only launch
blocker is the Vercel domain binding.

### Data-source verification interpretation

**All data-source states are unobservable.** The single prerequisite — that
`constructaiq.trade` serves the Next.js application — is still unmet as of
2026-04-25 17:46 UTC.

This verification pass must be repeated in full after the Vercel domain
binding is completed and `/api/status` returns HTTP 200 JSON. The five
commands in this section are the exact commands to rerun at that time.

---

## Phase 5 launch gate — 2026-04-25 17:57 UTC

Full command: `npm run launch:check -- --include-smoke`

### Sandbox dependency note

The first run of this gate failed entirely because `@opentelemetry/sdk-trace-base`
was absent from the top-level `node_modules/` due to a Node.js version
mismatch between the sandbox (v22) and the lockfile's target (v20, per
`.github/workflows/ci.yml`). With Node 22, `npm ci` places the package only
under `node_modules/@sentry/node/node_modules/`, making it unreachable from
`@sentry/opentelemetry`. The package was installed at the top level for this
session using `npm install --no-save @opentelemetry/sdk-trace-base@1.30.1`
without modifying `package.json` or `package-lock.json`. The second run
produced the results below and is the authoritative record.

### Gate 5 — build / lint / unit tests

| Step | Exit | Wall time | Result |
|------|------|-----------|--------|
| `npm run build` | **0** | 105.6 s | `✓ Compiled successfully in 52s` — 84 routes, no errors |
| `npm run lint` | **0** | 11.8 s | `✔ No ESLint warnings or errors` |
| `npm test` | **0** | 6.5 s | `23 passed (23)` · `317 passed (317)` |

Gate 5 summary line: `✓  build  ✓  lint  ✓  unit tests`

Notable from build output:
- `⚠ Using edge runtime on a page currently disables static generation for that page` — pre-existing; expected on `/api/og/*` routes.
- `next lint` deprecation notice (`next lint will be removed in Next.js 16`) — pre-existing; not introduced by this work.

### Gate 4 — production smoke (`--include-smoke`)

| Step | Exit | Wall time | Checks |
|------|------|-----------|--------|
| `npm run smoke:prod` | **1** | 1.6 s | 1 passed, 5 failed |
| `npm run smoke:www` | **1** | 0.6 s | 1 passed, 1 failed |

#### `smoke:prod` detail

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

#### `smoke:www` detail

```
www redirect
  ✓  www DNS resolves (www.constructaiq.trade responded)
  ✗  www is bound to this Vercel project — HTTP 403

1 passed, 1 failed  ✗ Smoke test FAILED
```

### Final launch gate summary

```
  ✓  build
  ✓  lint
  ✓  unit tests
  ✗  smoke:prod
  ✗  smoke:www

✗ Launch readiness FAILED — smoke gates: smoke:prod, smoke:www
```

| Field | Value |
|-------|-------|
| Final exit code | **1** |
| Failing gate | `smoke gates: smoke:prod, smoke:www` |
| Root cause | Vercel project domain binding not completed — all requests return HTTP 403 `x-deny-reason: host_not_allowed` |
| Passing gates | build ✓, lint ✓, unit tests ✓ |
| Blocking gates | smoke:prod ✗, smoke:www ✗ |

### `npm run lint` (standalone)

Lint was also run standalone as required by this phase's task list. ESLint
exits 0 as part of the full gate. The `next lint` deprecation notice is
pre-existing and will remain until migration to the ESLint CLI.

| Tool | Exit | Result |
|------|------|--------|
| `npm run lint` (via launch gate) | **0** | `✔ No ESLint warnings or errors` |

### Phase 5 launch gate interpretation

**Gate 5 is fully green.** Build, lint, and all 317 unit tests pass cleanly.
The codebase is launch-ready from a code and build perspective.

**Gate 4 fails on both smoke checks.** The sole cause is the unresolved
Vercel domain binding (`host_not_allowed`). No additional code or
configuration change is needed beyond completing the Vercel domain binding
described in `docs/VERCEL_DOMAIN_FIX.md`.

Once the domain binding is complete, this gate should be rerun. The expected
outcome after domain binding (assuming env vars are also set) is:

```
  ✓  build
  ✓  lint
  ✓  unit tests
  ✓  smoke:prod
  ✓  smoke:www

✓ Automatable gates passed.
```

---

## Go / No-Go Summary

| Dimension        | Verdict     | Rationale                                                                                       |
|------------------|-------------|-------------------------------------------------------------------------------------------------|
| **Codebase**     | **GO**      | Build ✓, lint ✓, 317/317 tests ✓ — final sign-off run 2026-04-25 18:01 UTC. Gate 5 fully green on every Phase 5 pass. No code regression. SHA `8c1cd98d`. |
| **Public launch**| **NO-GO**   | Final sign-off 2026-04-25 18:01 UTC. Smoke: `smoke:prod` 1/6 passed, `smoke:www` 1/2 passed — both exit 1. Sole blocker: Vercel domain binding not completed. All requests return HTTP 403 `x-deny-reason: host_not_allowed`. See [Final Launch Sign-Off](#final-launch-sign-off) for operator steps. |

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
| 🔴 P0    | `constructaiq.trade` not bound to Vercel project              | HTTP 403 `host_not_allowed` on every request    | **Open** — confirmed by Phase 5 recheck 2026-04-25 17:39 UTC  | Vercel UI → Settings → Domains        |
| 🔴 P0    | `www.constructaiq.trade` not bound to Vercel project          | HTTP 403 `host_not_allowed` on www              | **Open** — confirmed by Phase 5 recheck 2026-04-25 17:39 UTC  | Vercel UI → Settings → Domains        |
| ✅ —     | DNS apex record                                               | ~~App unreachable at apex~~                     | **Resolved** — `www DNS resolves` passes; apex DNS propagated | No action needed |
| ✅ —     | DNS `www` CNAME                                               | ~~www unreachable~~                             | **Resolved** — www DNS resolves on every smoke run | No action needed |
| 🟡 P1    | Stray subdomain DNS (`api.`, `docs.`, `data.`, `app.`) unknown | Subdomains may resolve somewhere unintended    | Unverified — cannot check from sandbox | DNS provider — verify or remove     |

### Environment variable blockers

Verification status column reflects Phase 5 env verification attempt
(2026-04-25 17:43 UTC). All booleans are **UNOBSERVABLE** because
`/api/status` returns HTTP 403 before the application runs. Values will be
confirmed on first successful probe after the Vercel domain binding is
completed.

| Priority | Variable | `/api/status` boolean | Impact if missing | Verification status |
|----------|----------|-----------------------|-------------------|---------------------|
| 🔴 P0 | `NEXT_PUBLIC_SUPABASE_URL` | `supabaseConfigured` (partial) | All data routes fail; dashboard is empty | **UNOBSERVABLE** — domain blocked |
| 🔴 P0 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | _(not in boolean — client-side)_ | Client-side Supabase calls fail | **UNOBSERVABLE** — domain blocked |
| 🔴 P0 | `SUPABASE_SERVICE_ROLE_KEY` | `supabaseConfigured` (partial) | Server-side DB writes fail | **UNOBSERVABLE** — domain blocked |
| 🔴 P0 | `CRON_SECRET` | `cronSecretConfigured` | Data-refresh cron cannot authenticate | **UNOBSERVABLE** — domain blocked |
| 🔴 P0 | `SITE_LOCKED` must be `false` | `runtime.siteLocked` must be `false` | If `true`, all visitors hit Basic Auth | **UNOBSERVABLE** — domain blocked |
| 🟡 P1 | `ANTHROPIC_API_KEY` | `anthropicConfigured` | Weekly Brief stays on static fallback | **UNOBSERVABLE** — domain blocked |
| 🟡 P1 | `UPSTASH_REDIS_REST_URL` + `_TOKEN` | `upstashConfigured` | Rate limiting is DB-only, not real-time | **UNOBSERVABLE** — domain blocked |
| 🟡 P1 | `NEXT_PUBLIC_SENTRY_DSN` | `sentryConfigured` | Error capture is console-only | **UNOBSERVABLE** — domain blocked |
| 🟢 P2 | `NEXT_PUBLIC_APP_URL` | `runtime.appUrl` | Falls back to literal — survivable | **UNOBSERVABLE** — domain blocked |

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

---

## Final Launch Sign-Off

**Captured: 2026-04-25 18:01 UTC**
**Branch: `claude/verify-domain-fix-uDUrA`**
**Docs SHA: `a47f309c` · Code SHA: `8c1cd98d`**

---

### Verdict

```
PUBLIC LAUNCH: ◼ NO-GO
```

The codebase is launch-ready. The infrastructure is not.
One P0 external blocker prevents launch. No code change is required.

---

### Build / Lint / Test — final run (2026-04-25 18:01 UTC)

| Command | Exit | Wall time | Result |
|---------|------|-----------|--------|
| `npm run build` | **0** | ~80 s | `✓ Compiled successfully` — 84 routes, 0 errors |
| `npm run lint` | **0** | ~12 s | `✔ No ESLint warnings or errors` |
| `npm test` | **0** | ~6 s | `23 passed (23)` · `317 passed (317)` |

All three green. Gate 5 is fully closed.

---

### Smoke — final run (2026-04-25 17:57 UTC, via `npm run launch:check --include-smoke`)

| Command | Exit | Checks | Root cause |
|---------|------|--------|------------|
| `npm run smoke:prod` | **1** | 1 passed / 5 failed | HTTP 403 `x-deny-reason: host_not_allowed` on all endpoints |
| `npm run smoke:www` | **1** | 1 passed / 1 failed | HTTP 403 `x-deny-reason: host_not_allowed` on www |

Gate 4 fails on both checks. The smoke script itself is correct.
DNS resolves correctly (`www DNS resolves` passes on every run).
The issue is exclusively the Vercel project domain binding.

---

### Highest-priority blocker (P0 — sole launch blocker)

> **Vercel project domain binding not completed.**
>
> `constructaiq.trade` and `www.constructaiq.trade` have not been added
> to the ConstructAIQ Vercel project under **Settings → Domains**.
> Every inbound request is rejected at the Vercel edge before the
> Next.js application runs. This is not a DNS issue, not a code issue,
> and not a Cloudflare/firewall issue — DNS is already propagated.
>
> **Fix:** Complete Steps 1–4 in [`docs/VERCEL_DOMAIN_FIX.md`](./VERCEL_DOMAIN_FIX.md).

---

### Env / data-source status

All env booleans and data-source states are **UNOBSERVABLE** because
`/api/status` returns HTTP 403 before the application runs. They become
verifiable the moment the Vercel domain binding is completed.

| Check | Status |
|-------|--------|
| `supabaseConfigured` | UNOBSERVABLE — verify with `curl /api/status \| jq .env` after domain fix |
| `cronSecretConfigured` | UNOBSERVABLE — P0 env var, must be `true` before launch |
| `anthropicConfigured` | UNOBSERVABLE — P1; Weekly Brief falls back to static if absent |
| `upstashConfigured` | UNOBSERVABLE — P1; rate limiting is DB-only if absent |
| `sentryConfigured` | UNOBSERVABLE — P1; error capture is console-only if absent |
| `federalSource` | UNOBSERVABLE — expected `"usaspending.gov"` |
| `weeklyBriefSource` | UNOBSERVABLE — expected `"ai"` after first cron run |
| `dashboardShapeOk` | UNOBSERVABLE — expected `true` |

---

### Pending operator actions — complete in this order

**Step 1 (required — blocks everything):**

```
Vercel UI → ConstructAIQ project → Settings → Domains
  → Add: constructaiq.trade
  → Add: www.constructaiq.trade
Wait for green checkmarks (1–10 min after DNS validates).
```

Full walkthrough: [`docs/VERCEL_DOMAIN_FIX.md`](./VERCEL_DOMAIN_FIX.md) Steps 1–4.

**Step 2 (required — run after Step 1):**

```bash
curl -sSI https://constructaiq.trade | head -1
# must return HTTP/2 200 (not 403)
```

**Step 3 (required — set in Vercel Production scope, then redeploy):**

```
NEXT_PUBLIC_SUPABASE_URL     = <your Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY = <anon/public key>
SUPABASE_SERVICE_ROLE_KEY    = <service role key>
CRON_SECRET                  = <long random string>
SITE_LOCKED                  = false
```

Walkthrough: [`docs/ENVIRONMENT.md`](./ENVIRONMENT.md).

**Step 4 (required — verify env after redeploy):**

```bash
curl -s https://constructaiq.trade/api/status | jq .env
# supabaseConfigured and cronSecretConfigured must be true
```

**Step 5 (required — final smoke gate):**

```bash
npm run smoke:prod   # must exit 0
npm run smoke:www    # must exit 0
```

Only after both exit 0 may the verdict change to **GO**.

**Step 6 (recommended — full launch gate):**

```bash
npm run launch:check -- --include-smoke
# must end: ✓ Automatable gates passed.
```

---

### Post-launch monitoring (first 30 minutes)

Run from any machine with outbound network immediately after going live:

```bash
# Smoke — must both exit 0
npm run smoke:prod
npm run smoke:www

# Env booleans — all five must be true
curl -s https://constructaiq.trade/api/status | jq .env

# Data sources — verify live (not fallback)
curl -s https://constructaiq.trade/api/status | jq .data
# federalSource: "usaspending.gov"
# weeklyBriefSource: "ai"

# Freshness — count of stale series (target 0)
curl -s https://constructaiq.trade/api/status | jq '[.freshness[] | select(.status=="stale")] | length'

# Dashboard shape
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data.dashboardShapeOk
# must be true
```

See [Post-Launch Monitoring Checklist](#post-launch-monitoring-checklist) above for the full list.

---

### Rollback

If a regression appears after launch, promote the last known-good
Vercel deployment via the Vercel UI (`Deployments → … → Promote to
Production`) or via `vercel rollback <id> --prod`. Then rerun
`npm run smoke:prod` to confirm. Full procedure:
[Rollback Procedure](#rollback-procedure).

The last known-good code SHA documented in this report is `8c1cd98d`.

---

### How to change this verdict to GO

1. Complete the five operator steps above.
2. Confirm `npm run smoke:prod` and `npm run smoke:www` both exit 0.
3. Confirm `curl /api/status | jq .env` shows `supabaseConfigured: true`
   and `cronSecretConfigured: true` at minimum.
4. Update this section: replace `◼ NO-GO` with `◆ GO`, add timestamp,
   record the smoke pass output, and sign with the operator name or
   GitHub handle that confirmed the live checks.

---

*This document is the single source of truth for ConstructAIQ launch state.
Last updated: 2026-04-25 18:01 UTC by `claude/verify-domain-fix-uDUrA`.*
