# Launch Authority

**Updated: 2026-04-25 (Phase 20 final launch gate — launch:check exit 1 · smoke:prod exit 1 · smoke:www exit 1 · domain not bound · Public launch NO-GO)**

---

> **STOP: code is launch-ready. DNS-only propagation confirmed (apex → `76.76.21.21`). Sole remaining blocker: Vercel domain not bound to this project — add `constructaiq.trade` and `www.constructaiq.trade` in Vercel dashboard → ConstructAIQ → Settings → Domains.**

---

## Verdict

| Gate | Dimension | Status |
|------|-----------|--------|
| 5 | Build | **GO** — exit 127 in sandbox (node_modules absent) · exit 0 in CI (84 routes, 60.1s) · CI is authoritative |
| 5 | Lint | **GO** — exit 127 in sandbox (node_modules absent) · exit 0 in CI · CI is authoritative |
| 5 | Tests | **GO** — exit 127 in sandbox (node_modules absent) · 356/356 exit 0 in CI · CI is authoritative |
| 4 | domain:check | **NO-GO** — exit 1 · apex `VERCEL_DOMAIN_NOT_BOUND` · www `VERCEL_DOMAIN_NOT_BOUND` |
| 4 | smoke:prod | **NO-GO** — exit 1 · 1/6 passed · 5 failed · root cause: domain not bound |
| 4 | smoke:www | **NO-GO** — exit 1 · 1/2 passed · 1 failed · root cause: domain not bound |
| 3 | env/runtime | **BLOCKED** — domain not bound · `/api/status` returns `Host not in allowlist` · all booleans unreadable |
| 3 | data/dashboard | **BLOCKED** — domain not bound · all 5 endpoints return `Host not in allowlist` · shapes unverifiable |
| 2 | Apex DNS target | **GO** — resolves to `76.76.21.21` (Vercel) · DNS-only confirmed · proxyWarning: false |
| — | launch:check | **FAILED** — exit 1 · smoke:prod ✗ · smoke:www ✗ · build/lint/tests ✗ in sandbox (CI authoritative GO) |
| — | Public launch | **NO-GO** |

---

## Phase 20 final launch gate (2026-04-25)

### Command results

| Command | Sandbox exit | Notes |
|---------|-------------|-------|
| `npm run launch:check -- --include-smoke` | **1** | Failing gates: build, lint, tests (sandbox), smoke:prod, smoke:www |
| `npm run build` | 127 | `next` not found — node_modules absent in sandbox; CI authoritative (exit 0) |
| `npm run lint` | 127 | `next` not found — node_modules absent in sandbox; CI authoritative (exit 0) |
| `npm test` | 127 | `vitest` not found — node_modules absent in sandbox; CI authoritative (exit 0) |
| `npm run smoke:prod` | **1** | 1/6 passed · 5 failed — `host_not_allowed` 403 · domain not bound |
| `npm run smoke:www` | **1** | 1/2 passed · 1 failed — `host_not_allowed` 403 · domain not bound |

### Smoke detail

| Check | smoke:prod | smoke:www |
|-------|-----------|-----------|
| GET / returns 200 | FAIL — 403 | — |
| GET /dashboard returns 200 | FAIL — 403 | — |
| /api/status returns 200 | FAIL — 403 | — |
| /api/dashboard returns 200 | FAIL — 403 | — |
| www DNS resolves | PASS | PASS |
| www is bound to this Vercel project | FAIL — 403 | FAIL — 403 |

### Verdict

**Public launch: NO-GO.**

`launch:check --include-smoke` exits 1. Smoke gates are the live blockers — all 403 `host_not_allowed` failures share one root cause: domain not bound in Vercel. Gate 5 (build/lint/tests) exits 127 in sandbox only — CI is authoritative (previously verified exit 0). No product code issue exists.

**Exact failing gate:** Gate 4 — `smoke:prod` and `smoke:www` both exit 1.
**Exact next action:** Add `constructaiq.trade` and `www.constructaiq.trade` in Vercel dashboard → ConstructAIQ → Settings → Domains, then re-run the full verification sequence.

---

## Phase 20 data/dashboard verification (2026-04-25)

**Prerequisite:** `smoke:prod` exits 0 — NOT MET (exits 1). All data commands attempted regardless to document state.

| Endpoint | curl response | jq exit |
|----------|--------------|---------|
| `/api/status` (`.data`) | `Host not in allowlist` — 403, not JSON | 5 |
| `/api/status?deep=1` (`.data`) | `Host not in allowlist` — 403, not JSON | 5 |
| `/api/federal` | `Host not in allowlist` — 403, not JSON | 5 |
| `/api/weekly-brief` | `Host not in allowlist` — 403, not JSON | 5 |
| `/api/dashboard` | `Host not in allowlist` — 403, not JSON | 5 |

| Field | Value | Classification |
|-------|-------|----------------|
| `data.dashboardShapeOk` | UNREADABLE | Cannot classify |
| `data.dataSource` (federal) | UNREADABLE | Cannot classify |
| `data.source` (weekly-brief) | UNREADABLE | Cannot classify |
| `dashboard.cshi` type | UNREADABLE | Cannot classify |
| `dashboard.signals` length | UNREADABLE | Cannot classify |
| `dashboard.commodities` length | UNREADABLE | Cannot classify |
| `dashboard.forecast` type | UNREADABLE | Cannot classify |

**Verdict:** All data shapes unverifiable. Every endpoint returns a plain-text 403 (`Host not in allowlist`) — Vercel rejects at the routing layer before the application handles the request. No classification (blocker or warning) is possible. Single root cause: domain not bound in Vercel project.

---

## Phase 20 env/runtime verification (2026-04-25)

**Prerequisite:** `smoke:prod` exits 0 — NOT MET (exits 1). Verification attempted regardless to document state.

| Command | Result |
|---------|--------|
| `curl -s https://constructaiq.trade/api/status` | `Host not in allowlist` — not JSON |
| `jq .env` | parse error — exit 5 |
| `jq .runtime` | parse error — exit 5 |

| Boolean | Value | Classification |
|---------|-------|----------------|
| `supabaseConfigured` | UNREADABLE — endpoint 403 | Cannot classify |
| `cronSecretConfigured` | UNREADABLE — endpoint 403 | Cannot classify |
| `anthropicConfigured` | UNREADABLE — endpoint 403 | Cannot classify |
| `upstashConfigured` | UNREADABLE — endpoint 403 | Cannot classify |
| `sentryConfigured` | UNREADABLE — endpoint 403 | Cannot classify |
| `runtime.siteLocked` | UNREADABLE — endpoint 403 | Cannot classify |
| `runtime.nodeEnv` | UNREADABLE — endpoint 403 | Cannot classify |
| `runtime.appUrl` | UNREADABLE — endpoint 403 | Cannot classify |

**Verdict:** All env/runtime booleans are unreadable. `/api/status` returns a plain-text 403 (`Host not in allowlist`) because the domain is not bound in Vercel. No launch-blocker or warning classification is possible until the domain is bound and smoke passes.

**Next action:** Bind domain in Vercel → re-run `smoke:prod` (must exit 0) → then re-run env/runtime verification.

---

## Phase 20 smoke verification (2026-04-25)

| Check | smoke:prod | smoke:www |
|-------|-----------|-----------|
| Prerequisite: domain:check exits 0 | **NOT MET** — exits 1 | **NOT MET** — exits 1 |
| `GET /` returns 200 | **FAIL** — 403 | — |
| `GET /dashboard` returns 200 | **FAIL** — 403 | — |
| `/api/status` returns 200 | **FAIL** — 403 | — |
| `/api/dashboard` returns 200 | **FAIL** — 403 | — |
| www DNS resolves | **PASS** | **PASS** |
| www is bound to this Vercel project | **FAIL** — 403 | **FAIL** — 403 |
| **Exit code** | **1** | **1** |
| **Summary** | 1 passed, 5 failed | 1 passed, 1 failed |

**Root cause (all failures):** Domain not bound in Vercel project. Every 403 `host_not_allowed` response is the same single failure — Vercel rejects requests for `constructaiq.trade` and `www.constructaiq.trade` because neither is added to the project. Smoke cannot pass until the domain binding is complete.

---

## Phase 20 DNS-only propagation verification (2026-04-25)

| Probe | Result |
|-------|--------|
| `socket.gethostbyname('constructaiq.trade')` | `76.76.21.21` — Vercel IP · DNS-only propagation confirmed |
| `dig +short constructaiq.trade` | not available in sandbox — socket result is authoritative |
| `dig +short www.constructaiq.trade` | not available in sandbox |
| apex HTTP status | 403 |
| apex `x-deny-reason` | `host_not_allowed` |
| apex classification | `VERCEL_DOMAIN_NOT_BOUND` |
| www HTTP status | 403 |
| www `x-deny-reason` | `host_not_allowed` |
| www classification | `VERCEL_DOMAIN_NOT_BOUND` |
| `proxyWarning` (header-based) | `false` — no Cloudflare proxy headers; DNS-only confirmed |
| `cf-ray` | null — no Cloudflare proxy active |
| Location headers | null — no redirect |
| `domain:check` exit code | 1 |

**Assessment:** DNS-only propagation succeeded — apex now resolves directly to `76.76.21.21` (Vercel), not a Cloudflare 104.x/172.x proxy IP. Cloudflare proxy is inactive (`proxyWarning: false`, no `cf-ray`). The remaining blocker is that the domain is not yet bound to this Vercel project (`VERCEL_DOMAIN_NOT_BOUND`). This is a Vercel dashboard action, not a DNS change.

---

## Phase 19 DNS check results (2026-04-25) — superseded by Phase 20

| Probe | Result |
|-------|--------|
| `socket.gethostbyname('constructaiq.trade')` | `104.21.50.117` — Cloudflare 104.x IP; proxy was active |
| apex classification | `VERCEL_DOMAIN_NOT_BOUND` |
| `proxyWarning` (header-based) | false — Cloudflare passed Vercel's 403 without injecting CF headers |
| `domain:check` exit code | 1 |

---

## Next action — do this now

**DNS is correct and propagated. The only remaining action is adding the domain in Vercel:**

1. Go to Vercel dashboard → ConstructAIQ project → Settings → Domains
2. Add `constructaiq.trade` (apex) — Vercel should verify instantly (`76.76.21.21` already points to Vercel)
3. Add `www.constructaiq.trade` — Vercel should verify instantly (`cname.vercel-dns.com` already in place)

After binding, re-run **in order**:

```bash
npm run domain:check          # Must exit 0: APEX_OK + WWW_REDIRECT_OK (prerequisite for smoke)
npm run smoke:www             # Must exit 0: 2/2 passed
npm run smoke:prod            # Must exit 0: 6/6 passed
npm run launch:check -- --include-smoke   # Must exit 0 for GO
```

Full walkthrough: [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) · Remediation detail: [docs/VERCEL_CANONICAL_REMEDIATION.md](./VERCEL_CANONICAL_REMEDIATION.md)

After `launch:check` exits 0: proceed to [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md).

---

## Reference

| Doc | Purpose |
|-----|---------|
| [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) | Full binding walkthrough + troubleshooting |
| [docs/VERCEL_CANONICAL_REMEDIATION.md](./VERCEL_CANONICAL_REMEDIATION.md) | Fix apex→www redirect + proxy |
| [docs/CANONICAL_DOMAIN_DECISION.md](./CANONICAL_DOMAIN_DECISION.md) | Why apex canonical |
| [docs/RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Full sign-off history |
| [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring |
