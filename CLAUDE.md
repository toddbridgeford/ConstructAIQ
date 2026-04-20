# ConstructAIQ — Claude Code Project Brief

## Non-negotiables
- Follow Apple Human Interface Guidelines for layout, hierarchy, spacing, adaptability, safe areas, and iOS-native interaction patterns.
- Use Aeonik Pro throughout the project as the primary typeface.
- Do not use AI-generated templating aesthetics.
- Do not use canned dashboard color schemes.
- The UX should feel modern, impactful, calm, premium, and operationally credible.
- The UX should resemble the composure and clarity of Revolut Business without copying its UI.
- Use Mastt only as a structural reference for construction forecasting UX. Do not copy layouts, styling, or components.

## Product summary
ConstructAIQ is a premium construction intelligence platform.
It aggregates public construction and macroeconomic data, normalizes it into a unified time-series system, and surfaces:
- forecasts
- anomaly signals
- state activity
- materials intelligence
- scenario analysis
- decision-ready dashboard views

## Core value proposition
ConstructAIQ helps construction leaders forecast market risk, cost pressure, labor volatility, and activity shifts earlier, so they can act before projects, capital plans, or margins drift.

## Brand and design direction
The product should feel like:
- Apple-grade clarity
- Revolut Business composure
- premium dark UI
- executive-readable construction intelligence
- calm, not flashy
- decisive, not noisy

Avoid:
- terminal cosplay
- Bloomberg imitation as a visual style
- generic enterprise admin dashboards
- rainbow chart palettes
- over-signaled AI widgets
- cluttered nav chrome
- too many equal-weight cards on one page

## Current repo diagnosis
The existing product concept is strong, but the UI is inconsistent.
Problems already identified:
- typography is inconsistent across layout.tsx, globals.css, and theme.ts
- Aeonik Pro is not the single active typographic system yet
- the homepage is over-sectioned and gives too many areas equal visual weight
- the dashboard uses too much chrome (ticker, strip, terminal framing)
- forecast content is strong but not yet presented as a premium hero experience
- diagnostics and supporting modules compete too much with primary insight

## Experience principles
- One screen should communicate one primary decision.
- One major section should have one dominant visual.
- Controls should support content, not compete with it.
- Forecasting is the hero capability.
- Signals, states, materials, and news are supporting layers.
- AI must always be explainable and source-aware.
- Confidence, freshness, and context should accompany predictive outputs.
- If a screen feels crowded, reduce panel count before adding polish.

## Story hierarchy for the marketing site
The website should communicate this sequence:
1. Forecast construction risk earlier
2. See what changed and why
3. Compare scenarios before committing capital
4. Trust the signal through explainable models and confidence ranges
5. Act through decision-ready views

## Homepage structure
Preferred order:
1. top navigation
2. hero with one dominant product visual
3. trust/proof strip
4. three outcome cards
5. platform showcase
6. forecasting deep-dive
7. use cases
8. final CTA

Rules:
- lead with product UI, not stock construction imagery
- one dominant forecast chart in the hero visual
- one supporting insight rail
- supporting sections must be visually quieter than the hero
- reduce testimonial and source noise

## Dashboard structure
Preferred order:
1. page header
2. KPI row
3. hero forecast chart
4. AI explanation / top signals rail
5. supporting modules below
6. detail views or drill-down areas

Rules:
- demote or remove terminal-style ticker dominance
- demote diagnostics like feed status
- enlarge the hero forecast chart
- keep only one primary insight region above the fold
- do not let signals, states, prices, and news compete equally with the forecast

## Forecast screen rules
Keep:
- historical line
- forecast line
- confidence bands
- model context

Add or strengthen:
- previous forecast comparison
- driver annotation
- summary metadata
- explanation of what changed and why
- scenario controls near the chart

Simplify:
- legends
- visual noise
- technical clutter

## Scenario design rules
The scenario builder should feel like a strategic planning tool, not a utility widget.
Requirements:
- place it beside or below the hero forecast chart
- improve slider presentation and spacing
- support scenario presets
- show instant delta impact
- summarize effects clearly

## Mobile and iPhone rules
- do not compress desktop layouts into mobile
- briefing-first layout
- one main chart per screen section
- move advanced controls into sheets
- preserve safe areas and touch targets
- follow Apple HIG reachability and hierarchy expectations

## Typography rules
Aeonik Pro is the primary typeface for:
- page titles
- section headings
- KPI numerals
- navigation labels
- chart titles
- marketing headlines

Use mono only when it truly improves technical readability.
Do not let mono dominate the product's visual tone.

## Coding rules
When implementing UI:
- create reusable layout primitives
- create reusable card components
- create reusable chart containers
- use design tokens for spacing, color, radius, shadows, and type
- remove one-off inline styling where practical
- keep components visually consistent across screens
- choose elegance over density unless explicitly told otherwise
- choose usability over novelty
- choose trust over AI spectacle

## Repo-specific execution order
1. Refactor typography across:
   - src/app/layout.tsx
   - src/app/globals.css
   - src/lib/theme.ts
2. Establish a consistent tokenized design system.
3. Redesign the homepage in src/app/page.tsx.
4. Redesign the dashboard shell in src/app/dashboard/page.tsx.
5. Redesign forecast and scenario modules.
6. Redesign supporting modules to be quieter and more coherent.
7. Review everything against Apple HIG, Revolut Business-like composure, and Aeonik Pro consistency.

## Working style
Before coding a screen:
1. identify the primary user decision
2. define the hero content
3. define supporting content
4. simplify hierarchy
5. identify components to reuse or rebuild
6. implement
7. self-review for spacing, hierarchy, and polish

Do not decorate the existing UI. Recompose it.
