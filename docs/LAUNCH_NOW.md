# Launch Authority

**Updated: 2026-04-25 (Phase 23 — domain CONFIRMED LIVE from Codespace · apex HTTP/2 200 · www HTTP/2 308 → apex · server: Vercel · remaining gates: smoke + env/data pending operator paste)**

---

> **DOMAIN IS LIVE. `constructaiq.trade` returns `HTTP/2 200 · server: Vercel` from a direct internet connection (GitHub Codespace). `www.constructaiq.trade` returns `HTTP/2 308 → constructaiq.trade` (correct canonical redirect). APEX_OK · WWW_REDIRECT_OK. Smoke tests and env/data verification in progress.**

---

## Verdict

| Gate | Dimension | Status |
|------|-----------|--------|
| 5 | Build | **GO** — exit 0 in CI (84 routes, 60.1s) |
| 5 | Lint | **GO** — exit 0 in CI |
| 5 | Tests | **GO** — 356/356 exit 0 in CI |
| 4 | domain:check | **GO** — apex `HTTP/2 200 · server: Vercel` · www `HTTP/2 308 → constructaiq.trade` · APEX_OK · WWW_REDIRECT_OK · Phase 23 Codespace curl |
| 4 | smoke:prod | **PENDING** — domain confirmed live; running from Codespace |
| 4 | smoke:www | **PENDING** — domain confirmed live; running from Codespace |
| 3 | env/runtime | **PENDING** — `/api/status` check queued |
| 3 | data/dashboard | **PENDING** — `/api/dashboard` check queued |
| — | launch:check | **PENDING** |
| — | Public launch | **PENDING** — smoke + env/data results outstanding |

---

## Phase 23 — Domain confirmed live from Codespace (2026-04-25)

*Branch: `claude/final-domain-verification-U2rWX`*

Operator ran `curl -sSI` from a GitHub Codespace (direct internet, no TLS proxy). Results are authoritative.

### curl results

**`curl -sSI https://constructaiq.trade`**
```
HTTP/2 200
server: Vercel
x-vercel-cache: HIT
x-vercel-id: sfo1::7hcrh-1777160151209-5fd85d03cc0c
content-type: text/html; charset=utf-8
strict-transport-security: max-age=63072000; includeSubDomains; preload
```

**`curl -sSI https://www.constructaiq.trade/dashboard`**
```
HTTP/2 308
server: Vercel
location: https://constructaiq.trade/dashboard
x-vercel-id: sfo1::9fvvw-1777160170962-5bc498849b82
```

### Classification

| Probe | Result | Gate |
|-------|--------|------|
| apex HTTP status | **200** | **APEX_OK** |
| apex `server` | `Vercel` | Confirmed Vercel edge |
| apex `x-vercel-cache` | `HIT` | CDN active |
| apex `x-vercel-id` | `sfo1::...` | San Francisco edge |
| www HTTP status | **308** | **WWW_REDIRECT_OK** |
| www `location` | `https://constructaiq.trade/dashboard` | Canonical redirect to apex |
| www `server` | `Vercel` | Confirmed Vercel edge |
| `x-deny-reason` | **absent** | Domain is bound and serving |

**Domain gate: GO.**

### Remaining gates (in progress)

Smoke tests and env/data verification running from Codespace. Results to be appended below.

---

## Phase 22 — Anthropic sandbox proxy discovery (2026-04-25)

*Branch: `claude/final-domain-verification-U2rWX`*

Operator provided Vercel dashboard screenshot confirming both domains show **Valid Configuration + Production** with no apex-to-www redirect and Cloudflare in DNS-only mode. Full verification sequence run immediately after.

### Root cause: all sandbox HTTP checks are invalid

Verbose `curl` revealed:

```
* Connected to constructaiq.trade (64.29.17.1) port 443
* issuer: O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
HTTP/2 403
x-deny-reason: host_not_allowed
```

Python socket DNS resolution returns `64.29.17.65` for both domains — the sandbox DNS resolver itself redirects all external hostnames to the Anthropic egress proxy. Every domain check run from this Claude Code environment, in every prior phase, has been testing the proxy, not Vercel.

### Phase 22 command results

| Command | Exit | Observed | Classification |
|---------|------|----------|---------------|
| `npm run domain:check` | 1 | apex + www: `VERCEL_DOMAIN_NOT_BOUND` | PROXY — not Vercel |
| `node scripts/check-domain-status.mjs --json` | 1 | `status:403 · denyReason:host_not_allowed` | PROXY |
| `curl -sSI https://constructaiq.trade` | — | `HTTP/2 403 · x-deny-reason: host_not_allowed` | PROXY |
| `curl -sSI https://www.constructaiq.trade/dashboard` | — | `HTTP/2 403 · x-deny-reason: host_not_allowed` | PROXY |
| DNS: `socket.gethostbyname('constructaiq.trade')` | 0 | `64.29.17.65` | Anthropic proxy IP |
| DNS: `socket.gethostbyname('www.constructaiq.trade')` | 0 | `64.29.17.65` | Anthropic proxy IP |
| TLS cert issuer | — | `O=Anthropic; CN=sandbox-egress-production TLS Inspection CA` | MITM proxy confirmed |

### Authoritative evidence

| Domain | Vercel dashboard | Deployment |
|--------|-----------------|-----------|
| `constructaiq.trade` | **Valid Configuration** | **Production** |
| `www.constructaiq.trade` | **Valid Configuration** | **Production** |

"Valid Configuration" means Vercel's edge is actively serving the domain from this project. This is the only authoritative signal available.

### Verdict

**Public launch: PENDING OPERATOR VERIFICATION.**

Code is launch-ready. Vercel dashboard confirms domain binding is complete. All remaining gates (smoke, env, data) must be run from the operator's own terminal — not from within this Claude Code sandbox.

**Exact next action:** Follow [docs/POST_BINDING_VERIFICATION_20260425.md](./POST_BINDING_VERIFICATION_20260425.md) from your local machine.

---

## Phase 21 post-operator-binding verification (2026-04-25)

*Branch: `claude/verify-launch-dns-Ok9Li`*

Operator reported completing Vercel UI steps: both domains attached as Production, no apex-to-www redirect. Verification run immediately after.

### Command results

| Command | Exit | Observed value |
|---------|------|---------------|
| `python3 -c "import socket; print(socket.gethostbyname('constructaiq.trade'))"` | 0 | `64.29.17.1` — NOT expected `76.76.21.21` |
| `npm run domain:check` | **1** | apex `VERCEL_DOMAIN_NOT_BOUND` · www `VERCEL_DOMAIN_NOT_BOUND` |
| `node scripts/check-domain-status.mjs --json` | **1** | apex `status:403 · denyReason:host_not_allowed` · www same · `ok:false` |

### DNS/binding detail

| Probe | Result |
|-------|--------|
| apex IP (socket) | `64.29.17.1` |
| expected apex IP | `76.76.21.21` |
| apex HTTP status | 403 |
| apex `x-deny-reason` | `host_not_allowed` |
| apex classification | `VERCEL_DOMAIN_NOT_BOUND` |
| www HTTP status | 403 |
| www `x-deny-reason` | `host_not_allowed` |
| www classification | `VERCEL_DOMAIN_NOT_BOUND` |
| `proxyWarning` | false — no Cloudflare proxy headers; DNS-only confirmed |
| `cfRay` | null |
| Vercel infrastructure reached | YES — `host_not_allowed` is a Vercel-specific rejection; request is hitting Vercel |

### Assessment

DNS-only mode is active (`proxyWarning: false`, no `cfRay`). The 403 `host_not_allowed` response confirms requests are reaching Vercel infrastructure. However, the binding of `constructaiq.trade` to the `construct-aiq` project is **not yet active**: Vercel's routing layer rejects both domains. Possible causes:

1. Binding made to a different Vercel project (not `construct-aiq`)
2. Binding still propagating within Vercel's network
3. Domain added with redirect type rather than as a direct Production domain
4. Apex IP (`64.29.17.1`) differs from the canonical Vercel IP (`76.76.21.21`) — may indicate a different Vercel region or intermediate state

Smoke tests, env/runtime, and data/dashboard steps not run (prerequisite: `domain:check` exits 0 — not met).

### Verdict

**Public launch: NO-GO.**

DNS is correct (DNS-only, Cloudflare proxy inactive, requests reach Vercel). Vercel project domain binding is still not active for `constructaiq.trade` and `www.constructaiq.trade`.

### Exact next operator action

Go to **Vercel dashboard → construct-aiq project → Settings → Domains**:
1. Confirm `constructaiq.trade` is listed and shows "Valid configuration" (not an error state)
2. Confirm `www.constructaiq.trade` is listed and shows "Valid configuration"
3. Confirm neither domain has a redirect configured (both must be direct Production domains)
4. If domains are absent: add them. If they are present with errors: remove and re-add
5. After confirming, re-run: `npm run domain:check` (must exit 0 before any further step)

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
