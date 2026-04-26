# GStack — Design Rating Skill

**Author:** Adapted from Garry Tan (Y Combinator)
**Install:** `git clone https://github.com/garrytan/gstack.git && cp -r gstack/.claude/skills/gstack ~/.claude/skills/`
**Trigger:** “rate this design”, “score my UI”, “design review”, “gstack audit”, “AI slop check”

-----

## Purpose

Rate every dimension of a UI design on a scale of 0–10. For each dimension, explain what a 10 looks like and the exact steps to get there. Detect and flag generic AI-generated design patterns that reduce perceived quality.

-----

## Activation

This skill activates automatically when you:

- Ask for a design rating or score
- Mention “AI slop” in the context of a UI
- Ask “why does this look generic?” or “how do I improve this?”
- Share a screenshot, URL, or code for visual review

**Always ask for confirmation before applying suggested changes.**

-----

## The 8 Rating Dimensions

Rate each dimension 0–10. Then provide an overall score (weighted average) and a priority fix list ordered by impact.

### 1. Typography (weight: 20%)

|Score|What it means                                                                                                                                                |
|-----|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
|0–3  |Inter, Roboto, or Arial at default weights. No typographic hierarchy. Body and label text identical.                                                         |
|4–6  |Some size differentiation. Still a generic system font. No display/body contrast.                                                                            |
|7–8  |Distinctive font pairing. Clear hierarchy between headings, labels, body, and captions.                                                                      |
|9–10 |Editorial-grade typography. Display font creates immediate brand recognition. Variable weights used intentionally. Mono font deployed for data/code contexts.|

**A 10 looks like:** A construction intelligence platform using a condensed editorial font for KPI labels, a geometric sans for body, and a monospaced font for data values — three distinct voices, one coherent system.

**Common failures:**

- Inter at 14px for both labels and body (zero hierarchy)
- Bold used as the only emphasis mechanism
- Line-height not adjusted per size (tight on large, loose on small)

-----

### 2. Color & Palette (weight: 20%)

|Score|What it means                                                                                                        |
|-----|---------------------------------------------------------------------------------------------------------------------|
|0–3  |Purple-on-white or blue gradient. Colors picked from default palette. No semantic meaning.                           |
|4–6  |Consistent primary color but inconsistent application. No semantic layer (green = success, red = error not enforced).|
|7–8  |Defined palette with CSS variables. Semantic colors used consistently. Dark/light mode considered.                   |
|9–10 |Color as storytelling. Dominant + accent + semantic system. Every color choice is defensible. Passes WCAG AA.        |

**A 10 looks like:** Black background with a single amber accent used exclusively for primary actions and current values. Green = positive signal. Red = risk. Blue = forecast. No color used for more than one semantic purpose.

**Common failures:**

- Same color for both selected state and positive sentiment
- Amber/orange used for both warning AND primary CTA
- Background color doesn’t change between states (active vs inactive)

-----

### 3. Spacing & Rhythm (weight: 15%)

|Score|What it means                                                                                                                                                  |
|-----|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
|0–3  |Inconsistent padding. Random pixel values. No visual baseline.                                                                                                 |
|4–6  |Some consistency but breaks between components. Cards have different internal padding.                                                                         |
|7–8  |4px or 8px grid used consistently. Section spacing larger than component spacing.                                                                              |
|9–10 |Mathematical spacing scale (4, 8, 12, 16, 24, 32, 48, 64). Negative space used as a design element. Breathing room creates hierarchy without explicit dividers.|

**Common failures:**

- `padding: 20px` — not on the grid
- KPI card padding different from content card padding
- Section gaps equal to component gaps (no visual hierarchy)

-----

### 4. Visual Hierarchy (weight: 20%)

|Score|What it means                                                                                                                                        |
|-----|-----------------------------------------------------------------------------------------------------------------------------------------------------|
|0–3  |Everything is the same visual weight. The eye has nowhere to go.                                                                                     |
|4–6  |Some elements are larger. Primary CTA visible but competing with secondary content.                                                                  |
|7–8  |Clear 3-level hierarchy: primary (what to do), secondary (context), tertiary (details).                                                              |
|9–10 |Eye path is engineered. Primary metric or action is undeniably dominant. Everything else recedes. User knows exactly where to look in under 1 second.|

**Common failures:**

- 6 KPI cards at equal visual weight (user scans all 6 before deciding what matters)
- CTA button same size as nav links
- Error state same visual weight as success state

-----

### 5. Component Consistency (weight: 10%)

|Score|What it means                                                                                             |
|-----|----------------------------------------------------------------------------------------------------------|
|0–3  |Buttons styled differently across pages. Border radius inconsistent. Cards have 3 different shadow styles.|
|4–6  |Most components consistent but edge cases break the pattern.                                              |
|7–8  |Design system enforced. New components built from existing tokens.                                        |
|9–10 |Every component is a composable primitive. The whole UI feels like one object, not an assembly.           |

**Common failures:**

- Dashboard cards use `border-radius: 12px`, modal uses `border-radius: 8px`
- Primary button uses `color.blue`, a different section uses a hex value for blue
- Icon sizes not from a defined scale (14, 16, 18, 20 all appear)

-----

### 6. Accessibility & Contrast (weight: 5%)

|Score|What it means                                                                                                                         |
|-----|--------------------------------------------------------------------------------------------------------------------------------------|
|0–3  |Text fails WCAG AA. Color is the only indicator of status. No focus states.                                                           |
|4–6  |Body text passes. But muted labels, ghost buttons, and placeholder text fail.                                                         |
|7–8  |All text passes WCAG AA (4.5:1). Interactive elements have visible focus rings.                                                       |
|9–10 |WCAG AA on all text including muted labels. Non-color indicators (icons, shapes) for status. Keyboard navigable. Screen reader tested.|

**Quick test:**

- `color.t4` (#6e6e73) on `color.bg0` (#000): passes AA ✓
- `color.t4` on `color.bg1` (#0d0d0d): calculate contrast ratio

-----

### 7. Motion & Interaction (weight: 5%)

|Score|What it means                                                                                                                           |
|-----|----------------------------------------------------------------------------------------------------------------------------------------|
|0–3  |No transitions. State changes are instant and jarring.                                                                                  |
|4–6  |Some hover states. Loading spinners. No entrance animations.                                                                            |
|7–8  |Consistent transition duration (150–200ms). Meaningful loading states. Skeleton screens.                                                |
|9–10 |Motion serves meaning. Data loading feels alive, not janky. Hover states give feedback. Transitions between states are never surprising.|

**Common failures:**

- `transition: all 0.3s` (too broad, animates layout properties)
- No skeleton state — content pops in
- Hover state: color change only, no scale or shadow

-----

### 8. Emotional Resonance (weight: 5%)

|Score|What it means                                                                                                                                                     |
|-----|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|0–3  |Looks like it was assembled from a component library. No personality. Could be any SaaS product.                                                                  |
|4–6  |Some personality in color or typography but other elements undermine it.                                                                                          |
|7–8  |The design has a point of view. A professional in the industry would find it credible.                                                                            |
|9–10 |The design is *about* something. Opening it creates a specific emotional response: confidence, urgency, clarity, trust. It could not be mistaken for a competitor.|

-----

## AI Slop Detection

**Run this check on every design review.** Flag any of the following as “AI Slop Pattern” with severity HIGH:

|Pattern                                                            |Why It’s Slop                          |Fix                                                                          |
|-------------------------------------------------------------------|---------------------------------------|-----------------------------------------------------------------------------|
|Purple/blue gradient hero on white                                 |Default AI output for “landing page”   |Commit to a specific palette; gradients should be intentional, not decorative|
|Inter or Roboto at all sizes                                       |AI defaults to the most common web font|Choose a font with personality; ban Inter from headings                      |
|3-column “Features” grid with icon + title + 2-sentence description|Default AI landing page structure      |Break the grid; use hierarchy, not uniformity                                |
|Cards with `border-radius: 12px` + subtle `box-shadow` everywhere  |Default “modern” card pattern          |Use shadow sparingly; reserve radius for interactive elements                |
|All-caps labels in a muted color above content                     |Overused AI pattern                    |Use positional hierarchy instead; not everything needs a label               |
|Empty state: centered icon + title + single paragraph              |Default empty state                    |Make empty states actionable and specific to the context                     |
|Gradient CTA button (blue-to-purple)                               |AI’s default “important button”        |Solid color button with strong type; gradient = decoration                   |
|Progress bar for “trust indicators”                                |AI-generated social proof pattern      |Real data beats progress bars (actual user counts, specific metrics)         |

-----

## Output Format

For each design review, output:

```
GSTACK DESIGN AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Typography:          X/10
Color & Palette:     X/10
Spacing & Rhythm:    X/10
Visual Hierarchy:    X/10
Component Consistency: X/10
Accessibility:       X/10
Motion & Interaction: X/10
Emotional Resonance: X/10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL:             X/10

AI SLOP PATTERNS DETECTED:
[List each pattern found with file:line if code is available]

PRIORITY FIXES (ordered by score impact):
1. [Dimension] — [Specific change] — [Expected score increase]
2. ...

WHAT A 10 LOOKS LIKE FOR THIS PRODUCT:
[One paragraph describing the ideal version of this specific UI]
```

-----

## Workflow Rules

1. **Always rate before suggesting fixes.** Never suggest a change without first establishing the current score.
1. **Be specific.** “Typography is weak” is not useful. “The CSHI label at 10px and the KPI value at 72px are the only two sizes in the hierarchy — add a 14px body size to create a 3-level system” is useful.
1. **Ask for confirmation before applying any visual changes to code.**
1. **Rate the design as it actually is, not as it was intended.** Judge what a user sees, not what the developer meant to build.
1. **Flag AI slop patterns without softening the diagnosis.** Slop is slop. Name it directly.