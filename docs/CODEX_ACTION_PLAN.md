# ConstructAIQ Codex Action Plan

This document is the execution plan for Codex to upgrade ConstructAIQ from an ambitious PWA/web product into a disciplined, professional-grade market intelligence application.

## Product truth

ConstructAIQ is currently:
- a Next.js 15 web application
- a PWA with installability and offline/runtime caching
- not yet a true native iOS app

The goal of this plan is to:
1. improve trust, correctness, and maintainability
2. reduce architectural debt
3. tighten UI/UX to professional product standards
4. prepare the codebase for either a best-in-class PWA path or a future native iOS client

---

# Non-negotiables

Codex must preserve these standards in every PR:
- No fake or synthetic production fallback values shown as real data
- No AI slop: no generic rewrites, vague cleanup, or visual churn without measurable improvement
- Preserve existing product direction and tone
- Prefer small, reviewable PRs over giant rewrites
- Add tests for every critical behavior change
- Keep pages usable on desktop and mobile throughout the migration
- Maintain source provenance and methodology credibility

---

# Master priorities

Priority order:
1. Eliminate misleading data fallbacks
2. Reduce client-side fetch sprawl on homepage and dashboard
3. Introduce strict typed API contracts and runtime validation
4. Extract a durable design system and component architecture
5. Expand test coverage across core flows
6. Tighten accessibility, trust UX, and navigation
7. Clarify PWA vs native iOS product boundary

---

# Phase 0 — Baseline and guardrails

## Objective
Establish current behavior, freeze risk, and prevent regressions before deeper refactors.

## Tasks

### 0.1 Create architecture notes
Create:
- `docs/architecture/current-state.md`
- `docs/architecture/data-flow.md`
- `docs/architecture/routes-inventory.md`

Document:
- top-level routes
- critical API routes used by homepage and dashboard
- data dependencies per route
- client vs server boundaries
- current mobile navigation behavior

### 0.2 Establish route inventory
Audit and classify routes under `src/app` into:
- core product
- support/info
- experimental/internal
- candidates for removal or consolidation

Expected likely core routes:
- `/`
- `/dashboard`
- `/federal`
- `/permits`
- `/projects`
- `/materials`
- `/calendar`
- `/ask`
- `/portfolio`
- `/methodology`
- `/subscribe`
- `/trust`

### 0.3 Add baseline QA checklist
Create `docs/qa/smoke-checklist.md` with manual checks for:
- homepage loads with real data or explicit unavailable states
- dashboard loads without console errors
- mobile bottom nav works
- sidebar works across breakpoints
- newsletter signup states work
- install prompt behavior is non-blocking
- API key issuance still works

### 0.4 Add CI expectations document
Create `docs/engineering/pr-standards.md` with:
- required tests per PR
- lint requirements
- accessibility expectations
- no-fake-data rule

## Acceptance criteria
- route inventory exists
- baseline QA checklist exists
- current-state architecture docs exist
- no user-facing behavior changed yet

---

# Phase 1 — Remove misleading and synthetic data behavior

## Objective
Protect product trust by eliminating fake values and cosmetic freshness.

## Primary files to audit first
- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/components/Sidebar.tsx`
- any section/component with hardcoded metric defaults

## Tasks

### 1.1 Remove synthetic metric fallbacks from dashboard
In `src/app/dashboard/page.tsx`, remove hardcoded defaults such as sample values and synthetic arrays used when API data is missing.

Replace with explicit state models:
- `loading`
- `available`
- `stale`
- `unavailable`
- `error`

Do not silently substitute plausible metrics.

### 1.2 Remove homepage fake metric fallback behavior
In `src/app/page.tsx`, ensure the homepage never implies real metric availability unless the data is present.

Allowed:
- skeleton state
- unavailable state
- last successful cached snapshot clearly labeled

Not allowed:
- fake KPI numbers
- generated trends presented as factual

### 1.3 Replace fake freshness timestamps
In `src/app/components/Sidebar.tsx`, stop using client-local current time as "last updated" or "data as of" for market data.

Instead:
- wire actual freshness metadata from backend responses
- or show `Freshness unavailable`
- distinguish `UI loaded` from `Data updated`

### 1.4 Add a standard `DataState` model
Create:
- `src/lib/data-state.ts`

Define a common UI contract for:
- loading
- stale
- unavailable
- error
- ready

Use it in homepage/dashboard first.

## Acceptance criteria
- no fabricated values remain in homepage or dashboard
- timestamps reflect actual data freshness or explicitly say unavailable
- no metric card can display a made-up number in production

---

# Phase 2 — Introduce typed API contracts and runtime validation

## Objective
Replace `any`-driven UI/data plumbing with stable contracts.

## Primary files to target
- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- homepage/dashboard section components
- API routes consumed by those pages
- `src/types/*`
- `src/lib/*`

## Tasks

### 2.1 Create response types for critical endpoints
Create typed contracts for at least:
- `/api/census`
- `/api/bls`
- `/api/federal`
- `/api/map`
- `/api/platform-stats`
- `/api/cshi`
- `/api/forecast`
- `/api/pricewatch`
- `/api/signals`
- `/api/weekly-brief`
- `/api/warn`
- `/api/obs`
- `/api/calendar`

Suggested location:
- `src/types/api.ts`
- or feature-scoped type files under `src/features/*`

### 2.2 Add runtime validation
Introduce `zod` or an equivalent schema validator.

Create parsers for critical dashboard/homepage payloads.
If an API payload fails validation:
- log the issue
- surface an explicit degraded state
- do not render invalid data as normal

### 2.3 Remove `AnyData` and `AnyStats`
Replace broad `any` usage in:
- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`

with narrow, typed interfaces.

### 2.4 Tighten lint rules gradually
Update ESLint policy in staged fashion:
- phase 1: ban new `any`
- phase 2: reduce existing `any`
- phase 3: elevate critical folders to error

Do not break unrelated legacy code in the first PR.

## Acceptance criteria
- homepage and dashboard no longer rely on broad `any`
- critical API payloads are validated at runtime
- invalid payloads degrade honestly

---

# Phase 3 — Reduce client fetch sprawl and fix rendering boundaries

## Objective
Move high-value pages toward server-first composition and reduce on-load browser dependency.

## Primary files
- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- relevant section components
- shared fetch utilities

## Tasks

### 3.1 Refactor homepage into server-led composition
Target outcome:
- server component page shell
- client-only islands for interactive map or dynamic visualizations
- fewer client-side loading states on first paint

Potential split:
- `src/app/page.tsx` as server component
- `src/app/home/HomePageClient.tsx` only if needed
- `src/app/home/*` for sections

### 3.2 Introduce dashboard view-model aggregation
Replace many client fetches with a smaller number of composed payloads.

Preferred pattern:
- one server-side dashboard loader or a small set of feature aggregators
- one typed view model per section

Possible new files:
- `src/features/dashboard/get-dashboard-view-model.ts`
- `src/features/home/get-home-view-model.ts`

### 3.3 Standardize safe fetch behavior
Create shared fetch utilities that:
- validate responses
- annotate freshness
- return a common error envelope
- support server and client use consistently

### 3.4 Improve caching policy intentionally
Review which surfaces should be:
- dynamic
- revalidated
- cached aggressively
- PWA-cached only

Align runtime/data freshness with business expectations.

## Acceptance criteria
- homepage no longer depends on multiple client fetches for core first view
- dashboard client fetch count is materially reduced
- loading behavior is simpler and more trustworthy

---

# Phase 4 — Extract a real design system

## Objective
Stop style drift and reduce inline-style sprawl.

## Primary files
- `src/lib/theme.ts`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/components/*`
- `src/app/dashboard/components/*`
- `src/app/dashboard/sections/*`

## Tasks

### 4.1 Formalize tokens
Keep and refine tokens for:
- color
- typography
- spacing
- radius
- shadow
- layout

Make token naming systematic and durable.

### 4.2 Create primitive components
Build reusable primitives for:
- `Button`
- `Card`
- `SectionHeader`
- `MetricCard`
- `Badge`
- `EmptyState`
- `ErrorState`
- `Skeleton`
- `Surface`
- `Stack` / layout helpers if appropriate

Suggested location:
- `src/components/ui/*`

### 4.3 Extract page sections from giant page files
Break large pages into focused sections.

Homepage target structure:
- `src/app/home/Hero.tsx`
- `src/app/home/TrustSection.tsx`
- `src/app/home/StatusCards.tsx`
- `src/app/home/Newsletter.tsx`
- `src/app/home/MapSection.tsx`
- `src/app/home/Footer.tsx`

Dashboard target structure should continue the same discipline for sections/components.

### 4.4 Reduce global CSS blast radius
Move page-specific and component-specific rules out of `globals.css` where possible.
Keep globals limited to:
- reset/base
- fonts
- truly global tokens/utilities

### 4.5 Standardize interaction states
All primitives need consistent:
- hover
- active
- focus-visible
- disabled
- loading

## Acceptance criteria
- homepage and dashboard no longer carry large ad hoc style blobs
- shared visual primitives exist and are reused
- globals.css is materially smaller and more focused

---

# Phase 5 — Accessibility and trust UX hardening

## Objective
Make the product credible, usable, and compliant enough for a professional audience.

## Primary files
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/dashboard/*`
- nav components
- modal/prompt components

## Tasks

### 5.1 Remove zoom restrictions
In `src/app/layout.tsx`, remove:
- `maximumScale: 1`
- `userScalable: false`

This is an accessibility blocker.

### 5.2 Add visible focus states
Audit all interactive elements:
- nav links
- buttons
- form fields
- cards acting as controls
- bottom nav items
- sidebar items

Ensure keyboard users can navigate confidently.

### 5.3 Audit color contrast and text hierarchy
Validate contrast for:
- muted text on dark backgrounds
- amber badges
- disabled states
- small mono labels

### 5.4 Improve empty/error/degraded states
Every primary surface should handle:
- no data
- stale data
- failed fetch
- partial data

These states should feel designed, not accidental.

### 5.5 Clarify metric provenance
For major cards and forecasts, surface:
- source
- updated time
- observed vs modeled
- confidence where applicable

## Acceptance criteria
- zoom is allowed
- focus states are consistent
- degraded states are designed and explicit
- provenance is closer to the metric, not buried elsewhere

---

# Phase 6 — Navigation and information architecture cleanup

## Objective
Make the app feel like a coherent product, not a collection of routes.

## Primary files
- `src/app/components/Sidebar.tsx`
- `src/app/dashboard/components/BottomNav.tsx`
- route layouts and top-level pages

## Tasks

### 6.1 Define a stable primary navigation model
Do not let primary mobile navigation shift too much based on hidden preference state.

Review and simplify:
- sidebar primary destinations
- bottom nav tab set
- dashboard internal section switching

### 6.2 Reduce route noise
Using the route inventory from Phase 0, mark:
- core routes that deserve first-class navigation
- secondary routes that should be discoverable but not primary
- experimental routes to hide or remove

### 6.3 Make dashboard feel like one operating surface
Ensure sections answer clear user questions:
- What is the market doing?
- What changed?
- Why?
- What do I do next?

### 6.4 Improve mobile UX consistency
Review:
- bottom nav labels and affordances
- scroll-to-section behavior
- modal stacking
- fixed-position overlays like install prompts

## Acceptance criteria
- primary nav is simpler and more stable
- dashboard feels coherent across desktop and mobile
- secondary/experimental routes are demoted or removed from main paths

---

# Phase 7 — Testing and CI expansion

## Objective
Protect the product with meaningful automated coverage.

## Tasks

### 7.1 Expand unit/integration coverage
Prioritize tests for:
- typed data parsing
- dashboard/homepage view-model transformations
- freshness/provenance logic
- API key issuance and validation
- preferences and nav behavior

### 7.2 Add component tests
Cover critical components such as:
- metric cards
- empty/error states
- sidebar
- bottom nav
- install prompt
- role prompt

### 7.3 Add Playwright smoke tests
Minimum flows:
- homepage renders
- dashboard renders
- sidebar navigation works on desktop
- bottom nav works on mobile viewport
- newsletter signup happy path/error state
- API access page loads

### 7.4 Add regression protections
Require CI checks for:
- lint
- typecheck
- unit tests
- Playwright smoke suite

## Acceptance criteria
- critical route smoke tests exist
- view-model logic has coverage
- CI meaningfully blocks regressions

---

# Phase 8 — Security and platform hardening

## Objective
Tighten execution without disrupting product momentum.

## Primary files
- `next.config.ts`
- `src/middleware.ts`
- API routes handling auth or issuance
- environment docs

## Tasks

### 8.1 Revisit CSP policy
Review whether `unsafe-inline` and especially `unsafe-eval` are still required.
Reduce policy looseness where possible.

### 8.2 Audit API route auth assumptions
Review:
- public routes
- key issuance flow
- cron protection
- rate limiting
- edge/runtime assumptions

### 8.3 Clean example environment values
Keep `.env.example` helpful, but ensure sample secrets and credentials are clearly non-real and non-reusable.

### 8.4 Add security checklist
Create `docs/security/checklist.md` covering:
- secrets handling
- env naming
- auth expectations
- rate limiting expectations
- cron route protections
- CSP review process

## Acceptance criteria
- CSP is tighter or explicitly documented
- auth-sensitive flows are reviewed
- environment examples are safer

---

# Phase 9 — PWA vs native iOS decision boundary

## Objective
Stop conflating installable web behavior with a true iOS product.

## Tasks

### 9.1 Decide product truth in docs and marketing
Choose one of two paths:

#### Path A — Best-in-class PWA
Position clearly as:
- web app
- installable on iPhone/iPad
- offline-friendly PWA

Do not imply native iOS app parity.

#### Path B — Native iOS app
Create a separate plan for:
- SwiftUI or React Native/Expo native client
- native navigation model
- push notifications
- offline data sync
- native charts and widgets
- deep linking and app lifecycle

### 9.2 Update install prompt language
If staying PWA-first, the install UX should be accurate, helpful, and non-salesy.

## Acceptance criteria
- product language becomes honest and consistent
- PWA and native paths are no longer blurred

---

# Recommended PR sequence for Codex

## PR 1 — Documentation and baseline
- add architecture docs
- add route inventory
- add QA checklist
- add PR standards

## PR 2 — Trust fixes
- remove fake fallback values from homepage/dashboard
- replace fake freshness timestamps
- introduce `DataState`

## PR 3 — Typed contracts
- add typed responses for homepage/dashboard APIs
- add runtime validation
- eliminate broad `any` from homepage/dashboard

## PR 4 — Homepage refactor
- split homepage into sections
- move core composition server-side
- keep interactive islands client-only

## PR 5 — Dashboard data refactor
- introduce dashboard view model aggregation
- reduce client fetch count
- normalize error/loading/degraded states

## PR 6 — UI primitives
- add shared design primitives
- migrate homepage and selected dashboard surfaces
- reduce global CSS scope

## PR 7 — Accessibility and navigation
- remove zoom restriction
- improve focus states
- simplify mobile nav behavior
- refine overlays/prompts

## PR 8 — Tests and CI
- add unit/component coverage
- add Playwright smoke tests
- enforce checks in CI

## PR 9 — Security hardening
- CSP review
- auth/rate-limit audit follow-through
- env example cleanup

## PR 10 — Product positioning cleanup
- update copy/docs to reflect PWA vs native truth

---

# Definition of done

ConstructAIQ reaches this milestone when:
- homepage and dashboard never display fabricated production data
- core UI surfaces are typed and runtime-validated
- critical pages are mostly server-composed where appropriate
- styling is driven by shared primitives instead of giant inline blobs
- accessibility blockers are removed
- primary navigation is coherent across desktop and mobile
- core flows are protected by automated tests
- product language is honest about PWA vs native iOS status

---

# Codex working rules

Codex should follow these rules for every implementation PR:
- make the smallest viable change that improves the architecture
- explain tradeoffs in PR descriptions
- do not rewrite unrelated features opportunistically
- preserve working user flows during refactors
- add or update tests whenever behavior changes
- prefer deleting misleading behavior over preserving false polish

---

# Immediate next step

Start with **PR 1 — Documentation and baseline**, then **PR 2 — Trust fixes**.

Those two PRs unlock the rest of the plan safely.
