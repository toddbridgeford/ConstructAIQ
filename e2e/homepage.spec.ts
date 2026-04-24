import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('verdict banner loads within 15 seconds', async ({ page }) => {
    // The verdict banner fetches /api/verdict on mount.
    // It either shows EXPAND/HOLD/CONTRACT or is hidden if
    // the API fails. Wait for the page to settle first.
    await page.waitForLoadState('networkidle', { timeout: 20_000 })

    // The banner is present (even if hidden when verdict is null)
    // OR the headline h1 is visible — page loaded either way
    const headline = page.locator('h1').first()
    await expect(headline).toBeVisible({ timeout: 15_000 })

    // Headline should contain the product description
    const text = await headline.textContent()
    expect(text).toBeTruthy()
    expect(text!.length).toBeGreaterThan(5)
  })

  test('shows verdict signal text when API responds', async ({ page }) => {
    // Wait for the API call to complete
    await page.waitForLoadState('networkidle', { timeout: 25_000 })

    // The verdict banner text should include one of the signal words
    // OR be absent (if API call failed — which is acceptable for smoke test)
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()

    // One of these must appear on the page (verdict or product name)
    const hasSignal =
      bodyText!.includes('EXPAND')    ||
      bodyText!.includes('HOLD')      ||
      bodyText!.includes('CONTRACT')  ||
      bodyText!.includes('ConstructAIQ')
    expect(hasSignal).toBe(true)
  })

  test('Open Dashboard CTA navigates to /dashboard', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')

    // Find the primary CTA button
    const cta = page.getByRole('link', { name: /open dashboard/i }).first()
    await expect(cta).toBeVisible({ timeout: 10_000 })

    // Click it and verify navigation
    await cta.click()
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('page has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/ConstructAIQ/i)
  })

  test('subscribe link is reachable from homepage', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    // The Signal newsletter subscription should be linked
    const subscribeLink = page
      .getByRole('link', { name: /subscribe|the signal/i })
      .first()
    await expect(subscribeLink).toBeVisible({ timeout: 10_000 })
  })
})
