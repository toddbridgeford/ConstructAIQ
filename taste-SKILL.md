# Taste Skill — Parametric Design Control

**Source:** Leonxlnx/taste-skill — `github.com/Leonxlnx/taste-skill`
**Install:** `npx skills add https://github.com/Leonxlnx/taste-skill`
**Trigger:** Any UI design or frontend code task. Parameters can be set in the prompt.

-----

## Purpose

Control the boldness, motion, and density of Claude’s design output using three explicit parameters — like an equalizer for visual design decisions. Default to the parameters set below unless the user specifies otherwise.

-----

## The Three Parameters

Set these at the start of any design session. If not specified by the user, use the **ConstructAIQ defaults** defined below.

-----

### DESIGN_VARIANCE (1–10)

Controls how far the layout deviates from convention.

|Value|What it produces                                                                 |
|-----|---------------------------------------------------------------------------------|
|1–2  |Centered, symmetric, grid-aligned. Safe. Predictable. Forgettable.               |
|3–4  |Clean layouts with minor asymmetry. Conventional card grids.                     |
|5–6  |Intentional asymmetry. Some grid-breaking. Typography does work.                 |
|7–8  |Bold compositions. Asymmetric grids. Typography as layout element. Diagonal flow.|
|9–10 |Maximalist. Overlapping layers. Broken grids. Composition-first.                 |

**When to increase:** Brand pages, portfolios, landing pages, marketing sections.
**When to decrease:** Data dashboards, admin tools, dense information displays.

**ConstructAIQ homepage default: 6** — Distinctive without alienating construction professionals.
**ConstructAIQ dashboard default: 4** — Clean and functional; data must be legible.

-----

### MOTION_INTENSITY (1–10)

Controls how much animation and transition work is applied.

|Value|What it produces                                                                      |
|-----|--------------------------------------------------------------------------------------|
|1–2  |Simple hover color changes. No entrance animations. Instant state transitions.        |
|3–4  |Subtle hover shadows and transforms. 150ms transitions on state changes.              |
|5–6  |Staggered entrance animations. Scroll-triggered reveals. Meaningful loading sequences.|
|7–8  |Magnetic hover effects. Parallax. Chart draw animations. Progress animations.         |
|9–10 |Full orchestration. Everything moves with intent. Cursor-reactive elements.           |

**Performance note:** Values above 6 require `will-change`, `transform`, and GPU-composited properties to avoid layout thrashing. Never animate `width`, `height`, `top`, `left`, or `margin` directly.

**ConstructAIQ homepage default: 3** — The platform serves real-time data. Motion should reinforce data arrival, not decorate the shell.
**ConstructAIQ dashboard default: 2** — Data loads and chart renders are the motion. UI chrome should be still.

-----

### VISUAL_DENSITY (1–10)

Controls spacing, information per screen, and component compactness.

|Value|What it produces                                                   |
|-----|-------------------------------------------------------------------|
|1–2  |Luxury spacing. 80–120px vertical sections. One idea per screen.   |
|3–4  |Editorial spacing. Clear breathing room. 48–64px section gaps.     |
|5–6  |Balanced. Cards with 24px padding. Standard SaaS density.          |
|7–8  |Dense information display. 16px card padding. Small type. Tables.  |
|9–10 |Terminal-grade density. Bloomberg-style. Maximum data per viewport.|

**ConstructAIQ homepage default: 4** — Open, credible, not cluttered. Data platform, not a data terminal.
**ConstructAIQ dashboard default: 7** — Construction professionals need dense data. Every pixel should earn its place.

-----

## ConstructAIQ Default Parameters

These apply to all ConstructAIQ design work unless overridden in the prompt:

```
Homepage:
  DESIGN_VARIANCE:   6
  MOTION_INTENSITY:  3
  VISUAL_DENSITY:    4

Dashboard:
  DESIGN_VARIANCE:   4
  MOTION_INTENSITY:  2
  VISUAL_DENSITY:    7

Marketing / Feature pages:
  DESIGN_VARIANCE:   7
  MOTION_INTENSITY:  4
  VISUAL_DENSITY:    4
```

To override, include in your prompt:

```
Design this with:
  DESIGN_VARIANCE:  8
  MOTION_INTENSITY: 5
  VISUAL_DENSITY:   3
```

-----

## Typography Rules by Parameter

DESIGN_VARIANCE determines font selection:

|Variance|Font guidance                                                                      |
|--------|-----------------------------------------------------------------------------------|
|1–4     |System font stack acceptable. Inter permitted only if used with weight variation.  |
|5–6     |A display/heading font distinct from body. Google Fonts permitted if not overused. |
|7–8     |Opinionated pairing. Serif/sans contrast, or condensed display with geometric body.|
|9–10    |Typography IS the layout. Variable fonts, oversized display type, type as texture. |

**Banned at all variance levels:**

- Inter, Roboto, Arial, or Space Grotesk as the *only* font
- “font-weight: 700” as the only emphasis mechanism
- Default browser font stack for brand/marketing surfaces

**ConstructAIQ current fonts:** Mono labels + sans body — acceptable at variance 4–6. For the homepage redesign (variance 6), add a distinct display font for the hero headline.

-----

## Color Rules by Parameter

DESIGN_VARIANCE determines color boldness:

|Variance|Color guidance                                                                      |
|--------|------------------------------------------------------------------------------------|
|1–4     |Neutral palette. One accent. Semantic colors (green/red/amber) for status only.     |
|5–6     |Defined palette with CSS variables. Dominant color + 1–2 accents.                   |
|7–8     |Color as design element. Background colors used in sections. Strong contrast ratios.|
|9–10    |Color as brand. Unexpected combinations. Gradient meshes. Color tells a story.      |

-----

## Motion Rules by Parameter

MOTION_INTENSITY determines what to animate:

|Intensity|Implement                                                                           |
|---------|------------------------------------------------------------------------------------|
|1–2      |`transition: color 150ms, background 150ms` on interactive elements only            |
|3–4      |Add `transform: scale(1.02)` on card hover. `transition: all 200ms ease` on buttons.|
|5–6      |`@keyframes` entrance for above-fold content. Stagger with `animation-delay`.       |
|7–8      |Intersection Observer for scroll-triggered reveals. Chart draw animations.          |
|9–10     |RequestAnimationFrame cursor tracking. Spring physics (react-spring or Framer).     |

**Always use:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

-----

## Spacing Scale by Parameter

VISUAL_DENSITY maps to a spacing scale:

|Density|Base unit|Card padding|Section gap|Body font|
|-------|---------|------------|-----------|---------|
|1–2    |8px      |48px        |120px      |16–18px  |
|3–4    |8px      |32px        |80px       |15–16px  |
|5–6    |4px      |24px        |64px       |14–15px  |
|7–8    |4px      |16px        |48px       |13–14px  |
|9–10   |2px      |8px         |24px       |11–12px  |

-----

## Execution Rules

Before writing any code for a design task:

1. **State the parameters** — explicitly declare DESIGN_VARIANCE, MOTION_INTENSITY, and VISUAL_DENSITY at the top of the response.
1. **Commit to a direction** — one sentence describing the aesthetic: “Dark editorial with amber accents, minimal motion, Bloomberg-dense KPIs.”
1. **Font selection** — name the fonts before writing CSS.
1. **Color palette** — list the 5–7 colors with their semantic roles before writing CSS.
1. **Write code** — implement all choices consistently.

Never ask “what style do you want?” without context. If parameters are not specified, use the ConstructAIQ defaults and state them explicitly.

-----

## Anti-Patterns (Always Flag)

Regardless of parameter values, never produce:

- Purple-to-blue gradient hero sections
- `border-radius: 12px` + `box-shadow: 0 2px 8px rgba(0,0,0,0.1)` cards as the default
- `padding: 20px` (not on a 4px grid)
- Centered hero with H1 + subtitle + two buttons + stock illustration (the AI landing page template)
- `font-family: 'Inter', sans-serif` as the only font choice
- `color: #6b7280` muted text on `#ffffff` without checking contrast
- Decorative gradient overlays on images that serve no semantic purpose