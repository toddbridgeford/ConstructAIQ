import { test, expect } from '@playwright/test'
import { assertNoGlobalErrorPage } from './helpers'

/**
 * /status — Platform Health page.
 *
 * Tests verify page structure and degraded states without requiring
 * real production data.  All assertions pass whether or not Supabase
 * or external APIs are reachable.
 */
test.describe('/status — Platform Health', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/status')
    await page.waitForLoadState('domcontentloaded')
  })

  // ── Error guard ────────────────────────────────────────────────────────────

  test('page does not show the global error page', async ({ page }) => {
    await assertNoGlobalErrorPage(page, '/status')
  })

  // ── Title and heading ──────────────────────────────────────────────────────

  test('h1 says "Platform Health"', async ({ page }) => {
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible({ timeout: 10_000 })
    await expect(h1).toContainText('Platform Health')
  })

  // ── Section headings ───────────────────────────────────────────────────────

  test('"Source Health" section heading is present', async ({ page }) => {
    // The Source Health section renders after the /api/status fetch resolves.
    // It always renders — even when source_health is empty the heading appears.
    await page.waitForTimeout(4_000)
    await expect(page.getByText('Source Health')).toBeVisible({ timeout: 15_000 })
  })

  test('"Environment Readiness" section heading is present', async ({ page }) => {
    await page.waitForTimeout(4_000)
    await expect(page.getByText('Environment Readiness')).toBeVisible({ timeout: 15_000 })
  })

  // ── KPI row ────────────────────────────────────────────────────────────────

  test('KPI row is visible', async ({ page }) => {
    // The KPI row renders immediately (skeletons while loading).
    // "Overall PAR" is always present as the first KPI label.
    await expect(page.getByText('Overall PAR')).toBeVisible({ timeout: 10_000 })
  })

  // ── Degraded / empty state ─────────────────────────────────────────────────

  test('page stays intact after 5 seconds with no production data', async ({ page }) => {
    // After 5s the page must not be stuck in infinite shimmer or crashed.
    await page.waitForTimeout(5_000)
    await assertNoGlobalErrorPage(page, '/status after 5s')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })

  // ── Trust Center link ──────────────────────────────────────────────────────

  test('page has a link to the Trust Center', async ({ page }) => {
    // The status page footer links to /trust.
    const trustLink = page.locator('a[href="/trust"]').first()
    await expect(trustLink).toBeAttached()
  })

  test('page has a link to the Methodology page', async ({ page }) => {
    const methodLink = page.locator('a[href="/methodology"]').first()
    await expect(methodLink).toBeAttached()
  })
})
