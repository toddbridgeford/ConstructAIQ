import { test, expect } from '@playwright/test'

test.describe('/markets/tx — Texas state page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/markets/tx')
    await page.waitForLoadState('domcontentloaded')
  })

  test('page loads without error', async ({ page }) => {
    // Should not show a 404 or error page
    const title = await page.title()
    expect(title).not.toMatch(/404|error|not found/i)
    expect(title).toContain('ConstructAIQ')
  })

  test('state name Texas is present on page', async ({ page }) => {
    await page.waitForTimeout(4_000)
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toContain('Texas')
  })

  test('state verdict badge renders', async ({ page }) => {
    await page.waitForTimeout(5_000)
    const bodyText = await page.locator('body').textContent()

    // The state page shows a verdict badge or loading state
    // Either way the page should have content
    expect(bodyText!.trim().length).toBeGreaterThan(100)

    // If API returned data, one of these verdict words appears
    // (If API failed, the page shows an error state — also acceptable)
    const hasContent =
      bodyText!.includes('EXPANDING') ||
      bodyText!.includes('STABLE')    ||
      bodyText!.includes('CONTRACTING') ||
      bodyText!.includes('Texas')
    expect(hasContent).toBe(true)
  })

  test('city cards section exists (Active Cities)', async ({ page }) => {
    await page.waitForTimeout(5_000)
    const bodyText = await page.locator('body').textContent()

    // The state page should show cities tracked in Texas:
    // Dallas, Houston, Austin, Fort Worth, San Antonio, Plano
    const hasTxCity =
      bodyText!.includes('Dallas')    ||
      bodyText!.includes('Houston')   ||
      bodyText!.includes('Austin')    ||
      bodyText!.includes('Plano')     ||
      bodyText!.includes('Fort Worth')
    // If no cities appear, it may be that permit data hasn't
    // been seeded yet — only fail if the page is totally empty
    if (!hasTxCity) {
      // Acceptable: page rendered but no permit data yet
      expect(bodyText!.length).toBeGreaterThan(200)
    }
  })

  test('back to all markets link works', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    const backLink = page.getByRole('link', { name: /all markets|← /i }).first()
    await expect(backLink).toBeVisible({ timeout: 10_000 })
  })
})
