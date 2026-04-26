import { test, expect } from '@playwright/test'

/**
 * Removed developer pages — tombstone tests.
 *
 * /api-access (API key registration) and /docs/api (API reference) were public
 * pages removed when the developer program was paused and replaced by the Trust
 * Center.  These tests assert that both URLs are gone from the product surface
 * and that no navigation element still links to them.
 */

test.describe('Removed developer pages return 404', () => {
  test('/api-access returns 404', async ({ page }) => {
    const response = await page.goto('/api-access')
    expect(response?.status()).toBe(404)
  })

  test('/docs/api returns 404', async ({ page }) => {
    const response = await page.goto('/docs/api')
    expect(response?.status()).toBe(404)
  })
})

test.describe('No navigation links to removed developer pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('homepage has no link to /api-access', async ({ page }) => {
    const links = page.locator('a[href="/api-access"]')
    await expect(links).toHaveCount(0)
  })

  test('homepage has no link to /docs/api', async ({ page }) => {
    const links = page.locator('a[href="/docs/api"]')
    await expect(links).toHaveCount(0)
  })

  test('homepage nav has no "API Access" anchor', async ({ page }) => {
    const navLinks = page.locator('nav a[href="/api-access"]')
    await expect(navLinks).toHaveCount(0)
  })

  test('homepage nav has no "API" anchor pointing to /docs/api', async ({ page }) => {
    const navLinks = page.locator('nav a[href="/docs/api"]')
    await expect(navLinks).toHaveCount(0)
  })
})
