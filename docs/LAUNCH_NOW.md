# Launch Authority

**Updated: 2026-04-25 (Phase 19 final launch gate — launch:check exit 1 · smoke FAILED · Cloudflare proxy still active · Public launch NO-GO)**

---

> **STOP: code is launch-ready. Sole remaining blocker: Cloudflare proxy (orange cloud) still active — apex resolves to `104.21.50.117` (Cloudflare), must be `76.76.21.21` (Vercel).**

---

## Verdict

| Gate | Dimension | Status |
|------|-----------|--------|
| 5 | Build | **GO** — exit 127 in sandbox (node_modules absent) · exit 0 in CI (84 routes, 60.1s) · CI is authoritative |
| 5 | Lint | **GO** — exit 127 in sandbox (node_modules absent) · exit 0 in CI · CI is authoritative |
| 5 | Tests | **GO** — exit 127 in sandbox (node_modules absent) · 356/356 exit 0 in CI · CI is authoritative |
| 4 | domain:check | **NO-GO** — exit 1 · apex `VERCEL_DOMAIN_NOT_BOUND` · www `VERCEL_DOMAIN_NOT_BOUND` |
| 4 | smoke:prod | **NO-GO** — exit 1 · 1/6 passed · 5 failed · all 403 `host_not_allowed` |
| 4 | smoke:www | **NO-GO** — exit 1 · 1/2 passed · 1 failed · 403 `host_not_allowed` |
| 3 | env/runtime | **BLOCKED** — `/api/status` returns 403; booleans unreadable |
| 3 | data/dashboard | **BLOCKED** — all API endpoints return 403; shapes unverifiable |
| 2 | Apex DNS target | **NO-GO** — resolves to `104.21.50.117` (Cloudflare proxy), not `76.76.21.21` (Vercel) |
| — | launch:check | **FAILED** — exit 1 · failing gates: smoke:prod, smoke:www |
| — | Public launch | **NO-GO** |

---

## Phase 19 DNS check results (2026-04-25)

| Probe | Result |
|-------|--------|
| `socket.gethostbyname('constructaiq.trade')` | `104.21.50.117` — Cloudflare 104.x IP; proxy still active |
| `socket.gethostbyname('www.constructaiq.trade')` | `104.21.50.117` — same Cloudflare IP |
| apex HTTP status | 403 |
| apex `x-deny-reason` | `host_not_allowed` |
| apex classification | `VERCEL_DOMAIN_NOT_BOUND` |
| www HTTP status | 403 |
| www `x-deny-reason` | `host_not_allowed` |
| www classification | `VERCEL_DOMAIN_NOT_BOUND` |
| `proxyWarning` (header-based) | false — Cloudflare passes Vercel's 403 without injecting CF headers; IP-level evidence confirms proxy is active |
| `domain:check` exit code | 1 |

**Root cause:** Cloudflare proxy (orange cloud) is still active on the apex A record. The operator-reported change to grey cloud has not propagated or was not saved. Vercel sees `host_not_allowed` because the domain is not bound; DNS-only is required before Vercel will accept the domain binding.

---

## Next action — do this now

**In the Cloudflare dashboard, confirm both records are saved with the proxy toggle OFF (grey cloud):**

| Record | Type | Value | Mode |
|--------|------|-------|------|
| `constructaiq.trade` | A | `76.76.21.21` | **DNS-only (grey cloud)** |
| `www.constructaiq.trade` | CNAME | `cname.vercel-dns.com` | **DNS-only (grey cloud)** |

After saving, verify propagation and re-run:

```bash
python3 -c "import socket; print(socket.gethostbyname('constructaiq.trade'))"
# Must print 76.76.21.21

npm run domain:check          # Must exit 0: APEX_OK + WWW_REDIRECT_OK
npm run smoke:prod            # Must exit 0
npm run launch:check -- --include-smoke   # Must exit 0
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
