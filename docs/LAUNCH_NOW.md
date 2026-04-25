# Launch Authority

**Updated: 2026-04-25 (Phase 15 data/dashboard attempt — blocked · domain still unbound)**

---

> **STOP: code is launch-ready. The only active blocker is Vercel domain binding.**

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Build | **GO** — 84 routes · 0 errors (92.2s) |
| Lint | **GO** — no ESLint warnings or errors |
| Tests | **GO** — 344/344 passed |
| Smoke | **NO-GO** — smoke:prod 1/6 passed · smoke:www 1/2 passed · both fail on `host_not_allowed` |
| Public launch | **NO-GO** |

---

## P0 blocker

Both `constructaiq.trade` and `www.constructaiq.trade` return HTTP 403
`x-deny-reason: host_not_allowed`. DNS resolves. No code change needed.

---

## Next action — do this now

**Vercel UI → ConstructAIQ project → Settings → Domains**

1. **Add Domain** → `constructaiq.trade` → confirm.
2. **Add Domain** → `www.constructaiq.trade` → confirm.
3. Wait for a green checkmark on both (SSL provisions in 1–10 minutes).

> **Canonical note:** Connect both domains directly. Do **not** enable
> "Redirect to www" on `constructaiq.trade` — that creates a redirect loop
> with the app-layer `www → apex` rule in `next.config.ts`.
> See [docs/CANONICAL_DOMAIN_DECISION.md](./CANONICAL_DOMAIN_DECISION.md).

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
