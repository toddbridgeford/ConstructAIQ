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

## Notes / Open Questions

> **TODO:** Capture open questions and deferred decisions as the audit progresses.

- Is `HeroSection.tsx` still active or superseded by `HomeHero.tsx`? (Both exist; only `HomeHero` is imported in `page.tsx`)
- The theme defines `type.hero` at 88px but no audited component uses it — is this intentional?
- `gradOrange` and `gradGreen` are defined in `theme.ts` but not found in the audited files — are they used elsewhere or leftover?
- Should `DataTrustBadge` use `font.sys` for source names and cadence (currently full MONO)?
- Confirm whether the `gstack-SKIL.md` skill file should be created before the next audit pass
