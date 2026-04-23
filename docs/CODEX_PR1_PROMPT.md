# Codex Prompt — PR 1 Documentation and Baseline

Copy and paste the prompt below into Codex.

---

You are working in the `toddbridgeford/ConstructAIQ` repository on the `Predictive-Model` branch.

Your assignment is to implement **PR 1 — Documentation and baseline** from `docs/CODEX_ACTION_PLAN.md`.

## Goal
Create the baseline documentation and QA scaffolding needed before architecture, trust, and UI refactors begin.

This PR must be **low risk**:
- do not change production behavior
- do not refactor app logic
- do not alter routing behavior
- do not modify user-facing copy unless necessary to document current behavior
- do not introduce visual changes

The goal is to document current state and establish guardrails.

## Files to read first
- `docs/CODEX_ACTION_PLAN.md`
- `README.md`
- `package.json`
- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/components/Sidebar.tsx`
- `src/app/dashboard/components/BottomNav.tsx`
- `src/app/layout.tsx`
- `next.config.ts`
- `src/middleware.ts`
- any critical route/layout files under `src/app`

## Deliverables
Create the following files if they do not exist:

### 1. Architecture documentation
Create:
- `docs/architecture/current-state.md`
- `docs/architecture/data-flow.md`
- `docs/architecture/routes-inventory.md`

#### `docs/architecture/current-state.md`
Document the current app architecture clearly and practically:
- app framework and platform model
- current web vs PWA vs iOS status
- rendering model observed in homepage/dashboard
- major dependencies and platform services
- top-level navigation surfaces
- current styling approach
- major risks and debt areas you can confirm from the codebase

Keep this factual and based on the repository.

#### `docs/architecture/data-flow.md`
Map the current data flow for at least:
- homepage
- dashboard
- sidebar and bottom nav where they rely on live data/preferences

Include:
- which route/component fetches which endpoints
- where data is fetched client-side vs server-side
- where freshness is derived
- where fallback values or degraded states appear if currently present
- major trust risks in data presentation

Use bullet lists and short sections. Keep it readable.

#### `docs/architecture/routes-inventory.md`
Inventory routes under `src/app` and classify them into:
- core product
- support/info
- experimental/internal
- candidate for consolidation or review

For each route group, include:
- route path
- purpose
- whether it appears in main navigation
- notes on importance or redundancy

You do not need to be exhaustive down to every nested internal segment, but the top-level product map should be useful to humans.

### 2. QA baseline
Create:
- `docs/qa/smoke-checklist.md`

This should contain manual smoke checks for:
- homepage
- dashboard
- sidebar
- bottom nav on mobile
- newsletter signup states
- install prompt behavior
- API key issuance flow
- key public routes loading
- major no-console-error checks

Format it as a checklist that a human can run before and after major refactors.

### 3. PR engineering standards
Create:
- `docs/engineering/pr-standards.md`

Document:
- what every PR must include
- test expectations
- lint/type expectations
- rules against fake production data
- reviewability expectations
- accessibility expectations
- scope control expectations

This should align with `docs/CODEX_ACTION_PLAN.md` and make Codex work safer.

## Constraints
- Keep the documents specific to this repo
- Do not add generic filler documentation
- Do not claim native iOS app support unless clearly present in the repo
- Be honest where the repo shows a PWA rather than a native iOS app
- Do not create placeholder files with one-paragraph content; make them genuinely useful

## Nice to have
If appropriate, add links between the new docs and `docs/CODEX_ACTION_PLAN.md` so the documentation set feels connected.

## Acceptance criteria
Your work is complete only when:
- all required docs are created
- the docs are grounded in the current codebase
- no production code behavior changes
- the new docs would help a human or Codex execute PR 2 safely

## Output requirements
When finished:
1. summarize exactly what files you created
2. summarize any notable route/architecture findings
3. confirm that no production behavior was changed
4. prepare the branch as a normal reviewable docs-only PR

---

## Optional follow-up prompt for next PR
After this PR is complete, the next Codex task will be **PR 2 — Trust fixes**, focused on:
- removing fabricated fallback values
- replacing fake freshness timestamps
- introducing a shared `DataState` model

Do not start PR 2 in this task.
