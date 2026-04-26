# GSTACK Design Audit

> **Note:** `.claude/skills/gstack-SKIL.md` was not found in this repository.
> This document uses the GStack scoring framework as described in the task brief.
> Populate the sections below once the full audit pass is complete.

---

## Audit Scope

Score the visual/product design and identify AI slop patterns before polish changes.

---

## Files Reviewed

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Homepage shell — assembles all home sections |
| `src/app/dashboard/page.tsx` | Dashboard shell — section routing, data fetching |
| `src/app/trust/page.tsx` | Trust Center — data sources, methodology, limitations |
| `src/app/status/page.tsx` | Platform Health — PAR trend, source health, env readiness |
| `src/app/components/DataTrustBadge.tsx` | Inline trust/freshness badge used across all sections |
| `src/app/components/HeroSection.tsx` | Alternative hero component with chart + signals rail |
| `src/app/home/HomeTrust.tsx` | Homepage trust trifecta — provenance, methodology, free |

---

## Rating Table

> Scores are aggregated across all four audited surfaces: Homepage · Dashboard · Trust Center · Status.

| Dimension | Score (1–10) | Key finding |
|-----------|-------------|-------------|
| Typography | 5/10 | Aeonik Pro not loaded anywhere; `fontSize:9` in 3+ components fails WCAG AA; 12+ all-caps MONO labels on homepage; `/trust` bypasses color tokens for all text styling |
| Color & Palette | 5/10 | `/trust` uses 12 hardcoded hex strings (no `color.*` imports); `color.purple` is a phantom palette entry; three incompatible freshness label vocabularies; dark/light split has no design bridge |
| Spacing & Rhythm | 5/10 | Five different raw padding values across adjacent homepage sections; `space.*` tokens used on `/status` but absent from all homepage and `/trust` components |
| Visual Hierarchy | 5/10 | Newsletter before data evidence on homepage; five competing "primary signal" surfaces before first KPI on dashboard; `/trust` has six dense prose sections with no visual relief between them |
| Component Consistency | 4/10 | Three distinct KPI card implementations across the product; `DataTrustBadge` placement and props inconsistent across sections; `/trust` is a fully isolated design system with no shared components |
| Accessibility | 4/10 | 9–10px labels fail WCAG AA throughout dashboard and `/status`; `/trust` left nav vanishes on mobile with no fallback; hover-only chart tooltip; `thStyle` 11px contrast failure in `/trust` table |
| Motion & Interaction | 5/10 | PAR progress bar has `transition: width 0.6s ease` (good); sidebar mode transitions work; no documented motion standards; hover-only tooltips on primary chart in Overview |
| Emotional Resonance | 5/10 | Dashboard dark premium feel is directionally correct; Trust Center content depth is a genuine product strength; homepage generic SaaS hero undercuts the product's actual differentiation |
| **Overall** | **5/10** | Token system (`theme.ts`) is architecturally sound but bypassed in most non-dashboard components. Dashboard is the strongest surface. Homepage and `/trust` are weakest. |

---

## AI Slop Patterns

> **TODO:** List specific file locations and line numbers for each pattern found.

Patterns to check for:

- [x] Generic feature/persona grids — `HomeRoles.tsx` five equal-weight role cards, identical `color.blue` border and padding on all five
- [x] Card sameness — `HomeTrust.tsx` three pixel-identical cards; `HomeStatusCards.tsx` three identical status cards
- [x] All-caps MONO label proliferation — 12 instances on homepage, 7 in Overview alone, brand-name "ConstructAIQ" eyebrow on all four audited pages
- [x] Vague trust/progress claims — "38+ sources" (`HomeTrust.tsx:30`) vs "312 DATA SOURCES" (`HeroSection.tsx:137`) contradict each other; hardcoded fallback stats look dynamic
- [x] Overused or decorative gradients — `HeroSection.tsx:143` uses `.grad-text` CSS class on hero headline
- [x] Centered generic SaaS hero patterns — `HomeHero.tsx:11–108` is textbook: all-caps eyebrow → H1 → subtitle → hero KPI → two CTAs, center-aligned, no dominant visual object
- [x] Stat-stuffed eyebrows — `HeroSection.tsx:137` "312 DATA SOURCES · 3-MODEL AI ENSEMBLE · LIVE" presents three authority-signaling numbers without supporting context in the same line
- [x] Duplicate CTAs across a single page — `DashboardFooter` "The Signal" newsletter subscribe + `Sidebar.tsx:337–360` "Subscribe to The Signal" both use `color.amber` styling
- [x] Newsletter capture before value demonstration — `HomeNewsletter` appears at `page.tsx:134–136` before `HomeStatusCards` (first live data surface)

---

## Priority Fixes

> **TODO:** Rank top fixes by user impact once audit is complete.

| Priority | Fix | File | Rationale |
|----------|-----|------|-----------|
| 1 | Remove unbuilt routes from Sidebar NAV | `Sidebar.tsx:37–53` | Every broken link destroys the platform's credibility on every visit — a short nav that works is better than a full nav that 404s |
| 2 | Standardize freshness vocabulary | `status/page.tsx:111–115` · `trust/page.tsx:431–513` | Three incompatible label systems for the same concept ("Aging" / "Stale" / "Delayed") actively undermine the Trust Center's transparency mission |
| 3 | Add error/timeout state to dashboard `load()` | `dashboard/page.tsx:169–181` | Silent `—` on API failure is indistinguishable from a loading state; professional users relying on the platform for decisions cannot tell if data is unavailable |

---

## What a 10 Looks Like for ConstructAIQ

> **TODO:** Define the target state in product-specific terms.

A 10 for ConstructAIQ means:

- **Typography:** Aeonik Pro rendering at every size; MONO used only for numeric data values, series IDs, and timestamps — never for prose or section headers
- **Color:** Amber signals "primary data accent," blue signals "action/forecast," green/red signal "direction" — no role confusion, no phantom palette entries
- **Hierarchy:** One dominant element per screen; forecasting is unmistakably the hero on the dashboard; the homepage hero communicates the product in 5 seconds without scrolling
- **Consistency:** Every card, badge, and label drawn from the same token set; `theme.ts` is the single source of truth with zero inline hex strings in component files
- **Emotional resonance:** The product feels like Revolut Business composure applied to construction data — calm, precise, executive-readable — not a generic SaaS marketing page

---

## Homepage Surface Findings

> Audited files: `src/app/page.tsx` · `src/app/components/HeroSection.tsx` · `src/app/home/HomeTrust.tsx`
> Supporting reads: `HomeHero.tsx` · `HomeRoles.tsx` · `HomeStatusCards.tsx` · `HomeLiveStats.tsx` · `HomeVerdictBanner.tsx`

---

### Scores — Homepage Surface

| Dimension | Score | Key finding |
|-----------|-------|-------------|
| Typography | 4/10 | Aeonik Pro not loaded; MONO used for 13+ all-caps section labels on one page; type-scale tokens bypassed throughout homepage components |
| Color & Palette | 5/10 | Amber doubles as KPI accent *and* warning signal — semantic conflict; blue left-borders on role cards compete with the CTA button color; `HeroSection.tsx` (dark) and `HomeHero.tsx` (light) use incompatible theme bases |
| Spacing & Rhythm | 3/10 | Five different raw vertical padding values across adjacent sections (48/56/64/64/80px); `space.*` tokens unused in every homepage file; mixed raw values inside individual cards |
| Visual Hierarchy | 3/10 | Newsletter section appears before any data evidence; eight equal-weight sections follow the hero; every section uses the identical `TS.label` eyebrow — nothing reads as more important than anything else |
| Emotional Resonance | 4/10 | `grad-text` gradient headline in `HeroSection.tsx`; the actual hero asset (forecast chart) is not visible above the fold; `HomeTrust.tsx` uses generic SaaS copy indistinguishable from thousands of other platforms |

---

### AI Slop Pattern Findings — Homepage

#### ✗ Centered generic SaaS hero
**File:** `src/app/home/HomeHero.tsx:11–108` (rendered via `page.tsx:130`)

Layout: `textAlign: 'center'`, `maxWidth: 800`, centered in viewport. Structure is textbook generic SaaS:

1. All-caps eyebrow label ("CONSTRUCTAIQ")
2. H1 headline
3. Subtitle paragraph
4. Second supporting paragraph
5. Hero KPI number
6. Two stacked CTAs

Every element is center-aligned, equal-width, stacked vertically. There is no asymmetry, no dominant visual object, no data in view. The forecast chart — the product's actual differentiator — does not appear until the user scrolls past four more sections.

`HeroSection.tsx` (lines 132–251) has the stronger layout: a 60/40 split with the live chart on the left and signals rail on the right. It is not used in `page.tsx`.

---

#### ✗ Gradient headline text
**File:** `src/app/components/HeroSection.tsx:143`

```tsx
<span className="grad-text">intelligence platform</span>
```

Gradient text on a hero headline is the single most replicated AI-generated landing page pattern of 2023–2026. The CSS class name `grad-text` confirms the intent. This component is not currently wired into `page.tsx`, but it exists in the codebase and is clearly intended for the hero slot.

---

#### ✗ Generic feature/persona grid
**File:** `src/app/home/HomeRoles.tsx:35–63` (rendered via `page.tsx:133`)

Five cards in `repeat(auto-fill, minmax(280px, 1fr))`. Every card is structurally identical:

```
borderLeft: '3px solid ${color.blue}'  ← same on all five
borderRadius: '0 10px 10px 0'          ← same on all five
padding: '18px 20px'                   ← same on all five
```

Roles covered: Contractors, Suppliers, Lenders, Developers, Public-sector analysts. All receive the same `color.blue` left border at the same weight. A contractor and a public-sector analyst are visually indistinguishable. None of the cards shows actual data or a screenshot — they promise relevance without demonstrating it.

---

#### ✗ Card sameness
**File:** `src/app/home/HomeTrust.tsx:21–84`

Three cards in the `hp-trust` grid (`repeat(3,1fr)`). Computed from the source:

| Property | Card 1 (Data Provenance) | Card 2 (Methodology) | Card 3 (Free Forever) |
|----------|-------------------------|---------------------|----------------------|
| `background` | `WHITE` | `WHITE` | `WHITE` |
| `border` | `1px solid ${BD}` | `1px solid ${BD}` | `1px solid ${BD}` |
| `borderRadius` | `14` | `14` | `14` |
| `padding` | `28px 24px` | `28px 24px` | `28px 24px` |
| Eyebrow style | 11px MONO T3 0.1em | 11px MONO T3 0.1em | 11px MONO T3 0.1em |
| Body text style | 14px SYS T1 600 | 14px SYS T1 600 | 14px SYS T1 600 |

The three cards communicate genuinely different things — data sourcing (verifiable), methodology (technical), and pricing (commercial). They deserve different visual treatments. Currently nothing in the layout signals that "Free Forever" is a stronger differentiator than "Data Provenance."

`HomeStatusCards.tsx` has the same pattern: three `StatusCard` components with identical `borderLeft: '3px solid ${col}'` structure, differing only in the accent color value.

---

#### ✗ All-caps MONO label proliferation
**Files:** All homepage components rendered in `page.tsx`

Inventory of all-caps MONO labels visible in a single homepage scroll:

| Label text | File | Line | Style |
|------------|------|------|-------|
| `CONSTRUCTAIQ` | `HomeHero.tsx` | 20 | `TS.label` |
| `WHO IT IS FOR` | `HomeRoles.tsx` | 33 | `TS.label` |
| `CURRENT MARKET CONDITIONS` | `HomeStatusCards.tsx` | 40 | `TS.label` |
| `LABOR MARKET` | `HomeStatusCards.tsx` via `page.tsx:86` | — | `TS.label` |
| `MATERIAL COSTS` | `HomeStatusCards.tsx` via `page.tsx:94` | — | `TS.label` |
| `ACTIVE PIPELINE` | `HomeStatusCards.tsx` via `page.tsx:101` | — | `TS.label` |
| `Construction Spending` (uppercase via inline) | `HomeLiveStats.tsx` | 27 | inline SYS 10px uppercase |
| `Construction Employment` (uppercase via inline) | `HomeLiveStats.tsx` | 44 | inline SYS 10px uppercase |
| `BUILT ON TRUSTED SOURCES` | `HomeTrust.tsx` | 15 | `TS.label` |
| `DATA PROVENANCE` | `HomeTrust.tsx` | 23 | 11px MONO T3 |
| `METHODOLOGY` | `HomeTrust.tsx` | 45 | 11px MONO T3 |
| `FREE FOREVER` | `HomeTrust.tsx` | 67 | 11px MONO T3 |

**12 all-caps labels** on one page. The `TS.label` style (`fontSize: 11, fontFamily: font.mono, letterSpacing: '0.08em', textTransform: uppercase`) is meant to create visual hierarchy. When it appears 12 times per page at the same weight and color (`T3`), it creates uniform noise instead.

Additionally, `HeroSection.tsx` (if active) would add five more: `"312 DATA SOURCES · 3-MODEL AI ENSEMBLE · LIVE"`, `"TOTAL CONSTRUCTION SPEND · TTLCONS"`, `"12-MO FORECAST"`, `"HOLT-WINTERS / SARIMA / XGBOOST"`, `"LIVE SIGNALS"`.

---

#### ✗ Vague trust/progress claims
**File:** `src/app/home/HomeTrust.tsx:30,39`

```tsx
"38+ official U.S. government and recognized industry sources."
// fallback when stats haven't loaded:
'38+ data sources'
```

**File:** `src/app/components/HeroSection.tsx:137`

```tsx
"312 DATA SOURCES · 3-MODEL AI ENSEMBLE · LIVE"
```

Two claims on the same platform contradict each other: `HomeTrust.tsx` says 38+, `HeroSection.tsx` says 312. Without knowing that "312" refers to individual data series while "38+" refers to source agencies, the user sees a discrepancy that undermines both claims.

`HomeTrust.tsx:97` also falls back to hardcoded stat values when `stats` is null:

```tsx
{ label: 'Cities tracked',      value: stats ? String(stats.cities_tracked) : '40'  },
{ label: 'Satellite MSAs',       value: stats ? String(stats.msas_tracked)   : '20'  },
{ label: 'Gov. data sources',    value: stats ? `${stats.data_sources}+`     : '38+' },
```

These hardcoded fallbacks display as live data. If the API is slow or the page is pre-rendered, users see static numbers that look dynamic.

---

### Spacing Detail — Section Padding Inventory

`page.tsx` sections, top to bottom, with their vertical padding values:

| Section | Top padding | Bottom padding | Source |
|---------|-------------|----------------|--------|
| `HomeRoles` | 56px | 56px | `HomeRoles.tsx:31` |
| Newsletter | 48px | 48px | `page.tsx:135` inline |
| `HomeStatusCards` | 64px | 64px | `page.tsx:138` inline |
| `HomeTrust` | 64px | 64px | `HomeTrust.tsx:13` |
| Final CTA | 80px | 80px | `page.tsx:150` inline |

No two adjacent sections use the same vertical padding. The rhythm has no pattern. The `space.*` token scale (`xs:4, sm:8, md:16, lg:24, xl:32, xxl:48`) is defined in `theme.ts` and used in `status/page.tsx` but not in any homepage component.

---

### Visual Hierarchy Detail — Section Ordering Problem

`page.tsx` renders sections in this sequence after the hero:

```
3. HomeHero       ← establishes the product
4. HomeRoles      ← describes audiences (no data shown)
5. HomeNewsletter ← asks for email ← DATA EVIDENCE HAS NOT APPEARED YET
6. HomeStatusCards← first actual live market data
7. HomeLiveStats  ← second live data surface
8. HomeTrust      ← trust proof
```

The newsletter section (line 134–136) is sandwiched between role cards (no data) and the first live data surface. A user who hasn't seen the data yet is being asked for their email address. This sequence signals "marketing site that captured a template" rather than "data product confident in its own output."

---

## Dashboard Surface Findings

> Audited files: `src/app/dashboard/page.tsx` · `src/app/components/DataTrustBadge.tsx`
> Supporting reads: `DashboardShell.tsx` · `OverviewSection.tsx` · `HeroForecast.tsx` · `VerdictBanner.tsx` · `SectionHeader.tsx` · `KPICard.tsx`

---

### Scores — Dashboard Surface

| Dimension | Score | Key finding |
|-----------|-------|-------------|
| Typography | 5/10 | `TS.kpi` token used correctly for KPI values; `h2` in `SectionHeader`; but 7+ all-caps MONO labels in Overview alone and `fontSize: 9` source lines repeated across three components |
| Color & Palette | 6/10 | Amber/green/blue KPI accent differentiation is clean and semantic; `color.purple` is used only for CSHI Score — a phantom palette entry with no supporting semantic meaning |
| Spacing & Rhythm | 5/10 | `L.sectionGap` and `L.cardPad` tokens used in `OverviewSection`; `HeroForecast` local `Card` wrapper uses raw `"24px 28px"` padding and `borderRadius: 20` against the theme's `cardRadius: 12` |
| Visual Hierarchy | 5/10 | Dashboard correctly defaults to the `forecast` section; but three "primary signal" surfaces compete in Overview before any KPI: `VerdictBanner`, forecast direction chip, and `TOP SIGNAL` banner |
| Component Consistency | 4/10 | Two separate KPI card implementations (`KpiCard` in `OverviewSection.tsx` vs `KPICard.tsx`) with different backgrounds, radii, value sizes, and sparkline libraries; `DataTrustBadge` placed at section top in some sections and card bottom in others |
| Accessibility | 4/10 | `VerdictBanner` has `role="status"` and `aria-label` (good); `SectionHeader` uses `h2` (good); `fontSize: 9` in source lines and SVG axis labels; hover-only chart tooltip has no keyboard access; `KPICard.tsx` accepts emoji icons |

---

### Pattern Findings — Dashboard

---

#### ✗ Too many cards with equal weight
**File:** `src/app/dashboard/sections/OverviewSection.tsx:497–509`

```tsx
<div className="ov-cards">          {/* grid-template-columns: repeat(4,1fr) */}
  orderedCards.map(({ el }) => el)   // 4 cards, all same size
</div>
```

All four KPI cards render at identical sizes with identical `background: color.bg1`, `borderRadius: L.cardRadius`, `border: 1px solid ${color.bd1}`, `padding: L.cardPad`. Construction Spending is the headline series — the one the forecast trains on, the one that drives the Verdict. It receives the same visual weight as CSHI Score (a derived composite index) and Permits (annualized, 59 cities only).

The accent colors differ (`amber` / `green` / `blue` / `purple`) which provides some differentiation. But size and layout are identical, so the differentiation is subtle enough that a new user has no signal about which metric is the platform's primary output.

---

#### ✗ Three competing "primary signal" surfaces in Overview
**Files:** `dashboard/page.tsx:394–396` · `OverviewSection.tsx:431–483`

The Overview view (`activeSection === 'overview'`) renders in sequence:

```
1. VerdictBanner         ← "EXPAND / CONTRACT / WATCH" — full-width colored banner
2. UpcomingReleaseAlert  ← amber calendar chip (conditional)
3. DataTrustBadge        ← freshness status (compact row)
4. Forecast direction chip ← "FORECAST +2.3% growth over 12 months — model estimate"
5. TOP SIGNAL banner     ← amber MONO label + signals[0].title
6. Role note             ← "Optimized for lender decisions" (10px MONO, conditional)
7. 4 KPI cards
```

Before the user sees a single KPI number, they have encountered five distinct "most important thing" surfaces. VerdictBanner and the TOP SIGNAL banner both use `color.amber` for emphasis. The forecast direction chip uses `color.blue`. None of these is visually subordinate to any other. The user cannot identify the primary metric without reading all five.

---

#### ✗ Duplicate KPI card implementations
**Files:** `src/app/dashboard/sections/OverviewSection.tsx:218–264` · `src/app/dashboard/components/KPICard.tsx:1–92`

Two separate KPI card components exist with incompatible specs:

| Property | `KpiCard` (OverviewSection) | `KPICard.tsx` |
|----------|-----------------------------|---------------|
| Background | `color.bg1` | `color.bg2` |
| Border radius | `L.cardRadius` (12) | `16` (raw) |
| Value font size | `TS.kpi.fontSize` (48px) | `22px` (raw) |
| Sparkline | Custom SVG `<polyline>` | `recharts` `LineChart` |
| Source line | 9px MONO below label | Not present |
| Label style | `TS.label` token | Inline MONO 10px uppercase |

A user comparing the Overview section to any section that renders `KPICard.tsx` would see a visually incompatible card. The same KPI concept is expressed at 48px vs 22px, on bg1 vs bg2, with radius 12 vs 16.

---

#### ✗ All-caps MONO label proliferation — Overview section
**File:** `src/app/dashboard/sections/OverviewSection.tsx`

Labels via `TS.label` (which applies `textTransform: uppercase, fontFamily: mono, fontSize: 11`):

| Label | Line | Applied via |
|-------|------|-------------|
| `Construction Spending` | 231 (KpiCard `label` prop) | `TS.label` in KpiCard |
| `Construction Employment` | 366 | `TS.label` in KpiCard |
| `Permits (annualized)` | 381 | `TS.label` in KpiCard |
| `CSHI Score` | 396 | `TS.label` in KpiCard |
| `Construction Spending — 12 Months` | 524 | `TS.label` direct |
| `Live Signals` | 538 | `TS.label` direct |

Plus a manually styled all-caps label:

| Label | Line | Style |
|-------|------|-------|
| `TOP SIGNAL` | 472 | `fontFamily: MONO, fontSize: 10, color: color.amber, letterSpacing: '0.08em'` |

**7 all-caps MONO labels** in a single section, before the user has scrolled once. The `TS.label` style was designed to label a section or a data point — using it on 4 adjacent KPI cards and 2 panel headers in the same view means the label style communicates nothing about relative importance.

---

#### ✗ Inconsistent trust/freshness badge placement and logic
**Files:** `OverviewSection.tsx:420–428` · `HeroForecast.tsx:136–152`

In **OverviewSection**, `DataTrustBadge` is placed at the top of the section before any data:

```tsx
{freshness && (
  <DataTrustBadge
    source="Census Bureau · BLS"
    type="actual"
    status={!freshness.isoDate ? 'unknown' : freshness.isStale ? 'stale' : 'fresh'}
    dataAsOf={freshness.isoDate || undefined}
    // no expanded, no qualityScore, no lastRefreshed, no caveat
  />
)}
```

In **HeroForecast**, `DataTrustBadge` is placed at the bottom of the ForecastChart card:

```tsx
<DataTrustBadge
  source="ConstructAIQ Ensemble (HW · SARIMA · XGBoost)"
  type="forecast"
  status={statusFromAge(fore.runAt)}
  qualityScore={Math.round(fore.metrics.accuracy)}
  lastRefreshed={fore.runAt || undefined}
  caveat={...}
  expanded  // ← different density
/>
```

The two usages differ in: position within the section, `expanded` prop, `qualityScore`, `lastRefreshed`, `caveat`, and status computation logic. The status in OverviewSection is computed inline from `freshness.isStale`; the status in HeroForecast is computed from `statusFromAge(fore.runAt)`. These are different functions with potentially different thresholds. A user encountering both badges on the same dashboard visit cannot build a consistent mental model of what the badge represents.

---

#### ✗ Card sameness — `HeroForecast` local Card wrapper vs theme cardRadius
**File:** `src/app/dashboard/sections/HeroForecast.tsx:36–38`

```tsx
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:BG1, borderRadius:20, border:`1px solid ${BD1}`, padding:"24px 28px", ...style }}>{children}</div>
}
```

`borderRadius: 20` — the theme's `layout.cardRadius` is `12`. The local `Card` wrapper uses a hardcoded `20`, which is also `radius.xl3` but applied without importing or referencing the token. The ForecastChart card visually differs from all Overview KPI cards (radius 12) and all status page cards (radius 12) on the same platform. The discrepancy is subtle but compounds across sections.

---

#### ✗ Low-contrast small labels — repeated at 9px across multiple components
**Files:** `OverviewSection.tsx:232` · `SpendingTrend` in `OverviewSection.tsx:172` · `DataTrustBadge.tsx:119`

```tsx
// OverviewSection.tsx:232 — KpiCard source line
<div style={{ fontFamily: MONO, fontSize: 9, color: color.t4, letterSpacing: '0.06em', marginTop: 3 }}>
  {sourceLine}  // e.g. "Census Bureau · ACTUAL"
</div>

// SpendingTrend x-axis labels (OverviewSection.tsx:172)
<text ... fontSize={9} fill={color.t4} fontFamily={MONO}>

// DataTrustBadge.tsx:119 — status label
<span style={{ fontSize: 9, fontWeight: 700, color: dot, letterSpacing: '0.07em' }}>
  {STATUS_LABELS[status].toUpperCase()}
</span>
```

`fontSize: 9` at `color.t4` (`#6e6e73`) on `color.bg1` (`#0d0d0d`) is a contrast ratio of approximately 3.5:1 — below WCAG AA's 4.5:1 requirement for normal text. The source attribution line in `KpiCard` is the most critical: it tells the user where the data comes from, and it is the least readable text on the card.

---

#### ✗ `color.purple` used for CSHI Score only — phantom palette entry in data context
**Files:** `OverviewSection.tsx:403` · `src/lib/theme.ts:13`

```tsx
// OverviewSection.tsx
accent={color.purple}  // used only for CSHI Score KpiCard
```

`color.purple: '#5e5ce6'` is defined in `theme.ts` but appears in one place in the audited codebase: the CSHI Score card accent. Purple has no documented semantic meaning in the signal or data system. Amber = spending data, Green = employment/positive direction, Blue = forecast/action. Purple = ? The CSHI card stands out from the other three KPI cards not because it's more important, but because its accent color has no established meaning in the visual language.

---

#### ✗ Hover-only tooltip in SpendingTrend — no keyboard access
**File:** `src/app/dashboard/sections/OverviewSection.tsx:179–188`

```tsx
{data.map((_, i) => (
  <rect key={i}
        ...
        fill="transparent"
        onMouseEnter={() => setHovered(i)}
        // no onFocus, no tabIndex, no keyboard handler
        style={{ cursor: 'crosshair' }} />
))}
```

The 12-month spending trend chart's data tooltip is mouse-only. Keyboard and touch users cannot access the month-by-month values. This is the primary data visualization in the Overview section.

---

### Visual Hierarchy Detail — Overview Signal Overload

Before the first KPI number appears in `OverviewSection`, the rendered hierarchy is:

```
VerdictBanner            height: 72px — colored background, MONO "EXPAND" 13px bold
UpcomingReleaseAlert     height: ~37px — amber chip (conditional, from /api/calendar)
DataTrustBadge           height: ~18px — compact trust row
Forecast direction chip  height: ~28px — blue chip "FORECAST +2.3% growth…"
TOP SIGNAL banner        height: ~44px — dark card with amber MONO label
Role note                height: ~16px — 10px MONO t4 text (conditional)
──────────────────────────────────────────────────
4 KPI cards              height: ~130px — the actual data
```

Five layers of context and signal framing before the data. The intent is good — the user should know the market verdict before reading raw numbers. But the execution renders five equally-weighted "intro" elements in sequence, none of which is visually dominant over another.

---

## Trust and Status Surface Findings

> Audited files: `src/app/trust/page.tsx` · `src/app/status/page.tsx`

---

### Scores — Trust and Status Surface

| Dimension | /trust | /status | Key finding |
|-----------|--------|---------|-------------|
| Typography | 4/10 | 6/10 | `/trust` uses raw hex for all text color values; both pages open with a 10px MONO all-caps brand-name eyebrow; `thStyle` 11px `#555` on `#f5f5f5` fails WCAG AA |
| Color & Palette | 3/10 | 7/10 | `/trust` bypasses `theme.ts` entirely — 12 hardcoded hex strings, zero `color.*` imports; `/status` uses theme tokens correctly; cross-page dark/light split with no design bridge |
| Spacing & Rhythm | 5/10 | 6/10 | `/trust` uses consistent `marginBottom: 64` per section but no `space.*` tokens; `/status` uses `space.*` tokens throughout |
| Visual Hierarchy | 4/10 | 6/10 | `/trust`: six prose-heavy sections separated only by a 2px `#eee` H2 border-bottom; `/status`: logical PAR → freshness → source health → env flow, but no back-to-dashboard navigation |
| Component Consistency | 3/10 | 5/10 | `/trust` is fully isolated — no shared components, all callouts identical regardless of content severity; `/status` `KPICard` is a third distinct KPI card implementation |
| Accessibility | 3/10 | 5/10 | `/trust`: left nav `display:none` on `<700px` with no fallback; `thStyle` 11px ≈ 3.5:1 contrast — WCAG AA fail; no `<main>` landmark; `/status`: 10px `color.t4` labels on dark bg ≈ 3.0:1 — WCAG AA fail |

---

### Pattern Findings — Trust and Status

---

#### ✗ Trust Center bypasses theme.ts for all color values
**File:** `src/app/trust/page.tsx:17–63`

`/trust` imports only `font` from `@/lib/theme`. `color` and `space` are not imported. Every color in the file is a raw hex string:

| Style constant | Hex value used | Available theme token |
|---|---|---|
| `prose.color` | `'#333'` | `color.t2` |
| `sectionH2.color` | `'#111'` | `color.t1` |
| `sectionH2.borderBottom` | `'2px solid #eee'` | `color.bd1` |
| `thStyle.background` | `'#f5f5f5'` | `color.bg2` |
| `thStyle.color` | `'#555'` | `color.t3` |
| `calloutStyle.background` | `'#f8f8f8'` | `color.bg2` |
| `calloutStyle.borderLeft` | `'3px solid #aaa'` | `color.bd2` |
| `calloutStyle.color` | `'#444'` | `color.t2` |
| `linkStyle.color` | `'#0a84ff'` | `color.blue` |
| `noteStyle.color` | `'#555'` | `color.t3` |

Any future palette update requires manual edits here. The Trust Center will drift from the rest of the platform at the next theme change.

---

#### ✗ Incompatible dark/light split between /trust and /status
**Files:** `src/app/trust/page.tsx:152` · `src/app/status/page.tsx:375`

```tsx
// trust/page.tsx:152
<div style={{ minHeight: '100vh', background: '#ffffff', color: '#111111' }}>

// status/page.tsx:375
<div style={{ minHeight: '100vh', background: color.bg0, color: color.t1 }}>
```

`/trust` is a pure light-theme page (`#ffffff` background). `/status` is a pure dark-theme page (`color.bg0` = `#000000`). A user navigating from `/status` → `/trust` via the callout links ("check /status for pipeline health") experiences an immediate full-contrast visual reversal. No shared component, badge, card style, or typography treatment bridges the two pages. They read as different products.

---

#### ✗ All callout boxes use the same neutral gray border regardless of content severity
**File:** `src/app/trust/page.tsx:59–64`

```tsx
const calloutStyle: React.CSSProperties = {
  background:  '#f8f8f8',
  border:      '1px solid #e5e5e5',
  borderLeft:  '3px solid #aaa',   // ← always neutral gray
  ...
}
```

The Trust Center uses callouts with very different severity levels, all rendered identically:

| Callout content | Severity | Appropriate accent |
|---|---|---|
| "Caching and fallback: When an upstream API is unavailable…" | Informational | gray — correct |
| "Forecasts are statistical model outputs — not statements of fact." | Critical caveat | amber |
| "These guardrails are design intentions, not a guarantee…" | Critical AI disclaimer | amber |
| "Current PAR values are sourced from live evaluation records" | Reference pointer | blue |

The critical AI guardrails disclaimer looks identical to the neutral reference pointer. Severity is entirely unmarked.

---

#### ✗ Trust page left nav disappears on mobile with no fallback
**File:** `src/app/trust/page.tsx:156–159`

```css
@media (max-width: 700px) {
  .tc-nav { display: none !important; }
}
```

On any viewport under 700px — all phones, most tablets in portrait — the six-section navigation vanishes. No replacement: no sticky header row, no `<select>` dropdown, no back-to-top link, no contents anchor. A user on a tablet trying to navigate from "Limitations" back to "AI Guardrails" must scroll blind. (Also documented in `UX_HEURISTICS_AUDIT.md` M2.)

---

#### ✗ Three incompatible freshness vocabularies — trust docs compound the confusion
**Files:** `src/app/trust/page.tsx:431–513` · `src/app/status/page.tsx:111–115` · `src/app/components/DataTrustBadge.tsx:13–19`

The Freshness section of `/trust` defines four status labels: **Fresh** / **Stale** / **Delayed** / **Unknown**.

The Source Health section of `/trust` (lines 489–507) introduces a second, separate vocabulary for pipeline run states: **Fresh** / **Degraded** / **Failed** / **Skipped** / **Unknown**.

The Data Freshness table on `/status` uses a third vocabulary:

```tsx
const STATUS_DOT = {
  ok:    { label: 'Current' },   // not in DataTrustBadge or trust docs
  warn:  { label: 'Aging'   },   // not in DataTrustBadge or trust docs
  stale: { label: 'Stale'   },
}
```

**"Aging"** exists only on `/status`. A user who reads the Trust Center to understand what "Aging" means in the Data Freshness table will not find the term. This directly contradicts the Trust Center's stated purpose: *"to give users a complete and honest picture of what they are looking at."*

---

#### ✗ Raw database category keys displayed in Source Health per-row cells
**File:** `src/app/status/page.tsx:756–758`

```tsx
<td style={{ fontFamily: font.mono, fontSize: 11, color: color.t4 }}>
  {row.category}   // renders: "government_data", "federal", "permits", "ai"
</td>
```

Section headers correctly apply `CATEGORY_LABELS[cat]` (line 695): `government_data` → "Government Data". But every data row renders the raw key. Operators reading the table see "government_data" next to "Census Bureau Construction Spending." The fix is one expression: `CATEGORY_LABELS[row.category] ?? row.category`. (Also documented in `UX_HEURISTICS_AUDIT.md` mn3.)

---

#### ✗ Brand-name eyebrow above H1 on both transparency pages
**Files:** `src/app/trust/page.tsx:207` · `src/app/status/page.tsx:390`

```tsx
// trust/page.tsx:207
<div style={{ fontFamily: MONO, fontSize: 10, color: '#888', textTransform: 'uppercase' }}>
  ConstructAIQ
</div>

// status/page.tsx:390
<div style={{ fontFamily: font.mono, fontSize: 11, color: color.t4, textTransform: 'uppercase' }}>
  ConstructAIQ
</div>
```

Both pages open with "ConstructAIQ" as the all-caps MONO eyebrow. The user is already on ConstructAIQ. The first visual hierarchy slot above the H1 states the brand name the user already knows. Something like "DATA TRANSPARENCY" or "PLATFORM STATUS" would orient without restating the obvious. This is the same finding as `UX_HEURISTICS_AUDIT.md` mn1 and the homepage audit, now confirmed across all four audited pages.

---

### Accessibility Detail — /trust contrast failures

`thStyle` in `trust/page.tsx:38–44` renders table column headers at `fontSize: 11`, `color: '#555'`, on `background: '#f5f5f5'`.

- `#555555` on `#f5f5f5` = contrast ratio ≈ **3.5:1**
- WCAG AA minimum for text under 18px = **4.5:1**
- Result: **FAIL** — all four column headers in the Data Sources summary table

`noteStyle` at `fontSize: 12`, `color: '#555'` on `#ffffff` table body = ≈ 5.9:1 — **passes**.

---

### Accessibility Detail — /status contrast at 10px

KPI card labels, table column headers, entity graph labels, and Source Health category row labels in `/status` use `fontSize: 10` with `color: color.t4` (`#6e6e73`) on `color.bg2` (`#1c1c1e`).

- `#6e6e73` on `#1c1c1e` = contrast ratio ≈ **3.0:1**
- WCAG AA minimum = **4.5:1**
- Result: **FAIL** — all 10px labels throughout the status page

Status badge text at 11px uses the dot color directly (`color: badge.bg`). Green (`#34c759`) and amber (`#f59e0b`) on `#0d0d0d` both pass (≈ 7:1+). Gray `#888` for skipped/unknown on `#0d0d0d` ≈ 3.8:1 — **fails**.

---

## Notes / Open Questions

> **TODO:** Capture open questions and deferred decisions as the audit progresses.

- Is `HeroSection.tsx` still active or superseded by `HomeHero.tsx`? (Both exist; only `HomeHero` is imported in `page.tsx`)
- The theme defines `type.hero` at 88px but no audited component uses it — is this intentional?
- `gradOrange` and `gradGreen` are defined in `theme.ts` but not found in the audited files — are they used elsewhere or leftover?
- Should `DataTrustBadge` use `font.sys` for source names and cadence (currently full MONO)?
- Confirm whether the `gstack-SKIL.md` skill file should be created before the next audit pass
