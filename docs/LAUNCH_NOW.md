# Launch Authority

**Updated: 2026-04-25 (Phase 18 DNS target verification — domain:check exit 1 · host_not_allowed · apex still Cloudflare)**

---

> **STOP: code is launch-ready. Sole blocker: apex A record still resolves to Cloudflare IPs, not Vercel.**

---

## Verdict

| Gate | Dimension | Status |
|------|-----------|--------|
| 5 | Build | **GO** — 84 routes · compiled in 60.1s · exit 0 |
| 5 | Lint | **GO** — no ESLint warnings or errors · exit 0 |
| 5 | Tests | **GO** — 356/356 · 24 files · exit 0 |
| 4 | smoke:prod | **NO-GO** — 1/6 passed · exit 1 · all 403 `host_not_allowed` |
| 4 | smoke:www | **NO-GO** — 1/2 passed · exit 1 · all 403 `host_not_allowed` |
| 3 | env/data | **BLOCKED** — all API endpoints return `Host not in allowlist` |
| 2 | Apex DNS target | **NO-GO** — resolves to `172.67.206.20` (Cloudflare), not `76.76.21.21` (Vercel) · Phase 18 verified |
| — | domain:check | **FAILED** — exit 1 · both apex and www: `VERCEL_DOMAIN_NOT_BOUND` · `host_not_allowed` |
| — | Public launch | **NO-GO** |

---

## Next action — do this now

**The apex A record is still routing through Cloudflare proxy.** Phase 18 DNS resolution confirms `constructaiq.trade` still resolves to `172.67.206.20` (Cloudflare range), not `76.76.21.21` (Vercel).

Despite the operator's reported update, the orange cloud is still active. The A record must be set to DNS-only (grey cloud) and must point to the Vercel IP:

| Record | Type | Value | Mode |
|--------|------|-------|------|
| `constructaiq.trade` | A | `76.76.21.21` | **DNS-only (grey cloud)** |
| `www.constructaiq.trade` | CNAME | `cname.vercel-dns.com` | **DNS-only (grey cloud)** |

Verify by re-running Phase 18 checks after saving Cloudflare changes:

```bash
# Confirm apex no longer resolves to a Cloudflare IP
python3 -c "import socket; print(socket.gethostbyname('constructaiq.trade'))"
# Must print 76.76.21.21

npm run domain:check
# Must exit 0: APEX_OK + WWW_REDIRECT_OK
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
