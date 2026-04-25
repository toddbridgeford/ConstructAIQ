# Post-Binding Verification — Run Sheet

> Fill this in immediately after Vercel domain binding is complete.
> Commands are copy-paste ready. Paste output directly into each section.

---

## Meta

| Field | Value |
|-------|-------|
| Timestamp | 2026-04-25 20:30 UTC |
| Operator | claude/verify-production-domains-w0Ibi |

---

## 1. Domain check

```bash
npm run domain:check
```

Optional — machine-readable JSON (useful when capturing output in CI):

```bash
node scripts/check-domain-status.mjs --json
```

**Output:**
```
ConstructAIQ — domain status check
══════════════════════════════════════════════════════

  apex  (constructaiq.trade)
  ──────────────────────────────────────────────────
  status       : 403
  x-deny-reason: host_not_allowed
  classification: VERCEL_DOMAIN_NOT_BOUND
  diagnosis    : Vercel domain not bound to this project. Go to Vercel dashboard → ConstructAIQ → Settings → Domains → Add the domain.

  www   (www.constructaiq.trade/dashboard)
  ──────────────────────────────────────────────────
  status       : 403
  x-deny-reason: host_not_allowed
  classification: VERCEL_DOMAIN_NOT_BOUND
  diagnosis    : Vercel domain not bound to this project. Go to Vercel dashboard → ConstructAIQ → Settings → Domains → Add the domain.

══════════════════════════════════════════════════════

  ✗ host_not_allowed — Vercel domain not bound to this project.

Exit code: 1
```

**Result:** APEX_OK + WWW_REDIRECT_OK → **FAIL** (both domains: VERCEL_DOMAIN_NOT_BOUND)

---

## 2. www smoke

```bash
npm run smoke:www
```

**Output:**
```
NOT RUN — domain:check gate failed. Stopped per stop-on-failure policy.
```

**Result:** NOT RUN

---

## 3. Full production smoke

```bash
npm run smoke:prod
```

**Output:**
```
NOT RUN — domain:check gate failed. Stopped per stop-on-failure policy.
```

**Result:** NOT RUN

---

## 4. Env variables (`/api/status .env`)

```bash
curl -s https://constructaiq.trade/api/status | jq .env
```

**Output:**
```json
NOT RUN — domain:check gate failed. Stopped per stop-on-failure policy.
```

Expected all `true`. Required for GO: `supabaseConfigured`, `cronSecretConfigured`.

| Key | Value | Required |
|-----|-------|----------|
| `supabaseConfigured` | NOT RUN | P0 |
| `cronSecretConfigured` | NOT RUN | P0 |
| `anthropicConfigured` | NOT RUN | Warning |
| `upstashConfigured` | NOT RUN | Warning |
| `sentryConfigured` | NOT RUN | Warning |

---

## 5. Runtime data (`/api/status .data`)

```bash
curl -s https://constructaiq.trade/api/status | jq .data
```

**Output:**
```json
NOT RUN — domain:check gate failed. Stopped per stop-on-failure policy.
```

---

## 6. Federal data source

```bash
curl -s https://constructaiq.trade/api/federal | jq '{dataSource, contractors: (.contractors|length), agencies: (.agencies|length)}'
```

**Output:**
```json
NOT RUN — domain:check gate failed. Stopped per stop-on-failure policy.
```

`dataSource: "live"` = GO · `dataSource: "static"` = Warning (not a blocker).

---

## 7. Weekly brief source

```bash
curl -s https://constructaiq.trade/api/weekly-brief | jq '{source, live, configured}'
```

**Output:**
```json
NOT RUN — domain:check gate failed. Stopped per stop-on-failure policy.
```

`live: true` = GO · `live: false` = Warning (not a blocker).

---

## 8. Dashboard shape

```bash
curl -s https://constructaiq.trade/api/dashboard | jq '{fetched_at, cshi: (.cshi|type), signals: (.signals|length), commodities: (.commodities|length), forecast: (.forecast|type)}'
```

**Output:**
```json
NOT RUN — domain:check gate failed. Stopped per stop-on-failure policy.
```

`cshi` must not be `"string"`. `signals` and `commodities` must be > 0. `forecast` must be `"object"`.

---

## Final verdict

| Check | Result |
|-------|--------|
| Domain check | **FAIL** — 403 host_not_allowed · VERCEL_DOMAIN_NOT_BOUND on both domains |
| smoke:www | NOT RUN |
| smoke:prod | NOT RUN |
| `supabaseConfigured` | NOT RUN |
| `cronSecretConfigured` | NOT RUN |
| Dashboard shape | NOT RUN |

**Overall: NO-GO**

---

## Remaining blockers

- **P0 — Vercel domain binding incomplete.** Both `constructaiq.trade` and `www.constructaiq.trade` return `HTTP 403 · x-deny-reason: host_not_allowed`. The Vercel project still does not recognise these domains.  
  **Fix:** Vercel UI → ConstructAIQ project → Settings → Domains → confirm both entries show a green checkmark and valid SSL certificate. Then re-run `npm run domain:check` (must exit 0 with APEX_OK + WWW_REDIRECT_OK) before proceeding with any further gate checks.
