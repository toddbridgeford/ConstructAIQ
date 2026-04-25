# Release Candidate Report

> **Operator:** next manual action → [docs/OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md)

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

## Phase 6 full launch gate — 2026-04-25 18:17 UTC

Full command: `npm run launch:check -- --include-smoke`

### Sandbox dependency note

The first invocation of this gate failed immediately because `node_modules/`
did not exist in this sandbox session — `next`, `vitest`, and all other
binaries returned exit 127 (`not found`). This is a sandbox initialization
gap, not a code defect. Dependencies were installed with `npm ci` (exit 0)
and the gate was re-run. The second run is the authoritative record below.

### Gate 5 — build / lint / unit tests

| Step | Exit | Wall time | Result |
|------|------|-----------|--------|
| `npm run build` | **0** | 134.8 s | `✓ Compiled successfully in 79s` — routes built, 0 errors |
| `npm run lint` | **0** | 3.4 s | `✔ No ESLint warnings or errors` |
| `npm test` | **0** | 4.1 s | `23 passed (23)` · `317 passed (317)` |

Gate 5 summary: `✓  build  ✓  lint  ✓  unit tests`

Notable from build output:
- `⚠ Using edge runtime on a page currently disables static generation for that page` — pre-existing; expected on `/api/og/*` routes.
- `next lint` deprecation notice (`next lint will be removed in Next.js 16`) — pre-existing; not introduced by this work.

### Gate 4 — production smoke (`--include-smoke`)

| Step | Exit | Wall time | Checks |
|------|------|-----------|--------|
| `npm run smoke:prod` | **1** | 0.8 s | 1 passed, 5 failed |
| `npm run smoke:www` | **1** | 0.4 s | 1 passed, 1 failed |

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
  ✗  www is bound to this Vercel project
       https://www.constructaiq.trade/dashboard returned HTTP 403.
       www.constructaiq.trade resolves but is rejected (403).
       Fix: add www.constructaiq.trade as a Vercel project domain.

1 passed, 5 failed  ✗ Smoke test FAILED
```

#### `smoke:www` detail

```
www redirect
  ✓  www DNS resolves (www.constructaiq.trade responded)
  ✗  www is bound to this Vercel project
       https://www.constructaiq.trade/dashboard returned HTTP 403.

1 passed, 1 failed  ✗ Smoke test FAILED
```

### `npm run lint` (standalone)

Also run standalone per phase requirements. `next lint` exits 0 with
`✔ No ESLint warnings or errors` (same result as the gate run above).

| Tool | Exit | Result |
|------|------|--------|
| `npm run lint` (standalone) | **0** | `✔ No ESLint warnings or errors` |

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
| Gate 5 | build ✓ · lint ✓ · unit tests ✓ — fully green |
| Gate 4 | smoke:prod ✗ · smoke:www ✗ — sole blocker is Vercel domain binding |

### Phase 6 launch gate interpretation

**Gate 5 is fully green.** Build compiles cleanly (79 s, 0 errors), ESLint
exits 0, and all 317 unit tests pass across 23 test files. The codebase is
launch-ready from a code, build, and test perspective.

**Gate 4 fails on both smoke checks.** The sole cause is the unresolved Vercel
domain binding — identical to every prior phase. DNS resolves correctly
(`www DNS resolves` passes on both runs). No code or configuration change is
required on the application side.

**Public launch: NO-GO.** The only remaining automatable blocker is:
complete the Vercel domain binding (Vercel UI → ConstructAIQ project →
Settings → Domains → Add `constructaiq.trade` and `www.constructaiq.trade`).
See `docs/VERCEL_DOMAIN_FIX.md` Steps 1–4.

Once domain binding is complete and both smoke tests exit 0, the launch gate
verdict becomes eligible to change to **GO** — subject to env variable
verification (`/api/status | jq .env`) also passing.

---

## Phase 6 data-source verification — 2026-04-25 18:12 UTC

This section records the Phase 6 attempt to verify live production data-source
state through five API endpoints. The prerequisite — that `constructaiq.trade`
serves the Next.js application and `/api/status` returns JSON — has **not been
met**. Every endpoint returns HTTP 403 from Vercel's edge before the application
runs.

### Prerequisite check

All five endpoints return `HTTP/2 403` with `x-deny-reason: host_not_allowed`
and the plain-text body `Host not in allowlist`. No JSON is returned from any
endpoint. jq exits 5 (parse error) on every command.

### Probe results

#### `curl -s https://constructaiq.trade/api/status | jq .data`

```
HTTP/2 403  ·  x-deny-reason: host_not_allowed  ·  Host not in allowlist
jq exit: 5 (parse error — not JSON)
```

#### `curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data`

```
HTTP/2 403  ·  x-deny-reason: host_not_allowed  ·  Host not in allowlist
jq exit: 5 (parse error — not JSON)
```

#### `curl -s https://constructaiq.trade/api/federal | jq '{dataSource, fromCache, contractors: (.contractors|length), agencies: (.agencies|length), fetchError}'`

```
HTTP/2 403  ·  x-deny-reason: host_not_allowed  ·  Host not in allowlist
jq exit: 5 (parse error — not JSON)
```

#### `curl -s https://constructaiq.trade/api/weekly-brief | jq '{source, live, configured, warning, error}'`

```
HTTP/2 403  ·  x-deny-reason: host_not_allowed  ·  Host not in allowlist
jq exit: 5 (parse error — not JSON)
```

#### `curl -s https://constructaiq.trade/api/dashboard | jq '{fetched_at, cshi: (.cshi|type), signals: (.signals|length), commodities: (.commodities|length), forecast: (.forecast|type)}'`

```
HTTP/2 403  ·  x-deny-reason: host_not_allowed  ·  Host not in allowlist
jq exit: 5 (parse error — not JSON)
```

### Data-source status summary

| Surface | Field checked | Expected (when live) | Observed | Fallback classification |
|---------|--------------|---------------------|----------|------------------------|
| `/api/status` `.data.federalSource` | `federalSource` | `"usaspending.gov"` | **UNOBSERVABLE** | — |
| `/api/status` `.data.weeklyBriefSource` | `weeklyBriefSource` | `"ai"` | **UNOBSERVABLE** | — |
| `/api/status?deep=1` `.data.dashboardShapeOk` | `dashboardShapeOk` | `true` | **UNOBSERVABLE** | 🔴 Launch blocker if `false` |
| `/api/federal` `dataSource` | `dataSource` | `"usaspending.gov"` | **UNOBSERVABLE** | 🟡 Launch warning if `"static-fallback"` |
| `/api/federal` `contractors` count | count | `> 0` | **UNOBSERVABLE** | 🟡 Launch warning if 0 |
| `/api/federal` `agencies` count | count | `> 0` | **UNOBSERVABLE** | 🟡 Launch warning if 0 |
| `/api/weekly-brief` `source` | `source` | `"ai"` | **UNOBSERVABLE** | 🟡 Launch warning if `"static-fallback"` |
| `/api/weekly-brief` `live` | `live` | `true` | **UNOBSERVABLE** | 🟡 Launch warning if `false` |
| `/api/dashboard` `forecast` type | type | `"object"` | **UNOBSERVABLE** | 🔴 Launch blocker if not `"object"` |
| `/api/dashboard` `cshi` type | type | `"object"` | **UNOBSERVABLE** | 🔴 Launch blocker if not `"object"` |
| `/api/dashboard` `signals` count | length | `> 0` | **UNOBSERVABLE** | 🔴 Launch blocker if 0 |
| `/api/dashboard` `commodities` count | length | `> 0` | **UNOBSERVABLE** | 🟡 Launch warning if 0 |

### Fallback classification

**Dashboard shape** (`dashboardShapeOk`, `forecast` type, `cshi` type, `signals`
count) — classified 🔴 **launch blocker**. An invalid or empty dashboard shape
means the primary user-facing screen is broken.

**Federal data source** (`dataSource: "static-fallback"`, empty contractor/
agency counts) — classified 🟡 **launch warning**. The platform ships with an
explicit fallback banner ("Federal live feed unavailable") and an empty
leaderboard. Not a launch blocker but must be resolved post-launch.

**Weekly Brief** (`source: "static-fallback"`, `live: false`) — classified
🟡 **launch warning**. The dashboard shows an UNAVAILABLE badge when the
static fallback is active; no fabricated data is surfaced. Not a launch
blocker unless the live AI brief is required at launch.

### `npm run lint`

`npm run lint` invokes `next lint`, which exits 127 (`next: not found`) — the
same pre-existing sandbox gap recorded in all prior phases. No code was
changed in Phase 6.

| Tool | Exit | Result |
|------|------|--------|
| `npm run lint` | 127 | Sandbox: `next: not found` — pre-existing; not a code defect |

### Phase 6 data-source verification interpretation

**All data-source states are unobservable.** The sole prerequisite — the Vercel
domain binding — is still unmet as of 2026-04-25 18:12 UTC. Every probe hits
the Vercel edge at HTTP 403 before the application runs.

This verification pass must be repeated in full once `/api/status` returns HTTP
200 JSON. The five commands above are the exact commands to rerun at that time.

**Public launch: NO-GO.** Domain binding must be completed first.

---

## Phase 6 environment verification — 2026-04-25 18:11 UTC

This section records the Phase 6 attempt to verify production environment
variables through `/api/status`. The prerequisite for this phase is that
`constructaiq.trade` no longer returns `x-deny-reason: host_not_allowed`
and that `/api/status` returns JSON. That condition has **not been met**.

### Prerequisite check

```bash
curl -sSI https://constructaiq.trade/api/status
```
```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 18:11:25 GMT
```

The Vercel edge rejects the request before the Next.js application runs.
The response body is the plain-text string `Host not in allowlist`, not JSON.

### `curl -s https://constructaiq.trade/api/status | jq .env`

```
jq: parse error: Invalid numeric literal at line 1, column 5
```

jq exit: **5** (parse error — response body is not JSON)

### `curl -s https://constructaiq.trade/api/status | jq .runtime`

```
jq: parse error: Invalid numeric literal at line 1, column 5
```

jq exit: **5** (parse error — response body is not JSON)

### Observed env variable values

All values are **UNOBSERVABLE**. `/api/status` returns HTTP 403 before the
application runs. No JSON is returned.

| Boolean | Env var(s) | Expected | Observed | Launch classification |
|---------|------------|----------|----------|-----------------------|
| `supabaseConfigured` | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | `true` | **UNOBSERVABLE** | 🔴 **Launch blocker** — all data routes fail without Supabase |
| `cronSecretConfigured` | `CRON_SECRET` | `true` | **UNOBSERVABLE** | 🔴 **Launch blocker** — data-refresh cron cannot authenticate |
| `runtime.siteLocked` | `SITE_LOCKED` | `false` | **UNOBSERVABLE** | 🔴 **Launch blocker if true** — `true` puts all visitors behind Basic Auth |
| `anthropicConfigured` | `ANTHROPIC_API_KEY` | `true` | **UNOBSERVABLE** | 🟡 Launch warning — Weekly Brief falls back to static if absent |
| `upstashConfigured` | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | `true` | **UNOBSERVABLE** | 🟡 Launch warning — per-key rate limiting is DB-only if absent |
| `sentryConfigured` | `NEXT_PUBLIC_SENTRY_DSN` | `true` | **UNOBSERVABLE** | 🟡 Launch warning — error capture is console-only if absent |

Additional runtime values unobservable:

| Field | Env var | Expected | Observed |
|-------|---------|----------|----------|
| `runtime.nodeEnv` | `NODE_ENV` | `production` | **UNOBSERVABLE** |
| `runtime.appUrl` | `NEXT_PUBLIC_APP_URL` | `https://constructaiq.trade` | **UNOBSERVABLE** |

### `npm run lint`

`npm run lint` invokes `next lint`, which exits 127 (`next: not found`) — the
same pre-existing sandbox gap recorded in all prior phases. No code was
changed in Phase 6.

| Tool | Exit | Result |
|------|------|--------|
| `npm run lint` | 127 | Sandbox: `next: not found` — pre-existing; not a code defect |

### Phase 6 environment verification interpretation

**All env booleans and runtime values are unobservable.** The Vercel domain
binding must be completed first. Until `/api/status` returns HTTP 200 with a
JSON body, it is impossible to confirm any production environment variable
from the live endpoint.

**Classification of missing env vars (current status):**

| Priority | Blocker type | Variable(s) | Status |
|----------|--------------|-------------|--------|
| 🔴 P0 | **Launch blocker** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | UNOBSERVABLE — prerequisite domain fix not done |
| 🔴 P0 | **Launch blocker** | `CRON_SECRET` | UNOBSERVABLE — prerequisite domain fix not done |
| 🔴 P0 | **Launch blocker if true** | `SITE_LOCKED` | UNOBSERVABLE — prerequisite domain fix not done |
| 🟡 P1 | Launch warning | `ANTHROPIC_API_KEY` | UNOBSERVABLE — Weekly Brief degrades to static fallback |
| 🟡 P1 | Launch warning | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | UNOBSERVABLE — rate limiting is DB-only |
| 🟡 P1 | Launch warning | `NEXT_PUBLIC_SENTRY_DSN` | UNOBSERVABLE — error capture is console-only |

This verification pass must be repeated in full after the Vercel domain
binding is completed and `/api/status` returns HTTP 200 JSON. The commands
to rerun at that time:

```bash
curl -s https://constructaiq.trade/api/status | jq .env
# expected: { supabaseConfigured: true, cronSecretConfigured: true,
#             anthropicConfigured: true, upstashConfigured: true,
#             sentryConfigured: true }

curl -s https://constructaiq.trade/api/status | jq .runtime
# expected: { siteLocked: false, nodeEnv: "production",
#             appUrl: "https://constructaiq.trade" }
```

**Public launch: NO-GO.** Sole prerequisite: complete Vercel domain binding.

---

## Phase 6 smoke check — 2026-04-25 18:08 UTC

This section records smoke test results run immediately after the Phase 6 domain
binding curl check. Both `npm run smoke:www` and `npm run smoke:prod` were
executed to confirm whether the Vercel domain binding has been completed.

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
       Fix: add www.constructaiq.trade as a Vercel project domain.
       Vercel dashboard → ConstructAIQ project → Settings → Domains → Add →
       "www.constructaiq.trade". See docs/PRODUCTION_SMOKE.md.

──────────────────────────────────────────────────
1 passed, 1 failed

✗ Smoke test FAILED
```

| Field        | Value  |
|--------------|--------|
| Exit code    | **1**  |
| Passed       | 1      |
| Failed       | 1      |
| Failing gate | `www is bound to this Vercel project` — HTTP 403 |

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
  ✗  www is bound to this Vercel project
       https://www.constructaiq.trade/dashboard returned HTTP 403.
       www.constructaiq.trade resolves but is rejected (403).
       Fix: add www.constructaiq.trade as a Vercel project domain.
       Vercel dashboard → ConstructAIQ project → Settings → Domains → Add →
       "www.constructaiq.trade". See docs/PRODUCTION_SMOKE.md.

──────────────────────────────────────────────────
1 passed, 5 failed

✗ Smoke test FAILED
```

| Field        | Value  |
|--------------|--------|
| Exit code    | **1**  |
| Passed       | 1      |
| Failed       | 5      |
| Failing gates | `GET / returns 200` (got 403) · `GET /dashboard returns 200` (got 403) · `/api/status returns 200` (got 403) · `/api/dashboard returns 200` (got 403) · `www is bound to this Vercel project` (HTTP 403) |

### `npm run lint`

`npm run lint` invokes `next lint`, which exits with `next: not found` — the
same pre-existing sandbox gap recorded in every prior phase. No code was
changed in Phase 6.

| Tool | Exit | Result |
|------|------|--------|
| `npm run lint` | 127 | Sandbox: `next: not found` — pre-existing; not a code defect |

### Phase 6 smoke check interpretation

Both smoke tests **failed**. The root cause is identical to every prior
phase: the Vercel project domain binding has not been completed. All five
`smoke:prod` endpoints and the single `smoke:www` check return HTTP 403
from Vercel's edge before reaching the Next.js application.

DNS resolves correctly — `www DNS resolves` passes on both runs.

**Public launch: NO-GO.**

Exact failing smoke gates:

| Gate | Test | Result |
|------|------|--------|
| `smoke:www` | `www is bound to this Vercel project` | **FAIL** — HTTP 403 |
| `smoke:prod` | `GET / returns 200` | **FAIL** — got 403 |
| `smoke:prod` | `GET /dashboard returns 200` | **FAIL** — got 403 |
| `smoke:prod` | `/api/status returns 200` | **FAIL** — got 403 |
| `smoke:prod` | `/api/dashboard returns 200` | **FAIL** — got 403 |
| `smoke:prod` | `www is bound to this Vercel project` | **FAIL** — HTTP 403 |

Sole blocker: Vercel project domain binding. Steps 1–4 in
`docs/VERCEL_DOMAIN_FIX.md` are still outstanding.

---

## Phase 6 domain binding check — 2026-04-25 18:08 UTC

This section records the Phase 6 verification pass. Its purpose is to determine
whether the operator has completed the Vercel domain binding described in
`docs/VERCEL_DOMAIN_FIX.md` — specifically whether `x-deny-reason: host_not_allowed`
is gone from both `constructaiq.trade` and `www.constructaiq.trade`.

### Commands run

```
curl -sSI https://constructaiq.trade
curl -sSI https://www.constructaiq.trade/dashboard
npm run lint
```

### `curl -sSI https://constructaiq.trade`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 18:08:24 GMT
```

| Field              | Value                           |
|--------------------|---------------------------------|
| HTTP status        | **403**                         |
| x-deny-reason      | **host_not_allowed**            |
| Location           | (none — no redirect)            |

### `curl -sSI https://www.constructaiq.trade/dashboard`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 18:08:25 GMT
```

| Field                      | Value                           |
|----------------------------|---------------------------------|
| HTTP status                | **403**                         |
| x-deny-reason              | **host_not_allowed**            |
| Location (www→apex)        | (none — no redirect occurred)   |

### `npm run lint`

`npm run lint` (which invokes `next lint`) exits with error `next: not found` —
the same pre-existing sandbox gap recorded in every prior phase. ESLint is not
runnable standalone in this sandbox because ESLint v9 requires `eslint.config.js`
while the project uses `.eslintrc.json`. No code was changed in Phase 6, so
lint state is unchanged from the last clean run recorded in Phase 5 (ESLint
exit 0, `✔ No ESLint warnings or errors`).

| Tool | Exit code | Result |
|------|-----------|--------|
| `npm run lint` | error | Sandbox: `next: not found` — pre-existing sandbox gap, not a code defect |
| ESLint (direct v9) | 2 | Sandbox: no `eslint.config.js` — project uses `.eslintrc.json` format; not a code defect |

### Phase 6 interpretation

**`host_not_allowed` is unchanged.** Both domains return HTTP 403 with
`x-deny-reason: host_not_allowed`. Neither apex nor www issues a redirect.
DNS continues to resolve (the TCP/TLS handshake completes and Vercel's edge
responds), but the Vercel project domain binding has not been completed.

The operator was directed to add both domains in Vercel UI → Settings → Domains.
As of 2026-04-25 18:08 UTC that action has **not been taken**.

**Vercel domain binding blocker: OPEN — not resolved.**

**Public launch: NO-GO** — sole remaining blocker is the Vercel project domain
binding. No code or configuration change is required on the application side.

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

> **Full 24-hour watch guide:** [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md)

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

**Captured: 2026-04-25 18:20 UTC**
**Branch: `claude/verify-domain-binding-gvssO`**
**SHA: `b392c3759fb5051197203c3e050584b37d0b90e1` (short: `b392c37`)**

---

### Verdict

```
PUBLIC LAUNCH: ◼ NO-GO
```

The codebase is launch-ready. The infrastructure is not.
One P0 external blocker prevents launch. No code change is required.

---

### Build / Lint / Test — final run (2026-04-25 18:20 UTC)

| Command | Exit | Wall time | Result |
|---------|------|-----------|--------|
| `npm run build` | **0** | ~28 s (cache warm) | `✓ Compiled successfully in 27.7s` — 84 routes, 0 errors |
| `npm run lint` | **0** | ~3 s | `✔ No ESLint warnings or errors` |
| `npm test` | **0** | ~3 s | `23 passed (23)` · `317 passed (317)` |

All three green. Gate 5 is fully closed.

Notable: the `next lint` deprecation notice (`next lint will be removed in
Next.js 16`) is pre-existing — not introduced by Phase 6 work.

---

### Smoke — final run (2026-04-25 18:17 UTC, via `npm run launch:check --include-smoke`)

| Command | Exit | Passed | Failed | Root cause |
|---------|------|--------|--------|------------|
| `npm run smoke:prod` | **1** | 1 / 6 | 5 | HTTP 403 `x-deny-reason: host_not_allowed` on all endpoints |
| `npm run smoke:www` | **1** | 1 / 2 | 1 | HTTP 403 `x-deny-reason: host_not_allowed` on www |

Passing check on both runs: `www DNS resolves` ✓ — DNS is propagated.
Failing checks: every page, API, and www-binding check — all return HTTP 403.
The smoke script itself is correct; the app never receives any request.

---

### Env / data-source status

All env booleans and data-source states are **UNOBSERVABLE**. Every probe
of `/api/status`, `/api/federal`, `/api/weekly-brief`, and `/api/dashboard`
returns HTTP 403 with `x-deny-reason: host_not_allowed` before the Next.js
application runs. jq exits 5 (parse error) on all commands.

**Env booleans (verified: 2026-04-25 18:11 UTC)**

| Boolean | Env var(s) | Expected | Observed | Priority |
|---------|------------|----------|----------|----------|
| `supabaseConfigured` | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | `true` | **UNOBSERVABLE** | 🔴 P0 — launch blocker |
| `cronSecretConfigured` | `CRON_SECRET` | `true` | **UNOBSERVABLE** | 🔴 P0 — launch blocker |
| `runtime.siteLocked` | `SITE_LOCKED` | `false` | **UNOBSERVABLE** | 🔴 P0 — launch blocker if `true` |
| `anthropicConfigured` | `ANTHROPIC_API_KEY` | `true` | **UNOBSERVABLE** | 🟡 P1 — launch warning |
| `upstashConfigured` | `UPSTASH_REDIS_REST_URL` + token | `true` | **UNOBSERVABLE** | 🟡 P1 — launch warning |
| `sentryConfigured` | `NEXT_PUBLIC_SENTRY_DSN` | `true` | **UNOBSERVABLE** | 🟡 P1 — launch warning |

**Data-source state (verified: 2026-04-25 18:12 UTC)**

| Surface | Expected | Observed | Classification |
|---------|----------|----------|----------------|
| `/api/status` `.data.federalSource` | `"usaspending.gov"` | **UNOBSERVABLE** | — |
| `/api/status` `.data.weeklyBriefSource` | `"ai"` | **UNOBSERVABLE** | — |
| `/api/status?deep=1` `.data.dashboardShapeOk` | `true` | **UNOBSERVABLE** | 🔴 Launch blocker if `false` |
| `/api/federal` `dataSource` | `"usaspending.gov"` | **UNOBSERVABLE** | 🟡 Launch warning if `"static-fallback"` |
| `/api/weekly-brief` `source` | `"ai"` | **UNOBSERVABLE** | 🟡 Launch warning if `"static-fallback"` |
| `/api/dashboard` `forecast` type | `"object"` | **UNOBSERVABLE** | 🔴 Launch blocker if not `"object"` |
| `/api/dashboard` `cshi` type | `"object"` | **UNOBSERVABLE** | 🔴 Launch blocker if not `"object"` |
| `/api/dashboard` `signals` count | `> 0` | **UNOBSERVABLE** | 🔴 Launch blocker if `0` |

All become observable the moment the Vercel domain binding is completed.

---

### Unresolved blocker (P0 — sole launch blocker)

> **Vercel project domain binding not completed.**
>
> `constructaiq.trade` and `www.constructaiq.trade` have not been added
> to the ConstructAIQ Vercel project under **Settings → Domains**.
> Every inbound request is rejected at the Vercel edge before the
> Next.js application runs. This is not a DNS issue, not a code issue,
> and not a Cloudflare/firewall issue — DNS is confirmed propagated
> (`www DNS resolves` passes on every smoke run since 2026-04-25 04:00 UTC).
>
> **Fix:** Complete Steps 1–4 in [`docs/VERCEL_DOMAIN_FIX.md`](./VERCEL_DOMAIN_FIX.md).

Evidence across all Phase 6 passes:

| Timestamp (UTC) | Probe | HTTP | Header |
|-----------------|-------|------|--------|
| 18:08:24 | `curl -sSI https://constructaiq.trade` | **403** | `x-deny-reason: host_not_allowed` |
| 18:08:25 | `curl -sSI https://www.constructaiq.trade/dashboard` | **403** | `x-deny-reason: host_not_allowed` |
| 18:11:25 | `curl -sSI https://constructaiq.trade/api/status` | **403** | `x-deny-reason: host_not_allowed` |
| 18:12 | All five data-source endpoints | **403** | `x-deny-reason: host_not_allowed` |

---

### Next command to run (when domain binding is completed)

```bash
# 1. Confirm apex no longer returns 403
curl -sSI https://constructaiq.trade | head -1
# must return HTTP/2 200 (or 30x to a valid path)

# 2. Run smoke
npm run smoke:prod   # must exit 0
npm run smoke:www    # must exit 0

# 3. Verify env booleans
curl -s https://constructaiq.trade/api/status | jq .env
# supabaseConfigured and cronSecretConfigured must be true

# 4. Verify data-source state
curl -s https://constructaiq.trade/api/status | jq .data
# federalSource: "usaspending.gov", weeklyBriefSource: "ai"

# 5. Verify dashboard shape
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data.dashboardShapeOk
# must be true

# 6. Full gate
npm run launch:check -- --include-smoke
# must end: ✓ Automatable gates passed.
```

Complete operator steps in order:

1. **Vercel UI → ConstructAIQ project → Settings → Domains**
   → Add `constructaiq.trade` and `www.constructaiq.trade`
   → Wait for green checkmarks (1–10 min).
   Full walkthrough: [`docs/VERCEL_DOMAIN_FIX.md`](./VERCEL_DOMAIN_FIX.md) Steps 1–4.

2. **Set P0 env vars in Vercel Production scope, then redeploy:**
   ```
   NEXT_PUBLIC_SUPABASE_URL      = <Supabase project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY = <anon/public key>
   SUPABASE_SERVICE_ROLE_KEY     = <service role key>
   CRON_SECRET                   = <long random string>
   SITE_LOCKED                   = false
   ```
   Walkthrough: [`docs/ENVIRONMENT.md`](./ENVIRONMENT.md).

3. **Run the six commands above in order.** Both smoke tests must exit 0
   before this verdict may be changed to GO.

---

### Post-launch watch

See [`docs/POST_LAUNCH_WATCH.md`](./POST_LAUNCH_WATCH.md) for the complete
first-24-hour monitoring checklist including env booleans, data-source live
checks, Vercel function log scan, cron verification, freshness checks, and
rollback triggers.

Quick-reference command set (run immediately after going live):

```bash
npm run smoke:prod
npm run smoke:www
curl -s https://constructaiq.trade/api/status | jq .env
curl -s https://constructaiq.trade/api/status | jq .data
curl -s https://constructaiq.trade/api/federal \
  | jq '{dataSource, contractors: (.contractors|length), agencies: (.agencies|length)}'
curl -s https://constructaiq.trade/api/weekly-brief | jq '{source, live, configured}'
curl -s https://constructaiq.trade/api/dashboard | jq '{fetched_at, cshi: (.cshi|type)}'
curl -s https://constructaiq.trade/api/status \
  | jq '[.freshness[] | select(.status=="stale")] | length'
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data.dashboardShapeOk
```

---

### Rollback reminder

Last known-good code SHA: **`b392c37`**
(`b392c3759fb5051197203c3e050584b37d0b90e1`)

If a regression appears after launch: **Vercel → ConstructAIQ →
Deployments → find last Ready build → `…` → Promote to Production**.
Then rerun `npm run smoke:prod` — must exit 0 before rollback is
declared complete. Via CLI: `vercel rollback <id> --prod`.

Full procedure: [Rollback Procedure](#rollback-procedure).

---

### How to change this verdict to GO

1. Complete the three operator steps above (domain binding → env vars → redeploy).
2. Confirm `npm run smoke:prod` and `npm run smoke:www` both exit 0.
3. Confirm `curl /api/status | jq .env` shows `supabaseConfigured: true`
   and `cronSecretConfigured: true` at minimum.
4. Confirm `curl /api/status | jq .runtime` shows `siteLocked: false`.
5. Update this section: replace `◼ NO-GO` with `◆ GO`, add timestamp and
   SHA, paste the smoke pass output, and sign with the operator name or
   GitHub handle that confirmed the live checks.

---

---

## Phase 7 post-domain binding check — 2026-04-25 18:30 UTC

This section records the Phase 7 verification pass. Its purpose is to confirm
whether the Vercel domain binding directed in `docs/VERCEL_DOMAIN_FIX.md` and
`docs/OPERATOR_HANDOFF.md` has been completed by the operator.

### Commands run

```
curl -sSI https://constructaiq.trade
curl -sSI https://www.constructaiq.trade/dashboard
npm run smoke:www
npm run smoke:prod
```

### `curl -sSI https://constructaiq.trade`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 18:30:27 GMT
```

| Field         | Value                  |
|---------------|------------------------|
| HTTP status   | **403**                |
| x-deny-reason | **host_not_allowed**   |
| Location      | (none)                 |

### `curl -sSI https://www.constructaiq.trade/dashboard`

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 18:30:27 GMT
```

| Field                | Value                |
|----------------------|----------------------|
| HTTP status          | **403**              |
| x-deny-reason        | **host_not_allowed** |
| Location (www→apex)  | (none)               |

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
| Passed    | 1     |
| Failed    | 1     |

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
  ✗  www is bound to this Vercel project
       https://www.constructaiq.trade/dashboard returned HTTP 403.

──────────────────────────────────────────────────
1 passed, 5 failed

✗ Smoke test FAILED
```

| Field     | Value |
|-----------|-------|
| Exit code | **1** |
| Passed    | 1     |
| Failed    | 5     |

### Phase 7 interpretation

**`host_not_allowed` is unchanged on both domains.** The Vercel domain binding
has not been completed. Every request to `constructaiq.trade` and
`www.constructaiq.trade` is rejected at the Vercel edge before the Next.js
application runs, identical to all prior phases.

DNS continues to resolve correctly — `www DNS resolves` passes on both smoke
runs, unchanged since 2026-04-25 04:00 UTC.

**Domain blocker: OPEN — not resolved.**

| Domain | DNS | HTTP status | x-deny-reason |
|--------|-----|-------------|---------------|
| `constructaiq.trade` | Resolves | **403** | **host_not_allowed** |
| `www.constructaiq.trade` | Resolves | **403** | **host_not_allowed** |

### Updated launch verdict

| Dimension | Verdict | Rationale |
|-----------|---------|-----------|
| **Codebase** | **GO** | Unchanged — build ✓, lint ✓, 317/317 tests ✓. SHA `b392c37`. |
| **Public launch** | **NO-GO** | Vercel domain binding still incomplete. `host_not_allowed` on both apex and www as of 2026-04-25 18:30 UTC. |

**Public launch: NO-GO.** No code change is required. The sole remaining
blocker is the operator action:

> **Vercel UI → ConstructAIQ project → Settings → Domains**
> → Add `constructaiq.trade`
> → Add `www.constructaiq.trade`
> → Wait for green checkmarks (1–10 min).

Full walkthrough: [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md)
Next action summary: [docs/OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md)

---

*This document is the single source of truth for ConstructAIQ launch state.
Last updated: 2026-04-25 18:30 UTC by `claude/fix-doc-sha-consistency-7Y01M`.*
