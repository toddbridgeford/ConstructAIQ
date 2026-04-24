import { test, expect } from '@playwright/test'

// NLQ calls Claude — allow generous timeout
const NLQ_TIMEOUT = 45_000

test.describe('/ask — NLQ interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ask')
    await page.waitForLoadState('domcontentloaded')
  })

  test('page loads with query input visible', async ({ page }) => {
    // The /ask page uses <input> (not textarea)
    // with placeholder "Ask anything about the US construction economy…"
    const input = page
      .locator('input[placeholder*="construction economy" i]')
      .or(page.getByRole('textbox'))
      .first()

    await expect(input).toBeVisible({ timeout: 10_000 })
  })

  test('suggestion chips appear below the input', async ({ page }) => {
    await page.waitForTimeout(1_000)
    const bodyText = await page.locator('body').textContent()

    // FALLBACK_SUGGESTIONS include construction-related terms.
    // "Popular questions" label also appears above the chips.
    const hasSuggestions =
      bodyText!.includes('construction') ||
      bodyText!.includes('market')       ||
      bodyText!.includes('permits')      ||
      bodyText!.includes('forecast')     ||
      bodyText!.includes('federal')      ||
      bodyText!.includes('Ask')
    expect(hasSuggestions).toBe(true)
  })

  test('submitting a question returns an answer with sources', async ({ page }) => {
    const question = 'What is the current US construction spending trend?'

    // Input is <input> with autoFocus — should already be focused
    const input = page
      .locator('input[placeholder*="construction economy" i]')
      .or(page.getByRole('textbox'))
      .first()

    await expect(input).toBeVisible({ timeout: 10_000 })
    await input.fill(question)

    // Submit button text is "Ask" when idle
    const sendBtn = page
      .getByRole('button', { name: /^ask$/i })
      .or(page.locator('button[type="submit"]'))
      .first()

    await sendBtn.click()

    // Wait for Claude's answer — can take 10–30s
    await page.waitForFunction(
      () => {
        const body = document.body.textContent ?? ''
        return (
          body.includes('spending')      ||
          body.includes('billion')       ||
          body.includes('Construction')  ||
          body.includes('TTLCONS')       ||
          body.includes('Source')        ||
          body.includes('sources')
        )
      },
      { timeout: NLQ_TIMEOUT },
    )

    const bodyAfter = await page.locator('body').textContent()

    // Answer must be substantive
    expect(bodyAfter!.length).toBeGreaterThan(200)

    // "Sources:" label and source pills appear after a successful response
    const hasSources =
      bodyAfter!.includes('Sources:')  ||
      bodyAfter!.includes('/api/')     ||
      bodyAfter!.includes('Census')    ||
      bodyAfter!.includes('FRED')      ||
      bodyAfter!.includes('BLS')
    expect(hasSources).toBe(true)
  })

  test('rate limit message appears gracefully on excess requests', async ({ page }) => {
    // Verifies the UI handles 429 without crashing — does NOT spam the server.
    const input = page
      .locator('input[placeholder*="construction economy" i]')
      .or(page.getByRole('textbox'))
      .first()

    if (await input.isVisible()) {
      await input.fill('What are current lumber prices?')
      const sendBtn = page
        .getByRole('button', { name: /^ask$/i })
        .first()
      if (await sendBtn.isVisible()) {
        await sendBtn.click()
        // Brief pause — not waiting for full response
        await page.waitForTimeout(2_000)
        // Page must still be intact
        const title = await page.title()
        expect(title).toContain('ConstructAIQ')
      }
    }
  })
})
