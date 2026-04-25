# Launch Authority

**Updated: 2026-04-25 (Phase 17 final gate — launch:check exit 1 · smoke FAILED · DNS blocker)**

---

> **STOP: code is launch-ready. Sole blocker: apex A record points to Cloudflare IPs, not Vercel.**

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
| 2 | Apex DNS target | **NO-GO** — resolves to Cloudflare IPs (`104.21.50.117`, `172.67.206.20`), not Vercel (`76.76.21.21`) |
| — | launch:check | **FAILED** — exit 1 · failing gates: smoke:prod, smoke:www |
| — | Public launch | **NO-GO** |

---

## Next action — do this now

**Fix the apex A record — it must point to Vercel's IP, not a Cloudflare IP.**

The apex resolves to `104.21.50.117` / `172.67.206.20` (Cloudflare ranges). Vercel requires:

| Record | Type | Value |
|--------|------|-------|
| `constructaiq.trade` | A | `76.76.21.21` |
| `www.constructaiq.trade` | CNAME | `cname.vercel-dns.com` |

Both records must be **DNS-only** (grey cloud) in Cloudflare.

After updating DNS:

```bash
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
