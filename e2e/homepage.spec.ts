import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  // ── Brand and title ────────────────────────────────────────────────────────

  test('page has correct title and logo is visible', async ({ page }) => {
    await expect(page).toHaveTitle(/ConstructAIQ/i)

    // Logo img with alt="ConstructAIQ" must be in the DOM and visible.
    // The global error page renders a monospace text label, not an image —
    // so a visible logo proves the real page rendered.
    const logo = page.locator('img[alt="ConstructAIQ"]').first()
    await expect(logo).toBeVisible({ timeout: 10_000 })
  })

  // ── Hero h1 ────────────────────────────────────────────────────────────────

  test('main h1 is visible with substantive content', async ({ page }) => {
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible({ timeout: 10_000 })

    const text = await h1.textContent()
    // Must not be a placeholder — the real headline is a full sentence
    expect(text?.trim().length).toBeGreaterThan(10)
  })

  // ── Primary CTA ────────────────────────────────────────────────────────────

  test('Open Dashboard link exists and points to /dashboard', async ({ page }) => {
    // Multiple "Open Dashboard →" links are rendered in the hero section.
    // This assertion has no fallback: if no link is present the test must fail.
    const cta = page.locator('a[href="/dashboard"]').first()
    await expect(cta).toBeVisible({ timeout: 10_000 })
  })

  test('Open Dashboard CTA navigates to /dashboard', async ({ page }) => {
    const cta = page.locator('a[href="/dashboard"]').first()
    await expect(cta).toBeVisible({ timeout: 10_000 })
    await cta.click()
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })
    expect(page.url()).toContain('/dashboard')
  })

  // ── Subscribe CTA ──────────────────────────────────────────────────────────

  test('subscribe link is present in the hero', async ({ page }) => {
    // The hero section renders an explicit <Link href="/subscribe"> —
    // no body-text fallback; if the link is gone the test must fail.
    const subscribeLink = page.locator('a[href="/subscribe"]').first()
    await expect(subscribeLink).toBeVisible({ timeout: 10_000 })
  })

  // ── Error page guard ───────────────────────────────────────────────────────

  test('page does not show the global error page', async ({ page }) => {
    // domcontentloaded is sufficient; networkidle never fires on this app
    // because background API polling keeps open connections indefinitely.
    await page.waitForLoadState('domcontentloaded')

    const body = await page.locator('body').textContent()

    // "Something went wrong" is unique to global-error.tsx — its presence
    // means the real page crashed and the fallback error screen is showing.
    expect(body).not.toContain('Something went wrong')

    // The error page renders only an h2, not an h1; a visible h1 confirms
    // that the actual homepage shell rendered correctly.
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })

  // ── Verdict banner (data-dependent, does not fail if API is slow) ──────────

  test('verdict banner or hero section shows construction-related content', async ({ page }) => {
    // Wait for initial render + client-side hydration; skip networkidle
    // because background polling keeps the connection count above zero.
    await page.waitForTimeout(3_000)

    const body = await page.locator('body').textContent()

    // The hero section renders a spending KPI and CTAs regardless of
    // whether /api/verdict has responded. Check for content that is
    // structurally present in the hero and absent from the error page.
    const hasHeroContent =
      body!.includes('Open Dashboard') ||
      body!.includes('Construction')   ||
      body!.includes('Forecast')       ||
      body!.includes('EXPAND')         ||
      body!.includes('HOLD')           ||
      body!.includes('CONTRACT')

    expect(hasHeroContent).toBe(true)
  })
})
