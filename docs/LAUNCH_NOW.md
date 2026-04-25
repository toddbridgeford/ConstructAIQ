# Launch Authority

**Updated: 2026-04-25 (Phase 18 final launch gate — launch:check exit 1 · smoke FAILED · DNS blocker unchanged)**

---

> **STOP: code is launch-ready. Sole remaining blocker: Cloudflare proxy (orange cloud) still active — apex must resolve to `76.76.21.21`.**

---

## Verdict

| Gate | Dimension | Status |
|------|-----------|--------|
| 5 | Build | **GO** — previously verified exit 0 · 84 routes · 60.1s (node_modules absent in sandbox; CI confirmed) |
| 5 | Lint | **GO** — previously verified exit 0 · no warnings (node_modules absent in sandbox; CI confirmed) |
| 5 | Tests | **GO** — previously verified 356/356 exit 0 (node_modules absent in sandbox; CI confirmed) |
| 4 | smoke:prod | **NO-GO** — exit 1 · 1/6 passed · 5 failed · all 403 `host_not_allowed` |
| 4 | smoke:www | **NO-GO** — exit 1 · 1/2 passed · 1 failed · 403 `host_not_allowed` |
| 3 | env/data | **BLOCKED** — all endpoints return 403; env booleans and data shapes unreadable |
| 2 | Apex DNS target | **NO-GO** — resolves to `172.67.206.20` (Cloudflare), not `76.76.21.21` (Vercel) |
| — | launch:check | **FAILED** — exit 1 · failing gates: smoke:prod, smoke:www |
| — | Public launch | **NO-GO** |

---

## Failing gates

### smoke:prod (exit 1 · 1 passed, 5 failed)

| Check | Result |
|-------|--------|
| GET / returns 200 | FAIL — got 403 |
| GET /dashboard returns 200 | FAIL — got 403 |
| /api/status returns 200 | FAIL — got 403 |
| /api/dashboard returns 200 | FAIL — got 403 |
| www DNS resolves | PASS |
| www is bound to this Vercel project | FAIL — got 403 |

### smoke:www (exit 1 · 1 passed, 1 failed)

| Check | Result |
|-------|--------|
| www DNS resolves | PASS |
| www is bound to this Vercel project | FAIL — got 403 |

**Single root cause:** `host_not_allowed` — apex DNS still routes through Cloudflare proxy (`172.67.206.20`). Vercel rejects all requests until the domain is bound via DNS-only records.

---

## Next action — do this now

**In the Cloudflare dashboard, confirm both records are saved with the proxy toggle OFF (grey cloud):**

| Record | Type | Value | Mode |
|--------|------|-------|------|
| `constructaiq.trade` | A | `76.76.21.21` | **DNS-only (grey cloud)** |
| `www.constructaiq.trade` | CNAME | `cname.vercel-dns.com` | **DNS-only (grey cloud)** |

After saving, verify propagation and re-run the full gate sequence:

```bash
python3 -c "import socket; print(socket.gethostbyname('constructaiq.trade'))"
# Must print 76.76.21.21

npm run domain:check          # Must exit 0: APEX_OK + WWW_REDIRECT_OK
npm run smoke:www             # Must exit 0
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
| [docs/CLAUDE_POST_CANONICAL_REMEDIATION_PROMPT.md](./CLAUDE_POST_CANONICAL_REMEDIATION_PROMPT.md) | Post-fix verification prompt |
| [docs/CANONICAL_DOMAIN_DECISION.md](./CANONICAL_DOMAIN_DECISION.md) | Why apex canonical |
| [docs/RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Full sign-off history |
| [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring |
