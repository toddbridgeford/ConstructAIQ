# /fix-font — Install Aeonik Pro and fix the typography system end-to-end

The font is declared in theme.ts but never loaded. Every screen renders in the system fallback.
Run this command to fix the entire font system in one pass.

## Steps

### Step 1 — Check for font files

```bash
ls public/fonts/ 2>/dev/null || echo "Directory does not exist"
```

### Step 2 — Add @font-face to globals.css

Add these declarations at the very top of `src/app/globals.css`, before all other rules:

```css
/* ─── Aeonik Pro ──────────────────────────────────────────────────────────
   Self-host woff2 files at /public/fonts/AeonikPro-{weight}.woff2
   Obtain a license at: https://www.cotypefoundry.com/aeonik
   Weights needed: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold)
   Until files are present, the fallback chain renders cleanly.
   ────────────────────────────────────────────────────────────────────── */
@font-face {
  font-family: 'Aeonik Pro';
  src: url('/fonts/AeonikPro-Light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Aeonik Pro';
  src: url('/fonts/AeonikPro-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Aeonik Pro';
  src: url('/fonts/AeonikPro-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Aeonik Pro';
  src: url('/fonts/AeonikPro-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

### Step 3 — Fix layout.tsx

Replace the current body tag with font classes applied:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="fa">
      <body className="fa">{children}</body>
    </html>
  )
}
```

The `.fa` class is already in globals.css: `font-family: 'Aeonik Pro', -apple-system, ...`

### Step 4 — Fix GlobeClient.tsx font hardcoding

`src/app/globe/GlobeClient.tsx` uses its own hardcoded font variable:

```typescript
var SYS = "-apple-system,BlinkMacSystemFont,'SF Pro Display',Arial,sans-serif"  // ← wrong
```

Replace with:

```typescript
import { font } from '@/lib/theme'
// Then use font.sys everywhere SYS was used
```

### Step 5 — Scan for remaining hardcoded font-family strings

```bash
grep -rn "font-family\|fontFamily" src/app/ --include="*.tsx" --include="*.ts" | grep -v "theme\.ts" | grep -v "globals\.css" | grep -v "node_modules"
```

Fix every hit to use `font.sys` or `font.mono` from theme.ts.

### Step 6 — Run tests

```bash
npx tsc --noEmit
npm test
```

### Step 7 — Verify in browser

Open DevTools → Elements → select any text element → Computed → font-family
Should show ‘Aeonik Pro’ when font files are present, or the fallback chain when they’re not.
Both are acceptable. The @font-face declarations being present is the goal.

## Note for font licensing

Aeonik Pro requires a commercial license from Co-Type Foundry.
Purchase at: https://www.cotypefoundry.com/aeonik
Place the licensed woff2 files in /public/fonts/ after purchase.
The system fallback (-apple-system, Helvetica Neue) is acceptable during development.