# Fix Vercel canonical/proxy configuration

**Created: 2026-04-25**

Quick reference for resolving the exact misconfiguration currently visible in the
Vercel UI. Full background: [docs/CANONICAL_DOMAIN_DECISION.md](./CANONICAL_DOMAIN_DECISION.md)

---

## Current observed state (as of 2026-04-25)

| Domain | What Vercel UI shows | What it should show |
|--------|---------------------|---------------------|
| `constructaiq.trade` | 308 redirect → `www.constructaiq.trade` | Connected directly to Production — no redirect |
| `www.constructaiq.trade` | Connected to Production | Connected directly — no Vercel-level redirect rule |
| Both domains | **Proxy Detected** warning | No proxy warning — DNS-only records |

**Why this breaks the site:** `next.config.ts` permanently redirects `www → apex`. With Vercel
also redirecting `apex → www`, every request loops until the browser aborts with "Too many
redirects". The site is unreachable from either URL.

---

## Remediation steps

### Step 1 — Open Vercel Domains panel

1. Go to **https://vercel.com/dashboard** and sign in.
2. Click the **construct-aiq** project.
3. Click **Settings** in the top nav.
4. Click **Domains** in the left sidebar.

You should see both `constructaiq.trade` and `www.constructaiq.trade` listed.

---

### Step 2 — Remove the apex-to-www redirect

1. Find the row for **`constructaiq.trade`**.
2. Click the **edit** icon (pencil) or the `…` menu on that row.
3. Look for any option labelled **"Redirect to www"**, **"Redirect domain"**, or a redirect
   arrow pointing to `www.constructaiq.trade`.
4. **Disable or delete that redirect rule.**
5. Confirm `constructaiq.trade` is now listed as a **direct Production domain** — no redirect
   indicator, no arrow, no secondary label.

> **Do not touch `www.constructaiq.trade`** — it must stay connected. The application layer
> (`next.config.ts`) handles the `www → apex` redirect automatically once both domains are
> bound without a Vercel-level override.

---

### Step 3 — Confirm www is connected directly

1. Find the row for **`www.constructaiq.trade`**.
2. Confirm it shows as a connected domain with a green checkmark (or "Valid Configuration").
3. Confirm there is **no** Vercel-level redirect rule attached to it.

---

### Step 4 — Disable the DNS proxy

The **Proxy Detected** warning means a DNS proxy (e.g. Cloudflare's orange-cloud mode) sits
between your DNS provider and Vercel. This prevents Vercel from issuing SSL certificates and
can cause `host_not_allowed` responses even when the domain appears bound.

1. Log in to your **DNS provider** (Cloudflare, Route 53, Namecheap, etc.).
2. Find the DNS records for `constructaiq.trade`.
3. For the **apex (`@`)** record:
   - **Cloudflare:** click the orange cloud icon → select **DNS only** (grey cloud). Save.
   - **Other providers:** locate any "Proxy", "CDN", or "Shield" toggle and disable it.
4. For the **`www`** CNAME record: repeat the same step — set to DNS-only.
5. Save both records.

> After switching to DNS-only, traffic goes directly to Vercel's edge. Vercel handles TLS
> and DDoS protection at its own layer.

---

### Step 5 — Wait for Vercel to confirm

1. Return to **Vercel → Settings → Domains**.
2. Refresh every 1–2 minutes.
3. Wait until:
   - Both rows show a **green checkmark** (Valid Configuration / SSL active).
   - The **Proxy Detected** warning is gone from both rows.
   - `constructaiq.trade` shows no redirect indicator.

This typically takes 1–5 minutes after disabling the DNS proxy.

---

### Step 6 — Verify with domain:check

Run from the project root:

```bash
npm run domain:check
```

**Expected passing output:**

```
ConstructAIQ — domain status check
══════════════════════════════════════════════════════

  apex  (constructaiq.trade)
  ──────────────────────────────────────────────────
  status          : 200
  classification  : APEX_OK
  diagnosis       : Apex domain is reachable.

  www   (www.constructaiq.trade/dashboard)
  ──────────────────────────────────────────────────
  status          : 308
  location        : https://constructaiq.trade/dashboard
  classification  : WWW_REDIRECT_OK
  diagnosis       : www redirects correctly to the apex domain.

══════════════════════════════════════════════════════

  ✓ All good — apex reachable, www redirects correctly.
```

**Exit code: 0**

If `domain:check` exits 1 (`host_not_allowed`), the domain is not yet bound or DNS has not
propagated — wait a few more minutes and retry.

If `domain:check` exits 2 (`APEX_REDIRECTS_TO_WWW`), the Vercel redirect was not fully
removed — repeat Step 2.

---

## After domain:check exits 0

Proceed to the full smoke suite:

```bash
npm run smoke:www
npm run smoke:prod
npm run launch:check -- --include-smoke
```

All three must exit 0. Then paste
[docs/CLAUDE_POST_BINDING_PROMPT.md](./CLAUDE_POST_BINDING_PROMPT.md) into Claude Code
for automated verification and final launch sign-off.

Launch status: [docs/LAUNCH_NOW.md](./LAUNCH_NOW.md)

---

## What not to change

| Item | Action |
|------|--------|
| `next.config.ts` | Do not touch — redirect logic is correct |
| `www.constructaiq.trade` in Vercel | Keep connected — do not remove it |
| DNS A / CNAME record targets | Do not change the record values, only the proxy toggle |
