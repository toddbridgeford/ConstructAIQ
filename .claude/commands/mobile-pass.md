# /mobile-pass — Apple HIG mobile compliance pass

Run this after any major layout change. ConstructAIQ’s users check this on job sites from iPhones.

## Step 1 — ForecastChart responsive fix (highest priority)

The custom SVG ForecastChart is the most important chart on the platform.
It uses `viewBox` already, which means it scales — but it needs `width="100%"` on the SVG element.

```tsx
// In ForecastChart.tsx — the SVG element should be:
<svg 
  width="100%"               // ← scales to container
  viewBox={`0 0 620 480`}    // ← fixed internal coordinate space
  style={{ overflow: "visible", display: "block" }}
>
```

Verify this renders correctly at 375px by resizing the browser window.
The chart should scale smoothly without overflow or text clipping.

## Step 2 — Safe area insets

All sticky/fixed elements must respect safe areas:

Check these components:

- Dashboard nav (`position: sticky, top: 0`) — add `paddingTop: 'env(safe-area-inset-top, 0px)'`
- Any bottom-fixed elements — add `paddingBottom: 'env(safe-area-inset-bottom, 0px)'`
- Homepage nav (fixed position) — same treatment

## Step 3 — Touch targets (44×44px minimum)

```bash
# Find potential small targets
grep -n "height.*[0-9]\+" src/app/dashboard/page.tsx | grep -E "height:[ ]*[0-9]{1,2}[,\}]"
```

Common violations in this codebase:

- Dashboard nav section buttons: `padding: "4px 8px"` — tap target likely too small
- Any `fontSize: 10` + `padding: 4px` combination
- Icon-only buttons without explicit size

Fix: Minimum `minHeight: 44, minWidth: 44` on any interactive element.

## Step 4 — Mobile layout — stacked vs side-by-side

Every `display: "flex"` row that places two charts or cards side by side needs a mobile breakpoint.

Pattern to find and fix:

```bash
grep -n "flex.*1.*flex.*1\|flex.*2.*flex.*1" src/app/dashboard/page.tsx | head -20
```

For each side-by-side pair, add `flexWrap: "wrap"` and `minWidth` guards:

```tsx
// Before — breaks on mobile:
<div style={{ display: "flex", gap: 20 }}>
  <Card style={{ flex: "2 1 480px" }}>...</Card>
  <Card style={{ flex: "1 1 260px" }}>...</Card>
</div>

// After — wraps gracefully on mobile:
<div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
  <Card style={{ flex: "2 1 480px", minWidth: 0 }}>...</Card>
  <Card style={{ flex: "1 1 260px", minWidth: 260 }}>...</Card>
</div>
```

On screens under 480px, the `1 1 260px` card wraps to a new row automatically.

## Step 5 — ScenarioBuilder as bottom sheet on mobile

ScenarioBuilder is a control-heavy component that doesn’t belong inline on mobile.

Create `src/app/components/BottomSheet.tsx`:

```tsx
"use client"
import { useEffect } from "react"
import { color, radius } from "@/lib/theme"

export function BottomSheet({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 400, backdropFilter: "blur(4px)",
      }} />
      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500,
        background: color.bg1,
        borderRadius: `${radius.xl2}px ${radius.xl2}px 0 0`,
        padding: "20px 24px",
        paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        maxHeight: "80vh",
        overflowY: "auto",
      }}>
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, background: color.bd2, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontWeight: 600, marginBottom: 16 }}>{title}</div>
        {children}
      </div>
    </>
  )
}
```

In the dashboard, wrap ScenarioBuilder:

```tsx
// Mobile: show a "Scenario" button that opens the sheet
// Desktop: show ScenarioBuilder inline

const [scenarioOpen, setScenarioOpen] = useState(false)
const isMobile = typeof window !== 'undefined' && window.innerWidth < 480

// Mobile button:
<button onClick={() => setScenarioOpen(true)} className="btn-g">
  Scenario Modeler
</button>
<BottomSheet open={scenarioOpen} onClose={() => setScenarioOpen(false)} title="Scenario Modeler">
  <ScenarioBuilder spendVal={spendVal} />
</BottomSheet>
```

## Step 6 — Test widths

Resize browser to these widths and verify nothing breaks:

- 375px (iPhone SE)
- 390px (iPhone 14)
- 430px (iPhone 15 Plus)
- 768px (iPad)
- 1024px (iPad landscape / small laptop)
- 1440px (desktop)

Key things to verify at 375px:

- [ ] ForecastChart fills width without overflow
- [ ] KPI cards wrap to 2-column grid
- [ ] Nav section links don’t overflow horizontally
- [ ] No horizontal scrollbar appears
- [ ] Touch targets are large enough to tap accurately