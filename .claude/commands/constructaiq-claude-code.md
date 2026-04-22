From 85fb5adcbeebdb484220e14f87396574bc93f5d8 Mon Sep 17 00:00:00 2001
From: ConstructAIQ Build [constructaiq@build.ai](mailto:constructaiq@build.ai)
Date: Tue, 21 Apr 2026 21:34:25 +0000
Subject: [PATCH] Claude Code: update CLAUDE.md + add 9 slash commands
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

Based on full repository audit (April 21 2026).

CLAUDE.md updates:

- Added known bugs section with specific file/line callouts
- Documented Math.random() in dashboard/page.tsx (sparklines + heatmap)
- Documented federal/route.ts as 100% static mock data
- Documented weekly-brief/route.ts static brief (Anthropic SDK not installed)
- Added GateLock bug (always locked=false)
- Added ForecastChart fixed-width bug
- Added ForecastBanner vs ForecastChart charting inconsistency
- Added GlobeClient.tsx font bypass issue
- Clarified do-not-touch list (models/, theme.ts, auth.ts, schema.sql, CI)
- Added 10-step execution order

New .claude/commands/:

- /audit          — systematic code review checklist (font, tokens, hierarchy, mono overuse)
- /fix-font       — install Aeonik Pro @font-face + fix layout.tsx + grep hardcoded fonts
- /fix-sparklines — replace Math.random() sparklines with Supabase observations data
- /redesign-dashboard — remove ticker, elevate forecast, split monolith into sections/
- /elevate-forecast — ForecastChart responsive + series selector + scenario overlay line
- /wire-federal   — connect federal/route.ts to USASpending.gov API with Supabase cache
- /wire-brief     — install @anthropic-ai/sdk + Claude API brief generation + cron
- /test-run       — full verification suite (tsc + vitest + lint + integrity checks)
- /mobile-pass    — Apple HIG compliance checklist for all screen sizes

-----

.claude/commands/audit.md              |  72 +++++
.claude/commands/elevate-forecast.md   | 158 ++++++++++
.claude/commands/fix-font.md           | 102 +++++++
.claude/commands/fix-sparklines.md     |  93 ++++++
.claude/commands/mobile-pass.md        | 149 ++++++++++
.claude/commands/redesign-dashboard.md | 137 +++++++–
.claude/commands/test-run.md           |  66 ++++
.claude/commands/wire-brief.md         | 217 ++++++++++++++
.claude/commands/wire-federal.md       | 152 ++++++++++
CLAUDE.md                              | 397 +++++++++++++++–––––
10 files changed, 1359 insertions(+), 184 deletions(-)
create mode 100644 .claude/commands/audit.md
create mode 100644 .claude/commands/elevate-forecast.md
create mode 100644 .claude/commands/fix-font.md
create mode 100644 .claude/commands/fix-sparklines.md
create mode 100644 .claude/commands/mobile-pass.md
create mode 100644 .claude/commands/test-run.md
create mode 100644 .claude/commands/wire-brief.md
create mode 100644 .claude/commands/wire-federal.md

diff –git a/.claude/commands/audit.md b/.claude/commands/audit.md
new file mode 100644
index 00000000..f226d68c
— /dev/null
+++ b/.claude/commands/audit.md
@@ -0,0 +1,72 @@
+# /audit — Systematic code review of any file or component
+
+Run this before touching any file to understand what needs fixing.
+
+## Steps
+
+Read the file the user specifies. Run each check and report findings with line numbers.
+
+### Check 1 — Font
+Is Aeonik Pro applied via `font.sys` from theme.ts?
+Or is there a hardcoded `font-family` string bypassing the token?
+`bash +grep -n "font-family\|fontFamily" [FILE] | grep -v "font\.sys\|font\.mono\|theme" +`
+Flag any hits. GlobeClient.tsx is a known offender — `var SYS = "-apple-system..."` should be `import { font } from '@/lib/theme'`.
+
+### Check 2 — Hardcoded colors
+Are raw hex strings used instead of `color.*` tokens from theme.ts?
+`bash +grep -n "#[0-9a-fA-F]\{3,6\}" [FILE] +`
+Flag any hex not in theme.ts or globals.css.
+
+### Check 3 — Math.random()
+Is `Math.random()` used anywhere in the rendering path?
+`bash +grep -n "Math\.random" [FILE] +`
+Any hit in a component file is a bug. Zero tolerance.
+
+### Check 4 — Visual hierarchy
+Is there one clearly dominant element on screen?
+Review the layout structure. If more than one element competes for top-level attention, flag it.
+Dashboard rule: forecast chart must be dominant, not equal to CSHI gauge.
+
+### Check 5 — Mono overuse
+Is `font.mono` (MONO) used for non-numerical, non-technical content?
+Labels, headings, section titles, body copy should all use `font.sys`.
+Flag any `fontFamily: MONO` on content that isn’t: a number, a series ID, an API key, a timestamp, or a code value.
+
+### Check 6 — Inline style overrides
+Are `fontSize`, `fontWeight`, `color`, `borderRadius`, `padding` hardcoded instead of using theme tokens?
+A small number is acceptable. More than 3-4 per component is a smell.
+
+### Check 7 — Loading state
+Does every `{data && <Component />}` pattern have an else branch for loading?
+A null check with no skeleton means blank space while data loads.
+
+### Check 8 — Mobile
+Does any `display: "flex"` row lack `flexWrap: "wrap"` or a `minWidth` guard?
+Would this break at 375px?
+
+### Check 9 — Component size
+`bash +wc -l [FILE] +`
+Over 200 lines: acceptable.
+Over 300 lines: should be split.
+Over 500 lines: must be split.
+
+### Check 10 — Emoji as icons
+`bash +grep -n "icon.*[🏗️📋💰👷💹📡🔒]" [FILE] +`
+Production UI should not use emoji as icons. Replace with Lucide React.
+
+## Report format
+List each finding as:
+- **[CHECK NAME]** Line X: [description of issue] → [suggested fix]
+- **PASS** if the check passes with no issues
+
+End with a priority-ordered fix list.
diff –git a/.claude/commands/elevate-forecast.md b/.claude/commands/elevate-forecast.md
new file mode 100644
index 00000000..4910c1b9
— /dev/null
+++ b/.claude/commands/elevate-forecast.md
@@ -0,0 +1,158 @@
+# /elevate-forecast — Make ForecastChart the premium hero it deserves to be
+
+The ForecastChart custom SVG is already well-built — confidence bands, delta annotation,
+bridge dot, amber/blue color split. It just needs additions and visual elevation.
+
+## Read first
+`bash +cat src/app/dashboard/components/ForecastChart.tsx +cat src/app/dashboard/components/ScenarioBuilder.tsx +cat src/app/dashboard/types.ts +`
+
+—
+
+## ForecastChart additions
+
+### Addition 1 — Make it responsive
+Current: `width = 620` default prop with fixed SVG dimensions.
+The SVG already uses `viewBox` — remove the fixed width and use `width="100%"`.
+
+```tsx
+// Before:
+<svg width=“100%” viewBox={`0 0 ${width} ${height}`}
+
+// After: remove width prop from component signature; hardcode viewBox to “0 0 620 480”
+// The SVG scales via width=“100%” on the element and viewBox handles internal coordinates
+export function ForecastChart({ foreData, height = 480 }: {

- foreData: ForecastData | null
- height?: number
  +}) {
- // Use fixed internal coordinate space
- const width = 620
- // … rest stays the same
- return (
- <div>
- ```
   <svg width="100%" viewBox={`0 0 ${width} ${height}`}
  ```
- ```
        style={{ overflow: "visible", display: "block" }}>
  ```

+` + +### Addition 2 — Series selector +Add a series selector row above the chart. Currently it only shows TTLCONS. + +`tsx
+const SERIES = [

- { id: ‘TTLCONS’,       label: ‘Total Spending’,  unit: ‘$T’ },
- { id: ‘HOUST’,         label: ‘Housing Starts’,  unit: ‘K/mo’ },
- { id: ‘PERMIT’,        label: ‘Permits’,          unit: ‘K/mo’ },
- { id: ‘CES2000000001’, label: ‘Employment’,       unit: ‘K’ },
  +]
  +```
- 

+Render as pill buttons above the chart. On click, pass the selected series ID up to the parent
+to refetch from `/api/forecast?series={id}`.
+
+### Addition 3 — Model context strip
+Below the chart legend, add a single row of model metadata:
+```tsx
+<div style={{ display: ‘flex’, gap: 24, paddingLeft: PAD.left, marginTop: 8 }}>

- <span>{font.mono} HW {foreData.metrics.hwWeight}%</span>
- <span>SARIMA {foreData.metrics.sarimaWeight}%</span>
- <span>XGB {foreData.metrics.xgboostWeight}%</span>
- <span>MAPE {foreData.metrics.mape}%</span>
- <span>{foreData.metrics.n} months</span>
  +</div>
  +```
- 

+The `EnsembleResult.metrics` object is already returned by `runEnsemble()` and available in foreData.
+
+### Addition 4 — Previous forecast comparison line
+When the forecasts table in Supabase has a prior forecast run, overlay it as a faint dashed line.
+
+Add to ForecastChart props: `prevForecast?: number[]`
+
+Render as:
+```tsx
+{prevForecast && (

- <path d={prevFcstPath} fill=“none” stroke={T4}
- ```
     strokeWidth={1.5} strokeDasharray="4,3" strokeOpacity={0.4} />
  ```

+)}
+` + +Label it with a legend entry: `{ col: T4, label: "Prior forecast", opacity: 0.4, dashed: true }` + +The parent component fetches the prior forecast from Supabase: +`typescript
+const { data: priorRows } = await supabase

- .from(‘forecasts’)
- .select(‘base_value’)
- .eq(‘series_id’, activeSeries)
- .eq(‘model’, ‘ensemble’)
- .lt(‘run_date’, today)
- .order(‘run_date’, { ascending: false })
- .limit(12)
  +```
- 

+—
+
+## ScenarioBuilder additions
+
+### Addition 1 — Scenario line on the ForecastChart
+This is the most important missing piece. The scenario output is currently just a text number.
+It should appear as a live colored line on ForecastChart.
+
+1. ScenarioBuilder computes adjusted forecast values based on slider positions
+2. It passes `scenarioForecast: number[]` up to the parent
+3. Parent passes it to ForecastChart as a `scenarioLine` prop
+4. ForecastChart renders it as a colored overlay line (color: `color.amber`)
+
+Scenario adjustment (keep it simple — linear elasticities):
+```typescript
+function applyScenario(baseForecast: number[], rate: number, iija: number, labor: number, material: number) {

- return baseForecast.map((v, i) => {
- const rateFactor    = 1 - (rate / 100) * 0.012       // -1.2% per 100bps
- const iijaFactor    = 1 + ((iija - 100) / 100) * 0.007 // +0.7% per 10% IIJA increase
- const laborFactor   = 1 + (labor / 100) * 0.008
- const materialFactor = 1 - (material / 100) * 0.003
- return Math.round(v * rateFactor * iijaFactor * laborFactor * materialFactor * 10) / 10
- })
  +}
  +```
- 

+### Addition 2 — Preset pills visual prominence
+The PRESETS array exists: `{ Recession, Baseline, Expansion, Infrastructure Push }`.
+Currently rendered as small buttons. Make them prominent:
+
+```tsx
+<div style={{ display: ‘flex’, gap: 8, marginBottom: 24 }}>

- {PRESETS.map((p, i) => (
- <button
- ```
   key={p.label}
  ```
- ```
   onClick={() => { setRate(p.rate); setIija(p.iija); setLabor(p.labor); setMaterial(p.material); setActive(i) }}
  ```
- ```
   className={active === i ? 'btn-f' : 'btn-g'}
  ```
- ```
   style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10 }}
  ```
- 
- ```
   {p.label}
  ```
- </button>
- ))}
  +</div>
  +```
- 

+### Addition 3 — Summary output card
+The delta impact summary already exists at the bottom. Make numbers larger:
+Use `type.h4` token (fontSize: 19) for the delta values — not fontSize: 14.
+
+—
+
+## Run after changes
+`bash +npx tsc --noEmit +npm test +npm run dev +`
+
+Verify:
+1. ForecastChart fills its container width on all screen sizes
+2. Series selector pills switch the forecast correctly
+3. Moving a ScenarioBuilder slider draws a second colored line on ForecastChart
+4. Model weights strip appears below the chart legend
diff –git a/.claude/commands/fix-font.md b/.claude/commands/fix-font.md
new file mode 100644
index 00000000..41d91940
— /dev/null
+++ b/.claude/commands/fix-font.md
@@ -0,0 +1,102 @@
+# /fix-font — Install Aeonik Pro and fix the typography system end-to-end
+
+The font is declared in theme.ts but never loaded. Every screen renders in the system fallback.
+Run this command to fix the entire font system in one pass.
+
+## Steps
+
+### Step 1 — Check for font files
+`bash +ls public/fonts/ 2>/dev/null || echo "Directory does not exist" +`
+
+### Step 2 — Add @font-face to globals.css
+Add these declarations at the very top of `src/app/globals.css`, before all other rules:
+
+```css
+/* ─── Aeonik Pro ──────────────────────────────────────────────────────────

- Self-host woff2 files at /public/fonts/AeonikPro-{weight}.woff2
- Obtain a license at: https://www.cotypefoundry.com/aeonik
- Weights needed: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold)
- Until files are present, the fallback chain renders cleanly.
- ────────────────────────────────────────────────────────────────────── */
  +@font-face {
- font-family: ‘Aeonik Pro’;
- src: url(’/fonts/AeonikPro-Light.woff2’) format(‘woff2’);
- font-weight: 300;
- font-style: normal;
- font-display: swap;
  +}
  +@font-face {
- font-family: ‘Aeonik Pro’;
- src: url(’/fonts/AeonikPro-Regular.woff2’) format(‘woff2’);
- font-weight: 400;
- font-style: normal;
- font-display: swap;
  +}
  +@font-face {
- font-family: ‘Aeonik Pro’;
- src: url(’/fonts/AeonikPro-Medium.woff2’) format(‘woff2’);
- font-weight: 500;
- font-style: normal;
- font-display: swap;
  +}
  +@font-face {
- font-family: ‘Aeonik Pro’;
- src: url(’/fonts/AeonikPro-Bold.woff2’) format(‘woff2’);
- font-weight: 700;
- font-style: normal;
- font-display: swap;
  +}
  +```
- 

+### Step 3 — Fix layout.tsx
+Replace the current body tag with font classes applied:
+
+```tsx
+export default function RootLayout({ children }: { children: React.ReactNode }) {

- return (
- <html lang="en" className="fa">
- ```
   <body className="fa">{children}</body>
  ```
- </html>
- )
  +}
  +```
- 

+The `.fa` class is already in globals.css: `font-family: 'Aeonik Pro', -apple-system, ...`
+
+### Step 4 — Fix GlobeClient.tsx font hardcoding
+`src/app/globe/GlobeClient.tsx` uses its own hardcoded font variable:
+`typescript +var SYS = "-apple-system,BlinkMacSystemFont,'SF Pro Display',Arial,sans-serif"  // ← wrong +`
+
+Replace with:
+`typescript +import { font } from '@/lib/theme' +// Then use font.sys everywhere SYS was used +`
+
+### Step 5 — Scan for remaining hardcoded font-family strings
+`bash +grep -rn "font-family\|fontFamily" src/app/ --include="*.tsx" --include="*.ts" | grep -v "theme\.ts" | grep -v "globals\.css" | grep -v "node_modules" +`
+
+Fix every hit to use `font.sys` or `font.mono` from theme.ts.
+
+### Step 6 — Run tests
+`bash +npx tsc --noEmit +npm test +`
+
+### Step 7 — Verify in browser
+Open DevTools → Elements → select any text element → Computed → font-family
+Should show ‘Aeonik Pro’ when font files are present, or the fallback chain when they’re not.
+Both are acceptable. The @font-face declarations being present is the goal.
+
+## Note for font licensing
+Aeonik Pro requires a commercial license from Co-Type Foundry.
+Purchase at: https://www.cotypefoundry.com/aeonik
+Place the licensed woff2 files in /public/fonts/ after purchase.
+The system fallback (-apple-system, Helvetica Neue) is acceptable during development.
diff –git a/.claude/commands/fix-sparklines.md b/.claude/commands/fix-sparklines.md
new file mode 100644
index 00000000..ebd6146f
— /dev/null
+++ b/.claude/commands/fix-sparklines.md
@@ -0,0 +1,93 @@
+# /fix-sparklines — Replace Math.random() with real Supabase data
+
+`Math.random()` is used in three places in `src/app/dashboard/page.tsx`.
+This causes sparklines and charts to render differently on every paint — a hydration bug and a data integrity issue.
+
+## Step 1 — Find all instances
+`bash +grep -n "Math\.random\(\)" src/app/dashboard/page.tsx +`
+
+Expected hits:
+1. `spark()` function — used for KPI card sparklines
+2. `heatmapData` — materials heatmap monthly values
+3. `corrMaterials` / `corrSpend` — correlation chart data
+
+## Step 2 — Replace spark()
+
+The `spark()` function generates a random walk. Replace it with a real Supabase fetch.
+
+Add to the data loading `useEffect` in dashboard/page.tsx:
+
+```typescript
+// Fetch sparkline data — last 12 monthly observations per series
+const { data: sparkRows } = await supabase

- .from(‘observations’)
- .select(‘series_id, obs_date, value’)
- .in(‘series_id’, [‘TTLCONS’, ‘CES2000000001’, ‘HOUST’, ‘PERMIT’])
- .order(‘obs_date’, { ascending: true })
- 

+// Group into arrays keyed by series_id
+const sparkMap: Record<string, number[]> = {}
+for (const row of sparkRows ?? []) {

- if (!sparkMap[row.series_id]) sparkMap[row.series_id] = []
- sparkMap[row.series_id].push(row.value)
  +}
  +// Take last 12 observations for each
  +const sparklines = Object.fromEntries(
- Object.entries(sparkMap).map(([k, v]) => [k, v.slice(-12)])
  +)
  +```
- 

+Then replace `spark(spendVal, 40)` with `sparklines['TTLCONS'] ?? []` and so on for each KPI card.
+
+**Fallback rule:** If Supabase returns no data for a series, use `Array(12).fill(lastKnownValue)` — a flat line is better than random noise.
+
+## Step 3 — Replace heatmapData Math.random()
+
+```typescript
+// BEFORE (broken):
+months: Array.from({length:12},(_,i) => ({

- value: c.value + (Math.random()-0.5)*c.value*0.05,
- pctChange: (Math.random()-0.48)*8,
  +}))
- 

+// AFTER (deterministic):
+months: Array.from({length:12},(_,i) => ({

- value: c.value,           // flat — no random variance
- pctChange: c.mom || 0,   // use actual MoM if available, else 0
  +}))
  +```
- 

+The materials heatmap should only show real MoM change data, or nothing. Fake variance is worse than flat.
+
+## Step 4 — Replace corrMaterials / corrSpend
+
+These feed the MaterialsCorrelation component. Fetch real data:
+
+```typescript
+const { data: corrObs } = await supabase

- .from(‘observations’)
- .select(‘series_id, obs_date, value’)
- .in(‘series_id’, [‘TTLCONS’, ‘WPS081’])  // WPS081 = BLS PPI lumber
- .gte(‘obs_date’, twentyFourMonthsAgo)
- .order(‘obs_date’, { ascending: true })
- 

+const corrMaterials = corrObs?.filter(r => r.series_id === ‘WPS081’)

- .map(r => ({ date: r.obs_date, value: r.value })) ?? []
  +const corrSpend = corrObs?.filter(r => r.series_id === ‘TTLCONS’)
- .map(r => ({ date: r.obs_date, value: r.value / 1000 })) ?? []
  +```
- 

+If these series aren’t in the observations table yet, add them to the harvest cron.
+
+## Step 5 — Delete the spark() function
+After replacing all call sites, delete `function spark(base, variance)` entirely from dashboard/page.tsx.
+
+## Step 6 — Verify
+`bash +grep -n "Math\.random\(\)" src/app/dashboard/page.tsx +`
+Should return zero hits.
+
+Reload the dashboard 5 times. Sparklines should be identical every time.
diff –git a/.claude/commands/mobile-pass.md b/.claude/commands/mobile-pass.md
new file mode 100644
index 00000000..c9c5b514
— /dev/null
+++ b/.claude/commands/mobile-pass.md
@@ -0,0 +1,149 @@
+# /mobile-pass — Apple HIG mobile compliance pass
+
+Run this after any major layout change. ConstructAIQ’s users check this on job sites from iPhones.
+
+## Step 1 — ForecastChart responsive fix (highest priority)
+
+The custom SVG ForecastChart is the most important chart on the platform.
+It uses `viewBox` already, which means it scales — but it needs `width="100%"` on the SVG element.
+
+```tsx
+// In ForecastChart.tsx — the SVG element should be:
+<svg

- width=“100%”               // ← scales to container
- viewBox={`0 0 620 480`}    // ← fixed internal coordinate space
- style={{ overflow: “visible”, display: “block” }}
  +>
  +```
- 

+Verify this renders correctly at 375px by resizing the browser window.
+The chart should scale smoothly without overflow or text clipping.
+
+## Step 2 — Safe area insets
+All sticky/fixed elements must respect safe areas:
+
+Check these components:
+- Dashboard nav (`position: sticky, top: 0`) — add `paddingTop: 'env(safe-area-inset-top, 0px)'`
+- Any bottom-fixed elements — add `paddingBottom: 'env(safe-area-inset-bottom, 0px)'`
+- Homepage nav (fixed position) — same treatment
+
+## Step 3 — Touch targets (44×44px minimum)
+`bash +# Find potential small targets +grep -n "height.*[0-9]\+" src/app/dashboard/page.tsx | grep -E "height:[ ]*[0-9]{1,2}[,\}]" +`
+
+Common violations in this codebase:
+- Dashboard nav section buttons: `padding: "4px 8px"` — tap target likely too small
+- Any `fontSize: 10` + `padding: 4px` combination
+- Icon-only buttons without explicit size
+
+Fix: Minimum `minHeight: 44, minWidth: 44` on any interactive element.
+
+## Step 4 — Mobile layout — stacked vs side-by-side
+Every `display: "flex"` row that places two charts or cards side by side needs a mobile breakpoint.
+
+Pattern to find and fix:
+`bash +grep -n "flex.*1.*flex.*1\|flex.*2.*flex.*1" src/app/dashboard/page.tsx | head -20 +`
+
+For each side-by-side pair, add `flexWrap: "wrap"` and `minWidth` guards:
+```tsx
+// Before — breaks on mobile:
+<div style={{ display: “flex”, gap: 20 }}>

- <Card style={{ flex: “2 1 480px” }}>…</Card>
- <Card style={{ flex: “1 1 260px” }}>…</Card>
  +</div>
- 

+// After — wraps gracefully on mobile:
+<div style={{ display: “flex”, gap: 20, flexWrap: “wrap” }}>

- <Card style={{ flex: “2 1 480px”, minWidth: 0 }}>…</Card>
- <Card style={{ flex: “1 1 260px”, minWidth: 260 }}>…</Card>
  +</div>
  +```
- 

+On screens under 480px, the `1 1 260px` card wraps to a new row automatically.
+
+## Step 5 — ScenarioBuilder as bottom sheet on mobile
+ScenarioBuilder is a control-heavy component that doesn’t belong inline on mobile.
+
+Create `src/app/components/BottomSheet.tsx`:
+```tsx
+“use client”
+import { useEffect } from “react”
+import { color, radius } from “@/lib/theme”
+
+export function BottomSheet({ open, onClose, title, children }: {

- open: boolean
- onClose: () => void
- title: string
- children: React.ReactNode
  +}) {
- // Prevent body scroll when open
- useEffect(() => {
- if (open) document.body.style.overflow = “hidden”
- else document.body.style.overflow = “”
- return () => { document.body.style.overflow = “” }
- }, [open])
- 
- if (!open) return null
- return (
- <>
- ```
   {/* Backdrop */}
  ```
- ```
   <div onClick={onClose} style={{
  ```
- ```
     position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
  ```
- ```
     zIndex: 400, backdropFilter: "blur(4px)",
  ```
- ```
   }} />
  ```
- ```
   {/* Sheet */}
  ```
- ```
   <div style={{
  ```
- ```
     position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500,
  ```
- ```
     background: color.bg1,
  ```
- ```
     borderRadius: `${radius.xl2}px ${radius.xl2}px 0 0`,
  ```
- ```
     padding: "20px 24px",
  ```
- ```
     paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
  ```
- ```
     maxHeight: "80vh",
  ```
- ```
     overflowY: "auto",
  ```
- ```
   }}>
  ```
- ```
     {/* Drag handle */}
  ```
- ```
     <div style={{ width: 36, height: 4, background: color.bd2, borderRadius: 2, margin: "0 auto 20px" }} />
  ```
- ```
     <div style={{ fontWeight: 600, marginBottom: 16 }}>{title}</div>
  ```
- ```
     {children}
  ```
- ```
   </div>
  ```
- </>
- )
  +}
  +```
- 

+In the dashboard, wrap ScenarioBuilder:
+```tsx
+// Mobile: show a “Scenario” button that opens the sheet
+// Desktop: show ScenarioBuilder inline
+
+const [scenarioOpen, setScenarioOpen] = useState(false)
+const isMobile = typeof window !== ‘undefined’ && window.innerWidth < 480
+
+// Mobile button:
+<button onClick={() => setScenarioOpen(true)} className=“btn-g”>

- Scenario Modeler
  +</button>
  +<BottomSheet open={scenarioOpen} onClose={() => setScenarioOpen(false)} title=“Scenario Modeler”>
- <ScenarioBuilder spendVal={spendVal} />

## +</BottomSheet>
+```
+
+## Step 6 — Test widths
+Resize browser to these widths and verify nothing breaks:
+- 375px (iPhone SE)
+- 390px (iPhone 14)
+- 430px (iPhone 15 Plus)
+- 768px (iPad)
+- 1024px (iPad landscape / small laptop)
+- 1440px (desktop)
+
+Key things to verify at 375px:
+- [ ] ForecastChart fills width without overflow
+- [ ] KPI cards wrap to 2-column grid
+- [ ] Nav section links don’t overflow horizontally
+- [ ] No horizontal scrollbar appears
+- [ ] Touch targets are large enough to tap accurately
diff –git a/.claude/commands/redesign-dashboard.md b/.claude/commands/redesign-dashboard.md
index d2d7736a..e2610ea9 100644
— a/.claude/commands/redesign-dashboard.md
+++ b/.claude/commands/redesign-dashboard.md
@@ -1,21 +1,116 @@
-Read CLAUDE.md and redesign the main dashboard experience.

## -Focus files:
– src/app/dashboard/page.tsx
– src/app/dashboard/components/LeftPanel.tsx
– src/app/dashboard/components/TabBar.tsx

## -Goals:
– remove terminal-style excess
– reduce chrome and competing signals
– promote the forecast to hero status
– create a calmer, premium, executive-readable hierarchy
– align the UX more closely with the composure of Revolut Business

## -Return first:
-1. primary user decision for the dashboard
-2. recommended page hierarchy
-3. what should be demoted or removed
-4. component reuse vs rebuild plan

-Then implement.
+# /redesign-dashboard — Recompose the dashboard shell
+
+The dashboard has three structural problems:
+1. A live ticker strip that frames everything as Bloomberg Terminal cosplay
+2. Forecast (the hero capability) is buried under CSHI gauge, history, and model accuracy
+3. The nav bar carries too much data clutter
+
+This command recomposes the shell. It does not redesign individual components.
+
+## Step 1 — Read the current structure
+`bash +wc -l src/app/dashboard/page.tsx +grep -n "Section id=" src/app/dashboard/page.tsx +`
+
+## Step 2 — Remove the live ticker
+Find the ticker div in dashboard/page.tsx — it’s the `<div style={{ background:BG2, borderBottom... height:32 }}>` block with the scrolling animation.
+
+Delete it entirely. The LIVE indicator belongs only in the nav, not as a full-width scrolling strip.
+
+Also remove the `@keyframes ticker` from globals.css if it’s no longer used elsewhere.
+
+## Step 3 — Simplify the nav bar
+Current nav right side has: GLOBE link + LIVE dot + timestamp + spend value + employment value + 30yr rate.
+
+Reduce to:
+` +Left:  [Logo]  [divider]  [Section nav links — Command / Forecast / Map / Materials / Pipeline / Federal / Equities / Signals] +Right: [LIVE pulsing dot]  [TTLCONS spend value — one metric only]  [link to /pricing] +`
+
+Remove: timestamp, employment value, mortgage rate from nav. These belong in KPI cards.
+
+## Step 4 — Reorder sections to match CLAUDE.md hierarchy
+The current order is:
+1. Command (CSHI + KPIs + ForecastBanner)
+2. Forecast (ModelAccuracy + ConfidenceRing + CycleClock)
+3. Map
+4. Materials
+5. Pipeline
+6. Federal
+7. Equities
+8. Signals
+
+The target order:
+1. KPI row (6 cards — move out of Command section, make standalone)
+2. **ForecastChart + ScenarioBuilder — THE HERO** (move to top, full-width or 60/40 split)
+3. WeeklyBrief excerpt (3 sentences — a brief pull-quote from the full brief)
+4. Command / CSHI (demoted — it’s now context below the forecast)
+5. Map
+6. Materials
+7. Pipeline
+8. Federal
+9. Equities
+10. Signals
+
+To do this, change the NAV_SECTIONS array and the order of `<Section>` blocks in the JSX.
+
+## Step 5 — Create src/app/dashboard/sections/ directory
+Extract each section into its own file so dashboard/page.tsx becomes an orchestrator.
+
+Create:
+- `src/app/dashboard/sections/KpiRow.tsx` — the 6 KPI cards
+- `src/app/dashboard/sections/HeroForecast.tsx` — ForecastChart + ScenarioBuilder side by side
+- `src/app/dashboard/sections/CommandSection.tsx` — CSHI + ModelAccuracy + CycleClock
+- `src/app/dashboard/sections/GeographicSection.tsx` — StateMap + TopStates + StateDrillDown
+- `src/app/dashboard/sections/MaterialsSection.tsx` — CommodityCards + ProcurementIndex + Heatmap
+- `src/app/dashboard/sections/PipelineSection.tsx` — PipelineTimeline + CascadeAlerts + PredictiveOverlay
+- `src/app/dashboard/sections/FederalSection.tsx` — FederalPrograms + AgencyVelocity + Leaderboard
+- `src/app/dashboard/sections/EquitiesSection.tsx` — SectorChart + ETFMonitor + EarningsCards
+- `src/app/dashboard/sections/SignalsSection.tsx` — AnomalyFeed + DivergenceDetector + WeeklyBrief
+
+Each section file:
+- Receives only the data it needs as props (typed)
+- Renders a skeleton when data is null
+- Stays under 200 lines
+
+## Step 6 — Target dashboard/page.tsx structure after refactor
+
+```tsx
+export default function Dashboard() {

- // All useEffect fetches stay here
- // All useState declarations stay here
- 
- return (
- <div>
- ```
   <DashboardNav spendVal={spendVal} />
  ```
- ```
   <div className="wrap">
  ```
- ```
     <KpiRow spend={spend} employ={employ} ... />
  ```
- ```
     <HeroForecast foreData={fore} signals={sigList} />
  ```
- ```
     <CommandSection cshi={cshi} ... />
  ```
- ```
     <GeographicSection mapData={mapD} ... />
  ```
- ```
     <MaterialsSection prices={prices} ... />
  ```
- ```
     <PipelineSection pipeline={pipeline} ... />
  ```
- ```
     <FederalSection federal={federal} ... />
  ```
- ```
     <EquitiesSection equities={equities} ... />
  ```
- ```
     <SignalsSection signals={signals} brief={brief} ... />
  ```
- ```
   </div>
  ```
- </div>
- )
  +}
  +```
- 

+Target: dashboard/page.tsx under 200 lines after refactor.
+
+## Step 7 — Verify
+`bash +npm run dev +`
+Open the dashboard. Verify all 8 sections render identically.
+Check that ForecastChart is now the first major content after the KPI row.
+
+`bash +npx tsc --noEmit && npm test +`
+Must pass with 0 errors and 18/18 tests.
diff –git a/.claude/commands/test-run.md b/.claude/commands/test-run.md
new file mode 100644
index 00000000..b3f7d817
— /dev/null
+++ b/.claude/commands/test-run.md
@@ -0,0 +1,66 @@
+# /test-run — Full verification suite before any commit or deploy
+
+Run this after every session. All checks must pass before pushing to main.
+
+## Run the full suite
+`bash +# 1. TypeScript — zero errors required +npx tsc --noEmit + +# 2. Tests — 18/18 required +npm test + +# 3. Lint — zero errors required +npm run lint +`
+
+## Integrity checks
+```bash
+# 4. No Math.random() in rendering paths (zero tolerance)
+echo “=== Math.random() check ===”
+grep -rn “Math.random()” src/app/ –include=”*.tsx” –include=”*.ts”
+echo “(no output = PASS)”
+
+# 5. No hardcoded hex colors outside theme.ts and globals.css
+echo “=== Hardcoded hex color check ===”
+grep -rn “#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}” src/app/ –include=”*.tsx” | \

- grep -v “globals.css” | grep -v “// “ | grep -v “stroke="#|fill="#”
  +echo “(only SVG stroke/fill hits are acceptable)”
- 

+# 6. No hardcoded font-family strings outside theme.ts
+echo “=== Hardcoded font-family check ===”
+grep -rn “font-family|fontFamily” src/app/ –include=”*.tsx” | \

- grep -v “font.sys|font.mono|globals.css”
  +echo “(no output = PASS)”
- 

+# 7. No console.log in production code
+echo “=== console.log check ===”
+grep -rn “console.log” src/app/ –include=”*.tsx” –include=”*.ts” | \

- grep -v “**tests**|.test.|.spec.”
  +echo “(no output = PASS)”
- 

+# 8. No emoji icons in UI components
+echo “=== Emoji icon check ===”
+grep -rn “icon.*[🏗️📋💰👷💹📡🔒📊🌲🔩🧱🔶🛢️⛽]” src/app/ –include=”*.tsx” | \

- grep -v “//|comments”
  +echo “(no output = PASS)”
  +```
- 

+## Component size check
+```bash
+echo “=== Files over 300 lines (should be split) ===”
+find src/app -name “*.tsx” -not -path “*/node_modules/*” | \

- xargs wc -l | sort -rn | awk ‘$1 > 300 {print}’ | head -10
  +```
- 

+## Pass criteria
+All of the following must be true before any deploy to main:
+
+- [ ] `npx tsc --noEmit` → 0 errors
+- [ ] `npm test` → 18/18 passing
+- [ ] `npm run lint` → 0 errors
+- [ ] `Math.random()` in src/app/ → 0 hits
+- [ ] No console.log in production code → 0 hits
+- [ ] Hardcoded hex colors → 0 hits (SVG stroke/fill values acceptable)
+
+If anything fails, fix it before continuing to the next session.
diff –git a/.claude/commands/wire-brief.md b/.claude/commands/wire-brief.md
new file mode 100644
index 00000000..0a4ef9bf
— /dev/null
+++ b/.claude/commands/wire-brief.md
@@ -0,0 +1,217 @@
+# /wire-brief — Connect WeeklyBrief to live Claude API generation
+
+`src/app/api/weekly-brief/route.ts` has an explicit comment:
+`// @anthropic-ai/sdk is not installed — always return the static brief`
+
+This command installs the SDK and implements real LLM-powered brief generation.
+
+## Step 1 — Install the SDK
+`bash +npm install @anthropic-ai/sdk +`
+
+## Step 2 — Add ANTHROPIC_API_KEY to .env.local
+` +ANTHROPIC_API_KEY=sk-ant-... +`
+
+Add to `.env.example`:
+` +ANTHROPIC_API_KEY=  # Anthropic API key — https://console.anthropic.com +`
+
+## Step 3 — Add weekly_briefs table to schema.sql
+```sql
+CREATE TABLE IF NOT EXISTS weekly_briefs (

- id            BIGSERIAL   PRIMARY KEY,
- brief_text    TEXT        NOT NULL,
- generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
- data_snapshot JSONB,
- model         TEXT        NOT NULL DEFAULT ‘claude-sonnet-4-5’,
- source        TEXT        NOT NULL DEFAULT ‘ai’
  +);
  +CREATE INDEX IF NOT EXISTS idx_weekly_briefs_generated_at
- ON weekly_briefs (generated_at DESC);
  +COMMENT ON TABLE weekly_briefs IS ‘LLM-generated weekly market intelligence briefs.’;
  +```
- 

+## Step 4 — Implement the generation route
+
+Replace `src/app/api/weekly-brief/route.ts` with:
+
+```typescript
+import { NextResponse } from ‘next/server’
+import Anthropic from ‘@anthropic-ai/sdk’
+import { supabaseAdmin } from ‘@/lib/supabase’
+
+export const runtime = ‘nodejs’
+export const dynamic = ‘force-dynamic’
+export const maxDuration = 30
+
+const CACHE_TTL_HOURS = 168  // 7 days — regenerate weekly
+
+async function getLatestObservation(seriesId: string) {

- const { data } = await supabaseAdmin
- .from(‘observations’)
- .select(‘value, obs_date’)
- .eq(‘series_id’, seriesId)
- .order(‘obs_date’, { ascending: false })
- .limit(2)
- if (!data || data.length < 2) return null
- const current = data[0].value
- const prior   = data[1].value
- const mom     = prior > 0 ? ((current - prior) / prior * 100).toFixed(1) : ‘0.0’
- return { value: current, obs_date: data[0].obs_date, mom: parseFloat(mom) }
  +}
- 

+export async function GET() {

- try {
- // Check for recent brief (within TTL)
- const { data: recent } = await supabaseAdmin
- ```
   .from('weekly_briefs')
  ```
- ```
   .select('brief_text, generated_at, source')
  ```
- ```
   .order('generated_at', { ascending: false })
  ```
- ```
   .limit(1)
  ```
- ```
   .single()
  ```
- 
- if (recent) {
- ```
   const ageHours = (Date.now() - new Date(recent.generated_at).getTime()) / 3600000
  ```
- ```
   if (ageHours < CACHE_TTL_HOURS) {
  ```
- ```
     return NextResponse.json({
  ```
- ```
       brief: recent.brief_text,
  ```
- ```
       generatedAt: recent.generated_at,
  ```
- ```
       source: recent.source,
  ```
- ```
     }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
  ```
- ```
   }
  ```
- }
- 
- // Generate a new brief
- const apiKey = process.env.ANTHROPIC_API_KEY
- if (!apiKey) {
- ```
   // Fall back to static if no API key
  ```
- ```
   return NextResponse.json({
  ```
- ```
     brief: STATIC_BRIEF,
  ```
- ```
     generatedAt: new Date().toISOString(),
  ```
- ```
     source: 'static',
  ```
- ```
   })
  ```
- }
- 
- // Gather latest data
- const [spend, employ, permits, starts] = await Promise.all([
- ```
   getLatestObservation('TTLCONS'),
  ```
- ```
   getLatestObservation('CES2000000001'),
  ```
- ```
   getLatestObservation('PERMIT'),
  ```
- ```
   getLatestObservation('HOUST'),
  ```
- ])
- 
- const snapshot = { spend, employ, permits, starts }
- 
- const client = new Anthropic({ apiKey })
- const message = await client.messages.create({
- ```
   model: 'claude-sonnet-4-5',
  ```
- ```
   max_tokens: 500,
  ```
- ```
   messages: [{
  ```
- ```
     role: 'user',
  ```
- ```
     content: `You are the chief economist for ConstructAIQ, a construction intelligence platform.
  ```

+Write a Weekly Market Intelligence Brief. Use ONLY the data provided below.
+
+STRICT RULES:
+- Every statistic you mention must come from the data provided
+- Do not invent or estimate any numbers
+- Plain English — no jargon
+- 200-280 words total
+- Use this exact format with these exact headers:
+
+HEADLINE SIGNAL: [one sentence summary of the biggest development]
+
+WHAT MOVED THIS WEEK:
+• [bullet 1 with specific number from data]
+• [bullet 2 with specific number from data]
+• [bullet 3 with specific number from data]
+
+WATCH NEXT WEEK:
+• [specific upcoming data release or signal to watch]
+• [specific upcoming data release or signal to watch]
+
+CURRENT DATA:
+Total Construction Spending: ${spend ? `$${(spend.value/1000).toFixed(2)}T (${spend.mom > 0 ? '+' : ''}${spend.mom}% MoM)` : ‘unavailable’}
+Construction Employment: ${employ ? `${(employ.value/1000).toFixed(1)}M (${employ.mom > 0 ? '+' : ''}${employ.mom}% MoM)` : ‘unavailable’}
+Building Permits: ${permits ? `${permits.value.toFixed(0)}K/yr SAAR (${permits.mom > 0 ? '+' : ''}${permits.mom}% MoM)` : ‘unavailable’}
+Housing Starts: ${starts ? `${starts.value.toFixed(0)}K/yr SAAR (${starts.mom > 0 ? '+' : ''}${starts.mom}% MoM)` : ‘unavailable’}`,

- ```
   }],
  ```
- })
- 
- const briefText = message.content[0].type === ‘text’ ? message.content[0].text : STATIC_BRIEF
- 
- // Store in database
- await supabaseAdmin.from(‘weekly_briefs’).insert({
- ```
   brief_text: briefText,
  ```
- ```
   data_snapshot: snapshot,
  ```
- ```
   model: 'claude-sonnet-4-5',
  ```
- ```
   source: 'ai',
  ```
- })
- 
- return NextResponse.json({
- ```
   brief: briefText,
  ```
- ```
   generatedAt: new Date().toISOString(),
  ```
- ```
   source: 'ai',
  ```
- }, { headers: { ‘Cache-Control’: ‘public, s-maxage=3600’ } })
- 
- } catch (err) {
- console.error(’[weekly-brief] generation failed:’, err)
- return NextResponse.json({
- ```
   brief: STATIC_BRIEF,
  ```
- ```
   generatedAt: new Date().toISOString(),
  ```
- ```
   source: 'static',
  ```
- })
- }
  +}
- 

+// Static fallback — used when API key absent or Claude API fails
+const STATIC_BRIEF = `HEADLINE SIGNAL: Construction sector remains in expansion with positive momentum across spending, employment, and permits. + +WHAT MOVED THIS WEEK: +• Real-time data currently unavailable — check back shortly +• Weekly brief generates automatically when data refreshes +• Configure ANTHROPIC_API_KEY to enable AI-powered briefs + +WATCH NEXT WEEK: +• Census Construction Put-in-Place (monthly release) +• BLS Employment Situation (construction payrolls)`
+` + +## Step 5 — Add cron job for Monday generation +Create `src/app/api/cron/brief/route.ts`: +`typescript
+// Called by Vercel cron every Monday at 07:00 ET (12:00 UTC)
+// Simply calls the weekly-brief GET endpoint to trigger generation and cache
+import { NextResponse } from ‘next/server’
+export const runtime = ‘nodejs’
+export async function GET(request: Request) {

- const auth = request.headers.get(‘authorization’)
- if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
- return NextResponse.json({ error: ‘Unauthorized’ }, { status: 401 })
- }
- const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/weekly-brief`)
- const data = await res.json()
- return NextResponse.json({ ok: true, source: data.source })
  +}
  +```
- 

+Add to vercel.json crons:
+`json +{ "path": "/api/cron/brief", "schedule": "0 12 * * 1" } +`
+
+## Step 6 — Test
+`bash +# Verify the route returns a structured response +curl http://localhost:3000/api/weekly-brief | jq '{source, generatedAt}' + +# With API key configured, source should be "ai" +# Without API key, source should be "static" +`
+
+`bash +npx tsc --noEmit && npm test +`
diff –git a/.claude/commands/wire-federal.md b/.claude/commands/wire-federal.md
new file mode 100644
index 00000000..42b0cdf4
— /dev/null
+++ b/.claude/commands/wire-federal.md
@@ -0,0 +1,152 @@
+# /wire-federal — Connect Federal Infrastructure Tracker to live USASpending data
+
+`src/app/api/federal/route.ts` returns 100% hardcoded static data.
+USASpending.gov API is free, requires no API key for basic queries, and updates daily.
+
+## Step 1 — Read the current file
+`bash +cat src/app/api/federal/route.ts +`
+Understand the shape it currently returns (programs, agencies, contractors, monthlyAwards, stateAllocations).
+
+## Step 2 — Add Supabase cache table
+Add to schema.sql (idempotent):
+```sql
+CREATE TABLE IF NOT EXISTS federal_cache (

- key         TEXT        PRIMARY KEY,
- data_json   JSONB       NOT NULL,
- cached_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  +);
  +COMMENT ON TABLE federal_cache IS ‘Cache for USASpending API responses. TTL enforced at application level.’;
  +```
- 

+## Step 3 — Implement the route with caching
+
+Replace the route body with:
+
+```typescript
+import { NextResponse } from ‘next/server’
+import { supabaseAdmin } from ‘@/lib/supabase’
+
+export const runtime = ‘nodejs’
+export const dynamic = ‘force-dynamic’
+
+const CACHE_KEY = ‘federal_construction_v1’
+const CACHE_TTL_HOURS = 24
+const NAICS_CODES = [‘2361’,‘2362’,‘2371’,‘2372’,‘2379’,‘2381’,‘2382’,‘2383’,‘2389’]
+
+async function fetchUSASpending() {

- // Awards by state (FY2025 YTD)
- const stateRes = await fetch(‘https://api.usaspending.gov/api/v2/spending_by_geography/’, {
- method: ‘POST’,
- headers: { ‘Content-Type’: ‘application/json’ },
- body: JSON.stringify({
- ```
   scope: 'place_of_performance',
  ```
- ```
   geo_layer: 'state',
  ```
- ```
   filters: {
  ```
- ```
     time_period: [{ start_date: '2024-10-01', end_date: '2025-09-30' }],
  ```
- ```
     naics_codes: NAICS_CODES,
  ```
- ```
     award_type_codes: ['A','B','C','D'],
  ```
- ```
   },
  ```
- }),
- signal: AbortSignal.timeout(15000),
- })
- 
- if (!stateRes.ok) throw new Error(`USASpending state API: ${stateRes.status}`)
- const stateData = await stateRes.json()
- 
- return { stateResults: stateData.results ?? [] }
  +}
- 

+export async function GET() {

- try {
- // Check cache first
- const { data: cached } = await supabaseAdmin
- ```
   .from('federal_cache')
  ```
- ```
   .select('data_json, cached_at')
  ```
- ```
   .eq('key', CACHE_KEY)
  ```
- ```
   .single()
  ```
- 
- if (cached) {
- ```
   const ageHours = (Date.now() - new Date(cached.cached_at).getTime()) / 3600000
  ```
- ```
   if (ageHours < CACHE_TTL_HOURS) {
  ```
- ```
     return NextResponse.json(cached.data_json)
  ```
- ```
   }
  ```
- }
- 
- // Cache miss or stale — fetch live
- const { stateResults } = await fetchUSASpending()
- 
- // Transform to the shape the dashboard components expect
- const stateAllocations = stateResults
- ```
   .sort((a: any, b: any) => b.aggregated_amount - a.aggregated_amount)
  ```
- ```
   .slice(0, 10)
  ```
- ```
   .map((s: any, i: number) => ({
  ```
- ```
     state: s.display_name,
  ```
- ```
     allocated: Math.round(s.aggregated_amount / 1e6),  // dollars → $M
  ```
- ```
     obligated: Math.round(s.aggregated_amount / 1e6),
  ```
- ```
     spent: Math.round(s.aggregated_amount * 0.72 / 1e6),  // ~72% execution rate
  ```
- ```
     executionPct: 72.0,
  ```
- ```
     rank: i + 1,
  ```
- ```
   }))
  ```
- 
- // Keep IIJA program bars as static (sourced from appropriations legislation — legitimately static)
- const responseData = {
- ```
   stateAllocations,
  ```
- ```
   programs: IIJA_PROGRAMS,   // keep existing static data
  ```
- ```
   agencies: AGENCY_DATA,     // keep existing static data
  ```
- ```
   contractors: [],           // TODO: wire to USASpending /api/v2/recipients/ in a future session
  ```
- ```
   monthlyAwards: [],         // TODO: wire to USASpending /api/v2/search/spending_over_time/
  ```
- ```
   source: 'usaspending',
  ```
- ```
   asOf: new Date().toISOString(),
  ```
- }
- 
- // Store in cache
- await supabaseAdmin.from(‘federal_cache’).upsert({
- ```
   key: CACHE_KEY,
  ```
- ```
   data_json: responseData,
  ```
- ```
   cached_at: new Date().toISOString(),
  ```
- })
- 
- return NextResponse.json(responseData)
- 
- } catch (err) {
- console.error(’[federal] USASpending fetch failed, returning cached or static:’, err)
- // Fall back to static data — never return an error to the dashboard
- return NextResponse.json({ stateAllocations: STATIC_FALLBACK, programs: IIJA_PROGRAMS, agencies: AGENCY_DATA, source: ‘static’ })
- }
  +}
  +```
- 

+Keep the existing static PROGRAMS and AGENCY data as the fallback. Never let a failed API call blank the dashboard.
+
+## Step 4 — Add to Vercel cron
+In `vercel.json`, add a daily federal refresh:
+```json
+{

- “crons”: [
- { “path”: “/api/cron/harvest”, “schedule”: “0 6 * * *” },
- { “path”: “/api/cron/federal”, “schedule”: “0 7 * * *” }
- ]
  +}
  +```
- 

+Create `src/app/api/cron/federal/route.ts` that calls the USASpending fetch and stores to cache.
+Protect it with the CRON_SECRET header check (same pattern as harvest/route.ts).
+
+## Step 5 — Add SAM.gov solicitations (optional, Phase 2)
+SAM.gov requires an API key (free registration). When ready:
+` +SAM_GOV_API_KEY=  # Register at https://sam.gov/content/entity-registration +`
+Add to `.env.example` with the registration URL as a comment.
+
+## Step 6 — Test
+`bash +curl http://localhost:3000/api/federal | jq '.stateAllocations[0]' +`
+Should return a real state with a non-static dollar value.
+
+`bash +npx tsc --noEmit && npm test +`
diff –git a/CLAUDE.md b/CLAUDE.md
index 3a760aa3..f9ffdfdf 100644
— a/CLAUDE.md
+++ b/CLAUDE.md
@@ -1,187 +1,258 @@

# ConstructAIQ — Claude Code Project Brief

+## Last audited: April 21, 2026
+
+—

## Non-negotiables

- Follow Apple Human Interface Guidelines for layout, hierarchy, spacing, adaptability, safe areas, and iOS-native interaction patterns.
  – Use Aeonik Pro throughout the project as the primary typeface.
  +- Use Aeonik Pro throughout as the primary typeface. Font files must be self-hosted in `/public/fonts/` with `@font-face` in `globals.css`. Until files are added, the system fallback renders — this is acceptable temporarily but not production-ready.
- Do not use AI-generated templating aesthetics.
- Do not use canned dashboard color schemes.
- The UX should feel modern, impactful, calm, premium, and operationally credible.
- The UX should resemble the composure and clarity of Revolut Business without copying its UI.
- Use Mastt only as a structural reference for construction forecasting UX. Do not copy layouts, styling, or components.

-## Product summary
-ConstructAIQ is a premium construction intelligence platform.
-It aggregates public construction and macroeconomic data, normalizes it into a unified time-series system, and surfaces:
– forecasts
– anomaly signals
– state activity
– materials intelligence
– scenario analysis
– decision-ready dashboard views
+—
+
+## Product
+ConstructAIQ is a premium construction market intelligence platform deployed at **constructaiq.trade**.
+
+It aggregates public construction and macroeconomic data into a unified Supabase time-series store and surfaces:
+- 12-month ensemble AI forecast (Holt-Winters + SARIMA + XGBoost) with 80%/95% confidence intervals
+- Anomaly detection signals (Z-score alerts, trend reversals)
+- 50-state construction activity heatmap
+- Materials intelligence — BUY/SELL/HOLD signals for lumber, steel, concrete, copper, WTI, diesel
+- Federal infrastructure tracking (IIJA/IRA program execution)
+- Scenario builder (rate shocks, IIJA funding, labor/material cost shifts)
+- REST API with tiered key access (Intelligence $490/mo, Professional $1,490/mo, Enterprise custom)
+- Weekly AI intelligence brief
+
+—
+
+## Tech stack
+| Layer | Technology |
+|—|—|
+| Framework | Next.js 15, React 18, TypeScript 5 |
+| Database | Supabase (PostgreSQL) — tables: `series`, `observations`, `forecasts`, `api_keys` |
+| Rate limiting | Upstash Redis |
+| Error monitoring | Sentry |
+| Deployment | Vercel (constructaiq.trade) |
+| Testing | Vitest (18 tests, CI on every push via `.github/workflows/ci.yml`) |
+| Charts | Recharts (ForecastBanner) + custom SVG (ForecastChart) — standardize on custom SVG |
+| Design system | `src/lib/theme.ts` — Aeonik Pro, Apple HIG tokens |
+
+—
+
+## Key file paths
+```
+src/lib/theme.ts                          Design tokens — source of truth for all colors, type, spacing
+src/app/globals.css                       Global styles + Aeonik Pro @font-face (to be added)
+src/app/layout.tsx                        Root layout — font class must be applied here
+src/app/page.tsx                          Homepage — 698 lines, needs refactor
+src/app/dashboard/page.tsx               Dashboard — 598 lines, needs splitting
+src/app/dashboard/components/            40+ dashboard components
+src/app/dashboard/sections/              (to be created) — section components split from dashboard
+src/lib/models/                          Forecasting engine — DO NOT MODIFY

- ensemble.ts                            3-model weighted ensemble
- holtwinters.ts                         Holt-Winters DES
- sarima.ts                              SARIMA(1,1,0)(0,1,0)[12]
- xgboost.ts                             XGBoost gradient boosting
  +src/app/api/                             38+ API routes
  +src/app/api/cron/harvest/route.ts        Data harvest cron — FRED, Census, BLS → Supabase
  +src/app/api/cron/forecast/route.ts       Forecast compute cron
  +src/app/api/federal/route.ts             ⚠ MOCK DATA — needs USASpending API integration
  +src/app/api/weekly-brief/route.ts        ⚠ STATIC CONTENT — needs Claude API integration
  +schema.sql                               PostgreSQL schema — idempotent, safe to re-run
  +src/app/globe/GlobeClient.tsx            WebGL globe — impressive; uses hardcoded fonts (fix)
  +public/widget.js                         Embeddable widget loader
  +```
- 

+—
+
+## Known bugs — fix before new features
+
+### 🔴 Critical
+
+**1. Aeonik Pro font not loaded**
+- `globals.css` has no `@font-face` declaration (comment says “add when available”)
+- `/public/fonts/` directory does not exist — no woff2 files present
+- `layout.tsx` body has no font class: `<body>{children}</body>`
+- Every screen renders in the system fallback chain
+- **Fix:** Add `@font-face` to `globals.css`, apply `className="fa"` to `<html>` and `<body>` in `layout.tsx`
+
+**2. `Math.random()` in production rendering**
+- `dashboard/page.tsx` line ~200: `spark()` function uses `Math.random()` — sparklines change on every render
+- `dashboard/page.tsx` heatmapData: `(Math.random()-0.5)*c.value*0.05` — heatmap values change on scroll
+- `dashboard/page.tsx` corrMaterials/corrSpend: `(Math.random()-0.5)*15` — correlation chart data is random
+- **Fix:** Replace with deterministic data from Supabase `observations` table
+
+**3. Federal infrastructure data is 100% mock**
+- `src/app/api/federal/route.ts` returns entirely hardcoded static arrays
+- IIJA program bars, agency velocity, contractor leaderboard, state allocations — all fake
+- USASpending.gov API is free and supports the needed queries
+- **Fix:** Integrate USASpending API with 24-hour Supabase cache
+
+**4. WeeklyBrief returns static content forever**
+- `src/app/api/weekly-brief/route.ts` contains a hardcoded `STATIC_BRIEF` string
+- Has explicit comment: `// @anthropic-ai/sdk is not installed — always return the static brief`
+- **Fix:** Install `@anthropic-ai/sdk`, implement Claude API call, add to Vercel cron
+
+### 🟡 Important
+
+**5. `GateLock` never actually gates**
+- Every `GateLock` in `dashboard/page.tsx` is called with `locked={false}`
+- The component itself works (it blurs and overlays when `locked={true}`)
+- Either wire to a real user plan check or remove the component
+- **Decision needed:** Implement real plan gating or remove `GateLock` for now
+
+**6. ForecastChart uses fixed `width=620`**
+- Custom SVG chart uses `width={620}` as default prop
+- Does not respond to container size — causes overflow on narrow screens
+- Already uses `viewBox` — convert to responsive by removing fixed `width` prop and using `width="100%"`
+
+**7. ForecastBanner uses Recharts; ForecastChart uses custom SVG**
+- Two different chart libraries for the same type of content — visual inconsistency
+- ForecastChart (custom SVG) is better — more control, confidence bands are cleaner
+- Migrate ForecastBanner to use the same custom SVG approach as ForecastChart

-## Core value proposition
-ConstructAIQ helps construction leaders forecast market risk, cost pressure, labor volatility, and activity shifts earlier, so they can act before projects, capital plans, or margins drift.
+**8. GlobeClient.tsx bypasses theme.ts**
+- Uses hardcoded `var SYS = "-apple-system,BlinkMacSystemFont,'SF Pro Display',Arial,sans-serif"`
+- Should import from `src/lib/theme.ts` like every other component
+
+—
+
+## What is genuinely strong — DO NOT TOUCH
+
+` +src/lib/models/          The 3-model ensemble is production-quality ML code +src/lib/theme.ts         Design token system is well-structured — extend, don't rewrite +src/lib/auth.ts          API key system works +src/lib/ratelimit.ts     Upstash rate limiting works +schema.sql               Database schema is clean and idempotent +.github/workflows/ci.yml CI pipeline works +src/app/api/cron/        Harvest pipeline works +src/app/api/forecast/    Forecast route works — real seed data baked in +src/app/dashboard/components/GateLock.tsx    Component logic works — just never called with locked=true +src/app/dashboard/components/CycleClock.tsx  Well-built SVG polar chart +src/app/dashboard/components/ForecastChart.tsx  Well-built — just needs responsive + additions +`
+
+—

## Brand and design direction

-The product should feel like:
+
+**The product should feel like:**

- Apple-grade clarity
- Revolut Business composure
  – premium dark UI
  – executive-readable construction intelligence
  – calm, not flashy
  – decisive, not noisy
- 

## -Avoid:
– terminal cosplay
– Bloomberg imitation as a visual style
– generic enterprise admin dashboards
– rainbow chart palettes
– over-signaled AI widgets
– cluttered nav chrome
– too many equal-weight cards on one page

-## Current repo diagnosis
-The existing product concept is strong, but the UI is inconsistent.
-Problems already identified:
– typography is inconsistent across layout.tsx, globals.css, and theme.ts
– Aeonik Pro is not the single active typographic system yet
– the homepage is over-sectioned and gives too many areas equal visual weight
– the dashboard uses too much chrome (ticker, strip, terminal framing)
– forecast content is strong but not yet presented as a premium hero experience
– diagnostics and supporting modules compete too much with primary insight
+- Premium dark UI — executive-readable construction intelligence
+- Calm, not flashy — decisive, not noisy
+
+**Avoid:**
+- Terminal cosplay (the live ticker frames everything wrong — remove it)
+- Bloomberg imitation as visual style
+- Generic enterprise admin dashboards
+- Rainbow chart palettes
+- Over-signaled AI widgets
+- Cluttered nav chrome
+- Too many equal-weight cards on one page
+
+—

## Experience principles

## – One screen should communicate one primary decision.
– One major section should have one dominant visual.
– Controls should support content, not compete with it.
– Forecasting is the hero capability.
– Signals, states, materials, and news are supporting layers.
– AI must always be explainable and source-aware.
– Confidence, freshness, and context should accompany predictive outputs.
– If a screen feels crowded, reduce panel count before adding polish.

## -## Story hierarchy for the marketing site
-The website should communicate this sequence:
-1. Forecast construction risk earlier
-2. See what changed and why
-3. Compare scenarios before committing capital
-4. Trust the signal through explainable models and confidence ranges
-5. Act through decision-ready views

## -## Homepage structure
-Preferred order:
-1. top navigation
-2. hero with one dominant product visual
-3. trust/proof strip
-4. three outcome cards
-5. platform showcase
-6. forecasting deep-dive
-7. use cases
-8. final CTA

## -Rules:
– lead with product UI, not stock construction imagery
– one dominant forecast chart in the hero visual
– one supporting insight rail
– supporting sections must be visually quieter than the hero
– reduce testimonial and source noise

## -## Dashboard structure
-Preferred order:
-1. page header
-2. KPI row
-3. hero forecast chart
-4. AI explanation / top signals rail
-5. supporting modules below
-6. detail views or drill-down areas

## -Rules:
– demote or remove terminal-style ticker dominance
– demote diagnostics like feed status
– enlarge the hero forecast chart
– keep only one primary insight region above the fold
– do not let signals, states, prices, and news compete equally with the forecast

## -## Forecast screen rules
-Keep:
– historical line
– forecast line
– confidence bands
– model context

## -Add or strengthen:
– previous forecast comparison
– driver annotation
– summary metadata
– explanation of what changed and why
– scenario controls near the chart

## -Simplify:
– legends
– visual noise
– technical clutter

## -## Scenario design rules
-The scenario builder should feel like a strategic planning tool, not a utility widget.
-Requirements:
– place it beside or below the hero forecast chart
– improve slider presentation and spacing
– support scenario presets
– show instant delta impact
– summarize effects clearly

-## Mobile and iPhone rules
– do not compress desktop layouts into mobile
– briefing-first layout
– one main chart per screen section
– move advanced controls into sheets
– preserve safe areas and touch targets
– follow Apple HIG reachability and hierarchy expectations
+1. One screen communicates one primary decision
+2. One major section has one dominant visual
+3. Controls support content — they don’t compete with it
+4. **Forecasting is the hero capability** — it should be the first thing after KPIs
+5. Signals, states, materials, and news are supporting layers
+6. AI must be explainable and source-aware
+7. Confidence, freshness, and context accompany all predictive outputs
+8. If a screen feels crowded, reduce panel count before adding polish
+
+—
+
+## Dashboard hierarchy (target)
+` +1. Minimal nav header — logo | section links | LIVE dot | one key metric +2. KPI row — 6 cards, compact +3. ForecastChart HERO — large, full-width, immediately prominent +4. ScenarioBuilder — beside or below ForecastChart (not in a sidebar) +5. WeeklyBrief excerpt — 3 sentences max at this position +6. CSHI / Command Center (demoted from top) +7. Geographic / StateMap +8. Materials +9. Pipeline +10. Federal +11. Equities +12. Signals +`
+
+**Current problem:** CSHI gauge + history + model accuracy + confidence ring sits above the forecast. The forecast is what users came for. Move it up.
+
+—
+
+## Homepage structure (target)
+` +1. Navigation (sticky, transparent → frosted on scroll) +2. Hero — one dominant forecast chart (live data) + one insight rail +3. Trust/proof strip — data sources, not testimonials +4. Three outcome cards — Forecast | Signals | Scenario +5. Platform showcase — real dashboard UI +6. Forecasting deep-dive — model mechanics, confidence bands +7. Use cases — three specific user types +8. Final CTA — email capture + dashboard link +`
+
+**Current problem:** ForecastPreview in hero uses illustrative/synthetic data, not live API data.
+
+—

## Typography rules

-Aeonik Pro is the primary typeface for:
– page titles
– section headings
– KPI numerals
– navigation labels
– chart titles
– marketing headlines
+- Aeonik Pro is the single active typeface: titles, headings, KPI numerals, navigation, chart titles, marketing copy
+- Use `font.mono` (SF Mono fallback) ONLY for: numeric data values in tables/feeds, API key display, timestamps, series IDs, technical labels
+- Mono is a technical accent — not the primary visual voice
+- All type styles live in `theme.ts` as `type.*` tokens — use them; never override font-size or font-weight inline

-Use mono only when it truly improves technical readability.
-Do not let mono dominate the product’s visual tone.
+—

## Coding rules

## -When implementing UI:
– create reusable layout primitives
– create reusable card components
– create reusable chart containers
– use design tokens for spacing, color, radius, shadows, and type
– remove one-off inline styling where practical
– keep components visually consistent across screens
– choose elegance over density unless explicitly told otherwise
– choose usability over novelty
– choose trust over AI spectacle

-## Repo-specific execution order
-1. Refactor typography across:

- - src/app/layout.tsx
- - src/app/globals.css
- - src/lib/theme.ts
    -2. Establish a consistent tokenized design system.
    -3. Redesign the homepage in src/app/page.tsx.
    -4. Redesign the dashboard shell in src/app/dashboard/page.tsx.
    -5. Redesign forecast and scenario modules.
    -6. Redesign supporting modules to be quieter and more coherent.
    -7. Review everything against Apple HIG, Revolut Business-like composure, and Aeonik Pro consistency.
- 

-## Working style
-Before coding a screen:
-1. identify the primary user decision
-2. define the hero content
-3. define supporting content
-4. simplify hierarchy
-5. identify components to reuse or rebuild
-6. implement
-7. self-review for spacing, hierarchy, and polish
+- All colors come from `color.*` in `theme.ts` — never write raw hex strings in component files
+- All spacing comes from `space.*` tokens where practical
+- `Math.random()` is banned from all rendering paths — causes hydration mismatches and flicker
+- No emoji as UI icons — use Lucide React or inline SVG
+- Components over 300 lines must be split
+- Every data-dependent render needs a loading state (skeleton or spinner)
+- Self-review before committing:

- 1. Does it use theme tokens? (no raw hex strings?)
- 1. Is Aeonik Pro rendering — not the fallback?
- 1. Is hierarchy clear — one dominant element?
- 1. Does it work at 375px mobile width?
- 1. Are loading states handled?
- 1. Zero `Math.random()` in render paths?
- 

+—
+
+## Working style for Claude Code
+Before coding any screen:
+1. Identify the primary user decision this screen supports
+2. Define the hero content (one dominant visual)
+3. Define supporting content (everything else, quieter)
+4. Simplify the hierarchy — remove before adding
+5. Identify components to reuse or rebuild
+6. Implement
+7. Self-review for spacing, hierarchy, and polish

## Do not decorate the existing UI. Recompose it.
+
+—
+
+## Execution order (current sprint)
+1. Fix font system (`layout.tsx` + `globals.css`) — everything sits on this
+2. Eliminate `Math.random()` from dashboard — replace with Supabase observations data
+3. Split `dashboard/page.tsx` into `sections/` components
+4. Remove ticker, reorder dashboard sections — forecast as hero
+5. Elevate `ForecastChart` + `ScenarioBuilder`
+6. Redesign homepage (`page.tsx`) — live forecast data in hero
+7. Wire `federal/route.ts` to USASpending API
+8. Wire `weekly-brief/route.ts` to Claude API
+9. Mobile/iPhone pass — Apple HIG, safe areas, responsive charts
+10. Performance + launch readiness — skeletons, error boundaries, CSP

2.43.0