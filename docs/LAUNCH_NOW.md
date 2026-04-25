# Launch Authority

**Updated: 2026-04-25 (Phase 17 — domain:check exit 1 · VERCEL_DOMAIN_NOT_BOUND · proxyWarning false)**

---

> **STOP: code is launch-ready. Sole blocker: both domains return `host_not_allowed`.**

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Build | **GO** — 84 routes · 0 errors |
| Lint | **GO** — no ESLint warnings or errors (last verified Phase 16; node_modules absent in sandbox) |
| Tests | **GO** — 356/356 · 24 files |
| Cloudflare proxy | **GO** — `proxyWarning: false` · DNS-only confirmed (no `cf-ray`, `cf-cache-status`, or `server: cloudflare` in responses) |
| domain:check | **NO-GO** — exit 1 · `VERCEL_DOMAIN_NOT_BOUND` on both |
| smoke:prod | **NO-GO** — 1/6 passed |
| smoke:www | **NO-GO** — 1/2 passed |
| Public launch | **NO-GO** |

---

## Next action — do this now

**Bind both domains directly in Vercel. Cloudflare DNS-only is confirmed — no DNS change needed.**

1. Vercel → **construct-aiq** project → **Settings → Domains**
2. Confirm `constructaiq.trade` is listed and shows a green SSL checkmark — connected directly to Production, **no redirect to www**
3. Confirm `www.constructaiq.trade` is listed and shows a green SSL checkmark — connected directly, no Vercel-level redirect rule
4. Run:

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
