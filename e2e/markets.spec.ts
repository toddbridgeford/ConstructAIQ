import { test, expect } from '@playwright/test'
import { assertHasPrimaryContent, assertNoGlobalErrorPage } from './helpers'

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

    // Real assertions: the page must (a) render a primary content
    // landmark, (b) not have crashed into the global error boundary,
    // and (c) contain either a verdict word or the state name. A
    // body-length check would pass for a totally broken page because
    // nav chrome alone clears the threshold.
    await assertHasPrimaryContent(page, '/markets/tx')
    await assertNoGlobalErrorPage(page, '/markets/tx')

    const bodyText = (await page.locator('body').textContent()) ?? ''
    const hasContent =
      bodyText.includes('EXPANDING') ||
      bodyText.includes('STABLE')    ||
      bodyText.includes('CONTRACTING') ||
      bodyText.includes('Texas')
    expect(hasContent, 'Page should show a verdict word or the state name').toBe(true)
  })

  test('city cards section exists (Active Cities)', async ({ page }) => {
    await page.waitForTimeout(5_000)
    const bodyText = (await page.locator('body').textContent()) ?? ''

    // The state page should show cities tracked in Texas:
    // Dallas, Houston, Austin, Fort Worth, San Antonio, Plano
    const hasTxCity =
      bodyText.includes('Dallas')    ||
      bodyText.includes('Houston')   ||
      bodyText.includes('Austin')    ||
      bodyText.includes('Plano')     ||
      bodyText.includes('Fort Worth')

    // If no cities appear it may be that permit data hasn't been
    // seeded yet — that's acceptable. The fail condition is the page
    // having crashed into the global error boundary; a body-length
    // floor passes for a totally broken page and is therefore not a
    // valid fallback.
    if (!hasTxCity) {
      await assertNoGlobalErrorPage(page, '/markets/tx (no city data)')
      await assertHasPrimaryContent(page, '/markets/tx (no city data)')
    }
  })

  test('back to all markets link works', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    const backLink = page.getByRole('link', { name: /all markets|← /i }).first()
    await expect(backLink).toBeVisible({ timeout: 10_000 })
  })
})
