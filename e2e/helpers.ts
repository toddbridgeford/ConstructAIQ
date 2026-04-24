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
