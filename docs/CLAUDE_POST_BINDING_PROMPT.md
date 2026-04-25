# Claude Code — Post-Binding Verification Prompt

> **When to use this file:**
> Paste the prompt below into Claude Code immediately after the operator has
> completed Vercel domain binding (both `constructaiq.trade` and
> `www.constructaiq.trade` show a green checkmark in Vercel → Settings → Domains).
>
> Claude will run every verification command, interpret the output, and update
> the launch docs to reflect the current GO / NO-GO state.

---

## Copy-paste prompt

```
Prerequisite: the operator has added constructaiq.trade and
www.constructaiq.trade to the ConstructAIQ Vercel project under
Settings → Domains, and both rows show a green checkmark.

Run every command below in order. Capture the exit code and relevant output
for each one.

--- domain check ---
npm run domain:check

--- www smoke ---
npm run smoke:www

--- full production smoke ---
npm run smoke:prod

--- all gates including smoke ---
npm run launch:check -- --include-smoke

--- env variables ---
curl -s https://constructaiq.trade/api/status | jq .env

--- runtime config ---
curl -s https://constructaiq.trade/api/status | jq .runtime

--- data freshness ---
curl -s https://constructaiq.trade/api/status | jq .data

--- deep data check ---
curl -s 'https://constructaiq.trade/api/status?deep=1' | jq .data

--- federal pipeline ---
curl -s https://constructaiq.trade/api/federal | jq '{dataSource, contractors: (.contractors|length), agencies: (.agencies|length)}'

--- weekly brief ---
curl -s https://constructaiq.trade/api/weekly-brief | jq '{source, live, configured}'

--- dashboard shape ---
curl -s https://constructaiq.trade/api/dashboard | jq '{fetched_at, cshi: (.cshi|type), signals: (.signals|length), commodities: (.commodities|length), forecast: (.forecast|type)}'

After running all commands, evaluate the results against these criteria:

Required for GO (all must pass):
  1. npm run domain:check        → exit 0, classifications APEX_OK + WWW_REDIRECT_OK
  2. npm run smoke:www           → exit 0
  3. npm run smoke:prod          → exit 0
  4. npm run launch:check -- --include-smoke  → exit 0
  5. /api/status .env            → supabaseConfigured: true, cronSecretConfigured: true
  6. /api/status .data           → at least one data source shows observations present

Warnings (not blockers):
  - anthropicConfigured: false   → weekly brief will serve static content
  - upstashConfigured: false     → rate limiting disabled
  - sentryConfigured: false      → error monitoring disabled
  - federal dataSource: "static" → federal pipeline serving mock data
  - weekly-brief live: false     → expected if anthropicConfigured is false

Then update the following docs to reflect the actual results:

1. docs/LAUNCH_NOW.md
   - Update the verdict table: flip "Smoke" and "Public launch" rows to GO if
     all required checks passed, or keep NO-GO with the specific failing gate.
   - Update the timestamp at the top of the file.
   - If GO: add a line after the verify section pointing to
     docs/POST_LAUNCH_WATCH.md as the next step.
   - Keep the file short — do not add command output or long explanations.

2. docs/RELEASE_CANDIDATE_REPORT.md
   - Append a new section titled "## Post-Binding Verification — <timestamp>"
   - Record: timestamp, operator, exit codes for each required command, final
     verdict (GO / NO-GO), and any failing gates if NO-GO.
   - Do not modify the existing RC code SHA block or previous sections.

3. docs/POST_BINDING_VERIFICATION_TEMPLATE.md (or a new timestamped copy)
   - If creating a new copy, name it
     docs/POST_BINDING_VERIFICATION_<YYYYMMDD>.md
   - Fill in every output block with the actual command output captured above.
   - Fill in the Meta table with the current timestamp and operator name.
   - Mark each Result line GO or FAIL based on actual output.
   - Fill in the Final verdict table and Overall line.

If all required checks pass:
  - Set the launch verdict to GO in docs/LAUNCH_NOW.md.
  - Link docs/POST_LAUNCH_WATCH.md as the immediate next step.
  - Summarise: "All required gates passed. Proceed to POST_LAUNCH_WATCH.md."

If any required check fails:
  - Keep the verdict NO-GO in docs/LAUNCH_NOW.md.
  - List the exact failing gate and its exit code or error output.
  - Do not update any verdict to GO.
  - Summarise: "NO-GO — <gate name> failed. <one-sentence diagnosis>."
```

---

## Required checks reference

| # | Command | Pass condition |
|---|---------|----------------|
| 1 | `npm run domain:check` | Exit 0 · `APEX_OK` + `WWW_REDIRECT_OK` |
| 2 | `npm run smoke:www` | Exit 0 |
| 3 | `npm run smoke:prod` | Exit 0 |
| 4 | `npm run launch:check -- --include-smoke` | Exit 0 |
| 5 | `/api/status .env` | `supabaseConfigured: true` · `cronSecretConfigured: true` |
| 6 | `/api/status .data` | At least one data source present |

## Docs to update

| File | What to change |
|------|----------------|
| `docs/LAUNCH_NOW.md` | Verdict table + timestamp; link `POST_LAUNCH_WATCH.md` if GO |
| `docs/RELEASE_CANDIDATE_REPORT.md` | Append post-binding verification section |
| `docs/POST_BINDING_VERIFICATION_TEMPLATE.md` | Fill output blocks, or create timestamped copy |

## Related docs

| Doc | Purpose |
|-----|---------|
| [VERCEL_DOMAIN_FIX.md](./VERCEL_DOMAIN_FIX.md) | Step-by-step domain binding walkthrough |
| [POST_BINDING_VERIFICATION_TEMPLATE.md](./POST_BINDING_VERIFICATION_TEMPLATE.md) | Run-sheet template (fill in after each binding attempt) |
| [POST_LAUNCH_WATCH.md](./POST_LAUNCH_WATCH.md) | First-24-hour monitoring checklist — read this after GO |
| [OPERATOR_HANDOFF.md](./OPERATOR_HANDOFF.md) | Env-var check, rollback SHA, full action list |
| [RELEASE_CANDIDATE_REPORT.md](./RELEASE_CANDIDATE_REPORT.md) | Full sign-off history and SHA glossary |
