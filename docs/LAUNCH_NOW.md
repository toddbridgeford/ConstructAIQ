# Launch Authority

**Updated: 2026-04-25 (Phase 16 — domain:check exit 1 · host_not_allowed on both domains)**

---

> **STOP: code is launch-ready. The only active blocker is Vercel domain binding.**

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Build | **GO** — 84 routes · 0 errors |
| Lint | **GO** — no ESLint warnings or errors |
| Tests | **GO** — 356/356 · 24 files |
| domain:check | **NO-GO** — exit 1 · both domains `VERCEL_DOMAIN_NOT_BOUND` (`host_not_allowed`) |
| smoke:prod | **NO-GO** — 1/6 passed · 5 fail on `host_not_allowed` |
| smoke:www | **NO-GO** — 1/2 passed · 1 fail on `host_not_allowed` |
| Public launch | **NO-GO** |

---

## P0 blocker

**Both `constructaiq.trade` and `www.constructaiq.trade` return HTTP 403 `x-deny-reason: host_not_allowed`.**

`npm run domain:check` (2026-04-25):

```
apex  → status 403 · x-deny-reason: host_not_allowed · VERCEL_DOMAIN_NOT_BOUND
www   → status 403 · x-deny-reason: host_not_allowed · VERCEL_DOMAIN_NOT_BOUND
proxyWarning: false
exit 1
```

The Vercel UI screenshot (Phase 16) showed both domains appearing connected with a 308 apex→www
redirect and "Proxy Detected" warnings — but live network probes still return `host_not_allowed`.
This means the UI configuration has not fully taken effect, or the domains are bound to a
different Vercel project.

**No code change needed.** Fix is Vercel UI only.

---

## Next action — do this now

**Vercel UI → ConstructAIQ project → Settings → Domains**

1. Confirm **both** `constructaiq.trade` and `www.constructaiq.trade` are listed under the
   **correct project** (construct-aiq / ConstructAIQ) with green SSL checkmarks — not just appearing in the UI.
2. If `constructaiq.trade` has a "Redirect to www" rule: **remove it.** Connect it directly to Production.
3. `www.constructaiq.trade` must also be connected directly — `next.config.ts` handles `www → apex` at the application layer.
4. If the DNS provider is Cloudflare or similar: **set both records to DNS-only** (disable proxy / grey cloud).
   Proxied records can cause `host_not_allowed` even when the domain appears bound in the UI.
5. Wait for green checkmarks, then run:

```bash
npm run domain:check
# Must exit 0: APEX_OK + WWW_REDIRECT_OK
```

Full walkthrough: [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md)

---

## After domain:check exits 0 — verify in order

```bash
npm run smoke:www
npm run smoke:prod
npm run launch:check -- --include-smoke
# All must exit 0 before flipping verdict to GO.
```

When all pass: paste [docs/CLAUDE_POST_BINDING_PROMPT.md](./CLAUDE_POST_BINDING_PROMPT.md)
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
