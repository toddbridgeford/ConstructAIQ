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

_To be populated from GSTACK audit findings._

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
