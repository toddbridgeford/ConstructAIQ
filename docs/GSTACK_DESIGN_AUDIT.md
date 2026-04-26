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

> **TODO:** Complete after full audit pass.

| Dimension | Score (1–10) | Key finding |
|-----------|-------------|-------------|
| Typography | — | |
| Color & Palette | — | |
| Spacing & Rhythm | — | |
| Visual Hierarchy | — | |
| Component Consistency | — | |
| Accessibility | — | |
| Motion & Interaction | — | |
| Emotional Resonance | — | |
| **Overall** | **—** | |

---

## AI Slop Patterns

> **TODO:** List specific file locations and line numbers for each pattern found.

Patterns to check for:

- [ ] Generic feature/persona grids (equal-weight cards, no visual differentiation)
- [ ] Card sameness (same structure, same radius, same eyebrow across unrelated content)
- [ ] All-caps MONO label proliferation (overused as section eyebrows and status labels)
- [ ] Vague trust/progress claims ("38+ sources", "3-model AI", "LIVE")
- [ ] Overused or decorative gradients (gradient text, gradient backgrounds)
- [ ] Centered generic SaaS hero patterns (eyebrow + H1 + subtitle + two CTAs)
- [ ] Stat-stuffed eyebrows (numbers used to imply authority without context)
- [ ] Duplicate CTAs across a single page
- [ ] Newsletter capture before value demonstration

---

## Priority Fixes

> **TODO:** Rank top fixes by user impact once audit is complete.

| Priority | Fix | File | Rationale |
|----------|-----|------|-----------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

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

## Notes / Open Questions

> **TODO:** Capture open questions and deferred decisions as the audit progresses.

- Is `HeroSection.tsx` still active or superseded by `HomeHero.tsx`? (Both exist; only `HomeHero` is imported in `page.tsx`)
- The theme defines `type.hero` at 88px but no audited component uses it — is this intentional?
- `gradOrange` and `gradGreen` are defined in `theme.ts` but not found in the audited files — are they used elsewhere or leftover?
- Should `DataTrustBadge` use `font.sys` for source names and cadence (currently full MONO)?
- Confirm whether the `gstack-SKIL.md` skill file should be created before the next audit pass
