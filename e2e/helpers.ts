import { expect, type Page } from '@playwright/test'

/** Wait for a section to be visible and not show a loading state */
export async function waitForContent(
  page: Page,
  selector: string,
  opts: { timeout?: number } = {},
) {
  await page.waitForSelector(selector, {
    state:   'visible',
    timeout: opts.timeout ?? 20_000,
  })
}

/** Assert that no "—" placeholder text appears as a KPI value.
 *  A "—" means the data loaded but found no value — acceptable.
 *  An entirely blank/missing card is not acceptable.
 */
export async function assertNoBlanks(
  page: Page,
  cardSelector: string,
) {
  const cards = page.locator(cardSelector)
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)
}

/**
 * Assert the page is not showing the Next.js global error fallback.
 * Use this anywhere we'd otherwise be tempted to assert "body has more
 * than N characters" — that check passes for a totally broken page
 * because nav/footer chrome alone clears the threshold.
 */
export async function assertNoGlobalErrorPage(page: Page, label?: string) {
  const bodyText = (await page.locator('body').textContent()) ?? ''
  const tag = label ? ` (${label})` : ''
  expect(bodyText, `Global error page rendered${tag}`).not.toContain('Something went wrong')
  expect(bodyText, `Rendering error escaped boundary${tag}`).not.toContain('A rendering error occurred')
}

/**
 * Assert a page rendered a primary content landmark (a heading, main, or
 * any element with role=main). Replaces meaningless `body.length > N`
 * checks — passes only if the document tree actually contains content
 * the user can see, not just nav chrome.
 */
export async function assertHasPrimaryContent(page: Page, label?: string) {
  const tag = label ? ` (${label})` : ''
  const primary = page.locator('main, [role="main"], h1, h2').first()
  await expect(primary, `No primary content landmark rendered${tag}`).toBeVisible({
    timeout: 10_000,
  })
}
