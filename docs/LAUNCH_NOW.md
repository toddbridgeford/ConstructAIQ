# Launch Authority

**Updated: 2026-04-25 (Phase 18 data/dashboard verification — all endpoints blocked · 403 host_not_allowed · DNS blocker unchanged)**

---

> **STOP: code is launch-ready. Blocker: domain not bound to Vercel (apex still resolves to Cloudflare IPs).**

---

## Verdict

| Gate | Dimension | Status |
|------|-----------|--------|
| 5 | Build | **GO** — 84 routes · compiled in 60.1s · exit 0 |
| 5 | Lint | **GO** — no ESLint warnings or errors · exit 0 |
| 5 | Tests | **GO** — 356/356 · 24 files · exit 0 |
| 4 | smoke:prod | **NO-GO** — 1/6 passed · exit 1 · 5 failed · all 403 `host_not_allowed` |
| 4 | smoke:www | **NO-GO** — 1/2 passed · exit 1 · 1 failed · 403 `host_not_allowed` |
| 3 | env/data | **BLOCKED** — all endpoints return 403; env booleans and data shapes unreadable while domain unbound |
| 2 | Apex DNS target | **NO-GO** — resolves to `172.67.206.20` (Cloudflare), not `76.76.21.21` (Vercel) |
| — | domain:check | **FAILED** — exit 1 · both apex and www: `VERCEL_DOMAIN_NOT_BOUND` |
| — | Public launch | **NO-GO** |

---

## Failing smoke gates

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

**Root cause for all failures:** `host_not_allowed` — the domain is not bound to the Vercel project. DNS is still routing through Cloudflare proxy. Until the apex A record points to `76.76.21.21` (DNS-only), Vercel rejects all requests.

---

## Next action — do this now

**Fix Cloudflare DNS — set both records to DNS-only (grey cloud).**

| Record | Type | Value | Mode |
|--------|------|-------|------|
| `constructaiq.trade` | A | `76.76.21.21` | **DNS-only (grey cloud)** |
| `www.constructaiq.trade` | CNAME | `cname.vercel-dns.com` | **DNS-only (grey cloud)** |

After saving Cloudflare changes, verify DNS propagation and re-run:

```bash
python3 -c "import socket; print(socket.gethostbyname('constructaiq.trade'))"
# Must print 76.76.21.21

npm run domain:check
# Must exit 0: APEX_OK + WWW_REDIRECT_OK

npm run smoke:www && npm run smoke:prod
# Both must exit 0
```

Full walkthrough: [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) · Remediation detail: [docs/VERCEL_CANONICAL_REMEDIATION.md](./VERCEL_CANONICAL_REMEDIATION.md)

After `domain:check` exits 0: paste [docs/CLAUDE_POST_CANONICAL_REMEDIATION_PROMPT.md](./CLAUDE_POST_CANONICAL_REMEDIATION_PROMPT.md) into Claude Code.

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
