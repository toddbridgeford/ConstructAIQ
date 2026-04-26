# Launch GO Checklist

**Status: GO — all required gates passed**  
**Last updated: 2026-04-25 (Phase 23 final) · constructaiq.trade is live**

---

## Required gates

- [x] **Build** — Production deployment live · HTTP/2 200 · smoke:prod 14/14
- [x] **Lint** — exit 0 in CI
- [x] **Tests** — 356/356 in CI
- [x] **domain:check exits 0** — APEX_OK · WWW_REDIRECT_OK
- [x] **smoke:www exits 0** — 3/3 passed
- [x] **smoke:prod exits 0** — 14/14 passed
- [x] **supabaseConfigured true** — confirmed /api/status
- [x] **cronSecretConfigured true** — confirmed 2026-04-25 after adding to Vercel Production
- [x] **runtime.siteLocked false** — confirmed
- [x] **dashboard shape valid** — smoke:prod verified all required keys

## Warnings (non-blocking)

- [ ] upstashConfigured — false · rate limiting inactive
- [ ] sentryConfigured — false · error monitoring inactive
- [ ] federalSource "live" — currently "unknown" · static fallback active
- [ ] Codespace build — web-push not installed locally · run `npm install` to fix

## One remaining action

**Add `CRON_SECRET` to Vercel Production:**

1. Go to Vercel → ConstructAIQ project → Settings → Environment Variables
2. Add `CRON_SECRET` = `<any strong random string>`  
   Generate one: `openssl rand -hex 32`
3. Set environment: **Production** (add Preview too if desired)
4. Vercel will prompt to redeploy — accept, or wait for next natural deploy
5. After deploy, confirm: `curl -s https://constructaiq.trade/api/status | jq .env.cronSecretConfigured`  
   Must return `true`

## Post-launch actions

- [x] Declared Public launch **GO** in `docs/LAUNCH_NOW.md`
- [ ] Proceed to `docs/POST_LAUNCH_WATCH.md` for first-24-hour monitoring
- [ ] Trigger first data harvest: `curl -X POST https://constructaiq.trade/api/cron/harvest -H "Authorization: Bearer $CRON_SECRET"`
- [ ] Verify freshness changes from `stale` after harvest runs
