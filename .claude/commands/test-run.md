# /test-run — Full verification suite before any commit or deploy

Run this after every session. All checks must pass before pushing to main.

## Run the full suite

```bash
# 1. TypeScript — zero errors required
npx tsc --noEmit

# 2. Tests — 18/18 required
npm test

# 3. Lint — zero errors required
npm run lint
```

## Integrity checks

```bash
# 4. No Math.random() in rendering paths (zero tolerance)
echo "=== Math.random() check ==="
grep -rn "Math\.random\(\)" src/app/ --include="*.tsx" --include="*.ts"
echo "(no output = PASS)"

# 5. No hardcoded hex colors outside theme.ts and globals.css
echo "=== Hardcoded hex color check ==="
grep -rn "#[0-9a-fA-F]\{6\}\|#[0-9a-fA-F]\{3\}" src/app/ --include="*.tsx" | \
  grep -v "globals\.css" | grep -v "// " | grep -v "stroke=\"#\|fill=\"#"
echo "(only SVG stroke/fill hits are acceptable)"

# 6. No hardcoded font-family strings outside theme.ts
echo "=== Hardcoded font-family check ==="
grep -rn "font-family\|fontFamily" src/app/ --include="*.tsx" | \
  grep -v "font\.sys\|font\.mono\|globals\.css"
echo "(no output = PASS)"

# 7. No console.log in production code
echo "=== console.log check ==="
grep -rn "console\.log" src/app/ --include="*.tsx" --include="*.ts" | \
  grep -v "__tests__\|\.test\.\|\.spec\."
echo "(no output = PASS)"

# 8. No emoji icons in UI components
echo "=== Emoji icon check ==="
grep -rn "icon.*[🏗️📋💰👷💹📡🔒📊🌲🔩🧱🔶🛢️⛽]" src/app/ --include="*.tsx" | \
  grep -v "//\|comments"
echo "(no output = PASS)"
```

## Component size check

```bash
echo "=== Files over 300 lines (should be split) ==="
find src/app -name "*.tsx" -not -path "*/node_modules/*" | \
  xargs wc -l | sort -rn | awk '$1 > 300 {print}' | head -10
```

## Pass criteria

All of the following must be true before any deploy to main:

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm test` → 18/18 passing
- [ ] `npm run lint` → 0 errors
- [ ] `Math.random()` in src/app/ → 0 hits
- [ ] No console.log in production code → 0 hits
- [ ] Hardcoded hex colors → 0 hits (SVG stroke/fill values acceptable)

If anything fails, fix it before continuing to the next session.