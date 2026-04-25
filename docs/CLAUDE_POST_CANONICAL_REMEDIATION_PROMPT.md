# Claude Code — Post-Canonical-Remediation Verification Prompt

> **When to use this file:**
> Paste the prompt below into Claude Code immediately after the operator has
> completed the steps in [docs/VERCEL_CANONICAL_REMEDIATION.md](./VERCEL_CANONICAL_REMEDIATION.md):
>
> - `constructaiq.trade` no longer has a Vercel-level redirect to `www`
> - `www.constructaiq.trade` remains connected to the project
> - "Proxy Detected" warning is cleared (or intentionally accepted — see below)
>
> Claude will run every verification command, interpret the output against the
> apex-canonical pass criteria, and update the launch docs with the current state.

---

## Copy-paste prompt

```
Prerequisite: the operator has completed docs/VERCEL_CANONICAL_REMEDIATION.md:
  - constructaiq.trade no longer redirects to www.constructaiq.trade in Vercel
  - www.constructaiq.trade remains connected to the construct-aiq project
  - "Proxy Detected" warning is cleared, or the operator has confirmed that
    a DNS proxy is intentionally in place and accepts the warning

IMPORTANT CONSTRAINTS:
- Do not change product code during this verification. Only update launch
  docs with observed results unless a command failure clearly identifies a
  documentation bug.
- If a required check fails, stop after updating docs with the failing
  evidence. Do not attempt speculative fixes.

Run every command below in order. Capture the exit code and full output.

--- domain health check ---
npm run domain:check

--- domain health check (machine-readable) ---
node scripts/check-domain-status.mjs --json

--- www smoke test ---
npm run smoke:www

--- full production smoke ---
npm run smoke:prod

--- all gates including smoke ---
npm run launch:check -- --include-smoke

After running all commands, evaluate the results:

--- PASS path (domain:check exits 0 AND smoke passes) ---

If npm run domain:check exits 0 with APEX_OK + WWW_REDIRECT_OK, and
npm run smoke:www and npm run smoke:prod both exit 0:

  Continue to the full env/data verification in docs/CLAUDE_POST_BINDING_PROMPT.md.
  Run all remaining commands from that prompt starting at "--- env variables ---".
  Evaluate against its Required for GO criteria.
  Update docs/LAUNCH_NOW.md and docs/RELEASE_CANDIDATE_REPORT.md accordingly.

--- FAIL path A: APEX_REDIRECTS_TO_WWW (domain:check exits 2) ---

If apex classification is APEX_REDIRECTS_TO_WWW:
  - Verdict: NO-GO
  - The Vercel apex-to-www redirect was not fully removed.
  - Next action: Vercel → construct-aiq → Settings → Domains →
    find constructaiq.trade → remove redirect to www. Repeat remediation.
  - Do not continue to smoke tests.
  - Update docs/LAUNCH_NOW.md P0 blocker and docs/RELEASE_CANDIDATE_REPORT.md.

--- FAIL path B: host_not_allowed (domain:check exits 1) ---

If both domains return host_not_allowed (VERCEL_DOMAIN_NOT_BOUND):
  - Verdict: NO-GO
  - Domain binding did not complete or DNS has not propagated.
  - Next action: wait 5 minutes and rerun. If still failing, revisit
    docs/VERCEL_DOMAIN_FIX.md troubleshooting section.
  - Update docs/LAUNCH_NOW.md and docs/RELEASE_CANDIDATE_REPORT.md.

--- FAIL path C: proxyWarning true but smoke passes ---

If proxyWarning is true in the --json output but smoke tests pass:
  - This is a WARNING, not a blocker.
  - Record proxyWarning: true in docs/RELEASE_CANDIDATE_REPORT.md.
  - Note in docs/LAUNCH_NOW.md: "proxy warning present — Vercel recommends
    DNS-only for reliability and certificate renewal."
  - Continue to the PASS path env/data verification above.
  - Do not set verdict to NO-GO solely because of proxyWarning.

--- FAIL path D: proxyWarning true and smoke fails ---

If proxyWarning is true and any smoke test fails:
  - Verdict: NO-GO
  - The DNS proxy is likely interfering with Vercel SSL or request routing.
  - Next action: disable DNS proxy (Cloudflare DNS-only / grey cloud) for
    both constructaiq.trade and www.constructaiq.trade. Re-run domain:check.
  - Update docs/LAUNCH_NOW.md and docs/RELEASE_CANDIDATE_REPORT.md.

--- Doc updates (run regardless of outcome) ---

1. docs/LAUNCH_NOW.md
   - Update the verdict table: flip "domain:check", "smoke:prod", "smoke:www",
     and "Public launch" rows to GO only if all required checks passed.
   - Update the timestamp.
   - If GO: replace the "Next action" section with a link to
     docs/POST_LAUNCH_WATCH.md as the immediate next step.
   - Keep the file short.

2. docs/RELEASE_CANDIDATE_REPORT.md
   - Append a new section: "## Post-Canonical-Remediation Verification — <timestamp>"
   - Record: exit codes for each command, apex/www classifications,
     proxyWarning value, smoke pass/fail counts, and final verdict.

If all required checks pass:
  - Set verdict to GO in docs/LAUNCH_NOW.md.
  - Summarise: "All required gates passed. Proceed to POST_LAUNCH_WATCH.md."

If any required check fails:
  - Keep verdict NO-GO.
  - Summarise: "NO-GO — <gate> failed. <one-sentence diagnosis>."
```

---

## Required checks reference

| # | Command | Pass condition |
|---|---------|----------------|
| 1 | `npm run domain:check` | Exit 0 · `APEX_OK` + `WWW_REDIRECT_OK` |
| 2 | `node scripts/check-domain-status.mjs --json` | `"ok": true` · `"exitCode": 0` |
| 3 | `npm run smoke:www` | Exit 0 |
| 4 | `npm run smoke:prod` | Exit 0 |
| 5 | `npm run launch:check -- --include-smoke` | Exit 0 |

## Decision table

| domain:check exit | apex class | proxyWarning | smoke | Verdict | Next action |
|:-----------------:|-----------|:------------:|-------|---------|-------------|
| 0 | `APEX_OK` | false | pass | **GO** path | Run `CLAUDE_POST_BINDING_PROMPT.md` env/data checks |
| 0 | `APEX_OK` | true | pass | **WARNING** | Record warning; continue to env/data checks |
| 0 | `APEX_OK` | true | fail | **NO-GO** | Disable DNS proxy; re-run |
| 2 | `APEX_REDIRECTS_TO_WWW` | any | any | **NO-GO** | Remove Vercel apex→www redirect |
| 1 | `VERCEL_DOMAIN_NOT_BOUND` | any | any | **NO-GO** | Wait for DNS or fix binding |

## Related docs

| Doc | Purpose |
|-----|---------|
| [VERCEL_CANONICAL_REMEDIATION.md](./VERCEL_CANONICAL_REMEDIATION.md) | Operator steps to reach the prerequisite state for this prompt |
| [CLAUDE_POST_BINDING_PROMPT.md](./CLAUDE_POST_BINDING_PROMPT.md) | Full env/data/runtime verification — run after domain:check exits 0 |
| [CANONICAL_DOMAIN_DECISION.md](./CANONICAL_DOMAIN_DECISION.md) | Why apex canonical; what each script expects |
| [LAUNCH_NOW.md](./LAUNCH_NOW.md) | Current launch verdict and P0 blocker |
| [VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) | Full domain binding walkthrough and troubleshooting |
| [POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring — read after final GO |
