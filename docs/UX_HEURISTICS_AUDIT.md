# UX Heuristics Audit — ConstructAIQ

**Audited:** 2026-04-26  
**Method:** Nielsen 10 Usability Heuristics + Krug "Don't Make Me Think" principles  
**Scope:** `src/app/page.tsx` · `src/app/dashboard/page.tsx` · `src/app/trust/page.tsx` · `src/app/status/page.tsx` · `src/app/components/Sidebar.tsx` · `src/app/components/DataTrustBadge.tsx`

---

## Severity scale

| Level | Label    | Meaning |
|-------|----------|---------|
| 4     | Critical | Blocks task completion or creates false trust. Fix before next release. |
| 3     | Major    | Significantly impairs usability for a defined user type. Fix this sprint. |
| 2     | Minor    | Friction or inconsistency. Address in polish pass. |

---

## Critical — Severity 4

### C1 · Sidebar links to routes that are not in the verified product surface
**File:** `src/app/components/Sidebar.tsx:37–53`

The primary NAV array contains 15 items. The following routes are not documented in CLAUDE.md and do not appear to have built pages: `/portfolio`, `/sectors`, `/intelligence`, `/projects`, `/ground-signal`, `/reality-gap`, `/research`, `/ccci`, `/distress`, `/compare`, `/my-brief`. A new user who follows any of these links will land on a 404 or empty shell page, immediately destroying the platform's credibility signal.

Nielsen heuristic violated: **#1 Visibility of system status** (user cannot tell what is real vs aspirational) and **#6 Recognition rather than recall** (the nav implies completeness).

**Fix:** Remove unbuilt routes from the primary nav. They can be added as they ship. An aspirational nav is worse than a short nav.

---

### C2 · Dashboard has no error state — "loading" and "broken" are visually identical
**File:** `src/app/dashboard/page.tsx:169–181`

The `load()` function calls `safe('/api/dashboard')`, which swallows errors and returns null. If the fetch fails, `dashCore` remains null permanently. Every KPI panel shows "—" indefinitely. There is no timeout, no retry, and no error message. A user looking at a dashboard where every number reads "—" cannot tell whether data is still loading, the API is down, or there is a configuration error.

Nielsen heuristic violated: **#1 Visibility of system status** — the system gives no feedback about its current state.

**Fix:** Track a separate error/timeout state. After ~8 seconds without data, render an explicit message ("Data unavailable — check /status for pipeline health") rather than silent dashes.

---

### C3 · Three incompatible freshness vocabularies across the same product surface
**Files:** `src/app/components/DataTrustBadge.tsx:13–19` · `src/app/status/page.tsx:112–115` · `src/app/trust/page.tsx:435–453`

The same concept — how current the data is — is described with three different label systems:

| Surface | Labels used |
|---------|-------------|
| `DataTrustBadge` | `fresh`, `stale`, `delayed`, `failed`, `fallback`, `unknown` |
| `/status` Data Freshness table | `ok` → "Current", `warn` → "Aging", `stale` → "Stale" |
| `/trust` Freshness documentation | "Fresh", "Stale", "Delayed", "Unknown" |

A professional operator cross-referencing the dashboard badge against the /trust documentation will find that "Aging" (status page) maps to nothing in the trust docs, and "delayed" (badge) maps to nothing in the status page. This undermines trust in the platform's own transparency layer.

Nielsen heuristic violated: **#4 Consistency and standards** — the same concept has different names depending on where you look.

**Fix:** Standardize on the `DataTrustBadge` vocabulary (`fresh / stale / delayed / failed / fallback / unknown`) across all three surfaces. Update the status page display labels and the /trust documentation to use the same terms.

---

### C4 · "My Portfolio" is the first sidebar nav item and sends cold-start users to an empty state
**File:** `src/app/components/Sidebar.tsx:38`

`My Portfolio` is `NAV[0]` — the topmost link in the primary navigation. A first-time user with no saved markets clicks it and arrives at an empty portfolio page. The sidebar itself explains how to add markets only in the collapsed "My Markets" section further down (lines 252–256), which is invisible when collapsed to icon mode. This is the first interaction a new user has with the navigation.

Nielsen heuristic violated: **#9 Help users recognize, diagnose, and recover from errors** — but more precisely, this is a **Krug violation**: the most prominent link goes to a dead end for the audience most likely to click it.

**Fix:** Move "Overview" (`/dashboard`) to position 0 in the NAV array. Portfolio belongs after the user has onboarded.

---

## Major — Severity 3

### M1 · DataTrustBadge renders its most critical information at 9–10px
**File:** `src/app/components/DataTrustBadge.tsx:119,127,134`

The trust signals that professional users need most — status label (9px), source name (10px), data-type chip (9px), as-of date (10px) — are rendered at or below the practical minimum for legible body text on a standard display. The Apple HIG minimum for text is 11pt; the W3C WCAG minimum for informational text is effectively 12px on screen. A "STALE" warning at 9px is nearly invisible.

**Fix:** Minimum 11px for all DataTrustBadge text. The status label and as-of date should be at least 11px; source name at least 12px.

---

### M2 · Trust Center in-page nav hides entirely on mobile with no fallback
**File:** `src/app/trust/page.tsx:156–159`

```css
@media (max-width: 700px) {
  .tc-nav { display: none !important; }
}
```

The Trust Center is six long sections totalling ~1,100 lines of prose. On any viewport under 700px — including every phone and most tablets in portrait — the sticky left-column section nav simply disappears. There is no mobile sticky header, no "contents" dropdown, and no back-to-top link. The professional audience most likely to read the Limitations and AI Guardrails sections is also the audience most likely to be on a tablet.

**Fix:** Replace the `display:none` with a horizontally-scrollable anchor row at the top of the content area on narrow viewports, or a simple `<select>` dropdown for in-page navigation.

---

### M3 · Status page KPI cards use static "—" during load; tables use skeleton shimmer
**File:** `src/app/status/page.tsx:358–445`

The six KPI cards at the top of /status render a static `—` while data loads. The Data Freshness and Source Health tables directly below them use proper skeleton shimmer rectangles (lines 508–516, 677–685). The mismatch means the page appears partially broken during the 200–800ms load window — cards look empty while tables look "loading."

**Fix:** Apply the same shimmer skeleton pattern to KPI cards during the loading state, or replace the `—` with a shimmer placeholder of the same width as a typical value.

---

### M4 · Dashboard footer duplicates the Sidebar's newsletter CTA with a different visual weight
**File:** `src/app/dashboard/page.tsx:51–98` vs `src/app/components/Sidebar.tsx:337–360`

`DashboardFooter` renders "The Signal — Free Weekly" with a Subscribe link at `color.amber`. The Sidebar renders the identical "Subscribe to The Signal" CTA with the identical amber styling. A user scrolling to the bottom of any dashboard section sees the subscribe prompt; users who already dismissed it in the sidebar see it again. Neither surface indicates whether the user is already subscribed.

**Fix:** One subscription surface. Move it to the sidebar only (it's persistent there) and remove it from `DashboardFooter`. Or keep the footer version and remove the sidebar CTA. Either way, not both.

---

### M5 · WARN Act and Forecast are sidebar items that don't navigate to pages — they navigate to dashboard hash anchors
**File:** `src/app/components/Sidebar.tsx:50,43`

```
{ label: "Forecast",   href: "/dashboard#forecast",  Icon: TrendingUp  },
{ label: "WARN Act",   href: "/dashboard#signals",   Icon: AlertTriangle },
```

The NAV array mixes full page routes (`/federal`, `/permits`) with hash-anchor section links (`/dashboard#forecast`, `/dashboard#signals`). A user on any page other than `/dashboard` who clicks "Forecast" is navigated away from their current page to the dashboard. The sidebar gives no indication that clicking these items changes pages rather than scrolling. On mobile, these links are indistinguishable from top-level routes.

**Fix:** Hash-anchor links belong as sub-items under a "Dashboard" parent item, not as top-level sidebar items. Or promote Forecast to a full page route.

---

## Minor — Severity 2

### mn1 · Homepage "CONSTRUCTAIQ" eyebrow above H1 adds no information
**File:** `src/app/home/HomeHero.tsx:20`

The eyebrow reads "CONSTRUCTAIQ" in `TS.label` styling. The user is already on the ConstructAIQ site. This text burns visual hierarchy budget before the headline without contributing signal. The first visual after the nav should be the H1, not a repetition of the brand name.

**Fix:** Remove or replace with a true eyebrow that adds context — e.g. "US CONSTRUCTION INTELLIGENCE" or nothing.

---

### mn2 · HomeVerdictBanner renders above HomeNav, risking layout shift
**File:** `src/app/page.tsx:128–129`

```tsx
<HomeVerdictBanner verdict={verdict} loading={verdictLoading} />
<HomeNav />
```

The verdict banner is the first element in the page's DOM. During the `verdictLoading` state, whatever height the banner has before data loads pushes the nav down. When the verdict resolves and the banner changes height, the entire page jumps. The nav should be positionally stable as the first persistent element.

**Fix:** Render `HomeNav` before `HomeVerdictBanner`, or give the banner a fixed minimum height during loading so the nav position is stable.

---

### mn3 · Status page Source Health table shows raw category keys in per-row cells
**File:** `src/app/status/page.tsx:756`

```tsx
<td style={{...}}>{row.category}</td>
```

Section headers translate categories using `CATEGORY_LABELS` (line 694), but each row's category cell shows the raw database value (`government_data`, `federal`, `permits`, `scores`, `ai`). Under each section header, every row repeats the raw key. Operators reading the table see "government_data" next to "Census Bureau Construction Spending."

**Fix:** Apply `CATEGORY_LABELS[row.category] ?? row.category` to the per-row category cell.

---

### mn4 · Dashboard defaults to "forecast" section but "Overview" appears first in NAV_SECTIONS
**File:** `src/app/dashboard/page.tsx:44–49,152`

```tsx
const NAV_SECTIONS = [
  { id: 'overview'  },  // listed first
  { id: 'forecast'  },
  ...
]
const [activeSection, setSection] = useState('forecast')  // opens here
```

On first load, the user arrives on the Forecast section even though Overview is the first tab in the nav array (and presumably renders first visually). This is intentional per the product brief ("Forecasting is the hero capability"), but the nav order should match the initial state — either move Forecast to position 0 in NAV_SECTIONS or change the default to `'overview'`.

---

## What is working well

**Homepage value proposition** — `HomeHero.tsx` delivers the core message cleanly: a single H1 ("Free construction market intelligence."), a subtitle that names the three capabilities (forecasts, sources, signals), and a live spending KPI at 96px that signals "this is real data." A new user understands the platform's purpose in 5 seconds.

**DataTrustBadge component design** — The component architecture is correct: status dot, source, data type chip, as-of date, quality bar, and caveat text in collapsed/expanded modes. The separation between `DataTrustMeta` props and theme-aware rendering is clean. The QualityBar is a novel and useful trust signal. The problem is size, not structure.

**Status page overall structure** — The /status page (`status/page.tsx`) is the strongest trust surface in the product. PAR trend chart with target line, categorized source health, environment readiness, and data state all on one page — this is exactly what an operator or professional user needs. The skeleton loading states in the tables are good.

**Trust Center documentation depth** — `/trust/page.tsx` covers data sources, freshness vocabulary, forecast methodology, prediction validation, AI guardrails, and limitations in a single document. The callout boxes for caveats are well-placed. The sticky left-column nav (when visible) is clear and functional.

**ErrorBoundary wrapping** — Every dashboard section is wrapped in `<ErrorBoundary fallback={<SectionFallback>}>`. Section failures are isolated. One broken section does not crash the whole page.

**Responsive sidebar logic** — The `computeMode()` function in `Sidebar.tsx` (lines 72–77) correctly computes hidden/icon/full modes at the right breakpoints. The transition between icon and full mode is smooth.

**DataTrustBadge `variant` prop** — The dark/light variant separation (used on dashboard vs homepage) means the component works across both contexts without theme leakage.

---

## Top 3 fixes by user impact

### 1. Remove unbuilt sidebar routes (C1)
Every link to a non-existent page is a trust-destroying event. A 10-item nav that works everywhere is better than a 22-item nav where half the items 404. This is the single highest-impact fix because it affects every user on every dashboard session.

**Files:** `Sidebar.tsx:37–53` — remove unverified routes from NAV array.

---

### 2. Add a dashboard error/timeout state (C2)
The silent "—" failure mode means a broken API is indistinguishable from a loading state. Professional users relying on the platform for real decisions need to know when data is unavailable. This is the highest-impact trust issue for the returning professional user segment.

**Files:** `dashboard/page.tsx:167–181` — add error tracking to `load()`, render explicit error state after timeout.

---

### 3. Standardize freshness vocabulary (C3)
The Trust Center, the DataTrustBadge, and the /status page all describe the same concept with different words. A user who reads the Trust Center to understand what "Aging" means will not find the term — it only exists on /status. This actively undermines the transparency value proposition that differentiates ConstructAIQ from generic dashboards.

**Files:** `status/page.tsx:112–115` — align STATUS_DOT labels to match DataTrustBadge vocabulary. `trust/page.tsx:435–453` — update freshness status label documentation to match.

---

## API page surface check

`/api-access` is not linked from any primary navigation surface:
- `HomeNav.tsx` — only Methodology + Open Dashboard
- `Sidebar.tsx` — no `/api-access` entry in NAV or BOTTOM arrays
- `page.tsx` footer — only Dashboard, Federal, Methodology, About

The API documentation and key registration page is reachable by direct URL but is not promoted. This appears intentional for the current launch phase (the platform is free and open). **No action needed** unless API adoption becomes a goal — in that case, add it to the footer reference row, not the primary nav.
