# Launch Authority

**Updated: 2026-04-25 (Phase 16 final — domain:check exit 1 · VERCEL_DOMAIN_NOT_BOUND)**

---

> **STOP: code is launch-ready. Sole blocker: both domains return `host_not_allowed`.**

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Build | **GO** — 84 routes · 0 errors |
| Lint | **GO** — no ESLint warnings or errors |
| Tests | **GO** — 356/356 · 24 files |
| domain:check | **NO-GO** — exit 1 · `VERCEL_DOMAIN_NOT_BOUND` on both |
| smoke:prod | **NO-GO** — 1/6 passed |
| smoke:www | **NO-GO** — 1/2 passed |
| Public launch | **NO-GO** |

---

## Next action — do this now

**Bind both domains directly in Vercel. No code changes needed.**

1. Vercel → **construct-aiq** project → **Settings → Domains**
2. Confirm `constructaiq.trade` is listed and shows a green SSL checkmark — connected directly to Production, **no redirect to www**
3. Confirm `www.constructaiq.trade` is listed and shows a green SSL checkmark — connected directly, no Vercel-level redirect rule
4. If the DNS provider is Cloudflare: set both records to **DNS-only** (grey cloud) — proxied records cause `host_not_allowed` even when the domain appears bound
5. Run:

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
