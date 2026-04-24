import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    // networkidle never fires here because the dashboard has background API
    // polling keeping open connections; domcontentloaded is sufficient.
    await page.waitForLoadState('domcontentloaded')
  })

  // ── Error page guard ───────────────────────────────────────────────────────

  test('page does not show the global error page', async ({ page }) => {
    const body = await page.locator('body').textContent()

    // Fail immediately if the crash fallback rendered — this is the most
    // important assertion in the suite.
    expect(body).not.toContain('Something went wrong')
    expect(body).not.toContain('A rendering error occurred')
  })

  // ── Title ──────────────────────────────────────────────────────────────────

  test('dashboard page has correct title', async ({ page }) => {
    // No fallback: if the title does not contain ConstructAIQ the test fails.
    await expect(page).toHaveTitle(/ConstructAIQ/i)
  })

  // ── Shell structure ────────────────────────────────────────────────────────

  test('#main-content wrapper is present', async ({ page }) => {
    // dashboard/page.tsx renders <div id="main-content"> as the outermost wrapper.
    // Its absence means the component threw before the shell could render.
    const shell = page.locator('#main-content')
    await expect(shell).toBeAttached({ timeout: 10_000 })
  })

  // ── Sidebar navigation ─────────────────────────────────────────────────────

  test('sidebar shows Overview nav item', async ({ page }) => {
    // Sidebar.tsx renders "Overview" as a labelled nav link at 1280 px viewport
    // (Desktop Chrome default → 'wide' breakpoint → full labels visible).
    // If the sidebar crashes or fails to hydrate this text will be absent.
    await expect(page.getByText('Overview', { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('sidebar shows Forecast nav item', async ({ page }) => {
    await expect(page.getByText('Forecast', { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('sidebar shows Material Costs nav item', async ({ page }) => {
    await expect(page.getByText('Material Costs', { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  // ── Section content ────────────────────────────────────────────────────────

  test('overview section renders construction-related content', async ({ page }) => {
    // The default active section is 'overview'. After hydration and API load the
    // OverviewSection renders KPI cards with construction-domain labels.
    // We check for text that is structurally present in the component and
    // absent from the global error page.
    await page.waitForTimeout(3_000)

    const body = await page.locator('body').textContent()
    const hasConstruction =
      body!.includes('Construction') ||
      body!.includes('construction') ||
      body!.includes('Employment')   ||
      body!.includes('Permits')      ||
      body!.includes('Spending')     ||
      body!.includes('CSHI')

    expect(hasConstruction).toBe(true)
  })

  // ── Console error guard ────────────────────────────────────────────────────

  test('dashboard loads without uncaught console errors', async ({ page }) => {
    // Capture errors BEFORE navigation so we catch errors from initial load.
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/dashboard')
    // Background polling keeps connections open so networkidle never fires.
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3_000)

    // Filter patterns that are known harmless in this environment:
    //   • Network fetch failures that the app handles silently
    //   • Sentry SDK notices (emitted regardless of DSN)
    //   • Next.js telemetry/edge-runtime notices
    //   • Browser extension injections (chrome-extension://)
    //   • Static asset 404s (e.g. Aeonik Pro font files — not yet deployed to /public/fonts/)
    const HARMLESS = [
      'Failed to fetch',
      'Failed to load resource',   // static asset 404s (fonts, etc.) — not JS errors
      'net::ERR_',
      'ERR_CONNECTION',
      'Sentry',
      'sentry',
      'chrome-extension://',
      'Content Security Policy',
    ]

    const realErrors = errors.filter(
      err => !HARMLESS.some(pattern => err.includes(pattern)),
    )

    expect(realErrors, `Unexpected console errors:\n${realErrors.join('\n')}`).toEqual([])
  })
})
