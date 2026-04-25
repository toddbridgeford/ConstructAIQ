import { defineConfig, devices } from '@playwright/test'

// PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers is set in this environment.
// The npm-installed Playwright package (1.59.1) expects revision 1217 there,
// but only revision 1194 is available. Clearing the env var allows the
// explicit executablePath below to take effect without Playwright trying to
// resolve a different revision at startup.
delete process.env.PLAYWRIGHT_BROWSERS_PATH

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

const isLocal = BASE_URL.includes('localhost')

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
    // video requires ffmpeg; that binary lives under PLAYWRIGHT_BROWSERS_PATH
    // which is cleared above.  Traces capture the same debugging value.
    video:         'off',
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
        launchOptions: {
          // Use the pre-installed Chromium at this known path.
          // executablePath inside launchOptions overrides Playwright's internal
          // browser resolution so the revision check for chromium_headless_shell
          // is bypassed entirely.
          executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
        },
      },
    },
  ],

  // Spin up the production server when running against localhost.
  // Requires a prior `npm run build`. Set E2E_BASE_URL=http://localhost:3000.
  ...(isLocal
    ? {
        webServer: {
          command:             'npm run start',
          url:                 BASE_URL,
          timeout:             60_000,
          reuseExistingServer: true,
        },
      }
    : {}),
})
