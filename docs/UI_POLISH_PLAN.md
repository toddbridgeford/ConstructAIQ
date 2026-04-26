# UI Polish Plan

**Status:** Shell — Phase 24  
**Branch:** `claude/cleanup-launch-docs-eXjy2`  
**Source audits:** `docs/UX_HEURISTICS_AUDIT.md` · `docs/GSTACK_DESIGN_AUDIT.md`  
**Note:** `.claude/skills/taste-SKILL.md` was not found in this repository. This plan uses the design parameters and audit findings provided in the task brief.

---

## Purpose

Convert the UX and GSTACK audits into controlled polish work without random redesign or unsupported claims.

---

## Design Parameters by Surface

| Surface | DESIGN_VARIANCE | MOTION_INTENSITY | VISUAL_DENSITY |
|---------|-----------------|------------------|----------------|
| Homepage | 6 | 3 | 4 |
| Dashboard | 4 | 2 | 7 |
| Trust / Status | 4 | 2 | 5 |

**Parameter definitions:**

- **DESIGN_VARIANCE (1–10):** How far individual components may deviate from the established pattern. 4 = tight consistency; 6 = deliberate accent differentiation permitted on one element per section.
- **MOTION_INTENSITY (1–10):** Maximum animation expressiveness allowed. 2 = functional transitions only (opacity/height); 3 = one entrance animation per page section maximum.
- **VISUAL_DENSITY (1–10):** Target information density. 4 = spacious/marketing; 7 = professional dense data; 5 = balanced prose + data.

**Aesthetic direction per surface:**

- **Homepage:** Asymmetric, data-led — one live chart dominates the above-the-fold space, sections breathe at spacious rhythm, and the single permitted design accent per section (DESIGN_VARIANCE 6) is used to differentiate the "Free Forever" claim from surrounding trust cards.
- **Dashboard:** Tight, information-dense, and consistent — every component follows the canonical token set with no decorative deviation; motion is limited to functional state transitions (skeleton → data, section entry fade) and never decorative; density targets a professional operator who reads six KPI values before scrolling.
- **Trust / Status:** Prose-first, navigable, and neutral — layout serves readability of long-form methodology documentation and live pipeline status tables; the only permitted motion is a fade-in on section entry; density sits between marketing and data, with generous line-height and clear section breaks compensating for information depth.

---

## Typography Direction

### Typeface rules

- **Primary voice:** `font.sys` (`'Aeonik Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif`) is the only typeface for headings, body copy, navigation, card titles, marketing copy, and section eyebrows. Aeonik Pro is not yet loaded — see GSTACK Priority Fix #2. Until font files are added, the system fallback renders, which is acceptable temporarily but not production-ready.
- **Mono accent:** `font.mono` (`ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, monospace`) is used exclusively for: numeric KPI values, series IDs (e.g. `TTLCONS`, `CES2000000001`), timestamps, as-of dates, API key strings, and status codes. It is not used for section eyebrows, card titles, page-level navigation, prose, or section labels that name content categories.
- **Do not** use Inter, Roboto, or Arial as the intentional typographic voice. The system fallback is a temporary concession — once Aeonik Pro loads it must displace the fallback, not coexist with it.

### All-caps label policy

`TS.label` (`fontSize:11, fontFamily:font.mono, letterSpacing:'0.08em', textTransform:'uppercase'`) is currently overused: 12 instances on one homepage scroll, 7 in Dashboard Overview. This flattens every section to equal visual weight.

**Permitted uses (two roles only):**
1. The label immediately above a numeric KPI value — e.g. `CONSTRUCTION SPENDING` above a dollar figure
2. A single section-type eyebrow that names the data category per page — one per section maximum

**Remove from:** card eyebrows inside trust/provenance cards, page-header brand labels (`CONSTRUCTAIQ` above H1 on all four audited pages), navigation items, and any label that names a prose section rather than a data category. Replace those with `type.h3` in `font.sys`.

### Type scale — token targets

All sizes and weights come from `src/lib/theme.ts`. Never set `fontSize` or `fontWeight` inline outside the token system.

| Role | Token | Size | Family | Weight | Usage |
|------|-------|------|--------|--------|-------|
| H1 / display | `type.h1` | 28px | `font.sys` | 700 | Page title — one per page |
| Section heading | `type.h2` | 22px | `font.sys` | 600 | Major section break |
| Subsection / card title | `type.h3` | 17px | `font.sys` | 600 | Card headings, section eyebrows that name prose sections |
| Body | `type.body` | 15px | `font.sys` | 400 | All prose, descriptions, tooltip text |
| KPI hero value | `type.kpi` | 48px | `font.mono` | 700 | Primary metric — one per section |
| KPI secondary value | `type.kpiSm` | 32px | `font.mono` | 700 | Supporting metrics |
| Data label | `type.label` | 11px | `font.mono` | 500 | Label above a KPI value only — uppercase, tracked |
| Inline data value | `type.data` | 14px | `font.mono` | 400 | Table cells, feed rows, timestamps |
| Caption / source metadata | `type.caption` | 12px | `font.sys` | 400 | Source attribution, as-of date, caveat lines |

**Minimum legibility floor:** No informational text below 11px. Current violations — `fontSize:9` in `DataTrustBadge.tsx:119` and `fontSize:9` in `OverviewSection.tsx:172,232` — fail WCAG AA (≈3.5:1 on dark backgrounds). Raise all to 11px minimum as part of this polish pass.

### Per-surface direction

- **Homepage (DESIGN_VARIANCE 6):** H1 at `type.h1` in `font.sys`; hero spending KPI at `type.kpi` in `font.mono`; section eyebrows replaced with `type.h3` wherever they name a prose category rather than a data series. The display hierarchy should be legible in three levels: H1 → section heading → body. No fourth tier of MONO all-caps labels competing for attention.
- **Dashboard (DESIGN_VARIANCE 4):** KPI values at `type.kpi` / `type.kpiSm`; data labels at `type.label` (above numeric only); table cells and feed rows at `type.data`. No decorative typographic variation — every component uses the same token for the same role. Section headings at `type.h2`.
- **Trust / Status (DESIGN_VARIANCE 4):** Body at `type.body` with `lineHeight:1.6` for long-form readability. Section headings at `type.h2`. Table column headers at `type.label` (11px) — raise from current 11px `#555` which fails contrast on light backgrounds. Caption / source metadata at `type.caption`. No MONO outside table cells, status labels, and timestamps.

---

## Color and Semantic Token Direction

### Palette source of truth

All colors come from `src/lib/theme.ts` → `color.*` and `signal.*`. No component file may declare a raw hex string. The current violation count: `/trust/page.tsx` has 12 hardcoded hex strings (`'#333'`, `'#111'`, `'#f5f5f5'`, `'#555'`, `'#aaa'`, etc.) with no `color.*` import — this is the highest-priority token compliance fix on the Trust surface.

### Semantic signal system

Each hue carries exactly one meaning. Using the same color for two different signals destroys the communication value of the palette.

| Hue | `theme.ts` token | Semantic meaning | Forbidden uses |
|-----|-----------------|-----------------|----------------|
| **Amber** `#f5a623` | `color.amber` / `signal.watch` | Primary data value accent — headline metric, Verdict WATCH state | Do not use as a general warning; do not use for CTA buttons |
| **Blue** `#0a84ff` | `color.blue` | Forecast projections, confidence bands, CTAs, selected state, links | Do not use as a positive/healthy signal; do not double as a warning |
| **Green** `#30d158` | `color.green` / `signal.expand` | Expansion, positive direction, fresh data, healthy pipeline | Do not use decoratively; do not use for non-directional accents |
| **Red** `#ff453a` | `color.red` / `signal.contract` | Contraction, risk, failed pipeline, stale data | Do not use for anything other than negative signals |
| **Gray** `t3` `#a0a0ab` / `t4` `#6e6e73` | `color.t3`, `color.t4` | Context, metadata, source attribution, timestamps, secondary labels | Do not use as a primary text color; minimum 11px at this weight |
| **Federal** `#0066CC` | `signal.federal` | Federal infrastructure data specifically — IIJA/IRA program context | Do not use as a generic blue; reserve for federal data surfaces |

**Amber conflict to resolve:** `color.amber` is currently used both as the KPI headline accent (construction spending) and as the `signal.watch` state (market condition). These are compatible uses — amber = "primary attention metric" — but the Sidebar newsletter CTA also uses `color.amber` for "Subscribe," which places a commercial action in the same color as market warning signals. Move the CTA accent to `color.blue` to separate commercial and analytical uses.

### Gradient policy

Decorative gradients are prohibited unless the gradient encodes data meaning (e.g. a heatmap scale, a confidence band fill).

**Currently violating:**

| Pattern | File | Action |
|---------|------|--------|
| `.grad-text` — gradient headline text | `src/app/globals.css:200` · `src/app/components/HeroSection.tsx:143` | Remove `.grad-text`; replace with `color.t1` (white) or `color.amber` solid |
| `.btn-fl` glow shadow at rest | `src/app/globals.css:129–138` | Remove `box-shadow` at rest; hover = background color change only, no `translateY`, no amplified shadow |
| `.btn-g` glassmorphism | `src/app/globals.css:151–158` | Remove `backdrop-filter: blur(8px)`; replace with `color.bg2` solid background |
| Hero background triple radial-gradient | `src/app/globals.css:186–189` | Subtle enough to retain — three radial glows at 5–13% opacity qualify as texture, not decoration. Keep but do not add more. |

**Rule:** One decorative background gradient maximum per surface, at opacity ≤ 15%. Gradient text on headlines is prohibited unconditionally — it is the single most-recognized AI-generated landing page pattern.

### Semantic token map

The following table maps each semantic role to its `theme.ts` source token. Use the semantic name in documentation and design discussion; use the `theme.ts` token in code.

| Semantic token | `theme.ts` value | Hex | Notes |
|----------------|-----------------|-----|-------|
| `bg` | `color.bg0` | `#000` | Page background — dark surfaces |
| `surface` | `color.bg1` / `color.bg2` | `#0d0d0d` / `#1a1a1a` | Card and panel backgrounds |
| `border` | `color.bd1` / `color.bd2` | `#2a2a2a` / `#383838` | Card borders / table dividers |
| `text-primary` | `color.t1` | `#fff` | Headings, KPI values, primary body |
| `text-secondary` | `color.t2` | `#ebebf0` | Subheadings, card titles |
| `text-muted` | `color.t3` | `#a0a0ab` | Source attribution, timestamps, secondary labels |
| `text-disabled` | `color.t4` | `#6e6e73` | Placeholder text, inactive states — minimum 11px |
| `accent-primary` | `color.blue` | `#0a84ff` | CTAs, links, forecast lines, selected state |
| `status-fresh` | `color.green` | `#30d158` | Fresh data, healthy pipeline, expansion signal |
| `status-warning` | `color.amber` | `#f5a623` | Delayed data, WATCH market condition |
| `status-risk` | `color.red` | `#ff453a` | Failed pipeline, stale data, CONTRACTING signal |
| `forecast` | `color.blue` | `#0a84ff` | Forecast line, confidence band stroke — same as `accent-primary`; confidence band fill uses `color.blueDim` (`#001a3d`) |

### `color.purple` — phantom token

`color.purple` (`#5e5ce6`) has one use: `OverviewSection.tsx:403` as the CSHI Score KPI accent. It has no entry in `signal.*` and no documented semantic meaning. **Resolution required before polish pass:**

- Option A: Add `signal.composite: color.purple` to `theme.ts` with a comment — "Composite index accent; used only for CSHI Score KPI."
- Option B: Replace with `color.blue` and remove the purple differentiation.

Do not leave an undocumented accent color in the token system. It will propagate.

### Light-surface exception (Trust Center)

`/trust/page.tsx` renders on a white background (`#ffffff`). The dark-theme `color.*` tokens (`color.t1 = #fff`) are not usable directly. The light-surface palette must use:

| Role | Value | `theme.ts` source |
|------|-------|-----------------|
| Page background | `color.lightBg` | `#f8f8f8` |
| Card background | `color.lightBgAlt` | `#fafafa` |
| Border | `color.lightBd` | `#e5e5e5` |
| Primary text | `#111111` | No current token — map to a new `color.lightT1` or use inline as a documented exception |
| Secondary text | `#555555` | No current token — map to `color.lightT2` |

The immediate fix is to import `color` from `theme.ts` and use the `lightBg*` and `lightBd` tokens that already exist. The two missing light text tokens (`lightT1`, `lightT2`) should be added to `theme.ts` in the same pass rather than leaving raw hex strings in the component.

---

## Spacing and Density Rules

_To be populated from GSTACK audit findings._

---

## Motion Rules

### Governing principle

Motion communicates state change. It does not decorate, entertain, or signal effort. Every animation must answer the question: "What changed, and where?" If the answer is "nothing changed — this is just visual flair," the animation is removed.

### `prefers-reduced-motion` — non-negotiable

Every transition and animation in the codebase must be wrapped or suppressed under `prefers-reduced-motion: reduce`. This is not optional polish — it is a baseline accessibility requirement for users with vestibular disorders.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Add this block to `src/app/globals.css` if not already present. Do not rely on component-level guards alone.

### Properties that must never be animated

Animating layout-affecting properties causes browser reflow on every frame, degrades performance on lower-end hardware, and creates disorienting jumps for users with motion sensitivity.

**Never animate:** `width`, `height`, `top`, `left`, `right`, `bottom`, `margin`, `padding`, `grid-template-columns`, `flex-basis`

**Safe to animate:** `opacity`, `transform` (translate/scale/rotate only), `color`, `background-color`, `border-color`, `box-shadow` (sparingly)

The current `.btn-fl:hover` violation — `transform: translateY(-2px)` — is on the safe-to-animate list technically, but the combination of lift + amplified shadow crosses the line into decorative. Remove the transform and shadow amplification; retain background-color change only.

### Homepage — MOTION_INTENSITY 3

- **Hover states:** `opacity` or `background-color` change on interactive elements. Duration 150–200ms, `ease-out`. No scale transforms, no shadow amplification, no translateY on cards.
- **Section entry:** One fade-in per section as it enters the viewport — `opacity: 0 → 1`, duration 200ms, `ease-out`. Maximum one animated element per section; do not stagger every card in a grid.
- **Live data updates:** When the verdict banner or KPI value updates, a single `opacity` pulse (0.6 → 1, 300ms) is acceptable to signal freshness. No slide, no bounce.
- **Prohibited:** Scroll-driven parallax, sequential card stagger animations, looping background animations, `@keyframes` on any element that is not communicating a state change.
- **Existing `.live-dot` `@keyframes pulse`:** Acceptable — a pulsing dot on a live data indicator is functional (it signals "this is live"), not decorative. Retain.

### Dashboard — MOTION_INTENSITY 2

- **Loading → data:** Skeleton shimmer to populated content is the primary motion event on this surface. Duration 200ms `opacity` crossfade. The chart drawing itself (line progressing left to right) counts as the motion for the forecast section — no additional entrance animation needed.
- **Hover states:** `background-color` change on table rows, KPI cards, and nav items. Duration 120–150ms, `ease-out`. No transforms.
- **State changes:** Section tab switch — `opacity` fade of outgoing content, 150ms. Do not animate the panel width or slide panels in/out.
- **Prohibited:** Animated layout shifts between sections, chart re-animation on scroll, parallax on any element, any animation that fires more than once per user action.
- **PAR progress bar `transition: width 0.6s ease`:** This exists in `/status` and is acceptable because the width change directly encodes a data value update. Retain. Do not replicate this pattern for decorative bars.

### Trust / Status — MOTION_INTENSITY 2

- **Near-static by design.** These are reference and monitoring surfaces. A construction lender reading AI Guardrails or an operator checking pipeline freshness is not looking for visual activity.
- **Focus feedback:** `:focus-visible` outlines on all interactive elements (anchor links, table rows with click handlers). No motion required — a solid `color.blue` outline at `2px offset` is sufficient.
- **Hover feedback:** Table row `background-color` change, 120ms. Nothing else.
- **Prohibited:** Animated table rows, count-up number animations on KPI cards, any entrance animation on prose sections, skeleton shimmer on static content (use it only on data-fetched content).
- **Section entry on /status:** A single `opacity` fade (150ms) on the Data Freshness and Source Health panels when data loads from the API is acceptable. Do not animate the KPI cards separately from the panels they belong to.

### Existing motion audit

| Element | File | Current behavior | Action |
|---------|------|-----------------|--------|
| `.live-dot` pulse | `globals.css` | `@keyframes pulse` opacity loop | **Retain** — functional live signal |
| `.btn-fl` hover | `globals.css:134–137` | `translateY(-2px)` + shadow amplification | **Remove** transform and shadow amplification; keep `background-color` change |
| PAR progress bar | `status/page.tsx` | `transition: width 0.6s ease` | **Retain** — encodes data value |
| Sidebar mode transition | `Sidebar.tsx` | Width/opacity transition on mode change | **Retain** — functional state change |
| Skeleton shimmer | `status/page.tsx` | CSS animation on loading placeholders | **Retain** — communicates loading state |

---

## Top 10 UI Changes Ranked by Impact

Ranked by user-facing decision impact and weighted GStack score movement. Items 6–10 to follow.

---

### 1 · Above-fold homepage decision clarity

**Surface:** Homepage  
**Problem:** The active hero (`HomeHero.tsx`, rendered at `page.tsx:130`) is a centered SaaS layout — eyebrow, H1, subtitle, KPI number, two CTAs, all stacked and center-aligned. The product's actual differentiator — a live 12-month forecast chart — does not appear until the user scrolls past three more sections. `HeroSection.tsx` (the correct 60/40 split layout with a live chart left and signals rail right) is already built but not wired into `page.tsx`.

**Change:** Replace `<HomeHero>` with `<HeroSection>` at `page.tsx:130`. Remove the `grad-text` gradient class from `HeroSection.tsx:143` (replace with `color.t1`). Remove the `CONSTRUCTAIQ` all-caps brand eyebrow from the hero — the user is already on the site.

**Why it matters:** A first-time user who sees a real forecast chart above the fold understands "this is a data platform" in under three seconds. A user who sees a centered headline and subtitle must read before they understand. Data products earn trust by showing data, not by describing themselves. This is also the single change that eliminates the most-recognized AI-generated landing page pattern from the homepage.

**Expected impact:** GStack Visual Hierarchy +2 (5→7); Emotional Resonance +2 (5→7); overall weighted score +0.50. Eliminates GSTACK pattern #6 (centered SaaS hero) and #5 (gradient headline text).

---

### 2 · Dashboard primary verdict hierarchy

**Surface:** Dashboard  
**Problem:** On initial load the dashboard defaults to the `forecast` section (`useState('forecast')` at `dashboard/page.tsx:152`), but the NAV_SECTIONS array lists `overview` first. This mismatch means the first tab in the nav is not the active section — the user's mental model of position is wrong before they've done anything. More critically, the Verdict Banner (EXPAND / CONTRACT / WATCH) is absent from the dashboard entirely — it appears on the homepage but not on the surface where market direction actually drives decisions.

**Change:** (a) Move `forecast` to position 0 in `NAV_SECTIONS` to match `useState('forecast')`, or change the default to `'overview'` — whichever matches the intended entry point per product strategy. (b) Surface the Verdict state (EXPAND / CONTRACT / WATCH) as the topmost element in the dashboard above the KPI row — a single line, the color of the signal, the label, and the date. This is the decision the dashboard exists to support; it should be the first thing a returning user reads.

**Why it matters:** Professional users returning to the dashboard daily are looking for one thing: has the signal changed? Burying that signal below KPI cards and a nav inconsistency means every session starts with orientation cost instead of decision clarity. (UX audit finding mn4 + CLAUDE.md dashboard hierarchy target.)

**Expected impact:** GStack Visual Hierarchy +1 (5→6); removes UX heuristic violation mn4. Verdict surfacing makes the dashboard's primary output immediately legible.

---

### 3 · DataTrustBadge minimum legibility on all decision metrics

**Surface:** Dashboard · Homepage  
**Problem:** The DataTrustBadge — the component that communicates how current and reliable each data source is — renders its most critical fields at 9px (`status label` at `DataTrustBadge.tsx:119`) and 10px (`source name`, `as-of date`). At 9px on a dark background, a "STALE" warning is nearly invisible. Contrast ratios at these sizes fall to ≈3.5:1 against `color.bg2` — below the WCAG AA minimum of 4.5:1. The badge architecture is correct; the size floor is wrong.

**Change:** Raise every text size in `DataTrustBadge.tsx` to a minimum of 11px. Specifically: status label `119` → 11px; data-type chip `127` → 11px; source name → 12px; as-of date → 11px. Apply the same floor to `OverviewSection.tsx:172` (SVG axis labels at 9px) and `OverviewSection.tsx:232` (KpiCard source line at 9px).

**Why it matters:** The Trust Center and DataTrustBadge are ConstructAIQ's transparency differentiator. If the badge that says "STALE" is illegible, the transparency mechanism fails at the moment it matters most — when data quality has degraded and a professional user needs to know. This is a trust failure disguised as a typography fix. (UX audit M1; GSTACK Accessibility finding.)

**Expected impact:** GStack Accessibility +2 (4→6); Typography +0.5 (5→5.5); overall weighted score +0.20. Resolves WCAG AA contrast failure on all DataTrustBadge instances.

---

### 4 · Trust / Status page purpose clarity and navigation

**Surface:** Trust · Status  
**Problem:** Both `/trust` and `/status` open with `CONSTRUCTAIQ` as the all-caps MONO eyebrow above the H1 — the same brand label used on every other audited page. The user is already on the platform; the eyebrow adds no orientation. On `/trust`, the sticky left-column section nav (the only wayfinding through six long methodology sections) disappears entirely on viewports under 700px with `display: none !important` and no mobile fallback. A tablet user reading AI Guardrails has no way to navigate between sections. On `/status`, the Source Health table rows show raw database category keys (`government_data`, `federal`, `permits`) in per-row cells even though `CATEGORY_LABELS` already translates them for section headers.

**Change:** (a) Replace the `CONSTRUCTAIQ` eyebrow on both pages with a context-setting label: `/trust` → `DATA TRANSPARENCY` (or remove entirely); `/status` → `PLATFORM STATUS`. (b) Replace `.tc-nav { display: none !important }` at `trust/page.tsx:158` with a horizontally-scrollable anchor chip row (`overflow-x: auto; white-space: nowrap`) that appears at the top of `.tc-content` on narrow viewports. (c) Apply `CATEGORY_LABELS[row.category] ?? row.category` to the per-row category cell at `status/page.tsx:756`.

**Why it matters:** The Trust Center is the product's primary credibility surface — the document that explains why ConstructAIQ's data can be trusted. If a mobile user cannot navigate it, and if a desktop user's first impression is "CONSTRUCTAIQ" (brand reinforcement, not content orientation), the surface fails its purpose before the user reads a word. The raw key bug on `/status` makes the platform look unfinished to any operator who opens the table. (UX audit mn1, M2, mn3; GSTACK Component Consistency finding.)

**Expected impact:** GStack Visual Hierarchy +1 on both surfaces; Accessibility +1.5 (Trust mobile nav fix); Component Consistency +0.5 (raw key fix); overall weighted score +0.20.

---

### 5 · Navigation simplification — remove unbuilt routes

**Surface:** Dashboard (Sidebar)  
**Problem:** `Sidebar.tsx:37–53` NAV array contains 15 items. At least 11 routes are not verified as built pages: `/portfolio`, `/sectors`, `/intelligence`, `/projects`, `/ground-signal`, `/reality-gap`, `/research`, `/ccci`, `/distress`, `/compare`, `/my-brief`. A first-time user clicking any of these lands on a 404 or empty shell — the most credibility-destroying outcome possible for a platform whose value proposition is data transparency. `My Portfolio` (`NAV[0]`) is the topmost link and sends new users to an empty state immediately. `Forecast` and `WARN Act` are hash-anchor links (`/dashboard#forecast`, `/dashboard#signals`) mixed into the same nav array as full page routes, with no visual distinction.

**Change:** (a) Remove all unbuilt routes from the primary NAV array. Ship a 4–6 item nav: Overview, Forecast (promote to full page or keep as dashboard anchor sub-item), Federal, Methodology. (b) Move `My Portfolio` to a secondary position — after Overview, not before it. (c) Separate hash-anchor section links from full page routes: either promote Forecast to a standalone page, or nest it as a sub-item under a `Dashboard` parent in the sidebar, clearly marked as a section link rather than a page link.

**Why it matters:** An aspirational nav is worse than a short nav. Every dead link is a trust-destroying event. A 15-item nav where 11 items 404 tells a professional user that the platform is incomplete. A 5-item nav that works perfectly tells them the platform is focused and production-ready. This is the single highest-impact trust fix in the UX audit. (UX audit C1, C4; CLAUDE.md "Known bugs" C1.)</p>

**Expected impact:** Eliminates UX severity-4 critical finding C1 (unbuilt nav routes) and C4 (My Portfolio as first item). GStack Emotional Resonance +1 (platform credibility); Component Consistency +0.5; overall weighted score +0.15.

---

### 6 · Replace generic feature-grid sameness with evidence-led sections

**Surface:** Homepage  
**Problem:** Two homepage sections rely entirely on identical card layouts that describe the platform without showing it. `HomeRoles.tsx` (rendered at `page.tsx:132`) renders five cards for Contractors, Suppliers, Lenders, Developers, and Public-sector analysts — every card has the same `color.blue` left-border, the same `borderRadius`, the same two-line text layout, and the same background. No card shows data. `HomeTrust.tsx` renders three cards (Data Provenance, Methodology, Free Forever) that are pixel-identical in every visual property. "Free Forever" — the platform's strongest commercial differentiator — is visually indistinguishable from the provenance card beside it.

**Change:** (a) In `HomeRoles.tsx`: give each role card one differentiating property that maps to a real product capability — not color for color's sake, but a visible data point specific to that role. Contractors see current permit volume; Lenders see CSHI + rate; Suppliers see the top material signal. If live data is not yet available per role, display `—` explicitly rather than a generic description. (b) In `HomeTrust.tsx`: give "Free Forever" a single accent that marks it as the hero claim — `borderLeft: 3px solid ${color.amber}` against the neutral `color.bd1` borders on the other two cards. No other visual changes to the card layout.

**Why it matters:** A data product that describes itself instead of demonstrating itself is indistinguishable from its competitors. Every construction industry platform claims to serve "contractors, lenders, and developers." ConstructAIQ's advantage is the data — showing one live number per role makes the argument the competition cannot make. The "Free Forever" accent fix is a ten-minute change that makes the platform's most unexpected claim visually prominent. (GSTACK patterns #1 generic feature grids, #2 card sameness.)

**Expected impact:** GStack Emotional Resonance +1 (5→6); Visual Hierarchy +0.5; eliminates AI slop patterns #1 and #2 from homepage. The role-specific data change depends on API availability per role; the `HomeTrust.tsx` accent change is unconditional.

---

### 7 · Improve empty / error / loading state separation

**Surface:** Dashboard · Status  
**Problem:** The dashboard `load()` function (`dashboard/page.tsx:169–181`) calls `safe('/api/dashboard')`, which swallows errors and returns null. If the fetch fails, `dashCore` remains null permanently and every KPI panel shows `—` indefinitely — visually identical to the loading state. There is no timeout, no retry signal, and no error message. A professional operator cannot tell whether the API is slow, down, or misconfigured. Separately, on `/status`, KPI cards render a static `—` during load while the tables directly below them use proper skeleton shimmer — the page looks partially broken during the 200–800ms load window (UX audit M3).

**Change:** (a) In `dashboard/page.tsx`: add an `error` state to `load()`. After ~8 seconds without a successful response, set `error = true` and render an explicit message in place of the KPI row: "Data unavailable — check [/status](/status) for pipeline health." Do not show `—` after timeout. (b) In `status/page.tsx`: apply the same skeleton shimmer pattern used on the Data Freshness and Source Health tables to the six KPI cards at the top of the page. Replace the static `—` placeholder with a shimmer rectangle of equivalent width during the loading state.

**Why it matters:** Silent failure in a data platform destroys professional trust faster than any visual flaw. A construction lender who opens the dashboard and sees every metric as `—` at 8:00am on a decision day has no way to know if the platform is broken. An explicit "Data unavailable" state with a link to /status is honest and actionable. The KPI shimmer fix on /status is a 30-minute consistency fix that makes the page feel production-ready instead of partially rendered. (UX audit C2, M3.)

**Expected impact:** Eliminates UX severity-4 critical finding C2 (silent error state). Resolves UX M3 (skeleton inconsistency). GStack Component Consistency +0.5; Emotional Resonance +0.5 (platform reliability signal); overall weighted score +0.10.

---

### 8 · Reduce all-caps muted label overuse

**Surface:** Homepage · Dashboard · Trust · Status  
**Problem:** `TS.label` (`fontSize:11, font.mono, letterSpacing:0.08em, textTransform:uppercase`) appears 12 times on a single homepage scroll and 7 times in Dashboard Overview. When every section eyebrow, card title, nav item, and brand label uses the same style at the same `color.t3` weight, no element reads as more important than any other. The label style — designed as a single hierarchical accent — has become visual noise. Specific violations: `CONSTRUCTAIQ` eyebrow on all four audited pages (zero information value), `WHO IT IS FOR` in `HomeRoles.tsx:33`, `DATA PROVENANCE` / `FREE FOREVER` as card eyebrows in `HomeTrust.tsx:22,46,67`, and seven labeled KPI categories in `OverviewSection.tsx` that use the same style as the section header above them.

**Change:** Apply the two-role rule from the Typography Direction section: `TS.label` is permitted only (1) directly above a numeric KPI value, (2) as a single section-type eyebrow that names the data category. All other uses: replace `CONSTRUCTAIQ` eyebrows with nothing or with a `type.h3` context label; replace card eyebrows in `HomeTrust.tsx` with `type.h3` in `font.sys`; in `HomeRoles.tsx` remove the `WHO IT IS FOR` label or replace with `type.h2`. The goal is to reduce `TS.label` instances from 12 per homepage scroll to 3–4 maximum.

**Why it matters:** Hierarchy is the primary tool for communicating priority. When the label style that should signal "this is a data category" appears on brand names, card titles, and nav items at equal visual weight, users cannot distinguish signal from structure. Reducing the label count to its intended two roles restores the hierarchy that the component was designed to create. (GSTACK pattern #3, audit score Typography 5/10, Visual Hierarchy 5/10.)

**Expected impact:** GStack Typography +1 (5→6); Visual Hierarchy +1 (5→6); overall weighted score +0.40. High-surface-area fix — touches homepage, dashboard, trust, and status in a single pass.

---

### 9 · Standardize freshness status colors and vocabulary

**Surface:** Dashboard · Trust · Status  
**Problem:** The same concept — how current the data is — uses three different label systems across the product. `DataTrustBadge` uses `fresh / stale / delayed / failed / fallback / unknown`. The `/status` Data Freshness table uses `ok → "Current"`, `warn → "Aging"`, `stale → "Stale"`. The `/trust` freshness documentation uses `Fresh / Stale / Delayed / Unknown`. "Aging" exists only on `/status` and maps to nothing in the Trust Center. "Delayed" exists on the badge and in `/trust` docs but not on `/status`. A professional cross-referencing the dashboard badge against the Trust Center documentation finds three different systems for the same concept. (UX audit C3; GSTACK Color & Palette finding.)

**Change:** Standardize on the `DataTrustBadge` vocabulary as the canonical set: `fresh / stale / delayed / failed / fallback / unknown`. Two file changes: (a) `status/page.tsx:113` — rename `STATUS_DOT.warn.label` from `'Aging'` to `'Delayed'`. (b) `trust/page.tsx:509–513` — update the Source Health state documentation to replace `'Aging'` with `'Delayed'` wherever it appears. Verify `HEALTH_BADGE` labels in `status/page.tsx` (`ok → 'Fresh'`, `warn → 'Degraded'`, `failed → 'Failed'`) against DataTrustBadge — `'Degraded'` is not in the canonical vocabulary; replace with `'Delayed'`.

**Why it matters:** Vocabulary consistency is a trust mechanism, not a cosmetic fix. The Trust Center exists to explain how to interpret the platform's data signals. If the vocabulary on /status contradicts the vocabulary in the Trust Center, the transparency layer is broken. A professional who learns the badge vocabulary on the dashboard should encounter the same terms everywhere. Two label renames resolve all three vocabularies. (UX audit C3; GSTACK Priority Fix #5.)

**Expected impact:** Eliminates UX severity-4 critical finding C3 (three incompatible freshness vocabularies). GStack Color & Palette +1; Component Consistency +1; overall weighted score +0.30.

---

### 10 · Tighten mobile tables and overflow handling

**Surface:** Trust · Status · Dashboard  
**Problem:** Three distinct overflow and mobile-layout failures compound across the audited surfaces. (a) `/trust` left-nav vanishes on viewports under 700px (`display:none !important`) with no fallback — covered in item 4, but also causes the Trust Center's dense HTML tables (Data Sources summary, Source Health) to overflow horizontally with no scroll affordance on narrow viewports. (b) `/status` Source Health and Data Freshness tables have no defined `max-width` or `overflow-x: auto` wrapper — on a 375px iPhone, column content clips or forces horizontal page scroll. (c) `ForecastChart` in the dashboard uses a fixed `width={620}` prop — it does not respond to container size and overflows on narrow screens. The chart already uses `viewBox`, so the fix is minimal.

**Change:** (a) Wrap every data table in `/trust` and `/status` in `<div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>`. Add `min-width` to table elements sufficient to preserve column readability (e.g. `minWidth: 560` for the Data Sources table). (b) In `ForecastChart.tsx`: remove the fixed `width` prop and replace with `width="100%"` — the `viewBox` already exists so this is a one-line change that makes the chart fully responsive. (c) Apply the horizontal scrollable chip-row solution for the `/trust` left-nav on mobile (already specified in item 4) — this also resolves the table overflow since users can navigate to each section independently rather than scrolling through all six.

**Why it matters:** The Apple HIG minimum touch target is 44×44pt. A table that clips at 375px is not usable on the primary mobile form factor. ConstructAIQ's professional audience includes operators who check platform status and trust documentation on phones and tablets. A fixed-width chart that overflows its container on any non-desktop viewport is a production regression, not a polish gap. The ForecastChart fix is a one-line change. (CLAUDE.md Known Bug #6: ForecastChart fixed width; UX audit M2: Trust Center mobile nav; GSTACK Accessibility 4/10.)

**Expected impact:** GStack Accessibility +1.5 (4→5.5); overall weighted score +0.10. Resolves a production regression (ForecastChart overflow) and two mobile usability failures across Trust and Status. Directly supports CLAUDE.md sprint item 9 (Mobile/iPhone pass).

_To be populated — components and patterns confirmed working well._

---

## Validation Checklist

_To be populated — pre-commit checks for each polish change._
