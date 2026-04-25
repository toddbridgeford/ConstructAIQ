# Operator Handoff

> **One-page launch authority:** [docs/LAUNCH_NOW.md](./LAUNCH_NOW.md)

**As of: 2026-04-25 18:20 UTC**
**Prepared by: `claude/fix-doc-sha-consistency-7Y01M`**

---

## Current verdict

| Dimension | Status | Detail |
|-----------|--------|--------|
| Codebase | **GO** | Build ✓ · Lint ✓ · 341/341 tests ✓ |
| Public launch | **NO-GO** | Single P0 blocker — see below |

---

## P0 blocker — Vercel domain binding

Every inbound request to `constructaiq.trade` and `www.constructaiq.trade`
is rejected at the Vercel edge with:

```
HTTP/2 403
x-deny-reason: host_not_allowed
```

The Next.js application never runs. This is **not** a DNS issue, not a code
issue, and not a firewall block. DNS resolves correctly — the TCP/TLS
handshake completes — but the Vercel project does not recognise either domain
because neither has been added to the project's domain list.

---

## Action required — one task, do it now

**Vercel UI → ConstructAIQ project → Settings → Domains**

1. Click **Add Domain** → enter `constructaiq.trade` → confirm.
2. Click **Add Domain** again → enter `www.constructaiq.trade` → confirm.
3. Wait for Vercel to show a green checkmark next to both domains
   (SSL auto-provisions; takes 1–10 minutes).
4. **Do not enable "Redirect to www" on the apex domain.** The canonical
   domain is `constructaiq.trade` (apex). Enabling that toggle creates a
   redirect loop: Vercel sends apex → www, then the app sends www → apex.
   Both domains must be connected directly; `next.config.ts` handles
   `www → apex` at the application layer.

Full step-by-step walkthrough: [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md)
Canonical decision rationale: [docs/CANONICAL_DOMAIN_DECISION.md](./CANONICAL_DOMAIN_DECISION.md)

---

## DNS status

| Domain | DNS resolution | Vercel binding |
|--------|---------------|----------------|
| `constructaiq.trade` | Resolves (TCP/TLS handshake completes) | **Not bound** — HTTP 403 |
| `www.constructaiq.trade` | Resolves (`www DNS resolves` passes on smoke) | **Not bound** — HTTP 403 |

No DNS changes are needed. The registrar/DNS side is done.

---

## Verification — run these after binding

```bash
# 1. Quick diagnosis — run this first; exit 1 means domain not yet bound
npm run domain:check

# 2. Apex no longer returns x-deny-reason
curl -sSI https://constructaiq.trade

# 3. www no longer returns x-deny-reason
curl -sSI https://www.constructaiq.trade/dashboard

# 4. www smoke — must exit 0
npm run smoke:www

# 5. Full smoke — must exit 0
npm run smoke:prod
```

### Expected pass state

| Check | Expected result |
|-------|----------------|
| `curl -sSI https://constructaiq.trade` | `HTTP/2 200` — no `x-deny-reason` header |
| `curl -sSI https://www.constructaiq.trade/dashboard` | `HTTP/2 301`, `302`, or `308` — `location` header points to `https://constructaiq.trade/dashboard`; no `x-deny-reason` header |
| `npm run smoke:www` | Exit 0 — `✓ All checks passed` |
| `npm run smoke:prod` | Exit 0 — `✓ All checks passed` |

If all four pass, paste [docs/CLAUDE_POST_BINDING_PROMPT.md](./CLAUDE_POST_BINDING_PROMPT.md) into Claude Code for automated verification and doc updates before updating the verdict to **GO**.

---

## After smoke passes — env variable check

Once the domain is live, verify the five required Vercel environment variables
are set in **Production scope**:

```bash
curl -s https://constructaiq.trade/api/status | jq .env
```

Expected:

```json
{
  "supabaseConfigured":   true,
  "cronSecretConfigured": true,
  "anthropicConfigured":  true,
  "upstashConfigured":    true,
  "sentryConfigured":     true
}
```

The P0 env vars (without these the dashboard is broken):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
SITE_LOCKED=false
```

Full env var list and instructions: [docs/RELEASE_CANDIDATE_REPORT.md — Environment Variable Actions](./RELEASE_CANDIDATE_REPORT.md#environment-variable-actions)

---

## Reference docs

| Doc | Purpose |
|-----|---------|
| [docs/CLAUDE_POST_BINDING_PROMPT.md](./CLAUDE_POST_BINDING_PROMPT.md) | After smoke passes — paste into Claude Code for automated verification |
| [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) | Step-by-step Vercel domain binding walkthrough |
| [docs/RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Full launch sign-off, env vars, rollback SHA, go/no-go summary |
| [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring checklist once traffic is live |

---

## Rollback SHA

If a regression appears after launch, the last known-good rollback SHA is:

**`b392c37`** (`b392c3759fb5051197203c3e050584b37d0b90e1`)

This is a docs-only commit; the RC code SHA is `8c1cd98d` — all commits between them
are docs-only and the deployed application is identical at both.
Confirm the deployment SHA in Vercel before promoting a rollback.

Vercel → ConstructAIQ → Deployments → find the last **Ready** build → `…`
→ **Promote to Production**.

Full procedure: [docs/RELEASE_CANDIDATE_REPORT.md — Rollback Procedure](./RELEASE_CANDIDATE_REPORT.md#rollback-procedure)
