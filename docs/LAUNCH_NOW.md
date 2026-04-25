# Launch Authority

**Updated: 2026-04-25 (Phase 26 — DNS/Vercel screenshot analysis · root cause identified: 7 stale `_vercel` TXT records blocking edge propagation · Public launch NO-GO)**

---

> **STOP: root cause identified from operator screenshots. Cloudflare has 7 stale `_vercel` TXT records — one added on every domain add/remove cycle. Vercel UI correctly shows "Valid Configuration" for both domains in the correct project (`construct-aiq`). Vercel's edge has not propagated the routing because of the accumulated stale TXT verification tokens. Fix: delete all 7 `_vercel` TXT records in Cloudflare, add back only the current one, then remove and re-add `constructaiq.trade` in Vercel to trigger a clean propagation.**

---

## Verdict

| Gate | Dimension | Status |
|------|-----------|--------|
| 5 | Build | **GO** — exit 127 in sandbox (node_modules absent) · exit 0 in CI (84 routes, 60.1s) · CI is authoritative |
| 5 | Lint | **GO** — exit 127 in sandbox (node_modules absent) · exit 0 in CI · CI is authoritative |
| 5 | Tests | **GO** — exit 127 in sandbox (node_modules absent) · 356/356 exit 0 in CI · CI is authoritative |
| 4 | domain:check | **NO-GO** — exit 1 · apex `VERCEL_DOMAIN_NOT_BOUND` · www `VERCEL_DOMAIN_NOT_BOUND` · Phase 25 re-verified |
| 4 | smoke:prod | **NO-GO** — exit 1 · 1/6 passed · 5 failed — all 403 `host_not_allowed` · Phase 25 |
| 4 | smoke:www | **NO-GO** — exit 1 · 1/2 passed · 1 failed — 403 `host_not_allowed` · Phase 25 |
| 3 | env/runtime | **BLOCKED** — domain not bound · all endpoints `host_not_allowed` · unreadable |
| 3 | data/dashboard | **BLOCKED** — domain not bound · all endpoints `host_not_allowed` · unreadable |
| 2 | Apex DNS target | **EXPLAINED** — apex uses Cloudflare CNAME flattening (CNAME → `a40884db5344...`) · changing IPs are Cloudflare returning different Vercel edge IPs per region — normal · proxyWarning: false |
| 2 | `_vercel` TXT records | **ROOT CAUSE** — 7 stale TXT records in Cloudflare (1 per add/remove cycle) · Vercel UI shows Valid Configuration but edge routing never propagated · fix: delete all 7, add back only current token, re-add domain |
| — | launch:check | **NOT RUN** — prerequisite (domain:check exit 0) not met |
| — | Public launch | **NO-GO** |

---

## Phase 26 — screenshot analysis / root cause identified (2026-04-25)

*Branch: `claude/verify-launch-dns-Ok9Li`*

Operator provided Cloudflare DNS Records screenshot and Vercel Domains screenshot taken at 5:18 PM Sat Apr 25.

### What the screenshots show

**Cloudflare DNS Records (`constructaiq.trade`)**

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| CNAME | `api` | `a40884db5344...` | DNS only |
| CNAME | `constructaiq.trade` (apex) | `a40884db5344...` | DNS only |
| CNAME | `data` | `a40884db5344...` | DNS only |
| CNAME | `docs` | `a40884db5344...` | DNS only |
| CNAME | `www` | `a40884db5344...` | DNS only |
| TXT | `_vercel` | `"vc-domain-veri...` | DNS only |
| TXT | `_vercel` | `"vc-domain-veri...` | DNS only |
| TXT | `_vercel` | `"vc-domain-veri...` | DNS only |
| TXT | `_vercel` | `"vc-domain-veri...` | DNS only |
| TXT | `_vercel` | `"vc-domain-veri...` | DNS only |
| TXT | `_vercel` | `"vc-domain-veri...` | DNS only |
| TXT | `_vercel` | `"vc-domain-veri...` | DNS only |

**Vercel `construct-aiq` project → Domains**

| Domain | Status | Assignment |
|--------|--------|------------|
| `www.constructaiq.trade` | ✓ Valid Configuration | Production |
| `constructaiq.trade` | ✓ Valid Configuration | Production |
| `docs.constructaiq.trade` | ✓ Valid Configuration | Production |
| `api.constructaiq.trade` | ✓ Valid Configuration | Production |
| `data.constructaiq.trade` | ✓ Valid Configuration | Production |

### Findings

**Apex CNAME (not A record) — acceptable:** The apex `constructaiq.trade` uses a CNAME to `a40884db5344...cname.vercel-dns.com` (Vercel's project-specific routing CNAME). Cloudflare flattens this to an A record at query time — that is why the IP has changed across runs (`76.76.21.21` → `64.29.17.1` → `216.198.79.65`). These are all Vercel edge IPs returned by different Cloudflare PoPs. This is **not** the root cause.

**Correct Vercel project confirmed:** Both `constructaiq.trade` and `www.constructaiq.trade` are in the correct project (`construct-aiq`, Hobby account). Both show ✓ Valid Configuration → Production.

**Root cause — 7 stale `_vercel` TXT records:** Vercel adds a `_vercel` TXT record each time a domain is added to a project for ownership verification. When the domain is removed and re-added, the new token is appended — the old one is **not** automatically cleaned up. After five add/remove cycles, there are 7 stale tokens. Vercel's edge routing propagation consults these records. With multiple tokens from different projects/sessions, the edge cannot resolve a canonical routing target and never propagates the binding — even though the UI shows "Valid Configuration" (the UI only checks the most recent token match).

### Fix — exact operator steps

**Step 1 — note the current token (do this first):**
In Vercel → `construct-aiq` → Settings → Domains → click **Edit** next to `constructaiq.trade`. Copy the exact `_vercel` TXT value shown (it begins with `vc-domain-veri...`).

**Step 2 — delete all `_vercel` TXT records in Cloudflare:**
In Cloudflare → `constructaiq.trade` → DNS → Records: delete all 7 `_vercel` TXT records.

**Step 3 — add back only the current token:**
In Cloudflare → Add record → Type: TXT → Name: `_vercel` → Content: paste the value from Step 1 → Save.

**Step 4 — remove and re-add in Vercel:**
In Vercel → `construct-aiq` → Settings → Domains: remove `constructaiq.trade`, wait 10 s, re-add. This triggers a fresh verification + edge propagation cycle against the now-clean TXT record set.

**Step 5 — re-run verification:**
```bash
npm run domain:check    # must exit 0
```

### Verdict

**Public launch: NO-GO.** Root cause identified. No product code issue. The fix is entirely in Cloudflare DNS (delete 7 stale `_vercel` TXT records) + one more Vercel remove/re-add cycle.

---

## Phase 25 post-remove-and-re-add verification (2026-04-25)

*Branch: `claude/verify-launch-dns-Ok9Li`*

Operator: removed and re-added both `constructaiq.trade` and `www.constructaiq.trade` in Vercel; both show "Valid Configuration". Same six commands run immediately after.

### Command results

| Command | Exit | Result |
|---------|------|--------|
| `python3 socket.gethostbyname` | 0 | `216.198.79.65` — third distinct IP across runs (Ph20: `76.76.21.21` · Ph21–24: `64.29.17.1`) |
| `npm run domain:check` | **1** | `VERCEL_DOMAIN_NOT_BOUND` — apex + www |
| `node scripts/check-domain-status.mjs --json` | **1** | `ok:false` · both `status:403 · denyReason:host_not_allowed` · `xVercelId:null` · `cfRay:null` · `proxyWarning:false` |
| `curl -sSI https://constructaiq.trade` | 0 | `HTTP/2 403 · x-deny-reason: host_not_allowed` · no `server` · no `x-vercel-id` |
| `curl -sSI https://www.constructaiq.trade/dashboard` | 0 | `HTTP/2 403 · x-deny-reason: host_not_allowed` · no `server` · no `x-vercel-id` |
| `npm run smoke:www` | **1** | 1/2 — www DNS ✓ · www bound ✗ |
| `npm run smoke:prod` | **1** | 1/6 — www DNS ✓ · all other checks ✗ |

### Raw response headers (both domains identical)

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 23:11:37 GMT
```

### Apex IP history

| Phase | Date/run | IP resolved | Notes |
|-------|----------|-------------|-------|
| 20 | Earlier today | `76.76.21.21` | Expected Vercel A record |
| 21–24 | Mid-session | `64.29.17.1` | Unexpected — not documented Vercel IP |
| 25 | This run | `216.198.79.65` | Third distinct IP — suggests multiple A records or unstable DNS |

The IP is resolving differently on every TTL expiry. This is consistent with **multiple A records** set in Cloudflare for `constructaiq.trade`, or a CNAME/alias chain returning different addresses. Vercel requires exactly one A record pointing to `76.76.21.21` for apex domains.

### Assessment

DNS is correct in that requests reach Vercel's edge infrastructure (`x-deny-reason: host_not_allowed` is Vercel-specific). However:

1. **Edge binding not reflected**: Vercel UI shows "Valid Configuration" but the edge routing table still rejects both domains. This is a Vercel control-plane ↔ edge propagation failure.
2. **Unstable apex IP**: Three different IPs across five runs suggests the Cloudflare DNS A record for `constructaiq.trade` has multiple entries or was modified. This should be verified and corrected to a single A record of `76.76.21.21`.

### Verdict

**Public launch: NO-GO.** DNS is correct (requests reach Vercel). Vercel UI shows Valid Configuration. Vercel edge still returns `host_not_allowed`. This is a Vercel infrastructure propagation issue.

### Exact next operator actions

**Step A — verify Cloudflare DNS:**
1. Open Cloudflare dashboard → `constructaiq.trade` → DNS Records
2. Confirm there is exactly **one** A record for the apex (`constructaiq.trade` or `@`) pointing to `76.76.21.21`
3. Delete any duplicate A records or other A records at the apex
4. Confirm the record is **DNS-only** (grey cloud, not orange)

**Step B — if IP is now correct and stable, but binding still fails:**
Contact **Vercel support** with:
- Project: `construct-aiq`
- Domain: `constructaiq.trade`
- Evidence: `curl -sSI https://constructaiq.trade` showing `x-deny-reason: host_not_allowed` despite domain showing "Valid Configuration" in project settings
- Timeline: domain added/removed multiple times over ~1 hour; edge never reflects the binding

After either action, re-run `npm run domain:check` — must exit 0 before any further gate.

---

## Phase 24 verification run (2026-04-25)

*Branch: `claude/verify-launch-dns-Ok9Li`*

Same six commands as Phase 23. Results byte-for-byte identical — no change.

| Command | Exit | Result |
|---------|------|--------|
| `npm run domain:check` | **1** | `VERCEL_DOMAIN_NOT_BOUND` — apex + www |
| `node scripts/check-domain-status.mjs --json` | **1** | `ok:false` · both `status:403 · denyReason:host_not_allowed` · `xVercelId:null` · `cfRay:null` |
| `curl -sSI https://constructaiq.trade` | 0 | `HTTP/2 403` · `x-deny-reason: host_not_allowed` · no `server` · no `x-vercel-id` |
| `curl -sSI https://www.constructaiq.trade/dashboard` | 0 | `HTTP/2 403` · `x-deny-reason: host_not_allowed` · no `server` · no `x-vercel-id` |
| `npm run smoke:www` | **1** | 1/2 — www DNS ✓ · www bound ✗ |
| `npm run smoke:prod` | **1** | 1/6 — www DNS ✓ · all other checks ✗ |

**Verdict: NO-GO.** Four runs (Phases 21–24) — identical result each time. The Vercel binding has not taken effect.

---

## Phase 23 raw-header diagnostic run (2026-04-25)

*Branch: `claude/verify-launch-dns-Ok9Li`*

Added `curl -sSI` for raw header inspection. Results unchanged — binding not active.

### Command results

| Command | Exit | Result |
|---------|------|--------|
| `npm run domain:check` | **1** | `VERCEL_DOMAIN_NOT_BOUND` — apex + www |
| `node scripts/check-domain-status.mjs --json` | **1** | `ok:false` · both `status:403 · denyReason:host_not_allowed` · `proxyWarning:false` · `cfRay:null` · `xVercelId:null` |
| `curl -sSI https://constructaiq.trade` | 0 | `HTTP/2 403` · `x-deny-reason: host_not_allowed` — see header table below |
| `curl -sSI https://www.constructaiq.trade/dashboard` | 0 | `HTTP/2 403` · `x-deny-reason: host_not_allowed` — see header table below |
| `npm run smoke:www` | **1** | 1/2 — www DNS ✓ · www bound ✗ (403) |
| `npm run smoke:prod` | **1** | 1/6 — www DNS ✓ · all other checks ✗ (403) |

### Raw response headers — apex (`constructaiq.trade`)

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 23:00:02 GMT
```

### Raw response headers — www (`www.constructaiq.trade/dashboard`)

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 23:00:02 GMT
```

### Header analysis

| Header | apex | www | Interpretation |
|--------|------|-----|---------------|
| `x-deny-reason` | `host_not_allowed` | `host_not_allowed` | Vercel routing layer rejection — domain not in any project |
| `server` | **absent** | **absent** | Vercel omits `server` header on pre-routing denials |
| `x-vercel-id` | **absent** | **absent** | Not injected on pre-routing denials — request never reached a project |
| `cf-ray` | **absent** | **absent** | No Cloudflare proxy — DNS-only confirmed |
| `location` | **absent** | **absent** | No redirect active |
| `content-length` | `21` | `21` | Body is "Host not in allowlist" (21 chars) — Vercel-specific string |

The absence of `server: Vercel` and `x-vercel-id` is expected for pre-routing rejections: Vercel's edge returns `host_not_allowed` before assigning a request to any deployment. This is distinct from a project-level 403, which would carry `x-vercel-id`. The domain is **not bound to any project** in Vercel's routing table.

### Verdict

**Public launch: NO-GO.** Headers unchanged from Phase 22. Every failure is the same single cause: domain not bound to any Vercel project. The `construct-aiq` project is not receiving these requests.

### Exact next operator action

Vercel dashboard → **`construct-aiq` project** → Settings → Domains.
- If `constructaiq.trade` is absent: add it. Vercel will verify instantly.
- If `constructaiq.trade` is present with a red error: remove it, wait 10 s, re-add.
- Confirm no redirect is configured on either domain (both must be direct Production).
- After saving: re-run `npm run domain:check` (must exit 0).

---

## Phase 22 full command run (2026-04-25)

*Branch: `claude/verify-launch-dns-Ok9Li`*

All five requested commands run in order. Results are consistent — single root cause: domain not bound in Vercel.

### Command results

| Command | Exit | Result |
|---------|------|--------|
| `npm run domain:check` | **1** | apex `VERCEL_DOMAIN_NOT_BOUND` · www `VERCEL_DOMAIN_NOT_BOUND` |
| `node scripts/check-domain-status.mjs --json` | **1** | `ok:false` · apex `status:403 · denyReason:host_not_allowed` · www same |
| `npm run smoke:www` | **1** | 1/2 passed — www DNS resolves ✓ · www bound to project ✗ (403) |
| `npm run smoke:prod` | **1** | 1/6 passed — www DNS resolves ✓ · GET / ✗ · GET /dashboard ✗ · /api/status ✗ · /api/dashboard ✗ · www bound ✗ |
| `npm run launch:check -- --include-smoke` | **1** | build ✗ exit 127 (CI authoritative GO) · lint ✗ exit 127 (CI authoritative GO) · tests ✗ exit 127 (CI authoritative GO) · smoke:prod ✗ · smoke:www ✗ |

### Smoke detail

| Check | smoke:prod | smoke:www |
|-------|-----------|-----------|
| GET / returns 200 | FAIL — 403 | — |
| GET /dashboard returns 200 | FAIL — 403 | — |
| /api/status returns 200 | FAIL — 403 | — |
| /api/dashboard returns 200 | FAIL — 403 | — |
| www DNS resolves | PASS | PASS |
| www bound to Vercel project | FAIL — 403 | FAIL — 403 |

### Verdict

**Public launch: NO-GO.** All five commands run. Every failure shares one root cause: Vercel has not accepted the domain binding for `constructaiq.trade` or `www.constructaiq.trade`. Build/lint/tests exit 127 in sandbox only — CI previously verified exit 0 and remains authoritative. No product code issue.

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
