import { test, expect } from '@playwright/test'
import { assertNoGlobalErrorPage } from './helpers'

test.describe('Trust Center (/trust)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trust')
    await page.waitForLoadState('domcontentloaded')
  })

  test('page loads without error', async ({ page }) => {
    await assertNoGlobalErrorPage(page, '/trust')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible({ timeout: 10_000 })
  })

  test('h1 contains "Trust Center"', async ({ page }) => {
    const h1 = page.locator('h1').first()
    await expect(h1).toContainText('Trust Center', { timeout: 10_000 })
  })

  test('page contains "Data Sources" section heading', async ({ page }) => {
    const heading = page.locator('h2', { hasText: 'Data Sources' }).first()
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test('page contains "Forecast Methodology" section heading', async ({ page }) => {
    const heading = page.locator('h2', { hasText: 'Forecast Methodology' }).first()
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test('page contains "AI Analyst Guardrails" section heading', async ({ page }) => {
    const heading = page.locator('h2', { hasText: 'AI Analyst Guardrails' }).first()
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test('anchor nav links are present', async ({ page }) => {
    await expect(page.locator('a[href="#data-sources"]').first()).toBeAttached()
    await expect(page.locator('a[href="#forecast-methodology"]').first()).toBeAttached()
    await expect(page.locator('a[href="#ai-guardrails"]').first()).toBeAttached()
  })
})

test.describe('Navigation does not expose removed API pages', () => {
  test('homepage nav has no "API Access" link', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // No anchor should reference /api-access anywhere in the nav
    const apiAccessLinks = page.locator('nav a[href="/api-access"]')
    await expect(apiAccessLinks).toHaveCount(0)
  })

  test('homepage body contains no visible "API Access" nav item', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Confirm there is no anchor anywhere on the page pointing to /api-access
    const staleLinks = page.locator('a[href="/api-access"]')
    await expect(staleLinks).toHaveCount(0)
  })

  test('/api-access returns 404', async ({ page }) => {
    const response = await page.goto('/api-access')
    expect(response?.status()).toBe(404)
  })
})
