# Post-Binding Verification — 2026-04-25 (Phase 22)

**Branch:** `claude/final-domain-verification-U2rWX`  
**Timestamp:** 2026-04-25 23:25 UTC  
**Operator evidence:** Vercel dashboard shows both `constructaiq.trade` and `www.constructaiq.trade` as **Valid Configuration + Production**

---

## Critical Discovery — Sandbox Egress Proxy

**All HTTP/HTTPS verification from this Claude Code sandbox is unreliable.** Every outbound connection — including DNS resolution — is intercepted by Anthropic's sandbox egress proxy.

### Evidence

```
curl -sSIv https://constructaiq.trade
* Connected to constructaiq.trade (64.29.17.1) port 443
* issuer: O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
* subject: CN=constructaiq.trade
HTTP/2 403
x-deny-reason: host_not_allowed
```

DNS resolution (Python socket — before TCP layer):
```
constructaiq.trade    -> 64.29.17.65
www.constructaiq.trade -> 64.29.17.65
```

Both resolving to `64.29.17.x` confirms the sandbox DNS resolver itself redirects all external hostnames to the Anthropic egress proxy. The proxy then generates the `403 host_not_allowed` response — this is the proxy rejecting the domain, **not Vercel rejecting an unbound domain**.

### Implication for all prior phases

Every `domain:check`, `smoke:prod`, `smoke:www`, and `curl` run in this session and all prior sessions (Phases 18–21) was measuring the Anthropic proxy's response, not Vercel's edge. The classification `VERCEL_DOMAIN_NOT_BOUND` was incorrectly inferred — the proxy was blocking the request before it ever reached Vercel.

**The `403 host_not_allowed` pattern is consistent with both Vercel and the Anthropic proxy — it cannot be used to distinguish between them from within this sandbox.**

---

## Phase 22 command results

| Command | Exit | Observed | Root cause |
|---------|------|----------|-----------|
| `npm run domain:check` | 1 | `apex: VERCEL_DOMAIN_NOT_BOUND · www: VERCEL_DOMAIN_NOT_BOUND` | Anthropic egress proxy blocks domain · not Vercel |
| `node scripts/check-domain-status.mjs --json` | 1 | `status:403 · denyReason:host_not_allowed` both | Same proxy |
| `curl -sSI https://constructaiq.trade` | — | `HTTP/2 403 · x-deny-reason: host_not_allowed` | Anthropic proxy |
| `curl -sSI https://www.constructaiq.trade/dashboard` | — | `HTTP/2 403 · x-deny-reason: host_not_allowed` | Anthropic proxy |
| DNS via `socket.gethostbyname('constructaiq.trade')` | 0 | `64.29.17.65` — Anthropic proxy IP | DNS intercepted |
| DNS via `socket.gethostbyname('www.constructaiq.trade')` | 0 | `64.29.17.65` — Anthropic proxy IP | DNS intercepted |
| TLS issuer | — | `O=Anthropic; CN=sandbox-egress-production TLS Inspection CA` | MITM proxy confirmed |

`smoke:prod`, `smoke:www`, `launch:check --include-smoke`, and all `api/status` / `api/dashboard` probes were **not run** — they would return identical proxy-generated 403s and contain no valid information about the live deployment.

---

## Authoritative evidence: Vercel dashboard

Operator screenshot confirms (2026-04-25):

| Domain | Status | Deployment |
|--------|--------|-----------|
| `constructaiq.trade` | **Valid Configuration** | **Production** |
| `www.constructaiq.trade` | **Valid Configuration** | **Production** |
| Apex → www redirect | **Not present** | — |
| Cloudflare proxy | **DNS-only** | — |

"Valid Configuration" in the Vercel UI means Vercel's edge is serving the domain from this project. This is the authoritative signal for domain binding — it supersedes `domain:check` output from within a sandboxed environment.

---

## Verdict

| Gate | Status | Evidence |
|------|--------|---------|
| Domain binding | **LIKELY GO** — cannot verify from sandbox | Vercel dashboard: Valid Configuration + Production for both domains |
| `domain:check` exit 0 | **CANNOT VERIFY** — sandbox proxy blocks all external HTTPS | Proxy-generated 403, not Vercel |
| `smoke:www` | **CANNOT VERIFY** — sandbox proxy blocks all external HTTPS | — |
| `smoke:prod` | **CANNOT VERIFY** — sandbox proxy blocks all external HTTPS | — |
| `launch:check --include-smoke` | **CANNOT VERIFY** — sandbox proxy blocks all external HTTPS | — |
| Env/data/dashboard | **CANNOT VERIFY** — sandbox proxy blocks all external HTTPS | — |

**Public launch: CANNOT DECLARE FROM SANDBOX.** All required verification commands must be run from outside this Claude Code environment — from the operator's own machine or from a CI runner with direct internet access.

---

## Required operator action — run from your own terminal

Run this sequence from your local machine (not from within Claude Code):

```bash
# 1 — Domain + binding
npm run domain:check
# Expected: exit 0 · apex APEX_OK · www WWW_REDIRECT_OK

# 2 — Curl raw headers (no npm required)
curl -sSI https://constructaiq.trade
# Expected: HTTP/2 200 or 301/302, server: Vercel or similar — NOT x-deny-reason: host_not_allowed

curl -sSI https://www.constructaiq.trade/dashboard
# Expected: HTTP/2 200, no host_not_allowed

# 3 — Smoke
npm run smoke:www
# Expected: exit 0

npm run smoke:prod
# Expected: exit 0

# 4 — Launch gate
npm run launch:check -- --include-smoke
# Expected: exit 0

# 5 — Env/runtime
curl -s https://constructaiq.trade/api/status | jq .env
curl -s https://constructaiq.trade/api/status | jq .runtime
curl -s https://constructaiq.trade/api/status | jq .data
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data

# 6 — Dashboard shape
curl -s https://constructaiq.trade/api/dashboard | jq '{fetched_at, cshi: (.cshi|type), signals: (.signals|length), commodities: (.commodities|length), forecast: (.forecast|type)}'
```

**If all pass:** Public launch is GO. See [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) for first-24-hour monitoring.  
**If any fail:** Paste the exact output here for the next escalation step.

---

## DNS verification (from your machine)

To confirm the domain isn't routing through Cloudflare proxy and is pointing at Vercel:

```bash
# Apex — should resolve to 76.76.21.21 (Vercel)
dig +short constructaiq.trade A

# www — should resolve via cname.vercel-dns.com
dig +short www.constructaiq.trade CNAME
dig +short www.constructaiq.trade A

# Confirm no Cloudflare proxy IPs (104.x / 172.x)
```

---

## If `domain:check` still exits 1 from your machine

If you run the above commands from your own terminal and still see `x-deny-reason: host_not_allowed`, the Vercel dashboard showing "Valid Configuration" may reflect a propagation lag or a project mismatch. Next escalation:

1. In Vercel: Settings → Domains → remove both domains and re-add them  
2. Wait 60 seconds, re-run `curl -sSI https://constructaiq.trade`  
3. If still failing: contact Vercel support with the `curl -sSIv` output — the dashboard shows Valid Configuration but edge is still rejecting, which is a Vercel-side issue

---

## Reference

| Doc | Purpose |
|-----|---------|
| [docs/LAUNCH_NOW.md](./LAUNCH_NOW.md) | Launch authority + gate history |
| [docs/POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring |
| [docs/VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) | Vercel domain binding walkthrough |
