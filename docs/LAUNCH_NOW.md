# Launch Authority

**Updated: 2026-04-25 18:50 UTC**

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Codebase | **GO** — build ✓ · lint ✓ · 317/317 tests ✓ |
| Public launch | **NO-GO** — P0 blocker unchanged (see below) |

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

## Last verified — 2026-04-25 19:00 UTC

| Probe | Result |
|-------|--------|
| `curl -sSI https://constructaiq.trade` | **HTTP/2 403** · `x-deny-reason: host_not_allowed` |
| `curl -sSI https://www.constructaiq.trade/dashboard` | **HTTP/2 403** · `x-deny-reason: host_not_allowed` |
| `npm run smoke:www` | **exit 1** · 1 passed, 1 failed |
| `npm run smoke:prod` | **exit 1** · 1 passed, 5 failed |

DNS resolves on both domains (`www DNS resolves` passes). The Vercel domain
binding has not been completed. Next.js never receives any request.

Env/data verification (Supabase, CRON_SECRET, federal source, weekly-brief
source) was not attempted — all endpoints return 403 before the application
runs, so those probes carry no signal. They will be run once smoke exits 0.

---

## Reference docs

| Doc | Read when |
|-----|-----------|
| [docs/OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md) | Full action list, env-var check, rollback SHA |
| [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) | Step-by-step Vercel domain binding walkthrough |
| [docs/RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Full sign-off, SHA glossary, rollback procedure |
| [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring checklist once traffic is live |
