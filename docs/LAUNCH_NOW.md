# Launch Authority

**Updated: 2026-04-25 (Phase 16 — Vercel canonical/proxy misconfiguration)**

---

> **STOP: code is launch-ready. The only active blocker is Vercel domain misconfiguration.**

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Build | **GO** — 84 routes · 0 errors (51.5s) |
| Lint | **GO** — no ESLint warnings or errors (2.7s) |
| Tests | **GO** — 344/344 · 24 files (3.5s) |
| Smoke | **NO-GO** — domains connected but canonical direction is wrong |
| Public launch | **NO-GO** |

---

## P0 blocker

**Vercel canonical/proxy misconfiguration.**

Both domains are now connected to the Vercel project (the prior `host_not_allowed`
403 is resolved), but the Vercel UI shows:

- `www.constructaiq.trade` → connected to Production
- `constructaiq.trade` → configured as **308 redirect to `www.constructaiq.trade`**
- Vercel reports **Proxy Detected** on both domains

This is the opposite of what the repo requires. The `next.config.ts` redirect
sends `www → apex`. With Vercel also redirecting `apex → www`, the result is an
infinite redirect loop. The site is unreachable.

**No code change needed.** The fix is a Vercel UI change only.

---

## Next action — do this now

**Vercel UI → ConstructAIQ project → Settings → Domains**

1. Find `constructaiq.trade` — it currently has a "Redirect to www" rule. **Remove that redirect.**
2. `constructaiq.trade` must be connected **directly** to Production — no Vercel-level redirect on it.
3. `www.constructaiq.trade` must also be connected directly — the app-layer rule in `next.config.ts` handles `www → apex` automatically.
4. If the DNS provider is Cloudflare (or equivalent): **disable the proxy** on both records (set to DNS-only / grey cloud). Vercel's "Proxy Detected" warning indicates a proxied record is interfering.

> **Why:** Vercel `apex → www` + `next.config.ts` `www → apex` = infinite redirect loop. Apex canonical is the repo decision. See [docs/CANONICAL_DOMAIN_DECISION.md](./CANONICAL_DOMAIN_DECISION.md).

Full walkthrough: [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md)

---

## After binding — verify in order

```bash
npm run domain:check
# Must exit 0: APEX_OK + WWW_REDIRECT_OK

npm run smoke:www
npm run smoke:prod
npm run launch:check -- --include-smoke
# All must exit 0 before flipping verdict to GO.
```

When all four pass: paste [docs/CLAUDE_POST_BINDING_PROMPT.md](./CLAUDE_POST_BINDING_PROMPT.md)
into Claude Code for automated verification, then update this verdict to **GO**.

---

## Reference docs

| Doc | Read when |
|-----|-----------|
| [docs/CANONICAL_DOMAIN_DECISION.md](./CANONICAL_DOMAIN_DECISION.md) | Canonical direction rationale and required Vercel config |
| [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) | Step-by-step domain binding + troubleshooting |
| [docs/OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md) | Env-var check, rollback SHA, full action list |
| [docs/CLAUDE_POST_BINDING_PROMPT.md](./CLAUDE_POST_BINDING_PROMPT.md) | After binding — paste into Claude Code |
| [docs/RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Full sign-off history, SHA glossary, smoke run logs |
| [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring checklist |
