# Launch Authority

**Updated: 2026-04-25 19:10 UTC**

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Build | **GO** — `✓ Compiled successfully` · 84 routes · 0 errors (94.6 s) |
| Lint | **GO** — `✔ No ESLint warnings or errors` |
| Tests | **GO** — 23 files · 317/317 passed |
| Smoke | **NO-GO** — `smoke:prod` exit 1 · `smoke:www` exit 1 |
| Public launch | **NO-GO** — sole blocker: Vercel domain binding (see below) |

---

## P0 blocker

Vercel does not recognise `constructaiq.trade` or `www.constructaiq.trade`.
Every inbound request is rejected at the edge (`x-deny-reason: host_not_allowed`)
before the Next.js app runs. DNS is correct. No code change is needed.

---

## Next action — do this now

**Vercel UI → ConstructAIQ project → Settings → Domains**

1. **Add Domain** → `constructaiq.trade` → confirm.
2. **Add Domain** → `www.constructaiq.trade` → confirm.
3. Wait for a green checkmark on both (SSL provisions in 1–10 minutes).

Step-by-step walkthrough: [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md)

---

## Verify — run these after binding

```bash
curl -sSI https://constructaiq.trade
curl -sSI https://www.constructaiq.trade/dashboard
npm run smoke:www
npm run smoke:prod
```

**Pass state:**
- `curl -sSI https://constructaiq.trade` returns `HTTP/2 200` (or a valid canonical redirect) — no `x-deny-reason` header.
- `curl -sSI https://www.constructaiq.trade/dashboard` returns `HTTP/2 301`, `302`, or `308` with a `location` header pointing to `https://constructaiq.trade/dashboard` — no `x-deny-reason` header.
- `npm run smoke:www` exits 0 and prints `✓ All checks passed`.
- `npm run smoke:prod` exits 0 and prints `✓ All checks passed`.

If all four pass, the P0 is resolved. Update the verdict to **GO** and proceed
with env-variable verification (see [OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md)).

---

## Data-source verification — 2026-04-25 19:10 UTC (DEFERRED)

**Prerequisite not met.** `https://constructaiq.trade` returns
`HTTP/2 403 x-deny-reason: host_not_allowed`. All five probes return
`jq: parse error` (exit 5) — plain-text Vercel error body, not JSON.

| Probe | Exit | Observed | Classification |
|-------|------|----------|----------------|
| `/api/status \| jq .data` | **5** | parse error — HTTP 403 | UNVERIFIABLE |
| `/api/status?deep=1 \| jq .data` | **5** | parse error — HTTP 403 | UNVERIFIABLE |
| `/api/federal \| jq {dataSource,…}` | **5** | parse error — HTTP 403 | UNVERIFIABLE — warning if static fallback |
| `/api/weekly-brief \| jq {source,…}` | **5** | parse error — HTTP 403 | UNVERIFIABLE — warning if static fallback |
| `/api/dashboard \| jq {cshi,signals,…}` | **5** | parse error — HTTP 403 | UNVERIFIABLE — **launch blocker if shape invalid** |

All probes will be run immediately after `smoke:prod` exits 0.

---

## Env/data verification — 2026-04-25 19:07 UTC (DEFERRED)

**Prerequisite not met.** `https://constructaiq.trade` still returns
`HTTP/2 403 x-deny-reason: host_not_allowed` as of 19:04 UTC.

```
curl -s https://constructaiq.trade/api/status | jq .env
# → jq: parse error: Invalid numeric literal at line 1, column 5 (exit 5)

curl -s https://constructaiq.trade/api/status | jq .runtime
# → jq: parse error: Invalid numeric literal at line 1, column 5 (exit 5)
```

The endpoint body is the Vercel plain-text error string, not JSON. All env
booleans are unobservable until domain binding is complete.

| Probe | Status | Classification when false |
|-------|--------|---------------------------|
| `supabaseConfigured` | **UNVERIFIABLE** | Launch blocker |
| `cronSecretConfigured` | **UNVERIFIABLE** | Launch blocker |
| `siteLocked` | **UNVERIFIABLE** | Launch blocker if `true` |
| `anthropicConfigured` | **UNVERIFIABLE** | Warning |
| `upstashConfigured` | **UNVERIFIABLE** | Warning |
| `sentryConfigured` | **UNVERIFIABLE** | Warning |

These probes will be run immediately after `smoke:prod` exits 0.

---

## Last smoke run — 2026-04-25 19:05 UTC

| Command | Exit | Passed | Failed | Root cause |
|---------|------|--------|--------|------------|
| `npm run smoke:www` | **1** | 1 | 1 | `host_not_allowed` — www not bound in Vercel |
| `npm run smoke:prod` | **1** | 1 | 5 | `host_not_allowed` — apex and www not bound in Vercel |

**Failing checks — `smoke:www`:**
- ✗ `www is bound to this Vercel project` — `https://www.constructaiq.trade/dashboard` returned HTTP 403

**Failing checks — `smoke:prod`:**
- ✗ `GET / returns 200` — got 403
- ✗ `GET /dashboard returns 200` — got 403
- ✗ `/api/status returns 200` — got 403
- ✗ `/api/dashboard returns 200` — got 403
- ✗ `www is bound to this Vercel project` — HTTP 403

**Passing check (both runs):** `www DNS resolves` ✓ — DNS is correct; no DNS action needed.

**Smoke gate: NO-GO.** Next operator action: Vercel UI → Settings → Domains → Add both domains.

---

## Last domain check — 2026-04-25 19:01 UTC (manual curl)

| Command | HTTP status | `x-deny-reason` | `Location` |
|---------|------------|-----------------|------------|
| `curl -sSI https://constructaiq.trade` | **403** | **host_not_allowed** | (none) |
| `curl -sSI https://www.constructaiq.trade/dashboard` | **403** | **host_not_allowed** | (none) |

**Domain binding status: INCOMPLETE.** Both domains continue to be rejected at
the Vercel edge. `x-deny-reason: host_not_allowed` is present on both
responses — identical to every prior check. DNS resolves. No code change needed.
The next action remains: Vercel UI → Settings → Domains → Add both domains.

---

## Last verified — 2026-04-25 18:55 UTC (`npm run launch:check -- --include-smoke`)

| Gate | Command | Exit | Result |
|------|---------|------|--------|
| 5 | `npm run build` | **0** | `✓ Compiled successfully in 56 s` · 84 routes · 0 errors |
| 5 | `npm run lint` | **0** | `✔ No ESLint warnings or errors` |
| 5 | `npm test` | **0** | 23 files · 317/317 tests passed |
| 4 | `npm run smoke:prod` | **1** | 1 passed, 5 failed — `x-deny-reason: host_not_allowed` |
| 4 | `npm run smoke:www` | **1** | 1 passed, 1 failed — `x-deny-reason: host_not_allowed` |

`launch:check` summary line: `✗ Launch readiness FAILED — smoke gates: smoke:prod, smoke:www`
`launch:check` exit code: **1**

DNS resolves on both domains (`www DNS resolves` passes on both smoke runs).
The Vercel domain binding has not been completed.

Env/data verification (Supabase, CRON_SECRET, federal source, weekly-brief
source) was not attempted — all endpoints return HTTP 403 before the
application runs, so those probes carry no signal. They will be run once
smoke exits 0.

---

## Reference docs

| Doc | Read when |
|-----|-----------|
| [docs/OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md) | Full action list, env-var check, rollback SHA |
| [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) | Step-by-step Vercel domain binding walkthrough |
| [docs/RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Full sign-off, SHA glossary, rollback procedure |
| [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring checklist once traffic is live |
