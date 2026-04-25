# Launch Authority

**Updated: 2026-04-25 20:30 UTC**

---

> **STOP: code is launch-ready. The only active blocker is external Vercel domain
> binding. Do not add more app changes before binding `constructaiq.trade` and
> `www.constructaiq.trade` in Vercel.**

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Build | **GO** — 84 routes · 0 errors |
| Lint | **GO** — no warnings or errors |
| Tests | **GO** — 341/341 passed |
| Smoke | **NO-GO** — gate failed: `domain:check` exit 1 · `host_not_allowed` on apex + www |
| Public launch | **NO-GO** |

---

## P0 blocker

Vercel does not recognise `constructaiq.trade` or `www.constructaiq.trade`.
Every request is rejected at the edge (`x-deny-reason: host_not_allowed`)
before the Next.js app runs. DNS is correct. No code change is needed.

---

## Next action — do this now

**Vercel UI → ConstructAIQ project → Settings → Domains**

1. **Add Domain** → `constructaiq.trade` → confirm.
2. **Add Domain** → `www.constructaiq.trade` → confirm.
3. Wait for a green checkmark on both (SSL provisions in 1–10 minutes).
4. **Remove any apex → www redirect in Vercel.** The repo expects www → apex. An apex → www Vercel redirect combined with the app-layer www → apex rule creates a redirect loop. See [docs/CANONICAL_DOMAIN_DECISION.md](./CANONICAL_DOMAIN_DECISION.md).

Step-by-step walkthrough: [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md)

---

## Verify — run in order after binding

```bash
npm run domain:check
# Exit 0 = domains are live. Exit 1 = still VERCEL_DOMAIN_NOT_BOUND — go back to step above.

npm run smoke:www
npm run smoke:prod

npm run launch:check -- --include-smoke
# All four must exit 0 before flipping verdict to GO.
```

**Pass state:**
- `domain:check` exits 0, classification `APEX_OK` + `WWW_REDIRECT_OK`.
- `smoke:www` exits 0 — `✓ All checks passed`.
- `smoke:prod` exits 0 — `✓ All checks passed`.
- `launch:check --include-smoke` exits 0 — all gates green.

After all four pass, paste [docs/CLAUDE_POST_BINDING_PROMPT.md](./CLAUDE_POST_BINDING_PROMPT.md) into Claude Code for automated verification and doc updates, then update this verdict to **GO**.

---

## Reference docs

| Doc | Read when |
|-----|-----------|
| [docs/CLAUDE_POST_BINDING_PROMPT.md](./CLAUDE_POST_BINDING_PROMPT.md) | After binding — paste into Claude Code for automated verification |
| [docs/OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md) | Env-var check, rollback SHA, full action list |
| [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) | Step-by-step domain binding walkthrough |
| [docs/RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Full sign-off history, SHA glossary, smoke run logs |
| [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring checklist |
