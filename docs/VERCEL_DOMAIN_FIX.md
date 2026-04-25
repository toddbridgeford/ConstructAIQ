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

Both domains must be added to the Vercel project before any DNS record will
have any effect. Do these steps first, before touching DNS.

### Step 1 — Open the project

1. Go to <https://vercel.com/dashboard> and sign in.
2. Find and click the project named **construct-aiq** (or ConstructAIQ).
3. Click **Settings** in the top navigation bar.
4. Click **Domains** in the left-hand sidebar. You will see a list of domains
   currently assigned to this project.

### Step 2 — Add the apex domain

1. Click the **Add** button (or **Add Domain** — the label varies by Vercel
   plan).
2. In the input field, type exactly:
   ```
   constructaiq.trade
   ```
3. Click **Add**. Vercel will show a verification panel with the DNS record
   value it expects. Leave this panel open and note the values — you will
   need them in the DNS Steps below.

### Step 3 — Add the www domain

1. Click **Add** again (do not close the panel from Step 2 yet).
2. In the input field, type exactly:
   ```
   www.constructaiq.trade
   ```
3. Click **Add**. Vercel will display a CNAME target for this subdomain —
   typically `cname.vercel-dns.com`. **Copy this exact value** before
   proceeding; it may differ per Vercel region.

### Step 4 — Confirm both domains are listed

After adding both, the Domains panel should show two rows:

| Domain                       | Status                          |
|------------------------------|---------------------------------|
| `constructaiq.trade`         | Invalid Configuration (for now) |
| `www.constructaiq.trade`     | Invalid Configuration (for now) |

"Invalid Configuration" is expected at this point — it means DNS has not yet
been updated. The status will change to a green checkmark after the DNS steps
below are complete and Vercel validates the records.

## DNS Steps

Make these changes at whichever provider hosts the `constructaiq.trade` DNS
zone. This is wherever the domain was registered or wherever the nameservers
are pointed — commonly Cloudflare, Route 53, GoDaddy, Namecheap, or similar.
Vercel does **not** manage these records unless the domain was purchased
through Vercel.

Log in to your DNS provider's control panel and find the DNS records for
`constructaiq.trade` before continuing.

### Record 1 — Apex (`constructaiq.trade`)

The root/apex domain (`constructaiq.trade` with no subdomain prefix) cannot
use a plain CNAME record under standard DNS rules. Choose the option your
provider supports:

**Option A — If your provider supports ALIAS or CNAME flattening**
(Cloudflare calls this a "CNAME" on the root; Route 53 calls it "ALIAS"):

```
Type:  ALIAS  (or CNAME, if your provider flattens at the apex)
Name:  @       ← the "@" symbol means the root/apex domain
Value: cname.vercel-dns.com
TTL:   3600    (or Auto / provider default)
```

**Option B — If your provider only supports A records at the apex**
(most traditional registrars):

```
Type:  A
Name:  @        ← the "@" symbol means the root/apex domain
Value: 76.76.21.21
TTL:   3600     (or provider default)
```

> The IP `76.76.21.21` is Vercel's anycast address. Verify it matches what
> the Vercel Domains panel shows for your project — it is unlikely to change
> but the panel is the authoritative source.

### Record 2 — www subdomain (`www.constructaiq.trade`)

```
Type:  CNAME
Name:  www                       ← type just "www", not "www.constructaiq.trade"
Value: cname.vercel-dns.com      ← use the exact value Vercel showed in Domain Step 3
TTL:   3600                      (or provider default)
```

Save both records. Most DNS providers show a "Save" or "Add Record" button
per row — make sure both records are saved before continuing.

### Waiting for propagation and SSL

1. DNS changes typically take **1–10 minutes** to reach Vercel's validation
   servers. In rare cases it can take up to an hour.

2. Return to the Vercel **Settings → Domains** panel. Refresh the page every
   minute or two. When Vercel detects valid DNS records:
   - The status changes from "Invalid Configuration" to a green checkmark.
   - Vercel automatically requests and installs an SSL certificate (this
     happens in the background — no action required).

3. Once **both** rows show a green checkmark, the domains are live and SSL
   is active. Continue to the Verification Commands section.

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
