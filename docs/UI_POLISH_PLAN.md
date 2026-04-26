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

_To be populated from GSTACK audit findings._

---

## Spacing and Density Rules

_To be populated from GSTACK audit findings._

---

## Motion Rules

_To be populated from GSTACK audit findings._

---

## Top 10 UI Changes Ranked by Impact

_To be populated from GSTACK Priority Fixes table._

---

## What Not to Change

_To be populated — components and patterns confirmed working well._

---

## Validation Checklist

_To be populated — pre-commit checks for each polish change._
