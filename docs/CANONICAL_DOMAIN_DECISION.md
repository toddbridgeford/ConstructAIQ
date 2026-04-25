# Canonical Domain Decision

**Created: 2026-04-25**
**Updated: 2026-04-25**
**Status: DECIDED — apex canonical (`constructaiq.trade`). No code changes required.**

---

## Decision

**Canonical URL: `https://constructaiq.trade`** (apex, no `www`)

- `www.constructaiq.trade` must redirect to `constructaiq.trade`.
- Vercel must **not** be configured to redirect `constructaiq.trade` → `www.constructaiq.trade`.
- The application-layer redirect in `next.config.ts` handles `www → apex` automatically once both domains are bound to the project.

---

## Required Vercel Configuration

Connect both domains to the ConstructAIQ project, then leave all redirect logic to the application layer:

| Domain | Vercel setting | Notes |
|---|---|---|
| `constructaiq.trade` | Connected directly to the project | **No** "Redirect to www" — leave it off |
| `www.constructaiq.trade` | Connected directly to the project | No Vercel-level redirect rule; `next.config.ts` issues `www → apex` 308 |

> **Warning:** If Vercel's "Redirect to www" toggle is enabled on the apex domain, it creates a redirect loop: Vercel sends apex → www, then the app sends www → apex. The site becomes unreachable.

---

## Summary

There was a mismatch between the canonical domain direction configured in the
repository and the canonical domain direction observed in the Vercel UI. This
document records the conflict and its resolution.

---

## Current Repo Expectation: Apex Canonical

Every layer of the codebase assumes `constructaiq.trade` (apex, no `www`) is
the canonical URL and that `www.constructaiq.trade` is an alias that redirects
to it.

### Evidence

**`next.config.ts` — application-layer redirect (lines 67–77)**

```ts
async redirects() {
  return [
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.constructaiq.trade" }],
      destination: "https://constructaiq.trade/:path*",
      permanent: true,           // HTTP 308 — www → apex
    },
  ];
},
```

The rule fires on every request whose `Host` header is `www.constructaiq.trade`
and sends a permanent redirect to the apex origin. There is no reciprocal rule
that redirects apex to www.

**`scripts/check-domain-status.mjs` — health-check script**

- `classifyApex()` (line 79) returns `APEX_OK` when the apex domain responds
  with `200`, `301`, or `308`.
- `classifyWww()` (line 90) returns `WWW_REDIRECT_OK` only when the www domain
  issues a redirect whose `Location` header starts with
  `https://constructaiq.trade` (the apex).
- The script exits `0` only when both `APEX_OK` **and** `WWW_REDIRECT_OK` are
  true. A www domain that redirects elsewhere (including to itself as primary)
  yields `WWW_REDIRECT_WRONG_TARGET` and exits `2`.

**`scripts/smoke-prod.mjs` — production smoke test**

- `checkWwwRedirect()` (line 207) fetches `https://www.constructaiq.trade/dashboard`
  without following redirects and asserts the `Location` header starts with the
  apex base URL.
- The expected passing output in `docs/VERCEL_DOMAIN_FIX.md` confirms this:

  ```
  curl -sSI https://www.constructaiq.trade/dashboard
  HTTP/2 301
  location: https://constructaiq.trade/dashboard
  ```

**`docs/VERCEL_DOMAIN_FIX.md` — operator guide**

- Instructs the operator to add `constructaiq.trade` as the primary domain and
  `www.constructaiq.trade` as a secondary alias.
- All expected command outputs show www redirecting to apex, never the reverse.

**`docs/LAUNCH_NOW.md` — launch verdict**

- Pass criteria include `domain:check` returning `APEX_OK + WWW_REDIRECT_OK`.
- Both scripts treat apex canonical as the correct steady state.

---

## Observed Vercel Configuration: www Canonical

The Vercel UI screenshot provided on 2026-04-25 shows the opposite direction:

```
constructaiq.trade  →  redirects to  →  www.constructaiq.trade
```

Vercel has been configured — either manually or via a "Redirect to www" toggle
in the Domains panel — to treat `www.constructaiq.trade` as the primary domain
and redirect the apex to it.

---

## Why This Is a Problem

### Redirect loop risk

With both redirect rules active simultaneously:

1. User (or crawler) requests `https://constructaiq.trade/dashboard`.
2. Vercel edge redirects the request to `https://www.constructaiq.trade/dashboard` (Vercel-level rule).
3. The Next.js application receives the www request and redirects back to `https://constructaiq.trade/dashboard` (app-level rule in `next.config.ts`).
4. The browser loops until it hits the browser redirect-loop limit and aborts.

This renders the site unreachable for all traffic arriving at the apex URL.

### Smoke and health-check failures

Both automated checks will fail in this configuration:

| Script | Expected | Actual (with Vercel www-canonical) | Result |
|---|---|---|---|
| `domain:check` | `APEX_OK` (apex serves content or apex-initiated redirect) | apex returns `30x` pointing to www → classified as `UNKNOWN_FAILURE` | Exit 2 |
| `domain:check` | `WWW_REDIRECT_OK` (www redirects to apex) | www serves content (it is now the canonical) → not a redirect → `UNKNOWN_FAILURE` | Exit 2 |
| `smoke:prod` | apex returns `200` for `/` and `/dashboard` | apex returns `30x` (redirect to www) — `get()` with `followRedirects: true` may eventually land on www, but `res.url` will differ from `BASE` | Potential false pass or fail depending on final resolved URL |
| `smoke:www` | www issues a `30x` to apex | www serves content directly | `fail('www returns a 30x redirect')` — Exit 1 |

### SEO / canonicalization split

Search engines will index whichever URL they receive content on. With two
active canonical rules pointing in opposite directions, crawlers will either
loop, receive inconsistent signals, or index both `constructaiq.trade` and
`www.constructaiq.trade` as separate entities — causing duplicate-content
penalties.

---

## Confirmed Decision: Apex Canonical

**Canonical URL:** `https://constructaiq.trade` (no `www`)

**Reasoning:**

1. The application code, all scripts, all operator docs, and the launch
   checklist are already written for apex canonical. Keeping it avoids touching
   any code.
2. Apex-only URLs are standard for modern web products and are simpler to
   type, share, and embed.
3. The `next.config.ts` redirect is already correct and deployed — it just
   needs Vercel's domain configuration to stop overriding it.
4. HTTP Strict Transport Security (`max-age=63072000; includeSubDomains; preload`)
   is already set; apex canonical does not conflict with it.

**No product code changes are required.** The fix is a Vercel UI change only.

---

## Required Vercel UI Action (Operator)

To align Vercel with the repo:

1. Open **Vercel → ConstructAIQ project → Settings → Domains**.
2. Find the entry for `constructaiq.trade`.
3. If Vercel shows a "Redirect to www" option enabled, **disable it**.
4. Confirm `constructaiq.trade` is listed as the **primary / production domain**
   (green checkmark, no redirect indicator).
5. Confirm `www.constructaiq.trade` is listed as a secondary domain with no
   Vercel-level redirect rule attached to it. The application-layer redirect in
   `next.config.ts` handles www → apex on its own.
6. After saving, run:

   ```bash
   npm run domain:check
   # Expected: APEX_OK + WWW_REDIRECT_OK, exit 0

   npm run smoke:www
   # Expected: all checks passed, exit 0
   ```

---

## If Product Owner Wants www Canonical Instead

If the decision is made to use `www.constructaiq.trade` as the canonical URL,
the following changes are required before enabling the Vercel www-canonical
setting:

- `next.config.ts` — invert the redirect: apex → www, remove the www → apex rule.
- `scripts/check-domain-status.mjs` — update `classifyApex()` and
  `classifyWww()` logic and exit-code conditions.
- `scripts/smoke-prod.mjs` — update `checkWwwRedirect()` and all BASE URL
  assertions.
- `docs/VERCEL_DOMAIN_FIX.md` — update all expected `curl` outputs.
- `docs/LAUNCH_NOW.md` — update pass criteria.
- `src/app/api/*` — update `ORIGIN` constant and CORS headers in
  `next.config.ts` (currently set to `https://constructaiq.trade`).

This is a non-trivial cross-cutting change. **Do not make it without explicit
product owner sign-off.**

---

## Decision Log

| Date | Author | Decision |
|---|---|---|
| 2026-04-25 | Claude Code (Phase 13 — doc pass 1) | Mismatch documented. No code changed. Awaiting product owner confirmation. |
| 2026-04-25 | Product owner (Phase 13 — doc pass 2) | **DECIDED: apex canonical.** Use `constructaiq.trade`. Do not configure Vercel apex → www redirect. App-layer `next.config.ts` handles `www → apex`. No code changes required. |
