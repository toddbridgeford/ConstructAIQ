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

## Launch Blockers

## External Configuration Actions

## Environment Variable Actions

## Data Source Status

## Known Fallbacks

## Post-Launch Monitoring Checklist

## Rollback Procedure
