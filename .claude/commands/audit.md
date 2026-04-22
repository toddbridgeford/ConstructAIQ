# /audit — Systematic code review of any file or component

Run this before touching any file to understand what needs fixing.

## Steps

Read the file the user specifies. Run each check and report findings with line numbers.

### Check 1 — Font

Is Aeonik Pro applied via `font.sys` from theme.ts?
Or is there a hardcoded `font-family` string bypassing the token?

```bash
grep -n "font-family\|fontFamily" [FILE] | grep -v "font\.sys\|font\.mono\|theme"
```

Flag any hits. GlobeClient.tsx is a known offender — `var SYS = "-apple-system..."` should be `import { font } from '@/lib/theme'`.

### Check 2 — Hardcoded colors

Are raw hex strings used instead of `color.*` tokens from theme.ts?

```bash
grep -n "#[0-9a-fA-F]\{3,6\}" [FILE]
```

Flag any hex not in theme.ts or globals.css.

### Check 3 — Math.random()

Is `Math.random()` used anywhere in the rendering path?

```bash
grep -n "Math\.random" [FILE]
```

Any hit in a component file is a bug. Zero tolerance.

### Check 4 — Visual hierarchy

Is there one clearly dominant element on screen?
Review the layout structure. If more than one element competes for top-level attention, flag it.
Dashboard rule: forecast chart must be dominant, not equal to CSHI gauge.

### Check 5 — Mono overuse

Is `font.mono` (MONO) used for non-numerical, non-technical content?
Labels, headings, section titles, body copy should all use `font.sys`.
Flag any `fontFamily: MONO` on content that isn’t: a number, a series ID, an API key, a timestamp, or a code value.

### Check 6 — Inline style overrides

Are `fontSize`, `fontWeight`, `color`, `borderRadius`, `padding` hardcoded instead of using theme tokens?
A small number is acceptable. More than 3-4 per component is a smell.

### Check 7 — Loading state

Does every `{data && <Component />}` pattern have an else branch for loading?
A null check with no skeleton means blank space while data loads.

### Check 8 — Mobile

Does any `display: "flex"` row lack `flexWrap: "wrap"` or a `minWidth` guard?
Would this break at 375px?

### Check 9 — Component size

```bash
wc -l [FILE]
```

Over 200 lines: acceptable.
Over 300 lines: should be split.
Over 500 lines: must be split.

### Check 10 — Emoji as icons

```bash
grep -n "icon.*[🏗️📋💰👷💹📡🔒]" [FILE]
```

Production UI should not use emoji as icons. Replace with Lucide React.

## Report format

List each finding as:

- **[CHECK NAME]** Line X: [description of issue] → [suggested fix]
- **PASS** if the check passes with no issues

End with a priority-ordered fix list.
