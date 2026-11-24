import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const LOCAL_URL = `http://127.0.0.1:${PORT}/`;

// Set BASE_URL to test a deployed copy instead of the local server, e.g.
//   BASE_URL=https://nidhiii128.github.io/fynd_hacks_task/ npx playwright test
// The trailing slash matters: the site may live in a sub-folder, and tests
// open "./" relative to it.
const remote = process.env.BASE_URL;
const BASE_URL = remote ? remote.replace(/\/?$/, '/') : LOCAL_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // No retries: a flaky test should fail loudly, not pass on the second try.
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  // Only start the local server when testing locally.
  webServer: remote
    ? undefined
    : {
        command: `node scripts/serve.js ${PORT}`,
        url: LOCAL_URL,
        reuseExistingServer: !process.env.CI,
      },
});
