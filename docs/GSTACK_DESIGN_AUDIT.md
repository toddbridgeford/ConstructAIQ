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

## AI Slop Patterns Detected

Nine patterns checked across homepage, dashboard, trust, and status surfaces.

---

### 1. Generic feature/persona grids

**Status:** PRESENT · **Severity:** HIGH

**File:** `src/app/home/HomeRoles.tsx:36–62` (rendered at `src/app/page.tsx:132`)

```tsx
// HomeRoles.tsx:37–47 — every card is structurally identical
gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
// All five cards:
borderLeft:   `3px solid ${color.blue}`   // same on all five
borderRadius: '0 10px 10px 0'             // same on all five
padding:      '18px 20px'                 // same on all five
background:   BG                          // same on all five
```

Five cards for Contractors, Suppliers, Lenders, Developers, and Public-sector analysts. Every card has the same blue left-border at the same weight, the same background, the same padding, and the same two-line text layout. A contractor and a public-sector analyst are visually indistinguishable. No card shows actual data. All five promise relevance without demonstrating it.

**Fix:** Replace the grid with a role-indexed data preview. Each card shows one live stat specific to that role — Contractors see permit volume, Lenders see current rate + CSHI change, Suppliers see the top material signal. If the data isn't ready, the card can say so explicitly. A data product earns trust by showing data, not by describing itself.

---

### 2. Card sameness

**Status:** PRESENT · **Severity:** MEDIUM

**File:** `src/app/home/HomeTrust.tsx:21–84`

```tsx
// All three cards share the same spec — pixel-identical layout:
background:   WHITE         // card 1, 2, 3
border:       `1px solid ${BD}`
borderRadius: 14
padding:      '28px 24px'
// eyebrow:  fontSize:11, fontFamily:MONO, color:T3, letterSpacing:'0.1em'
// body:     fontSize:14, fontFamily:SYS, color:T1, fontWeight:600
```

The three cards carry meaningfully different messages — "Data Provenance" (verifiability), "Methodology" (technical rigor), "Free Forever" (pricing). They receive identical visual treatment. "Free Forever" is the platform's strongest commercial differentiator and the most unexpected claim for a data product. It looks exactly like the provenance card next to it.

**Fix:** Give "Free Forever" one distinguishing visual property — an amber accent on the border-left, or a slightly elevated background — to signal that it is the hero claim of the three. The other two cards can remain neutral.

---

### 3. All-caps muted labels everywhere

**Status:** PRESENT · **Severity:** HIGH

**Files:** All homepage components · `src/app/dashboard/sections/OverviewSection.tsx` · `src/app/trust/page.tsx` · `src/app/status/page.tsx`

`TS.label` (`fontSize:11, fontFamily:font.mono, letterSpacing:'0.08em', textTransform:'uppercase'`) is the intended style for a single hierarchical accent — one per section. Current usage:

| Surface | Count | Example labels |
|---|---|---|
| Homepage (one scroll) | 12 | CONSTRUCTAIQ, WHO IT IS FOR, DATA PROVENANCE, FREE FOREVER, BUILT ON TRUSTED SOURCES… |
| Dashboard Overview | 7 | CONSTRUCTION SPENDING, LIVE SIGNALS, TOP SIGNAL, CONSTRUCTION EMPLOYMENT… |
| /trust header | 1 | ConstructAIQ (brand eyebrow) |
| /status header | 1 | ConstructAIQ (brand eyebrow) |

When the same label style appears 12 times on a single page at the same `color.t3` weight, it communicates nothing about hierarchy. Every element reads at equal importance, which is the same as no hierarchy at all.

**Fix:** Reserve `TS.label` for two uses only: (1) KPI data labels directly above a numeric value, and (2) a single section eyebrow that names the section type. Remove it from card eyebrows inside trust/provenance cards, from page-header brand labels, and from navigation items. Replace section eyebrows with `type.h3` in `font.sys` where the label is a section title rather than a data category.

---

### 4. Vague trust/progress claims

**Status:** PRESENT · **Severity:** MEDIUM

**Files:** `src/app/home/HomeTrust.tsx:30,39,94–97` · `src/app/components/HeroSection.tsx:137,147`

Two contradictory source counts appear on the same platform:

```tsx
// HomeTrust.tsx:30
"38+ official U.S. government and recognized industry sources."

// HeroSection.tsx:137 — eyebrow label
"312 DATA SOURCES · 3-MODEL AI ENSEMBLE · LIVE"

// HeroSection.tsx:147 — hero subtitle
"12-month AI forecast · 38+ live data sources · Open API · Free forever."
```

A user reading both surfaces sees 38 and 312. Neither number is explained in context. (38 = source agencies; 312 = individual series — but this distinction is not visible to the user.)

Additionally, `HomeTrust.tsx:94–97` hardcodes fallback stats that display as live data:

```tsx
{ label: 'Cities tracked',   value: stats ? String(stats.cities_tracked) : '40'  },
{ label: 'Satellite MSAs',   value: stats ? String(stats.msas_tracked)   : '20'  },
{ label: 'Gov. data sources', value: stats ? `${stats.data_sources}+`    : '38+' },
```

When `stats` is null — on slow loads, pre-rendered pages, or API failure — the stats bar displays `40`, `20`, `38+` as if they are live. They are marketing copy in a data display slot.

**Fix:** (1) Remove the "312 DATA SOURCES" eyebrow from `HeroSection.tsx:137` entirely — it is stat-stuffing without context. (2) Replace hardcoded fallbacks in `HomeTrust.tsx:94–97` with `null` renders or skeleton placeholders — never display a hardcoded number in a slot designed for live data.

---

### 5. Overused gradients

**Status:** PRESENT · **Severity:** MEDIUM

**Files:** `src/app/globals.css:186–189, 200` · `src/app/components/HeroSection.tsx:143`

Three gradient uses, stacked:

```css
/* globals.css:186–189 — hero background */
.hero {
  background:
    radial-gradient(ellipse 85% 55% at 15% 0%,   rgba(10,132,255,0.13) 0%, transparent 55%),
    radial-gradient(ellipse 55% 40% at 85% 15%,  rgba(48,209,88,0.05)  0%, transparent 50%),
    radial-gradient(ellipse 50% 65% at 50% 105%, rgba(10,132,255,0.08) 0%, transparent 60%),
    #060608;
}

/* globals.css:200 — headline text */
.grad-text {
  background: linear-gradient(135deg, #0A84FF 0%, #40C4FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

```tsx
// HeroSection.tsx:143
<span className="grad-text">intelligence platform</span>
```

Gradient headline text is the single most replicated pattern in AI-generated landing pages of 2023–2026. The three stacked radial gradients in the hero background are the second most common. Together they signal "I used a template" before the user reads a word.

The hero background gradients are subtle enough to keep. The gradient headline text is not.

**Fix:** Remove the `.grad-text` class from `HeroSection.tsx:143`. Replace with `color: color.t1` (white) or, if the second word needs differentiation, `color: color.amber`. Solid color on a hero headline reads as confidence. Gradient text reads as decoration.

---

### 6. Centered generic SaaS hero pattern

**Status:** PRESENT · **Severity:** HIGH

**File:** `src/app/home/HomeHero.tsx` (rendered at `src/app/page.tsx:130`)

Layout structure of the active hero:

```
textAlign: 'center'
maxWidth: 800
↓
All-caps MONO eyebrow ("CONSTRUCTAIQ")
↓
H1 headline — centered
↓
Subtitle paragraph — centered
↓
Hero KPI (96px spending number) — centered
↓
Two CTAs side-by-side — centered
```

Every element is center-aligned, equal-width, stacked vertically. There is no asymmetry, no dominant visual object, no data in view. The actual product differentiator — the live forecast chart — does not appear until the user scrolls through three more sections.

`HeroSection.tsx` (lines 132–251) already implements the correct alternative: a 60/40 split with the live forecast chart on the left and a live signals rail on the right. It fetches real data and falls back to illustrative data gracefully. It is not wired into `page.tsx`.

**Fix:** Replace `<HomeHero>` with `<HeroSection>` at `page.tsx:130`. The correct hero is already built. Wire it in, remove the gradient text, and the platform's strongest first impression — a live forecast chart — becomes the above-the-fold experience.

---

### 7. Gradient CTA buttons

**Status:** PRESENT · **Severity:** MEDIUM

**File:** `src/app/globals.css:129–138`

```css
.btn-fl {
  background: #0A84FF;
  box-shadow: 0 4px 24px rgba(10,132,255,0.40);    /* ← decorative glow */
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
}
.btn-fl:hover {
  background: #409CFF;
  box-shadow: 0 8px 32px rgba(10,132,255,0.54);    /* ← amplified glow */
  transform: translateY(-2px);                      /* ← lift effect */
}
```

The primary CTA button has a persistent blue glow shadow and physically lifts on hover with an amplified shadow. This is the exact button style generated by Tailwind UI hero blocks, shadcn/ui, and most AI-assisted landing page generators. It signals "off-the-shelf template" to any designer who has seen it before.

The `.btn-g` ghost button (`globals.css:151–158`) adds `backdrop-filter: blur(8px)` — glassmorphism — which has the same template-recognition problem.

**Fix:** Remove `box-shadow` from `.btn-fl` at rest. On hover, change background color only — no transform, no amplified shadow. A flat button that changes color on hover is more credible for a professional data product than one that glows and levitates.

---

### 8. Decorative trust indicators not backed by real data

**Status:** PRESENT · **Severity:** MEDIUM

**File:** `src/app/home/HomeTrust.tsx:32–41`

```tsx
<div style={{
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: `${color.green}12`, border: `1px solid ${color.green}40`,
  borderRadius: 7, padding: '5px 12px',
}}>
  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.green }} />
  <span style={{ fontSize: 12, fontFamily: MONO, color: color.green }}>
    {stats ? `${stats.observations_label}+ observations indexed` : '38+ data sources'}
  </span>
</div>
```

The green pill badge renders as a live data signal — green dot, green text, green border — but falls back to the hardcoded string `'38+ data sources'` when `stats` is null. A user on a slow connection or a pre-rendered page sees a green "live" indicator displaying static marketing copy. The visual affordance (green dot = live) directly contradicts the content (hardcoded string = not live).

**Fix:** When `stats` is null, render nothing in this slot — no badge, no fallback string. A missing badge is honest. A green-dot badge that shows a hardcoded number is a lie about data freshness on the Trust Center's own page.

---

### 9. Default component-library look

**Status:** PARTIAL · **Severity:** LOW

**Files:** `src/app/home/HomeTrust.tsx:21` · `src/app/globals.css:264`

No component library (shadcn/ui, Radix, Material UI) is imported anywhere in the codebase — all components are custom-built with inline styles or CSS classes. The code is original. The visual output, however, pattern-matches library defaults closely enough to trigger recognition:

```tsx
// HomeTrust.tsx:21 — Trust card
background: WHITE, border: `1px solid ${BD}`, borderRadius: 14, padding: '28px 24px'
// ↑ Indistinguishable from shadcn/ui <Card> defaults
```

```css
/* globals.css:264 — Pricing card */
.price-card { border-radius: 20px; padding: 40px 32px;
              border: 1px solid rgba(255,255,255,0.07);
              background: rgba(255,255,255,0.03); }
/* ↑ Indistinguishable from Tailwind UI "dark card" component */
```

The HomeTrust cards and the pricing page cards both use the exact radius/border/background combination that appears in virtually every component library's card primitive. They are custom code that looks like copy-paste.

**Fix:** Introduce one deliberate visual deviation from the library default in each card type — a colored left-border accent, a subtle inner shadow, an asymmetric border-radius, or an inset glow — something that signals intentional design rather than a default. The deviation does not need to be large; it needs to be there.

---

## Priority Fixes

Ordered by weighted score impact: dimension weight × expected score gain. Fixes that touch Typography (20%) or Visual Hierarchy (20%) deliver the most overall movement per unit of effort.

| # | Dimension(s) | Specific change | File / area | Expected gain |
|---|---|---|---|---|
| 1 | Visual Hierarchy (20%) + Emotional Resonance (5%) | Wire `HeroSection.tsx` into `page.tsx` in place of `HomeHero`. The live 60/40 split layout with forecast chart left + signals rail right is already built. Remove centered SaaS layout, remove grad-text, move real data above the fold. | `page.tsx:130` — replace `<HomeHero>` with `<HeroSection>` | Visual Hierarchy +2 → 7/10; Emotional Resonance +2 → 7/10; **overall +0.50** |
| 2 | Typography (20%) | Add `@font-face` declarations to `globals.css` for Aeonik Pro woff2 files and apply font class to `<html>` and `<body>` in `layout.tsx`. Until the font loads, every type decision in `theme.ts` renders in the system fallback chain — the typographic identity is entirely absent. | `src/app/globals.css` · `src/app/layout.tsx` | Typography +2 → 7/10; **overall +0.40** |
| 3 | Color & Palette (20%) + Spacing & Rhythm (15%) | Add `import { color, space } from '@/lib/theme'` to `trust/page.tsx` and replace all 12 hardcoded hex strings (`'#333'`, `'#111'`, `'#f5f5f5'`, `'#aaa'`, etc.) with their `color.*` equivalents. Replace raw `48px/64px/80px` section padding with `space.*` tokens. | `src/app/trust/page.tsx:17–64, 152, 163` | Color +1.5 → 6.5/10; Spacing +1 → 6/10; **overall +0.45** |
| 4 | Typography (20%) + Visual Hierarchy (20%) | Cap `TS.label` usage to two roles only: (1) the label directly above a numeric KPI value, (2) one section-type eyebrow per page. Remove it from HomeTrust card eyebrows, page-header brand labels (`ConstructAIQ` above H1 on all four pages), and navigation items. Replace section eyebrows that name prose sections with `type.h3` in `font.sys`. | `HomeHero.tsx:20` · `HomeRoles.tsx:33` · `HomeTrust.tsx:22,46,67` · `trust/page.tsx:207` · `status/page.tsx:390` | Typography +1 → 6/10; Visual Hierarchy +1 → 6/10; **overall +0.40** |
| 5 | Color & Palette (20%) + Component Consistency (10%) | Standardize freshness vocabulary to the `DataTrustBadge` set: `fresh / stale / delayed / failed / fallback / unknown`. In `status/page.tsx:111–115` rename `STATUS_DOT.warn.label` from `'Aging'` to `'Delayed'`. In `trust/page.tsx:509–513` update the Source Health state list to use `Delayed` not `Aging`. Everywhere the same concept now uses the same word. | `src/app/status/page.tsx:111–115` · `src/app/trust/page.tsx:509–513` | Color +1 → 6/10; Consistency +1 → 5/10; **overall +0.30** |
| 6 | Component Consistency (10%) | Delete `KPICard.tsx` and the local `KpiCard` function in `OverviewSection.tsx`. Consolidate into one canonical component: `color.bg1` background, `layout.cardRadius` (12) border-radius, `type.kpi` (48px) for hero values, `type.kpiSm` (32px) for secondary values, custom SVG sparkline. Any section currently using `KPICard.tsx` (recharts, `borderRadius:16`, `22px` value) must be migrated. | `src/app/dashboard/components/KPICard.tsx` · `src/app/dashboard/sections/OverviewSection.tsx:218–264` | Consistency +3 → 7/10; **overall +0.30** |
| 7 | Spacing & Rhythm (15%) | Replace every raw section padding value in homepage components with `space.*` tokens. Target: all sections use one of `space.xxl` (48), `space.xl` (32), or a named multiple. Remove the five-value spread (48/56/64/64/80px) that currently gives adjacent sections different visual weight for no semantic reason. | `src/app/page.tsx:134,138,149` · `src/app/home/HomeRoles.tsx:31` · `src/app/home/HomeTrust.tsx:13` | Spacing +2 → 7/10; **overall +0.30** |
| 8 | Visual Hierarchy (20%) | Move `<HomeNewsletter>` from `page.tsx:134–136` (between Roles and StatusCards) to after `<HomeLiveStats>` at line 142. Email capture should appear after the product has demonstrated value — live market data, live stats — not before the first data surface. | `src/app/page.tsx:134–142` — reorder section sequence | Visual Hierarchy +1 → 7/10; **overall +0.20** |
| 9 | Accessibility (5%) + Typography (20%) | Raise every `fontSize: 9` instance to a minimum of `11`. Affected: `DataTrustBadge.tsx:119` (status label), `OverviewSection.tsx:172` (SVG axis text), `OverviewSection.tsx:232` (KpiCard source line). At 9px on dark backgrounds, contrast ratios fall to ≈3.5:1 — below WCAG AA 4.5:1 minimum for informational text. | `src/app/components/DataTrustBadge.tsx:119` · `src/app/dashboard/sections/OverviewSection.tsx:172,232` | Accessibility +2 → 6/10; Typography +0.5 → 6.5/10; **overall +0.20** |
| 10 | Accessibility (5%) | Replace `.tc-nav { display: none !important }` at `trust/page.tsx:158` with a horizontally-scrollable anchor chip row that appears at the top of `.tc-content` on viewports under 700px. Six chips, one per section, `overflow-x: auto`, `white-space: nowrap`. The Trust Center is six long sections; mobile users need navigation. | `src/app/trust/page.tsx:156–159` | Accessibility +1.5 → 5.5/10; **overall +0.075** |
| 11 | Color & Palette (20%) | Resolve `color.purple` (`#5e5ce6`). It appears in one place: `OverviewSection.tsx:403` as the CSHI Score KPI accent. Either (a) document purple's semantic meaning in `theme.ts` alongside `signal.*` — e.g. `signal.composite: color.purple` — or (b) replace with `color.blue` and demote CSHI from accent-color differentiation. An unexplained accent color in a data system creates noise, not signal. | `src/lib/theme.ts` · `src/app/dashboard/sections/OverviewSection.tsx:403` | Color +0.5 → 6.5/10; **overall +0.10** |
| 12 | Emotional Resonance (5%) | Remove `box-shadow: 0 4px 24px rgba(10,132,255,0.40)` from `.btn-fl` at rest and simplify hover to background-color change only — no `transform: translateY(-2px)`, no amplified shadow. The glow-and-lift CTA button is the signature of AI-generated landing pages. A flat color-change is faster, more credible, and more consistent with the product's "calm, executive-readable" positioning. | `src/app/globals.css:129–138` | Emotional Resonance +0.5 → 5.5/10; **overall +0.025** |

---

## What a 10 Looks Like for ConstructAIQ

A 10 is not generic design excellence. It is a specific visual identity that could only belong to a US construction intelligence platform — one that earns trust through data transparency, communicates authority through precision, and serves professionals who make real financial and operational decisions from what they see.

---

### Typography

Aeonik Pro renders at every size across every surface — homepage, dashboard, trust, status. No page falls back to system sans-serif. `font.mono` is used for exactly three things: numeric KPI values, series IDs (TTLCONS, CES2000000001), and timestamps. It is never used for section eyebrows, card titles, page-level navigation, or prose. The scale distinction between SYS and MONO is legible and intentional — prose reads in Aeonik, data reads in mono. A designer looking at any single screen can identify the typographic system in under ten seconds.

---

### Color and Palette

The palette is a signal system, not a decoration system:

- **Amber** means "primary data value" — construction spending, the headline metric, the Verdict
- **Blue** means "forecast and action" — projected values, CTAs, confidence bands
- **Green** means "expansion / positive direction" — employment growth, markets heating
- **Red** means "contraction / risk" — decline, alert, failed pipeline
- **Gray** (`t3`, `t4`) means "context and metadata" — source attributions, timestamps, secondary labels

No color is used outside this system. `color.purple` either has a documented semantic role or is removed. The freshness vocabulary (`fresh / stale / delayed / failed / fallback / unknown`) uses these colors consistently across every surface that shows pipeline status — DataTrustBadge, /status data freshness table, /trust source health documentation, API responses. A professional who learns the color meaning on the dashboard does not need to relearn it on /status.

---

### Spacing and Rhythm

Every page section uses spacing from the `space.*` token scale. The rhythm is legible: sections breathe at `space.xxl` (48px) vertical padding, card interiors use `layout.cardPad` (24px), and inline label-to-value gaps use `space.sm` (8px) or `space.md` (16px). No adjacent sections use raw pixel values that differ from their neighbors by arbitrary amounts (48/56/64/64/80px). A designer scrolling through source code sees consistent token names, not a history of one-off size decisions.

---

### Visual Hierarchy

Every screen has one dominant element. On the dashboard, the ForecastChart fills the width at the top of the forecast section — the 12-month ensemble line is immediately visible, the confidence bands are the widest visual element on the screen, and the current spending value is the largest number. KPI cards below it are supporting context, not competing primaries.

On the homepage, the live forecast chart is the above-the-fold hero. A user who has never heard of ConstructAIQ opens the page and sees a real chart with real numbers before they read a headline. The data is the argument.

On /trust, the section navigation is always visible — on desktop as a sticky left column, on mobile as a scrollable chip row at the top of the content. Six sections of dense methodology documentation are navigable in under two taps.

---

### Source and Freshness Trust Context

Every data surface carries exactly one `DataTrustBadge` — placed at the bottom of the section it describes, expanded on forecast sections (showing quality bar and caveat), compact on KPI sections. The badge shows the same four fields everywhere: status dot + label, source name, data type, as-of date. "Fresh" always means the same thing: pipeline ran within 24 hours. "Stale" always means 1–6 days. "Delayed" always means 7+ days. A professional reading the Trust Center learns the vocabulary once and encounters the same terms on the dashboard, on /status, and in API responses.

No number on any surface is hardcoded as a fallback that pretends to be live. When data is unavailable, the slot shows a skeleton or an explicit unavailability state — never a static number in a live-data display context. When the API is down, the dashboard says so after 8 seconds rather than displaying silent dashes indefinitely.

---

### Role-Specific Clarity

The homepage roles section does not describe five audiences in identical blue-bordered cards. It shows one live data point per role: Contractors see current permit volume for the top market in their segment. Lenders see CSHI plus the current 30-year rate. Suppliers see the top material BUY/SELL signal. The data does not just promise relevance — it demonstrates it before the user commits to navigating further.

The dashboard Verdict Banner surfaces one of three states — EXPAND, CONTRACT, WATCH — and the color matches the signal system: green/red/amber. A new user landing on the dashboard knows the market direction before they read a number.

---

### Dense but Readable Dashboard

The dashboard is dense by design — six KPI numbers, a 12-month chart, confidence bands, model weights, signals, materials — but density is organized by hierarchy, not sprawl. The primary metric (construction spending forecast) is the largest element. The four KPI cards below it are supporting context at a consistent size. The signals panel is visually quieter than the forecast chart. An operator can read the dashboard status in under 30 seconds without having to decide which number matters most.

No section is padded to feel lighter at the cost of information. No chart is decorative. Every element earns its space by answering a question a real construction professional would ask.

---

### No Fake Metrics

No number on any surface is illustrative, synthetic, hardcoded, or derived from `Math.random()`. Sparklines show real `observations` rows from the Supabase time-series store. Heatmap values come from real BSI calculations. The Weekly Brief is generated by the Claude API from real data context, not served from a static string. When a number cannot be fetched, the slot shows a loading shimmer or an explicit unavailability message — never a number that looks real but isn't.

---

### Professional Emotional Tone

The platform feels like Revolut Business composure applied to construction intelligence. It is calm, not exclamatory. It is precise, not approximate. It is confident, not promotional. It does not animate things that don't need animation. Its primary CTA buttons are flat, solid-fill, and change color on hover — no glow, no lift. Its headlines are in sentence case or title case, not ALL CAPS. Its color is used to communicate, not to decorate.

A construction lender, a federal infrastructure analyst, or a major contractor's CFO opens the dashboard and feels that the platform understands what they need — not that it is trying to sell them something. The product's emotional argument is: *we built this the way serious data infrastructure gets built, and we made it free.* Every design decision either reinforces that argument or works against it.

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
