# Launch Authority

**Updated: 2026-04-25**

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Codebase | **GO** — build ✓ · lint ✓ · 317/317 tests ✓ |
| Public launch | **NO-GO** — one P0 blocker (see below) |

---

## P0 blocker

Vercel does not recognise `constructaiq.trade` or `www.constructaiq.trade`.
Every inbound request is rejected at the edge (`x-deny-reason: host_not_allowed`)
before the Next.js app runs. DNS is correct. No code change is needed.

---

## Next action — do this now

**Vercel UI → ConstructAIQ project → Settings → Domains**

1. **Add Domain** → `constructaiq.trade` → confirm.
2. **Add Domain** → `www.constructaiq.trade` → confirm.
3. Wait for a green checkmark on both (SSL provisions in 1–10 minutes).

Step-by-step walkthrough: [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md)

---

## Verify — run these after binding

```bash
curl -sSI https://constructaiq.trade
curl -sSI https://www.constructaiq.trade/dashboard
npm run smoke:www
npm run smoke:prod
```

**Pass state:** both curl calls return `HTTP/2 200` (no `x-deny-reason` header);
both smoke scripts exit 0 and print `✓ All checks passed`.

If all four pass, the P0 is resolved. Update the verdict to **GO** and proceed
with env-variable verification (see [OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md)).

---

## Reference docs

| Doc | Read when |
|-----|-----------|
| [docs/OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md) | Full action list, env-var check, rollback SHA |
| [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) | Step-by-step Vercel domain binding walkthrough |
| [docs/RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Full sign-off, SHA glossary, rollback procedure |
| [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring checklist once traffic is live |
