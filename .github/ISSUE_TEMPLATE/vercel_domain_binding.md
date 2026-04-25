---
name: Vercel domain binding (launch blocker)
about: One-time checklist to bind constructaiq.trade in Vercel and verify launch readiness.
title: "Launch blocker — bind constructaiq.trade domains in Vercel"
labels: ops, launch-blocker
assignees: ""
---

> Reference docs:
> - [docs/VERCEL_DOMAIN_FIX.md](../docs/VERCEL_DOMAIN_FIX.md) — step-by-step binding walkthrough
> - [docs/LAUNCH_NOW.md](../docs/LAUNCH_NOW.md) — launch authority and verdict
> - [docs/CLAUDE_POST_BINDING_PROMPT.md](../docs/CLAUDE_POST_BINDING_PROMPT.md) — AI-assisted post-binding verification prompt

**The codebase is launch-ready. No further app changes are needed before completing this checklist.**

---

## 1. Bind domains in Vercel

In the Vercel dashboard: **ConstructAIQ project → Settings → Domains**

- [ ] Add `constructaiq.trade` → confirm
- [ ] Add `www.constructaiq.trade` → confirm
- [ ] Both entries show a green checkmark (SSL provisioned — allow up to 10 minutes)

---

## 2. Verify domains

Run from a machine with outbound network access.

```bash
npm run domain:check
```

Expected: exits 0, classification `APEX_OK` + `WWW_REDIRECT_OK`.

- [ ] `npm run domain:check` exits 0

<details>
<summary>domain:check output</summary>

```
paste here
```

</details>

---

## 3. Smoke tests

```bash
npm run smoke:www
npm run smoke:prod
```

- [ ] `npm run smoke:www` exits 0 — output ends `✓ All checks passed`
- [ ] `npm run smoke:prod` exits 0 — output ends `✓ All checks passed`

<details>
<summary>smoke:www output</summary>

```
paste here
```

</details>

<details>
<summary>smoke:prod output</summary>

```
paste here
```

</details>

---

## 4. Full launch gate

```bash
npm run launch:check -- --include-smoke
```

- [ ] Exits 0 — all gates green

<details>
<summary>launch:check output</summary>

```
paste here
```

</details>

---

## 5. Post-binding AI verification

All four checks above passed? Run the prompt in [docs/CLAUDE_POST_BINDING_PROMPT.md](../docs/CLAUDE_POST_BINDING_PROMPT.md) and paste the summary output below.

- [ ] Post-binding prompt run — no new issues found

<details>
<summary>Post-binding summary</summary>

```
paste here
```

</details>

---

## 6. Close

- [ ] Update verdict in [docs/LAUNCH_NOW.md](../docs/LAUNCH_NOW.md) to **GO**
- [ ] Close this issue
