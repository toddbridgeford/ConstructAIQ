# Launch Authority

**Updated: 2026-04-25 (Phase 20 smoke verification — smoke:prod exit 1 · 1/6 passed · smoke:www exit 1 · 1/2 passed · prerequisite domain:check exit 1 not met · Public launch NO-GO)**

---

> **STOP: code is launch-ready. DNS-only propagation confirmed (apex → `76.76.21.21`). Sole remaining blocker: Vercel domain not bound to this project — add `constructaiq.trade` and `www.constructaiq.trade` in Vercel dashboard → ConstructAIQ → Settings → Domains. Smoke cannot pass until domain is bound.**

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
| 3 | env/runtime | **BLOCKED** — `/api/status` returns 403; booleans unreadable |
| 3 | data/dashboard | **BLOCKED** — all API endpoints return 403; shapes unverifiable |
| 2 | Apex DNS target | **GO** — resolves to `76.76.21.21` (Vercel) · DNS-only confirmed · proxyWarning: false |
| — | launch:check | **FAILED** — exit 1 · failing gates: smoke:prod, smoke:www |
| — | Public launch | **NO-GO** |

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
