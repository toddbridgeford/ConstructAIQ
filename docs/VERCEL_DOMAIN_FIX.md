# Vercel Domain Fix

> **Launch state and remaining actions:** [docs/OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md)

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

Run these in order from any machine with outbound network access once the
Vercel Domain Steps and DNS Steps above are complete.

### 1. Check DNS resolution

```bash
dig +short constructaiq.trade
```

Expected — one of:
- `76.76.21.21` (Vercel anycast A record)
- A CNAME chain ending at a Vercel edge address (if ALIAS/flattening is used)

If the output is **empty**, the apex DNS record has not been saved or has not
propagated yet.

```bash
dig +short www.constructaiq.trade
```

Expected — a CNAME chain that passes through `cname.vercel-dns.com` and
resolves to a Vercel IP. If empty, the `www` CNAME record is missing.

### 2. Check the apex HTTP response

```bash
curl -sSI https://constructaiq.trade
```

Expected first line: `HTTP/2 200` (or `301`/`302` to a canonical path).

The response must **not** contain `x-deny-reason: host_not_allowed`. If it
does, the domain has not been added to the Vercel project yet (or DNS has not
propagated) — see Troubleshooting below.

### 3. Check the www HTTP response

```bash
curl -sSI https://www.constructaiq.trade/dashboard
```

Expected: `HTTP/2 301` (or `308`) with a `location` header pointing to
`https://constructaiq.trade/dashboard`.

The response must **not** be `200` (that would mean the redirect rule is not
firing) and must **not** contain `x-deny-reason: host_not_allowed`.

### 4. Run the www smoke test

```bash
npm run smoke:www
```

Must exit 0. See Expected Passing Output below.

### 5. Run the full production smoke suite

```bash
npm run smoke:prod
```

Must exit 0. See Expected Passing Output below.

## Expected Passing Output

### `dig +short constructaiq.trade`

```
76.76.21.21
```

### `dig +short www.constructaiq.trade`

```
cname.vercel-dns.com.
76.76.21.21
```

### `curl -sSI https://constructaiq.trade`

```
HTTP/2 200
content-type: text/html; charset=utf-8
...
```

No `x-deny-reason` header present.

### `curl -sSI https://www.constructaiq.trade/dashboard`

```
HTTP/2 301
location: https://constructaiq.trade/dashboard
...
```

Status is `301` (or `308`). Location points to `https://constructaiq.trade/…`.
No `x-deny-reason` header present.

### `npm run smoke:www`

```
www redirect
  ✓  www DNS resolves (www.constructaiq.trade responded)
  ✓  www returns 308 redirect
  ✓  www redirect target → https://constructaiq.trade/dashboard
3 passed, 0 failed
```

Exit code: 0.

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

Exit code: 0.

## Troubleshooting

### `dig` returns empty — `ENOTFOUND` or no output

**Symptom:** `dig +short constructaiq.trade` prints nothing, or a DNS tool
reports `ENOTFOUND`.

**Cause:** The DNS record does not exist yet, or it was not saved at the
provider.

**Fix:**
1. Log back in to the DNS provider and confirm the A or ALIAS record for
   `constructaiq.trade` is present and saved (not just drafted).
2. For `www`: confirm the CNAME record for `www` is present and saved.
3. Wait 5 more minutes and retry `dig`.

### `curl` returns HTTP 403 with `x-deny-reason: host_not_allowed`

**Symptom:**

```
HTTP/2 403
x-deny-reason: host_not_allowed
```

**Cause:** DNS resolves correctly (the request reaches Vercel) but the domain
has not been added to the ConstructAIQ Vercel project, or it has been added
to a **different** Vercel project.

**Fix:**
1. Open <https://vercel.com/dashboard> → **construct-aiq** project →
   **Settings → Domains**.
2. Confirm `constructaiq.trade` (and `www.constructaiq.trade` for the www
   variant) are listed here. If they appear in another project, remove them
   from that project and add them to construct-aiq.
3. If the domain was just added, wait 1–2 minutes for Vercel to detect the
   DNS records, then retry.

This is the exact failure observed in the release-candidate smoke tests on
2026-04-25 — it is the primary launch blocker.

### `curl https://www.constructaiq.trade` returns HTTP 200 (not a redirect)

**Symptom:** The www address loads the full site instead of redirecting to the
apex.

**Cause:** The `next.config.ts` `redirects()` rule did not fire. Most likely
cause: `www.constructaiq.trade` was configured in Vercel as a **primary
domain** rather than relying on the application-layer redirect.

**Fix:**
1. In Vercel → Settings → Domains, check how `www.constructaiq.trade` is
   configured. It should be a plain domain entry that the application handles
   — not a Vercel-level "redirect to" setting that overrides the app.
2. Confirm the latest `main` deployment is the one serving traffic (a stale
   deployment predating the `redirects()` rule would also cause this).
3. Trigger a redeploy if needed: Vercel → Deployments → latest Production →
   `…` → Redeploy.

### `curl https://www.constructaiq.trade` redirects to the wrong domain

**Symptom:** The `location` header in the 301/308 response points to a domain
other than `https://constructaiq.trade/…`.

**Cause:** The `destination` value in the `redirects()` block inside
`next.config.ts` has been edited.

**Fix:** Open `next.config.ts` and restore the redirect destination to:

```ts
destination: "https://constructaiq.trade/:path*",
```

### `smoke:prod` pages return 200 but `/api/status` returns 500

**Cause:** Domain binding is working but required Vercel Production
environment variables are missing. `/api/status` calls Supabase and cannot
succeed without `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
and `SUPABASE_SERVICE_ROLE_KEY`.

**Fix:** Set the required variables in Vercel → Settings → Environment
Variables → Production scope, then trigger a redeploy. See
[ENVIRONMENT.md](./ENVIRONMENT.md) for the full walkthrough.

### Vercel Domains panel stuck on "Invalid Configuration" after 15 minutes

- Confirm the record was **saved** at the DNS provider (not just edited).
- Run `dig +short constructaiq.trade @8.8.8.8` — using Google's resolver
  rules out local DNS caching. If it returns the correct IP, Vercel should
  validate within minutes.
- Check for a conflicting CAA record at the DNS provider that might block
  Vercel's certificate issuer (Let's Encrypt).

## Related Docs

| Document | Relevance |
|---|---|
| [RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Authoritative launch-state document — go/no-go, all blockers |
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) | Full gate-by-gate launch checklist (Gates 1–5) |
| [PRODUCTION_SMOKE.md](./PRODUCTION_SMOKE.md) | Smoke script reference — all checks, failure modes, remediation |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Vercel env var setup walkthrough — required after domain is bound |
