# Vercel Domain Fix

## Problem

`constructaiq.trade` and `www.constructaiq.trade` return HTTP 403 with the
response header `x-deny-reason: host_not_allowed` on every request. All pages,
API routes, and smoke tests fail as a result.

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-type: text/plain
```

## Cause

Vercel rejects the request at its edge layer before it reaches the Next.js
application. This happens when the `Host` header of an incoming request does
not match any domain configured on the targeted Vercel project. The Next.js
app never runs — no route, no redirect, no error boundary fires.

This is not:
- A deployment-protection password gate (those serve an HTML prompt, not a
  bare 403).
- A Cloudflare or upstream firewall block.
- A code bug.

The fix is entirely external: add the domains to the Vercel project and add
the corresponding DNS records at the DNS provider.

## Vercel Domain Steps

Both steps must be completed before any DNS change will take effect at the
application layer.

1. Sign in at <https://vercel.com/dashboard> and open the **ConstructAIQ**
   project.

2. Click **Settings** (top nav) → **Domains** (left rail).

3. Click **Add Domain**, enter `constructaiq.trade`, and submit. Vercel will
   display the DNS record it needs to verify the domain — note the value for
   the next section.

4. Click **Add Domain** again, enter `www.constructaiq.trade`, and submit.
   Vercel will display a CNAME target (typically `cname.vercel-dns.com`) —
   copy the exact value shown; it may differ per region.

5. After DNS propagates (see DNS Steps below), return to this panel. Each
   domain should transition from "Invalid Configuration" to a green checkmark.
   Vercel auto-issues an SSL certificate once it validates the records.

## DNS Steps

Make these changes at whichever provider hosts the `constructaiq.trade` zone
(Cloudflare, Route 53, registrar nameservers, etc.). Vercel does not manage
these records unless the domain was registered through Vercel.

### Apex record (`constructaiq.trade`)

The apex cannot be a plain CNAME under standard DNS. Choose based on your
provider:

| Provider capability              | Record to add                                              |
|----------------------------------|------------------------------------------------------------|
| ALIAS or CNAME flattening        | `ALIAS` / flattened `CNAME` → `cname.vercel-dns.com`      |
| A records only                   | `A` → `76.76.21.21` (verify this IP in the Vercel UI — it may change) |

### www record (`www.constructaiq.trade`)

```
Type:  CNAME
Name:  www                      ← just "www", not the full hostname
Value: cname.vercel-dns.com     ← exact value Vercel showed in Domain Step 4
TTL:   3600 (or provider default)
```

### Propagation

DNS changes typically propagate within 1–10 minutes. The Vercel Domains panel
refreshes automatically and will show a green checkmark once it can validate
the records and issue SSL.

## Verification Commands

Run these from any machine with outbound network access after completing the
Vercel and DNS steps above.

```bash
# 1. Confirm apex no longer returns 403
curl -sSI https://constructaiq.trade | head -3
# expected: HTTP/2 200 (or 301/302 to canonical path)
# must NOT contain: x-deny-reason: host_not_allowed

# 2. Confirm www DNS resolves and redirects to apex
npm run smoke:www
# expected: exits 0, all checks pass

# 3. Full smoke suite — pages, API shape, and www redirect
npm run smoke:prod
# expected: exits 0, "✓ All checks passed"

# 4. Verify apex and www DNS records directly
dig +short constructaiq.trade
# expected: 76.76.21.21 or a Vercel anycast IP

dig +short www.constructaiq.trade
# expected: CNAME chain ending at a Vercel edge address

# 5. Confirm infrastructure env vars after redeploy
curl -s https://constructaiq.trade/api/status | jq .env
# expected: { supabaseConfigured: true, anthropicConfigured: true,
#             upstashConfigured: true, sentryConfigured: true,
#             cronSecretConfigured: true }
```

## Expected Passing Output

### `npm run smoke:prod`

```
ConstructAIQ production smoke test
Target: https://constructaiq.trade
──────────────────────────────────────────────────

Pages
  ✓  GET / returns 200
  ✓  GET / has no global error page
  ✓  GET /dashboard returns 200
  ✓  GET /dashboard has no global error page

API
  ✓  /api/status returns 200
  ✓  /api/dashboard returns 200
  ✓  /api/dashboard returns valid JSON
  ✓  /api/dashboard has all required keys
  ✓  /api/dashboard signals is an array
  ✓  /api/dashboard commodities is an array
  ✓  /api/dashboard cshi is object or null (regression guard)

www redirect
  ✓  www subdomain returns 301 redirect
  ✓  www redirect → https://constructaiq.trade/dashboard

──────────────────────────────────────────────────
13 passed, 0 failed

✓ All checks passed
```

### `npm run smoke:www`

```
www redirect
  ✓  www DNS resolves (www.constructaiq.trade responded)
  ✓  www returns 308 redirect
  ✓  www redirect target → https://constructaiq.trade/dashboard
```

## Troubleshooting

### Still getting 403 after adding the domain in Vercel

The DNS record has not propagated yet, or the record value is wrong.

- Wait a further 5 minutes and recheck the Vercel Domains panel.
- Run `dig +short constructaiq.trade` — if it returns nothing or a
  non-Vercel IP the apex record is missing or incorrect.
- Run `dig +short www.constructaiq.trade` — if it returns nothing the
  CNAME record is missing.

### `smoke:www` reports "www DNS resolves" but still 403

DNS is correct but `www.constructaiq.trade` has not been added to the Vercel
project. Complete Vercel Domain Step 4 (add `www.constructaiq.trade` in the
Domains panel).

### `smoke:www` reports redirect to wrong target

The `next.config.ts` `redirects()` rule points `www` → apex. If the Location
header shows an unexpected URL, the redirect destination has been edited.
Restore the `destination` value to `https://constructaiq.trade/:path*`.

### `smoke:prod` pages pass but `/api/status` returns 500

The domain is bound but required environment variables are not set in Vercel
Production scope. Set the required variables (see
[ENVIRONMENT.md](./ENVIRONMENT.md)) and trigger a redeploy. The 500 will
persist until at minimum `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are present.

### Vercel Domains panel stuck on "Invalid Configuration" after 15 minutes

- Confirm the DNS record was saved at the provider (not just edited in the UI
  without saving).
- Check for a conflicting CAA record that blocks Vercel's certificate issuer.
- Try `dig +short constructaiq.trade` from a public resolver
  (`8.8.8.8` or `1.1.1.1`) to rule out local DNS caching.

## Related Docs

| Document | Relevance |
|---|---|
| [RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Authoritative launch-state document — go/no-go, all blockers |
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) | Full gate-by-gate launch checklist (Gates 1–5) |
| [PRODUCTION_SMOKE.md](./PRODUCTION_SMOKE.md) | Smoke script reference — all checks, failure modes, remediation |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Vercel env var setup walkthrough — required after domain is bound |
