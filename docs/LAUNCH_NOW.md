# Launch Authority

**Updated: 2026-04-25 (Phase 17 env/data — BLOCKED · wrong DNS target · VERCEL_DOMAIN_NOT_BOUND)**

---

> **STOP: code is launch-ready. Sole blocker: apex A record points to Cloudflare IPs, not Vercel.**

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Build | **GO** — 84 routes · 0 errors |
| Lint | **GO** — no ESLint warnings or errors (last verified Phase 16; node_modules absent in sandbox) |
| Tests | **GO** — 356/356 · 24 files |
| Cloudflare proxy headers | `proxyWarning: false` — no CF response headers |
| Apex DNS target | **NO-GO** — resolves to Cloudflare IPs (`104.21.50.117`, `172.67.206.20`), not Vercel (`76.76.21.21`) |
| domain:check | **NO-GO** — exit 1 · `VERCEL_DOMAIN_NOT_BOUND` on both |
| smoke:prod | **NO-GO** — 1/6 passed (all 403 `host_not_allowed`) |
| smoke:www | **NO-GO** — 1/2 passed (all 403 `host_not_allowed`) |
| env/data | **BLOCKED** — all API endpoints return `Host not in allowlist`; not evaluable |
| Public launch | **NO-GO** |

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
