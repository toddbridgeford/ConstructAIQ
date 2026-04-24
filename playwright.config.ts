import { defineConfig, devices } from '@playwright/test'

/**
 * ConstructAIQ Playwright E2E config.
 *
 * Tests run against the live production URL by default.
 * Set E2E_BASE_URL to override for local dev or staging.
 *
 * SITE_LOCKED must be false in the target environment.
 */
const BASE_URL =
  process.env.E2E_BASE_URL ?? 'https://constructaiq.trade'

export default defineConfig({
  testDir:     './e2e',
  timeout:     60_000,        // 60s per test (API calls can be slow)
  retries:     process.env.CI ? 2 : 0,
  workers:     1,             // serial — avoid hammering the live API
  reporter:    process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : 'list',

  use: {
    baseURL:       BASE_URL,
    headless:      true,
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    trace:         'retain-on-failure',
    actionTimeout: 30_000,
    // Allow slow API responses
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name:  'chromium',
      use:   {
        ...devices['Desktop Chrome'],
        // Use the pre-installed Chromium headless shell in this environment
        ...(process.env.PLAYWRIGHT_BROWSERS_PATH
          ? {}
          : { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }),
      },
    },
  ],

  // Optional: spin up local dev server if E2E_BASE_URL is localhost
  ...(process.env.E2E_BASE_URL?.includes('localhost')
    ? {
        webServer: {
          command: 'npm run dev',
          url:     process.env.E2E_BASE_URL,
          timeout: 120_000,
          reuseExistingServer: true,
        },
      }
    : {}),
})
