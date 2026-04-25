---
name: Post-launch check
about: Run after every production deploy or on-call escalation. Work top-to-bottom — do not skip ahead.
title: "Post-launch check — YYYY-MM-DD deploy"
labels: ops
assignees: ""
---

> Reference docs:
> - [docs/POST_LAUNCH_WATCH.md](../docs/POST_LAUNCH_WATCH.md) — full 24-hour watch guide
> - [docs/RELEASE_CANDIDATE_REPORT.md](../docs/RELEASE_CANDIDATE_REPORT.md) — launch sign-off and rollback SHA

---

## 1. Smoke tests

Run both from a machine with outbound network access.

```bash
npm run smoke:prod
npm run smoke:www
```

- [ ] `npm run smoke:prod` exits 0 — output ends `✓ All checks passed`
- [ ] `npm run smoke:www` exits 0 — output ends `✓ All checks passed`

**If either fails → stop and assess rollback. Do not continue.**

<details>
<summary>smoke:prod output</summary>

```
paste here
```

</details>

<details>
<summary>smoke:www output</summary>

```
paste here
```

</details>

---

## 2. Env status

```bash
curl -s https://constructaiq.trade/api/status | jq .env
```

Expected:

```json
{
  "supabaseConfigured":   true,
  "anthropicConfigured":  true,
  "upstashConfigured":    true,
  "sentryConfigured":     true,
  "cronSecretConfigured": true
}
```

- [ ] `supabaseConfigured: true`
- [ ] `cronSecretConfigured: true`
- [ ] `anthropicConfigured: true`
- [ ] `upstashConfigured: true`
- [ ] `sentryConfigured: true`

```bash
curl -s https://constructaiq.trade/api/status | jq .runtime
```

- [ ] `siteLocked: false`
- [ ] `nodeEnv: "production"`

<details>
<summary>.env output</summary>

```json
paste here
```

</details>

---

## 3. Data-source status

```bash
curl -s https://constructaiq.trade/api/status | jq .data
```

Expected:

```json
{
  "federalSource":     "usaspending.gov",
  "weeklyBriefSource": "ai"
}
```

- [ ] `federalSource: "usaspending.gov"` (not `"static-fallback"`)
- [ ] `weeklyBriefSource: "ai"` (not `"static-fallback"`)

```bash
curl -s https://constructaiq.trade/api/federal \
  | jq '{dataSource, contractors: (.contractors|length), agencies: (.agencies|length)}'
```

- [ ] `dataSource: "usaspending.gov"`
- [ ] `contractors` count > 0
- [ ] `agencies` count > 0

```bash
curl -s https://constructaiq.trade/api/weekly-brief \
  | jq '{source, live, configured}'
```

- [ ] `source: "ai"`
- [ ] `live: true`
- [ ] `configured: true`

```bash
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data.dashboardShapeOk
```

- [ ] `dashboardShapeOk: true`

```bash
curl -s https://constructaiq.trade/api/status \
  | jq '[.freshness[] | select(.status=="stale")] | length'
```

- [ ] Stale series count is `0` (or document why each is intentionally stale below)

<details>
<summary>Data-source output</summary>

```
paste here
```

</details>

---

## 4. Vercel / Sentry logs

- [ ] Vercel → ConstructAIQ → Deployments → latest Production → Logs (Functions tab) — no unexpected `ERROR` lines from `[dashboard]`, `[status]`, `[forecast]`, or `[cshi]` scopes
- [ ] Sentry (if configured) — no unexpected `api_scope` events in the last hour; a single `[weeklyBrief]` event is acceptable if `ANTHROPIC_API_KEY` was recently changed

Notes:

<!-- paste any relevant log lines here -->

---

## 5. Cron status

Check **Vercel → ConstructAIQ → Settings → Crons**. Both jobs must show **Success** on their last run.

| Cron | Route | Last run | Status |
|------|-------|----------|--------|
| Harvest | `/api/cron/harvest` | | |
| Forecast | `/api/cron/forecast` | | |

- [ ] Harvest cron last run: **Success**
- [ ] Forecast cron last run: **Success**

If a cron failed, trigger manually:

```bash
# Replace $CRON_SECRET with the value set in Vercel env vars
curl -X POST https://constructaiq.trade/api/cron/harvest \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST https://constructaiq.trade/api/cron/forecast \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 6. Rollback needed?

- [ ] No — all checks above passed
- [ ] Yes — initiating rollback (see below)

**Rollback triggers (any one is sufficient to act immediately):**

- `smoke:prod` or `smoke:www` exits non-zero
- `/dashboard` shows a global error boundary
- `/api/dashboard` returns invalid shape (cshi type is `"string"`, signals missing)
- `/api/status` returns non-200
- Sentry burst: >10 new issues in any 5-minute window from a stable scope

**Rollback steps:**

1. Vercel → ConstructAIQ → Deployments → find last **Ready** build before regression
2. Click `…` → **Promote to Production** (or `vercel rollback <id> --prod`)
3. Wait ~30 s for promotion to reach **Ready**
4. `curl -sSo /dev/null -w "%{http_code}" https://constructaiq.trade/` → must return `200`
5. `npm run smoke:prod` → must exit 0
6. Record regressing SHA and promoted SHA in a comment on this issue

Last known-good code SHA: **`b392c37`** — see [Release Candidate Report § Rollback Procedure](../docs/RELEASE_CANDIDATE_REPORT.md#rollback-procedure).

---

## 7. Notes

<!-- Anything unusual observed, decisions made, optional items intentionally deferred -->
