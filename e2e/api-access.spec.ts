import { test, expect } from '@playwright/test'

const TEST_EMAIL = 'e2e-smoke@constructaiq.trade'

test.describe('/api-access — key portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api-access')
    await page.waitForLoadState('domcontentloaded')
  })

  test('page loads with three tabs', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /overview/i })
    ).toBeVisible({ timeout: 10_000 })

    await expect(
      page.getByRole('button', { name: /api reference/i })
    ).toBeVisible({ timeout: 10_000 })

    await expect(
      page.getByRole('button', { name: /my keys/i })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('My Keys tab is clickable', async ({ page }) => {
    const myKeysTab = page.getByRole('button', { name: /my keys/i })
    await myKeysTab.click()
    await page.waitForTimeout(500)

    const bodyText = await page.locator('body').textContent()
    // After clicking My Keys, key management content should appear —
    // either the registration form or a previously issued key
    const hasKeyContent =
      bodyText!.includes('email')      ||
      bodyText!.includes('Email')      ||
      bodyText!.includes('caiq_')      ||
      bodyText!.includes('API key')    ||
      bodyText!.includes('register')
    expect(hasKeyContent).toBe(true)
  })

  test('key registration form submits and displays key', async ({ page }) => {
    // Navigate to My Keys tab
    await page.getByRole('button', { name: /my keys/i }).click()
    await page.waitForTimeout(1_000)

    // Look for the email input — the form uses <input type="email">
    const emailInput = page
      .locator('input[type="email"]')
      .or(page.locator('input[placeholder*="email" i]'))
      .or(page.getByRole('textbox', { name: /email/i }))
      .first()

    const inputVisible = await emailInput.isVisible().catch(() => false)

    if (!inputVisible) {
      // Key may already exist from a prior run — check for it
      const body = await page.locator('body').textContent()
      if (body!.includes('caiq_')) {
        expect(body).toContain('caiq_')
        return
      }
      throw new Error(
        'Neither the registration form nor an existing key ' +
        'was found on the My Keys tab. ' +
        'Body content: ' + body!.slice(0, 200)
      )
    }

    // Fill the test email and submit
    await emailInput.fill(TEST_EMAIL)

    // Submit button renders as "Get My Free API Key →"
    const submitBtn = page
      .getByRole('button', { name: /get.*key|generate|register|submit/i })
      .first()
    await submitBtn.click()

    // /api/keys/issue hits Supabase — allow up to 15s
    await page.waitForTimeout(2_000)
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    const bodyAfter = await page.locator('body').textContent()
    expect(bodyAfter).toContain('caiq_')
  })

  test('API Reference tab shows endpoint list', async ({ page }) => {
    const refTab = page.getByRole('button', { name: /api reference/i })
    await refTab.click()
    await page.waitForTimeout(500)

    const bodyText = await page.locator('body').textContent()
    // Reference tab renders endpoints — at least one path must appear
    const hasEndpoints =
      bodyText!.includes('/api/forecast') ||
      bodyText!.includes('/api/verdict')  ||
      bodyText!.includes('/api/permits')
    expect(hasEndpoints).toBe(true)
  })
})
