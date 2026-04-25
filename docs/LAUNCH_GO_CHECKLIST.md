# Launch GO Checklist

**Status: PENDING — one item outstanding (CRON_SECRET)**  
**Last updated: 2026-04-25 (Phase 23)**

---

## Required gates

- [x] **Build** — Production deployment live · HTTP/2 200 · smoke:prod 14/14
- [x] **Lint** — exit 0 in CI
- [x] **Tests** — 356/356 in CI
- [x] **domain:check exits 0** — APEX_OK · WWW_REDIRECT_OK
- [x] **smoke:www exits 0** — 3/3 passed
- [x] **smoke:prod exits 0** — 14/14 passed
- [x] **supabaseConfigured true** — confirmed /api/status
- [ ] **cronSecretConfigured true** — currently false · **ADD CRON_SECRET TO VERCEL**
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

## After CRON_SECRET is confirmed true

- [ ] Declare Public launch **GO** in `docs/LAUNCH_NOW.md`
- [ ] Proceed to `docs/POST_LAUNCH_WATCH.md` for first-24-hour monitoring
- [ ] Trigger first data harvest manually: `curl -X POST https://constructaiq.trade/api/cron/harvest -H "Authorization: Bearer $CRON_SECRET"`
- [ ] Verify freshness changes from `stale` in /api/status after harvest
